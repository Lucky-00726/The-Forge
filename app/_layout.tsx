// ─────────────────────────────────────────────────────────────
// THE FORGE — Root Layout
// app/_layout.tsx
// ─────────────────────────────────────────────────────────────
import 'react-native-url-polyfill/auto';

import React, { useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthInitializer } from '../src/hooks/useAuthInitializer';
import { useAuthStore } from '../src/store/auth.store';
import { Colors } from '../src/constants/tokens';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const router   = useRouter();
  const segments = useSegments();

  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session       = useAuthStore((s) => s.session);
  const profile       = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (session && !inAuthGroup) {
      return;
    }

    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, session, profile, segments, router]);

  if (!isInitialized) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const fontsLoaded = true;
const fontError = null;

  useAuthInitializer();

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      SplashScreen.hide();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="light" />
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
