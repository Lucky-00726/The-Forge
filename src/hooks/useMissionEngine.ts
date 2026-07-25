// ─────────────────────────────────────────────────────────────
// THE FORGE — useMissionEngine
// Mission execution hook: load, submit, navigate.
// Used by mission/[id].tsx screen.
// ─────────────────────────────────────────────────────────────
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  useMissionStore,
  selectPhase,
  selectMission,
  selectError,
  selectIsSubmitting,
} from '../store/mission.store';
import { useAuthStore } from '../store/auth.store';
import * as missionService from '../services/mission.service';
import type { MissionResponse } from '../types';

export function useMissionEngine() {
  const router = useRouter();

  const phase        = useMissionStore(selectPhase);
  const mission      = useMissionStore(selectMission);
  const error        = useMissionStore(selectError);
  const isSubmitting = useMissionStore(selectIsSubmitting);

  const {
    setMission,
    setPhase,
    setError,
    clearError,
    markSubmitted,
    reset,
  } = useMissionStore();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { updateProfileField } = useAuthStore();

  // ── Load mission by ID ────────────────────────────────────────
  const loadMission = useCallback(
    async (missionId: string) => {
      if (!userId) {
        setError('You must be signed in to view missions.');
        return false;
      }

      reset();
      setPhase('ACTIVE'); // Show loading state

      const result = await missionService.fetchMissionById(missionId);

      if (!result.success) {
        setError(result.error);
        return false;
      }

      setMission(result.data);
      return true;
    },
    [userId, setMission, setPhase, setError, reset],
  );

  // ── Submit mission ────────────────────────────────────────────
  const submitMission = useCallback(
    async (responses: MissionResponse) => {
      if (!userId || !mission) {
        setError('Cannot submit: missing user or mission data.');
        return false;
      }

      setPhase('SUBMITTING');
      clearError();

      // ✅ SECURE: Server determines XP and featured status
      const result = await missionService.completeMission({
        userId,
        missionId: mission.id,
        responses,
        // Server calculates XP from missions table
        // Server determines if this mission is featured
      });

      if (!result.success) {
        setError(result.error);
        return false;
      }

      // Mark mission as submitted in store
      markSubmitted();

      // Optimistically update auth store profile fields
      // (avoid full profile refetch for immediate UI update)
      updateProfileField('total_xp', result.data.new_total_xp);
      updateProfileField('current_streak', result.data.new_streak);
      updateProfileField('current_rank', result.data.new_rank);

      // Navigate to success screen with result params
      router.push({
        pathname: '/mission/success',
        params: {
          xp_awarded:   result.data.xp_awarded.toString(),
          new_total_xp: result.data.new_total_xp.toString(),
          new_streak:   result.data.new_streak.toString(),
          new_rank:     result.data.new_rank,
          mission_title: mission.title,
          is_featured:  result.data.is_featured.toString(), // Server-determined
        },
      });

      return true;
    },
    [
      userId,
      mission,
      setPhase,
      setError,
      clearError,
      markSubmitted,
      updateProfileField,
      router,
    ],
  );

  // ── Retry after error ─────────────────────────────────────────
  const retry = useCallback(() => {
    if (mission) {
      setPhase('ACTIVE');
      clearError();
    }
  }, [mission, setPhase, clearError]);

  return {
    phase,
    mission,
    error,
    isSubmitting,
    loadMission,
    submitMission,
    retry,
    reset,
  };
}
