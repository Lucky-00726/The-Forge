// ─────────────────────────────────────────────────────────────
// THE FORGE — Mission Detail Screen (Stitch Design)
// Route: /mission/[id]
// Fetches mission by ID, delegates to type component.
// ─────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMissionEngine } from '../../src/hooks/useMissionEngine';
import { ScreenMeta, TacticalButton, CornerMarkers } from '../../src/components/ui';
import ReflectWrite from '../../src/components/mission-types/ReflectWrite';
import PollReasoning from '../../src/components/mission-types/PollReasoning';
import DailyChallenge from '../../src/components/mission-types/DailyChallenge';
import RapidResponse from '../../src/components/mission-types/RapidResponse';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  TacticalColors,
} from '../../src/constants/tokens';
import type {
  ReflectWriteContent,
  PollReasoningContent,
  DailyChallengeContent,
  RapidResponseContent,
  MissionResponse,
} from '../../src/types';

// ── Category color mapping ───────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Communication':    Colors.communication,
  'Confidence':       Colors.confidence,
  'Leadership':       Colors.leadership,
  'Awareness':        Colors.awareness,
  'Officer Thinking': Colors.officerThinking,
  'Geopolitics':      Colors.awareness,
  'Current Affairs':  Colors.communication,
};

export default function MissionDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const {
    mission,
    error,
    isSubmitting,
    loadMission,
    submitMission,
    retry,
    reset,
  } = useMissionEngine();

  // Load mission on mount
  useEffect(() => {
    if (params.id) {
      void loadMission(params.id);
    }

    // Reset store when unmounting
    return () => {
      reset();
    };
  }, [params.id, loadMission, reset]);

  // ── Loading state ─────────────────────────────────────────────
  if (!mission && !error) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText} maxFontSizeMultiplier={1}>
          Loading mission…
        </Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error && !mission) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top + Spacing.xl }]}>
        <ScreenMeta id="ERROR" label="Mission Load Failed" />
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>⚠</Text>
          <Text style={styles.errorText} maxFontSizeMultiplier={1}>
            {error}
          </Text>
        </View>
        <View style={styles.errorActions}>
          <TacticalButton
            label="Retry"
            onPress={retry}
            variant="ghost"
          />
          <TacticalButton
            label="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="ghost"
          />
        </View>
      </View>
    );
  }

  if (!mission) return null;

  // ── Mission loaded ────────────────────────────────────────────
  const categoryColor = CATEGORY_COLORS[mission.category] ?? Colors.textTertiary;

  const handleSubmit = async (responses: MissionResponse) => {
    await submitMission(responses);
  };

  const handleTimeout = () => {
    // Navigate to failure screen
    router.replace({
      pathname: '/mission/failure',
      params: {
        mission_title: mission?.title || 'Mission',
        reason: 'Time Limit Exceeded',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header with glass effect */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.abortButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.abortButtonText} maxFontSizeMultiplier={1}>
              ← ABORT
            </Text>
          </TouchableOpacity>
          <View style={styles.phaseIndicator}>
            <Text style={styles.phaseLabel} maxFontSizeMultiplier={1}>
              CURRENT PHASE
            </Text>
            <Text style={styles.phaseText} maxFontSizeMultiplier={1}>
              BRIEFING // EXECUTE
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mission briefing card */}
        <View style={styles.briefingCard}>
          <CornerMarkers position="all" />
          
          {/* Mission ID tag (top-right) */}
          <View style={styles.missionIdTag}>
            <Text style={styles.missionIdText} maxFontSizeMultiplier={1}>
              ID: {mission.id}
            </Text>
          </View>

          <View style={styles.briefingHeader}>
            <View style={styles.headerTopRow}>
              <View style={styles.metaBadgeGroup}>
                <View style={[styles.categoryChip, { backgroundColor: categoryColor + '22' }]}>
                  <Text
                    style={[styles.categoryText, { color: categoryColor }]}
                    maxFontSizeMultiplier={1}
                  >
                    {mission.category.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.typeChip}>
                  <Text style={styles.typeText} maxFontSizeMultiplier={1}>
                    {mission.mission_type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.xpBadge}>
                <View style={styles.xpDot} />
                <Text style={styles.xpText} maxFontSizeMultiplier={1}>
                  +{mission.xp_reward} XP
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.briefingContent}>
            <Text style={styles.briefingLabel} maxFontSizeMultiplier={1}>
              MISSION OBJECTIVE
            </Text>
            <Text style={styles.missionTitle} maxFontSizeMultiplier={1}>
              {mission.title}
            </Text>
            
            <View style={styles.briefingFooter}>
              <View style={styles.importanceIndicator}>
                <View style={styles.importanceDot} />
                <Text style={styles.importanceText} maxFontSizeMultiplier={1}>
                  Officer-level response required
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Error banner (submission error) */}
        {error && (
          <View style={styles.submitErrorBox}>
            <Text style={styles.submitErrorText} maxFontSizeMultiplier={1}>
              {error}
            </Text>
          </View>
        )}

        {/* Type-specific component */}
        {mission.mission_type === 'Reflect & Write' && (
          <ReflectWrite
            content={mission.content as ReflectWriteContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {mission.mission_type === 'Poll + Reasoning' && (
          <PollReasoning
            content={mission.content as PollReasoningContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {mission.mission_type === 'Daily Challenge' && (
          <DailyChallenge
            content={mission.content as DailyChallengeContent}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {mission.mission_type === 'Rapid Response' && (
          <RapidResponse
            content={mission.content as RapidResponseContent}
            timeLimit={mission.time_limit_seconds || 60}
            onSubmit={handleSubmit}
            onTimeout={handleTimeout}
            isSubmitting={isSubmitting}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.md,
    backgroundColor:   TacticalColors.glassBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVar + '30',
  },
  headerContent: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  abortButton: {
    paddingVertical:   Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  abortButtonText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.error,
    letterSpacing: LetterSpacing.widest,
  },
  phaseIndicator: {
    alignItems: 'flex-end',
  },
  phaseLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.widest,
    marginBottom:  2,
  },
  phaseText: {
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingSm,
    color:         Colors.primary,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.lg,
  },
  
  // ── Mission Briefing Card ─────────────────────────────────────
  briefingCard: {
    backgroundColor: TacticalColors.surfaceCard,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     TacticalColors.borderTactical,
    overflow:        'hidden',
    marginBottom:    Spacing.xl,
    position:        'relative',
  },
  missionIdTag: {
    position: 'absolute',
    top:      Spacing.md,
    right:    Spacing.md,
    zIndex:   10,
    backgroundColor: 'rgba(16, 20, 21, 0.9)',
    borderRadius:    Radius.xs,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
    borderWidth:       1,
    borderColor:       Colors.primary + '44',
  },
  missionIdText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.primary,
    letterSpacing: 0.5,
  },
  briefingHeader: {
    backgroundColor:   Colors.primary + '11',
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '22',
  },
  headerTopRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  metaBadgeGroup: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    flex:          1,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.sm,
  },
  categoryText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    letterSpacing: LetterSpacing.wider,
  },
  typeChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.sm,
    backgroundColor:   Colors.bgBase,
  },
  typeText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  xpBadge: {
    backgroundColor:   Colors.primary + '22',
    borderRadius:      Radius.sm,
    borderWidth:       1,
    borderColor:       Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical:   Spacing.xs - 1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.xs - 2,
  },
  xpDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.primary,
  },
  xpText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.label,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  briefingContent: {
    padding: Spacing.lg,
    gap:     Spacing.md,
  },
  briefingLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.widest,
  },
  missionTitle: {
    fontFamily:   Fonts.heading,
    fontSize:     FontSizes.headingSm + 2,
    color:        Colors.textPrimary,
    lineHeight:   30,
  },
  briefingFooter: {
    marginTop: Spacing.xs,
  },
  importanceIndicator: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.sm,
    backgroundColor: Colors.bgHighest,
    borderRadius:    Radius.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
  },
  importanceDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: Colors.primary,
  },
  importanceText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textSecondary,
    letterSpacing: 0.5,
  },
  
  // ── Error & Loading States ────────────────────────────────────
  submitErrorBox: {
    backgroundColor: Colors.errorBg,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.error + '55',
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
  },
  submitErrorText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.error,
    lineHeight: 20,
  },
  centerContainer: {
    flex:              1,
    backgroundColor:   Colors.bgBase,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.gutter,
    gap:               Spacing.lg,
  },
  loadingText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textTertiary,
    letterSpacing: 0.5,
  },
  errorBox: {
    alignItems: 'center',
    gap:        Spacing.md,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    color:      Colors.error,
    textAlign:  'center',
    lineHeight: 24,
  },
  errorActions: {
    width: '100%',
    gap:   Spacing.md,
  },
});
