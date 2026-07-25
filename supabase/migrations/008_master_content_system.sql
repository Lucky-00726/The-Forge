-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Master Content System columns
-- Migration: 008_master_content_system
-- Purpose: Add generic session and module query fields, drop type
--          check constraints, and update replace_question_bank RPC.
-- ─────────────────────────────────────────────────────────────

-- 1. Drop check constraint on question_type to allow future arbitrary types
ALTER TABLE public.questions 
  DROP CONSTRAINT IF EXISTS questions_question_type_check;

-- 2. Add only session and module query columns to public.questions
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS "session" text,
  ADD COLUMN IF NOT EXISTS "module" text;

-- 3. Add only session and module query columns to public.import_staging_questions
ALTER TABLE public.import_staging_questions 
  ADD COLUMN IF NOT EXISTS "session" text,
  ADD COLUMN IF NOT EXISTS "module" text;

-- 4. Update the atomic replace_question_bank function
CREATE OR REPLACE FUNCTION public.replace_question_bank(p_source_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    question_category, sequence_order, "session", "module"
  )
  SELECT 
    id, category, subcategory, difficulty, question_type, question,
    prompt, answer_data, xp_reward, time_limit, tags, source, active, status,
    question_category, sequence_order, "session", "module"
  FROM public.import_staging_questions
  WHERE source_name = p_source_name AND import_status = 'pending';

  -- Update staging status to imported
  UPDATE public.import_staging_questions
  SET import_status = 'imported'
  WHERE source_name = p_source_name AND import_status = 'pending';
END;
$$;
