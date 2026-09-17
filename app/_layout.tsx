// ─────────────────────────────────────────────────────────────
// THE FORGE — Authoritative Root Layout
// app/_layout.tsx
//
// This is the absolute root wrapper. All auth logic, session
// initialization, and AuthGate navigation live here so they run
// regardless of route or group.
// ─────────────────────────────────────────────────────────────
import 'react-native-url-polyfill/auto'; // MUST be first import

import React, { useEffect, useCallback, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

import { useAuthInitializer } from '../src/hooks/useAuthInitializer';
import { useAuthStore } from '../src/store/auth.store';
import { Colors } from '../src/constants/tokens';

// Hold splash screen until auth is ready.
console.log('[STARTUP] Module evaluating: app/_layout.tsx');
try {
  console.log('[STARTUP] Calling SplashScreen.preventAutoHideAsync() in app/_layout.tsx');
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.error('[STARTUP] SplashScreen.preventAutoHideAsync() in app/_layout.tsx failed:', e);
}

const ONBOARDING_FLAG = 'forge_onboarding_complete';

// ── Auth gate ─────────────────────────────────────────────────
function AuthGate() {
  console.log('[STARTUP] Rendering AuthGate');
  const router   = useRouter();
  const segments = useSegments();

  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session       = useAuthStore((s) => s.session);

  console.log('[STARTUP] AuthGate State - isInitialized:', isInitialized, 'hasSession:', !!session);

  // Onboarding flag — read once from SecureStore after session is known.
  // Uses a 2-second timeout so a SecureStore hang never blocks navigation.
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding,   setNeedsOnboarding]   = useState(false);

  useEffect(() => {
    console.log('[STARTUP] AuthGate useEffect - reading SecureStore onboarding flag');
    let active = true;
    const timer = setTimeout(() => {
      // Timeout safety: if SecureStore hangs, assume onboarding done
      // so users are never permanently blocked.
      if (active && !onboardingChecked) {
        console.warn('[STARTUP] AuthGate onboarding check TIMED OUT (SecureStore hung?)');
        setNeedsOnboarding(false);
        setOnboardingChecked(true);
      }
    }, 2_000);

    (async () => {
      try {
        console.log('[STARTUP] SecureStore.getItemAsync started');
        const done = await SecureStore.getItemAsync(ONBOARDING_FLAG);
        console.log('[STARTUP] SecureStore.getItemAsync completed, val:', done);
        if (active) setNeedsOnboarding(done !== 'true');
      } catch (err: any) {
        console.error('[STARTUP] SecureStore.getItemAsync failed:', err.message);
        if (active) setNeedsOnboarding(false);
      } finally {
        clearTimeout(timer);
        if (active) setOnboardingChecked(true);
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log('[STARTUP] AuthGate navigation useEffect - isInitialized:', isInitialized, 'onboardingChecked:', onboardingChecked);
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    console.log('[STARTUP] AuthGate segments:', segments, 'inAuthGroup:', inAuthGroup);

    if (!session) {
      if (!inAuthGroup) {
        console.log('[STARTUP] AuthGate redirecting to /(auth)/login');
        router.replace('/(auth)/login');
      }
      return;
    }

    // Logged in but still on an auth screen → route appropriately
    if (session && inAuthGroup) {
      if (!onboardingChecked) {
        console.log('[STARTUP] AuthGate waiting for onboarding check before routing');
        return;
      } // wait for the flag (max 2s)
      const target = needsOnboarding ? '/onboarding' : '/(tabs)';
      console.log('[STARTUP] AuthGate redirecting to:', target);
      router.replace(target);
    }
  }, [isInitialized, session, segments, router, onboardingChecked, needsOnboarding]);

  // Show spinner only during initial boot (before isInitialized fires).
  if (!isInitialized) {
    console.log('[STARTUP] AuthGate is not initialized. Rendering loader.');
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  console.log('[STARTUP] AuthGate initialized. Rendering Slot.');
  return <Slot />;
}

// ── Root Layout ───────────────────────────────────────────────
export default function RootLayout() {
  console.log('[STARTUP] Rendering RootLayout');

  // Initialize auth session listener — runs once for app lifetime
  useAuthInitializer();

  const onLayoutRootView = useCallback(async () => {
    console.log('[STARTUP] RootLayout onLayoutRootView called');
    try {
      console.log('[STARTUP] Hiding SplashScreen');
      await SplashScreen.hideAsync();
      console.log('[STARTUP] SplashScreen hidden');
    } catch (e) {
      console.error('[STARTUP] SplashScreen.hideAsync failed:', e);
    }
  }, []);

  const BoundStatusBar = StatusBar as any;

  console.log('[STARTUP] RootLayout rendering container View');
  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <BoundStatusBar style="light" backgroundColor={Colors.bgBase} />
      <AuthGate />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.bgBase,
  },
  loader: {
    flex:            1,
    backgroundColor: Colors.bgBase,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
