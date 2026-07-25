-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Content Migration Schema
-- Migration: 003_content_migration
-- Purpose: Replace the weak question bank with a CSV-driven
--          import pipeline plus daily session generation.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Backup existing question rows before replacing the table.
DO $$
BEGIN
  IF to_regclass('public.questions') IS NOT NULL THEN
    ALTER TABLE IF EXISTS public.questions RENAME TO questions_backup;
  END IF;
END $$;

-- ═════════════════════════════════════════════════════════════
-- TABLE: questions
-- Unified content bank for all imported question types.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.questions (
  id                text PRIMARY KEY,
  category          text NOT NULL,
  subcategory       text,
  difficulty        text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question_type     text NOT NULL CHECK (question_type IN (
                      'MCQ','SingleWord','Numeric','RapidResponse','TrueFalse','SRT','WAT','Interview'
                    )),
  question          text NOT NULL,
  prompt            text,
  answer_data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp_reward         smallint NOT NULL DEFAULT 10 CHECK (xp_reward > 0),
  time_limit        smallint,
  tags              text[] NOT NULL DEFAULT '{}'::text[],
  source            text,
  active            boolean NOT NULL DEFAULT true,
  status            text NOT NULL DEFAULT 'approved',
  question_category text NOT NULL CHECK (question_category IN (
                      'OIR','SRT','WAT','TAT','Interview','Lecturette','GroupDiscussion','SelfDescription'
                    )),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.questions IS
  'Primary question bank used by the app. Imported from CSV/Google Sheets and served dynamically.';

-- ═════════════════════════════════════════════════════════════
-- TABLE: import_staging_questions
-- Temporary staging table used by the import wizard.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.import_staging_questions (
  id                text PRIMARY KEY,
  source_name       text NOT NULL,
  category          text NOT NULL,
  subcategory       text,
  difficulty        text NOT NULL,
  question_type     text NOT NULL,
  question          text NOT NULL,
  prompt            text,
  answer_data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  xp_reward         smallint NOT NULL DEFAULT 10,
  time_limit        smallint,
  tags              text[] NOT NULL DEFAULT '{}'::text[],
  source            text,
  active            boolean NOT NULL DEFAULT true,
  status            text NOT NULL DEFAULT 'approved',
  question_category text NOT NULL,
  import_status     text NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ═════════════════════════════════════════════════════════════
-- TABLE: user_content_progress
-- Tracks sequential progression pointers for daily content.
-- ═════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_content_progress (
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_key   text NOT NULL CHECK (session_key IN ('session1','session2','session3')),
  scope         text NOT NULL,
  position      integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, session_key, scope)
);

-- ═════════════════════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_questions_type_active
  ON public.questions (question_type, active, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_category
  ON public.questions (question_category, active, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_tags
  ON public.questions USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_questions_search
  ON public.questions USING gin (to_tsvector('english', COALESCE(question, '') || ' ' || COALESCE(prompt, '')));
CREATE INDEX IF NOT EXISTS idx_import_staging_source
  ON public.import_staging_questions (source_name, import_status);

-- ═════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════════════════════════
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_staging_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "questions_authenticated_read"
  ON public.questions FOR SELECT USING (auth.role() = 'authenticated' AND active = true AND status = 'approved');
CREATE POLICY IF NOT EXISTS "questions_authenticated_write"
  ON public.questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "questions_authenticated_update"
  ON public.questions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "staging_authenticated_write"
  ON public.import_staging_questions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "content_progress_own_user"
  ON public.user_content_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═════════════════════════════════════════════════════════════
CREATE TRIGGER questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ═════════════════════════════════════════════════════════════
-- COMPATIBILITY FUNCTIONS
-- ═════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_session_questions(
  p_question_types text[],
  p_count integer,
  p_difficulty text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_exclude_ids text[] DEFAULT '{}'
)
RETURNS SETOF public.questions
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.questions
  WHERE active = true
    AND status = 'approved'
    AND question_type = ANY(p_question_types)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty)
    AND (p_category IS NULL OR category = p_category)
    AND NOT (id = ANY(p_exclude_ids))
  ORDER BY random()
  LIMIT p_count;
$$;

CREATE OR REPLACE FUNCTION public.get_mixed_session_questions(
  p_type_counts jsonb,
  p_difficulty text DEFAULT NULL,
  p_exclude_ids text[] DEFAULT '{}'
)
RETURNS SETOF public.questions
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_type text;
  v_count integer;
BEGIN
  FOR v_type, v_count IN
    SELECT key, value::integer FROM jsonb_each_text(p_type_counts)
  LOOP
    RETURN QUERY
    SELECT *
    FROM public.questions
    WHERE active = true
      AND status = 'approved'
      AND question_type = v_type
      AND (p_difficulty IS NULL OR difficulty = p_difficulty)
      AND NOT (id = ANY(p_exclude_ids))
    ORDER BY random()
    LIMIT v_count;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_questions_by_ids(p_ids text[])
RETURNS SETOF public.questions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.questions
  WHERE id = ANY(p_ids)
    AND active = true
  ORDER BY array_position(p_ids, id);
$$;
