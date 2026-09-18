// ─────────────────────────────────────────────────────────────
// THE FORGE — Surfaces
// Industrial Precision depth primitives.
//
// Depth is tactile, not dramatic. Two surface treatments:
//   MilledSurface — raised, with a 1px light top/left edge
//   RecessedTrack — inset well, darker than its parent
//
// React Native has no inset box-shadow, so the Stitch
// `inset 1px 1px 0 rgba(255,255,255,0.05)` is reproduced with
// hairline top and left borders. Visually equivalent at 1px.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors, Radius, Shadows } from '../../constants/tokens';

const EDGE_LIGHT = 'rgba(255, 255, 255, 0.05)';

// ── Corner brackets ───────────────────────────────────────────
// The signature detail: 1px L-shapes in all four corners,
// marking a component as ACTIVE or FEATURED.
export type BracketTone = 'primary' | 'accent' | 'muted';

const BRACKET_TONE: Record<BracketTone, string> = {
  primary: Colors.primary,
  accent:  Colors.accent,
  muted:   Colors.outline,
};

export function CornerBrackets({
  size = 6,
  tone = 'primary',
}: {
  size?: number;
  tone?: BracketTone;
}) {
  const color = BRACKET_TONE[tone];
  const base: ViewStyle = { position: 'absolute', width: size, height: size, borderColor: color };

  return (
    <>
      <View pointerEvents="none" style={[base, { top: -1, left: -1,  borderTopWidth: 1, borderLeftWidth: 1 }]} />
      <View pointerEvents="none" style={[base, { top: -1, right: -1, borderTopWidth: 1, borderRightWidth: 1 }]} />
      <View pointerEvents="none" style={[base, { bottom: -1, left: -1,  borderBottomWidth: 1, borderLeftWidth: 1 }]} />
      <View pointerEvents="none" style={[base, { bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 }]} />
    </>
  );
}

// ── MilledSurface ─────────────────────────────────────────────
export function MilledSurface({
  children,
  style,
  brackets = false,
  bracketTone = 'primary',
  active = false,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Show the signature corner brackets. */
  brackets?: boolean;
  bracketTone?: BracketTone;
  /** Amber 1px outline — for a selected or in-progress card. */
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.milled,
        active && styles.milledActive,
        style,
      ]}
    >
      {brackets ? <CornerBrackets tone={bracketTone} /> : null}
      {children}
    </View>
  );
}

// ── RecessedTrack ─────────────────────────────────────────────
export function RecessedTrack({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.recessed, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  milled: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.sm,
    borderWidth:     1,
    borderColor:     'transparent',
    borderTopColor:  EDGE_LIGHT,
    borderLeftColor: EDGE_LIGHT,
    ...Shadows.md,
  },
  milledActive: {
    borderColor:     Colors.primary,
    borderTopColor:  Colors.primary,
    borderLeftColor: Colors.primary,
  },
  recessed: {
    backgroundColor: Colors.bgLowest,
    borderRadius:    Radius.sm,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
  },
});
