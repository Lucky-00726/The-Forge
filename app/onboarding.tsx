// ─────────────────────────────────────────────────────────────
// THE FORGE — First-Login Onboarding
// 3 simple screens: Complete sessions • Earn XP • Build streaks
// Shown once after first login; sets a SecureStore flag on finish.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { CornerMarkers } from '../src/components/ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
} from '../src/constants/tokens';

export const ONBOARDING_FLAG = 'forge_onboarding_complete';

type Step = {
  icon: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: '🎯',
    title: 'COMPLETE SESSIONS',
    body: 'Train every day across three sessions — SSB knowledge, multiple-choice, and subjective practice. Work through each question at your own pace.',
  },
  {
    icon: '⚡',
    title: 'EARN XP',
    body: 'Every session you finish awards Experience Points. Build up XP to rise through the ranks: Cadet → Officer → Commander.',
  },
  {
    icon: '🔥',
    title: 'BUILD STREAKS',
    body: 'Complete at least one session each day to grow your streak. Consistency is what separates selected candidates from the rest.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const isLast = index === STEPS.length - 1;
  const step = STEPS[index];

  const finish = async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDING_FLAG, 'true');
    } catch {
      // Non-fatal: if persistence fails, onboarding may show again next login.
    }
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (isLast) {
      void finish();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      {/* Skip */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => void finish()} activeOpacity={0.7}>
          <Text style={styles.skipText} maxFontSizeMultiplier={1}>
            SKIP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <CornerMarkers position="all" color={Colors.primary} />
          <Text style={styles.icon} maxFontSizeMultiplier={1}>
            {step.icon}
          </Text>
          <Text style={styles.stepLabel} maxFontSizeMultiplier={1}>
            {index + 1} / {STEPS.length}
          </Text>
          <Text style={styles.title} maxFontSizeMultiplier={1}>
            {step.title}
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1}>
            {step.body}
          </Text>
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      </View>

      {/* Action */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText} maxFontSizeMultiplier={1}>
            {isLast ? 'GET STARTED' : 'NEXT'}
          </Text>
          <Text style={styles.nextButtonArrow} maxFontSizeMultiplier={1}>
            →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    paddingHorizontal: Spacing.gutter,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  skipText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '44',
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 56,
    marginBottom: Spacing.lg,
  },
  stepLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.headingSm,
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgHighest,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  footer: {
    gap: Spacing.md,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  nextButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyMd,
    color: Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
  nextButtonArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyLg,
    color: Colors.onPrimary,
  },
});
