// ─────────────────────────────────────────────────────────────
// THE FORGE — Mission Service
// All mission-related Supabase calls.
// Returns typed AsyncResult — never throws.
// ─────────────────────────────────────────────────────────────
import { supabase } from './supabase';
import type {
  AsyncResult,
  DbMission,
  MissionResponse,
  CompleteMissionResult,
} from '../types';

// ── Error normalisation ───────────────────────────────────────
function normalizeError(error: unknown): string {
  if (!(error instanceof Error)) return 'An unexpected error occurred.';

  const msg = error.message.toLowerCase();

  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Check your connection.';
  if (msg.includes('not found'))
    return 'Mission not found.';
  if (msg.includes('row level security'))
    return 'Access denied. Please sign in again.';
  if (msg.includes('already completed today'))
    return 'You have already completed this mission today.';
  if (msg.includes('featured mission already completed'))
    return 'You have already completed the featured mission today. Try a training mission instead.';

  return error.message;
}

// ── Fetch mission by ID ───────────────────────────────────────
export async function fetchMissionById(
  id: string,
): Promise<AsyncResult<DbMission>> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? 'Mission not found.',
    };
  }

  return { success: true, data: data as DbMission };
}

// ── Fetch today's missions for user (ALL 5 categories) ────────
// Returns all missions for the given week/day
export async function fetchTodayMissions(
  userId: string,
  weekNumber: number,
  dayOfWeek: number,
): Promise<AsyncResult<DbMission[]>> {
  console.log('[Mission Service] Fetching all missions for:', { weekNumber, dayOfWeek, userId });

  // Fetch ALL missions for current week/day
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('week_number', weekNumber)
    .eq('unlock_day', dayOfWeek)
    .order('category') as any;

  console.log('[Mission Service] Query result:', {
    count: data?.length || 0,
    hasError: !!error,
    errorMessage: error?.message,
  });

  if (error) {
    console.error('[Mission Service] Full error object:', error);
    return {
      success: false,
      error: `Database error: ${error.message || error.code || 'Unknown error'}`,
    };
  }

  // If found, return them
  if (data && data.length > 0) {
    console.log('[Mission Service] Found missions:', data.map((m: any) => m.id).join(', '));
    return { success: true, data: data as DbMission[] };
  }

  console.log('[Mission Service] No missions found for Week', weekNumber, 'Day', dayOfWeek, '- trying fallbacks');

  // Fallback: Get all missions from Week 1, Day 1
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('missions')
    .select('*')
    .eq('week_number', 1)
    .eq('unlock_day', 1)
    .order('category') as any;

  if (!fallbackError && fallbackData && fallbackData.length > 0) {
    console.log('[Mission Service] Using fallback missions (W1D1):', fallbackData.map((m: any) => m.id).join(', '));
    return { success: true, data: fallbackData as DbMission[] };
  }

  // No missions found at all
  console.error('[Mission Service] No missions found in database at all');
  return {
    success: false,
    error: 'No missions available. Please contact support or check your database.',
  };
}

// ── Legacy single mission fetch (kept for backwards compatibility) ─
export async function fetchTodayMission(
  userId: string,
  weekNumber: number,
  dayOfWeek: number,
): Promise<AsyncResult<DbMission | null>> {
  const result = await fetchTodayMissions(userId, weekNumber, dayOfWeek);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  // Return first mission or null
  return { success: true, data: result.data[0] || null };
}

// ── Check if today's mission is already completed ─────────────
export async function checkTodayCompletion(
  userId: string,
  today: string, // YYYY-MM-DD IST
): Promise<AsyncResult<boolean>> {
  const { data, error } = await supabase
    .from('mission_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('completed_date', today)
    .maybeSingle();

  if (error) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }

  return { success: true, data: !!data };
}

// ── Check if user has completed featured mission today ────────
export async function hasFeaturedCompletedToday(
  userId: string,
): Promise<AsyncResult<boolean>> {
  const { data, error } = await supabase.rpc('has_completed_featured_today', {
    p_user_id: userId,
  });

  if (error) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }

  return { success: true, data: data as boolean };
}

// ── Get count of missions completed today ─────────────────────
export async function getTodayCompletionCount(
  userId: string,
): Promise<AsyncResult<number>> {
  const { data, error } = await supabase.rpc('get_today_completion_count', {
    p_user_id: userId,
  });

  if (error) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }

  return { success: true, data: data as number };
}

// ── Get today's completed mission IDs ─────────────────────────
export async function getTodayCompletedMissionIds(
  userId: string,
  today: string, // YYYY-MM-DD IST
): Promise<AsyncResult<string[]>> {
  const { data, error } = await supabase
    .from('mission_completions')
    .select('mission_id')
    .eq('user_id', userId)
    .eq('completed_date', today);

  if (error) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }

  return {
    success: true,
    data: data?.map(row => row.mission_id) || [],
  };
}

// ── Complete mission (calls Postgres RPC) ─────────────────────
// ✅ SECURE: Server determines XP and featured status
// Client only provides mission_id and responses
export async function completeMission(payload: {
  userId:     string;
  missionId:  string;
  responses:  MissionResponse;
  // ✅ REMOVED: xp (server fetches from missions table)
  // ✅ REMOVED: isFeatured (server determines from mission_id)
}): Promise<AsyncResult<CompleteMissionResult>> {
  console.log('[Mission Service] Calling complete_mission RPC:', {
    userId: payload.userId,
    missionId: payload.missionId,
    responsesType: payload.responses.type,
  });

  const { data, error } = await supabase.rpc('complete_mission', {
    p_user_id:    payload.userId,
    p_mission_id: payload.missionId,
    p_responses:  payload.responses,
    // Server determines XP and featured status
  });

  console.log('[Mission Service] RPC response:', { data, error });

  if (error) {
    console.error('[Mission Service] RPC error details:', error);
    return {
      success: false,
      error: normalizeError(error),
    };
  }

  if (!data) {
    console.error('[Mission Service] RPC returned no data');
    return {
      success: false,
      error: 'Completion failed. Please try again.',
    };
  }

  // Check if already completed (RPC returns this in the result)
  if ('already_completed' in data && data.already_completed) {
    console.log('[Mission Service] Mission already completed');
    return {
      success: false,
      error: 'You have already completed this mission today.',
    };
  }

  console.log('[Mission Service] Mission completed successfully:', data);
  return {
    success: true,
    data: data as CompleteMissionResult,
  };
}
