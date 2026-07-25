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
