// ─────────────────────────────────────────────────────────────
// THE FORGE — Core Types
// Single source of truth for all shared TypeScript types.
// Database shapes mirror Supabase table columns exactly.
// ─────────────────────────────────────────────────────────────
import type { Session, User } from '@supabase/supabase-js';

// ── Database row shapes ───────────────────────────────────────

/**
 * Mirrors public.users table.
 * All fields are snake_case to match Postgres column names.
 */
export interface DbUser {
  id:               string;       // uuid, FK → auth.users
  display_name:     string;
  target:           UserTarget | null;
  total_xp:         number;
  current_rank:     RankName;
  current_streak:   number;
  last_active_date: string | null; // YYYY-MM-DD IST
  created_at:       string;        // ISO timestamp
}

export interface DbMission {
  id:                  string;           // e.g. 'COM-001'
  title:               string;
  category:            MissionCategory;
  mission_type:        MissionType;
  week_number:         number;
  unlock_day:          number;           // 1-7
  xp_reward:           number;
  time_limit_seconds:  number | null;    // NULL = no time limit
  content:             MissionContent;
}

export interface DbMissionCompletion {
  id:             string;         // uuid
  user_id:        string;
  mission_id:     string;
  completed_date: string;         // YYYY-MM-DD IST
  xp_awarded:     number;
  responses:      Record<string, unknown> | null;
  is_featured:    boolean;        // TRUE = featured (100% XP), FALSE = training (50% XP)
}

// ── Domain enums ──────────────────────────────────────────────

export type UserTarget =
  | 'NDA'
  | 'CDS'
  | 'NCC'
  | 'GENERAL';

export type MissionCategory =
  | 'Communication'
  | 'Confidence'
  | 'Leadership'
  | 'Awareness'
  | 'Officer Thinking';

export type MissionType =
  | 'Reflect & Write'
  | 'Poll + Reasoning'
  | 'Daily Challenge'
  | 'Rapid Response';

export type RankName =
  | 'Cadet'
  | 'Officer'
  | 'Commander'
  | 'Colonel'
  | 'General';

// ── Rank thresholds ───────────────────────────────────────────

export const RANK_THRESHOLDS: Record<RankName, number> = {
  Cadet: 0,
  Officer: 800,
  Commander: 2000,
  Colonel: 4000,
  General: 7000,
};

// ── Mission content payloads ──────────────────────────────────
// Stored in missions.content JSONB column.
// Discriminated union on `type`.

export interface ReflectWriteContent {
  type:         'Reflect & Write';
  prompt:       string;
  context?:     string;
  min_words:    number;
}

export interface PollReasoningContent {
  type:             'Poll + Reasoning';
  question:         string;
  context?:         string;
  options:          string[];
  reasoning_prompt: string;
  min_words:        number;
}

export interface DailyChallengeContent {
  type:                'Daily Challenge';
  title:               string;
  briefing:            string;
  task:                string;
  reflection_prompt:   string;
}

export interface RapidResponseContent {
  type:       'Rapid Response';
  scenario:   string;
  question:   string;
  options:    string[];
}

export type MissionContent =
  | ReflectWriteContent
  | PollReasoningContent
  | DailyChallengeContent
  | RapidResponseContent;

// ── Mission response shapes ───────────────────────────────────
// What users submit when completing a mission.

export interface ReflectWriteResponse {
  type:       'Reflect & Write';
  text:       string;
  word_count: number;
}

export interface PollReasoningResponse {
  type:            'Poll + Reasoning';
  selected_option: string;
  reasoning:       string;
  word_count:      number;
}

export interface DailyChallengeResponse {
  type:        'Daily Challenge';
  completed:   boolean;
  reflection:  string;
}

export interface RapidResponseResponse {
  type:            'Rapid Response';
  selected_option: string;
  time_taken:      number;  // seconds
}

export type MissionResponse =
  | ReflectWriteResponse
  | PollReasoningResponse
  | DailyChallengeResponse
  | RapidResponseResponse;

// ── RPC return shape ──────────────────────────────────────────
// Matches what complete_mission() Postgres function returns.

export interface CompleteMissionResult {
  xp_awarded:   number;
  new_total_xp: number;
  new_streak:   number;
  new_rank:     RankName;
  is_featured:  boolean;          // Echoes back whether this was a featured completion
}

// ── Auth state ────────────────────────────────────────────────

export interface AuthState {
  session:       Session | null;
  user:          User | null;
  profile:       DbUser | null;
  isLoading:     boolean;
  isInitialized: boolean;
}

// ── Form validation ───────────────────────────────────────────

export interface LoginForm {
  email:    string;
  password: string;
}

export interface SignupForm {
  email:        string;
  password:     string;
  display_name: string;
}

export interface ForgotPasswordForm {
  email: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

// ── Utility types ─────────────────────────────────────────────

/** Any function that returns a Promise and may fail */
export type AsyncResult<T> =
  | { success: true;  data: T }
  | { success: false; error: string };
