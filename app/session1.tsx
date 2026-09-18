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
import { MaterialIcons } from '@expo/vector-icons';
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
import { useAuthStore } from '../src/store/auth.store';
import { trackEvent } from '../src/services/analytics.service';
import {
  MilledSurface,
  BodyLg,
  Body,
  LabelCaps,
  Mono,
  ForgeButton,
  SegmentedProgress,
  Chip,
  OptionButton,
} from '../src/components/forge';

export default function Session1Screen() {
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

      // replace, not push: the finished session screen must not stay
      // in the stack under session-complete, or Android back / iOS
      // swipe-back would re-enter an already-submitted session.
      router.replace({
        pathname: '/session-complete',
        params: {
          sessionNumber: '1',
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
      {/* Header — matches Session 2's shell */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
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
                  'This will clear today\'s session from the database and reload a fresh question set.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Regenerate',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { devForceRegenerateSession } = require('../src/services/daily-session.service');
                          const success = await devForceRegenerateSession(userId, 1);
                          if (success) {
                            Alert.alert('Success', 'Today\'s Session 1 cache cleared! Reloading...', [
                              { text: 'OK', onPress: () => router.replace('/session1') }
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
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SESSION 01</LabelCaps>
          <Mono tone="tertiary" style={styles.questionId} maxFontSizeMultiplier={1}>
            {currentQuestion.id}
          </Mono>
        </View>

        <View style={styles.progressRow}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>PROGRESS</LabelCaps>
          <Mono tone="tertiary" maxFontSizeMultiplier={1}>
            {currentIndex + 1} / {totalQuestions}
          </Mono>
        </View>
        <SegmentedProgress total={totalQuestions} current={currentIndex} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card — same shell as Session 2, plus a category chip */}
        <MilledSurface style={styles.questionCard}>
          <Chip
            tone="gold"
            label={currentQuestion.category.toUpperCase()}
            style={styles.categoryChip}
          />
          <BodyLg maxFontSizeMultiplier={1}>{currentQuestion.question}</BodyLg>
        </MilledSurface>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.answer_data.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = index === currentQuestion.answer_data.correctIndex;
            const showCorrectState = showFeedback && isCorrectOption;
            const showIncorrectState = showFeedback && isSelected && !isCorrect;

            return (
              <OptionButton
                key={index}
                letter={String.fromCharCode(65 + index)}
                text={option}
                state={
                  showCorrectState ? 'correct'
                  : showIncorrectState ? 'incorrect'
                  : showFeedback ? 'disabled'
                  : isSelected ? 'selected'
                  : 'default'
                }
                onPress={() => handleOptionSelect(index)}
              />
            );
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <MilledSurface
            style={[
              styles.feedbackCard,
              isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            <View style={styles.feedbackHeader}>
              <MaterialIcons
                name={isCorrect ? 'check-circle' : 'cancel'}
                size={20}
                color={isCorrect ? Colors.success : Colors.error}
              />
              <LabelCaps tone={isCorrect ? 'success' : 'error'} maxFontSizeMultiplier={1}>
                {isCorrect ? 'CORRECT' : 'INCORRECT'}
              </LabelCaps>
            </View>

            <Body tone="secondary" style={styles.feedbackExplanation} maxFontSizeMultiplier={1}>
              {currentQuestion.answer_data.explanation}
            </Body>

            {isCorrect && (
              <Chip label={`+${currentQuestion.xp_reward} XP`} tone="success" />
            )}
          </MilledSurface>
        )}
      </ScrollView>

      {/* Footer — submit button pinned below the scrollable content */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {!showFeedback ? (
          <ForgeButton
            label="SUBMIT ANSWER"
            onPress={handleSubmit}
            disabled={selectedOption === null}
          />
        ) : (
          <ForgeButton
            label={isLastQuestion ? 'VIEW RESULTS' : 'NEXT QUESTION'}
            onPress={handleNext}
            iconRight={<MaterialIcons name="arrow-forward" size={18} color={Colors.onPrimary} />}
          />
        )}
      </View>
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
  questionId: {
    fontSize: FontSizes.micro,
  },
  progressRow: {
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

  // Question Card
  questionCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    marginBottom: Spacing.xs,
  },

  // Options
  optionsContainer: {
    gap: Spacing.md,
  },

  // Feedback
  feedbackCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
  },
  feedbackExplanation: {
    lineHeight: 24,
  },

  footer: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVar,
    backgroundColor: Colors.bgBase,
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
});
