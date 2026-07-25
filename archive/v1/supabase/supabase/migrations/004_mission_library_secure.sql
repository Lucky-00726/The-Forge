-- ═══════════════════════════════════════════════════════════
-- THE FORGE — Mission Library: SECURE Implementation
-- Migration: 004_mission_library_secure
-- ✅ Server-authoritative XP (fetched from missions table)
-- ✅ Server-authoritative featured selection (highest XP per day)
-- ✅ Client cannot manipulate XP or featured status
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- STEP 1: Schema Changes
-- ───────────────────────────────────────────────────────────

-- Add is_featured column to track which missions were completed as featured
ALTER TABLE public.mission_completions
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mission_completions.is_featured IS
  'TRUE = completed as featured mission (100% XP), FALSE = training (50% XP). Server-determined.';

-- Drop old constraint (1 mission per day)
ALTER TABLE public.mission_completions
DROP CONSTRAINT IF EXISTS uq_user_date;

-- Add new constraint (prevents same mission twice in one day)
ALTER TABLE public.mission_completions
ADD CONSTRAINT uq_user_mission_date 
  UNIQUE (user_id, mission_id, completed_date);

COMMENT ON TABLE public.mission_completions IS
  'Users can complete multiple missions per day but not the same mission twice.';

-- Add index for featured mission queries
CREATE INDEX IF NOT EXISTS idx_completions_user_date_featured
  ON public.mission_completions (user_id, completed_date, is_featured);

-- ───────────────────────────────────────────────────────────
-- STEP 2: Helper Function - Get Featured Mission for Today
-- Determines which mission should be featured (highest XP)
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_featured_mission_id(
  p_week_number smallint,
  p_unlock_day smallint
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return mission ID with highest XP for given week/day
  -- If tied, use category priority order
  SELECT id
  FROM missions
  WHERE week_number = p_week_number
    AND unlock_day = p_unlock_day
  ORDER BY 
    xp_reward DESC,
    CASE category
      WHEN 'Officer Thinking' THEN 1
      WHEN 'Leadership' THEN 2
      WHEN 'Awareness' THEN 3
      WHEN 'Confidence' THEN 4
      WHEN 'Communication' THEN 5
      ELSE 6
    END
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_featured_mission_id IS
  'Server-authoritative: Returns featured mission ID (highest XP) for given week/day.';

-- ───────────────────────────────────────────────────────────
-- STEP 3: Helper Function - Check Featured Completion
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
    FROM mission_completions
    WHERE user_id = p_user_id
      AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
      AND is_featured = true
  );
$$;

COMMENT ON FUNCTION public.has_completed_featured_today IS
  'Returns TRUE if user has completed featured mission today.';

-- ───────────────────────────────────────────────────────────
-- STEP 4: Helper Function - Get Today Completion Count
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
  FROM mission_completions
  WHERE user_id = p_user_id
    AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;
$$;

COMMENT ON FUNCTION public.get_today_completion_count IS
  'Returns count of missions completed today (featured + training).';

-- ───────────────────────────────────────────────────────────
-- STEP 5: SECURE complete_mission RPC
-- ✅ Server fetches XP from missions table (client cannot manipulate)
-- ✅ Server determines if mission is featured (client cannot lie)
-- ✅ Enforces 1 featured mission per day
-- ✅ Calculates XP: Featured = 100%, Training = 50%
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_mission(
  p_user_id     uuid,
  p_mission_id  text,
  p_responses   jsonb
  -- ✅ REMOVED: p_xp (server fetches from missions table)
  -- ✅ REMOVED: p_is_featured (server determines from mission_id)
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
  -- Client cannot manipulate XP value
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
  -- Client cannot lie about featured status
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
  FOR UPDATE;  -- Row lock prevents concurrent issues

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
  -- Calculate streak (increments on ANY mission, per user decision)
  -- ───────────────────────────────────────────────────────────
  v_new_streak :=
    CASE
      -- Already completed at least one mission today
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
  -- UPDATE user (XP + streak + rank)
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
  -- Return result to client
  -- ───────────────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'xp_awarded',    v_awarded_xp,
    'new_total_xp',  v_new_xp,
    'new_streak',    v_new_streak,
    'new_rank',      v_new_rank,
    'is_featured',   v_is_featured,
    'base_xp',       v_base_xp  -- For client transparency
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Already completed this specific mission today
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
  'SECURE: Server-authoritative XP and featured mission selection. Client cannot manipulate progression.';


-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE: Security Fixes Applied
-- ═══════════════════════════════════════════════════════════
-- Changes from original Phase 1:
-- ✅ Removed p_xp parameter (server fetches from missions.xp_reward)
-- ✅ Removed p_is_featured parameter (server determines from mission_id)
-- ✅ Added get_featured_mission_id() to determine featured mission
-- ✅ Added featured mission enforcement (1 per day)
-- ✅ XP manipulation exploit closed
-- ✅ Featured mission exploit closed
--
-- Decisions implemented:
-- ✅ Streak increments on ANY mission (not just featured)
-- ✅ No daily cap (all 5 missions available)
-- ✅ Featured mission = highest XP per week/day
-- ═══════════════════════════════════════════════════════════
