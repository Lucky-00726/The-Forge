// ─────────────────────────────────────────────────────────────
// THE FORGE — useAuthInitializer
// Called ONCE from the single root layout: app/(auth)/_layout.tsx
//
// Responsibilities:
//   1. Restore session from SecureStore on cold start
//   2. Fetch user profile after session is confirmed
//   3. Listen for auth state changes (token refresh, sign-out)
//   4. Re-check session on warm resume (AppState active)
//   5. Always call setIsInitialized(true) — never leave the app
//      stuck on the loading spinner regardless of network state
//
// Timeout protection (P0 fix):
//   getSession() and fetchProfile() both have a 10-second timeout.
//   If either hangs (slow/no network), the finally block still fires
//   and the app proceeds with whatever state is available.
//   This eliminates the "stuck spinner on app reopen" bug.
//
// Single-instance guarantee:
//   This hook must only be called from ONE layout. Calling it from
//   multiple layouts registers duplicate onAuthStateChange listeners
//   and causes concurrent store writes. app/(auth)/_layout.tsx is
//   the canonical location. app/_layout.tsx must NOT call this hook.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '../services/supabase';
import { fetchProfile } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

// Maximum milliseconds to wait for getSession() or fetchProfile().
// On slow/no network the Supabase SDK can hang indefinitely.
// After this deadline we proceed with whatever state is available
// so the app never shows an infinite spinner.
const INIT_TIMEOUT_MS = 10_000;

// Wrap a promise with a timeout. If the timeout fires first the
// promise resolves to null rather than rejecting — callers treat
// null as "no data available" and continue gracefully.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export function useAuthInitializer(): void {
  const {
    setSession,
    setUser,
    setProfile,
    setIsLoading,
    setIsInitialized,
    clearAuth,
  } = useAuthStore();

  // Track whether the component is still mounted to guard all
  // async callbacks and prevent setting state on an unmounted hook.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // ── Cold-start / process-restart session restoration ──────
    async function initialize() {
      console.log('[STARTUP][AuthInit] Starting initialize()');
      try {
        console.log('[STARTUP][AuthInit] Getting session...');
        const sessionResult = await withTimeout(
          supabase.auth.getSession(),
          INIT_TIMEOUT_MS,
        );

        if (!mountedRef.current) {
          console.log('[STARTUP][AuthInit] Component unmounted during getSession');
          return;
        }

        console.log('[STARTUP][AuthInit] Session query completed. Success:', !!sessionResult);
        const session = sessionResult?.data?.session ?? null;
        console.log('[STARTUP][AuthInit] Session present:', !!session);

        if (session?.user) {
          console.log('[STARTUP][AuthInit] User logged in:', session.user.id);
          setSession(session);
          setUser(session.user);

          console.log('[STARTUP][AuthInit] Fetching user profile...');
          const profileResult = await withTimeout(
            fetchProfile(session.user.id),
            INIT_TIMEOUT_MS,
          );

          if (mountedRef.current) {
            if (profileResult?.success) {
              console.log('[STARTUP][AuthInit] Profile loaded successfully');
              setProfile(profileResult.data);
            } else {
              console.error('[STARTUP][AuthInit] Profile fetch failed/timed out');
            }
          }
        } else {
          console.log('[STARTUP][AuthInit] No active session found');
        }
      } catch (err: any) {
        console.error('[AuthInit] init error:', err.message);
      } finally {
        if (mountedRef.current) {
          console.log('[STARTUP][AuthInit] Invoking setIsInitialized(true)');
          setIsLoading(false);
          setIsInitialized(true);
          const finalStore = useAuthStore.getState();

          // Profile null safety net — if fetchProfile timed out on first try,
          // retry without a timeout now that isInitialized is set.
          if (finalStore.profile === null && finalStore.user?.id) {
            console.log('[STARTUP][AuthInit] Retrying profile fetch in background');
            fetchProfile(finalStore.user.id).then((retryResult) => {
              if (retryResult.success && mountedRef.current) {
                console.log('[STARTUP][AuthInit] Background profile fetch succeeded');
                setProfile(retryResult.data);
              }
            });
          }
        } else {
          console.log('[STARTUP][AuthInit] Component unmounted during finally block');
        }
      }
    }

    void initialize();

    // ── Auth state change listener (singleton) ───────────────
    // Handles: login, token refresh, sign-out, password change.
    // Registered once for the app's lifetime; unsubscribed on
    // layout unmount (which only happens on full process exit).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED': {
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            const profileResult = await withTimeout(
              fetchProfile(session.user.id),
              INIT_TIMEOUT_MS,
            );
            if (mountedRef.current && profileResult?.success) {
              setProfile(profileResult.data);
            }
          }
          break;
        }

        case 'SIGNED_OUT':
          clearAuth();
          break;

        default:
          break;
      }
    });

    // ── Warm-resume session check (AppState listener) ─────────
    // When Android/iOS brings the app back from background the JS
    // process may have been kept alive but the session token may
    // have expired while backgrounded. Supabase's autoRefreshToken
    // handles most cases, but this is a safety net:
    //   • If autoRefresh fired → onAuthStateChange already handled it
    //   • If autoRefresh missed (process suspended) → we re-check here
    //
    // On resume we call getSession() (with timeout) to ensure the
    // store reflects the current session state. If the token is
    // stale and cannot be refreshed, SIGNED_OUT fires via the
    // onAuthStateChange listener above.
    let lastAppState: AppStateStatus = AppState.currentState;

    const appStateSubscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (lastAppState !== 'active' && nextState === 'active') {
          lastAppState = nextState;

          if (!mountedRef.current) return;

          // Re-check session without blocking UI — fire-and-forget.
          // The store will be updated via onAuthStateChange if the
          // session state has changed.
          const sessionResult = await withTimeout(
            supabase.auth.getSession(),
            INIT_TIMEOUT_MS,
          );

          if (!mountedRef.current) return;

          const session = sessionResult?.data?.session ?? null;

          if (!session) {
            // Session expired or was revoked while in background.
            // clearAuth triggers AuthGate to redirect to login.
            clearAuth();
          }
        } else {
          lastAppState = nextState;
        }
      },
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
