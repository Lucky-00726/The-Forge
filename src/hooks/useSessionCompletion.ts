// ─────────────────────────────────────────────────────────────
// THE FORGE — useSessionCompletion
// Owns the isSessionCompleted → markSessionCompleted → awardSessionXP
// sequence shared by every session completion screen, and surfaces
// the day / program transition data that complete_daily_session
// returns so a screen can render it instead of discarding it.
// ─────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  isSessionCompleted,
  markSessionCompleted,
  type SessionNumber,
} from '../services/daily-session.service';
import { awardSessionXP, type ProgressionSource } from '../services/progression.service';
import { trackEvent, type AnalyticsEvent } from '../services/analytics.service';

export function useSessionCompletion({
  userId,
  sessionNumber,
  xpEarned,
  score,
  total,
  completionTimeSeconds,
  difficulty,
}: {
  userId: string | null;
  sessionNumber: SessionNumber;
  xpEarned: number;
  score: number | null;
  total: number;
  completionTimeSeconds: number;
  difficulty: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // isReview is true when this session was already completed today.
  // In review mode: no XP is awarded, no DB writes occur.
  const [isReview, setIsReview] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [dayAdvanced, setDayAdvanced] = useState(false);
  const [newTrainingDay, setNewTrainingDay] = useState<number | null>(null);
  const [programCompleted, setProgramCompleted] = useState(false);

  const save = useCallback(async () => {
    if (!userId) {
      setSaved(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // ── Mode gate: check whether this session is already completed ──
      // BUG-001 / BUG-002 fix: never award XP twice.
      const alreadyDone = await isSessionCompleted(userId, sessionNumber);

      if (alreadyDone) {
        // Mode B: Review mode — read-only, no DB writes, no XP
        setIsReview(true);
        setSaved(true);
        return;
      }

      // Mode A: First completion today ──────────────────────────────
      // Mark completion before awarding XP: complete_daily_session is
      // idempotent, so if the XP call below fails, the session is
      // still recorded as done and a retry can only ever award XP once.
      const completion = await markSessionCompleted(
        userId,
        sessionNumber,
        xpEarned,
        score,
        total,
        completionTimeSeconds,
        difficulty,
      );

      if (!completion) {
        setError('Failed to save progress. Please try again.');
        return;
      }

      setStatus(completion.status);
      setDayAdvanced(completion.dayAdvanced);
      setNewTrainingDay(completion.newTrainingDay);
      setProgramCompleted(completion.programCompleted);

      if (completion.status === 'already_completed') {
        // Race: completed by another call between the pre-check above and this RPC.
        setIsReview(true);
        setSaved(true);
        return;
      }

      if (completion.status !== 'completed') {
        // program_completed or day_mismatch — no XP to award.
        setSaved(true);
        return;
      }

      const source = `session${sessionNumber}` as ProgressionSource;
      const result = await awardSessionXP(userId, xpEarned, source);

      if (!result.success) {
        console.error(`[useSessionCompletion] awardSessionXP failed (S${sessionNumber}):`, result.error);
        setError(result.error ?? 'Failed to save progress. Please try again.');
        return;
      }

      const completionEvent = `session${sessionNumber}_completed` as AnalyticsEvent;
      trackEvent(userId, completionEvent);

      setSaved(true);
    } catch (err) {
      console.error(`[useSessionCompletion] Unexpected error (S${sessionNumber}):`, err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [userId, sessionNumber, xpEarned, score, total, completionTimeSeconds, difficulty]);

  useEffect(() => {
    void save();
    // Run once per screen mount, the same as the saveXP() effects this
    // hook replaces — re-running on every render would re-award XP.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    saving,
    saved,
    isReview,
    error,
    dayAdvanced,
    newTrainingDay,
    programCompleted,
    status,
    retry: save,
  };
}
