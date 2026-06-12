// ─────────────────────────────────────────────────────────────
// THE FORGE — Home Dashboard
// Route: /(tabs)/
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenMeta } from '../../src/components/ui';
import { useAuth } from '../../src/hooks/useAuth';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  LetterSpacing,
} from '../../src/constants/tokens';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { displayName, currentRank, totalXP, currentStreak } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <ScreenMeta id="OPS-01" label="Command Centre" />
      <Text style={styles.greeting} maxFontSizeMultiplier={1}>
        WELCOME BACK
      </Text>
      <Text style={styles.name} maxFontSizeMultiplier={1}>
        {displayName || 'OFFICER'}
      </Text>

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>RANK</Text>
          <Text style={styles.statValue}>{currentRank}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{totalXP}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>STREAK</Text>
          <Text style={styles.statValue}>{currentStreak}d</Text>
        </View>
      </View>

      <Text style={styles.placeholder} maxFontSizeMultiplier={1}>
        Mission briefing loads here. Training commences soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.gutter,
  },
  greeting: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.widest,
    marginBottom:  Spacing.xs,
  },
  name: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.headingLg,
    color:         Colors.textPrimary,
    letterSpacing: LetterSpacing.tight,
    marginBottom:  Spacing.xl,
  },
  statsCard: {
    flexDirection:   'row',
    backgroundColor: Colors.bgSurface,
    borderRadius:    8,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    marginBottom:    Spacing.xl,
  },
  stat: {
    flex:       1,
    alignItems: 'center',
  },
  statDivider: {
    width:           1,
    backgroundColor: Colors.outlineVar,
    marginHorizontal: Spacing.sm,
  },
  statLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom:  Spacing.xs,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize:   FontSizes.headingSm,
    color:      Colors.primary,
  },
  placeholder: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 22,
  },
});
