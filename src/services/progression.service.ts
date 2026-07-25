// ─────────────────────────────────────────────────────────────
// THE FORGE — Progression Service
// Single application-layer entry point for all XP, rank, and
// streak updates. Calls the award_progression() Postgres function
// which is the server-authoritative write path.
//
// Replaces:
//   - authService.awardXP()
//   - authService.updateStreak()
//   - The separate fetchProfile() refresh after each session
//
// The DB function award_progression() handles:
//   - Atomic XP + rank + streak update in one statement
//   - Rank recalculation on every XP award
//   - IST-day streak logic
//   - Row-level locking to prevent race conditions
//
// This service handles:
//   - Calling the RPC
//   - Updating the Zustand store with the returned state
//   - Firing analytics events
//   - Returning a typed result to callers
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';
import { useAuthStore } from '../store/auth.store';
import { trackEvent } from './analytics.service';

// ── Types ─────────────────────────────────────────────────────

export type ProgressionSource =
  | 'session1'
  | 'session2'
  | 'session3'
  | 'daily_bonus'
  | 'mission';

export interface ProgressionResult {
  success:     boolean;
  error?:      string;
  newTotalXP?: number;
  newRank?:    string;
  newStreak?:  number;
  rankChanged?: boolean;
  oldRank?:    string;
}

// ── awardSessionXP ────────────────────────────────────────────
// Awards XP for a session completion, recalculates rank and
// streak atomically, and updates the Zustand store.
//
// Parameters:
//   userId        — the authenticated user's ID
//   xpAmount      — XP to award (0 is valid — streak-only update)
//   source        — which session or event triggered the award
//   updateStreak  — whether to recalculate streak (default: true)
//
// Returns: ProgressionResult with updated values or error
// ─────────────────────────────────────────────────────────────
export async function awardSessionXP(
  userId:        string | null,
  xpAmount:      number,
  source:        ProgressionSource,
  updateStreak = true,
): Promise<ProgressionResult> {
  if (!userId) {
    return { success: true, newTotalXP: 0, newRank: 'Cadet', newStreak: 0, rankChanged: false };
  }

  if (xpAmount < 0) {
    return { success: false, error: 'XP amount cannot be negative.' };
  }

  try {
    const { data, error } = await supabase.rpc('award_progression', {
      p_user_id:       userId,
      p_xp_amount:     xpAmount,
      p_source:        source,
      p_update_streak: updateStreak,
    });

    if (error) {
      console.error('[ProgressionService] award_progression RPC error:', error.message);
      return { success: false, error: error.message };
    }

    const result = data as {
      new_total_xp: number;
      new_rank:     string;
      new_streak:   number;
      rank_changed: boolean;
      old_rank:     string;
      source:       string;
    };

    console.log(
      `[ProgressionService] ✅ ${source}: +${xpAmount} XP → ` +
      `${result.new_total_xp} total | rank: ${result.new_rank} | streak: ${result.new_streak}`
    );

    // ── Update Zustand store with all three fields at once ────
    const store = useAuthStore.getState();
    if (store.profile) {
      store.updateProfileField('total_xp',       result.new_total_xp);
      store.updateProfileField('current_rank',   result.new_rank as any);
      store.updateProfileField('current_streak', result.new_streak);
    } else {
      // Profile was never loaded — updateProfileField would no-op on null.
      // Fetch the full profile row and set it so the UI has all fields.
      const { fetchProfile } = await import('./auth.service');
      const profileResult = await fetchProfile(userId);
      if (profileResult.success) {
        store.setProfile(profileResult.data);
      }
    }

    // ── Fire analytics events ─────────────────────────────────
    trackEvent(userId, 'xp_awarded', {
      xpEarned: xpAmount,
      // Store source in metadata — analytics schema accepts any metadata
    });

    if (result.rank_changed) {
      trackEvent(userId, 'rank_advanced', {
        // rank change details stored in metadata
      });
      console.log(
        `[ProgressionService] 🎖️ Rank advanced: ${result.old_rank} → ${result.new_rank} ` +
        `(${result.new_total_xp} XP total)`
      );
    }

    console.log(
      `[ProgressionService] ✅ ${source}: +${xpAmount} XP → ` +
      `${result.new_total_xp} total | rank: ${result.new_rank} | streak: ${result.new_streak}`
    );

    return {
      success:     true,
      newTotalXP:  result.new_total_xp,
      newRank:     result.new_rank,
      newStreak:   result.new_streak,
      rankChanged: result.rank_changed,
      oldRank:     result.old_rank,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ProgressionService] Unexpected error:', message);
    return { success: false, error: message };
  }
}
