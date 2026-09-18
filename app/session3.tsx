// ─────────────────────────────────────────────────────────────
// THE FORGE — Session 3
// Subjective questions: SRT, WAT, Interview style
// AI evaluation integrated via OpenRouter
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPinnedSession3Questions } from '../src/services/content.service';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
} from '../src/constants/tokens';
import { useAuthStore } from '../src/store/auth.store';
import { trackEvent } from '../src/services/analytics.service';
import {
  evaluateSession3Responses,
  type SubjectiveResponse as AISubjectiveResponse,
  type AIEvaluationResult,
} from '../src/services/ai-evaluation.service';
import { computeSession3XP } from '../src/constants/progression';
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
  SegmentedProgress,
} from '../src/components/forge';

type SubjectiveResponse = {
  questionId: string;
  answer: string;
  wordCount: number;
  xpEarned: number;
};

// Local shape consumed by this screen (mapped from database rows)
type Session3Question = {
  id: string;
  type: 'SRT' | 'WAT' | 'Interview';
  question: string;
  prompt?: string;
  minWords?: number;
  maxWords?: number;
  timeLimit: number;
  xp: number;
  evaluationCriteria: string[];
};

// Session 3 XP is now effort-based: computeSession3XP(type, wordCount)
// is called at submission time in handleSubmit() below.
// The question object still carries a type for the effort-tier lookup.
// SESSION3_XP_BY_TYPE has been removed — it awarded flat XP regardless
// of response quality, which enabled Commander rank in 3 days.

