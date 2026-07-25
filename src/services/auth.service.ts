// ─────────────────────────────────────────────────────────────
// THE FORGE — Auth Service
// All Supabase Auth calls live here.
// Components never import supabase directly for auth.
// Returns typed AsyncResult — never throws.
// ─────────────────────────────────────────────────────────────
import { supabase } from './supabase';
import type { AsyncResult, DbUser, SignupForm } from '../types';
import { todayIST, yesterdayIST } from '../utils/date';

// ── Error normalisation ───────────────────────────────────────
function normalizeError(error: unknown): string {
  if (!(error instanceof Error)) return 'An unexpected error occurred.';

  const msg = error.message.toLowerCase();

  if (msg.includes('invalid login credentials'))
    return 'Incorrect email or password.';
  if (msg.includes('email not confirmed'))
    return 'Please verify your email first.';
  if (msg.includes('user already registered'))
    return 'An account with this email already exists.';
  if (msg.includes('password should be at least'))
    return 'Password must be at least 6 characters.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Network error. Check your connection.';
  if (msg.includes('too many requests'))
    return 'Too many attempts. Please wait a moment.';
  if (msg.includes('email rate limit'))
    return 'Too many emails sent. Please wait before trying again.';

  return error.message;
}

// ── Sign up ───────────────────────────────────────────────────
export async function signUp(
  form: SignupForm,
): Promise<AsyncResult<void>> {
  // 1. Create auth user
  const { data, error: authError } = await supabase.auth.signUp({
    email:    form.email.trim().toLowerCase(),
    password: form.password,
  });

  if (authError) return { success: false, error: normalizeError(authError) };
  if (!data.user) return { success: false, error: 'Signup failed. Try again.' };

  // 2. Update display_name on the profile row created by the trigger
  const { error: profileError } = await supabase
    .from('users')
    .update({ display_name: form.display_name.trim() })
    .eq('id', data.user.id);

  if (profileError) {
    // Non-fatal: auth succeeded, profile name can be updated later
    console.warn('[signUp] profile update failed:', profileError.message);
  }

  return { success: true, data: undefined };
}

// ── Sign in ───────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string,
): Promise<AsyncResult<void>> {
  const { error } = await supabase.auth.signInWithPassword({
    email:    email.trim().toLowerCase(),
    password,
  });

  if (error) return { success: false, error: normalizeError(error) };
  return { success: true, data: undefined };
}

// ── Sign out ──────────────────────────────────────────────────
// NOTE: This function is intentionally NOT responsible for
// clearing local Zustand state. That is useAuth.logout()'s job.
// This function's only concern: tell Supabase to invalidate
// the server-side session and wipe the SecureStore token.
//
// Even if this call fails (e.g. no network), the local token
// in SecureStore must still be cleared so the user is not
// silently kept "logged in" on next boot. Supabase handles
// this internally — signOut() removes the token from the
// configured storage adapter regardless of server response.
export async function signOut(): Promise<AsyncResult<void>> {
  console.log('[LOGOUT TRACE] authService.signOut: Calling supabase.auth.signOut()');
  const { error } = await supabase.auth.signOut();
  console.log('[LOGOUT TRACE] authService.signOut: supabase.auth.signOut() completed, error:', error);

  // A 403 from Supabase on signOut means the session was already
  // invalid server-side. This is not an error from the user's
  // perspective — the local token cleanup still happened.
  if (error && !error.message.includes('403')) {
    console.log('[LOGOUT TRACE] authService.signOut: Returning error:', error.message);
    return { success: false, error: normalizeError(error) };
  }

  console.log('[LOGOUT TRACE] authService.signOut: Returning success');
  return { success: true, data: undefined };
}

// ── Forgot password ───────────────────────────────────────────
export async function sendPasswordReset(
  email: string,
): Promise<AsyncResult<void>> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: 'theforge://auth/reset-password' },
  );

  if (error) return { success: false, error: normalizeError(error) };
  return { success: true, data: undefined };
}

// ── Fetch profile ─────────────────────────────────────────────
export async function fetchProfile(
  userId: string,
): Promise<AsyncResult<DbUser>> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? 'Profile not found.',
    };
  }

  return { success: true, data: data as DbUser };
}

// ── Get current session (for boot check) ─────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ── Award XP (for Day 0 validation) ───────────────────────────
// TEMPORARY FUNCTION FOR DAY 0 PROTOTYPE
// Replace with proper training completion flow in V2
export async function awardXP(
  userId: string,
  xpAmount: number,
): Promise<AsyncResult<void>> {
  // Fetch current profile
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('total_xp')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return {
      success: false,
      error: fetchError?.message ?? 'Could not fetch profile.',
    };
  }

  // Calculate new total
  const newTotalXP = profile.total_xp + xpAmount;

  // Update profile
  const { error: updateError } = await supabase
    .from('users')
    .update({ total_xp: newTotalXP })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: normalizeError(updateError) };
  }

  return { success: true, data: undefined };
}

// ── Update daily streak ───────────────────────────────────────
// Marks the user as active "today" (IST) and updates current_streak.
// Idempotent per day: calling it multiple times on the same IST day
// does NOT increment the streak again. Mirrors the streak rule used by
// the mission complete_mission() RPC so both systems behave identically:
//   - last_active == today      → unchanged (already counted today)
//   - last_active == yesterday  → +1 (consecutive day)
//   - last_active == null       → 1 (first ever activity)
//   - older / gap > 1 day       → reset to 1
export async function updateStreak(
  userId: string,
): Promise<AsyncResult<{ current_streak: number; last_active_date: string; changed: boolean }>> {
  const today = todayIST();

  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('current_streak, last_active_date')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    return {
      success: false,
      error: fetchError?.message ?? 'Could not fetch profile.',
    };
  }

  // Already marked active today → no change (prevents multi-increment per day)
  if (profile.last_active_date === today) {
    return {
      success: true,
      data: { current_streak: profile.current_streak, last_active_date: today, changed: false },
    };
  }

  const newStreak =
    profile.last_active_date === yesterdayIST()
      ? profile.current_streak + 1 // consecutive day
      : 1; // first activity ever, or a gap longer than one day → reset

  const { error: updateError } = await supabase
    .from('users')
    .update({ current_streak: newStreak, last_active_date: today })
    .eq('id', userId);

  if (updateError) {
    return { success: false, error: normalizeError(updateError) };
  }

  return {
    success: true,
    data: { current_streak: newStreak, last_active_date: today, changed: true },
  };
}