-- ═══════════════════════════════════════════════════════════
-- ROLLBACK SCRIPT FOR 004_mission_library_secure.sql
-- Use this to undo migration if issues occur
-- ═══════════════════════════════════════════════════════════
-- WARNING: This will restore the previous schema
-- Any mission completions with is_featured data will lose that field
-- Multiple missions completed per day will be LOST (only first kept)
-- ═══════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────
-- STEP 1: Drop New Helper Functions
-- ───────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_featured_mission_id(smallint, smallint);
DROP FUNCTION IF EXISTS public.has_completed_featured_today(uuid);
DROP FUNCTION IF EXISTS public.get_today_completion_count(uuid);

-- ───────────────────────────────────────────────────────────
-- STEP 2: Restore Original complete_mission RPC
-- (From 001_initial_schema.sql)
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_mission(
  p_user_id    uuid,
  p_mission_id text,
  p_responses  jsonb,
  p_xp         integer
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
  v_new_streak     integer;
  v_new_xp         integer;
  v_new_rank       text;
BEGIN
  -- ── Fetch current user state ──────────────────────────────
  SELECT last_active_date, current_streak
  INTO   v_last_active, v_old_streak
  FROM   public.users
  WHERE  id = p_user_id
  FOR UPDATE;                  -- row lock prevents concurrent double-completion

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- ── Calculate new streak ──────────────────────────────────
  v_new_streak :=
    CASE
      -- Already completed today (shouldn't happen — UNIQUE constraint catches it
      -- before this point, but belt-and-suspenders)
      WHEN v_last_active = v_today THEN
        v_old_streak
      -- Completed yesterday → increment
      WHEN v_last_active = v_today - INTERVAL '1 day' THEN
        v_old_streak + 1
      -- First ever mission
      WHEN v_last_active IS NULL THEN
        1
      -- Gap > 1 day → reset
      ELSE
        1
    END;

  -- ── INSERT completion ─────────────────────────────────────
  -- Will throw unique_violation (23505) if already completed today.
  -- Caller handles this as "already done" — not an error.
  INSERT INTO public.mission_completions (
    user_id,
    mission_id,
    completed_date,
    xp_awarded,
    responses
  ) VALUES (
    p_user_id,
    p_mission_id,
    v_today,
    p_xp,
    p_responses
  );

  -- ── UPDATE user (XP + streak + rank) ─────────────────────
  UPDATE public.users
  SET
    total_xp         = total_xp + p_xp,
    current_streak   = v_new_streak,
    last_active_date = v_today,
    current_rank     = CASE
      WHEN total_xp + p_xp >= 1200 THEN 'Commander'
      WHEN total_xp + p_xp >= 400  THEN 'Officer'
      ELSE 'Cadet'
    END
  WHERE id = p_user_id
  RETURNING total_xp, current_rank
  INTO v_new_xp, v_new_rank;

  -- ── Return result to client ───────────────────────────────
  RETURN jsonb_build_object(
    'xp_awarded',   p_xp,
    'new_total_xp', v_new_xp,
    'new_streak',   v_new_streak,
    'new_rank',     v_new_rank
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Already completed today — return current state, not an error
    SELECT
      jsonb_build_object(
        'xp_awarded',   0,
        'new_total_xp', total_xp,
        'new_streak',   current_streak,
        'new_rank',     current_rank,
        'already_completed', true
      )
    INTO v_new_xp
    FROM public.users
    WHERE id = p_user_id;

    RETURN v_new_xp::jsonb;
END;
$$;

COMMENT ON FUNCTION public.complete_mission IS
  'Atomic mission completion. Inserts completion row and updates user XP/streak/rank in one transaction.';

-- ───────────────────────────────────────────────────────────
-- STEP 3: Drop New Index
-- ───────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_completions_user_date_featured;

-- ───────────────────────────────────────────────────────────
-- STEP 4: Drop New Constraint (Multiple Missions Per Day)
-- WARNING: If users completed multiple missions today, keep only first
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.mission_completions
DROP CONSTRAINT IF EXISTS uq_user_mission_date;

-- ───────────────────────────────────────────────────────────
-- STEP 5: Clean Up Duplicate Completions Per Day
-- Keep only the first completion per user per day
-- WARNING: This DELETES data if multiple missions were completed
-- ───────────────────────────────────────────────────────────
DELETE FROM public.mission_completions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, completed_date)
    id
  FROM public.mission_completions
  ORDER BY user_id, completed_date, id ASC
);

-- ───────────────────────────────────────────────────────────
-- STEP 6: Restore Original Constraint (One Mission Per Day)
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.mission_completions
ADD CONSTRAINT uq_user_date UNIQUE (user_id, completed_date);

COMMENT ON TABLE public.mission_completions IS
  'Append-only. UNIQUE(user_id, completed_date) enforces one mission/day.';

-- ───────────────────────────────────────────────────────────
-- STEP 7: Drop New Column (is_featured)
-- WARNING: This DELETES all featured/training distinction data
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.mission_completions
DROP COLUMN IF EXISTS is_featured;

-- ───────────────────────────────────────────────────────────
-- STEP 8: Restore Original Index
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_completions_user_date
  ON public.mission_completions (user_id, completed_date DESC);

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- ROLLBACK COMPLETE
-- ═══════════════════════════════════════════════════════════
-- Schema restored to pre-004 state
-- 
-- WHAT WAS REVERTED:
-- ✅ Removed is_featured column
-- ✅ Removed get_featured_mission_id() function
-- ✅ Removed has_completed_featured_today() function
-- ✅ Removed get_today_completion_count() function
-- ✅ Removed new index idx_completions_user_date_featured
-- ✅ Removed uq_user_mission_date constraint
-- ✅ Restored uq_user_date constraint (1 mission/day)
-- ✅ Restored original complete_mission() RPC (accepts p_xp, p_is_featured)
-- ✅ Restored original index idx_completions_user_date
--
-- DATA LOSS:
-- ⚠️  Multiple missions per day → Only first kept
-- ⚠️  is_featured distinction → Lost
--
-- CLIENT CODE IMPACT:
-- ⚠️  New client code expecting secure RPC will break
-- ⚠️  Must redeploy old client code with xp/isFeatured parameters
-- ═══════════════════════════════════════════════════════════

SELECT '✅ ROLLBACK COMPLETE' as status;
SELECT 'Schema restored to 001_initial_schema.sql state' as message;
SELECT 'WARNING: Multiple missions per day were deleted (only first kept)' as warning;
