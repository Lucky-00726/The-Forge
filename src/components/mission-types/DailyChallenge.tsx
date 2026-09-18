// ─────────────────────────────────────────────────────────────
// THE FORGE — Daily Challenge Mission Type
// Checkbox completion + optional reflection input.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MilledSurface,
  SegmentedProgress,
  RecessedTrack,
  ForgeButton,
  LabelCaps,
  Body,
  Mono,
} from '../forge';
import {
  Colors,
  Spacing,
} from '../../constants/tokens';
import type { DailyChallengeContent, DailyChallengeResponse } from '../../types';

interface DailyChallengeProps {
  content:      DailyChallengeContent;
  onSubmit:     (response: DailyChallengeResponse) => void;
  isSubmitting: boolean;
}

export default function DailyChallenge({
  content,
  onSubmit,
  isSubmitting,
}: DailyChallengeProps) {
  const [completed, setCompleted] = useState(false);
  const [reflection, setReflection] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Calculate time remaining until midnight
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const canSubmit = completed;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      type: 'Daily Challenge',
      completed: true,
      reflection: reflection.trim(),
    });
  };

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <SegmentedProgress current={completed ? 2 : 1} total={2} />

      {/* Briefing Card */}
      <MilledSurface style={styles.briefingCard}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>CHALLENGE</LabelCaps>
        <Body maxFontSizeMultiplier={1}>
          {content.briefing}
        </Body>
      </MilledSurface>

      {/* Task Details */}
      <MilledSurface style={styles.taskCard}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TASK</LabelCaps>
        <Body maxFontSizeMultiplier={1}>
          {content.task}
        </Body>
      </MilledSurface>

      {/* Completion Toggle */}
      <Pressable
        onPress={() => !isSubmitting && setCompleted(!completed)}
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.completionButton,
          completed && styles.completionButtonActive,
          pressed && styles.completionButtonPressed,
        ]}
      >
        <MilledSurface style={styles.completionCard}>
          <View style={styles.completionRow}>
            <MaterialIcons
              name={completed ? 'check-circle' : 'radio-button-unchecked'}
              size={24}
              color={completed ? Colors.success : Colors.textSecondary}
            />
            <LabelCaps tone={completed ? 'success' : 'secondary'} maxFontSizeMultiplier={1}>
              {completed ? 'COMPLETED' : 'MARK AS COMPLETE'}
            </LabelCaps>
          </View>
        </MilledSurface>
      </Pressable>

      {/* Reflection (Progressive Disclosure) */}
      {completed && (
        <View style={styles.reflectionSection}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>REFLECTION (OPTIONAL)</LabelCaps>

          <RecessedTrack style={styles.inputWrap}>
            <TextInput
              value={reflection}
              onChangeText={setReflection}
              placeholder="What did you learn or observe…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={5}
              style={styles.reflectionInput}
              textAlignVertical="top"
              maxFontSizeMultiplier={1}
              editable={!isSubmitting}
            />
          </RecessedTrack>
        </View>
      )}

      {/* Submit */}
      <ForgeButton
        label={isSubmitting ? 'Submitting…' : 'Submit Challenge'}
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
  briefingCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  taskCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  completionButton: {},
  completionButtonActive: {},
  completionButtonPressed: {
    opacity: 0.8,
  },
  completionCard: {
    padding: Spacing.lg,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reflectionSection: {
    gap: Spacing.md,
  },
  inputWrap: {
    padding: Spacing.md,
  },
  reflectionInput: {
    minHeight: 120,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
});
