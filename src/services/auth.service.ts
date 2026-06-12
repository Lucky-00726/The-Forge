// ─────────────────────────────────────────────────────────────
// THE FORGE — Auth Service
// All Supabase Auth calls live here.
// Components never import supabase directly for auth.
// Returns typed AsyncResult — never throws.
// ─────────────────────────────────────────────────────────────
import { supabase } from './supabase';
import type { AsyncResult, DbUser, SignupForm } from '../types';

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
  const { error } = await supabase.auth.signOut();

  // A 403 from Supabase on signOut means the session was already
  // invalid server-side. This is not an error from the user's
  // perspective — the local token cleanup still happened.
  if (error && !error.message.includes('403')) {
    return { success: false, error: normalizeError(error) };
  }

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