// ─────────────────────────────────────────────────────────────
// THE FORGE — Home Dashboard (Stitch Design)
// Route: /(tabs)/
// Deterministic mission selection based on user.created_at.
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
import { useRouter, useFocusEffect } from 'expo-router';
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
import { computeRankProgress } from '../../src/constants/progression';
import { getTodayStatus, type TodayStatus } from '../../src/services/daily-session.service';
import type { DbMission } from '../../src/types';
import {
  MilledSurface,
  RecessedTrack,
  Display,
  Headline,
  Body,
  LabelCaps,
  Mono,
  ForgeButton,
  SegmentedProgress,
  Chip,
  MetaItem,
  MetaRow,
  SectionLabel,
} from '../../src/components/forge';

// ── Category color mapping ───────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Communication':    Colors.communication,
  'Confidence':       Colors.confidence,
  'Leadership':       Colors.leadership,
  'Awareness':        Colors.awareness,
  'Officer Thinking': Colors.officerThinking,
};

// ── Fixed daily session stack ────────────────────────────────
// Session 1/2/3 content is fixed by the training program, not
// per-user data — this mirrors what index.tsx already hardcoded
// (question counts, format) before the redesign.
const SESSION_STACK = [
  { num: 1 as const, title: 'Knowledge & Awareness',          exercises: '12 exercises', style: 'MCQ',                   route: '/day0-prototype' as const },
  { num: 2 as const, title: 'Defence & General Awareness',    exercises: '12 exercises', style: 'MCQ',                   route: '/session2' as const },
  { num: 3 as const, title: 'Psychology & Response',          exercises: '10 exercises', style: 'SRT · WAT · Interview', route: '/session3' as const },
];

