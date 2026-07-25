-- ═══════════════════════════════════════════════════════════
-- Migration 005: Fix complete_mission RPC Exception Handler
-- ═══════════════════════════════════════════════════════════
-- Bug: Exception handler was causing type coercion issues
-- Fix: Simplified SELECT INTO v_new_xp to direct RETURN
-- ═══════════════════════════════════════════════════════════

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS public.complete_mission(uuid, text, jsonb);

-- Re-create with fixed exception handler
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
  v_last_active    date;
  v_old_streak     integer;
  v_new_streak     integer;
  v_new_xp         integer;
  v_new_rank       text;
  v_awarded_xp     integer;
  v_base_xp        integer;
  v_mission_week   smallint;
  v_mission_day    smallint;
  v_featured_id    text;
  v_is_featured    boolean;
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- SECURITY FIX #1: Fetch mission XP from database
  -- ═══════════════════════════════════════════════════════════
  SELECT xp_reward, week_number, unlock_day
  INTO   v_base_xp, v_mission_week, v_mission_day
  FROM   missions
  WHERE  id = p_mission_id;
  
  IF v_base_xp IS NULL THEN
    RAISE EXCEPTION 'Mission not found: %', p_mission_id;
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- SECURITY FIX #2: Server determines featured mission
  -- ═══════════════════════════════════════════════════════════
  v_featured_id := get_featured_mission_id(v_mission_week, v_mission_day);
  v_is_featured := (p_mission_id = v_featured_id);

  -- ═══════════════════════════════════════════════════════════
  -- SECURITY FIX #3: Enforce one featured mission per day
  -- ═══════════════════════════════════════════════════════════
  IF v_is_featured = true THEN
    IF EXISTS (
      SELECT 1
      FROM mission_completions
      WHERE user_id = p_user_id
        AND completed_date = v_today
        AND is_featured = true
    ) THEN
      RAISE EXCEPTION 'Featured mission already completed today. Only one featured mission allowed per day.';
    END IF;
  END IF;

  -- ───────────────────────────────────────────────────────────
  -- Fetch current user state
  -- ───────────────────────────────────────────────────────────
  SELECT last_active_date, current_streak
  INTO   v_last_active, v_old_streak
  FROM   users
  WHERE  id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- ───────────────────────────────────────────────────────────
  -- Calculate XP: Featured = 100%, Training = 50%
  -- ───────────────────────────────────────────────────────────
  IF v_is_featured THEN
    v_awarded_xp := v_base_xp;
  ELSE
    v_awarded_xp := FLOOR(v_base_xp * 0.5);
  END IF;

  -- ───────────────────────────────────────────────────────────
  -- Calculate streak
  -- ───────────────────────────────────────────────────────────
  v_new_streak :=
    CASE
      WHEN v_last_active = v_today THEN
        v_old_streak
      WHEN v_last_active = v_today - INTERVAL '1 day' THEN
        v_old_streak + 1
      WHEN v_last_active IS NULL THEN
        1
      ELSE
        1
    END;

  -- ───────────────────────────────────────────────────────────
  -- INSERT completion record
  -- ───────────────────────────────────────────────────────────
  INSERT INTO mission_completions (
    user_id,
    mission_id,
    completed_date,
    xp_awarded,
    responses,
    is_featured
  ) VALUES (
    p_user_id,
    p_mission_id,
    v_today,
    v_awarded_xp,
    p_responses,
    v_is_featured
  );

  -- ───────────────────────────────────────────────────────────
  -- UPDATE user
  -- ───────────────────────────────────────────────────────────
  UPDATE users
  SET
    total_xp = total_xp + v_awarded_xp,
    current_streak = v_new_streak,
    last_active_date = v_today,
    current_rank = CASE
      WHEN total_xp + v_awarded_xp >= 1200 THEN 'Commander'
      WHEN total_xp + v_awarded_xp >= 400  THEN 'Officer'
      ELSE 'Cadet'
    END
  WHERE id = p_user_id
  RETURNING total_xp, current_rank
  INTO v_new_xp, v_new_rank;

  -- ───────────────────────────────────────────────────────────
  -- Return result
  -- ───────────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'xp_awarded',    v_awarded_xp,
    'new_total_xp',  v_new_xp,
    'new_streak',    v_new_streak,
    'new_rank',      v_new_rank,
    'is_featured',   v_is_featured,
    'base_xp',       v_base_xp
  );

EXCEPTION
  WHEN unique_violation THEN
    -- ✅ FIX: Simplified exception handler (no intermediate variable)
    RETURN jsonb_build_object(
      'xp_awarded',        0,
      'new_total_xp',      (SELECT total_xp FROM users WHERE id = p_user_id),
      'new_streak',        (SELECT current_streak FROM users WHERE id = p_user_id),
      'new_rank',          (SELECT current_rank FROM users WHERE id = p_user_id),
      'already_completed', true
    );
END;
$$;

COMMENT ON FUNCTION public.complete_mission IS
  'SECURE: Server-authoritative XP and featured mission selection. Fixed exception handler.';

-- ═══════════════════════════════════════════════════════════
-- Migration 005 Complete
-- ═══════════════════════════════════════════════════════════
