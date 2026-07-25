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
import { CornerMarkers } from '../src/components/ui';
import { useAuthStore } from '../src/store/auth.store';
import { trackEvent } from '../src/services/analytics.service';
import {
  evaluateSession3Responses,
  type SubjectiveResponse as AISubjectiveResponse,
  type AIEvaluationResult,
} from '../src/services/ai-evaluation.service';
import { computeSession3XP } from '../src/constants/progression';

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

      // Navigate to completion screen with AI evaluation
      router.push({
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
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
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
              style={{ paddingVertical: 4 }}
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
                style={{
                  backgroundColor: Colors.error + '22',
                  borderColor: Colors.error,
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: Radius.xs,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: Fonts.monoMedium, fontSize: FontSizes.micro - 2, color: Colors.error, letterSpacing: LetterSpacing.wider }}>
                  REGENERATE [DEV]
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText} maxFontSizeMultiplier={1}>
              SESSION 3 • SUBJECTIVE
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText} maxFontSizeMultiplier={1}>
              QUESTION {currentIndex + 1}/{totalQuestions}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Card */}
          <View style={styles.questionCard}>
            <CornerMarkers position="all" color={Colors.primary} />

            <View style={styles.questionHeader}>
              <Text style={styles.questionId} maxFontSizeMultiplier={1}>
                {currentQuestion.id}
              </Text>
              
              {/* Timer UI countdown */}
              {timeRemaining !== null && (
                <View style={[styles.timer, timeRemaining <= 5 && styles.timerUrgent]}>
                  <Text style={[styles.timerText, timeRemaining <= 5 && styles.timerTextUrgent]}>
                    ⏱ {timeRemaining}s
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.typeChip,
                  currentQuestion.type === 'Interview' && styles.typeChipInterview,
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    currentQuestion.type === 'Interview' && styles.typeChipTextInterview,
                  ]}
                  maxFontSizeMultiplier={1}
                >
                  {currentQuestion.type === 'SRT' && 'SRT STYLE'}
                  {currentQuestion.type === 'WAT' && 'WAT STYLE'}
                  {currentQuestion.type === 'Interview' && 'INTERVIEW'}
                </Text>
              </View>
            </View>

            <Text style={styles.questionText} maxFontSizeMultiplier={1}>
              {currentQuestion.question}
            </Text>

            {currentQuestion.prompt && (
              <Text style={styles.promptText} maxFontSizeMultiplier={1}>
                {currentQuestion.prompt}
              </Text>
            )}
          </View>

          {/* Answer Input */}
          <View style={styles.answerContainer}>
            <View style={styles.answerHeader}>
              <Text style={styles.answerLabel} maxFontSizeMultiplier={1}>
                YOUR RESPONSE
              </Text>
              <View style={styles.wordCountContainer}>
                <Text
                  style={[
                    styles.wordCountText,
                    (!meetsMinimum || !withinMaximum) && styles.wordCountWarning,
                  ]}
                  maxFontSizeMultiplier={1}
                >
                  {maxWords ? `${wordCount}/${minWords} (max ${maxWords})` : `${wordCount}/${minWords}`} words
                </Text>
                {meetsMinimum && withinMaximum && (
                  <Text style={styles.wordCountCheck} maxFontSizeMultiplier={1}>
                    ✓
                  </Text>
                )}
              </View>
            </View>

            <TextInput
              style={[
                styles.answerInput,
                currentQuestion.type === 'WAT' && styles.answerInputShort,
                currentQuestion.type === 'Interview' && styles.answerInputLong,
              ]}
              value={answer}
              onChangeText={setAnswer}
              placeholder={getPlaceholder()}
              placeholderTextColor={Colors.textTertiary}
              multiline
              textAlignVertical="top"
              maxFontSizeMultiplier={1}
            />

            {!meetsMinimum && wordCount > 0 && (
              <Text style={styles.warningText} maxFontSizeMultiplier={1}>
                Write at least {minWords} words for a complete response
              </Text>
            )}
            {!withinMaximum && (
              <Text style={styles.warningText} maxFontSizeMultiplier={1}>
                Response exceeds maximum allowed limit of {maxWords} words
              </Text>
            )}
          </View>

          {/* Evaluation Criteria Info */}
          <View style={styles.criteriaCard}>
            <Text style={styles.criteriaTitle} maxFontSizeMultiplier={1}>
              Evaluation Focus Areas
            </Text>
            <View style={styles.criteriaList}>
              {currentQuestion.evaluationCriteria.map((criterion, idx) => (
                <View key={idx} style={styles.criteriaItem}>
                  <Text style={styles.criteriaBullet} maxFontSizeMultiplier={1}>
                    •
                  </Text>
                  <Text style={styles.criteriaText} maxFontSizeMultiplier={1}>
                    {criterion}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.submitButton, (isSubmitDisabled || evaluating) && styles.submitButtonDisabled]}
              onPress={() => handleSubmit()}
              activeOpacity={0.85}
              disabled={isSubmitDisabled || evaluating}
            >
              {evaluating ? (
                <View style={styles.evaluatingContainer}>
                  <ActivityIndicator size="small" color={Colors.onPrimary} />
                  <Text style={styles.submitButtonText} maxFontSizeMultiplier={1}>
                    EVALUATING RESPONSES...
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText} maxFontSizeMultiplier={1}>
                  {isLastQuestion ? 'COMPLETE SESSION' : 'SUBMIT & CONTINUE'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  backButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  sessionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  sessionBadgeText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  progressContainer: {
    gap: Spacing.xs,
  },
  progressText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgHighest,
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.xl,
  },
  questionCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  questionId: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  typeChip: {
    backgroundColor: Colors.bgHighest,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: Radius.xs,
  },
  typeChipInterview: {
    backgroundColor: Colors.primary + '22',
  },
  typeChipText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro - 1,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  typeChipTextInterview: {
    color: Colors.primary,
  },
  questionText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.headingSm,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: Spacing.sm,
  },
  promptText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  answerContainer: {
    marginBottom: Spacing.xl,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  answerLabel: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  wordCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  wordCountText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
  },
  wordCountWarning: {
    color: Colors.error,
  },
  wordCountCheck: {
    fontSize: 14,
    color: Colors.success,
  },
  answerInput: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
  warningText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.micro,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  criteriaCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVar,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  criteriaTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom: Spacing.sm,
  },
  criteriaList: {
    gap: Spacing.xs,
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
  actionContainer: {
    gap: Spacing.md,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  evaluatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  submitButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyMd,
    color: Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
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
  timer: {
    backgroundColor: Colors.bgHighest,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVar,
  },
  timerUrgent: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '11',
  },
  timerText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.textSecondary,
  },
  timerTextUrgent: {
    color: Colors.error,
  },
});
