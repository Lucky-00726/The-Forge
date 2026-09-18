// ─────────────────────────────────────────────────────────────
// THE FORGE — Segmented progress
//
// One segment per unit of work. Used two ways in the designs:
//   • Home — 3 segments, one per daily session
//   • Session screens — one per question (12, 12 or 10)
//
// Purely presentational. It renders the counts it is given and
// derives nothing: the caller owns what "current" means.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors } from '../../constants/tokens';

export type SegmentState = 'complete' | 'active' | 'pending';

export function SegmentedProgress({
  total,
  current,
  style,
  height = 4,
  gap = 4,
}: {
  /** Number of segments to draw. */
  total: number;
  /**
   * How many are finished. Segments before `current` render as
   * complete, segment at `current` renders active, the rest pending.
   * Pass `total` to show everything complete.
   */
  current: number;
  style?: StyleProp<ViewStyle>;
  height?: number;
  gap?: number;
}) {
  const segments: SegmentState[] = Array.from({ length: Math.max(0, total) }, (_, i) => {
    if (i < current) return 'complete';
    if (i === current) return 'active';
    return 'pending';
  });

  return (
    <View style={[styles.row, { gap }, style]}>
      {segments.map((state, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            { height },
            state === 'complete' && styles.complete,
            state === 'active'   && styles.active,
            state === 'pending'  && styles.pending,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    width:         '100%',
  },
  segment: {
    flex:         1,
    borderRadius: 1,
    borderWidth:  1,
  },
  complete: {
    backgroundColor: Colors.successBg,
    borderColor:     Colors.successDim,
  },
  active: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primaryDim,
    // Glow — Android honours elevation, iOS the shadow triple.
    shadowColor:   Colors.primary,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius:  4,
    elevation:     3,
  },
  pending: {
    backgroundColor: Colors.bgHighest,
    borderColor:     Colors.outlineFaint,
  },
});