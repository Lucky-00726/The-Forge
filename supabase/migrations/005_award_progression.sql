-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Unified Progression Engine
-- Migration: 005_award_progression
--
-- Purpose:
--   Replaces the split XP pipelines (awardXP + updateStreak for
--   sessions; embedded rank logic inside complete_mission for
--   missions) with a single server-authoritative function.
--
-- Before this migration, rank was only recalculated through
-- complete_mission(). Session completions called awardXP() which
--   updated total_xp but NEVER recalculated current_rank.
--   Result: users accumulated session XP but rank stayed stale.
--
-- This migration:
--   1. Creates award_progression() — the single write path for
--      all XP, rank, and streak updates.
--   2. Backfills current_rank for all existing users based on
--      their actual total_xp.
--   3. Refactors complete_mission() to delegate to
--      award_progression() instead of embedding its own rank logic.
--
-- IMPORTANT: The rank thresholds in the CASE expression below
-- MUST match the RANKS array in src/constants/progression.ts.
-- Both must be updated together if thresholds change.
--   Current thresholds:  Cadet=0, Officer=400, Commander=1200
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
-- STEP 1: Create award_progression()
-- Single atomic function for all progression updates.
-- ═════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.award_progression(
  p_user_id       uuid,
  p_xp_amount     integer,
  p_source        text,    -- 'session1'|'session2'|'session3'|'daily_bonus'|'mission'
  p_update_streak boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today          date    := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_last_active    date;
  v_old_streak     integer;
  v_old_xp         integer;
  v_new_streak     integer;
  v_new_xp         integer;
  v_new_rank       text;
  v_old_rank       text;
BEGIN
  -- ── Lock the row to prevent concurrent write races ─────────
  -- Using FOR UPDATE prevents two simultaneous session completions
  -- from performing a read-modify-write on the same row.
  SELECT
    total_xp,
    current_rank,
    current_streak,
    last_active_date
  INTO
    v_old_xp,
    v_old_rank,
    v_old_streak,
    v_last_active
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'award_progression: user not found: %', p_user_id;
  END IF;

  -- ── Compute new XP ─────────────────────────────────────────
  v_new_xp := v_old_xp + p_xp_amount;

  -- ── Compute new rank ───────────────────────────────────────
  -- KEEP IN SYNC WITH: src/constants/progression.ts → RANKS array
  -- Thresholds: Cadet=0, Officer=400, Commander=1200
  v_new_rank := CASE
    WHEN v_new_xp >= 1200 THEN 'Commander'
    WHEN v_new_xp >= 400  THEN 'Officer'
    ELSE                       'Cadet'
  END;

  -- ── Compute new streak (IST-day aware) ─────────────────────
  -- Mirrors the logic in auth.service.ts updateStreak():
  --   same day      → no change (already counted today)
  --   yesterday     → increment
  --   null (first)  → 1
  --   older gap     → reset to 1
  IF p_update_streak THEN
    v_new_streak := CASE
      WHEN v_last_active = v_today                          THEN v_old_streak
      WHEN v_last_active = v_today - INTERVAL '1 day'      THEN v_old_streak + 1
      WHEN v_last_active IS NULL                            THEN 1
      ELSE                                                       1
    END;
  ELSE
    v_new_streak := v_old_streak;
  END IF;

  -- ── Single atomic UPDATE ───────────────────────────────────
  -- All fields update in one statement — no partial state possible.
  UPDATE users
  SET
    total_xp         = v_new_xp,
    current_rank     = v_new_rank,
    current_streak   = v_new_streak,
    last_active_date = CASE
                         WHEN p_update_streak THEN v_today
                         ELSE                      last_active_date
                       END
  WHERE id = p_user_id;

  -- ── Return updated state to caller ─────────────────────────
  RETURN jsonb_build_object(
    'new_total_xp',  v_new_xp,
    'new_rank',      v_new_rank,
    'new_streak',    v_new_streak,
    'rank_changed',  (v_old_rank IS DISTINCT FROM v_new_rank),
    'old_rank',      v_old_rank,
    'source',        p_source
  );
END;
$$;

COMMENT ON FUNCTION public.award_progression IS
  'Unified progression engine. Single atomic write path for XP, rank, and streak.'
  ' Called by sessions, missions, and future progression events.'
  ' RANK THRESHOLDS MUST MATCH src/constants/progression.ts → RANKS array.';


-- ═════════════════════════════════════════════════════════════
-- STEP 2: Backfill stale current_rank for all existing users
--
-- Evidence: at least one user had 3585 XP showing "Officer"
-- (Commander threshold is 1200). This corrects all such users.
-- ═════════════════════════════════════════════════════════════

UPDATE public.users
SET current_rank = CASE
  WHEN total_xp >= 1200 THEN 'Commander'
  WHEN total_xp >= 400  THEN 'Officer'
  ELSE                       'Cadet'
END;


-- ═════════════════════════════════════════════════════════════
-- STEP 3: Refactor complete_mission() to delegate to
--         award_progression() instead of embedding rank logic
-- ═════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.complete_mission(uuid, text, jsonb);

CREATE OR REPLACE FUNCTION public.complete_mission(
  p_user_id     uuid,
  p_mission_id  text,
  p_responses   jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today          date    := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  v_base_xp        integer;
  v_mission_week   smallint;
  v_mission_day    smallint;
  v_featured_id    text;
  v_is_featured    boolean;
  v_awarded_xp     integer;
  v_progression    jsonb;
BEGIN
  -- ── Security: fetch XP from DB, client cannot supply it ────
  SELECT xp_reward, week_number, unlock_day
  INTO   v_base_xp, v_mission_week, v_mission_day
  FROM   missions
  WHERE  id = p_mission_id;

  IF v_base_xp IS NULL THEN
    RAISE EXCEPTION 'Mission not found: %', p_mission_id;
  END IF;

  -- ── Security: server determines featured, not client ───────
  v_featured_id := get_featured_mission_id(v_mission_week, v_mission_day);
  v_is_featured := (p_mission_id = v_featured_id);

  -- ── Security: one featured mission per day per user ────────
  IF v_is_featured = true THEN
    IF EXISTS (
      SELECT 1 FROM mission_completions
      WHERE user_id = p_user_id
        AND completed_date = v_today
        AND is_featured = true
    ) THEN
      RAISE EXCEPTION 'Featured mission already completed today.';
    END IF;
  END IF;

  -- ── XP: Featured = 100%, Training = 50% ───────────────────
  v_awarded_xp := CASE
    WHEN v_is_featured THEN v_base_xp
    ELSE                    FLOOR(v_base_xp * 0.5)
  END;

  -- ── Record completion ──────────────────────────────────────
  INSERT INTO mission_completions (
    user_id, mission_id, completed_date, xp_awarded, responses, is_featured
  ) VALUES (
    p_user_id, p_mission_id, v_today, v_awarded_xp, p_responses, v_is_featured
  );

  -- ── Delegate all progression writes to award_progression ───
  -- This is the only place rank/xp/streak logic now lives.
  v_progression := award_progression(p_user_id, v_awarded_xp, 'mission', true);

  -- ── Return same shape as before (client compatibility) ─────
  RETURN jsonb_build_object(
    'xp_awarded',    v_awarded_xp,
    'new_total_xp',  (v_progression->>'new_total_xp')::integer,
    'new_streak',    (v_progression->>'new_streak')::integer,
    'new_rank',      v_progression->>'new_rank',
    'is_featured',   v_is_featured,
    'base_xp',       v_base_xp
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Already completed this specific mission today
    RETURN jsonb_build_object(
      'xp_awarded',        0,
      'new_total_xp',      (SELECT total_xp       FROM users WHERE id = p_user_id),
      'new_streak',        (SELECT current_streak  FROM users WHERE id = p_user_id),
      'new_rank',          (SELECT current_rank    FROM users WHERE id = p_user_id),
      'already_completed', true
    );
END;
$$;

COMMENT ON FUNCTION public.complete_mission IS
  'SECURE: Server-authoritative mission completion.'
  ' Delegates all progression writes to award_progression().'
  ' Client cannot manipulate XP, rank, or streak.';
