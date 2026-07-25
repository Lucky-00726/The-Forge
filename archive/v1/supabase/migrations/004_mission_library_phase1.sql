-- ═══════════════════════════════════════════════════════════
-- THE FORGE — Mission Library Phase 1: Database Schema
-- Migration: 004_mission_library_phase1
-- Purpose: Add featured/training mission distinction with 50% XP
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- Step 1: Add is_featured column to mission_completions
-- This tracks whether a mission was completed as featured (100% XP)
-- or training (50% XP) at completion time.
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.mission_completions
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mission_completions.is_featured IS
  'TRUE = completed as Featured Mission (100% XP), FALSE = Training Mission (50% XP)';


-- ───────────────────────────────────────────────────────────
-- Step 2: Drop the unique constraint on (user_id, completed_date)
-- Users can now complete multiple missions per day (1 featured + 4 training)
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.mission_completions
DROP CONSTRAINT IF EXISTS uq_user_date;

COMMENT ON TABLE public.mission_completions IS
  'Append-only. Users can complete multiple missions per day (1 featured + up to 4 training).';


-- ───────────────────────────────────────────────────────────
-- Step 3: Add unique constraint for mission_id per day
-- Prevents completing the same mission twice in one day
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.mission_completions
ADD CONSTRAINT uq_user_mission_date 
  UNIQUE (user_id, mission_id, completed_date);

COMMENT ON CONSTRAINT uq_user_mission_date ON public.mission_completions IS
  'Prevents completing the same mission multiple times on the same day.';


-- ───────────────────────────────────────────────────────────
-- Step 4: Update complete_mission RPC to support featured flag
-- Now accepts p_is_featured parameter and calculates XP accordingly:
-- - Featured: 100% of base XP
-- - Training: 50% of base XP (rounded down)
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_mission(
  p_user_id     uuid,
  p_mission_id  text,
  p_responses   jsonb,
  p_xp          integer,
  p_is_featured boolean DEFAULT false
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
BEGIN
  -- ── Fetch current user state ──────────────────────────────
  SELECT last_active_date, current_streak
  INTO   v_last_active, v_old_streak
  FROM   public.users
  WHERE  id = p_user_id
  FOR UPDATE;  -- Row lock prevents concurrent race conditions

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- ── Calculate XP based on featured status ─────────────────
  -- Featured Mission: 100% of p_xp
  -- Training Mission: 50% of p_xp (rounded down)
  IF p_is_featured THEN
    v_awarded_xp := p_xp;
  ELSE
    v_awarded_xp := FLOOR(p_xp * 0.5);
  END IF;

  -- ── Calculate new streak ──────────────────────────────────
  -- Streak only increments if we haven't completed ANY mission today yet
  -- (If v_last_active < v_today, this is the first mission today)
  v_new_streak :=
    CASE
      -- Already completed at least one mission today → keep streak
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
  -- Will throw unique_violation (23505) if this exact mission
  -- was already completed today by this user.
  INSERT INTO public.mission_completions (
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
    p_is_featured
  );

  -- ── UPDATE user (XP + streak + rank) ─────────────────────
  UPDATE public.users
  SET
    total_xp         = total_xp + v_awarded_xp,
    current_streak   = v_new_streak,
    last_active_date = v_today,
    current_rank     = CASE
      WHEN total_xp + v_awarded_xp >= 1200 THEN 'Commander'
      WHEN total_xp + v_awarded_xp >= 400  THEN 'Officer'
      ELSE 'Cadet'
    END
  WHERE id = p_user_id
  RETURNING total_xp, current_rank
  INTO v_new_xp, v_new_rank;

  -- ── Return result to client ───────────────────────────────
  RETURN jsonb_build_object(
    'xp_awarded',   v_awarded_xp,
    'new_total_xp', v_new_xp,
    'new_streak',   v_new_streak,
    'new_rank',     v_new_rank,
    'is_featured',  p_is_featured
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Already completed this specific mission today
    -- Return current state without error
    SELECT
      jsonb_build_object(
        'xp_awarded',        0,
        'new_total_xp',      total_xp,
        'new_streak',        current_streak,
        'new_rank',          current_rank,
        'already_completed', true
      )
    INTO v_new_xp
    FROM public.users
    WHERE id = p_user_id;

    RETURN v_new_xp::jsonb;
END;
$$;

COMMENT ON FUNCTION public.complete_mission IS
  'Atomic mission completion. Supports featured (100% XP) vs training (50% XP) distinction. Prevents duplicate completions per mission per day.';


-- ───────────────────────────────────────────────────────────
-- Step 5: Add index for new query patterns
-- We'll frequently query: "How many missions did user complete today?"
-- and "Has user completed featured mission today?"
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_completions_user_date_featured
  ON public.mission_completions (user_id, completed_date, is_featured);

COMMENT ON INDEX idx_completions_user_date_featured IS
  'Optimizes queries for: today''s completions, featured mission check';


-- ───────────────────────────────────────────────────────────
-- Step 6: Add helper function to check if user completed featured today
-- Returns TRUE if user has completed a featured mission today
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_completed_featured_today(
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.mission_completions
    WHERE user_id = p_user_id
      AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
      AND is_featured = true
  );
$$;

COMMENT ON FUNCTION public.has_completed_featured_today IS
  'Returns TRUE if user has completed a featured mission today. Used for UI logic.';


-- ───────────────────────────────────────────────────────────
-- Step 7: Add helper function to get today's completion count
-- Returns number of missions completed today
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_today_completion_count(
  p_user_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.mission_completions
  WHERE user_id = p_user_id
    AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

COMMENT ON FUNCTION public.get_today_completion_count IS
  'Returns count of missions completed today (featured + training). Used for dashboard stats.';


-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════
-- Schema changes:
-- ✓ mission_completions.is_featured column added
-- ✓ Unique constraint changed from (user_id, date) to (user_id, mission_id, date)
-- ✓ complete_mission() RPC updated to accept p_is_featured and calculate XP
-- ✓ Helper functions added for featured check and completion count
-- ✓ Indexes optimized for new query patterns
--
-- Backwards compatibility:
-- ✓ p_is_featured defaults to FALSE (training mission)
-- ✓ Existing mission_completions rows will have is_featured = false
-- ✓ Old RPC calls without p_is_featured will work (default to training)
-- ═══════════════════════════════════════════════════════════
