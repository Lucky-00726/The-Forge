// ─────────────────────────────────────────────────────────────
// THE FORGE — Daily Session Service
// Single service for all user_daily_sessions table interactions.
// No component queries the table directly.
//
// Responsibilities:
//   • Assign (pin) a fixed question set per user per session per day
//   • Track completion state (completed ≠ locked — still viewable)
//   • Provide today's session status for dashboard gate logic
//   • Store review data (score, XP, timing) at completion
//
// IST date boundary:
//   ALL date values use todayIST() from src/utils/date.ts.
//   This is the single IST date source used everywhere in Sprint 1.
//   Never call new Date() or Date.now() for date comparisons here.
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';
import { todayIST } from '../utils/date';

// ── Types ─────────────────────────────────────────────────────

export type SessionNumber = 1 | 2 | 3;

export interface DailySessionRecord {
  id:                      string;
  user_id:                 string;
  session_date:            string;          // YYYY-MM-DD IST
  session_number:          SessionNumber;
  question_ids:            string[];
  started_at:              string;
  completed_at:            string | null;
  xp_earned:               number;
  score:                   number | null;
  total_questions:         number | null;
  completion_time_seconds: number | null;
  difficulty:              string | null;
  progress:                Record<string, unknown> | null;
}

export interface SessionStatus {
  assigned:  boolean;
  completed: boolean;
  xpEarned:  number;
  score:     number | null;
  total:     number | null;
  record:    DailySessionRecord | null;
}

export interface TodayStatus {
  session1: SessionStatus;
  session2: SessionStatus;
  session3: SessionStatus;
  date:     string;          // IST date these statuses are valid for
}

