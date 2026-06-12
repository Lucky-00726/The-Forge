// ─────────────────────────────────────────────────────────────
// THE FORGE — useAuthInitializer
// Called ONCE in app/_layout.tsx.
// 1. Checks SecureStore for a persisted session on launch
// 2. Fetches the user profile if a session exists
// 3. Subscribes to onAuthStateChange for the app lifetime
// 4. Marks store as initialized when the check is complete
//
// FIXED: SIGNED_OUT handler now guards against calling
// clearAuth() when it has already been called by useAuth.logout().
// The double-call was harmless but produced a redundant Zustand
// state update that caused AuthGate's useEffect to fire twice,
// which on slower Android devices produced a visible navigation
// flicker (login screen flashed then immediately re-mounted).
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { fetchProfile } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

export function useAuthInitializer(): void {
  const {
    setSession,
    setUser,
    setProfile,
    setIsLoading,
    setIsInitialized,
    clearAuth,
  } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    // ── 1. Initial session check ────────────────────────────
    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setSession(session);
          setUser(session.user);

          const result = await fetchProfile(session.user.id);
          if (mounted && result.success) {
            setProfile(result.data);
          }
        }
        // If no session: store already has session=null from
        // INITIAL_STATE. No action needed.
      } catch (err) {
        if (__DEV__) {
          console.error('[useAuthInitializer] init error:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    }

    void initialize();

    // ── 2. Lifetime auth state listener ─────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            const result = await fetchProfile(session.user.id);
            if (mounted && result.success) {
              setProfile(result.data);
            }
          }
          break;

        case 'SIGNED_OUT':
        case 'USER_DELETED':
          // FIX: Only call clearAuth() if the store still has a
          // session. useAuth.logout() calls clearAuth() synchronously
          // before awaiting supabase.auth.signOut(). By the time
          // SIGNED_OUT fires here, clearAuth() has already run.
          // Calling it again is a no-op on state, but it triggers
          // a Zustand subscriber notification which causes AuthGate's
          // useEffect to fire a second time. On Android this produces
          // a navigation flicker. The getState() snapshot check
          // prevents the duplicate call.
          if (useAuthStore.getState().session !== null) {
            clearAuth();
          }
          break;

        default:
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}