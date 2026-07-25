// ─────────────────────────────────────────────────────────────
// THE FORGE — Day 1 Session 1
// Database-driven MCQ session flow
// 10 MCQ questions from content service
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPinnedSession1Questions } from '../src/services/content.service';
import type { MCQQuestion } from '../src/types/questions';
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

export default function Day0PrototypeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [responses, setResponses] = useState<boolean[]>([]);
  const [sessionStartTime] = useState(Date.now());

  // Load questions from database — uses pinned assignment so the
  // same questions appear all day regardless of how many times entered.
  useEffect(() => {
    async function loadQuestions() {
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      const { success, data, error: err } = await getPinnedSession1Questions(userId);
      
      if (success && data.length > 0) {
        setQuestions(data as MCQQuestion[]);
        setError(null);
        trackEvent(userId, 'session1_started', { sessionNumber: 1, questionCount: data.length });
      } else {
        setError(err || 'Failed to load questions');
        console.error('[Session 1] Load error:', err);
      }
      
      setLoading(false);
    }

    loadQuestions();
  }, [userId]);

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
  if (error || questions.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle} maxFontSizeMultiplier={1}>
          ⚠️ Unable to Load Session
        </Text>
        <Text style={styles.errorMessage} maxFontSizeMultiplier={1}>
          {error || 'No questions available'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText} maxFontSizeMultiplier={1}>
            GO BACK
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (index: number) => {
    if (!showFeedback) {
      setSelectedOption(index);
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.answer_data.correctIndex;
    setResponses([...responses, isCorrect]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate completion time
      const completionTimeSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      
      // Navigate to completion screen with results
      const correctCount = responses.filter(r => r).length;
      const totalXP = responses.reduce((sum, correct, idx) => {
        return sum + (correct ? questions[idx].xp_reward : 0);
      }, 0);

      // Track session completion
      trackEvent(userId, 'session1_completed', {
        sessionNumber: 1,
        completionTimeSeconds,
        score: correctCount,
        totalQuestions,
        xpEarned: totalXP,
      });

      router.push({
        pathname: '/day0-complete',
        params: {
          score: correctCount.toString(),
          total: totalQuestions.toString(),
          xp: totalXP.toString(),
          completionTime: completionTimeSeconds.toString(),
        },
      });
    } else {
      // Move to next question
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  const isCorrect = selectedOption === currentQuestion.answer_data.correctIndex;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Abort Session?',
              'Your progress will not be saved. You will return to the dashboard.\n\nYou can re-enter this session today and your questions will remain the same.',
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
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText} maxFontSizeMultiplier={1}>
            ← ABORT
          </Text>
        </TouchableOpacity>

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
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          <CornerMarkers position="all" color={Colors.primary} />

          <View style={styles.questionHeader}>
            <Text style={styles.questionId} maxFontSizeMultiplier={1}>
              {currentQuestion.id}
            </Text>
          </View>

          <Text style={styles.questionText} maxFontSizeMultiplier={1}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.answer_data.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === currentQuestion.answer_data.correctIndex;
            const showCorrectState = showFeedback && isCorrectOption;
            const showIncorrectState = showFeedback && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  isSelected && !showFeedback && styles.optionSelected,
                  showCorrectState && styles.optionCorrect,
                  showIncorrectState && styles.optionIncorrect,
                ]}
                onPress={() => handleOptionSelect(index)}
                activeOpacity={showFeedback ? 1 : 0.7}
                disabled={showFeedback}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.radio,
                      isSelected && !showFeedback && styles.radioSelected,
                      showCorrectState && styles.radioCorrect,
                      showIncorrectState && styles.radioIncorrect,
                    ]}
                  >
                    {isSelected && !showFeedback && (
                      <View style={styles.radioDot} />
                    )}
                    {showCorrectState && (
                      <Text style={styles.radioIcon} maxFontSizeMultiplier={1}>
                        ✓
                      </Text>
                    )}
                    {showIncorrectState && (
                      <Text
                        style={[styles.radioIcon, { color: Colors.error }]}
                        maxFontSizeMultiplier={1}
                      >
                        ✕
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      showCorrectState && { color: Colors.success },
                      showIncorrectState && { color: Colors.error },
                    ]}
                    maxFontSizeMultiplier={1}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Section */}
        {showFeedback && (
          <View
            style={[
              styles.feedbackCard,
              isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            <CornerMarkers
              position="all"
              color={isCorrect ? Colors.success : Colors.error}
            />

            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackIcon} maxFontSizeMultiplier={1}>
                {isCorrect ? '✓' : '✕'}
              </Text>
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: isCorrect ? Colors.success : Colors.error },
                ]}
                maxFontSizeMultiplier={1}
              >
                {isCorrect ? 'CORRECT' : 'INCORRECT'}
              </Text>
            </View>

            <Text style={styles.feedbackExplanation} maxFontSizeMultiplier={1}>
              {currentQuestion.answer_data.explanation}
            </Text>

            {(currentQuestion.answer_data as any).fun_fact ? (
              <View style={styles.funFactContainer}>
                <Text style={styles.funFactTitle} maxFontSizeMultiplier={1}>
                  💡 DID YOU KNOW?
                </Text>
                <Text style={styles.funFactText} maxFontSizeMultiplier={1}>
                  {(currentQuestion.answer_data as any).fun_fact}
                </Text>
              </View>
            ) : null}

            {isCorrect && (
              <View style={styles.xpBadge}>
                <Text style={styles.xpText} maxFontSizeMultiplier={1}>
                  +{currentQuestion.xp_reward} XP
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!showFeedback ? (
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedOption === null && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={selectedOption === null}
            >
              <Text style={styles.submitButtonText} maxFontSizeMultiplier={1}>
                SUBMIT ANSWER
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText} maxFontSizeMultiplier={1}>
                {isLastQuestion ? 'VIEW RESULTS' : 'NEXT QUESTION'}
              </Text>
              <Text style={styles.nextButtonArrow} maxFontSizeMultiplier={1}>
                →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVar,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  backButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
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

  // Question Card
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
    marginBottom: Spacing.md,
  },
  questionId: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  questionText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.headingSm,
    color: Colors.textPrimary,
    lineHeight: 28,
  },

  // Options
  optionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVar,
    padding: Spacing.md,
  },
  optionSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primary + '11',
  },
  optionCorrect: {
    borderColor: Colors.success,
    borderWidth: 2,
    backgroundColor: Colors.successBg,
  },
  optionIncorrect: {
    borderColor: Colors.error,
    borderWidth: 2,
    backgroundColor: Colors.errorBg,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  radioIncorrect: {
    borderColor: Colors.error,
    backgroundColor: Colors.error,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioIcon: {
    fontSize: 14,
    color: Colors.onPrimary,
    fontFamily: Fonts.monoMedium,
  },
  optionText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Feedback
  feedbackCard: {
    borderRadius: Radius.lg,
    borderWidth: 2,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  feedbackCorrect: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  feedbackIncorrect: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feedbackIcon: {
    fontSize: 24,
  },
  feedbackTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodySm,
    letterSpacing: LetterSpacing.widest,
  },
  feedbackExplanation: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyMd,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  xpBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  xpText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.label,
    color: Colors.success,
    letterSpacing: LetterSpacing.wider,
  },

  // Actions
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
  submitButtonText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyMd,
    color: Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
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

  // Loading & Error States
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
  funFactContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVar,
    gap: Spacing.xs,
  },
  funFactTitle: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.micro,
    color: Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  funFactText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodySm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
