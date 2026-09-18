// ─────────────────────────────────────────────────────────────
// THE FORGE — Rapid Response Mission Type
// Time-limited decision making with countdown timer.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {
  MilledSurface,
  SegmentedProgress,
  OptionButton,
  ForgeButton,
  LabelCaps,
  Body,
  Mono,
} from '../forge';
import {
  Colors,
  Spacing,
} from '../../constants/tokens';
import type { RapidResponseContent, RapidResponseResponse } from '../../types';

interface RapidResponseProps {
  content:      RapidResponseContent;
  timeLimit:    number;  // seconds
  onSubmit:     (response: RapidResponseResponse) => void;
  onTimeout:    () => void;
  isSubmitting: boolean;
}

export default function RapidResponse({
  content,
  timeLimit,
  onSubmit,
  onTimeout,
  isSubmitting,
}: RapidResponseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [expired, setExpired] = useState(false);
  const [startTime] = useState(Date.now());

  // Countdown timer
  useEffect(() => {
    if (expired || isSubmitting) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setExpired(true);
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expired, isSubmitting, onTimeout]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeRemaining <= 10) return Colors.error;
    if (timeRemaining <= 20) return '#FF9800'; // Orange
    return Colors.primary;
  };

  const canSubmit = !!selectedOption && !expired;

  const handleSubmit = () => {
    if (!canSubmit || !selectedOption) return;
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    onSubmit({
      type: 'Rapid Response',
      selected_option: selectedOption,
      time_taken: timeTaken,
    });
  };

  return (
    <View style={styles.container}>
      {/* Timer Header */}
      <SegmentedProgress current={1} total={1} />

      {/* Timer Card */}
      <MilledSurface style={[styles.timerCard, expired && styles.timerCardExpired]}>
        <LabelCaps tone={expired ? 'error' : 'primary'} maxFontSizeMultiplier={1}>
          TIME REMAINING
        </LabelCaps>
        <Text style={[styles.timerValue, { color: getTimerColor() }]} maxFontSizeMultiplier={1}>
          {formatTime(timeRemaining)}
        </Text>
        {timeRemaining <= 10 && !expired && (
          <Body tone="error" maxFontSizeMultiplier={1}>
            ⚠ Make your decision
          </Body>
        )}
      </MilledSurface>

      {/* Scenario Card */}
      <MilledSurface style={styles.card}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SCENARIO</LabelCaps>
        <Body maxFontSizeMultiplier={1}>
          {content.scenario}
        </Body>
      </MilledSurface>

      {/* Question */}
      <View style={styles.questionSection}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>YOUR CHOICE</LabelCaps>
        <Body maxFontSizeMultiplier={1}>
          {content.question}
        </Body>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {content.options.map((option, idx) => (
          <OptionButton
            key={idx}
            text={option}
            state={
              expired
                ? 'disabled'
                : selectedOption === option
                  ? 'selected'
                  : 'default'
            }
            onPress={() => !expired && !isSubmitting && setSelectedOption(option)}
          />
        ))}
      </View>

      {/* Submit */}
      <ForgeButton
        label={expired ? 'TIME EXPIRED' : 'Submit Response'}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  timerCard: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerCardExpired: {},
  timerValue: {
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 80,
    color: Colors.primary,
  },
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  questionSection: {
    gap: Spacing.sm,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
});
