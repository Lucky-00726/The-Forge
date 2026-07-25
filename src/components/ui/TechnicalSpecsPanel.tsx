// ─────────────────────────────────────────────────────────────
// THE FORGE — TechnicalSpecsPanel Component
// Tactical metadata display with dot separators
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, LetterSpacing } from '../../constants/tokens';

interface TechnicalSpec {
  label: string;
  value: string;
}

interface TechnicalSpecsPanelProps {
  specs?: TechnicalSpec[];
}

const DEFAULT_SPECS: TechnicalSpec[] = [
  { label: 'DEPLOYMENT', value: 'ACTIVE' },
  { label: 'DATA SYNC', value: 'COMPLETE' },
  { label: 'LOADOUT', value: 'OPTIMAL' },
];

export default function TechnicalSpecsPanel({
  specs = DEFAULT_SPECS,
}: TechnicalSpecsPanelProps) {
  return (
    <View style={styles.container}>
      {specs.map((spec, idx) => (
        <View key={idx}>
          <View style={styles.specRow}>
            <Text style={styles.label} maxFontSizeMultiplier={1}>
              {spec.label}
            </Text>
            <View style={styles.separator}>
              <View style={styles.dot} />
            </View>
            <Text style={styles.value} maxFontSizeMultiplier={1}>
              {spec.value}
            </Text>
          </View>
          {idx < specs.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgLowest,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar + '66',
    padding:         Spacing.md,
    gap:             Spacing.sm,
  },
  specRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            Spacing.sm,
  },
  label: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
    flex:          1,
  },
  separator: {
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  dot: {
    width:           3,
    height:          3,
    borderRadius:    1.5,
    backgroundColor: Colors.outlineVar,
  },
  value: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textPrimary,
    letterSpacing: LetterSpacing.wide,
    textAlign:     'right',
    flex:          1,
  },
  divider: {
    height:          1,
    backgroundColor: Colors.outlineVar + '33',
    marginVertical:  Spacing.xs - 2,
  },
});
