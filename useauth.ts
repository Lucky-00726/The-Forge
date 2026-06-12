// ─────────────────────────────────────────────────────────────
// THE FORGE — useAuth Hook
// The ONLY hook that auth screens should import.
// Wraps auth service calls with loading state, error handling,
// and post-action navigation.
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  signIn,
  signUp,
  signOut,
  sendPasswordReset,
} from '../services/auth.service';
import {
  useAuthStore,
  selectSession,
  selectProfile,
  selectIsAuthenticated,
  selectDisplayName,
  selectTotalXP,
  selectCurrentRank,
  selectCurrentStreak,
} from '../store/auth.store';
import type { SignupForm } from '../types';

export function useAuth() {
  const router = useRouter();

  // ── Store reads ────────────────────────────────────────────
  const session         = useAuthStore(selectSession);
  const profile         = useAuthStore(selectProfile);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const displayName     = useAuthStore(selectDisplayName);
  const totalXP         = useAuthStore(selectTotalXP);
  const currentRank     = useAuthStore(selectCurrentRank);
  const currentStreak   = useAuthStore(selectCurrentStreak);

  // Read clearAuth action directly — used imperatively in logout
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // ── Local action state ─────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── Login ──────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await signIn(email, password);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error);
        return false;
      }

      // Navigation is handled by the AuthGate in _layout.tsx
      // which reacts to the session change via onAuthStateChange
      return true;
    },
    [],
  );

  // ── Sign up ────────────────────────────────────────────────
  const register = useCallback(
    async (form: SignupForm): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await signUp(form);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error);
        return false;
      }

      return true;
    },
    [],
  );

  // ── Logout ─────────────────────────────────────────────────
  // FIX: Three changes from the original broken version:
  //
  // 1. clearAuth() is called IMMEDIATELY before the async signOut()
  //    call completes. This wipes the Zustand store synchronously,
  //    so AuthGate sees session === null and redirects without
  //    waiting for the Supabase network round-trip or the
  //    onAuthStateChange listener to fire.
  //
  // 2. signOut() result is checked. If Supabase returns an error
  //    (e.g. network failure), the store is already cleared so the
  //    user is redirected regardless — a failed signOut on the
  //    server doesn't keep the user trapped in the app. The error
  //    is logged for debugging.
  //
  // 3. router.replace() is called explicitly as a safety net.
  //    AuthGate will also redirect, but explicit navigation ensures
  //    correct behaviour even if the gate's useEffect fires late
  //    due to React Native's async rendering batching.
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    // Step 1: Wipe local state immediately — do not wait for network
    clearAuth();

    // Step 2: Tell Supabase to invalidate the server-side session.
    // We fire-and-don't-block: even if this fails, the local session
    // is already gone so the user cannot access protected data.
    const result = await signOut();

    if (!result.success && __DEV__) {
      // Non-fatal: local state is cleared regardless.
      // Server token will expire naturally.
      console.warn('[logout] Supabase signOut failed:', result.error);
    }

    setIsLoading(false);

    // Step 3: Explicit redirect as a safety net alongside AuthGate
    router.replace('/(auth)/login');
  }, [clearAuth, router]);

  // ── Forgot password ────────────────────────────────────────
  const forgotPassword = useCallback(
    async (email: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      const result = await sendPasswordReset(email);

      setIsLoading(false);

      if (!result.success) {
        setError(result.error);
        return false;
      }

      router.push('/(auth)/check-email');
      return true;
    },
    [router],
  );

  return {
    // State
    session,
    profile,
    isAuthenticated,
    isLoading,
    error,

    // Derived profile fields (avoids null checks in every component)
    displayName,
    totalXP,
    currentRank,
    currentStreak,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    clearError,
  };
}