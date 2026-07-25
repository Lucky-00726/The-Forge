// ─────────────────────────────────────────────────────────────
// THE FORGE — Mission Failure Screen
// Displayed when timer expires on Rapid Response missions
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenMeta, CornerMarkers } from '../../src/components/ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  TacticalColors,
} from '../../src/constants/tokens';

export default function FailureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mission_title: string;
    reason: string;
  }>();

  const missionTitle = params.mission_title || 'Mission';
  const reason = params.reason || 'Time Limit Exceeded';

  const handleReturnToLibrary = () => {
    router.replace('/(tabs)/missions');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <ScreenMeta id="FAIL" label="Mission Failed" />

      {/* Failure Card */}
      <View style={styles.failureCard}>
        <CornerMarkers position="all" color={Colors.error} />

        {/* Header */}
        <View style={styles.failureHeader}>
          <Text style={styles.failureIcon}>✕</Text>
          <Text style={styles.failureTitle} maxFontSizeMultiplier={1}>
            MISSION FAILED
          </Text>
        </View>

        {/* Content */}
        <View style={styles.failureContent}>
          <Text style={styles.missionTitleLabel} maxFontSizeMultiplier={1}>
            MISSION
          </Text>
          <Text style={styles.missionTitleText} maxFontSizeMultiplier={1}>
            {missionTitle}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.reasonLabel} maxFontSizeMultiplier={1}>
            FAILURE REASON
          </Text>
          <Text style={styles.reasonText} maxFontSizeMultiplier={1}>
            {reason}
          </Text>

          <View style={styles.divider} />

          {/* XP Section */}
          <View style={styles.xpSection}>
            <Text style={styles.xpLabel} maxFontSizeMultiplier={1}>
              XP AWARDED
            </Text>
            <Text style={styles.xpValue} maxFontSizeMultiplier={1}>
              +0
            </Text>
          </View>

          <Text style={styles.messageText} maxFontSizeMultiplier={1}>
            No experience awarded for incomplete missions. Return to Training Library to attempt other missions.
          </Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.returnButton}
        onPress={handleReturnToLibrary}
        activeOpacity={0.85}
      >
        <Text style={styles.returnButtonText} maxFontSizeMultiplier={1}>
          ← RETURN TO TRAINING LIBRARY
        </Text>
      </TouchableOpacity>

      {/* Info Note */}
      <View style={styles.noteBox}>
        <Text style={styles.noteText} maxFontSizeMultiplier={1}>
          Rapid Response missions test decision-making under time pressure. 
          You can attempt other missions in the Training Library.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:              1,
    backgroundColor:   Colors.bgBase,
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.xxl,
  },

  // Failure Card
  failureCard: {
    backgroundColor: Colors.errorBg,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.error,
    overflow:        'hidden',
    marginTop:       Spacing.xl,
    position:        'relative',
  },
  failureHeader: {
    backgroundColor:   Colors.error + '22',
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '33',
  },
  failureIcon: {
    fontSize: 24,
    color:    Colors.error,
  },
  failureTitle: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.error,
    letterSpacing: LetterSpacing.widest,
  },
  failureContent: {
    padding: Spacing.lg,
    gap:     Spacing.md,
  },

  // Mission Info
  missionTitleLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  missionTitleText: {
    fontFamily: Fonts.heading,
    fontSize:   FontSizes.headingSm,
    color:      Colors.textPrimary,
    lineHeight: 28,
  },

  // Reason
  reasonLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  reasonText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    color:      Colors.error,
    lineHeight: 24,
  },

  // Divider
  divider: {
    height:          1,
    backgroundColor: Colors.outlineVar,
    marginVertical:  Spacing.xs,
  },

  // XP Section
  xpSection: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
  },
  xpLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  xpValue: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.headingLg,
    color:         Colors.textTertiary,
    letterSpacing: -1,
  },

  // Message
  messageText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },

  // Actions
  returnButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md + 4,
    borderRadius:    Radius.md,
    alignItems:      'center',
    marginTop:       Spacing.xl,
  },
  returnButtonText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },

  // Note
  noteBox: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.outlineVar,
    paddingLeft:     Spacing.md,
    marginTop:       Spacing.lg,
  },
  noteText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
    lineHeight: 16,
  },
});
