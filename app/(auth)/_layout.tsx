// ─────────────────────────────────────────────────────────────
// THE FORGE — Authoritative Root Layout
// app/(auth)/_layout.tsx
//
// This is the ONLY layout that:
//   • Calls useAuthInitializer() — registers auth listeners once
//   • Manages SplashScreen lifecycle
//   • Gates navigation via AuthGate
//   • Handles onboarding redirect on first login
//
// app/_layout.tsx is intentionally a thin <Slot /> shell.
// ─────────────────────────────────────────────────────────────
import 'react-native-url-polyfill/auto'; // MUST be first import

import React, { useEffect, useCallback, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

import { useAuthInitializer } from '@/hooks/useAuthInitializer';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/tokens';

// Hold splash screen until fonts + auth are ready.
// Called at module scope — fires exactly once per process lifetime.
SplashScreen.preventAutoHideAsync();

const ONBOARDING_FLAG = 'forge_onboarding_complete';

// ── Auth gate ─────────────────────────────────────────────────
function AuthGate() {
  const router   = useRouter();
  const segments = useSegments();

  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session       = useAuthStore((s) => s.session);

  // Onboarding flag — read once from SecureStore after session is known.
  // Uses a 2-second timeout so a SecureStore hang never blocks navigation.
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding,   setNeedsOnboarding]   = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      // Timeout safety: if SecureStore hangs, assume onboarding done
      // so users are never permanently blocked.
      if (active && !onboardingChecked) {
        setNeedsOnboarding(false);
        setOnboardingChecked(true);
      }
    }, 2_000);

    (async () => {
      try {
        const done = await SecureStore.getItemAsync(ONBOARDING_FLAG);
        if (active) setNeedsOnboarding(done !== 'true');
      } catch {
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
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Logged in but still on an auth screen → route appropriately
    if (session && inAuthGroup) {
      if (!onboardingChecked) return; // wait for the flag (max 2s)
      router.replace(needsOnboarding ? '/onboarding' : '/(tabs)');
    }

    // Logged in and already past the auth group → leave navigation alone.
  }, [isInitialized, session, segments, router, onboardingChecked, needsOnboarding]);

  // Show spinner only during initial boot (before isInitialized fires).
  // After that — including after logout — isInitialized stays true,
  // so users never see a spurious spinner on sign-out.
  if (!isInitialized) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

// ── Root export ───────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Add font loading here if needed, or remove useFonts if not using custom fonts
  });

  // Initialize auth session listener — runs once for app lifetime
  useAuthInitializer();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are ready
  if (!fontsLoaded && !fontError) return null;

  const BoundStatusBar = StatusBar as any;

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