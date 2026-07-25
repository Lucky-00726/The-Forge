// ─────────────────────────────────────────────────────────────
// THE FORGE — Auth Store (Zustand)
// Single global store for session state and user profile.
// Written to only by useAuthInitializer and useAuth hooks.
// Components read via selectors — never subscribe to full store.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { DbUser } from '../types';

interface AuthStoreState {
  session:       Session | null;
  user:          User | null;
  profile:       DbUser | null;
  isLoading:     boolean;
  isInitialized: boolean;
}

interface AuthStoreActions {
  setSession:       (session: Session | null) => void;
  setUser:          (user: User | null) => void;
  setProfile:       (profile: DbUser | null) => void;
  setIsLoading:     (loading: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  updateProfileField: <K extends keyof DbUser>(
    key: K,
    value: DbUser[K],
  ) => void;
  clearAuth: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

const INITIAL_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     true,
  isInitialized: false,
};

// DEC-015: Separate state for post-logout to prevent loading spinner
const LOGGED_OUT_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     false,
  isInitialized: true,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...INITIAL_STATE,

  setSession:       (session)       => set({ session }),
  setUser:          (user)          => set({ user }),
  setProfile:       (profile)       => set({ profile }),
  setIsLoading:     (isLoading)     => set({ isLoading }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),

  updateProfileField: (key, value) =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, [key]: value }
        : state.profile,
    })),

  clearAuth: () => {
    console.log('[LOGOUT TRACE] clearAuth: Setting LOGGED_OUT_STATE');
    set(LOGGED_OUT_STATE);
    console.log('[LOGOUT TRACE] clearAuth: State updated to:', LOGGED_OUT_STATE);
  },
}));

export const selectSession       = (s: AuthStore) => s.session;
export const selectUser          = (s: AuthStore) => s.user;
export const selectProfile       = (s: AuthStore) => s.profile;
export const selectIsLoading     = (s: AuthStore) => s.isLoading;
export const selectIsInitialized = (s: AuthStore) => s.isInitialized;
export const selectIsAuthenticated = (s: AuthStore) => s.session !== null;
export const selectUserId = (s: AuthStore) => s.user?.id ?? null;
export const selectDisplayName = (s: AuthStore) => s.profile?.display_name ?? '';
export const selectTotalXP = (s: AuthStore) => s.profile?.total_xp ?? 0;
export const selectCurrentRank = (s: AuthStore) => s.profile?.current_rank ?? 'Cadet';
export const selectCurrentStreak = (s: AuthStore) => s.profile?.current_streak ?? 0;
