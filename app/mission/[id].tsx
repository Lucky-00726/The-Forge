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
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMissionEngine } from '../../src/hooks/useMissionEngine';
import ReflectWrite from '../../src/components/mission-types/ReflectWrite';
import PollReasoning from '../../src/components/mission-types/PollReasoning';
import DailyChallenge from '../../src/components/mission-types/DailyChallenge';
import RapidResponse from '../../src/components/mission-types/RapidResponse';
import {
  MilledSurface,
  Display,
  Headline,
  Body,
  LabelCaps,
  Mono,
  ForgeButton,
  Chip,
  MetaItem,
} from '../../src/components/forge';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
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
        <Body tone="secondary" maxFontSizeMultiplier={1}>
          Loading mission…
        </Body>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error && !mission) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top + Spacing.xl }]}>
        <LabelCaps tone="error" maxFontSizeMultiplier={1}>MISSION LOAD FAILED</LabelCaps>
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Body tone="secondary" style={styles.errorText} maxFontSizeMultiplier={1}>
            {error}
          </Body>
        </View>
        <View style={styles.errorActions}>
          <ForgeButton
            label="Retry"
            onPress={retry}
            variant="secondary"
          />
          <ForgeButton
            label="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant="secondary"
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <ForgeButton
            label="← ABORT"
            onPress={() => router.back()}
            variant="ghost"
            style={styles.abortButton}
          />
          <View style={styles.phaseIndicator}>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>MISSION BRIEFING</LabelCaps>
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
        <MilledSurface brackets style={styles.briefingCard}>

          {/* Mission header with metadata */}
          <View style={styles.briefingHeader}>
            <View style={styles.headerTopRow}>
              <View style={styles.metaBadgeGroup}>
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: (categoryColor ?? Colors.textTertiary) + '22' },
                  ]}
                >
                  <Mono
                    style={[
                      styles.categoryText,
                      { color: categoryColor ?? Colors.textTertiary },
                    ]}
                    maxFontSizeMultiplier={1}
                  >
                    {mission.category.toUpperCase()}
                  </Mono>
                </View>
              </View>
              <View style={styles.metaItems}>
                {mission.time_limit_seconds && (
                  <MetaItem
                    label={`${Math.round(mission.time_limit_seconds / 60)} MIN`}
                    icon={<MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />}
                  />
                )}
                <MetaItem
                  label={`+${mission.xp_reward} XP`}
                  icon={<MaterialIcons name="star" size={14} color={Colors.primary} />}
                />
              </View>
            </View>
          </View>

          <View style={styles.briefingContent}>
            <Headline maxFontSizeMultiplier={1}>
              {mission.title}
            </Headline>
            <Mono tone="tertiary" maxFontSizeMultiplier={1}>
              {mission.mission_type}
            </Mono>
          </View>
        </MilledSurface>

        {/* Error banner (submission error) */}
        {error && (
          <MilledSurface style={styles.submitErrorBox}>
            <LabelCaps tone="error" maxFontSizeMultiplier={1}>SUBMISSION ERROR</LabelCaps>
            <Body tone="secondary" maxFontSizeMultiplier={1}>
              {error}
            </Body>
          </MilledSurface>
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
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  header: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVar + '30',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  abortButton: {},
  phaseIndicator: {
    alignItems: 'flex-end',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.lg,
  },

  // ── Mission Briefing Card ─────────────────────────────────────
  briefingCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  briefingHeader: {
    gap: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metaBadgeGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  categoryText: {},
  metaItems: {
    gap: Spacing.sm,
  },
  briefingContent: {
    gap: Spacing.sm,
  },

  // ── Error & Loading States ────────────────────────────────────
  submitErrorBox: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.gutter,
    gap: Spacing.lg,
  },
  errorBox: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    textAlign: 'center',
  },
  errorActions: {
    width: '100%',
    gap: Spacing.md,
  },
});
