// ─────────────────────────────────────────────────────────────
// THE FORGE — Session 2
// Mixed question types: MCQ, Single Word, Numeric, Rapid Response
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPinnedSession2Questions } from '../src/services/content.service';
import { type Session2Question } from '../src/data/session2-mock';
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
  RecessedTrack,
  CornerBrackets,
  BodyLg,
  Body,
  LabelCaps,
  Mono,
  ForgeButton,
  SegmentedProgress,
  Chip,
  OptionButton,
} from '../src/components/forge';

type QuestionResponse = {
  correct: boolean;
  xpEarned: number;
};

export default function Session2Screen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Session2Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // Presentational only — never read by handleSubmit/canSubmit/scoring/
  // navigation. Drives the focus-reactive CornerBrackets on the text-input
  // answer areas (Single Word / Numeric / Rapid Response), per spec.
  const [inputFocused, setInputFocused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions from database — pinned for the day
  useEffect(() => {
    async function loadQuestions() {
      if (!userId) { setLoading(false); return; }
      setLoading(true);
      const { success, data, error } = await getPinnedSession2Questions(userId);

      if (success && data.length > 0) {
        const mapped: Session2Question[] = data.map((q) => {
          const ad = (q.answer_data ?? {}) as any;
          const base = { id: q.id, xp: q.xp_reward };

          switch (q.question_type) {
            case 'SingleWord':
              return {
                ...base,
                type: 'SingleWord',
                question: q.question,
                correctAnswer: ad.correctAnswer ?? '',
                acceptableAnswers: ad.acceptableAnswers ?? [],
                explanation: ad.explanation ?? '',
              };
            case 'Numeric':
              return {
                ...base,
                type: 'Numeric',
                question: q.question,
                correctAnswer: ad.correctAnswer ?? 0,
                tolerance: ad.tolerance,
                unit: ad.unit,
                explanation: ad.explanation ?? '',
              };
            case 'TrueFalse':
              return {
                ...base,
                type: 'TrueFalse',
                question: q.question,
                correctAnswer: Boolean(ad.correctAnswer),
                explanation: ad.explanation ?? '',
              };
            case 'RapidResponse':
              return {
                ...base,
                type: 'RapidResponse',
                question: q.question,
                correctAnswer: q.correct_answer ?? ad.correctAnswer ?? '',
                acceptableAnswers: ad.acceptableAnswers ?? [
                  (q.correct_answer ?? ad.correctAnswer ?? '').toLowerCase().trim()
                ],
                timeLimit: q.time_limit_seconds ?? q.time_limit ?? 20,
                explanation: ad.explanation ?? '',
              };
            case 'MCQ':
            default:
              return {
                ...base,
                type: 'MCQ',
                question: q.question,
                options: ad.options ?? [],
                correctIndex: ad.correctIndex ?? 0,
                explanation: ad.explanation ?? '',
              };
          }
        });
        setQuestions(mapped);
        setLoadError(null);
        trackEvent(userId, 'session2_started', {
          sessionNumber: 2,
          questionCount: mapped.length,
        });
      } else {
        setLoadError(error || 'Failed to load questions');
        console.error('[Session 2] Load error:', error);
      }

      setLoading(false);
    }

    loadQuestions();
  }, [userId]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progress = totalQuestions ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  // Timer for rapid response questions
  useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'RapidResponse' && !showFeedback) {
      const timeLimit = currentQuestion.timeLimit;
      setTimeRemaining(timeLimit);
      setTimerActive(true);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimerActive(false);
            // Auto-submit with no answer if time runs out
            if (!showFeedback) {
              handleSubmit(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setTimeRemaining(null);
      setTimerActive(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, showFeedback, currentQuestion?.type]);

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

  const handleOptionSelect = (index: number) => {
    if (!showFeedback && (currentQuestion.type === 'MCQ' || currentQuestion.type === 'RapidResponse')) {
      setSelectedOption(index);
    }
  };

  const handleBooleanSelect = (value: boolean) => {
    if (!showFeedback && currentQuestion.type === 'TrueFalse') {
      setSelectedBoolean(value);
    }
  };

  const handleSubmit = (autoSubmit = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);

    let isCorrect = false;
    let xpEarned = 0;

    if (currentQuestion.type === 'MCQ') {
      if (selectedOption !== null) {
        isCorrect = selectedOption === currentQuestion.correctIndex;
        xpEarned = isCorrect ? currentQuestion.xp : 0;
      }
    } else if (currentQuestion.type === 'TrueFalse') {
      if (selectedBoolean !== null) {
        isCorrect = selectedBoolean === currentQuestion.correctAnswer;
        xpEarned = isCorrect ? currentQuestion.xp : 0;
      }
    } else if (currentQuestion.type === 'SingleWord' || currentQuestion.type === 'RapidResponse') {
      const q = currentQuestion as any;
      const answer = textAnswer.trim().toLowerCase();
      const correctAnswer = q.correctAnswer.toLowerCase();
      const acceptable = q.acceptableAnswers.map((a: any) => a.toLowerCase());

      isCorrect = answer === correctAnswer || acceptable.includes(answer);
      xpEarned = isCorrect ? currentQuestion.xp : 0;
    } else if (currentQuestion.type === 'Numeric') {
      const numAnswer = parseFloat(textAnswer.trim());
      const correct = currentQuestion.correctAnswer;
      const tolerance = currentQuestion.tolerance ?? 0;

      if (!isNaN(numAnswer)) {
        isCorrect = Math.abs(numAnswer - correct) <= tolerance;
        xpEarned = isCorrect ? currentQuestion.xp : 0;
      }
    }

    setResponses([...responses, { correct: isCorrect, xpEarned }]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const completionTimeSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
      const totalCorrect = responses.filter((r) => r.correct).length;
      const totalXP = responses.reduce((sum, r) => sum + r.xpEarned, 0);

      // Track session completion
      trackEvent(userId, 'session2_completed', {
        sessionNumber: 2,
        completionTimeSeconds,
        score: totalCorrect,
        totalQuestions: totalQuestions,
        xpEarned: totalXP,
      });

      router.push({
        pathname: '/session-complete',
        params: {
          sessionNumber: '2',
          score: totalCorrect.toString(),
          total: totalQuestions.toString(),
          xp: totalXP.toString(),
          completionTime: completionTimeSeconds.toString(),
        },
      });
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setSelectedBoolean(null);
      setTextAnswer('');
      setShowFeedback(false);
    }
  };

  const canSubmit = () => {
    if (showFeedback) return false;
    if (currentQuestion.type === 'MCQ') {
      return selectedOption !== null;
    }
    if (currentQuestion.type === 'TrueFalse') {
      return selectedBoolean !== null;
    }
    return textAnswer.trim().length > 0;
  };

  const isCorrect = () => {
    if (responses.length === 0) return false;
    return responses[responses.length - 1].correct;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header — identical shell for all five question types */}
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
                  'This will clear today\'s session from the database and reload a fresh balanced session layout.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Regenerate',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { devForceRegenerateSession } = require('../src/services/daily-session.service');
                          const success = await devForceRegenerateSession(userId, 2);
                          if (success) {
                            Alert.alert('Success', 'Today\'s Session 2 cache cleared! Reloading...', [
                              { text: 'OK', onPress: () => router.replace('/session2') }
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
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SESSION 02</LabelCaps>
          <View style={styles.sessionRowRight}>
            <Mono tone="tertiary" style={styles.questionId} maxFontSizeMultiplier={1}>
              {currentQuestion.id}
            </Mono>
            <Chip
              tone="gold"
              label={
                currentQuestion.type === 'MCQ' ? 'MCQ'
                : currentQuestion.type === 'SingleWord' ? 'SINGLE WORD'
                : currentQuestion.type === 'Numeric' ? 'NUMERIC'
                : currentQuestion.type === 'RapidResponse' ? 'RAPID RESPONSE'
                : 'TRUE / FALSE'
              }
            />
          </View>
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
        {/* Question Card — same shell for all five types */}
        <MilledSurface style={styles.questionCard}>
          <BodyLg maxFontSizeMultiplier={1}>{currentQuestion.question}</BodyLg>
        </MilledSurface>

        {/* Answer area — MCQ */}
        {currentQuestion.type === 'MCQ' && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              const showCorrectState = showFeedback && isCorrectOption;
              const showIncorrectState = showFeedback && isSelected && !isCorrect();

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
        )}

        {/* Answer area — True/False */}
        {currentQuestion.type === 'TrueFalse' && (
          <View style={styles.trueFalseContainer}>
            <OptionButton
              letter="T"
              text="TRUE"
              style={styles.trueFalseOption}
              state={
                showFeedback && currentQuestion.correctAnswer === true ? 'correct'
                : showFeedback && selectedBoolean === true && currentQuestion.correctAnswer === false ? 'incorrect'
                : showFeedback ? 'disabled'
                : selectedBoolean === true ? 'selected'
                : 'default'
              }
              onPress={() => handleBooleanSelect(true)}
            />
            <OptionButton
              letter="F"
              text="FALSE"
              style={styles.trueFalseOption}
              state={
                showFeedback && currentQuestion.correctAnswer === false ? 'correct'
                : showFeedback && selectedBoolean === false && currentQuestion.correctAnswer === true ? 'incorrect'
                : showFeedback ? 'disabled'
                : selectedBoolean === false ? 'selected'
                : 'default'
              }
              onPress={() => handleBooleanSelect(false)}
            />
          </View>
        )}

        {/* Answer area — Single Word */}
        {currentQuestion.type === 'SingleWord' && (
          <RecessedTrack style={styles.textFieldTrack}>
            {inputFocused && <CornerBrackets tone="primary" />}
            <TextInput
              style={styles.textFieldInput}
              value={textAnswer}
              onChangeText={setTextAnswer}
              placeholder="Type your answer"
              placeholderTextColor={Colors.textTertiary}
              editable={!showFeedback}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              maxFontSizeMultiplier={1}
            />
          </RecessedTrack>
        )}

        {/* Answer area — Numeric */}
        {currentQuestion.type === 'Numeric' && (
          <RecessedTrack style={styles.numericTrack}>
            {inputFocused && <CornerBrackets tone="primary" />}
            <View style={styles.numericRow}>
              <TextInput
                style={styles.numericInput}
                value={textAnswer}
                onChangeText={setTextAnswer}
                placeholder="—"
                placeholderTextColor={Colors.textTertiary}
                editable={!showFeedback}
                keyboardType="numeric"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                maxFontSizeMultiplier={1}
              />
              {!!currentQuestion.unit && (
                <>
                  <View style={styles.numericDivider} />
                  <Mono tone="tertiary" maxFontSizeMultiplier={1}>{currentQuestion.unit}</Mono>
                </>
              )}
            </View>
          </RecessedTrack>
        )}

        {/* Answer area — Rapid Response */}
        {currentQuestion.type === 'RapidResponse' && (
          <>
            {timeRemaining !== null && !showFeedback && (
              <Mono
                tone={timeRemaining <= 3 ? 'error' : 'gold'}
                style={styles.timerLabel}
                maxFontSizeMultiplier={1}
              >
                REMAINING TIME · {timeRemaining}s
              </Mono>
            )}
            <RecessedTrack style={styles.textFieldTrack}>
              {inputFocused && <CornerBrackets tone="primary" />}
              <TextInput
                style={styles.textFieldInput}
                value={textAnswer}
                onChangeText={setTextAnswer}
                placeholder="Type your immediate response..."
                placeholderTextColor={Colors.textTertiary}
                editable={!showFeedback}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                maxFontSizeMultiplier={1}
              />
            </RecessedTrack>
          </>
        )}

        {/* Feedback */}
        {showFeedback && (
          <MilledSurface
            style={[
              styles.feedbackCard,
              isCorrect() ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            <View style={styles.feedbackHeader}>
              <MaterialIcons
                name={isCorrect() ? 'check-circle' : 'cancel'}
                size={20}
                color={isCorrect() ? Colors.success : Colors.error}
              />
              <LabelCaps tone={isCorrect() ? 'success' : 'error'} maxFontSizeMultiplier={1}>
                {isCorrect() ? 'CORRECT' : 'INCORRECT'}
              </LabelCaps>
            </View>

            <Body tone="secondary" style={styles.feedbackExplanation} maxFontSizeMultiplier={1}>
              {currentQuestion.explanation}
            </Body>

            {isCorrect() && (
              <Chip label={`+${currentQuestion.xp} XP`} tone="success" />
            )}
          </MilledSurface>
        )}
      </ScrollView>

      {/* Footer — submit button pinned below the scrollable content */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {!showFeedback ? (
          <ForgeButton
            label="SUBMIT ANSWER"
            onPress={() => handleSubmit(false)}
            disabled={!canSubmit()}
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
  sessionRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  questionCard: {
    padding: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  trueFalseOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  textFieldTrack: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  textFieldInput: {
    width: '100%',
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyLg,
    color: Colors.textPrimary,
  },
  numericTrack: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  numericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  numericInput: {
    textAlign: 'center',
    fontFamily: Fonts.display,
    fontSize: FontSizes.display,
    color: Colors.textPrimary,
    minWidth: 80,
  },
  numericDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.outlineVar,
  },
  timerLabel: {
    alignSelf: 'center',
    letterSpacing: LetterSpacing.wider,
  },
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
