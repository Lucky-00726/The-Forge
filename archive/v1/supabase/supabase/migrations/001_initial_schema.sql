-- ─────────────────────────────────────────────────────────────
-- THE FORGE — V1 Database Schema
-- Migration: 001_initial_schema
-- Run in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ═════════════════════════════════════════
-- TABLE: users
-- Extends auth.users via FK.
-- Streak + XP + rank stored inline (no
-- separate streaks table for MVP).
-- ═════════════════════════════════════════
create table public.users (
  id                uuid        primary key
                                references auth.users(id)
                                on delete cascade,
  display_name      text        not null default '',
  target            text        check (target in ('NDA','CDS','NCC','GENERAL')),

  -- XP
  total_xp          integer     not null default 0
                                check (total_xp >= 0),

  -- Rank (denormalised — recomputed by complete_mission RPC)
  current_rank      text        not null default 'Cadet'
                                check (current_rank in ('Cadet','Officer','Commander')),

  -- Streak
  current_streak    integer     not null default 0
                                check (current_streak >= 0),
  last_active_date  date,       -- IST calendar date (YYYY-MM-DD)

  created_at        timestamptz not null default now()
);

comment on column public.users.last_active_date is
  'IST calendar date of last completed mission. Used for streak calculation.';

comment on column public.users.total_xp is
  'Denormalised sum. Updated atomically by complete_mission() RPC.';


-- ═════════════════════════════════════════
-- TABLE: missions
-- Content catalogue.
-- Seeded manually via seed_week1.sql.
-- No is_active column — seed only active rows.
-- ═════════════════════════════════════════
create table public.missions (
  id            text        primary key,   -- e.g. 'COM-001'
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

comment on column public.missions.content is
  'Type-specific JSON payload. See src/types/index.ts for shape.';
comment on column public.missions.unlock_day is
  '1-7, which day within the users week this mission is available.';


-- ═════════════════════════════════════════
-- TABLE: mission_completions
-- One row per user per day (UNIQUE constraint).
-- Append-only — no updates, no deletes.
-- ═════════════════════════════════════════
create table public.mission_completions (
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
  'Append-only. UNIQUE(user_id, completed_date) enforces one mission/day.';


-- ═════════════════════════════════════════
-- TABLE: feedback
-- Simple message store for beta testers.
-- ═════════════════════════════════════════
create table public.feedback (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references public.users(id) on delete set null,
  message     text        not null,
  created_at  timestamptz not null default now()
);


-- ═════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═════════════════════════════════════════

alter table public.users             enable row level security;
alter table public.missions          enable row level security;
alter table public.mission_completions enable row level security;
alter table public.feedback          enable row level security;

-- users: full self-access
create policy "users_self_select" on public.users
  for select using (auth.uid() = id);

create policy "users_self_update" on public.users
  for update using (auth.uid() = id);

-- missions: readable by all authenticated users
create policy "missions_authenticated_read" on public.missions
  for select using (auth.role() = 'authenticated');

-- mission_completions: users own their rows
create policy "completions_self_select" on public.mission_completions
  for select using (auth.uid() = user_id);

create policy "completions_self_insert" on public.mission_completions
  for insert with check (auth.uid() = user_id);
-- No update/delete policies — completions are immutable

-- feedback: users insert their own
create policy "feedback_self_insert" on public.feedback
  for insert with check (
    auth.uid() = user_id or user_id is null
  );


-- ═════════════════════════════════════════
-- TRIGGER: auto-create user row on signup
-- Runs after auth.users INSERT.
-- Creates the public.users profile with a
-- blank display_name (updated after signup).
-- ═════════════════════════════════════════
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


-- ═════════════════════════════════════════
-- FUNCTION: complete_mission
-- Atomic mission completion:
--   1. INSERT into mission_completions
--   2. UPDATE users (XP + streak + rank)
--   3. Return result to client
--
-- Called via supabase.rpc('complete_mission', {...})
-- Runs in Postgres — no Edge Function needed.
-- ═════════════════════════════════════════
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
  select last_active_date, current_streak
  into   v_last_active, v_old_streak
  from   public.users
  where  id = p_user_id
  for update;                  -- row lock prevents concurrent double-completion

  if not found then
    raise exception 'User not found: %', p_user_id;
  end if;

  -- ── Calculate new streak ──────────────────────────────────
  v_new_streak :=
    case
      -- Already completed today (shouldn't happen — UNIQUE constraint catches it
      -- before this point, but belt-and-suspenders)
      when v_last_active = v_today then
        v_old_streak
      -- Completed yesterday → increment
      when v_last_active = v_today - interval '1 day' then
        v_old_streak + 1
      -- First ever mission
      when v_last_active is null then
        1
      -- Gap > 1 day → reset
      else
        1
    end;

  -- ── INSERT completion ─────────────────────────────────────
  -- Will throw unique_violation (23505) if already completed today.
  -- Caller handles this as "already done" — not an error.
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
    -- Already completed today — return current state, not an error
    select
      jsonb_build_object(
        'xp_awarded',   0,
        'new_total_xp', total_xp,
        'new_streak',   current_streak,
        'new_rank',     current_rank,
        'already_completed', true
      )
    into v_new_xp
    from public.users
    where id = p_user_id;

    return v_new_xp::jsonb;
end;
$$;

comment on function public.complete_mission is
  'Atomic mission completion. Inserts completion row and updates user XP/streak/rank in one transaction.';


-- ═════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════

-- Primary dashboard query: today's completion check
create index idx_completions_user_date
  on public.mission_completions (user_id, completed_date desc);

-- Mission unlock lookup (home screen on mount)
create index idx_missions_week_day
  on public.missions (week_number, unlock_day);