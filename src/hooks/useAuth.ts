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
    setIsLoading(true);
    setError(null);
    const result = await authService.signOut();
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
      return false;
    }
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
