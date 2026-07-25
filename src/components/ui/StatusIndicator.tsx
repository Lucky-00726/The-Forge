// ─────────────────────────────────────────────────────────────
// THE FORGE — Status Indicator Component
// Live status display with tactical styling
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, LetterSpacing } from '../../constants/tokens';

type StatusType = 'preparing' | 'ready' | 'submitting' | 'complete' | 'pending' | 'locked';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
}

const STATUS_CONFIG: Record<StatusType, { text: string; color: string; pulse: boolean }> = {
  preparing: { text: 'PREPARING', color: Colors.textTertiary, pulse: false },
  ready: { text: 'READY', color: Colors.success, pulse: true },
  submitting: { text: 'SUBMITTING', color: Colors.primary, pulse: true },
  complete: { text: 'COMPLETE', color: Colors.success, pulse: false },
  pending: { text: 'PENDING', color: Colors.textTertiary, pulse: false },
  locked: { text: 'DECISION: LOCKED', color: Colors.primary, pulse: false },
};

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label} maxFontSizeMultiplier={1}>
          {label}
        </Text>
      )}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.dot,
            { backgroundColor: config.color },
            config.pulse && styles.dotPulse,
          ]}
        />
        <Text style={[styles.statusText, { color: config.color }]} maxFontSizeMultiplier={1}>
          {config.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs - 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPulse: {
    opacity: 0.8,
  },
  statusText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    letterSpacing: LetterSpacing.widest,
  },
});
