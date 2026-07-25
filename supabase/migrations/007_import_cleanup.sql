-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Import Cleanup & Staging Swap
-- Migration: 007_import_cleanup
-- Purpose: Add sequence_order and is_admin fields, and define
--          the admin-only replacement function.
-- ─────────────────────────────────────────────────────────────

-- 1. Add sequence_order column to questions tables
ALTER TABLE public.questions 
  ADD COLUMN IF NOT EXISTS sequence_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.import_staging_questions 
  ADD COLUMN IF NOT EXISTS sequence_order integer NOT NULL DEFAULT 0;

-- 2. Add is_admin column to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 3. Define the atomic fail-safe question bank replacement RPC
CREATE OR REPLACE FUNCTION public.replace_question_bank(p_source_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the caller is an authenticated user with is_admin set to true
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Atomic swap: clear and reload main question bank
  DELETE FROM public.questions;

  INSERT INTO public.questions (
    id, category, subcategory, difficulty, question_type, question,
    prompt, answer_data, xp_reward, time_limit, tags, source, active, status,
    question_category, sequence_order
  )
  SELECT 
    id, category, subcategory, difficulty, question_type, question,
    prompt, answer_data, xp_reward, time_limit, tags, source, active, status,
    question_category, sequence_order
  FROM public.import_staging_questions
  WHERE source_name = p_source_name AND import_status = 'pending';

  -- Update staging status to imported
  UPDATE public.import_staging_questions
  SET import_status = 'imported'
  WHERE source_name = p_source_name AND import_status = 'pending';
END;
$$;
