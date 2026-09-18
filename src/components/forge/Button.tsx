// ─────────────────────────────────────────────────────────────
// THE FORGE — Buttons
//
// The primary button is a physical key: a gold face sitting on a
// darker shelf. Pressing translates the face down onto the shelf,
// which is the Stitch `shadow-[0_4px_0_0_#9a7f2a]` +
// `active:translate-y-[2px]` treatment.
//
// The face translates rather than the container resizing, so the
// button never changes layout height while being pressed.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  Pressable, View, StyleSheet,
  type ViewStyle, type StyleProp,
} from 'react-native';
import { Colors, Radius, Spacing, Fonts, FontSizes, LetterSpacing } from '../../constants/tokens';
import { Text } from 'react-native';

const SHELF_COLOR  = '#9A7F2A'; // darker gold — the shelf under the key
const SHELF_HEIGHT = 4;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export function ForgeButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  iconRight,
  style,
  height = 52,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Optional leading icon. Kept as a node so no icon library is required. */
  icon?: React.ReactNode;
  /** Optional trailing icon. */
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  height?: number;
}) {
  if (variant === 'ghost') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.ghost,
          { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
          style,
        ]}
      >
        {icon}
        <Text style={[styles.label, styles.ghostLabel]}>{label}</Text>
        {iconRight}
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.secondary,
          { height, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        {icon}
        <Text style={[styles.label, styles.secondaryLabel]}>{label}</Text>
        {iconRight}
      </Pressable>
    );
  }

  // primary — the physical key
  return (
    <View style={[styles.shelf, { height: height + SHELF_HEIGHT, opacity: disabled ? 0.4 : 1 }, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.face,
          { height },
          pressed && { transform: [{ translateY: SHELF_HEIGHT }] },
        ]}
      >
        {/* 1px tactile highlight along the top edge of the key */}
        <View pointerEvents="none" style={styles.faceHighlight} />
        {icon}
        <Text style={[styles.label, styles.primaryLabel]}>{label}</Text>
        {iconRight}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    letterSpacing: LetterSpacing.wider,
  },
  shelf: {
    backgroundColor: SHELF_COLOR,
    borderRadius:    Radius.sm,
    width:           '100%',
  },
  face: {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.sm,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    overflow:        'hidden',
  },
  faceHighlight: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    height:          1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryLabel: {
    color: Colors.onPrimary,
  },
  secondary: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.sm,
    borderWidth:     1,
    borderColor:     Colors.outline,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    width:           '100%',
  },
  secondaryLabel: {
    color: Colors.textPrimary,
  },
  ghost: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  ghostLabel: {
    color: Colors.primary,
  },
});