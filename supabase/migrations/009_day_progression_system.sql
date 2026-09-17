-- ==========================================================
-- Migration 009: Day Progression System
-- ==========================================================

-- 1. Add day column to questions and staging tables
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS day integer;

ALTER TABLE public.import_staging_questions 
  ADD COLUMN IF NOT EXISTS day integer;

-- 2. Add progression tracking columns to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS current_training_day integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS training_program_completed boolean NOT NULL DEFAULT false;

-- 3. Update user_daily_sessions to support training_day identity
ALTER TABLE public.user_daily_sessions 
  ADD COLUMN IF NOT EXISTS training_day integer;

-- 4. Create composite index for daily content queries
CREATE INDEX IF NOT EXISTS idx_questions_day_session_active 
  ON public.questions (day, session, active) 
  WHERE active = true AND status = 'approved';

-- 5. Shift unique constraint from date to day progression
ALTER TABLE public.user_daily_sessions 
  DROP CONSTRAINT IF EXISTS user_daily_sessions_user_id_session_date_session_number_key;

ALTER TABLE public.user_daily_sessions 
  ADD CONSTRAINT user_daily_sessions_user_id_training_day_session_number_key 
  UNIQUE (user_id, training_day, session_number);

-- 6. Update replace_question_bank RPC to copy the "day" column
CREATE OR REPLACE FUNCTION public.replace_question_bank(p_source_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Verify that the caller is an authenticated user with is_admin set to true or a service_role key call
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Atomic swap: clear and reload main question bank
  DELETE FROM public.questions WHERE id IS NOT NULL;

  INSERT INTO public.questions (
    id, category, subcategory, difficulty, question_type, question,
    prompt, answer_data, xp_reward, time_limit, tags, source, active, status,
    question_category, sequence_order, "session", "module", "day"
  )
  SELECT 
    id, category, subcategory, difficulty, question_type, question,
    prompt, answer_data, xp_reward, time_limit, tags, source, active, status,
    question_category, sequence_order, "session", "module", "day"
  FROM public.import_staging_questions
  WHERE source_name = p_source_name AND import_status = 'pending';

  -- Update staging status to imported
  UPDATE public.import_staging_questions
  SET import_status = 'imported'
  WHERE source_name = p_source_name AND import_status = 'pending';
END;
$$;

-- 7. Atomic complete_daily_session RPC function
CREATE OR REPLACE FUNCTION public.complete_daily_session(
  p_expected_day integer,
  p_session_number integer,
  p_xp_earned integer,
  p_score integer,
  p_total_questions integer,
  p_completion_time_seconds integer,
  p_difficulty text,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  completed_session boolean,
  training_day integer,
  day_advanced boolean,
  new_training_day integer,
  program_completed boolean,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_user_id uuid := COALESCE(
    CASE WHEN auth.role() = 'service_role' THEN p_user_id ELSE NULL END,
    auth.uid()
  );
  v_current_day integer;
  v_program_completed boolean;
  v_session_exists boolean;
  v_already_completed boolean;
  v_s1_complete boolean;
  v_s2_complete boolean;
  v_s3_complete boolean;
  v_advanced boolean := false;
  v_new_day integer;
BEGIN
  -- 1. Input parameter validations
  IF p_expected_day < 1 OR p_expected_day > 30 THEN
    RAISE EXCEPTION 'Invalid p_expected_day: must be between 1 and 30';
  END IF;
  
  IF p_session_number NOT IN (1, 2, 3) THEN
    RAISE EXCEPTION 'Invalid p_session_number: must be 1, 2, or 3';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request: auth.uid() is null and caller is not service_role.';
  END IF;

  -- 2. Lock the user profile row for update to serialize progression updates
  SELECT users.current_training_day, users.training_program_completed 
  INTO v_current_day, v_program_completed
  FROM public.users 
  WHERE users.id = v_user_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  -- 3. If program is already completed, return early immediately
  IF v_program_completed THEN
    RETURN QUERY SELECT false, v_current_day, false, v_current_day, true, 'program_completed';
    RETURN;
  END IF;

  -- 4. Verify the corresponding session assignment exists
  SELECT EXISTS (
    SELECT 1 FROM public.user_daily_sessions uds
    WHERE uds.user_id = v_user_id 
      AND uds.training_day = p_expected_day
      AND uds.session_number = p_session_number
  ) INTO v_session_exists;

  IF NOT v_session_exists THEN
    RAISE EXCEPTION 'Corresponding user_daily_sessions row does not exist for Day %, Session %', p_expected_day, p_session_number;
  END IF;

  -- 5. Validate that the expected day matches the user's current day (Check Day Mismatch first!)
  IF v_current_day <> p_expected_day THEN
    -- Mismatch: do NOT update the session row and do NOT advance progression.
    RETURN QUERY SELECT false, v_current_day, false, v_current_day, v_program_completed, 'day_mismatch';
    RETURN;
  END IF;

  -- 6. Check if already completed (for idempotency)
  SELECT (uds.completed_at IS NOT NULL) INTO v_already_completed
  FROM public.user_daily_sessions uds
  WHERE uds.user_id = v_user_id 
    AND uds.training_day = p_expected_day
    AND uds.session_number = p_session_number;

  IF v_already_completed THEN
    RETURN QUERY SELECT true, v_current_day, false, v_current_day, v_program_completed, 'already_completed';
    RETURN;
  END IF;

  -- 7. Perform the update
  UPDATE public.user_daily_sessions
  SET 
    completed_at = now(),
    xp_earned = p_xp_earned,
    score = p_score,
    total_questions = p_total_questions,
    completion_time_seconds = p_completion_time_seconds,
    difficulty = p_difficulty
  WHERE user_daily_sessions.user_id = v_user_id 
    AND user_daily_sessions.training_day = v_current_day 
    AND user_daily_sessions.session_number = p_session_number;

  -- 8. Check if all 3 sessions for the active training day are completed
  SELECT EXISTS (
    SELECT 1 FROM public.user_daily_sessions uds
    WHERE uds.user_id = v_user_id AND uds.training_day = v_current_day AND uds.session_number = 1 AND uds.completed_at IS NOT NULL
  ) INTO v_s1_complete;

  SELECT EXISTS (
    SELECT 1 FROM public.user_daily_sessions uds
    WHERE uds.user_id = v_user_id AND uds.training_day = v_current_day AND uds.session_number = 2 AND uds.completed_at IS NOT NULL
  ) INTO v_s2_complete;

  SELECT EXISTS (
    SELECT 1 FROM public.user_daily_sessions uds
    WHERE uds.user_id = v_user_id AND uds.training_day = v_current_day AND uds.session_number = 3 AND uds.completed_at IS NOT NULL
  ) INTO v_s3_complete;

  -- 9. Advance training day only if all sessions are complete
  v_new_day := v_current_day;
  IF v_s1_complete AND v_s2_complete AND v_s3_complete THEN
    IF v_current_day >= 30 THEN
      UPDATE public.users 
      SET training_program_completed = true 
      WHERE id = v_user_id;
      v_program_completed := true;
    ELSE
      UPDATE public.users 
      SET current_training_day = v_current_day + 1 
      WHERE id = v_user_id;
      v_new_day := v_current_day + 1;
    END IF;
    v_advanced := true;
  END IF;

  RETURN QUERY SELECT true, v_current_day, v_advanced, v_new_day, v_program_completed, 'completed';
END;
$$;

-- Revoke default public execution rights & grant exclusively to authenticated users
REVOKE EXECUTE ON FUNCTION public.complete_daily_session(integer, integer, integer, integer, integer, integer, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_daily_session(integer, integer, integer, integer, integer, integer, text, uuid) TO authenticated;
