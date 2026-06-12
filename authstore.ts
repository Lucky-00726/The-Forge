// ─────────────────────────────────────────────────────────────
// THE FORGE — Auth Store (Zustand)
// Single global store for session state and user profile.
// Written to only by useAuthInitializer and useAuth hooks.
// Components read via selectors — never subscribe to full store.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { DbUser } from '../types';

// ── State shape ───────────────────────────────────────────────
interface AuthStoreState {
  // Supabase auth state
  session:       Session | null;
  user:          User | null;

  // App profile (public.users row)
  profile:       DbUser | null;

  // Boot state
  isLoading:     boolean;   // true until first getSession() resolves
  isInitialized: boolean;   // true after first session check complete
}

// ── Actions ───────────────────────────────────────────────────
interface AuthStoreActions {
  setSession:       (session: Session | null) => void;
  setUser:          (user: User | null) => void;
  setProfile:       (profile: DbUser | null) => void;
  setIsLoading:     (loading: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;

  /** Optimistically update a single profile field without a refetch */
  updateProfileField: <K extends keyof DbUser>(
    key: K,
    value: DbUser[K],
  ) => void;

  /** Wipe all auth state (called on sign-out) */
  clearAuth: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

// ── Initial state (used only at store creation) ───────────────
// NOTE: Do NOT use INITIAL_STATE inside clearAuth().
// INITIAL_STATE.isLoading is true (correct for boot).
// After logout, isLoading must be false — the app is fully
// initialized, just unauthenticated. Spreading INITIAL_STATE
// into clearAuth would briefly flash the loading spinner and
// could cause AuthGate to show the loader instead of login.
const INITIAL_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     true,    // starts loading — only correct at boot
  isInitialized: false,
};

// ── Explicit post-logout state ────────────────────────────────
// Separated from INITIAL_STATE to make the distinction obvious.
// After logout: initialized (app has booted), not loading, no session.
const LOGGED_OUT_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     false,   // FIX: must be false post-logout
  isInitialized: true,    // FIX: must be true — app is already initialized
};

// ── Store ─────────────────────────────────────────────────────
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

  // FIX: Use LOGGED_OUT_STATE, not INITIAL_STATE.
  // This ensures AuthGate sees isInitialized=true and isLoading=false
  // immediately after clearAuth(), so it can redirect to login
  // without hitting the spinner condition.
  clearAuth: () => set(LOGGED_OUT_STATE),
}));

// ── Selectors ─────────────────────────────────────────────────
// Use these in components instead of reading store fields directly.
// Prevents unnecessary re-renders when unrelated state changes.

export const selectSession       = (s: AuthStore) => s.session;
export const selectUser          = (s: AuthStore) => s.user;
export const selectProfile       = (s: AuthStore) => s.profile;
export const selectIsLoading     = (s: AuthStore) => s.isLoading;
export const selectIsInitialized = (s: AuthStore) => s.isInitialized;

export const selectIsAuthenticated = (s: AuthStore) =>
  s.session !== null;

export const selectUserId = (s: AuthStore) =>
  s.user?.id ?? null;

export const selectDisplayName = (s: AuthStore) =>
  s.profile?.display_name ?? '';

export const selectTotalXP = (s: AuthStore) =>
  s.profile?.total_xp ?? 0;

export const selectCurrentRank = (s: AuthStore) =>
  s.profile?.current_rank ?? 'Cadet';

export const selectCurrentStreak = (s: AuthStore) =>
  s.profile?.current_streak ?? 0;