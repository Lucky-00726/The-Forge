// ─────────────────────────────────────────────────────────────
// THE FORGE — Mission Store (Zustand)
// State machine for active mission execution.
// States: IDLE → ACTIVE → SUBMITTING → DONE → ERROR
// Written to only by useMissionEngine hook.
// Components read via selectors — never subscribe to full store.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { DbMission, MissionResponse } from '../types';

type MissionPhase = 'IDLE' | 'ACTIVE' | 'SUBMITTING' | 'DONE' | 'ERROR';

interface MissionStoreState {
  phase:         MissionPhase;
  mission:       DbMission | null;
  responses:     Partial<MissionResponse> | null;
  error:         string | null;
  submittedAt:   string | null; // ISO timestamp when submission completed
}

interface MissionStoreActions {
  setMission:    (mission: DbMission) => void;
  setPhase:      (phase: MissionPhase) => void;
  setResponses:  (responses: Partial<MissionResponse>) => void;
  setError:      (error: string) => void;
  clearError:    () => void;
  markSubmitted: () => void;
  reset:         () => void;
}

type MissionStore = MissionStoreState & MissionStoreActions;

const INITIAL_STATE: MissionStoreState = {
  phase:       'IDLE',
  mission:     null,
  responses:   null,
  error:       null,
  submittedAt: null,
};

export const useMissionStore = create<MissionStore>((set) => ({
  ...INITIAL_STATE,

  setMission:    (mission)    => set({ mission, phase: 'ACTIVE', error: null }),
  setPhase:      (phase)      => set({ phase }),
  setResponses:  (responses)  => set({ responses }),
  setError:      (error)      => set({ error, phase: 'ERROR' }),
  clearError:    ()           => set({ error: null }),
  markSubmitted: ()           => set({ submittedAt: new Date().toISOString(), phase: 'DONE' }),
  reset:         ()           => set(INITIAL_STATE),
}));

// ── Selectors ─────────────────────────────────────────────────
export const selectPhase       = (s: MissionStore) => s.phase;
export const selectMission     = (s: MissionStore) => s.mission;
export const selectResponses   = (s: MissionStore) => s.responses;
export const selectError       = (s: MissionStore) => s.error;
export const selectSubmittedAt = (s: MissionStore) => s.submittedAt;
export const selectIsSubmitting = (s: MissionStore) => s.phase === 'SUBMITTING';
export const selectIsActive     = (s: MissionStore) => s.phase === 'ACTIVE';
export const selectIsDone       = (s: MissionStore) => s.phase === 'DONE';

// ── Validation selectors ──────────────────────────────────────
// These tell the type components whether submission is allowed

export const selectCanSubmitReflectWrite = (
  s: MissionStore,
  wordCount: number,
  minWords: number,
): boolean => {
  return s.phase === 'ACTIVE' && wordCount >= minWords;
};

export const selectCanSubmitPollReasoning = (
  s: MissionStore,
  hasOption: boolean,
  wordCount: number,
  minWords: number,
): boolean => {
  return s.phase === 'ACTIVE' && hasOption && wordCount >= minWords;
};

export const selectCanSubmitDailyChallenge = (
  s: MissionStore,
  completed: boolean,
): boolean => {
  return s.phase === 'ACTIVE' && completed;
};
