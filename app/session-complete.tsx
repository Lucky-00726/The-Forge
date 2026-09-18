// ─────────────────────────────────────────────────────────────
// THE FORGE — Session Completion Screen
// Unified completion for all session types
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, Spacing, Radius } from '../src/constants/tokens';
import { useAuthStore } from '../src/store/auth.store';
import { useSessionCompletion } from '../src/hooks/useSessionCompletion';
import {
  MilledSurface,
  RecessedTrack,
  Display,
  Headline,
  BodyLg,
  Body,
  LabelCaps,
  Mono,
  ForgeButton,
} from '../src/components/forge';

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const sessionNumber = params.sessionNumber || '0';
  const sessionNum = parseInt(sessionNumber, 10);
  // Guard: session-complete handles sessions 1, 2 and 3.
  // If sessionNumber is missing or invalid, treat as session 2 to avoid
  // a DB constraint violation (CHECK session_number IN (1, 2, 3)).
  const validSessionNum = (
    sessionNum === 1 || sessionNum === 2 || sessionNum === 3 ? sessionNum : 2
  ) as 1 | 2 | 3;
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

  const {
    saving,
    saved,
    error,
    isReview,
    dayAdvanced,
    newTrainingDay,
    programCompleted,
    status: completionStatus,
    retry,
  } = useSessionCompletion({
    userId,
    sessionNumber: validSessionNum,
    xpEarned,
    score: isSubjective ? null : score,
    total,
    completionTimeSeconds,
    difficulty: isSubjective ? 'Subjective' : percentage >= 70 ? 'Hard' : percentage >= 50 ? 'Mixed' : 'Easy',
  });

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
  }, []);

  const handleReturnToDashboard = () => {
    router.replace('/(tabs)');
  };

  const handleContinueNext = () => {
    if (sessionNumber === '1') {
      router.replace('/session2');
    } else if (sessionNumber === '2') {
      router.replace('/session3');
    } else {
      router.replace('/(tabs)');
    }
  };

  // A day transition, a finished program, or a stale screen all mean
  // there is no "next session" to continue into — send the user home
  // regardless of which session number this screen was showing.
  const forcedHome =
    completionStatus === 'day_mismatch' ||
    completionStatus === 'program_completed' ||
    programCompleted ||
    dayAdvanced;

  const handlePrimaryAction = () => {
    if (forcedHome) {
      handleReturnToDashboard();
    } else {
      handleContinueNext();
    }
  };

  const nextSessionLabel =
    sessionNumber === '1' ? 'CONTINUE TO SESSION 2' :
    sessionNumber === '2' ? 'CONTINUE TO SESSION 3' :
    null;

  // Which of today's 3 sessions are done, for the training-day cell row.
  // The app enforces Session 1 → 2 → 3 order, so a lower session number
  // is already complete by the time this screen can render for a higher
  // one — this reads that ordering rather than fetching per-day status.
  const sessionCells = [1, 2, 3].map(
    (n) => n < validSessionNum || (n === validSessionNum && (saved || isReview) && !error)
  );

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
          <Mono tone="tertiary" maxFontSizeMultiplier={1}>
            SESSION {String(sessionNum).padStart(2, '0')}
          </Mono>
          <Display maxFontSizeMultiplier={1}>COMPLETE</Display>
          <View style={styles.headerRule} />
        </View>

        {/* Score circle — the one place a centred layout is right:
            this is a terminal screen, not a step in a flow. For a
            subjective session it shows responses completed, not a
            score — same isSubjective branch as before, new skin. */}
        <View style={styles.scoreCircleWrap}>
          <View style={[styles.scoreCircle, { borderColor: getPerformanceColor() }]}>
            <Display
              style={{ color: getPerformanceColor() }}
              maxFontSizeMultiplier={1}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {isSubjective
                ? `${objectiveMetrics?.responsesSubmitted ?? 0}/${objectiveMetrics?.totalQuestions ?? total}`
                : `${score}/${total}`}
            </Display>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>
              {isSubjective ? 'RESPONSES' : `${percentage}% ACCURACY`}
            </LabelCaps>
          </View>
        </View>

        <BodyLg style={styles.performanceMessage} maxFontSizeMultiplier={1}>
          {getPerformanceMessage()}
        </BodyLg>

        {/* Day / program transition — driven by the complete_daily_session
            RPC result, not by isSubjective. */}
        {completionStatus === 'day_mismatch' && (
          <MilledSurface style={styles.transitionCard}>
            <LabelCaps tone="error" maxFontSizeMultiplier={1}>SESSION OUT OF DATE</LabelCaps>
            <Body tone="secondary" maxFontSizeMultiplier={1}>
              This session no longer matches your current training day, so nothing was recorded here.
              Return to the dashboard to continue.
            </Body>
          </MilledSurface>
        )}

        {completionStatus !== 'day_mismatch' && (completionStatus === 'program_completed' || programCompleted) && (
          <MilledSurface brackets style={styles.transitionCard}>
            <Headline tone="gold" maxFontSizeMultiplier={1}>PROGRAM COMPLETE</Headline>
            <Body tone="secondary" maxFontSizeMultiplier={1}>
              You've completed all 30 training days. Outstanding work.
            </Body>
          </MilledSurface>
        )}

        {completionStatus === 'completed' && dayAdvanced && !programCompleted && newTrainingDay !== null && (
          <View style={styles.dayTransitionRow}>
            <View>
              <Headline tone="success" maxFontSizeMultiplier={1}>
                DAY {String(newTrainingDay - 1).padStart(2, '0')} COMPLETE
              </Headline>
              <Mono tone="gold" maxFontSizeMultiplier={1}>
                NEXT: DAY {String(newTrainingDay).padStart(2, '0')}
              </Mono>
            </View>
            <Mono tone="gold" maxFontSizeMultiplier={1}>→</Mono>
          </View>
        )}

        {/* XP Award card — Mode A (first completion) or Mode B (review) */}
        <MilledSurface brackets bracketTone={isReview ? 'muted' : 'primary'} style={styles.xpCard}>
          <LabelCaps tone={isReview ? 'tertiary' : 'secondary'} maxFontSizeMultiplier={1}>
            {isReview ? 'SESSION ALREADY COMPLETE' : 'XP EARNED'}
          </LabelCaps>

          {isReview ? (
            // Mode B: Review — read-only, no XP awarded
            <View style={styles.reviewContainer}>
              <Body tone="secondary" maxFontSizeMultiplier={1}>
                You completed this session earlier today.
              </Body>
              <Body tone="tertiary" maxFontSizeMultiplier={1}>
                XP has already been awarded. No additional XP is earned on review.
              </Body>
            </View>
          ) : (
            // Mode A: First completion — show XP earned and save state
            <>
              <View style={styles.xpValueRow}>
                <MaterialIcons name="bolt" size={22} color={Colors.success} />
                <Headline tone="success" maxFontSizeMultiplier={1}>
                  +{xpEarned} XP
                </Headline>
              </View>

              {saving && (
                <View style={styles.savingRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Mono tone="tertiary" maxFontSizeMultiplier={1}>Saving progress...</Mono>
                </View>
              )}

              {saved && !saving && (
                <View style={styles.savedRow}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                  <Mono tone="success" maxFontSizeMultiplier={1}>Progress saved</Mono>
                </View>
              )}

              {error && (
                <View style={styles.errorBox}>
                  <Body tone="error" maxFontSizeMultiplier={1}>{error}</Body>
                  <TouchableOpacity onPress={retry} activeOpacity={0.7}>
                    <Mono tone="error" style={styles.retryText} maxFontSizeMultiplier={1}>RETRY</Mono>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </MilledSurface>

        {/* Training day — which of today's 3 sessions are done. Derived
            from validSessionNum + this screen's own save outcome above,
            not a new data fetch (see the sessionCells comment). */}
        <View style={styles.trainingDayHeader}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TRAINING DAY</LabelCaps>
          <Mono tone="tertiary" maxFontSizeMultiplier={1}>
            {sessionCells.filter(Boolean).length} / 3 SESSIONS
          </Mono>
        </View>
        <View style={styles.sessionCellsRow}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[styles.sessionCell, sessionCells[n - 1] && styles.sessionCellDone]}>
              {sessionCells[n - 1] ? (
                <MaterialIcons name="check" size={16} color={Colors.success} />
              ) : (
                <Mono tone="tertiary" maxFontSizeMultiplier={1}>{n}</Mono>
              )}
            </View>
          ))}
        </View>

        {/* Subjective Session Metrics */}
        {isSubjective && objectiveMetrics && (
          <MilledSurface brackets style={styles.subjectiveCard}>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SESSION SUMMARY</LabelCaps>

            <Body tone="secondary" style={styles.subjectiveText} maxFontSizeMultiplier={1}>
              Session {sessionNumber} completed. Here are your submission metrics:
            </Body>

            <View style={styles.metricsGrid}>
              <RecessedTrack style={styles.metricCard}>
                <Headline tone="gold" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
                  {objectiveMetrics.responsesSubmitted}/{objectiveMetrics.totalQuestions}
                </Headline>
                <LabelCaps tone="tertiary" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
                  RESPONSES
                </LabelCaps>
              </RecessedTrack>

              <RecessedTrack style={styles.metricCard}>
                <Headline tone="gold" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
                  {objectiveMetrics.averageWordCount}
                </Headline>
                <LabelCaps tone="tertiary" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
                  AVG WORDS
                </LabelCaps>
              </RecessedTrack>

              <RecessedTrack style={styles.metricCard}>
                <Headline tone="gold" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
                  {objectiveMetrics.completionTime}
                </Headline>
                <LabelCaps tone="tertiary" numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1}>
                  TIME
                </LabelCaps>
              </RecessedTrack>
            </View>

            {/* AI Evaluation Section */}
            {aiEvaluation && (
              <View style={styles.aiEvaluationSection}>
                <LabelCaps tone="secondary" style={styles.aiEvaluationHeader} maxFontSizeMultiplier={1}>
                  AI EVALUATION
                </LabelCaps>

                {/* Overall Score */}
                <View style={styles.aiScoreContainer}>
                  <LabelCaps tone="tertiary" maxFontSizeMultiplier={1}>Overall Score</LabelCaps>
                  <RecessedTrack style={styles.aiScoreBar}>
                    <View style={[styles.aiScoreBarFill, { width: `${aiEvaluation.overallScore}%` }]} />
                  </RecessedTrack>
                  <Headline tone="gold" maxFontSizeMultiplier={1}>
                    {aiEvaluation.overallScore}/100
                  </Headline>
                </View>

                {/* Strengths */}
                {aiEvaluation.strengths && aiEvaluation.strengths.length > 0 && (
                  <View style={styles.aiFeedbackSection}>
                    <LabelCaps tone="primary" maxFontSizeMultiplier={1}>STRENGTHS</LabelCaps>
                    <View style={styles.aiFeedbackList}>
                      {aiEvaluation.strengths.map((strength: string, idx: number) => (
                        <View key={idx} style={styles.aiFeedbackItem}>
                          <Mono tone="success" maxFontSizeMultiplier={1}>✓</Mono>
                          <Body tone="secondary" style={styles.aiFeedbackText} maxFontSizeMultiplier={1}>
                            {strength}
                          </Body>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Improvements */}
                {aiEvaluation.improvements && aiEvaluation.improvements.length > 0 && (
                  <View style={styles.aiFeedbackSection}>
                    <LabelCaps tone="primary" maxFontSizeMultiplier={1}>AREAS FOR GROWTH</LabelCaps>
                    <View style={styles.aiFeedbackList}>
                      {aiEvaluation.improvements.map((improvement: string, idx: number) => (
                        <View key={idx} style={styles.aiFeedbackItem}>
                          <Mono tone="gold" maxFontSizeMultiplier={1}>•</Mono>
                          <Body tone="secondary" style={styles.aiFeedbackText} maxFontSizeMultiplier={1}>
                            {improvement}
                          </Body>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Summary */}
                {aiEvaluation.summary && (
                  <RecessedTrack style={styles.aiSummaryContainer}>
                    <Body tone="primary" style={styles.aiSummaryText} maxFontSizeMultiplier={1}>
                      {aiEvaluation.summary}
                    </Body>
                  </RecessedTrack>
                )}
              </View>
            )}

            {!aiEvaluation && (
              <View style={styles.aiNote}>
                <Body tone="secondary" style={styles.aiNoteText} maxFontSizeMultiplier={1}>
                  💡 AI evaluation provides developmental feedback on your responses. Enable it in settings or check your API configuration.
                </Body>
              </View>
            )}
          </MilledSurface>
        )}

        {/* Insights */}
        <MilledSurface style={styles.insightsCard}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TRAINING INSIGHTS</LabelCaps>
          <Body tone="secondary" style={styles.insightsText} maxFontSizeMultiplier={1}>
            {isSubjective
              ? 'Your subjective responses demonstrate your thought process and approach to real-world scenarios. AI evaluation will provide personalized developmental feedback.'
              : percentage >= 70
              ? `Excellent performance in Session ${sessionNumber}. Your understanding of SSB fundamentals is strong. Continue building on this foundation.`
              : percentage >= 50
              ? `Good progress in Session ${sessionNumber}. Review the explanations for incorrect answers to strengthen your knowledge base.`
              : `Session ${sessionNumber} shows areas for improvement. Focus on understanding the reasoning behind each answer to build stronger fundamentals.`}
          </Body>
        </MilledSurface>

        {/* Action Button */}
        <ForgeButton
          label={!forcedHome && nextSessionLabel ? nextSessionLabel : 'RETURN TO COMMAND'}
          iconRight={!forcedHome && nextSessionLabel ? <Text style={styles.returnButtonArrow}>→</Text> : undefined}
          onPress={handlePrimaryAction}
          style={styles.returnButton}
        />

        {/* Secondary escape hatch — only meaningful when the primary
            button continues into another session; when it already
            goes home (forcedHome), a second "return to command" would
            be redundant. */}
        {!forcedHome && nextSessionLabel && (
          <ForgeButton
            label="RETURN TO COMMAND"
            variant="ghost"
            onPress={handleReturnToDashboard}
            style={styles.secondaryButton}
          />
        )}

        {/* Footer Note */}
        <Mono tone="tertiary" style={styles.footerNote} maxFontSizeMultiplier={1}>
          Session {sessionNumber} Complete • Continue training daily to master all competencies
        </Mono>
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
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'center',
  },
  headerRule: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  scoreCircleWrap: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  scoreCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.bgSurface,
  },
  performanceMessage: {
    textAlign: 'center',
  },
  transitionCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  dayTransitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
  },
  xpCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  xpValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  errorBox: {
    backgroundColor: Colors.errorBg,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    gap: Spacing.sm,
  },
  retryText: {
    alignSelf: 'flex-start',
  },
  reviewContainer: {
    gap: Spacing.sm,
  },
  trainingDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCellsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sessionCell: {
    flex: 1,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVar,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCellDone: {
    borderColor: Colors.successDim,
    backgroundColor: Colors.successBg,
  },
  subjectiveCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  subjectiveText: {
    marginBottom: Spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 70,
  },
  aiNote: {
    backgroundColor: Colors.primary + '11',
    borderRadius: Radius.sm,
    padding: Spacing.md,
  },
  aiNoteText: {
    lineHeight: 20,
  },
  aiEvaluationSection: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVar,
    gap: Spacing.md,
  },
  aiEvaluationHeader: {
    marginBottom: Spacing.xs,
  },
  aiScoreContainer: {
    gap: Spacing.xs,
  },
  aiScoreBar: {
    height: 8,
    overflow: 'hidden',
  },
  aiScoreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  aiFeedbackSection: {
    gap: Spacing.sm,
  },
  aiFeedbackList: {
    gap: Spacing.sm,
  },
  aiFeedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  aiFeedbackText: {
    flex: 1,
    lineHeight: 22,
  },
  aiSummaryContainer: {
    padding: Spacing.md,
  },
  aiSummaryText: {
    fontStyle: 'italic',
  },
  insightsCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  insightsText: {
    lineHeight: 24,
  },
  returnButton: {
    marginTop: Spacing.xs,
  },
  secondaryButton: {
    alignSelf: 'center',
  },
  returnButtonArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyLg,
    color: Colors.onPrimary,
  },
  footerNote: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
