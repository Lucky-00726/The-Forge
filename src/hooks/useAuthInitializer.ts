// ─────────────────────────────────────────────────────────────
// THE FORGE — useAuthInitializer
// Called ONCE in app/_layout.tsx.
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
          clearAuth();
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
