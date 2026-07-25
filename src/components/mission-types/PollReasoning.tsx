// ─────────────────────────────────────────────────────────────
// THE FORGE — Poll + Reasoning Mission Type
// Single-select option list + reasoning text input.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
} from '../../constants/tokens';
import type { PollReasoningContent, PollReasoningResponse } from '../../types';

interface PollReasoningProps {
  content:      PollReasoningContent;
  onSubmit:     (response: PollReasoningResponse) => void;
  isSubmitting: boolean;
}

const OPTION_LABELS = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];

export default function PollReasoning({
  content,
  onSubmit,
  isSubmitting,
}: PollReasoningProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');

  const charCount = countCharacters(reasoning);
  const canSubmit = !!selectedOption && charCount >= 20; // Minimum 20 characters
  const progress  = Math.min((charCount / 20) * 100, 100);

  // Determine status
  let status: 'preparing' | 'ready' | 'submitting' | 'complete' = 'preparing';
  if (isSubmitting) status = 'submitting';
  else if (canSubmit) status = 'ready';

  const handleSubmit = () => {
    if (!canSubmit || !selectedOption) return;
    onSubmit({
      type: 'Poll + Reasoning',
      selected_option: selectedOption,
      reasoning: reasoning.trim(),
      word_count: charCount, // Send character count (field name preserved for compatibility)
    });
  };

  return (
    <View style={styles.container}>
      {/* Scenario Assessment Card with Corner Markers */}
      <View style={styles.scenarioCard}>
        <CornerMarkers color={Colors.primary} size={12} />
        
        <View style={styles.scenarioHeader}>
          <Text style={styles.scenarioLabel} maxFontSizeMultiplier={1}>
            SCENARIO ASSESSMENT
          </Text>
        </View>

        {/* Context (if provided) */}
        {content.context && (
          <Text style={styles.contextText} maxFontSizeMultiplier={1}>
            {content.context}
          </Text>
        )}

        {/* Question as scenario */}
        <Text style={styles.scenarioText} maxFontSizeMultiplier={1}>
          {content.question}
        </Text>
      </View>

      {/* Decision Required Section */}
      <View style={styles.decisionCard}>
        <Text style={styles.decisionLabel} maxFontSizeMultiplier={1}>
          DECISION REQUIRED
        </Text>
        <Text style={styles.decisionPrompt} maxFontSizeMultiplier={1}>
          SELECT COURSE OF ACTION:
        </Text>

        {/* Options with tactical labels */}
        <View style={styles.optionsContainer}>
          {content.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const tacticalLabel = OPTION_LABELS[idx] || `OPT-${idx + 1}`;
            
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedOption(option)}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                {isSelected && <CornerMarkers color={Colors.primary} size={8} />}
                
                <View style={styles.optionContent}>
                  <Text style={styles.tacticalLabel} maxFontSizeMultiplier={1}>
                    ▸ {tacticalLabel}
                  </Text>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
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

        {/* Decision Status */}
        {selectedOption && (
          <View style={styles.decisionStatus}>
            <Text style={styles.decisionStatusText} maxFontSizeMultiplier={1}>
              DECISION: LOCKED
            </Text>
          </View>
        )}
      </View>

      {/* Tactical Reasoning (Progressive Disclosure) */}
      {selectedOption && (
        <View style={styles.reasoningCard}>
          <Text style={styles.reasoningHeader} maxFontSizeMultiplier={1}>
            TACTICAL REASONING
          </Text>
          <Text style={styles.reasoningPrompt} maxFontSizeMultiplier={1}>
            JUSTIFY YOUR DECISION:
          </Text>

          <TextInput
            value={reasoning}
            onChangeText={setReasoning}
            placeholder="Provide tactical justification…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={6}
            style={styles.reasoningInput}
            textAlignVertical="top"
            maxFontSizeMultiplier={1}
            editable={!isSubmitting}
          />

          {/* Analysis Progress */}
          <View style={styles.analysisRow}>
            <Text style={styles.analysisText} maxFontSizeMultiplier={1}>
              ANALYSIS: {charCount} / 20 CHARACTERS
            </Text>
          </View>

          <SegmentedProgressBar
            segments={5}
            progress={progress}
            activeColor={canSubmit ? Colors.success : Colors.primary}
          />

          {/* Status Indicator */}
          <StatusIndicator status={status} />
        </View>
      )}

      {/* Submit */}
      <TacticalButton
        label="SUBMIT ASSESSMENT →"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  
  // Scenario Assessment Card
  scenarioCard: {
    position:        'relative',
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.primary + '33',
    padding:         Spacing.lg,
  },
  scenarioHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.md,
  },
  scenarioLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  contextText: {
    fontFamily:   Fonts.body,
    fontSize:     FontSizes.bodySm,
    color:        Colors.textSecondary,
    lineHeight:   20,
    marginBottom: Spacing.md,
    fontStyle:    'italic',
  },
  scenarioText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.textPrimary,
    lineHeight: 26,
    fontWeight: '600',
  },

  // Decision Card
  decisionCard: {
    gap: Spacing.md,
  },
  decisionLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  decisionPrompt: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
    marginBottom:  Spacing.xs,
  },

  // Options
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionCard: {
    position:        'relative',
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
  },
  optionCardSelected: {
    backgroundColor: Colors.primary + '11',
    borderColor:     Colors.primary,
    borderWidth:     2,
  },
  optionContent: {
    gap: Spacing.xs,
  },
  tacticalLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  optionText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    color:      Colors.textSecondary,
    lineHeight: 22,
  },
  optionTextSelected: {
    color:      Colors.textPrimary,
    fontWeight: '500',
  },

  // Decision Status
  decisionStatus: {
    backgroundColor: Colors.success + '11',
    borderRadius:    Radius.sm,
    borderWidth:     1,
    borderColor:     Colors.success + '33',
    padding:         Spacing.sm,
    alignItems:      'center',
  },
  decisionStatusText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.success,
    letterSpacing: LetterSpacing.wider,
  },

  // Reasoning Card
  reasoningCard: {
    gap: Spacing.md,
  },
  reasoningHeader: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  reasoningPrompt: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
    marginTop:     -Spacing.xs,
  },
  reasoningInput: {
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
    fontFamily:      Fonts.mono,
    fontSize:        FontSizes.bodyMd,
    color:           Colors.textPrimary,
    minHeight:       140,
    lineHeight:      24,
  },

  // Analysis
  analysisRow: {
    marginTop: Spacing.xs,
  },
  analysisText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: 0.5,
  },
});
