-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Question Bank Schema
-- Migration: 002_question_bank
-- Purpose: Replace hardcoded mock questions with scalable database
-- ─────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════
-- TABLE: questions
-- Unified question bank for all session types
-- Supports: MCQ, SingleWord, Numeric, RapidResponse, TrueFalse, SRT, WAT, Interview
-- ═════════════════════════════════════════════════════════════
create table public.questions (
  id                text        primary key,  -- e.g., 'MCQ-001', 'SRT-042', 'WAT-105'
  
  -- Classification
  category          text        not null
                                check (category in (
                                  'SSB Fundamentals',
                                  'OLQs',
                                  'Psychological Tests',
                                  'GTO Tasks',
                                  'Interview Prep',
                                  'Leadership',
                                  'Decision Making',
                                  'Communication',
                                  'General Knowledge'
                                )),
  subcategory       text,                     -- e.g., 'TAT', 'WAT', 'SRT', 'NDA', 'CDS'
  difficulty        text        not null
                                check (difficulty in ('Easy', 'Medium', 'Hard')),
  
  -- Question Type
  question_type     text        not null
                                check (question_type in (
                                  'MCQ',
                                  'SingleWord',
                                  'Numeric',
                                  'RapidResponse',
                                  'TrueFalse',
                                  'SRT',
                                  'WAT',
                                  'Interview'
                                )),
  
  -- Question Content
  question          text        not null,
  prompt            text,                     -- Additional guidance (for subjective questions)
  
  -- Answer Data (stored as JSONB for flexibility)
  answer_data       jsonb       not null default '{}',
  -- Structure varies by question_type:
  -- MCQ/RapidResponse: { "options": [...], "correctIndex": N, "explanation": "..." }
  -- SingleWord: { "correctAnswer": "...", "acceptableAnswers": [...], "explanation": "..." }
  -- Numeric: { "correctAnswer": N, "tolerance": N, "unit": "...", "explanation": "..." }
  -- TrueFalse: { "correctAnswer": true/false, "explanation": "..." }
  -- SRT/WAT/Interview: { "minWords": N, "evaluationCriteria": [...] }
  
  -- Metadata
  xp_reward         smallint    not null default 10
                                check (xp_reward > 0),
  time_limit        smallint,                -- seconds (for RapidResponse)
  tags              text[]      not null default '{}',
  source            text,                     -- e.g., 'Team Curated', 'SSB Manual', 'Expert Review'
  
  -- Status
  active            boolean     not null default true,
  
  -- Audit
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.questions is
  'Unified question bank for all training sessions. Supports 8 question types.';

comment on column public.questions.answer_data is
  'JSONB structure varies by question_type. See schema doc for details.';

comment on column public.questions.tags is
  'Array of tags for filtering (e.g., ["NDA", "stage1", "screening"]).';


-- ═════════════════════════════════════════════════════════════
-- INDEXES
-- Optimize common query patterns
-- ═════════════════════════════════════════════════════════════

-- Primary query: fetch by type, difficulty, category
create index idx_questions_type_active 
  on public.questions (question_type, active, difficulty);

-- Category filtering
create index idx_questions_category 
  on public.questions (category, subcategory) 
  where active = true;

-- Tag search (GIN index for array containment)
create index idx_questions_tags 
  on public.questions using gin (tags);

-- Full-text search on question text
create index idx_questions_search 
  on public.questions using gin (to_tsvector('english', question));


-- ═════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Questions are read-only for authenticated users
-- ═════════════════════════════════════════════════════════════

alter table public.questions enable row level security;

create policy "questions_authenticated_read" on public.questions
  for select using (
    auth.role() = 'authenticated' 
    and active = true
  );


-- ═════════════════════════════════════════════════════════════
-- TRIGGER: auto-update updated_at timestamp
-- ═════════════════════════════════════════════════════════════

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_updated_at
  before update on public.questions
  for each row
  execute function public.update_updated_at_column();


-- ═════════════════════════════════════════════════════════════
-- FUNCTION: get_session_questions
-- Returns random questions for a session based on criteria
-- ═════════════════════════════════════════════════════════════

create or replace function public.get_session_questions(
  p_question_types  text[],      -- e.g., ['MCQ', 'TrueFalse']
  p_count           integer,      -- number of questions to return
  p_difficulty      text default null,
  p_category        text default null,
  p_exclude_ids     text[] default '{}'
)
returns setof public.questions
language sql
stable
as $$
  select *
  from public.questions
  where 
    active = true
    and question_type = any(p_question_types)
    and (p_difficulty is null or difficulty = p_difficulty)
    and (p_category is null or category = p_category)
    and not (id = any(p_exclude_ids))
  order by random()
  limit p_count;
$$;

comment on function public.get_session_questions is
  'Returns random active questions matching criteria. Used by session loaders.';


-- ═════════════════════════════════════════════════════════════
-- FUNCTION: get_mixed_session_questions
-- Returns questions with controlled type distribution
-- Used for Session 2 which needs specific mix of question types
-- ═════════════════════════════════════════════════════════════

create or replace function public.get_mixed_session_questions(
  p_type_counts     jsonb,      -- e.g., {"MCQ": 6, "SingleWord": 4, "Numeric": 4, "RapidResponse": 4, "TrueFalse": 2}
  p_difficulty      text default null,
  p_exclude_ids     text[] default '{}'
)
returns setof public.questions
language plpgsql
stable
as $$
declare
  v_type text;
  v_count integer;
begin
  -- Iterate over each question type and count
  for v_type, v_count in
    select key, value::integer
    from jsonb_each_text(p_type_counts)
  loop
    return query
    select *
    from public.questions
    where 
      active = true
      and question_type = v_type
      and (p_difficulty is null or difficulty = p_difficulty)
      and not (id = any(p_exclude_ids))
    order by random()
    limit v_count;
  end loop;
end;
$$;

comment on function public.get_mixed_session_questions is
  'Returns questions with specific type distribution for mixed sessions like Session 2.';
