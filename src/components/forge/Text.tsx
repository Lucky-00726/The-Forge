// ─────────────────────────────────────────────────────────────
// THE FORGE — Typography
// One component per role in the Industrial Precision type scale.
// Use these instead of bare <Text> so the scale stays consistent
// and a future change lands in one place.
//
//   Display     36/44  Hanken Bold      — DAY 02
//   Headline    20/28  Hanken SemiBold  — card titles
//   BodyLg      16/24  Hanken Regular   — question text
//   Body        14/20  Hanken Regular   — descriptions
//   LabelCaps   11/16  Geist SemiBold   — SECTION HEADERS
//   Mono        12/16  Geist Regular    — 04 / 12, +35 XP
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Text, StyleSheet, type TextStyle, type StyleProp, type TextProps } from 'react-native';
import { Colors, Fonts, FontSizes, LineHeightPx, LetterSpacing } from '../../constants/tokens';

type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'gold' | 'success' | 'error';

const TONE: Record<Tone, string> = {
  primary:   Colors.textPrimary,
  secondary: Colors.textSecondary,
  tertiary:  Colors.textTertiary,
  accent:    Colors.accent,
  gold:      Colors.primary,
  success:   Colors.success,
  error:     Colors.error,
};

interface ForgeTextProps extends TextProps {
  children?: React.ReactNode;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
}

function make(base: TextStyle, defaultTone: Tone) {
  return function ForgeText({ children, tone = defaultTone, style, ...rest }: ForgeTextProps) {
    return (
      <Text {...rest} style={[base, { color: TONE[tone] }, style]}>
        {children}
      </Text>
    );
  };
}

const styles = StyleSheet.create({
  display: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.display,
    lineHeight:    LineHeightPx.display,
    letterSpacing: LetterSpacing.tight,
  },
  headline: {
    fontFamily: Fonts.heading,
    fontSize:   FontSizes.headingSm,
    lineHeight: LineHeightPx.headingSm,
  },
  bodyLg: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    lineHeight: LineHeightPx.bodyMd,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    lineHeight: LineHeightPx.bodySm,
  },
  labelCaps: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    lineHeight:    LineHeightPx.label,
    letterSpacing: LetterSpacing.wider,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.label,
    lineHeight: LineHeightPx.label,
  },
});

/** 36/44 Hanken Bold — the big day number, screen heroes. */
export const Display = make(styles.display, 'primary');

/** 20/28 Hanken SemiBold — card and section titles. */
export const Headline = make(styles.headline, 'primary');

/** 16/24 Hanken Regular — question text, primary reading. */
export const BodyLg = make(styles.bodyLg, 'primary');

/** 14/20 Hanken Regular — descriptions, secondary copy. */
export const Body = make(styles.body, 'secondary');

/**
 * 11/16 Geist SemiBold, wide tracking — SECTION HEADERS.
 * Pass text already uppercased; this does not transform it.
 */
export const LabelCaps = make(styles.labelCaps, 'secondary');

/** 12/16 Geist Regular — counters, XP, technical readouts. */
export const Mono = make(styles.mono, 'secondary');