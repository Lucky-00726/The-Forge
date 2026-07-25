// ─────────────────────────────────────────────────────────────
// THE FORGE — Rapid Response Mission Type
// Time-limited decision making with countdown timer.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TacticalButton, CornerMarkers } from '../ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
} from '../../constants/tokens';
import type { RapidResponseContent, RapidResponseResponse } from '../../types';

interface RapidResponseProps {
  content:      RapidResponseContent;
  timeLimit:    number;  // seconds
  onSubmit:     (response: RapidResponseResponse) => void;
  onTimeout:    () => void;
  isSubmitting: boolean;
}

const OPTION_LABELS = ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'];

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
      {/* Timer Display */}
      <View style={[styles.timerCard, expired && styles.timerCardExpired]}>
        <CornerMarkers color={getTimerColor()} size={12} />
        
        <View style={styles.timerHeader}>
          <Text style={styles.timerLabel} maxFontSizeMultiplier={1}>
            ⏱ TIME REMAINING
          </Text>
          {expired && (
            <Text style={styles.expiredBadge} maxFontSizeMultiplier={1}>
              EXPIRED
            </Text>
          )}
        </View>

        <Text style={[styles.timerValue, { color: getTimerColor() }]} maxFontSizeMultiplier={1}>
          {formatTime(timeRemaining)}
        </Text>

        {timeRemaining <= 10 && !expired && (
          <Text style={styles.timerWarning} maxFontSizeMultiplier={1}>
            ⚠ CRITICAL: MAKE YOUR DECISION
          </Text>
        )}
      </View>

      {/* Scenario Card */}
      <View style={styles.scenarioCard}>
        <CornerMarkers color={Colors.primary} size={12} />
        
        <Text style={styles.scenarioLabel} maxFontSizeMultiplier={1}>
          RAPID RESPONSE SCENARIO
        </Text>

        <Text style={styles.scenarioText} maxFontSizeMultiplier={1}>
          {content.scenario}
        </Text>
      </View>

      {/* Decision Required */}
      <View style={styles.decisionCard}>
        <Text style={styles.decisionLabel} maxFontSizeMultiplier={1}>
          IMMEDIATE DECISION REQUIRED
        </Text>
        <Text style={styles.decisionPrompt} maxFontSizeMultiplier={1}>
          {content.question}
        </Text>

        {/* Options */}
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
                  expired && styles.optionCardDisabled,
                ]}
                onPress={() => !expired && setSelectedOption(option)}
                activeOpacity={0.7}
                disabled={expired || isSubmitting}
              >
                {isSelected && !expired && <CornerMarkers color={Colors.primary} size={8} />}
                
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

        {selectedOption && !expired && (
          <View style={styles.decisionStatus}>
            <Text style={styles.decisionStatusText} maxFontSizeMultiplier={1}>
              DECISION: LOCKED
            </Text>
          </View>
        )}
      </View>

      {/* Submit */}
      <TacticalButton
        label={expired ? 'TIME EXPIRED' : 'SUBMIT DECISION →'}
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
      />

      {/* Instructions */}
      {!expired && (
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsText} maxFontSizeMultiplier={1}>
            You have {timeLimit} seconds to analyze and respond. No partial submissions.
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

  // Timer Card
  timerCard: {
    position:        'relative',
    backgroundColor: Colors.primary + '11',
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.primary,
    padding:         Spacing.lg,
    alignItems:      'center',
  },
  timerCardExpired: {
    backgroundColor: Colors.errorBg,
    borderColor:     Colors.error,
  },
  timerHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    width:          '100%',
    marginBottom:   Spacing.sm,
  },
  timerLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wider,
  },
  expiredBadge: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.error,
    letterSpacing: LetterSpacing.widest,
  },
  timerValue: {
    fontFamily:    Fonts.display,
    fontSize:      72,
    letterSpacing: -2,
    lineHeight:    80,
  },
  timerWarning: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.error,
    letterSpacing: LetterSpacing.wide,
    marginTop:     Spacing.xs,
  },

  // Scenario Card
  scenarioCard: {
    position:        'relative',
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.primary + '33',
    padding:         Spacing.lg,
  },
  scenarioLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
    marginBottom:  Spacing.md,
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
  optionCardDisabled: {
    opacity: 0.5,
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

  // Instructions
  instructionsBox: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.outlineVar,
    paddingLeft:     Spacing.md,
    marginTop:       -Spacing.xs,
  },
  instructionsText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
    lineHeight: 16,
  },
});
