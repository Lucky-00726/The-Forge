// ─────────────────────────────────────────────────────────────
// THE FORGE — Root Layout
// app/_layout.tsx
//
// Responsibilities (in order):
//   1. Apply URL polyfill (must be first import)
//   2. Load custom fonts via expo-font
//   3. Initialize auth session (useAuthInitializer)
//   4. Gate navigation based on session state
//   5. Set StatusBar to light theme
//
// FIXED: AuthGate no longer depends on `profile` in its effect.
// Profile loading is async after session is confirmed; including
// it caused spurious re-runs and could race with logout.
// AuthGate only needs: isInitialized + session.
// ─────────────────────────────────────────────────────────────
import 'react-native-url-polyfill/auto'; // MUST be first import

import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthInitializer } from '@/hooks/useAuthInitializer';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/tokens';
// Hold splash screen until fonts are loaded
SplashScreen.preventAutoHideAsync();

// ── Auth gate ─────────────────────────────────────────────────
function AuthGate() {
  const router   = useRouter();
  const segments = useSegments();

  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session       = useAuthStore((s) => s.session);

  // FIX: `profile` removed from this component and from the
  // dependency array below. Reasons:
  //
  // 1. profile can be null for a brief moment after login while
  //    fetchProfile() is in flight. With profile in deps, the
  //    effect fired during that window and could redirect to login
  //    even though a valid session existed.
  //
  // 2. During logout, clearAuth() sets both session → null AND
  //    profile → null atomically. Adding profile to deps caused
  //    the effect to run twice — once for profile=null, once for
  //    session=null — which could trigger duplicate router.replace
  //    calls and leave the navigation stack in a broken state on
  //    Android.
  //
  // AuthGate's job is: "is there a session?" Full stop.
  // Profile availability is the concern of individual screens.

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      // No session → force to login from anywhere except auth screens.
      // This fires immediately when clearAuth() is called because
      // session is now null and isInitialized is still true.
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Has a valid session → must not be on an auth screen
    if (inAuthGroup) {
      router.replace('/(tabs)');
    }

    // Has session and is in (tabs) or /mission → correct location,
    // no redirect needed.
  }, [isInitialized, session, segments, router]);

  // Show spinner only during initial boot (isInitialized = false).
  // After logout, isInitialized stays true so we never flash a spinner.
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
  

  // Initialize auth session listener — runs once for app lifetime
  useAuthInitializer();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render until fonts are ready
  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="light" backgroundColor={Colors.bgBase} />
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