// `new Date()` here is deliberate, not an oversight: the greeting should
// follow the user's local clock, not IST. This is NOT a date-boundary
// decision (it never decides what "today" is for sessions/streaks), so
// it does not violate the todayIST()-only rule in daily-session.service.ts.
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { displayName, currentRank, totalXP, currentStreak, profile } = useAuth();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [mission, setMission] = useState<DbMission | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<TodayStatus | null>(null);

  // Calculate rank progress
  const { pct: progressPct, next: nextRankObj, xpToNext } = computeRankProgress(totalXP);

  const loadTodayMission = useCallback(async () => {
    if (!profile || !userId) {
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // Load session completion status and mission data in parallel
      const joinedDate = profile.created_at.split('T')[0];
      const today = todayIST();
      const weekNum = currentWeekNumber(joinedDate);
      const dayNum = currentDayOfWeek(joinedDate);

      const [missionResult, status] = await Promise.all([
        missionService.fetchTodayMission(userId, weekNum, dayNum),
        getTodayStatus(userId),
      ]);

      // Session status drives gates and completion display
      setSessionStatus(status);

      if (!missionResult.success) {
        setError(missionResult.error);
        setLoading(false);
        return;
      }

      setMission(missionResult.data);

      if (missionResult.data) {
        const completionResult = await missionService.checkTodayCompletion(
          userId,
          todayIST(),
        );

        if (completionResult.success) {
          setIsCompleted(completionResult.data);
        }
      }
    } catch (err) {
      console.error('[Dashboard] loadTodayMission threw:', err);
      setError('Failed to load mission. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [profile, userId]);

  useEffect(() => {
    void loadTodayMission();
  }, [loadTodayMission]);

  // Re-run session status check whenever the dashboard comes back into focus
  // (e.g. after completing Session 1 and returning to the dashboard).
  // Without this, session locks never refresh because loadTodayMission is
  // memoised on [profile, userId] — neither changes on navigation return.
  useFocusEffect(
    useCallback(() => {
      if (profile && userId) {
        getTodayStatus(userId).then(setSessionStatus);
      }
    }, [profile, userId]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodayMission();
    setRefreshing(false);
  };

  const handleCommence = () => {
    if (mission) {
      router.push(`/mission/${mission.id}`);
    }
  };

  // ── Derived display values ───────────────────────────────────
  const greeting = getGreeting();
  const statuses = [sessionStatus?.session1, sessionStatus?.session2, sessionStatus?.session3];
  const completedCount = statuses.filter((s) => s?.completed).length;
  const todayXP = statuses.reduce((sum, s) => sum + (s?.xpEarned ?? 0), 0);
  const missionMinutes = mission?.time_limit_seconds ? Math.round(mission.time_limit_seconds / 60) : null;
  const missionXP = isCompleted ? mission?.xp_reward ?? 0 : 0;

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
      {/* Header + rank progress */}
      <View style={styles.headerBlock}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText} maxFontSizeMultiplier={1}>
                {displayName ? displayName.charAt(0).toUpperCase() : 'O'}
              </Text>
            </View>
            <LabelCaps tone="secondary" numberOfLines={1} maxFontSizeMultiplier={1}>
              {greeting}, {(displayName ?? 'OFFICER').toUpperCase()}
            </LabelCaps>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.xpChip}>
              <Mono tone="gold" maxFontSizeMultiplier={1}>
                {currentRank.toUpperCase()}, {totalXP.toLocaleString()} XP
              </Mono>
            </View>
            <Text style={styles.rankIcon}>🎖</Text>
          </View>
        </View>

        <View style={styles.rankProgressRow}>
          <View style={styles.rankProgressTrack}>
            <View style={[styles.rankProgressFill, { width: `${progressPct}%` }]} />
          </View>
          <Mono tone="tertiary" numberOfLines={1} maxFontSizeMultiplier={1}>
            {nextRankObj ? `${xpToNext} XP → ${nextRankObj.name.toUpperCase()}` : 'MAX RANK'}
          </Mono>
        </View>
      </View>

      {/* Training Day Hero */}
      <View style={styles.trainingHero}>
        <View style={styles.trainingHeroTop}>
          <View>
            <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TODAY'S TRAINING</LabelCaps>
            <Display style={styles.trainingDay} maxFontSizeMultiplier={1}>
              DAY {pad2(profile?.current_training_day ?? 1)}
            </Display>
          </View>
          <View style={styles.trainingHeroRight}>
            <SegmentedProgress total={3} current={completedCount} style={styles.segments} />
            <Mono tone="tertiary" maxFontSizeMultiplier={1}>{completedCount} / 3 SESSIONS</Mono>
          </View>
        </View>

        <MetaRow>
          <MetaItem
            icon={<Text style={styles.metaEmoji}>⚡</Text>}
            label={`DAILY XP +${todayXP}`}
            highlight
          />
          <MetaItem
            icon={<Text style={styles.metaEmoji}>🔥</Text>}
            label={`STREAK ${pad2(currentStreak)}`}
          />
        </MetaRow>
      </View>

      {/* Session Stack */}
      <View style={styles.sessionStack}>
        {SESSION_STACK.map((item, i) => {
          const status = statuses[i];
          const unlocked = i === 0 || !!statuses[i - 1]?.completed;
          const completed = !!status?.completed;
          const isActive = unlocked && !completed;

          if (completed) {
            return (
              <TouchableOpacity
                key={item.num}
                style={styles.stackRow}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.stackRowLeft}>
                  <Text style={styles.stackIconDone}>✓</Text>
                  <Body tone="secondary" style={styles.stackRowTitle} numberOfLines={1} maxFontSizeMultiplier={1}>
                    SESSION {pad2(item.num)}: {item.title}
                  </Body>
                </View>
                <View style={styles.stackRowRight}>
                  {item.num !== 3 && (
                    <Mono tone="tertiary" maxFontSizeMultiplier={1}>
                      {status?.score ?? 0}/{status?.total ?? 12}
                    </Mono>
                  )}
                  <Mono tone="tertiary" maxFontSizeMultiplier={1}>+{status?.xpEarned ?? 0} XP</Mono>
                </View>
              </TouchableOpacity>
            );
          }

          if (isActive) {
            return (
              <MilledSurface key={item.num} brackets active style={styles.activeSessionCard}>
                <Chip label="IN PROGRESS" tone="gold" />
                <Headline maxFontSizeMultiplier={1}>
                  SESSION {pad2(item.num)}: {item.title.toUpperCase()}
                </Headline>
                <MetaRow>
                  <MetaItem label={item.exercises} />
                  <MetaItem label={item.style} />
                  <MetaItem label="+ XP AVAILABLE" highlight />
                </MetaRow>
                <ForgeButton
                  label="CONTINUE TRAINING"
                  onPress={() => router.push(item.route)}
                  iconRight={<Text style={styles.primaryArrow}>→</Text>}
                />
              </MilledSurface>
            );
          }

          return (
            <View key={item.num} style={[styles.stackRow, styles.stackRowLocked]}>
              <View style={styles.stackRowLeft}>
                <Text style={styles.stackIconLocked}>🔒</Text>
                <View style={styles.stackRowTextCol}>
                  <Body tone="tertiary" style={styles.stackRowTitle} numberOfLines={1} maxFontSizeMultiplier={1}>
                    SESSION {pad2(item.num)}: {item.title}
                  </Body>
                  <Body tone="tertiary" numberOfLines={1} maxFontSizeMultiplier={1}>
                    Complete Session {item.num - 1} to unlock
                  </Body>
                </View>
              </View>
            </View>
          );
        })}

        {completedCount === 3 && (
          <MilledSurface brackets style={styles.allDoneCard}>
            <Headline tone="success" maxFontSizeMultiplier={1}>ALL SESSIONS COMPLETE</Headline>
            <Body tone="secondary" style={styles.allDoneBody} maxFontSizeMultiplier={1}>
              Training cycle resumes tomorrow at 0600 hours.
            </Body>
          </MilledSurface>
        )}
      </View>

      {/* Streak Module */}
      <RecessedTrack style={styles.streakModule}>
        <Text style={styles.streakModuleIcon}>🔥</Text>
        <View style={styles.streakModuleText}>
          <LabelCaps style={styles.streakModuleTitle} maxFontSizeMultiplier={1}>
            {pad2(currentStreak)} DAY STREAK
          </LabelCaps>
          <Body tone="secondary" maxFontSizeMultiplier={1}>
            {currentStreak === 0 ? 'Awaiting mission completion' : "Keep today's run alive."}
          </Body>
        </View>
      </RecessedTrack>

      {/* Featured Mission */}
      <View style={styles.section}>
        <SectionLabel>FEATURED MISSION</SectionLabel>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Body tone="tertiary" maxFontSizeMultiplier={1}>Loading today's mission…</Body>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <LabelCaps tone="error" maxFontSizeMultiplier={1}>MISSION ASSIGNMENT ERROR</LabelCaps>
            <Body tone="error" maxFontSizeMultiplier={1}>{error}</Body>
            <ForgeButton
              variant="secondary"
              label="↻ RETRY MISSION LOAD"
              onPress={handleRefresh}
            />
          </View>
        ) : !mission ? (
          <View style={styles.noMissionBox}>
            <Text style={styles.noMissionIcon}>✓</Text>
            <Body tone="secondary" style={styles.noMissionText} maxFontSizeMultiplier={1}>
              No mission available for today. Check back tomorrow.
            </Body>
          </View>
        ) : isCompleted ? (
          <MilledSurface brackets style={styles.completedMissionCard}>
            <View style={styles.completedMissionHeader}>
              <Text style={styles.completedIcon}>✓</Text>
              <LabelCaps tone="success" maxFontSizeMultiplier={1}>MISSION COMPLETE</LabelCaps>
            </View>
            <Headline style={styles.completedMissionTitle} maxFontSizeMultiplier={1}>{mission.title}</Headline>
            <Body tone="secondary" maxFontSizeMultiplier={1}>
              Mission objectives achieved. Training cycle resumes tomorrow at 0600 hours.
            </Body>
          </MilledSurface>
        ) : (
          <MilledSurface brackets style={styles.missionCard}>
            <View style={styles.missionMetaRow}>
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
              {missionMinutes !== null && <Chip label={`${missionMinutes} MIN`} tone="neutral" />}
            </View>

            <Headline maxFontSizeMultiplier={1}>{mission.title}</Headline>

            <MetaItem label={mission.mission_type} />

            <Body tone="secondary" style={styles.missionDescription} maxFontSizeMultiplier={1}>
              "Mastering the {mission.category.toLowerCase()} skills critical for officer selection." — This mission develops your tactical readiness.
            </Body>

            <ForgeButton
              variant="ghost"
              label="BEGIN MISSION"
              iconRight={<Text style={styles.ghostArrow}>→</Text>}
              onPress={handleCommence}
            />
          </MilledSurface>
        )}
      </View>

      {/* Daily Summary */}
      <View style={styles.footer}>
        <Mono tone="tertiary" style={styles.footerText} maxFontSizeMultiplier={1}>
          TODAY: Training XP {todayXP} | Mission XP {missionXP} | Total XP {totalXP.toLocaleString()}
        </Mono>
        <Text style={styles.footerIcon}>ⓘ</Text>
      </View>
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
    gap:               Spacing.lg,
  },

  // ── Header ────────────────────────────────────────────────────
  headerBlock: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flexShrink:    1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs,
  },
  avatar: {
    width:           32,
    height:          32,
    borderRadius:    Radius.full,
    backgroundColor: Colors.bgSurface,
    borderWidth:     1,
    borderColor:     Colors.outlineVar + '80',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize:   FontSizes.bodySm,
    color:      Colors.primary,
  },
  xpChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.xs,
    backgroundColor:   Colors.primary + '1A',
    borderWidth:       1,
    borderColor:       Colors.primary + '33',
  },
  rankIcon: {
    fontSize: 16,
  },
  rankProgressRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  rankProgressTrack: {
    flex:            1,
    height:          4,
    backgroundColor: Colors.bgHighest,
    borderRadius:    Radius.xs,
    overflow:        'hidden',
  },
  rankProgressFill: {
    height:          4,
    backgroundColor: Colors.primary,
    borderRadius:    Radius.xs,
  },

  // ── Training Day Hero ────────────────────────────────────────
  trainingHero: {
    gap: Spacing.sm,
  },
  trainingHeroTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
  },
  trainingDay: {
    marginTop: 2,
  },
  trainingHeroRight: {
    alignItems: 'flex-end',
    gap:        4,
    minWidth:   120,
  },
  segments: {
    width: 72,
  },
  metaEmoji: {
    fontSize: 14,
  },

  // ── Session Stack ─────────────────────────────────────────────
  sessionStack: {
    gap: Spacing.sm,
  },
  stackRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius:      Radius.sm,
    backgroundColor:   Colors.bgLow,
    borderWidth:       1,
    borderColor:       Colors.outlineFaint,
  },
  stackRowLocked: {
    opacity: 0.55,
  },
  stackRowLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    flexShrink:    1,
  },
  stackRowTitle: {
    flexShrink: 1,
  },
  stackRowTextCol: {
    flexShrink: 1,
    gap:        2,
  },
  stackRowRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  stackIconDone: {
    fontSize: 16,
    color:    Colors.success,
  },
  stackIconLocked: {
    fontSize: 16,
  },
  activeSessionCard: {
    padding: Spacing.lg,
    gap:     Spacing.md,
  },
  primaryArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.onPrimary,
  },
  allDoneCard: {
    padding: Spacing.lg,
  },
  allDoneBody: {
    marginTop: Spacing.xs,
  },

  // ── Streak Module ─────────────────────────────────────────────
  streakModule: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    padding:       Spacing.md,
  },
  streakModuleIcon: {
    fontSize: 24,
  },
  streakModuleText: {
    flex: 1,
    gap:  2,
  },
  streakModuleTitle: {
    marginBottom: 0,
  },

  // ── Featured Mission ──────────────────────────────────────────
  section: {
    gap: Spacing.sm,
  },
  loadingBox: {
    alignItems:      'center',
    gap:             Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.errorBg,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.error + '55',
    padding:         Spacing.lg,
    gap:             Spacing.sm,
  },
  noMissionBox: {
    alignItems:      'center',
    gap:             Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  noMissionIcon: {
    fontSize: 40,
    color:    Colors.textTertiary,
  },
  noMissionText: {
    textAlign: 'center',
  },
  completedMissionCard: {
    padding:     Spacing.lg,
    gap:         Spacing.sm,
    borderColor: Colors.success,
  },
  completedMissionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  completedMissionTitle: {
    marginTop: 0,
  },
  completedIcon: {
    fontSize: 20,
    color:    Colors.success,
  },
  missionCard: {
    padding: Spacing.lg,
    gap:     Spacing.sm,
  },
  missionMetaRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.xs,
  },
  categoryBadgeText: {
    letterSpacing: LetterSpacing.wider,
  },
  missionDescription: {
    fontStyle: 'italic',
  },
  ghostArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.primary,
  },

  // ── Daily Summary ─────────────────────────────────────────────
  footer: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingTop:        Spacing.lg,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.outlineVar,
    opacity:           0.7,
  },
  footerText: {
    flex: 1,
  },
  footerIcon: {
    fontSize: 14,
    color:    Colors.textTertiary,
  },
});
