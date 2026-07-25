

-- ==========================================
-- MIGRATION FILE: 003_content_migration.sql
-- ==========================================

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
  IF to_regclass('public.questions') IS NOT NULL AND to_regclass('public.questions_backup') IS NULL THEN
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

DROP POLICY IF EXISTS "questions_authenticated_read" ON public.questions;
CREATE POLICY "questions_authenticated_read"
  ON public.questions FOR SELECT USING (auth.role() = 'authenticated' AND active = true AND status = 'approved');

DROP POLICY IF EXISTS "questions_authenticated_write" ON public.questions;
CREATE POLICY "questions_authenticated_write"
  ON public.questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "questions_authenticated_update" ON public.questions;
CREATE POLICY "questions_authenticated_update"
  ON public.questions FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "staging_authenticated_write" ON public.import_staging_questions;
CREATE POLICY "staging_authenticated_write"
  ON public.import_staging_questions FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "content_progress_own_user" ON public.user_content_progress;
CREATE POLICY "content_progress_own_user"
  ON public.user_content_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP FUNCTION IF EXISTS public.get_session_questions(text[], integer, text, text, text[]);
DROP FUNCTION IF EXISTS public.get_mixed_session_questions(jsonb, text, text[]);
DROP FUNCTION IF EXISTS public.get_questions_by_ids(text[]);

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


-- ==========================================
-- MIGRATION FILE: 004_analytics_events.sql
-- ==========================================

-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Analytics Events
-- Migration: 004_analytics_events
-- Purpose: Minimal, append-only persistence for the analytics events
--          already emitted by src/services/analytics.service.ts.
--          No UI/session/XP/AI/navigation changes. Admin reads only.
-- ─────────────────────────────────────────────────────────────

create table public.analytics_events (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null references public.users(id) on delete cascade,
  event      text        not null,
  metadata   jsonb,                                  -- optional, nullable
  created_at timestamptz not null default now()
);

comment on table public.analytics_events is
  'Append-only analytics event log. Written by trackEvent(); read by admins via SQL.';

-- Indexes for the report queries (per-user/time and per-event/time)
create index idx_analytics_user_created  on public.analytics_events (user_id, created_at);
create index idx_analytics_event_created on public.analytics_events (event, created_at);

-- ── Row Level Security ────────────────────────────────────────
-- Authenticated users may insert ONLY their own events.
-- No select/update/delete for clients; admins read via service role.
alter table public.analytics_events enable row level security;

create policy "analytics_self_insert" on public.analytics_events
  for insert to authenticated
  with check (auth.uid() = user_id);


-- ==========================================
-- MIGRATION FILE: 005_award_progression.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION FILE: 006_daily_sessions.sql
-- ==========================================

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

CREATE TABLE IF NOT EXISTS public.user_daily_sessions (
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
CREATE INDEX IF NOT EXISTS idx_daily_sessions_user_date
  ON public.user_daily_sessions (user_id, session_date);


-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.user_daily_sessions ENABLE ROW LEVEL SECURITY;

-- Users may read/write only their own rows
DROP POLICY IF EXISTS "daily_sessions_own_user" ON public.user_daily_sessions;
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


-- ==========================================
-- MIGRATION FILE: 007_import_cleanup.sql
-- ==========================================

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