export default function Session3Screen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Session3Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [responses, setResponses] = useState<SubjectiveResponse[]>([]);
  const [sessionStartTime] = useState(Date.now());
  const [evaluating, setEvaluating] = useState(false);

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answerRef = useRef(answer);

  // Keep answerRef in sync with answer state to avoid stale closure issue in timer callback
  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Load questions from database — pinned for the day
  useEffect(() => {
    async function loadQuestions() {
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      const { success, data, error } = await getPinnedSession3Questions(userId);

      if (success && data.length > 0) {
        const mapped: Session3Question[] = data.map((q) => {
          const type = (q.question_type as Session3Question['type']) ?? 'SRT';
          const answerData = (q.answer_data ?? {}) as {
            minWords?: number;
            maxWords?: number;
            evaluationCriteria?: string[];
          };
          if (q.time_limit == null) {
            console.warn(`[Session 3] Question ${q.id} has no time_limit — falling back to a default. This should come from content, not a fallback.`);
          }

          return {
            id: q.id,
            type,
            question: q.question,
            prompt: q.prompt ?? undefined,
            minWords: answerData.minWords,
            maxWords: answerData.maxWords,
            timeLimit: q.time_limit ?? (type === 'WAT' ? 15 : type === 'SRT' ? 30 : 120),
            // xp is NOT stored on the question object here — it is
            // computed effort-based at submission time via computeSession3XP()
            xp: 0,
            evaluationCriteria: answerData.evaluationCriteria ?? [],
          };
        });
        setQuestions(mapped);
        setLoadError(null);
        trackEvent(userId, 'session3_started', {
          sessionNumber: 3,
          questionCount: mapped.length,
        });
      } else {
        setLoadError(error || 'Failed to load questions');
        console.error('[Session 3] Load error:', error);
      }

      setLoading(false);
    }

    loadQuestions();
  }, [userId]);

  // Timer countdown hook for subjective questions
  useEffect(() => {
    if (currentQuestion && !loading && !evaluating) {
      const timeLimit = currentQuestion.timeLimit;
      setTimeRemaining(timeLimit);
      setTimerActive(true);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimerActive(false);
            
            // Auto-submit current answer (from ref) when time runs out
            handleSubmit(answerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, loading, evaluating]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText} maxFontSizeMultiplier={1}>
          Loading questions...
        </Text>
      </View>
    );
  }

  // Error state
  if (loadError || questions.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle} maxFontSizeMultiplier={1}>
          ⚠️ Unable to Load Session
        </Text>
        <Text style={styles.errorMessage} maxFontSizeMultiplier={1}>
          {loadError || 'No questions available'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText} maxFontSizeMultiplier={1}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const wordCount = answer.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const minWords = currentQuestion.minWords ?? 10;
  const maxWords = currentQuestion.maxWords;
  const meetsMinimum = wordCount >= minWords;
  const withinMaximum = maxWords ? wordCount <= maxWords : true;
  const isSubmitDisabled = !meetsMinimum || !withinMaximum;

  const handleSubmit = async (forceValue?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);

    // Read the latest answer value
    const finalAnswer = forceValue !== undefined ? forceValue : answerRef.current;
    const finalWordCount = finalAnswer.trim().split(/\s+/).filter((w) => w.length > 0).length;

    const response: SubjectiveResponse = {
      questionId: currentQuestion.id,
      answer: finalAnswer.trim(),
      wordCount: finalWordCount,
      // Effort-based XP: computed from response word count using the
      // EFFORT_TIERS in progression.ts.
      // Examples:
      //   10–29 words  → floor(10 × 0.75) = 7 XP
      //   30–59 words  → 10 XP
      //   60–99 words  → floor(10 × 1.25) = 12 XP
      //   100+ words   → floor(10 × 1.5)  = 15 XP
      //   <10 words    → 0 XP (blocked by meetsMinimum gate above)
      xpEarned: computeSession3XP(currentQuestion.type, finalWordCount),
    };

    const allResponses = [...responses, response];
    setResponses(allResponses);
    
    // Move directly to next question
    if (isLastQuestion) {
      setEvaluating(true);
      const completionTimeSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      const totalXP = allResponses.reduce((sum, r) => sum + r.xpEarned, 0);

      // Track AI evaluation start
      trackEvent(userId, 'ai_evaluation_started', {
        sessionNumber: 3,
        responseCount: allResponses.length,
      });

      // Prepare responses for AI evaluation
      const aiResponses: AISubjectiveResponse[] = allResponses.map((r) => {
        const question = questions.find((q) => q.id === r.questionId);
        return {
          questionId: r.questionId,
          questionType: question?.type || 'SRT',
          question: question?.question || '',
          answer: r.answer,
        };
      });

      // Evaluate responses (non-blocking - failure doesn't block progression)
      let aiEvaluation: AIEvaluationResult | null = null;
      try {
        const { result, metrics } = await evaluateSession3Responses(aiResponses);
        
        if (result) {
          aiEvaluation = result;
          trackEvent(userId, 'ai_evaluation_completed', {
            sessionNumber: 3,
            overallScore: result.overallScore,
            duration: metrics.duration,
            model: metrics.model,
          });
        } else {
          trackEvent(userId, 'ai_evaluation_failed', {
            sessionNumber: 3,
            error: metrics.error || 'Unknown error',
            duration: metrics.duration,
          });
        }
      } catch (error) {
        console.error('[Session 3] AI evaluation error:', error);
        trackEvent(userId, 'ai_evaluation_failed', {
          sessionNumber: 3,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      setEvaluating(false);

      // Track session completion and day completion
      trackEvent(userId, 'session3_completed', {
        sessionNumber: 3,
        completionTimeSeconds,
        totalQuestions: totalQuestions,
        xpEarned: totalXP,
      });

      // Track Day 1 completion (all 3 sessions done)
      trackEvent(userId, 'day1_completed');

      // Navigate to completion screen with AI evaluation.
      // replace, not push: the finished session screen must not stay
      // in the stack under session-complete, or Android back / iOS
      // swipe-back would re-enter an already-submitted session.
      router.replace({
        pathname: '/session-complete',
        params: {
          sessionNumber: '3',
          score: totalQuestions.toString(),
          total: totalQuestions.toString(),
          xp: totalXP.toString(),
          subjective: 'true',
          responsesData: JSON.stringify(allResponses.map(r => ({
            questionId: r.questionId,
            wordCount: r.wordCount,
          }))),
          completionTime: completionTimeSeconds.toString(),
          aiEvaluation: aiEvaluation ? JSON.stringify(aiEvaluation) : undefined,
        },
      });
    } else {
      setCurrentIndex(currentIndex + 1);
      setAnswer('');
    }
  };

  const getPlaceholder = () => {
    if (currentQuestion.type === 'WAT') {
      return 'Write your immediate thought...';
    } else if (currentQuestion.type === 'SRT') {
      return 'Describe your response concisely...';
    } else {
      return 'Share your answer honestly...';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.innerContainer, { paddingTop: insets.top }]}>
        {/* Header — identical shell for all three question types */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Abort Session?',
                  'Your responses will not be saved. You will return to the dashboard.\n\nYou can re-enter this session today and your questions will remain the same.',
                  [
                    { text: 'Continue Training', style: 'cancel' },
                    {
                      text: 'Abort',
                      style: 'destructive',
                      onPress: () => router.replace('/(tabs)'),
                    },
                  ]
                );
              }}
              style={styles.abortButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText} maxFontSizeMultiplier={1}>
                ← ABORT
              </Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    '[DEV] Regenerate Today\'s Session?',
                    'This will clear today\'s session from the database and reload a fresh subjective session layout.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Regenerate',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            const { devForceRegenerateSession } = require('../src/services/daily-session.service');
                            const success = await devForceRegenerateSession(userId, 3);
                            if (success) {
                              Alert.alert('Success', 'Today\'s Session 3 cache cleared! Reloading...', [
                                { text: 'OK', onPress: () => router.replace('/session3') }
                              ]);
                            } else {
                              Alert.alert('Error', 'Failed to delete cached session.');
                            }
                          } catch (err) {
                            console.error(err);
                            Alert.alert('Error', 'An error occurred.');
                          }
                        }
                      }
                    ]
                  );
                }}
                style={styles.devButton}
                activeOpacity={0.7}
              >
                <Text style={styles.devButtonText} maxFontSizeMultiplier={1}>
                  REGENERATE [DEV]
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sessionRow}>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SESSION 03</LabelCaps>
            <Mono tone="tertiary" maxFontSizeMultiplier={1}>
              QUESTION {currentIndex + 1} / {totalQuestions}
            </Mono>
          </View>
          <SegmentedProgress total={totalQuestions} current={currentIndex} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Test Parameter card — same shell for all three types.
              The controller owns timeRemaining; this only displays it. */}
          <MilledSurface style={styles.paramCard}>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TEST PARAMETER</LabelCaps>

            <View style={styles.paramTypeRow}>
              <Headline maxFontSizeMultiplier={1}>{currentQuestion.type}</Headline>
              <View style={styles.paramDivider} />
              <Body tone="secondary" maxFontSizeMultiplier={1}>
                {currentQuestion.type === 'SRT' ? 'Situation Reaction Test'
                  : currentQuestion.type === 'WAT' ? 'Word Association Test'
                  : 'Personal Interview'}
              </Body>
            </View>

            {timeRemaining !== null && (
              <>
                <View style={styles.paramTimerRow}>
                  <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>REMAINING TIME</LabelCaps>
                  <Mono
                    tone={timeRemaining <= 5 ? 'error' : 'gold'}
                    maxFontSizeMultiplier={1}
                  >
                    {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
                  </Mono>
                </View>
                <SegmentedProgress
                  total={10}
                  current={Math.min(10, Math.round(((currentQuestion.timeLimit - timeRemaining) / currentQuestion.timeLimit) * 10))}
                />
                <Mono tone="tertiary" style={styles.paramTimerCaption} maxFontSizeMultiplier={1}>
                  Auto-submits when time expires
                </Mono>
              </>
            )}
          </MilledSurface>

          {/* Prompt — SRT */}
          {currentQuestion.type === 'SRT' && (
            <MilledSurface style={[styles.promptCard, styles.promptAccent]}>
              <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SCENARIO ANALYSIS</LabelCaps>
              <BodyLg style={styles.promptText} maxFontSizeMultiplier={1}>
                {currentQuestion.question}
              </BodyLg>
              {!!currentQuestion.prompt && (
                <Body tone="secondary" style={styles.promptSubtext} maxFontSizeMultiplier={1}>
                  {currentQuestion.prompt}
                </Body>
              )}
            </MilledSurface>
          )}

          {/* Prompt — WAT: the one place a centred treatment is correct,
              because the content is a single word. The card is centred;
              the page is not. */}
          {currentQuestion.type === 'WAT' && (
            <MilledSurface style={styles.watCard}>
              <Display style={styles.watWord} maxFontSizeMultiplier={1}>
                {currentQuestion.question}
              </Display>
              {!!currentQuestion.prompt && (
                <Body tone="secondary" style={styles.promptSubtext} maxFontSizeMultiplier={1}>
                  {currentQuestion.prompt}
                </Body>
              )}
            </MilledSurface>
          )}

          {/* Prompt — Personal Interview */}
          {currentQuestion.type === 'Interview' && (
            <MilledSurface style={[styles.promptCard, styles.promptAccent]}>
              <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>INTERVIEW QUESTION</LabelCaps>
              <BodyLg style={styles.promptText} maxFontSizeMultiplier={1}>
                {currentQuestion.question}
              </BodyLg>
              {!!currentQuestion.prompt && (
                <Body tone="secondary" style={styles.promptSubtext} maxFontSizeMultiplier={1}>
                  {currentQuestion.prompt}
                </Body>
              )}
            </MilledSurface>
          )}

          {/* Answer — shared shell for all three types */}
          <View style={styles.answerSection}>
            <View style={styles.answerHeader}>
              <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>YOUR RESPONSE</LabelCaps>
              <View style={styles.wordCountRow}>
                <Mono
                  tone={(!meetsMinimum || !withinMaximum) ? 'error' : 'tertiary'}
                  maxFontSizeMultiplier={1}
                >
                  {maxWords ? `${wordCount}/${minWords} (max ${maxWords})` : `${wordCount}/${minWords}`} words
                </Mono>
                {meetsMinimum && withinMaximum && (
                  <MaterialIcons name="check-circle" size={14} color={Colors.success} />
                )}
              </View>
            </View>

            <RecessedTrack style={styles.answerTrack}>
              <TextInput
                style={[
                  styles.answerInput,
                  currentQuestion.type === 'WAT' && styles.answerInputShort,
                  currentQuestion.type === 'Interview' && styles.answerInputLong,
                ]}
                value={answer}
                onChangeText={setAnswer}
                placeholder={currentQuestion.type === 'Interview' ? 'Write your response honestly...' : getPlaceholder()}
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
                maxFontSizeMultiplier={1}
              />
            </RecessedTrack>

            {currentQuestion.type === 'SRT' && (
              <Body tone="secondary" style={styles.srtGuidance} maxFontSizeMultiplier={1}>
                Respond naturally and decisively.
              </Body>
            )}

            {!meetsMinimum && wordCount > 0 && (
              <Body tone="error" style={styles.warningText} maxFontSizeMultiplier={1}>
                Write at least {minWords} words for a complete response
              </Body>
            )}
            {!withinMaximum && (
              <Body tone="error" style={styles.warningText} maxFontSizeMultiplier={1}>
                Response exceeds maximum allowed limit of {maxWords} words
              </Body>
            )}
          </View>

          {/* Evaluation Criteria Info */}
          <MilledSurface style={styles.criteriaCard}>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>EVALUATION FOCUS AREAS</LabelCaps>
            <View style={styles.criteriaList}>
              {currentQuestion.evaluationCriteria.map((criterion, idx) => (
                <View key={idx} style={styles.criteriaItem}>
                  <Mono tone="gold" maxFontSizeMultiplier={1}>•</Mono>
                  <Body tone="secondary" style={styles.criteriaText} maxFontSizeMultiplier={1}>
                    {criterion}
                  </Body>
                </View>
              ))}
            </View>
          </MilledSurface>
        </ScrollView>

        {/* Footer — submit button pinned below the scrollable content */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <ForgeButton
            label={evaluating ? 'EVALUATING RESPONSES...' : isLastQuestion ? 'COMPLETE SESSION' : 'SUBMIT & CONTINUE'}
            icon={evaluating ? <ActivityIndicator size="small" color={Colors.onPrimary} /> : undefined}
            onPress={() => handleSubmit()}
            disabled={isSubmitDisabled || evaluating}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVar,
    gap: Spacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  abortButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  devButton: {
    backgroundColor: Colors.error + '22',
    borderColor: Colors.error,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
  },
  devButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro - 2,
    color: Colors.error,
    letterSpacing: LetterSpacing.wider,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  paramCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  paramTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  paramDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.outlineVar,
  },
  paramTimerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  paramTimerCaption: {
    alignSelf: 'center',
  },
  promptCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  promptAccent: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  promptText: {
    lineHeight: 24,
  },
  promptSubtext: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  watCard: {
    alignSelf: 'center',
    minWidth: 200,
    maxWidth: '80%',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  watWord: {
    textAlign: 'center',
  },
  answerSection: {
    gap: Spacing.sm,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  answerTrack: {
    padding: Spacing.md,
  },
  answerInput: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textPrimary,
    minHeight: 120,
    lineHeight: 24,
  },
  answerInputShort: {
    minHeight: 80,
  },
  answerInputLong: {
    minHeight: 160,
  },
  srtGuidance: {
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: FontSizes.micro,
  },
  criteriaCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  criteriaList: {
    gap: Spacing.xs,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  criteriaText: {
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVar,
    backgroundColor: Colors.bgBase,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.gutter,
  },
  loadingText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.headingMd,
    color: Colors.error,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  retryButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyMd,
    color: Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
});
