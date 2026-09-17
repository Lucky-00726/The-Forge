// ─────────────────────────────────────────────────────────────
// THE FORGE — Nested (auth) Layout
// app/(auth)/_layout.tsx
//
// This layout only wraps routes under the (auth) directory.
// It simply renders a <Slot /> as a shell. All global auth gating
// and session initialization have been moved to the root layout:
//   app/_layout.tsx
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Slot } from 'expo-router';

export default function AuthLayout() {
  return <Slot />;
}