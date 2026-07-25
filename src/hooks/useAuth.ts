// ─────────────────────────────────────────────────────────────
// THE FORGE — useAuth
// Auth actions and profile selectors for screens.
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import {
  useAuthStore,
  selectProfile,
  selectDisplayName,
  selectTotalXP,
  selectCurrentRank,
  selectCurrentStreak,
} from '../store/auth.store';
import * as authService from '../services/auth.service';
import type { SignupForm } from '../types';

export function useAuth() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const profile       = useAuthStore(selectProfile);
  const displayName   = useAuthStore(selectDisplayName);
  const totalXP       = useAuthStore(selectTotalXP);
  const currentRank   = useAuthStore(selectCurrentRank);
  const currentStreak = useAuthStore(selectCurrentStreak);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signIn(email, password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    return true;
  }, []);

  const register = useCallback(async (form: SignupForm) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signUp(form);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    return true;
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.sendPasswordReset(email);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async () => {
    console.log('[LOGOUT TRACE] Step 4: logout() executing');
    setIsLoading(true);
    setError(null);
    
    // DEC-016: Clear Zustand state synchronously BEFORE network call
    // This ensures immediate redirect regardless of network conditions
    console.log('[LOGOUT TRACE] Step 5: Calling clearAuth()');
    useAuthStore.getState().clearAuth();
    console.log('[LOGOUT TRACE] Step 6: clearAuth() completed');
    
    console.log('[LOGOUT TRACE] Step 7: Calling authService.signOut()');
    const result = await authService.signOut();
    console.log('[LOGOUT TRACE] Step 8: authService.signOut() returned:', result);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
    console.log('[LOGOUT TRACE] Step 9: logout() about to return true');
    return true;
  }, []);

  return {
    profile,
    displayName,
    totalXP,
    currentRank,
    currentStreak,
    login,
    register,
    forgotPassword,
    logout,
    isLoading,
    error,
    clearError,
  };
}
