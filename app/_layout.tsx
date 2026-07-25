// ─────────────────────────────────────────────────────────────
// THE FORGE — Root Layout Shell
// app/_layout.tsx
//
// This is intentionally a THIN WRAPPER. All auth logic, session
// initialization, and AuthGate navigation live exclusively in:
//   app/(auth)/_layout.tsx
//
// Why this separation:
//   Expo Router renders this file for EVERY route. Placing
//   useAuthInitializer() here caused it to run a second time
//   whenever the (auth) group was active (because the (auth)
//   group layout ALSO called useAuthInitializer). The duplicate
//   calls registered two onAuthStateChange listeners, caused
//   concurrent store writes, and could leave the session in an
//   unpredictable state.
//
// This file must NEVER call useAuthInitializer() or render
// its own AuthGate. Its only jobs are:
//   1. Provide the root <View> for onLayout-based splash hiding
//   2. Render <Slot /> (Expo Router's outlet)
//
// SplashScreen is managed by app/(auth)/_layout.tsx which is
// always rendered as a nested layout regardless of route.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/tokens';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.bgBase,
  },
});
