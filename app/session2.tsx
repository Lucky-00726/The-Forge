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
import { CornerMarkers } from '../src/components/ui';
import { useAuthStore } from '../src/store/auth.store';
import { trackEvent } from '../src/services/analytics.service';

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
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
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
            SESSION 2
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
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          <CornerMarkers position="all" color={Colors.primary} />

          <View style={styles.questionHeader}>
            <Text style={styles.questionId} maxFontSizeMultiplier={1}>
              {currentQuestion.id}
            </Text>
            <View
              style={[
                styles.typeChip,
                currentQuestion.type === 'RapidResponse' && styles.typeChipUrgent,
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  currentQuestion.type === 'RapidResponse' && styles.typeChipTextUrgent,
                ]}
                maxFontSizeMultiplier={1}
              >
                {currentQuestion.type === 'MCQ' && 'MULTIPLE CHOICE'}
                {currentQuestion.type === 'SingleWord' && 'SINGLE WORD'}
                {currentQuestion.type === 'Numeric' && 'NUMERIC'}
                {currentQuestion.type === 'RapidResponse' && 'RAPID RESPONSE'}
                {currentQuestion.type === 'TrueFalse' && 'TRUE/FALSE'}
              </Text>
            </View>
          </View>

          {/* Timer for Rapid Response */}
          {currentQuestion.type === 'RapidResponse' && timeRemaining !== null && !showFeedback && (
            <View style={[styles.timer, timeRemaining <= 3 && styles.timerUrgent]}>
              <Text
                style={[styles.timerText, timeRemaining <= 3 && styles.timerTextUrgent]}
                maxFontSizeMultiplier={1}
              >
                ⏱ {timeRemaining}s
              </Text>
            </View>
          )}

          <Text style={styles.questionText} maxFontSizeMultiplier={1}>
            {currentQuestion.question}
          </Text>
        </View>

        {/* Answer Input - MCQ */}
        {currentQuestion.type === 'MCQ' && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrectOption = index === currentQuestion.correctIndex;
              const showCorrectState = showFeedback && isCorrectOption;
              const showIncorrectState = showFeedback && isSelected && !isCorrect();

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
                      {isSelected && !showFeedback && <View style={styles.radioDot} />}
                      {showCorrectState && (
                        <Text style={styles.radioIcon} maxFontSizeMultiplier={1}>
                          ✓
                        </Text>
                      )}
                      {showIncorrectState && (
                        <Text style={[styles.radioIcon, { color: Colors.error }]} maxFontSizeMultiplier={1}>
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
        )}

        {/* Answer Input - True/False */}
        {currentQuestion.type === 'TrueFalse' && (
          <View style={styles.trueFalseContainer}>
            <TouchableOpacity
              style={[
                styles.trueFalseButton,
                selectedBoolean === true && !showFeedback && styles.trueFalseSelected,
                showFeedback &&
                  currentQuestion.correctAnswer === true &&
                  styles.trueFalseCorrect,
                showFeedback &&
                  selectedBoolean === true &&
                  currentQuestion.correctAnswer === false &&
                  styles.trueFalseIncorrect,
              ]}
              onPress={() => handleBooleanSelect(true)}
              activeOpacity={showFeedback ? 1 : 0.7}
              disabled={showFeedback}
            >
              <Text style={styles.trueFalseText} maxFontSizeMultiplier={1}>
                TRUE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.trueFalseButton,
                selectedBoolean === false && !showFeedback && styles.trueFalseSelected,
                showFeedback &&
                  currentQuestion.correctAnswer === false &&
                  styles.trueFalseCorrect,
                showFeedback &&
                  selectedBoolean === false &&
                  currentQuestion.correctAnswer === true &&
                  styles.trueFalseIncorrect,
              ]}
              onPress={() => handleBooleanSelect(false)}
              activeOpacity={showFeedback ? 1 : 0.7}
              disabled={showFeedback}
            >
              <Text style={styles.trueFalseText} maxFontSizeMultiplier={1}>
                FALSE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Answer Input - Text (SingleWord/Numeric/RapidResponse) */}
        {(currentQuestion.type === 'SingleWord' || currentQuestion.type === 'Numeric' || currentQuestion.type === 'RapidResponse') && (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={textAnswer}
              onChangeText={setTextAnswer}
              placeholder={
                currentQuestion.type === 'SingleWord' || currentQuestion.type === 'RapidResponse'
                  ? 'Type your answer...'
                  : currentQuestion.type === 'Numeric'
                  ? 'Enter number...'
                  : ''
              }
              placeholderTextColor={Colors.textTertiary}
              editable={!showFeedback}
              keyboardType={currentQuestion.type === 'Numeric' ? 'numeric' : 'default'}
              autoCapitalize="none"
              autoCorrect={false}
              maxFontSizeMultiplier={1}
            />
            {currentQuestion.type === 'Numeric' && currentQuestion.unit && (
              <Text style={styles.unitLabel} maxFontSizeMultiplier={1}>
                {currentQuestion.unit}
              </Text>
            )}
          </View>
        )}

        {/* Feedback */}
        {showFeedback && (
          <View
            style={[
              styles.feedbackCard,
              isCorrect() ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            <CornerMarkers position="all" color={isCorrect() ? Colors.success : Colors.error} />

            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackIcon} maxFontSizeMultiplier={1}>
                {isCorrect() ? '✓' : '✕'}
              </Text>
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: isCorrect() ? Colors.success : Colors.error },
                ]}
                maxFontSizeMultiplier={1}
              >
                {isCorrect() ? 'CORRECT' : 'INCORRECT'}
              </Text>
            </View>

            <Text style={styles.feedbackExplanation} maxFontSizeMultiplier={1}>
              {currentQuestion.explanation}
            </Text>

            {isCorrect() && (
              <View style={styles.xpBadge}>
                <Text style={styles.xpText} maxFontSizeMultiplier={1}>
                  +{currentQuestion.xp} XP
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {!showFeedback ? (
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
              onPress={() => handleSubmit(false)}
              activeOpacity={0.85}
              disabled={!canSubmit()}
            >
              <Text style={styles.submitButtonText} maxFontSizeMultiplier={1}>
                SUBMIT ANSWER
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
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
  typeChipUrgent: {
    backgroundColor: Colors.error + '22',
  },
  typeChipText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.micro - 1,
    color: Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  typeChipTextUrgent: {
    color: Colors.error,
  },
  timer: {
    alignSelf: 'center',
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  timerUrgent: {
    backgroundColor: Colors.errorBg,
  },
  timerText: {
    fontFamily: Fonts.display,
    fontSize: FontSizes.headingMd,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  timerTextUrgent: {
    color: Colors.error,
  },
  questionText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.headingSm,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
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
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: FontSizes.bodyLg,
    color: Colors.textPrimary,
  },
  unitLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.bodySm,
    color: Colors.textSecondary,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  trueFalseButton: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderWidth: 2,
    borderColor: Colors.outlineVar,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  trueFalseSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  trueFalseCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBg,
  },
  trueFalseIncorrect: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  trueFalseText: {
    fontFamily: Fonts.monoMedium,
    fontSize: FontSizes.bodyLg,
    color: Colors.textPrimary,
    letterSpacing: LetterSpacing.widest,
  },
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
