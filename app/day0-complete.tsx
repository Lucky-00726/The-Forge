// ─────────────────────────────────────────────────────────────
// THE FORGE — Day 1 Completion Screen
// Shows results and awards XP
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  TacticalShadows,
} from '../src/constants/tokens';
import { CornerMarkers } from '../src/components/ui';
import { useAuthStore } from '../src/store/auth.store';
import { awardSessionXP } from '../src/services/progression.service';
import { trackEvent } from '../src/services/analytics.service';
import { isSessionCompleted, markSessionCompleted } from '../src/services/daily-session.service';

export default function Day0CompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    total: string;
    xp: string;
    completionTime?: string;
  }>();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // isReview is true when this session was already completed today.
  // In review mode: no XP is awarded, no writes occur, stored data is shown.
  const [isReview, setIsReview] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  const score = parseInt(params.score || '0', 10);
  const total = parseInt(params.total || '10', 10);
  const xpEarned = parseInt(params.xp || '0', 10);
  const completionTimeSecs = parseInt(params.completionTime || '0', 10);
  const percentage = Math.round((score / total) * 100);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-save XP
    void saveXP();
  }, []);

  const saveXP = async () => {
    if (!userId) {
      setSaved(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const alreadyDone = await isSessionCompleted(userId, 1);

      if (alreadyDone) {
        setIsReview(true);
        setSaved(true);
        return;
      }

      const result = await awardSessionXP(userId, xpEarned, 'session1');

      if (!result.success) {
        console.error('[Day1Complete] awardSessionXP failed:', result.error);
        setError(result.error ?? 'Failed to save progress. Please try again.');
        return;
      }

      await markSessionCompleted(
        userId,
        1,
        xpEarned,
        score,
        total,
        completionTimeSecs,
        percentage >= 70 ? 'Hard' : percentage >= 50 ? 'Mixed' : 'Easy',
      );

      trackEvent(userId, 'session1_completed');
      setSaved(true);
    } catch (err) {
      console.error('[Day1Complete] Unexpected error:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToDashboard = () => {
    router.replace('/(tabs)');
  };

  const handleContinueToSession2 = () => {
    router.replace('/session2');
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return 'Outstanding Performance';
    if (percentage >= 70) return 'Strong Performance';
    if (percentage >= 50) return 'Satisfactory Performance';
    return 'Keep Training';
  };

  const getPerformanceColor = () => {
    if (percentage >= 70) return Colors.success;
    if (percentage >= 50) return Colors.primary;
    return Colors.textSecondary;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon} maxFontSizeMultiplier={1}>
            {percentage >= 70 ? '★' : percentage >= 50 ? '✓' : '—'}
          </Text>
          <Text style={styles.headerTitle} maxFontSizeMultiplier={1}>
            SESSION COMPLETE
          </Text>
        </View>

        {/* Results Card */}
        <View style={[styles.resultsCard, TacticalShadows.glow]}>
          <CornerMarkers position="all" color={getPerformanceColor()} />

          <View style={styles.scoreSection}>
            <Text style={styles.scoreLabel} maxFontSizeMultiplier={1}>
              ACCURACY
            </Text>
            <Text
              style={[styles.scoreValue, { color: getPerformanceColor() }]}
              maxFontSizeMultiplier={1}
            >
              {score}/{total}
            </Text>
            <Text style={styles.percentageText} maxFontSizeMultiplier={1}>
              {percentage}%
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.performanceMessage} maxFontSizeMultiplier={1}>
            {getPerformanceMessage()}
          </Text>
        </View>

        {/* XP Award Card — Mode A (first completion) or Mode B (review) */}
        <View style={[styles.xpCard, isReview && styles.xpCardReview]}>
          <CornerMarkers position="all" color={isReview ? Colors.textTertiary : Colors.primary} />

          <View style={styles.xpHeader}>
            <Text style={[styles.xpLabel, isReview && { color: Colors.textTertiary }]} maxFontSizeMultiplier={1}>
              {isReview ? 'SESSION ALREADY COMPLETED' : 'EXPERIENCE POINTS'}
            </Text>
          </View>

          {isReview ? (
            // Mode B: Review — read-only, no XP awarded
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewText} maxFontSizeMultiplier={1}>
                You completed this session earlier today.
              </Text>
              <Text style={styles.reviewSubtext} maxFontSizeMultiplier={1}>
                XP has already been awarded. No additional XP is earned on review.
              </Text>
            </View>
          ) : (
            // Mode A: First completion — show XP earned and save state
            <>
              <Text style={styles.xpValue} maxFontSizeMultiplier={1}>
                +{xpEarned} XP
              </Text>

              {saving && (
                <View style={styles.savingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.savingText} maxFontSizeMultiplier={1}>
                    Saving progress...
                  </Text>
                </View>
              )}

              {saved && !saving && (
                <View style={styles.savedContainer}>
                  <Text style={styles.savedIcon} maxFontSizeMultiplier={1}>
                    ✓
                  </Text>
                  <Text style={styles.savedText} maxFontSizeMultiplier={1}>
                    Progress saved
                  </Text>
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText} maxFontSizeMultiplier={1}>
                    {error}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={saveXP}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.retryButtonText} maxFontSizeMultiplier={1}>
                      RETRY
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle} maxFontSizeMultiplier={1}>
            Training Insights
          </Text>
          <Text style={styles.insightsText} maxFontSizeMultiplier={1}>
            {percentage >= 70
              ? 'Excellent grasp of SSB fundamentals. You\'re on the right track for officer selection preparation.'
              : percentage >= 50
              ? 'Good understanding of core concepts. Continue practicing to strengthen your knowledge base.'
              : 'Focus on building SSB awareness through consistent training. Review incorrect answers to improve.'}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.returnButton}
          onPress={handleContinueToSession2}
          activeOpacity={0.85}
        >
          <Text style={styles.returnButtonText} maxFontSizeMultiplier={1}>
            CONTINUE TO SESSION 2
          </Text>
          <Text style={styles.returnButtonArrow} maxFontSizeMultiplier={1}>
            →
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleReturnToDashboard}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText} maxFontSizeMultiplier={1}>
            Return to Dashboard
          </Text>
        </TouchableOpacity>

        {/* Footer Note */}
        <Text style={styles.footerNote} maxFontSizeMultiplier={1}>
          Day 1 Training • Continue training daily to master all
          competencies
        </Text>
      </Animated.View>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
  },
  content: {
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },

  // Results Card
  resultsCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  scoreLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.label,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom: Spacing.sm,
  },
  scoreValue: {
    fontFamily: Fonts.display,
    fontSize: 64,
    letterSpacing: -2,
    lineHeight: 72,
  },
  percentageText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.headingMd,
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.outlineVar,
    marginBottom: Spacing.lg,
  },
  performanceMessage: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.headingSm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // XP Card
  xpCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '44',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  xpCardReview: {
    borderColor: Colors.outlineVar,
    backgroundColor: Colors.bgSurface,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  xpIcon: {
    fontSize: 24,
  },
  xpLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  xpValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.display,
    color: Colors.primary,
    letterSpacing: -2,
    marginBottom: Spacing.md,
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  savingText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.bodySm,
    color: Colors.textTertiary,
  },
  savedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  savedIcon: {
    fontSize: 16,
    color: Colors.success,
  },
  savedText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    color: Colors.success,
    letterSpacing: LetterSpacing.wide,
  },
  reviewContainer: {
    gap: Spacing.sm,
  },
  reviewText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    color: Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  reviewSubtext: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.textTertiary,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: Colors.errorBg,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    gap: Spacing.sm,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.error,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.error,
    letterSpacing: LetterSpacing.wider,
  },

  // Insights
  insightsCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVar,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  insightsTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom: Spacing.sm,
  },
  insightsText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // Return Button
  returnButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  returnButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyMd,
    color: Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
  returnButtonArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyLg,
    color: Colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.outlineVar,
    paddingVertical: Spacing.md + 4,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  secondaryButtonText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
  },

  // Footer
  footerNote: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
