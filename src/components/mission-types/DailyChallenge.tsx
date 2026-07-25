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
} from 'react-native';
import { TacticalButton, CornerMarkers, TacticalCheckbox } from '../ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
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
      {/* Field Operation Header with Timer */}
      <View style={styles.operationCard}>
        <CornerMarkers color={Colors.primary} size={12} />
        
        <View style={styles.operationHeader}>
          <Text style={styles.operationLabel} maxFontSizeMultiplier={1}>
            FIELD OPERATION
          </Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel} maxFontSizeMultiplier={1}>
              DURATION
            </Text>
            <Text style={styles.timerValue} maxFontSizeMultiplier={1}>
              {timeRemaining}
            </Text>
          </View>
        </View>

        <Text style={styles.briefingText} maxFontSizeMultiplier={1}>
          {content.briefing}
        </Text>
      </View>

      {/* Mission Parameters */}
      <View style={styles.parametersCard}>
        <Text style={styles.parametersLabel} maxFontSizeMultiplier={1}>
          MISSION PARAMETERS
        </Text>

        <View style={styles.objectiveSection}>
          <Text style={styles.objectiveLabel} maxFontSizeMultiplier={1}>
            PRIMARY OBJECTIVE:
          </Text>
          <Text style={styles.objectiveText} maxFontSizeMultiplier={1}>
            {content.task}
          </Text>
        </View>

        <View style={styles.criteriaSection}>
          <Text style={styles.criteriaLabel} maxFontSizeMultiplier={1}>
            COMPLETION CRITERIA:
          </Text>
          <Text style={styles.criteriaItem} maxFontSizeMultiplier={1}>
            • Execute task in real world
          </Text>
          <Text style={styles.criteriaItem} maxFontSizeMultiplier={1}>
            • Observe outcomes
          </Text>
          <Text style={styles.criteriaItem} maxFontSizeMultiplier={1}>
            • Report findings
          </Text>
        </View>
      </View>

      {/* Mission Status with Tactical Checkbox */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel} maxFontSizeMultiplier={1}>
          MISSION STATUS
        </Text>

        <TacticalCheckbox
          checked={completed}
          onToggle={() => setCompleted(!completed)}
          label="MISSION EXECUTED"
          uncheckedLabel="MISSION INCOMPLETE"
          disabled={isSubmitting}
        />

        <Text style={styles.statusHint} maxFontSizeMultiplier={1}>
          Tap to confirm completion
        </Text>
      </View>

      {/* Field Report (Progressive Disclosure) */}
      {completed && (
        <View style={styles.reportCard}>
          <Text style={styles.reportHeader} maxFontSizeMultiplier={1}>
            FIELD REPORT
          </Text>
          <Text style={styles.reportPrompt} maxFontSizeMultiplier={1}>
            DOCUMENT YOUR OBSERVATIONS:
          </Text>

          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Describe what you learned or noticed…"
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={5}
            style={styles.reportInput}
            textAlignVertical="top"
            maxFontSizeMultiplier={1}
            editable={!isSubmitting}
          />

          <View style={styles.reportStatus}>
            <Text style={styles.reportStatusText} maxFontSizeMultiplier={1}>
              REPORT STATUS: {reflection.trim() ? 'DOCUMENTED' : 'OPTIONAL'}
            </Text>
          </View>
        </View>
      )}

      {/* Submit */}
      <TacticalButton
        label={completed ? 'SUBMIT FIELD REPORT →' : 'COMPLETE MISSION FIRST'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
      />

      {/* Protocol Note */}
      {completed && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText} maxFontSizeMultiplier={1}>
            Your field report is private. Only you will see it. It helps you track
            growth over time.
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

  // Field Operation Card
  operationCard: {
    position:        'relative',
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.primary + '33',
    padding:         Spacing.lg,
  },
  operationHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing.md,
  },
  operationLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  timerBox: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
    marginBottom:  2,
  },
  timerValue: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  briefingText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.textPrimary,
    lineHeight: 26,
  },

  // Mission Parameters Card
  parametersCard: {
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    gap:             Spacing.md,
  },
  parametersLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },

  // Objective Section
  objectiveSection: {
    gap: Spacing.xs,
  },
  objectiveLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  objectiveText: {
    fontFamily:  Fonts.body,
    fontSize:    FontSizes.bodyMd,
    color:       Colors.textPrimary,
    lineHeight:  24,
    paddingLeft: Spacing.sm,
  },

  // Criteria Section
  criteriaSection: {
    gap: Spacing.xs,
  },
  criteriaLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  criteriaItem: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },

  // Status Card
  statusCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.md,
    borderWidth:     2,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    gap:             Spacing.md,
  },
  statusLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  statusHint: {
    fontFamily:  Fonts.body,
    fontSize:    FontSizes.micro,
    color:       Colors.textTertiary,
    lineHeight:  16,
    textAlign:   'center',
  },

  // Field Report Card
  reportCard: {
    gap: Spacing.md,
  },
  reportHeader: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  reportPrompt: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
    marginTop:     -Spacing.xs,
  },
  reportInput: {
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
    fontFamily:      Fonts.mono,
    fontSize:        FontSizes.bodyMd,
    color:           Colors.textPrimary,
    minHeight:       120,
    lineHeight:      24,
  },
  reportStatus: {
    alignItems: 'flex-end',
  },
  reportStatusText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: 0.5,
  },

  // Note Box
  noteBox: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.outlineVar,
    paddingLeft:     Spacing.md,
    marginTop:       -Spacing.xs,
  },
  noteText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
    lineHeight: 16,
  },
});
