-- ═════════════════════════════════════════════════════════════
-- THE FORGE — Complete Database Schema + Seed Data
-- Version: 1.0 (MVP)
-- Target: Supabase PostgreSQL 15+
-- 
-- This is a single-file schema that includes:
--   • All table definitions with constraints
--   • All indexes
--   • Row Level Security (RLS) policies
--   • Triggers and functions
--   • complete_mission() RPC
--   • Week 1 + Week 2 seed data (14 missions)
--
-- To deploy:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Copy this entire file
--   3. Click "Run"
--   4. Verify: SELECT count(*) FROM missions; -- should return 14
--
-- ═════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";


-- ═════════════════════════════════════════════════════════════
-- TABLE: public.users
--
-- Extends auth.users via FK.
-- Stores user profile, XP, rank, and streak inline.
-- No separate streaks table in MVP.
--
-- XP → Rank progression:
--   0-399 XP     → Cadet
--   400-1199 XP  → Officer
--   1200+ XP     → Commander
--
-- Streak calculation:
--   Increments on consecutive-day completion
--   Resets to 1 after gap > 1 day
--   No grace period in MVP
--
-- All dates are IST (Asia/Kolkata timezone)
-- ═════════════════════════════════════════════════════════════

create table if not exists public.users (
  id                uuid        primary key
                                references auth.users(id)
                                on delete cascade,
  
  display_name      text        not null default '',
  
  target            text        check (target in ('NDA','CDS','NCC','GENERAL')),
  
  -- XP (denormalised, updated atomically by complete_mission RPC)
  total_xp          integer     not null default 0
                                check (total_xp >= 0),
  
  -- Rank (denormalised, recomputed by complete_mission RPC)
  current_rank      text        not null default 'Cadet'
                                check (current_rank in ('Cadet','Officer','Commander')),
  
  -- Streak tracking
  current_streak    integer     not null default 0
                                check (current_streak >= 0),
  
  last_active_date  date,       -- IST calendar date (YYYY-MM-DD)
  
  created_at        timestamptz not null default now()
);

comment on table public.users is
  'User profiles extending auth.users. XP, rank, and streak updated by complete_mission() RPC only.';

comment on column public.users.last_active_date is
  'IST calendar date of last completed mission. Used for streak calculation.';

comment on column public.users.total_xp is
  'Denormalised sum of all xp_awarded. Updated atomically by complete_mission() RPC.';

comment on column public.users.target is
  'User preparation goal: NDA (National Defence Academy), CDS (Combined Defence Services), NCC (National Cadet Corps), or GENERAL.';


-- ═════════════════════════════════════════════════════════════
-- TABLE: public.missions
--
-- Mission content catalogue.
-- Seeded manually (see bottom of this file).
-- No is_active column — only seed active missions.
--
-- Mission types:
--   • Reflect & Write: Text response with word count gate
--   • Poll + Reasoning: Option select + reasoning text
--   • Daily Challenge: Task checkbox + optional reflection
--
-- Categories:
--   • Communication
--   • Confidence
--   • Leadership
--   • Awareness
--   • Officer Thinking
--
-- Mission assignment logic (client-side deterministic):
--   week_number = floor(daysSince(user.created_at) / 7) + 1
--   day_of_week = (daysSince(user.created_at) % 7) + 1
--   mission = find(week_number, unlock_day=day_of_week)
--
-- ═════════════════════════════════════════════════════════════

create table if not exists public.missions (
  id            text        primary key,   -- e.g. 'COM-001', 'LEAD-002'
  
  title         text        not null,
  
  category      text        not null
                            check (category in (
                              'Communication',
                              'Confidence',
                              'Leadership',
                              'Awareness',
                              'Officer Thinking'
                            )),
  
  mission_type  text        not null
                            check (mission_type in (
                              'Reflect & Write',
                              'Poll + Reasoning',
                              'Daily Challenge'
                            )),
  
  week_number   smallint    not null default 1
                            check (week_number >= 1),
  
  unlock_day    smallint    not null default 1
                            check (unlock_day between 1 and 7),
  
  xp_reward     smallint    not null default 40
                            check (xp_reward > 0),
  
  content       jsonb       not null default '{}'
);

