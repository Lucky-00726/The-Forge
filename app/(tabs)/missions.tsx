// ─────────────────────────────────────────────────────────────
// THE FORGE — Mission Library (Training Tab)
// Route: /(tabs)/missions
// Shows all 5 daily missions with featured/training distinction
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/store/auth.store';
import * as missionService from '../../src/services/mission.service';
import {
  currentWeekNumber,
  currentDayOfWeek,
  todayIST,
} from '../../src/utils/date';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
} from '../../src/constants/tokens';
import type { DbMission } from '../../src/types';
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

// ── Category color mapping ───────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Communication':    Colors.communication,
  'Confidence':       Colors.confidence,
  'Leadership':       Colors.leadership,
  'Awareness':        Colors.awareness,
  'Officer Thinking': Colors.officerThinking,
};

// ── Helper to determine featured mission ──────────────────────
// Featured mission = highest XP for current week/day
function getFeaturedMissionId(missions: DbMission[]): string | null {
  if (missions.length === 0) return null;
  
  const sorted = [...missions].sort((a, b) => b.xp_reward - a.xp_reward);
  return sorted[0].id;
}

export default function MissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile } = useAuth();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [missions, setMissions] = useState<DbMission[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProgrammeDay, setUserProgrammeDay] = useState<number>(1);

  const loadMissions = useCallback(async () => {
    if (!profile || !userId) return;

    setError(null);

    const joinedDate = profile.created_at.split('T')[0];
    const today = todayIST();
    const weekNum = currentWeekNumber(joinedDate);
    const dayNum = currentDayOfWeek(joinedDate);
    setUserProgrammeDay(dayNum);

    // Fetch all missions for today
    const missionResult = await missionService.fetchTodayMissions(
      userId,
      weekNum,
      dayNum,
    );

    if (!missionResult.success) {
      setError(missionResult.error);
      setLoading(false);
      return;
    }

    const allMissions = missionResult.data;
    
    // Filter by programme day - only show missions unlocked up to current day
    const accessibleMissions = allMissions.filter(m => m.unlock_day <= dayNum);
    setMissions(accessibleMissions);

    // Determine featured mission (highest XP)
    const featured = getFeaturedMissionId(accessibleMissions);
    setFeaturedId(featured);

    // Fetch completed mission IDs for today
    const completedResult = await missionService.getTodayCompletedMissionIds(
      userId,
      today,
    );

    if (completedResult.success) {
      setCompletedIds(completedResult.data);
    }

    setLoading(false);
  }, [profile, userId]);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const handleMissionPress = (mission: DbMission) => {
    // Block navigation to locked missions
    if (mission.unlock_day > userProgrammeDay) {
      return;
    }
    router.push(`/mission/${mission.id}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.md },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>MISSION LIBRARY</LabelCaps>
        <Display maxFontSizeMultiplier={1}>TRAINING</Display>
      </View>

      {/* Stat Row */}
      <MilledSurface style={styles.statRow}>
        <View style={styles.statColumn}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>AVAILABLE TODAY</LabelCaps>
          <Mono tone="gold" maxFontSizeMultiplier={1}>{missions.length}</Mono>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statColumn}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>COMPLETED</LabelCaps>
          <Mono tone="success" maxFontSizeMultiplier={1}>{completedIds.length}</Mono>
        </View>
      </MilledSurface>

      {/* XP Rule Explanation */}
      <Body tone="tertiary" maxFontSizeMultiplier={1} style={styles.xpExplanation}>
        <Text style={styles.xpExplanationBold}>Featured Mission</Text> awards full XP. <Text style={styles.xpExplanationBold}>Training Missions</Text> award 50% XP.
      </Body>

      {/* Mission Cards */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Body tone="secondary" maxFontSizeMultiplier={1}>
            Loading mission library…
          </Body>
        </View>
      ) : error ? (
        <MilledSurface style={styles.errorBox}>
          <LabelCaps tone="error" maxFontSizeMultiplier={1}>MISSION LIBRARY ERROR</LabelCaps>
          <Body tone="secondary" maxFontSizeMultiplier={1}>
            {error}
          </Body>
          <ForgeButton
            label="↻ RETRY LOAD"
            onPress={handleRefresh}
            style={styles.retryButton}
          />
        </MilledSurface>
      ) : missions.length === 0 ? (
        <MilledSurface style={styles.emptyBox}>
          <MaterialIcons name="assignment" size={40} color={Colors.textTertiary} />
          <Body tone="secondary" style={styles.emptyText} maxFontSizeMultiplier={1}>
            No missions available today. Check back tomorrow.
          </Body>
        </MilledSurface>
      ) : (
        <View style={styles.missionList}>
          {missions.map((mission) => {
            const isFeatured = mission.id === featuredId;
            const isCompleted = completedIds.includes(mission.id);
            const isLocked = mission.unlock_day > userProgrammeDay;
            const xpAwarded = isFeatured
              ? mission.xp_reward
              : Math.floor(mission.xp_reward * 0.5);

            return (
              <TouchableOpacity
                key={mission.id}
                activeOpacity={isCompleted || isLocked ? 1 : 0.7}
                disabled={isCompleted || isLocked}
                onPress={() => handleMissionPress(mission)}
              >
                <MilledSurface
                  brackets
                  style={[
                    styles.missionCard,
                    isCompleted && styles.missionCardCompleted,
                    isLocked && styles.missionCardLocked,
                  ]}
                >
                  {/* Badge and category row */}
                  <View style={styles.missionHeaderRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: (CATEGORY_COLORS[mission.category] ?? Colors.textTertiary) + '22' },
                      ]}
                    >
                      <Mono
                        style={[
                          styles.categoryBadgeText,
                          { color: CATEGORY_COLORS[mission.category] ?? Colors.textTertiary },
                        ]}
                        maxFontSizeMultiplier={1}
                      >
                        {mission.category.toUpperCase()}
                      </Mono>
                    </View>
                    {isLocked && (
                      <Chip label={`UNLOCKS DAY ${mission.unlock_day}`} tone="neutral" />
                    )}
                    {!isLocked && isFeatured && (
                      <Chip label="FEATURED" tone="gold" />
                    )}
                    {!isLocked && !isFeatured && !isCompleted && (
                      <Chip label="TRAINING" tone="neutral" />
                    )}
                    {isCompleted && (
                      <Chip label="✓ COMPLETE" tone="success" />
                    )}
                  </View>

                  {/* Mission ID */}
                  <Mono tone="tertiary" style={styles.missionId} maxFontSizeMultiplier={1}>
                    {mission.id}
                  </Mono>

                  {/* Mission title */}
                  <Headline maxFontSizeMultiplier={1}>
                    {mission.title}
                  </Headline>

                  {/* Mission type */}
                  <MetaItem label={mission.mission_type} />

                  {/* XP indicator */}
                  <View style={styles.xpRow}>
                    <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>
                      XP REWARD
                    </LabelCaps>
                    <Mono
                      tone={isFeatured ? 'gold' : 'secondary'}
                      maxFontSizeMultiplier={1}
                    >
                      +{xpAwarded}
                      {!isFeatured && !isCompleted && (
                        <Mono tone="tertiary" maxFontSizeMultiplier={1}> (50%)</Mono>
                      )}
                    </Mono>
                  </View>

                  {/* Call to action */}
                  {!isCompleted && !isLocked && (
                    <ForgeButton
                      variant="ghost"
                      label="BEGIN MISSION"
                      iconRight={<MaterialIcons name="arrow-right-alt" size={18} color={Colors.primary} />}
                    />
                  )}

                  {isLocked && (
                    <Body tone="tertiary" style={styles.lockedMessage} maxFontSizeMultiplier={1}>
                      Complete Day {mission.unlock_day - 1} missions to unlock
                    </Body>
                  )}
                </MilledSurface>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    gap: Spacing.xs,
  },

  // ── Stat Row ──────────────────────────────────────────────────
  statRow: {
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  statColumn: {
    flex: 1,
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.outlineVar,
  },

  // ── Mission List ──────────────────────────────────────────────
  missionList: {
    gap: Spacing.md,
  },

  // ── Mission Card ──────────────────────────────────────────────
  missionCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  missionCardCompleted: {
    opacity: 0.65,
  },
  missionCardLocked: {
    opacity: 0.5,
  },

  // ── Card content ──────────────────────────────────────────────
  missionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryBadge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: Spacing.xs - 2,
  },
  categoryBadgeText: {
    fontSize: FontSizes.micro,
  },
  missionId: {
    fontSize: FontSizes.micro,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockedMessage: {
    marginTop: Spacing.xs,
  },

  // ── Loading & Error States ────────────────────────────────────
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorBox: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
  emptyBox: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    textAlign: 'center',
  },
  xpExplanation: {
    textAlign: 'center',
    lineHeight: 20,
  },
  xpExplanationBold: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.textPrimary,
  },

});
