// ─────────────────────────────────────────────────────────────
// THE FORGE — Poll + Reasoning Mission Type
// Single-select option list + reasoning text input.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import {
  MilledSurface,
  SegmentedProgress,
  OptionButton,
  RecessedTrack,
  ForgeButton,
  LabelCaps,
  Body,
  Mono,
} from '../forge';
import { countCharacters } from '../../hooks/useFormValidation';
import {
  Colors,
  Spacing,
  Radius,
} from '../../constants/tokens';
import type { PollReasoningContent, PollReasoningResponse } from '../../types';

interface PollReasoningProps {
  content:      PollReasoningContent;
  onSubmit:     (response: PollReasoningResponse) => void;
  isSubmitting: boolean;
}

export default function PollReasoning({
  content,
  onSubmit,
  isSubmitting,
}: PollReasoningProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');

  const charCount = countCharacters(reasoning);
  const canSubmit = !!selectedOption && charCount >= 20; // Minimum 20 characters

  const handleSubmit = () => {
    if (!canSubmit || !selectedOption) return;
    onSubmit({
      type: 'Poll + Reasoning',
      selected_option: selectedOption,
      reasoning: reasoning.trim(),
      word_count: charCount,
    });
  };

  const currentStep = selectedOption ? 2 : 1;

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <SegmentedProgress current={currentStep} total={2} />

      {/* Question/Scenario Card */}
      <MilledSurface style={styles.card}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SCENARIO</LabelCaps>

        {content.context && (
          <Body tone="secondary" maxFontSizeMultiplier={1}>
            {content.context}
          </Body>
        )}

        <Body maxFontSizeMultiplier={1}>
          {content.question}
        </Body>
      </MilledSurface>

      {/* Step 1: Select Option */}
      {!selectedOption ? (
        <View style={styles.stepContainer}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>COURSE OF ACTION</LabelCaps>

          <View style={styles.optionsContainer}>
            {content.options.map((option, idx) => (
              <OptionButton
                key={idx}
                text={option}
                state={selectedOption === option ? 'selected' : 'default'}
                onPress={() => setSelectedOption(option)}
              />
            ))}
          </View>
        </View>
      ) : (
        // Step 2: Provide Reasoning
        <View style={styles.stepContainer}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>JUSTIFICATION</LabelCaps>

          <RecessedTrack style={styles.inputWrap}>
            <TextInput
              value={reasoning}
              onChangeText={setReasoning}
              placeholder="Explain your decision…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={6}
              style={styles.reasoningInput}
              textAlignVertical="top"
              maxFontSizeMultiplier={1}
              editable={!isSubmitting}
            />
          </RecessedTrack>

          <View style={styles.charCount}>
            <Mono tone={canSubmit ? 'success' : 'secondary'} maxFontSizeMultiplier={1}>
              {charCount} / 20 characters
            </Mono>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <ForgeButton
        label={isSubmitting ? 'Submitting…' : 'Submit Response'}
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
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  stepContainer: {
    gap: Spacing.md,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  inputWrap: {
    padding: Spacing.md,
  },
  reasoningInput: {
    minHeight: 140,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  charCount: {
    alignItems: 'flex-end',
  },
});
