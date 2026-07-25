// ─────────────────────────────────────────────────────────────
// THE FORGE — Session Completion Screen
// Unified completion for all session types
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
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
import { trackEvent } from '../src/services/analytics.service';
import { awardSessionXP } from '../src/services/progression.service';
import { isSessionCompleted, markSessionCompleted } from '../src/services/daily-session.service';

export default function SessionCompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionNumber: string;
    score: string;
    total: string;
    xp: string;
    subjective?: string;
    responsesData?: string;
    completionTime?: string;
    aiEvaluation?: string;
  }>();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // isReview is true when this session was already completed today.
  // In review mode: no XP is awarded, no DB writes occur.
  const [isReview, setIsReview] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const sessionNumber = params.sessionNumber || '0';
  const sessionNum = parseInt(sessionNumber, 10);
  // Guard: session-complete only handles sessions 2 and 3.
  // If sessionNumber is missing or invalid, treat as session 2 to avoid
  // a DB constraint violation (CHECK session_number IN (1, 2, 3)).
  const validSessionNum = (sessionNum === 2 || sessionNum === 3 ? sessionNum : 2) as 2 | 3;
  const score = parseInt(params.score || '0', 10);
  const total = parseInt(params.total || '10', 10);
  const xpEarned = parseInt(params.xp || '0', 10);
  const isSubjective = params.subjective === 'true';
  const percentage = Math.round((score / total) * 100);
  const completionTimeSeconds = parseInt(params.completionTime || '0', 10);
  const completionMinutes = Math.floor(completionTimeSeconds / 60);
  const completionSeconds = completionTimeSeconds % 60;
  
  // Parse subjective responses data (defensive: route params can be
  // truncated/corrupted; never let a parse error crash the screen).
  let responsesData: any[] = [];
  if (params.responsesData) {
    try {
      responsesData = JSON.parse(params.responsesData);
    } catch (err) {
      console.warn('[SessionComplete] Failed to parse responsesData param:', err);
      responsesData = [];
    }
  }

  // Parse AI evaluation data (defensive). A parse failure here must show the
  // graceful fallback note, not crash the completion screen.
  let aiEvaluation: any = null;
  if (params.aiEvaluation) {
    try {
      aiEvaluation = JSON.parse(params.aiEvaluation);
    } catch (err) {
      console.warn('[SessionComplete] Failed to parse aiEvaluation param:', err);
      aiEvaluation = null;
    }
  }

  // Calculate objective metrics from responses
  const objectiveMetrics = responsesData.length > 0 ? {
    responsesSubmitted: responsesData.length,
    totalQuestions: total,
    averageWordCount: Math.round(
      responsesData.reduce((sum: number, r: any) => sum + r.wordCount, 0) / responsesData.length
    ),
    completionTime: `${completionMinutes}:${completionSeconds.toString().padStart(2, '0')}`,
  } : null;

  useEffect(() => {
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
      // ── Mode gate: check whether this session is already completed ──
      // BUG-001 / BUG-002 fix: never award XP twice.
      const alreadyDone = await isSessionCompleted(userId, validSessionNum);

      if (alreadyDone) {
        // Mode B: Review mode — read-only, no DB writes, no XP
        console.log(`[SessionComplete] Review mode: S${validSessionNum} already completed today, skipping XP`);
        setIsReview(true);
        setSaved(true);
        return;
      }

      // Mode A: First completion today ──────────────────────────────
      const source = sessionNumber === '2' ? 'session2' : 'session3';
      const result = await awardSessionXP(userId, xpEarned, source as 'session2' | 'session3');

      if (!result.success) {
        console.error('[SessionComplete] awardSessionXP failed:', result.error);
        setError(result.error ?? 'Failed to save progress. Please try again.');
        return;
      }

      // Track session completion
      const completionEvent = `session${sessionNumber}_completed` as
        | 'session2_completed'
        | 'session3_completed';
      trackEvent(userId, completionEvent);

      // Record completion with review data
      await markSessionCompleted(
        userId,
        validSessionNum,
        xpEarned,
        isSubjective ? null : score,
        total,
        completionTimeSeconds,
        isSubjective ? 'Subjective' : percentage >= 70 ? 'Hard' : percentage >= 50 ? 'Mixed' : 'Easy',
      );

      setSaved(true);
    } catch (err) {
      console.error('[SessionComplete] Unexpected error:', err);
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReturnToDashboard = () => {
    router.replace('/(tabs)');
  };

  const handleContinueNext = () => {
    if (sessionNumber === '2') {
      router.replace('/session3');
    } else {
      router.replace('/(tabs)');
    }
  };

  const getPerformanceMessage = () => {
    if (isSubjective) {
      return 'Responses Recorded';
    }
    if (percentage >= 90) return 'Outstanding Performance';
    if (percentage >= 70) return 'Strong Performance';
    if (percentage >= 50) return 'Satisfactory Performance';
    return 'Keep Training';
  };

  const getPerformanceColor = () => {
    if (isSubjective) return Colors.primary;
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
            {isSubjective ? '✎' : percentage >= 70 ? '★' : percentage >= 50 ? '✓' : '—'}
          </Text>
          <Text style={styles.headerTitle} maxFontSizeMultiplier={1}>
            SESSION {sessionNumber} COMPLETE
          </Text>
        </View>

        {/* Results Card */}
        {!isSubjective && (
          <View style={[styles.resultsCard, TacticalShadows.glow]}>
            <CornerMarkers position="all" color={getPerformanceColor()} />

            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel} maxFontSizeMultiplier={1}>
                ACCURACY
              </Text>
              <Text
                style={[styles.scoreValue, { color: getPerformanceColor() }]}
                maxFontSizeMultiplier={1}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {score}/{total}
              </Text>
              <Text style={styles.percentageText} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                {percentage}%
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.performanceMessage} maxFontSizeMultiplier={1}>
              {getPerformanceMessage()}
            </Text>
          </View>
        )}

        {/* Subjective Session Metrics */}
        {isSubjective && objectiveMetrics && (
          <View style={[styles.subjectiveCard, TacticalShadows.glow]}>
            <CornerMarkers position="all" color={Colors.primary} />

            <View style={styles.subjectiveHeader}>
              <Text style={[styles.subjectiveTitle]} maxFontSizeMultiplier={1}>
                SESSION SUMMARY
              </Text>
            </View>

            <Text style={styles.subjectiveText} maxFontSizeMultiplier={1}>
              Session {sessionNumber} completed. Here are your submission metrics:
            </Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                  {objectiveMetrics.responsesSubmitted}/{objectiveMetrics.totalQuestions}
                </Text>
                <Text style={styles.metricLabel} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                  RESPONSES
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricValue} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                  {objectiveMetrics.averageWordCount}
                </Text>
                <Text style={styles.metricLabel} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                  AVG WORDS
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricValue} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                  {objectiveMetrics.completionTime}
                </Text>
                <Text style={styles.metricLabel} maxFontSizeMultiplier={1} numberOfLines={1} adjustsFontSizeToFit>
                  TIME
                </Text>
              </View>
            </View>

            {/* AI Evaluation Section */}
            {aiEvaluation && (
              <View style={styles.aiEvaluationSection}>
                <View style={styles.aiEvaluationHeader}>
                  <Text style={styles.aiEvaluationTitle} maxFontSizeMultiplier={1}>
                    AI EVALUATION
                  </Text>
                </View>

                {/* Overall Score */}
                <View style={styles.aiScoreContainer}>
                  <Text style={styles.aiScoreLabel} maxFontSizeMultiplier={1}>
                    Overall Score
                  </Text>
                  <View style={styles.aiScoreBar}>
                    <View style={[styles.aiScoreBarFill, { width: `${aiEvaluation.overallScore}%` }]} />
                  </View>
                  <Text style={styles.aiScoreValue} maxFontSizeMultiplier={1}>
                    {aiEvaluation.overallScore}/100
                  </Text>
                </View>

                {/* Strengths */}
                {aiEvaluation.strengths && aiEvaluation.strengths.length > 0 && (
                  <View style={styles.aiFeedbackSection}>
                    <Text style={styles.aiFeedbackTitle} maxFontSizeMultiplier={1}>
                      STRENGTHS
                    </Text>
                    <View style={styles.aiFeedbackList}>
                      {aiEvaluation.strengths.map((strength: string, idx: number) => (
                        <View key={idx} style={styles.aiFeedbackItem}>
                          <Text style={styles.aiFeedbackBullet} maxFontSizeMultiplier={1}>
                            ✓
                          </Text>
                          <Text style={styles.aiFeedbackText} maxFontSizeMultiplier={1}>
                            {strength}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Improvements */}
                {aiEvaluation.improvements && aiEvaluation.improvements.length > 0 && (
                  <View style={styles.aiFeedbackSection}>
                    <Text style={styles.aiFeedbackTitle} maxFontSizeMultiplier={1}>
                      AREAS FOR GROWTH
                    </Text>
                    <View style={styles.aiFeedbackList}>
                      {aiEvaluation.improvements.map((improvement: string, idx: number) => (
                        <View key={idx} style={styles.aiFeedbackItem}>
                          <Text style={styles.aiFeedbackBullet} maxFontSizeMultiplier={1}>
                            •
                          </Text>
                          <Text style={styles.aiFeedbackText} maxFontSizeMultiplier={1}>
                            {improvement}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Summary */}
                {aiEvaluation.summary && (
                  <View style={styles.aiSummaryContainer}>
                    <Text style={styles.aiSummaryText} maxFontSizeMultiplier={1}>
                      {aiEvaluation.summary}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.aiNote}>
              {!aiEvaluation && (
                <Text style={styles.aiNoteText} maxFontSizeMultiplier={1}>
                  💡 AI evaluation provides developmental feedback on your responses. Enable it in settings or check your API configuration.
                </Text>
              )}
            </View>
          </View>
        )}

        {isSubjective && !aiEvaluation && (
          <View style={[styles.subjectiveCard, TacticalShadows.glow]}>
            <CornerMarkers position="all" color={Colors.success} />

            <View style={styles.subjectiveHeader}>
              <Text style={styles.subjectiveIcon} maxFontSizeMultiplier={1}>
                ✓
              </Text>
              <Text style={[styles.subjectiveTitle, { color: Colors.success }]} maxFontSizeMultiplier={1}>
                DAY COMPLETE
              </Text>
            </View>

            <Text style={styles.subjectiveText} maxFontSizeMultiplier={1}>
              You've completed all 3 sessions for today. Great work on your subjective responses!
            </Text>

            <Text style={styles.subjectiveNote} maxFontSizeMultiplier={1}>
              Return tomorrow for new training sessions.
            </Text>
          </View>
        )}

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
                  <TouchableOpacity style={styles.retryButton} onPress={saveXP} activeOpacity={0.7}>
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
            {isSubjective
              ? 'Your subjective responses demonstrate your thought process and approach to real-world scenarios. AI evaluation will provide personalized developmental feedback.'
              : percentage >= 70
              ? `Excellent performance in Session ${sessionNumber}. Your understanding of SSB fundamentals is strong. Continue building on this foundation.`
              : percentage >= 50
              ? `Good progress in Session ${sessionNumber}. Review the explanations for incorrect answers to strengthen your knowledge base.`
              : `Session ${sessionNumber} shows areas for improvement. Focus on understanding the reasoning behind each answer to build stronger fundamentals.`}
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.returnButton}
          onPress={sessionNumber === '3' ? handleReturnToDashboard : handleContinueNext}
          activeOpacity={0.85}
        >
          <Text style={styles.returnButtonText} maxFontSizeMultiplier={1}>
            {sessionNumber === '2' ? 'CONTINUE TO SESSION 3' : sessionNumber === '3' ? 'RETURN TO COMMAND' : 'RETURN TO COMMAND'}
          </Text>
          {sessionNumber === '2' && (
            <Text style={styles.returnButtonArrow} maxFontSizeMultiplier={1}>
              →
            </Text>
          )}
        </TouchableOpacity>

        {/* Footer Note */}
        <Text style={styles.footerNote} maxFontSizeMultiplier={1}>
          Session {sessionNumber} Complete • Continue training daily to master all competencies
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
  subjectiveCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '44',
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  subjectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  subjectiveIcon: {
    fontSize: 24,
  },
  subjectiveTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  subjectiveText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  criteriaList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  criteriaBullet: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.bodySm,
    color: Colors.primary,
  },
  criteriaText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  subjectiveNote: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 70,
  },
  metricValue: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.headingMd,
    color: Colors.primary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro - 1,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
    textAlign: 'center',
  },
  aiNote: {
    backgroundColor: Colors.primary + '11',
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  aiNoteText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  aiEvaluationSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVar,
  },
  aiEvaluationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiEvaluationIcon: {
    fontSize: 20,
  },
  aiEvaluationTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  aiScoreContainer: {
    marginBottom: Spacing.lg,
  },
  aiScoreLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom: Spacing.xs,
  },
  aiScoreBar: {
    height: 8,
    backgroundColor: Colors.bgHighest,
    borderRadius: Radius.xs,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  aiScoreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  aiScoreValue: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.headingMd,
    color: Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  aiFeedbackSection: {
    marginBottom: Spacing.md,
  },
  aiFeedbackTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.wide,
    marginBottom: Spacing.sm,
  },
  aiFeedbackList: {
    gap: Spacing.sm,
  },
  aiFeedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  aiFeedbackBullet: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.bodyMd,
    color: Colors.primary,
    width: 16,
  },
  aiFeedbackText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  aiSummaryContainer: {
    backgroundColor: Colors.bgBase,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  aiSummaryText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
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
  returnButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
  footerNote: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
