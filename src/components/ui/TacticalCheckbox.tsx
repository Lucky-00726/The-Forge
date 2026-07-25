// ─────────────────────────────────────────────────────────────
// THE FORGE — Tactical Checkbox Component
// Military-styled checkbox with status labels
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, LetterSpacing } from '../../constants/tokens';

interface TacticalCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  checkedLabel?: string;
  uncheckedLabel?: string;
  disabled?: boolean;
}

export function TacticalCheckbox({
  checked,
  onToggle,
  label,
  checkedLabel = 'MISSION EXECUTED',
  uncheckedLabel = 'MISSION INCOMPLETE',
  disabled = false,
}: TacticalCheckboxProps) {
  const statusLabel = checked ? checkedLabel : uncheckedLabel;
  const statusColor = checked ? Colors.success : Colors.textTertiary;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        checked && styles.containerChecked,
        disabled && styles.containerDisabled,
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? (
          <Text style={styles.checkmark}>✓</Text>
        ) : (
          <View style={styles.emptyCircle} />
        )}
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.statusLabel, { color: statusColor }]} maxFontSizeMultiplier={1}>
          {statusLabel}
        </Text>
        {label && (
          <Text style={styles.hint} maxFontSizeMultiplier={1}>
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  containerChecked: {
    backgroundColor: Colors.success + '11',
    borderColor: Colors.success,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgLow,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.onPrimary,
    fontWeight: 'bold',
  },
  emptyCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs - 2,
  },
  statusLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    letterSpacing: LetterSpacing.widest,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
});
