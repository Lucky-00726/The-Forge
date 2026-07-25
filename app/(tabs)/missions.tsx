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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenMeta, CornerMarkers } from '../../src/components/ui';
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
  TacticalColors,
} from '../../src/constants/tokens';
import type { DbMission } from '../../src/types';

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
        <Text style={styles.headerTitle} maxFontSizeMultiplier={1}>
          MISSION LIBRARY
        </Text>
        <Text style={styles.headerSubtitle} maxFontSizeMultiplier={1}>
          {missions.length} AVAILABLE TODAY
        </Text>
      </View>

      <ScreenMeta id="OPS-02" label="Training Library" />

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoText} maxFontSizeMultiplier={1}>
            <Text style={styles.infoTextBold}>Featured Mission</Text> awards full XP.{'\n'}
            <Text style={styles.infoTextBold}>Training Missions</Text> award 50% XP.
          </Text>
        </View>
      </View>

      {/* Mission Cards */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText} maxFontSizeMultiplier={1}>
            Loading mission library…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle} maxFontSizeMultiplier={1}>
            MISSION LIBRARY ERROR
          </Text>
          <Text style={styles.errorText} maxFontSizeMultiplier={1}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
            activeOpacity={0.85}
          >
            <Text style={styles.retryButtonText} maxFontSizeMultiplier={1}>
              ↻ RETRY LOAD
            </Text>
          </TouchableOpacity>
        </View>
      ) : missions.length === 0 ? (
        <View style={styles.noMissionsBox}>
          <Text style={styles.noMissionsIcon}>📋</Text>
          <Text style={styles.noMissionsText} maxFontSizeMultiplier={1}>
            No missions available today. Check back tomorrow.
          </Text>
        </View>
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
                style={[
                  styles.missionCard,
                  isFeatured && styles.missionCardFeatured,
                  isCompleted && styles.missionCardCompleted,
                  isLocked && styles.missionCardLocked,
                ]}
                onPress={() => handleMissionPress(mission)}
                activeOpacity={0.85}
                disabled={isCompleted || isLocked}
              >
                <CornerMarkers
                  position="all"
                  color={
                    isLocked ? Colors.textTertiary :
                    isCompleted ? Colors.success :
                    isFeatured ? Colors.primary :
                    Colors.textTertiary
                  }
                />

                {/* Badge: Featured / Training / Completed / Locked */}
                <View style={styles.missionBadgeRow}>
                  {isLocked && (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedText} maxFontSizeMultiplier={1}>
                        🔒 UNLOCKS DAY {mission.unlock_day}
                      </Text>
                    </View>
                  )}
                  {!isLocked && isFeatured && (
                    <View style={styles.featuredBadge}>
                      <View style={styles.featuredDot} />
                      <Text style={styles.featuredText} maxFontSizeMultiplier={1}>
                        FEATURED
                      </Text>
                    </View>
                  )}
                  {!isLocked && !isFeatured && !isCompleted && (
                    <View style={styles.trainingBadge}>
                      <Text style={styles.trainingText} maxFontSizeMultiplier={1}>
                        TRAINING
                      </Text>
                    </View>
                  )}
                  {isCompleted && !isLocked && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText} maxFontSizeMultiplier={1}>
                        ✓ COMPLETE
                      </Text>
                    </View>
                  )}
                </View>

                {/* Mission ID tag */}
                <View style={styles.missionIdTag}>
                  <Text style={styles.missionIdText} maxFontSizeMultiplier={1}>
                    {mission.id}
                  </Text>
                </View>

                {/* Mission title */}
                <Text style={styles.missionTitle} maxFontSizeMultiplier={1}>
                  {mission.title}
                </Text>

                {/* Category & Type */}
                <View style={styles.missionMeta}>
                  <View
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor:
                          (CATEGORY_COLORS[mission.category] ?? Colors.textTertiary) + '22',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: CATEGORY_COLORS[mission.category] ?? Colors.textTertiary,
                        },
                      ]}
                      maxFontSizeMultiplier={1}
                    >
                      {mission.category.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.missionType} maxFontSizeMultiplier={1}>
                    {mission.mission_type}
                  </Text>
                </View>

                {/* XP indicator */}
                <View style={styles.xpRow}>
                  <Text style={styles.xpLabel} maxFontSizeMultiplier={1}>
                    XP REWARD
                  </Text>
                  <Text
                    style={[
                      styles.xpValue,
                      isFeatured && styles.xpValueFeatured,
                    ]}
                    maxFontSizeMultiplier={1}
                  >
                    +{xpAwarded}
                    {!isFeatured && !isCompleted && (
                      <Text style={styles.xpPercent}> (50%)</Text>
                    )}
                  </Text>
                </View>

                {/* Call to action */}
                {!isCompleted && !isLocked && (
                  <View style={styles.actionRow}>
                    <Text style={styles.actionText} maxFontSizeMultiplier={1}>
                      TAP TO BEGIN →
                    </Text>
                  </View>
                )}
                
                {isLocked && (
                  <View style={styles.lockedMessage}>
                    <Text style={styles.lockedMessageText} maxFontSizeMultiplier={1}>
                      Complete Day {mission.unlock_day - 1} missions to unlock
                    </Text>
                  </View>
                )}
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
    flex:            1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.xxl,
  },
  
  // ── Header ────────────────────────────────────────────────────
  header: {
    marginBottom: Spacing.md,
    gap:          Spacing.xs,
  },
  headerTitle: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.label,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  headerSubtitle: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  
  // ── Info Banner ───────────────────────────────────────────────
  infoBanner: {
    backgroundColor:  Colors.bgSurface,
    borderRadius:     Radius.md,
    borderWidth:      1,
    borderColor:      Colors.outlineVar,
    padding:          Spacing.md,
    flexDirection:    'row',
    gap:              Spacing.sm,
    marginBottom:     Spacing.lg,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  infoTextBold: {
    fontFamily: Fonts.bodyMedium,
    color:      Colors.textPrimary,
  },
  
  // ── Mission List ──────────────────────────────────────────────
  missionList: {
    gap: Spacing.md,
  },
  
  // ── Mission Card ──────────────────────────────────────────────
  missionCard: {
    backgroundColor: TacticalColors.surfaceCard,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     TacticalColors.borderTactical,
    padding:         Spacing.lg,
    position:        'relative',
    gap:             Spacing.sm,
  },
  missionCardFeatured: {
    backgroundColor: Colors.primary + '11',
    borderColor:     Colors.primary + '55',
  },
  missionCardCompleted: {
    backgroundColor: Colors.success + '11',
    borderColor:     Colors.success + '44',
    opacity:         0.65,
  },
  missionCardLocked: {
    backgroundColor: Colors.bgLow,
    borderColor:     Colors.outlineVar + '44',
    opacity:         0.5,
  },
  
  // ── Badges ────────────────────────────────────────────────────
  missionBadgeRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  featuredBadge: {
    backgroundColor:  Colors.primary,
    borderRadius:     Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              Spacing.xs - 2,
  },
  featuredDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.onPrimary,
  },
  featuredText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.wider,
  },
  trainingBadge: {
    backgroundColor:   'transparent',
    borderWidth:       1,
    borderColor:       Colors.textTertiary,
    borderRadius:      Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
  },
  trainingText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  completedBadge: {
    backgroundColor:   Colors.success + '33',
    borderRadius:      Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
  },
  completedText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.success,
    letterSpacing: LetterSpacing.wider,
  },
  lockedBadge: {
    backgroundColor:   Colors.bgHighest,
    borderRadius:      Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
  },
  lockedText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  
  // ── Mission ID Tag ────────────────────────────────────────────
  missionIdTag: {
    position:          'absolute',
    top:               Spacing.md,
    right:             Spacing.md,
    backgroundColor:   'rgba(16, 20, 21, 0.8)',
    borderRadius:      Radius.xs,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
  },
  missionIdText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: 0.5,
  },
  
  // ── Mission Content ───────────────────────────────────────────
  missionTitle: {
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingSm,
    color:         Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight:    28,
    marginTop:     Spacing.xs,
  },
  missionMeta: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    alignItems:    'center',
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
  missionType: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  
  // ── XP Row ────────────────────────────────────────────────────
  xpRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      Spacing.xs,
    paddingTop:     Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVar,
  },
  xpLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  xpValue: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.textPrimary,
    letterSpacing: LetterSpacing.wide,
  },
  xpValueFeatured: {
    color: Colors.primary,
  },
  xpPercent: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textTertiary,
  },
  
  // ── Action Row ────────────────────────────────────────────────
  actionRow: {
    marginTop: Spacing.xs,
  },
  actionText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  
  // ── Locked Message ────────────────────────────────────────────
  lockedMessage: {
    marginTop: Spacing.xs,
  },
  lockedMessageText: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
    textAlign:  'center',
  },
  
  // ── Loading & Error States ────────────────────────────────────
  loadingBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.xl,
    alignItems:      'center',
    gap:             Spacing.md,
  },
  loadingText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textTertiary,
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: Colors.errorBg,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.error + '55',
    padding:         Spacing.lg,
    gap:             Spacing.md,
  },
  errorTitle: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.error,
    letterSpacing: LetterSpacing.widest,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.error,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     Colors.error,
    paddingVertical: Spacing.md,
    borderRadius:    Radius.md,
    alignItems:      'center',
    marginTop:       Spacing.xs,
  },
  retryButtonText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.error,
    letterSpacing: LetterSpacing.widest,
  },
  noMissionsBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.xl,
    alignItems:      'center',
    gap:             Spacing.md,
  },
  noMissionsIcon: {
    fontSize: 48,
    color:    Colors.textTertiary,
  },
  noMissionsText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    textAlign:  'center',
    lineHeight: 20,
  },
});
