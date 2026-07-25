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
import { TacticalButton, CornerMarkers, StatusIndicator, SegmentedProgressBar } from '../ui';
import { countCharacters } from '../../hooks/useFormValidation';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  TacticalColors,
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
      {/* Context (optional) */}
      {content.context && (
        <View style={styles.contextBox}>
          <CornerMarkers position="tl" />
          <Text style={styles.contextLabel} maxFontSizeMultiplier={1}>
            SITUATIONAL CONTEXT
          </Text>
          <Text style={styles.contextText} maxFontSizeMultiplier={1}>
            {content.context}
          </Text>
        </View>
      )}

      {/* Evaluation Briefing */}
      <View style={styles.briefingBox}>
        <CornerMarkers position="all" />
        <Text style={styles.briefingLabel} maxFontSizeMultiplier={1}>
          ⚠ EVALUATION BRIEFING
        </Text>
        <Text style={styles.briefingText} maxFontSizeMultiplier={1}>
          {content.prompt}
        </Text>
      </View>

      {/* Officer Response Section */}
      <View style={styles.responseSection}>
        <Text style={styles.responseHeader} maxFontSizeMultiplier={1}>
          OFFICER RESPONSE REQUIRED
        </Text>
        
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Begin tactical response..."
          placeholderTextColor={Colors.textTertiary + '80'}
          multiline
          numberOfLines={8}
          style={styles.responseInput}
          textAlignVertical="top"
          maxFontSizeMultiplier={1}
          editable={!isSubmitting}
        />

        {/* Character Count Analysis */}
        <View style={styles.analysisSection}>
          <View style={styles.wordCountRow}>
            <Text style={styles.wordCountLabel} maxFontSizeMultiplier={1}>
              CHARACTER COUNT:
            </Text>
            <Text style={[
              styles.wordCountValue,
              canSubmit && { color: Colors.success },
            ]} maxFontSizeMultiplier={1}>
              {charCount} / 20
            </Text>
          </View>

          <SegmentedProgressBar
            segments={5}
            progress={progress}
            height={6}
            activeColor={canSubmit ? Colors.success : Colors.primary}
          />

          <StatusIndicator
            status={getStatus()}
            label="RESPONSE STATUS"
          />
        </View>
      </View>

      {/* Submit */}
      <TacticalButton
        label={isSubmitting ? 'Submitting Evaluation' : 'Submit For Evaluation'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
      />

      {/* Validation hint */}
      {!canSubmit && charCount > 0 && (
        <View style={styles.validationHint}>
          <Text style={styles.validationText} maxFontSizeMultiplier={1}>
            Minimum {20 - charCount} more characters required for submission.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  
  // ── Context Box ───────────────────────────────────────────────
  contextBox: {
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar + '80',
    padding:         Spacing.md,
    position:        'relative',
  },
  contextLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom:  Spacing.xs,
  },
  contextText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  
  // ── Evaluation Briefing ───────────────────────────────────────
  briefingBox: {
    backgroundColor: TacticalColors.surfaceCard,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.primary + '55',
    padding:         Spacing.lg,
    position:        'relative',
  },
  briefingLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.label,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
    marginBottom:  Spacing.sm,
  },
  briefingText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.textPrimary,
    lineHeight: 28,
    fontStyle:  'italic',
  },
  
  // ── Response Section ──────────────────────────────────────────
  responseSection: {
    gap: Spacing.sm,
  },
  responseHeader: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textPrimary,
    letterSpacing: LetterSpacing.widest,
    marginBottom:  Spacing.xs,
  },
  responseInput: {
    backgroundColor: Colors.bgLowest,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
    fontFamily:      Fonts.mono,
    fontSize:        FontSizes.bodyMd,
    color:           Colors.textPrimary,
    minHeight:       200,
    lineHeight:      24,
  },
  
  // ── Analysis Section ──────────────────────────────────────────
  analysisSection: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
    gap:             Spacing.sm,
  },
  wordCountRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  wordCountLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  wordCountValue: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.textPrimary,
    letterSpacing: LetterSpacing.wide,
  },
  
  // ── Validation Hint ───────────────────────────────────────────
  validationHint: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    paddingLeft:     Spacing.md,
    marginTop:       -Spacing.xs,
  },
  validationText: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
    lineHeight: 16,
  },
});