// ── getOrAssignSession ────────────────────────────────────────
// Core pin function. On first call for a (user, date, session):
//   1. Calls fetchFn() to get a fresh random question set
//   2. Stores the question IDs in user_daily_sessions
//   3. Returns the question IDs
//
// On subsequent calls (same day, same session):
//   Returns the stored IDs — same questions as the first time.
//
// Race-safe: uses INSERT ... ON CONFLICT DO NOTHING.
// If two concurrent requests both miss the table check, only the
// first INSERT succeeds. The second reads the winner's row.
//
// Parameters:
//   userId      — authenticated user ID
//   sessionNum  — 1, 2, or 3
//   fetchFn     — async function that fetches fresh question IDs
//                 (called ONLY when no row exists for today)
//
// Returns: ordered question ID array, or null on error
// ─────────────────────────────────────────────────────────────
export async function getOrAssignSession(
  userId:      string,
  sessionNum:  SessionNumber,
  trainingDay: number,
  fetchFn:     () => Promise<string[]>,
): Promise<string[] | null> {
  const date = todayIST();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  console.log(`[DEBUG][DailySession] S${sessionNum} getOrAssignSession start`);
  console.log(`[DEBUG][DailySession] Current date (IST): ${date}`);
  console.log(`[DEBUG][DailySession] Current timezone: ${timezone}`);
  console.log(`[DEBUG][DailySession] Today's key: user:${userId} | day:${trainingDay} | session:${sessionNum}`);

  try {
    // ── Check for existing assignment ─────────────────────────
    const { data: existing, error: readErr } = await supabase
      .from('user_daily_sessions')
      .select('question_ids')
      .eq('user_id',        userId)
      .eq('training_day',   trainingDay)
      .eq('session_number', sessionNum)
      .maybeSingle();

    if (readErr) {
      console.error(`[DailySession] Read error (S${sessionNum}):`, readErr.message);
      // Fail open: return null so the session screen shows an error
      return null;
    }

    if (existing) {
      console.log(`[DEBUG][DailySession] S${sessionNum} generation SKIPPED (restored existing session from DB day: ${trainingDay})`);
      console.log(`[DEBUG][DailySession] Pinned question IDs:`, JSON.stringify(existing.question_ids));
      return existing.question_ids;
    }

    console.log(`[DEBUG][DailySession] S${sessionNum} generation RUNNING - generating new questions`);

    // ── No assignment yet — generate and store ─────────────────
    const questionIds = await fetchFn();

    if (!questionIds || questionIds.length === 0) {
      console.error(`[DailySession] fetchFn returned empty for S${sessionNum}`);
      return null;
    }

    console.log(`[DEBUG][DailySession] S${sessionNum} generated question IDs:`, JSON.stringify(questionIds));

    // Persist unique assignment mapped to user, training day, and session number
    const { error: insertErr } = await supabase
      .from('user_daily_sessions')
      .insert({
        user_id:        userId,
        training_day:   trainingDay,
        session_date:   date, // Calendar track date kept for analytics/streaks
        session_number: sessionNum,
        question_ids:   questionIds,
      });

    if (insertErr && insertErr.code !== '23505') {
      // 23505 = unique_violation (another request won the race) — that's OK
      console.error(`[DailySession] Insert error (S${sessionNum}):`, insertErr.message);
      // Fall through: try to read whatever is there
    }

    // Read back the winner (our insert or the concurrent one)
    const { data: confirmed, error: confirmErr } = await supabase
      .from('user_daily_sessions')
      .select('question_ids')
      .eq('user_id',        userId)
      .eq('training_day',   trainingDay)
      .eq('session_number', sessionNum)
      .single();

    if (confirmErr || !confirmed) {
      console.error(`[DailySession] Confirm read failed (S${sessionNum}):`, confirmErr?.message);
      // Last-resort: return the IDs we fetched, even if not persisted
      return questionIds;
    }

    console.log(`[DEBUG][DailySession] S${sessionNum} assigned & confirmed:`, JSON.stringify(confirmed.question_ids));
    return confirmed.question_ids;

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[DailySession] Unexpected error (S${sessionNum}):`, msg);
    return null;
  }
}


// ── getTodayStatus ────────────────────────────────────────────
// Returns completion state for all 3 sessions for active training day.
// ─────────────────────────────────────────────────────────────
export async function getTodayStatus(userId: string): Promise<TodayStatus> {
  const date = todayIST();

  const emptyStatus = (): SessionStatus => ({
    assigned: false, completed: false, xpEarned: 0,
    score: null, total: null, record: null,
  });

  const defaultResult: TodayStatus = {
    session1: emptyStatus(),
    session2: emptyStatus(),
    session3: emptyStatus(),
    date,
  };

  try {
    // 1. Retrieve the user's active progression day
    const { data: userProfile, error: profileErr } = await supabase
      .from('users')
      .select('current_training_day')
      .eq('id', userId)
      .single();

    if (profileErr || !userProfile) {
      console.error('[DailySession] getTodayStatus profile lookup failed:', profileErr?.message);
      return defaultResult;
    }

    const trainingDay = userProfile.current_training_day;

    // 2. Fetch daily sessions matching this active progression day
    const { data, error } = await supabase
      .from('user_daily_sessions')
      .select('*')
      .eq('user_id',      userId)
      .eq('training_day', trainingDay) as any;

    if (error) {
      console.error('[DailySession] getTodayStatus error:', error.message);
      return defaultResult;
    }

    const result = { ...defaultResult };

    for (const row of data ?? []) {
      const key = `session${row.session_number}` as 'session1' | 'session2' | 'session3';
      result[key] = {
        assigned:  true,
        completed: row.completed_at !== null,
        xpEarned:  row.xp_earned ?? 0,
        score:     row.score,
        total:     row.total_questions,
        record:    row as DailySessionRecord,
      };
    }

    return result;
  } catch (err) {
    console.error('[DailySession] getTodayStatus unexpected error:', err);
    return defaultResult;
  }
}


// ── markSessionCompleted ──────────────────────────────────────
// Calls the secure, atomic database RPC to save progress and advance day.
// ─────────────────────────────────────────────────────────────
export async function markSessionCompleted(
  userId:                 string,
  sessionNum:             SessionNumber,
  xpEarned:               number,
  score:                  number | null,
  totalQuestions:         number,
  completionTimeSeconds:  number,
  difficulty:             string,
): Promise<{ success: boolean; status: string; dayAdvanced: boolean; newTrainingDay: number; programCompleted: boolean } | null> {
  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('current_training_day')
      .eq('id', userId)
      .single();

    const expectedDay = userProfile?.current_training_day ?? 1;

    console.log(`[DailySession] RPC complete_daily_session for Day ${expectedDay}, S${sessionNum}`);

    const { data, error } = await supabase.rpc('complete_daily_session', {
      p_expected_day:            expectedDay,
      p_session_number:          sessionNum,
      p_xp_earned:               xpEarned,
      p_score:                   score,
      p_total_questions:         totalQuestions,
      p_completion_time_seconds: completionTimeSeconds,
      p_difficulty:              difficulty
    });

    if (error) {
      console.error('[DailySession] RPC complete_daily_session error:', error.message);
      return null;
    }

    const result = data && data[0];
    if (!result) {
      console.error('[DailySession] RPC complete_daily_session returned empty data');
      return null;
    }

    console.log('[DailySession] RPC complete_daily_session result:', result);

    return {
      success:          result.completed_session,
      status:           result.status,
      dayAdvanced:      result.day_advanced,
      newTrainingDay:   result.new_training_day,
      programCompleted: result.program_completed,
    };
  } catch (err) {
    console.error('[DailySession] RPC complete_daily_session unexpected error:', err);
    return null;
  }
}


// ── isSessionCompleted ────────────────────────────────────────
// Quick check: has the user already completed this session for active day?
// Used by completion screens to guard against double XP awards.
// Safe default: returns false on error (fail open).
// ─────────────────────────────────────────────────────────────
export async function isSessionCompleted(
  userId:    string,
  sessionNum: SessionNumber,
): Promise<boolean> {
  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('current_training_day')
      .eq('id', userId)
      .single();

    const trainingDay = userProfile?.current_training_day ?? 1;

    const { data, error } = await supabase
      .from('user_daily_sessions')
      .select('completed_at')
      .eq('user_id',        userId)
      .eq('training_day',   trainingDay)
      .eq('session_number', sessionNum)
      .maybeSingle();

    if (error) {
      console.error(`[DailySession] isCompleted error (S${sessionNum}):`, error.message);
      return false;
    }

    return data?.completed_at !== null && data?.completed_at !== undefined;
  } catch {
    return false;
  }
}

// ── devForceRegenerateSession ──────────────────────────────────────
// Deletes today's cached user_daily_sessions entry for development/testing.
// Guarded by __DEV__ check.
// ─────────────────────────────────────────────────────────────
export async function devForceRegenerateSession(
  userId: string,
  sessionNum: SessionNumber,
): Promise<boolean> {
  if (!__DEV__) {
    console.warn('[DailySession] devForceRegenerateSession is only allowed in development mode');
    return false;
  }

  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('current_training_day')
      .eq('id', userId)
      .single();

    const trainingDay = userProfile?.current_training_day ?? 1;

    const { error } = await supabase
      .from('user_daily_sessions')
      .delete()
      .eq('user_id',        userId)
      .eq('training_day',   trainingDay)
      .eq('session_number', sessionNum);

    if (error) {
      console.error(`[DailySession] [DEV] Force delete error (S${sessionNum}):`, error.message);
      return false;
    }

    console.log(`[DailySession] [DEV] Successfully deleted cached session ${sessionNum} for Day ${trainingDay}`);
    return true;
  } catch (err) {
    console.error(`[DailySession] [DEV] devForceRegenerateSession unexpected error:`, err);
    return false;
  }
}

