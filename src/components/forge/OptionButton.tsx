// ─────────────────────────────────────────────────────────────
// THE FORGE — Answer option
//
// One tappable answer row: letter gutter, option text, and a
// state. Used by Session 1 and by Session 2's MCQ and True/False
// renderers.
//
// The `state` is supplied by the caller — the component never
// decides whether an answer is correct. Scoring stays in the
// session controller.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { Pressable, View, Text, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import {
  Colors, Radius, Spacing, Fonts, FontSizes, LineHeightPx, Shadows,
} from '../../constants/tokens';
import { CornerBrackets } from './Surface';

export type OptionState =
  | 'default'
  | 'selected'
  | 'correct'      // revealed after answering — this was right
  | 'incorrect'    // revealed after answering — user picked this, it was wrong
  | 'disabled';    // revealed after answering — not chosen, not the answer

export function OptionButton({
  letter,
  text,
  state = 'default',
  onPress,
  trailing,
  style,
}: {
  /** 'A' | 'B' | 'C' | 'D', or 'T' / 'F'. Omit for an unlettered option. */
  letter?: string;
  text: string;
  state?: OptionState;
  onPress?: () => void;
  /** Optional trailing node, e.g. a check icon once answered. */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const locked = state === 'correct' || state === 'incorrect' || state === 'disabled';

  return (
    <Pressable
      onPress={onPress}
      disabled={locked || !onPress}
      style={({ pressed }) => [
        styles.base,
        state === 'selected'  && styles.selected,
        state === 'correct'   && styles.correct,
        state === 'incorrect' && styles.incorrect,
        state === 'disabled'  && styles.disabledOpt,
        pressed && !locked && { opacity: 0.85 },
        style,
      ]}
    >
      {state === 'selected' ? <CornerBrackets tone="primary" /> : null}
      {state === 'correct'  ? <CornerBrackets tone="muted" /> : null}

      <View style={styles.row}>
        {letter ? (
          <Text
            style={[
              styles.letter,
              state === 'selected'  && { color: Colors.primary },
              state === 'correct'   && { color: Colors.success },
              state === 'incorrect' && { color: Colors.error },
            ]}
          >
            {letter}
          </Text>
        ) : null}

        <Text
          style={[
            styles.text,
            state === 'selected'  && { color: Colors.textPrimary, fontFamily: Fonts.bodyMedium },
            state === 'correct'   && { color: Colors.textPrimary },
            state === 'incorrect' && { color: Colors.textPrimary },
            state === 'disabled'  && { color: Colors.textTertiary },
          ]}
        >
          {text}
        </Text>

        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.sm,
    borderWidth:     1,
    borderColor:     'transparent',
    borderTopColor:  'rgba(255, 255, 255, 0.05)',
    borderLeftColor: 'rgba(255, 255, 255, 0.05)',
    padding:         Spacing.md,
    ...Shadows.sm,
  },
  selected: {
    borderColor:     Colors.primary,
    borderTopColor:  Colors.primary,
    borderLeftColor: Colors.primary,
  },
  correct: {
    borderColor:     Colors.success,
    borderTopColor:  Colors.success,
    borderLeftColor: Colors.success,
    backgroundColor: Colors.successBg,
  },
  incorrect: {
    borderColor:     Colors.error,
    borderTopColor:  Colors.error,
    borderLeftColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  disabledOpt: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  letter: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.label,
    lineHeight: LineHeightPx.label,
    color:      Colors.textTertiary,
    width:      16,
  },
  text: {
    flex:       1,
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    lineHeight: LineHeightPx.bodyMd,
    color:      Colors.textSecondary,
  },
  trailing: {
    marginLeft: Spacing.sm,
  },
});