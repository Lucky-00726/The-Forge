// ─────────────────────────────────────────────────────────────
// THE FORGE — Chips and small labelled bits
//
// Chip      — IN PROGRESS · MCQ · 6 MIN · OFFICER, 844 XP
// MetaItem  — an icon + mono label pair, used in meta rows
// SectionLabel — a wide-tracked caps header above a section
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import {
  Colors, Radius, Spacing, Fonts, FontSizes, LineHeightPx, LetterSpacing,
} from '../../constants/tokens';

export type ChipTone = 'gold' | 'neutral' | 'accent' | 'success' | 'error';

const TONES: Record<ChipTone, { fg: string; bg: string; border: string }> = {
  gold:    { fg: Colors.primary,       bg: 'rgba(242, 202, 80, 0.10)', border: 'rgba(242, 202, 80, 0.20)' },
  neutral: { fg: Colors.textSecondary, bg: Colors.bgHighest,           border: Colors.outlineFaint },
  accent:  { fg: Colors.accent,        bg: 'rgba(255, 153, 97, 0.10)', border: 'rgba(255, 153, 97, 0.25)' },
  success: { fg: Colors.success,       bg: Colors.successBg,           border: Colors.successDim },
  error:   { fg: Colors.error,         bg: Colors.errorBg,             border: Colors.error },
};

export function Chip({
  label,
  tone = 'gold',
  style,
}: {
  label: string;
  tone?: ChipTone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <Text style={[styles.chipLabel, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function MetaItem({
  label,
  icon,
  highlight = false,
}: {
  label: string;
  /** Optional icon node — no icon library required. */
  icon?: React.ReactNode;
  /** Render in gold, for "+ XP available" style items. */
  highlight?: boolean;
}) {
  return (
    <View style={styles.metaItem}>
      {icon}
      <Text
        style={[
          styles.metaLabel,
          highlight && { color: Colors.primary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function MetaRow({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.metaRow, style]}>{children}</View>;
}

export function SectionLabel({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Text style={styles.sectionLabel}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf:         'flex-start',
    borderWidth:       1,
    borderRadius:      Radius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
  },
  chipLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    lineHeight:    LineHeightPx.label,
    letterSpacing: LetterSpacing.wider,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    alignItems:    'center',
    rowGap:        Spacing.sm,
    columnGap:     Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  metaLabel: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.label,
    lineHeight: LineHeightPx.label,
    color:      Colors.textSecondary,
  },
  sectionLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    lineHeight:    LineHeightPx.label,
    letterSpacing: LetterSpacing.widest,
    color:         Colors.textSecondary,
  },
});
