// ─────────────────────────────────────────────────────────────
// THE FORGE — Reflect & Write Mission Type (Officer Assessment)
// Multiline text input with tactical validation and status
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
} from '../../constants/tokens';
import type { ReflectWriteContent, ReflectWriteResponse } from '../../types';

interface ReflectWriteProps {
  content:      ReflectWriteContent;
  onSubmit:     (response: ReflectWriteResponse) => void;
  isSubmitting: boolean;
}

export default function ReflectWrite({
  content,
  onSubmit,
  isSubmitting,
}: ReflectWriteProps) {
  const [text, setText] = useState('');
  const charCount = countCharacters(text);
  const canSubmit = charCount >= 20; // Minimum 20 characters
  const progress  = Math.min((charCount / 20) * 100, 100);

  // Status logic
  const getStatus = () => {
    if (isSubmitting) return 'submitting';
    if (canSubmit) return 'ready';
    return 'preparing';
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      type: 'Reflect & Write',
      text: text.trim(),
      word_count: charCount, // Send character count (field name preserved for compatibility)
    });
  };

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <SegmentedProgress current={1} total={1} />

      {/* Prompt Card */}
      <MilledSurface style={styles.card}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>PROMPT</LabelCaps>

        {content.context && (
          <>
            <LabelCaps tone="tertiary" maxFontSizeMultiplier={1}>CONTEXT</LabelCaps>
            <Body tone="secondary" maxFontSizeMultiplier={1}>
              {content.context}
            </Body>
          </>
        )}

        <Body maxFontSizeMultiplier={1}>
          {content.prompt}
        </Body>
      </MilledSurface>

      {/* Response Input */}
      <View style={styles.inputSection}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>YOUR RESPONSE</LabelCaps>

        <RecessedTrack style={styles.inputWrap}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Enter your response…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={8}
            style={styles.responseInput}
            textAlignVertical="top"
            maxFontSizeMultiplier={1}
            editable={!isSubmitting}
          />
        </RecessedTrack>

        <View style={styles.charCountRow}>
          <Mono tone={canSubmit ? 'success' : 'secondary'} maxFontSizeMultiplier={1}>
            {charCount} / 20 characters
          </Mono>
        </View>
      </View>

      {/* Submit */}
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
  inputSection: {
    gap: Spacing.md,
  },
  inputWrap: {
    padding: Spacing.md,
  },
  responseInput: {
    minHeight: 200,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  charCountRow: {
    alignItems: 'flex-end',
  },
});
