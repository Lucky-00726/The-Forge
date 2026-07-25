// ─────────────────────────────────────────────────────────────
// THE FORGE — Analytics Service
// Track user behavior and session completion for retention analysis
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';

export type AnalyticsEvent =
  | 'session1_started'
  | 'session1_completed'
  | 'session2_started'
  | 'session2_completed'
  | 'session3_started'
  | 'session3_completed'
  | 'day1_completed'
  | 'ai_evaluation_started'
  | 'ai_evaluation_completed'
  | 'ai_evaluation_failed'
  | 'xp_awarded'
  | 'rank_advanced';

export interface SessionAnalytics {
  userId: string;
  event: AnalyticsEvent;
  sessionNumber?: number;
  completionTimeSeconds?: number;
  score?: number;
  totalQuestions?: number;
  xpEarned?: number;
  responseCount?: number;
  overallScore?: number;
  duration?: number;
  model?: string;
  error?: string;
  timestamp: string; // ISO timestamp
}

/**
 * Track analytics event.
 * In production, this would send to analytics backend (Mixpanel, Amplitude, etc.)
 * For beta, logs to console and can be extended to local storage for review.
 */
export function trackEvent(
  userId: string | null,
  event: AnalyticsEvent,
  metadata?: {
    sessionNumber?: number;
    completionTimeSeconds?: number;
    score?: number;
    totalQuestions?: number;
    questionCount?: number;
    xpEarned?: number;
    responseCount?: number;
    overallScore?: number;
    duration?: number;
    model?: string;
    error?: string;
  }
): void {
  if (!userId) {
    console.log('[Analytics] No user ID, skipping event:', event);
    return;
  }

  const analyticsData: SessionAnalytics = {
    userId,
    event,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  // Log to console for development/beta
  console.log('[Analytics]', analyticsData);

  // Persist to database (fire-and-forget; never blocks or throws into the UI)
  void persistEvent(userId, event, metadata);
}

/**
 * Persist an event to the analytics_events table.
 * Detached and fully error-swallowed — analytics must NEVER block or break a
 * user action. If the table is missing, RLS rejects, or the network fails,
 * this is a silent no-op.
 */
async function persistEvent(
  userId: string,
  event: AnalyticsEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: userId,
      event,
      metadata: metadata ? (metadata as never) : null,
    });
    if (error) {
      console.log('[Analytics] persist skipped:', error.message);
    }
  } catch (err) {
    // Swallow — analytics failures must not affect the user flow.
    console.log('[Analytics] persist exception (ignored)');
  }
}

/**
 * Store analytics events locally for beta review
 */
function storeLocalAnalytics(data: SessionAnalytics): void {
  try {
    // In React Native, use AsyncStorage
    // For now, just console log
    // TODO: Implement AsyncStorage persistence
    console.log('[Analytics] Stored locally:', data.event);
  } catch (error) {
    console.error('[Analytics] Failed to store locally:', error);
  }
}

/**
 * Get local analytics data (for debugging/review)
 */
export async function getLocalAnalytics(): Promise<SessionAnalytics[]> {
  try {
    // TODO: Retrieve from AsyncStorage
    return [];
  } catch (error) {
    console.error('[Analytics] Failed to retrieve local analytics:', error);
    return [];
  }
}

/**
 * Clear local analytics data
 */
export async function clearLocalAnalytics(): Promise<void> {
  try {
    // TODO: Clear AsyncStorage
    console.log('[Analytics] Cleared local analytics');
  } catch (error) {
    console.error('[Analytics] Failed to clear local analytics:', error);
  }
}

/**
 * Calculate funnel metrics from analytics events
 */
export interface FunnelMetrics {
  session1: {
    started: number;
    completed: number;
    completionRate: number;
    averageTimeSeconds: number;
  };
  session2: {
    started: number;
    completed: number;
    completionRate: number;
    averageTimeSeconds: number;
  };
  session3: {
    started: number;
    completed: number;
    completionRate: number;
    averageTimeSeconds: number;
  };
  day1Completed: number;
  overallCompletionRate: number;
}

export function calculateFunnelMetrics(events: SessionAnalytics[]): FunnelMetrics {
  const session1Started = events.filter(e => e.event === 'session1_started').length;
  const session1Completed = events.filter(e => e.event === 'session1_completed');
  const session2Started = events.filter(e => e.event === 'session2_started').length;
  const session2Completed = events.filter(e => e.event === 'session2_completed');
  const session3Started = events.filter(e => e.event === 'session3_started').length;
  const session3Completed = events.filter(e => e.event === 'session3_completed');
  const day1Completed = events.filter(e => e.event === 'day1_completed').length;

  const avgTime = (completed: SessionAnalytics[]) => {
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, e) => acc + (e.completionTimeSeconds || 0), 0);
    return Math.round(sum / completed.length);
  };

  return {
    session1: {
      started: session1Started,
      completed: session1Completed.length,
      completionRate: session1Started > 0 ? (session1Completed.length / session1Started) * 100 : 0,
      averageTimeSeconds: avgTime(session1Completed),
    },
    session2: {
      started: session2Started,
      completed: session2Completed.length,
      completionRate: session2Started > 0 ? (session2Completed.length / session2Started) * 100 : 0,
      averageTimeSeconds: avgTime(session2Completed),
    },
    session3: {
      started: session3Started,
      completed: session3Completed.length,
      completionRate: session3Started > 0 ? (session3Completed.length / session3Started) * 100 : 0,
      averageTimeSeconds: avgTime(session3Completed),
    },
    day1Completed,
    overallCompletionRate: session1Started > 0 ? (day1Completed / session1Started) * 100 : 0,
  };
}