comment on table public.missions is
  'Mission content catalogue. Missions are assigned deterministically based on user.created_at and week/day calculation.';

comment on column public.missions.content is
  'Type-specific JSON payload. Shape varies by mission_type:
  
  Reflect & Write:
    { "type": "Reflect & Write",
      "prompt": "...",
      "context": "...",  (optional)
      "min_words": 30 }
  
  Poll + Reasoning:
    { "type": "Poll + Reasoning",
      "question": "...",
      "context": "...",  (optional)
      "options": ["...", "..."],
      "reasoning_prompt": "...",
      "min_words": 20 }
  
  Daily Challenge:
    { "type": "Daily Challenge",
      "title": "...",
      "briefing": "...",
      "task": "...",
      "reflection_prompt": "..." }';

comment on column public.missions.unlock_day is
  '1-7, which day within the user week this mission is available. Day 1 = user signup day.';


-- ═════════════════════════════════════════════════════════════
-- TABLE: public.mission_completions
--
-- Append-only event log.
-- One row per user per day (enforced by UNIQUE constraint).
-- No updates, no deletes.
--
-- UNIQUE(user_id, completed_date) prevents double XP.
-- RPC handles unique_violation gracefully (returns already_completed: true).
--
-- All dates are IST calendar dates (YYYY-MM-DD).
-- ═════════════════════════════════════════════════════════════

create table if not exists public.mission_completions (
  id              uuid        primary key default gen_random_uuid(),
  
  user_id         uuid        not null
                              references public.users(id)
                              on delete cascade,
  
  mission_id      text        not null
                              references public.missions(id),
  
  completed_date  date        not null,    -- IST calendar date
  
  xp_awarded      smallint    not null,
  
  responses       jsonb,                  -- raw user answers
  
  -- Core invariant: one mission completion per user per calendar day
  constraint uq_user_date unique (user_id, completed_date)
);

comment on table public.mission_completions is
  'Append-only completion log. UNIQUE(user_id, completed_date) enforces one mission per day per user.';

comment on column public.mission_completions.responses is
  'JSON object containing user submission. Shape varies by mission type:
  
  Reflect & Write:
    { "type": "Reflect & Write",
      "text": "...",
      "word_count": 35 }
  
  Poll + Reasoning:
    { "type": "Poll + Reasoning",
      "selected_option": "...",
      "reasoning": "...",
      "word_count": 25 }
  
  Daily Challenge:
    { "type": "Daily Challenge",
      "completed": true,
      "reflection": "..." }';


-- ═════════════════════════════════════════════════════════════
-- TABLE: public.feedback
--
-- Simple message store for beta tester feedback.
-- User can be NULL (anonymous feedback allowed).
-- ═════════════════════════════════════════════════════════════

create table if not exists public.feedback (
  id          uuid        primary key default gen_random_uuid(),
  
  user_id     uuid        references public.users(id) on delete set null,
  
  message     text        not null,
  
  created_at  timestamptz not null default now()
);

comment on table public.feedback is
  'Beta tester feedback. Submitted via profile screen. User optional for anonymous submissions.';


-- ═════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
--
-- All tables have RLS enabled.
-- Users can only read/write their own rows.
-- Missions are readable by all authenticated users.
-- ═════════════════════════════════════════════════════════════

alter table public.users             enable row level security;
alter table public.missions          enable row level security;
alter table public.mission_completions enable row level security;
alter table public.feedback          enable row level security;

-- ── users table policies ──────────────────────────────────────

create policy "users_self_select" on public.users
  for select
  using (auth.uid() = id);

create policy "users_self_update" on public.users
  for update
  using (auth.uid() = id);

-- ── missions table policies ───────────────────────────────────
-- All authenticated users can read missions (no write access)

create policy "missions_authenticated_read" on public.missions
  for select
  using (auth.role() = 'authenticated');

