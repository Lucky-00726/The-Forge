-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Daily Session System
-- Migration: 006_daily_sessions
--
-- Purpose:
--   Implements structured daily session progression:
--   • Each session is assigned a fixed question set once per day
--   • Sessions must be completed in order (S1 → S2 → S3)
--   • Completed sessions remain viewable (not locked out)
--   • XP cannot be earned again on replay
--   • Abort returns to dashboard; same questions on re-entry
--
-- Amendments applied:
--   • score, total_questions, completion_time_seconds, difficulty
--     columns added for post-completion review
--   • completed does not mean inaccessible — completion state
--     controls XP award, not access
-- ─────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════
-- TABLE: user_daily_sessions
-- ═════════════════════════════════════════════════════════════

CREATE TABLE public.user_daily_sessions (
  id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_date            date        NOT NULL,   -- IST date (YYYY-MM-DD), from todayIST()
  session_number          smallint    NOT NULL CHECK (session_number IN (1, 2, 3)),
  question_ids            text[]      NOT NULL,   -- ordered IDs assigned for this session

  -- Lifecycle timestamps
  started_at              timestamptz NOT NULL DEFAULT now(),
  completed_at            timestamptz,            -- null = not yet completed

  -- Progression (written at completion)
  xp_earned               integer     NOT NULL DEFAULT 0,

  -- Review data (written at completion — enables post-session review)
  score                   smallint,               -- correct answers (null until completed)
  total_questions         smallint,               -- total questions in session
  completion_time_seconds integer,                -- seconds from start to finish
  difficulty              text,                   -- 'Easy'|'Mixed'|'Hard' summary label

  -- Future resume support (populated mid-session when implemented)
  progress                jsonb,                  -- { currentIndex, answers[], lastActiveAt }

  -- Constraints
  PRIMARY KEY (id),
  UNIQUE (user_id, session_date, session_number)
);

COMMENT ON TABLE public.user_daily_sessions IS
  'One row per user per session per IST day. Pins question assignment, '
  'tracks completion, and stores review data. Completed sessions remain '
  'viewable but do not award XP again.';

COMMENT ON COLUMN public.user_daily_sessions.question_ids IS
  'Ordered array of question IDs assigned to this user for this session today. '
  'Written once on first entry; unchanged on re-entry or after completion.';

COMMENT ON COLUMN public.user_daily_sessions.completed_at IS
  'Non-null = session completed. Completed sessions are still accessible '
  'for review. XP is awarded exactly once when this is first written.';

COMMENT ON COLUMN public.user_daily_sessions.progress IS
  'Reserved for session resume (Sprint 2). Null in Sprint 1.';


-- ── Indexes ───────────────────────────────────────────────────
-- Primary lookup: user + date (used by dashboard status check)
CREATE INDEX idx_daily_sessions_user_date
  ON public.user_daily_sessions (user_id, session_date);


-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.user_daily_sessions ENABLE ROW LEVEL SECURITY;

-- Users may read/write only their own rows
CREATE POLICY "daily_sessions_own_user"
  ON public.user_daily_sessions
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ═════════════════════════════════════════════════════════════
-- FUNCTION: get_questions_by_ids
-- Fetches full question objects for a stored question_ids array.
-- Preserves the original assignment order via array_position().
-- ═════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_questions_by_ids(
  p_ids text[]
)
RETURNS SETOF public.questions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM   public.questions
  WHERE  id = ANY(p_ids)
    AND  active = true
  ORDER BY array_position(p_ids, id);
$$;

COMMENT ON FUNCTION public.get_questions_by_ids IS
  'Returns full question rows for the given ID array in the same order as the '
  'array. Used to restore pinned session content from user_daily_sessions.';