-- ── mission_completions table policies ────────────────────────

create policy "completions_self_select" on public.mission_completions
  for select
  using (auth.uid() = user_id);

create policy "completions_self_insert" on public.mission_completions
  for insert
  with check (auth.uid() = user_id);

-- No update/delete policies — completions are immutable

-- ── feedback table policies ───────────────────────────────────

create policy "feedback_self_insert" on public.feedback
  for insert
  with check (
    auth.uid() = user_id or user_id is null
  );


-- ═════════════════════════════════════════════════════════════
-- INDEXES
--
-- Optimised for:
--   • Dashboard query: check today's completion
--   • Mission lookup: find by week/day
-- ═════════════════════════════════════════════════════════════

-- Primary dashboard query: "Did I complete today's mission?"
-- Query: WHERE user_id = ? AND completed_date = ?
create index if not exists idx_completions_user_date
  on public.mission_completions (user_id, completed_date desc);

-- Mission unlock lookup: "What mission is available today?"
-- Query: WHERE week_number = ? AND unlock_day = ?
create index if not exists idx_missions_week_day
  on public.missions (week_number, unlock_day);


-- ═════════════════════════════════════════════════════════════
-- TRIGGER: auto-create user row on signup
--
-- Runs after INSERT on auth.users.
-- Creates matching row in public.users with blank display_name.
-- Display name is updated by client after signup.
-- ═════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, '')
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ═════════════════════════════════════════════════════════════
-- FUNCTION: complete_mission
--
-- Atomic mission completion RPC.
-- Called via supabase.rpc('complete_mission', { ... })
--
-- Operations (all in one transaction):
--   1. INSERT into mission_completions
--   2. UPDATE users (XP + streak + rank)
--   3. Return result to client
--
-- Streak logic:
--   • Same day:      keep current streak (shouldn't happen, caught by UNIQUE)
--   • Yesterday:     increment streak
--   • First ever:    streak = 1
--   • Gap > 1 day:   reset to 1
--
-- Rank thresholds:
--   •     0-399 XP → Cadet
--   •   400-1199 XP → Officer
--   • 1200+ XP → Commander
--
-- Edge case: already completed today
--   • UNIQUE(user_id, completed_date) throws unique_violation
--   • Exception handler returns current state + already_completed: true
--   • Client treats this as non-error (idempotent)
--
-- All dates use IST (Asia/Kolkata timezone)
-- ═════════════════════════════════════════════════════════════

create or replace function public.complete_mission(
  p_user_id    uuid,
  p_mission_id text,
  p_responses  jsonb,
  p_xp         integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today          date    := (now() at time zone 'Asia/Kolkata')::date;
  v_last_active    date;
  v_old_streak     integer;
  v_new_streak     integer;
  v_new_xp         integer;
  v_new_rank       text;
begin
  -- ── Fetch current user state ──────────────────────────────
  -- Row lock prevents concurrent double-completion
  select last_active_date, current_streak
  into   v_last_active, v_old_streak
  from   public.users
  where  id = p_user_id
  for update;

  if not found then
    raise exception 'User not found: %', p_user_id;
  end if;

  -- ── Calculate new streak ──────────────────────────────────
  v_new_streak :=
    case
      -- Already completed today
      -- (shouldn't reach here — UNIQUE constraint catches it first)
      when v_last_active = v_today then
        v_old_streak
      
      -- Completed yesterday → increment streak
      when v_last_active = v_today - interval '1 day' then
        v_old_streak + 1
      
      -- First ever mission
      when v_last_active is null then
        1
      
      -- Gap > 1 day → reset to 1
      else
        1
    end;

  -- ── INSERT completion ─────────────────────────────────────
  -- Will throw unique_violation (23505) if already completed today
  -- Exception handler below returns idempotent response
  insert into public.mission_completions (
    user_id,
    mission_id,
    completed_date,
    xp_awarded,
    responses
  ) values (
    p_user_id,
    p_mission_id,
    v_today,
    p_xp,
    p_responses
  );

  -- ── UPDATE user (XP + streak + rank) ─────────────────────
  update public.users
  set
    total_xp         = total_xp + p_xp,
    current_streak   = v_new_streak,
    last_active_date = v_today,
    current_rank     = case
      when total_xp + p_xp >= 1200 then 'Commander'
      when total_xp + p_xp >= 400  then 'Officer'
      else 'Cadet'
    end
  where id = p_user_id
  returning total_xp, current_rank
  into v_new_xp, v_new_rank;

  -- ── Return result to client ───────────────────────────────
  return jsonb_build_object(
    'xp_awarded',   p_xp,
    'new_total_xp', v_new_xp,
    'new_streak',   v_new_streak,
    'new_rank',     v_new_rank
  );

exception
  when unique_violation then
    -- Already completed today
    -- Return current state (not an error, just idempotent)
    select
      jsonb_build_object(
        'xp_awarded',        0,
        'new_total_xp',      total_xp,
        'new_streak',        current_streak,
        'new_rank',          current_rank,
        'already_completed', true
      )
    into v_new_xp
    from public.users
    where id = p_user_id;

    return v_new_xp::jsonb;
end;
$$;

comment on function public.complete_mission is
  'Atomic mission completion. Inserts completion row and updates user XP/streak/rank in one transaction. Called via supabase.rpc().';


-- ═════════════════════════════════════════════════════════════
-- SEED DATA: Week 1 + Week 2 Missions (14 missions)
--
-- Mission content balanced across 5 categories:
--   • Communication (COM)
--   • Confidence (CONF)
--   • Leadership (LEAD)
--   • Awareness (AWR)
--   • Officer Thinking (OT)
--
-- Mission type distribution:
--   • Reflect & Write:  6 missions
--   • Poll + Reasoning: 6 missions
--   • Daily Challenge:  2 missions
--
-- XP rewards:
--   • Reflect & Write:   40 XP
--   • Poll + Reasoning:  40 XP
--   • Daily Challenge:   50 XP
--
-- All missions are ready to use — no placeholder content.
-- ═════════════════════════════════════════════════════════════

insert into public.missions
  (id, title, category, mission_type, week_number, unlock_day, xp_reward, content)
values

-- ── WEEK 1 ────────────────────────────────────────────────────

-- Day 1: Reflect & Write (Confidence)
('CONF-001',
 'Held Back Opinion',
 'Confidence',
 'Reflect & Write',
 1, 1, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Describe a recent time when you held back your opinion in a group. What stopped you? What would you say now if you could go back?",
   "context": "There are no wrong answers. Be direct and honest with yourself.",
   "min_words": 30
 }'::jsonb),

-- Day 2: Poll + Reasoning (Leadership)
('LEAD-001',
 'Study Group Freeloader',
 'Leadership',
 'Poll + Reasoning',
 1, 2, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "Your 4-person study group has a member who hasn''t contributed for two weeks — missing sessions, not completing their part, but still expecting to share your materials. What do you do?",
   "context": "You are the informal leader of the group.",
   "options": ["Confront them directly and give a final chance", "Remove them from the group immediately", "Distribute their work silently and say nothing", "Bring it to a teacher or authority"],
   "reasoning_prompt": "In 2-3 sentences, explain what principle guides your choice.",
   "min_words": 20
 }'::jsonb),

-- Day 3: Daily Challenge (Communication)
('COM-001',
 'Speak Last Challenge',
 'Communication',
 'Daily Challenge',
 1, 3, 50,
 '{
   "type": "Daily Challenge",
   "title": "Speak Last",
   "briefing": "The instinct to speak first is about ego, not communication. Today you train the discipline of listening before leading.",
   "task": "In every group conversation today — class, family, or friends — let everyone else speak before you contribute. Do not interrupt. When you do speak, make your point count. Practice this in at least 2 conversations.",
   "reflection_prompt": "How did it feel to wait? What did you notice that you would have missed if you had spoken first?"
 }'::jsonb),

-- Day 4: Poll + Reasoning (Awareness)
('AWR-001',
 'Defence Budget Debate',
 'Awareness',
 'Poll + Reasoning',
 1, 4, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "Should India prioritise increasing its defence budget over social welfare spending?",
   "context": "India allocates approximately 2.1% of GDP to defence. The debate between defence preparedness and social investment is ongoing.",
   "options": ["Prioritise Defence", "Prioritise Social Welfare", "Equal split is essential", "Depends on the current threat level"],
   "reasoning_prompt": "Give one specific reason — a recent event, geopolitical factor, or economic argument.",
   "min_words": 20
 }'::jsonb),

-- Day 5: Reflect & Write (Officer Thinking)
('OT-001',
 'Wrong Decision Reflection',
 'Officer Thinking',
 'Reflect & Write',
 1, 5, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Describe a decision you made in the last month that turned out to be wrong. What information did you have? What did you miss? What would you decide differently today?",
   "context": "Officer thinking requires honest self-assessment without self-pity.",
   "min_words": 40
 }'::jsonb),

-- Day 6: Daily Challenge (Confidence)
('CONF-002',
 'Initiate Conversation',
 'Confidence',
 'Daily Challenge',
 1, 6, 50,
 '{
   "type": "Daily Challenge",
   "title": "Initiate — Do Not Wait",
   "briefing": "Confidence is built through action, not preparation. Today''s challenge is about initiating.",
   "task": "Start 3 conversations today that you would normally wait for the other person to begin. This can be with a classmate, a teacher, a shopkeeper, or a family member. Your opening line must be specific and genuine — not just ''hi''.",
   "reflection_prompt": "Which conversation surprised you most? What did you learn about how people respond when you initiate?"
 }'::jsonb),

-- Day 7: Reflect & Write (Communication)
('COM-002',
 'Difficult Conversation Reflection',
 'Communication',
 'Reflect & Write',
 1, 7, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Think of a difficult conversation you have been avoiding. Why are you avoiding it? What is the cost of continued silence? Write out exactly what you would say if you had it today.",
   "context": "Be specific — name the person and the situation in your mind, even if you don''t write them here.",
   "min_words": 35
 }'::jsonb),

-- ── WEEK 2 ────────────────────────────────────────────────────

-- Day 8 (Week 2, Day 1): Poll + Reasoning (Leadership)
('LEAD-002',
 'Silent Group Leader',
 'Leadership',
 'Poll + Reasoning',
 2, 1, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "During a group activity, no one is taking initiative. The group is stuck and silent. You have a clear idea of how to proceed but you are naturally the quietest person in the room. What do you do?",
   "context": "Leadership is not about personality — it is about stepping forward when needed.",
   "options": ["Speak up and propose your approach clearly", "Wait to see if someone more vocal takes charge", "Write your idea and pass it to a louder member", "Start doing something small to signal direction without speaking"],
   "reasoning_prompt": "What does your choice reveal about how you define leadership?",
   "min_words": 20
 }'::jsonb),

-- Day 9 (Week 2, Day 2): Daily Challenge (Officer Thinking)
('OT-002',
 'Intent Behind Task',
 'Officer Thinking',
 'Daily Challenge',
 2, 2, 50,
 '{
   "type": "Daily Challenge",
   "title": "Intent Behind the Task",
   "briefing": "Officers don''t just follow orders — they understand WHY the order exists. Today you train commander''s intent.",
   "task": "For every task you are given today — by a teacher, parent, coach, or anyone — identify the underlying intent before you start. Ask yourself: what is the real goal behind this instruction? Do this for at least 3 tasks and note each one.",
   "reflection_prompt": "Which task had the most surprising intent? What changed about how you approached it once you understood the why?"
 }'::jsonb),

-- Day 10 (Week 2, Day 3): Reflect & Write (Awareness)
('AWR-002',
 'Geopolitical Event Analysis',
 'Awareness',
 'Reflect & Write',
 2, 3, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Choose one major national or international event from the past 30 days. In your own words: what happened, why it matters to India, and what you think will happen next.",
   "context": "Pick an event from defence, politics, or international relations. Use only what you already know — do not look anything up.",
   "min_words": 50
 }'::jsonb),

-- Day 11 (Week 2, Day 4): Poll + Reasoning (Confidence)
('CONF-003',
 'Average Candidate Challenge',
 'Confidence',
 'Poll + Reasoning',
 2, 4, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "During an SSB group discussion, a peer says: ''Most of us here are average candidates with low chances.'' Several others nod. You strongly disagree. What do you do?",
   "context": "Your response in this moment will define how the group sees you.",
   "options": ["Speak up immediately and challenge the statement with reasoning", "Stay silent — it is not worth the confrontation", "Nod along but privately disagree", "Redirect the group to focus on preparation instead of probability"],
   "reasoning_prompt": "What is the most important thing an officer-aspirant should never accept?",
   "min_words": 20
 }'::jsonb),

-- Day 12 (Week 2, Day 5): Reflect & Write (Communication)
('COM-003',
 'Friend Wrong Decision',
 'Communication',
 'Reflect & Write',
 2, 5, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Your close friend is about to make a decision you believe is seriously wrong — academically, professionally, or personally. Do you tell them directly, even if it risks the friendship? Write what you would actually say to them.",
   "context": "Write the specific words you would use — not what you think you should say, but what you would actually say.",
   "min_words": 35
 }'::jsonb),

-- Day 13 (Week 2, Day 6): Daily Challenge (Leadership)
('LEAD-003',
 'Command Presence Drill',
 'Leadership',
 'Daily Challenge',
 2, 6, 50,
 '{
   "type": "Daily Challenge",
   "title": "Command Presence — Voice Drill",
   "briefing": "SSB assessors judge confidence through voice before they judge content. A wavering voice signals uncertainty even when the words are right.",
   "task": "Record yourself on your phone speaking for 60 seconds on any topic — your goals, today''s events, or your opinion on anything. Listen back and identify: pace (too fast?), volume (too low?), filler words (um, uh, like), and trailing sentences. Record a second take and correct what you found.",
   "reflection_prompt": "What was the biggest difference between recording 1 and recording 2? What one thing will you consciously work on next?"
 }'::jsonb),

-- Day 14 (Week 2, Day 7): Poll + Reasoning (Officer Thinking)
('OT-003',
 'Friend Cheating Dilemma',
 'Officer Thinking',
 'Poll + Reasoning',
 2, 7, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "During an important exam, you notice your close friend copying from a hidden cheat sheet. The invigilator hasn''t noticed. Your friend sees that you''ve seen them.",
   "context": "Your friendship is 3 years old. The exam result affects college admission.",
   "options": ["Report to the invigilator immediately", "Say nothing — it is not your responsibility", "Signal your friend discreetly to stop", "Confront your friend after the exam"],
   "reasoning_prompt": "Name the most important value at stake here and explain why it matters specifically for someone aspiring to be an officer.",
   "min_words": 25
 }'::jsonb)

on conflict (id) do nothing;


-- ═════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
--
-- Run these after deployment to verify schema is correct:
-- ═════════════════════════════════════════════════════════════

-- Check mission count (should be 14)
-- SELECT count(*) FROM missions;

-- Check mission distribution by type
-- SELECT mission_type, count(*) 
-- FROM missions 
-- GROUP BY mission_type 
-- ORDER BY mission_type;

-- Check mission distribution by category
-- SELECT category, count(*) 
-- FROM missions 
-- GROUP BY category 
-- ORDER BY category;

-- Check week/day coverage (should be: Week 1 Days 1-7, Week 2 Days 1-7)
-- SELECT week_number, unlock_day, id, title 
-- FROM missions 
-- ORDER BY week_number, unlock_day;

-- Test RPC signature (replace with real UUIDs after signup)
-- SELECT complete_mission(
--   'USER_UUID_HERE'::uuid,
--   'CONF-001',
--   '{"type":"Reflect & Write","text":"test","word_count":5}'::jsonb,
--   40
-- );

-- ═════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═════════════════════════════════════════════════════════════
