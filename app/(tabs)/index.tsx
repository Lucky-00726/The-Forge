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
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
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
  TacticalShadows,
} from '../../src/constants/tokens';
import { computeRankProgress } from '../../src/constants/progression';
import { getTodayStatus, type TodayStatus } from '../../src/services/daily-session.service';
import type { DbMission } from '../../src/types';

// ── Category color mapping ───────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Communication':    Colors.communication,
  'Confidence':       Colors.confidence,
  'Leadership':       Colors.leadership,
  'Awareness':        Colors.awareness,
  'Officer Thinking': Colors.officerThinking,
};

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
  const nextThreshold = nextRankObj ? nextRankObj.minXP : totalXP;

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
      {/* Header: MISSION COMMAND + Profile */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} maxFontSizeMultiplier={1}>
          MISSION COMMAND
        </Text>
        
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText} maxFontSizeMultiplier={1}>
              {displayName ? displayName.charAt(0).toUpperCase() : 'O'}
            </Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileRank} maxFontSizeMultiplier={1}>
              {currentRank.toUpperCase()}
            </Text>
            <View style={styles.profileXPBar}>
              <View style={styles.profileXPTrack}>
                <View style={[styles.profileXPFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.profileXPText} maxFontSizeMultiplier={1}>
                {totalXP.toLocaleString()} / {nextThreshold.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScreenMeta id="OPS-01" label="Command Centre" />

      {/* Streak Section */}
      <View style={[
        styles.streakCard,
        currentStreak > 0 && styles.streakCardActive,
        TacticalShadows.glow
      ]}>
        <CornerMarkers position="all" color={currentStreak > 0 ? Colors.success : Colors.primary} />
        
        <View style={styles.streakWatermark} />

        <View style={styles.streakHeader}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakLabel} maxFontSizeMultiplier={1}>
            ACTIVE ENGAGEMENT
          </Text>
        </View>
        
        <Text style={[
          styles.streakValue,
          currentStreak > 0 && { color: Colors.success }
        ]} maxFontSizeMultiplier={1}>
          {currentStreak === 1 ? '01' : currentStreak < 10 ? `0${currentStreak}` : currentStreak} DAY STREAK
        </Text>
        
        <Text style={styles.streakStatus} maxFontSizeMultiplier={1}>
          {currentStreak === 0
            ? 'Awaiting mission completion'
            : 'Operational Consistency: Optimal'}
        </Text>
      </View>

      {/* Day 1 Training Entry */}
      <View style={styles.day0Card}>
        <CornerMarkers position="all" color={sessionStatus?.session1.completed ? Colors.success : Colors.primary} />
        
        <View style={styles.day0Header}>
          <Text style={styles.day0Icon}>{sessionStatus?.session1.completed ? '✓' : '🎯'}</Text>
          <View style={styles.day0HeaderText}>
            <Text style={styles.day0Title} maxFontSizeMultiplier={1}>
              DAY {profile?.current_training_day ?? 1} • SESSION 1
            </Text>
            <Text style={styles.day0Subtitle} maxFontSizeMultiplier={1}>
              {sessionStatus?.session1.completed
                ? `Completed · ${sessionStatus.session1.score ?? 0}/${sessionStatus.session1.total ?? 12} · +${sessionStatus.session1.xpEarned} XP`
                : '12 questions • SSB knowledge & awareness'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.day0Button, sessionStatus?.session1.completed && styles.sessionButtonCompleted]}
          onPress={() => router.push('/day0-prototype')}
          activeOpacity={0.85}
        >
          <Text style={styles.day0ButtonText} maxFontSizeMultiplier={1}>
            {sessionStatus?.session1.completed ? 'REVIEW SESSION 1' : 'START SESSION 1'}
          </Text>
          <Text style={styles.day0ButtonArrow} maxFontSizeMultiplier={1}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Session 2 Entry */}
      {(() => {
        const s1Done = sessionStatus?.session1.completed ?? false;
        const s2Done = sessionStatus?.session2.completed ?? false;
        return (
          <View style={[styles.sessionCard, !s1Done && styles.sessionCardLocked]}>
            <CornerMarkers position="all" color={s2Done ? Colors.success : s1Done ? Colors.confidence : Colors.textTertiary} />
            
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionIcon}>{s2Done ? '✓' : s1Done ? '⚡' : '🔒'}</Text>
              <View style={styles.sessionHeaderText}>
                <Text style={[styles.sessionTitle, !s1Done && { color: Colors.textTertiary }]} maxFontSizeMultiplier={1}>
                  DAY {profile?.current_training_day ?? 1} • SESSION 2
                </Text>
                <Text style={styles.sessionSubtitle} maxFontSizeMultiplier={1}>
                  {s2Done
                    ? `Completed · ${sessionStatus?.session2.score ?? 0}/${sessionStatus?.session2.total ?? 12} · +${sessionStatus?.session2.xpEarned} XP`
                    : s1Done
                    ? '12 questions • SSB, defence & general awareness'
                    : 'Complete Session 1 to unlock'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.sessionButton,
                s2Done && styles.sessionButtonCompleted,
                !s1Done && styles.sessionButtonLocked,
              ]}
              onPress={() => s1Done && router.push('/session2')}
              activeOpacity={s1Done ? 0.85 : 1}
              disabled={!s1Done}
            >
              <Text style={[styles.sessionButtonText, !s1Done && { color: Colors.textTertiary }]} maxFontSizeMultiplier={1}>
                {s2Done ? 'REVIEW SESSION 2' : s1Done ? 'START SESSION 2' : 'LOCKED'}
              </Text>
              {s1Done && <Text style={styles.sessionButtonArrow} maxFontSizeMultiplier={1}>→</Text>}
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Session 3 Entry */}
      {(() => {
        const s2Done = sessionStatus?.session2.completed ?? false;
        const s3Done = sessionStatus?.session3.completed ?? false;
        return (
          <View style={[styles.sessionCard, styles.sessionCard3, !s2Done && styles.sessionCardLocked]}>
            <CornerMarkers position="all" color={s3Done ? Colors.success : s2Done ? Colors.leadership : Colors.textTertiary} />
            
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionIcon}>{s3Done ? '✓' : s2Done ? '📝' : '🔒'}</Text>
              <View style={styles.sessionHeaderText}>
                <Text style={[styles.sessionTitle, { color: s2Done ? Colors.leadership : Colors.textTertiary }]} maxFontSizeMultiplier={1}>
                  DAY {profile?.current_training_day ?? 1} • SESSION 3
                </Text>
                <Text style={styles.sessionSubtitle} maxFontSizeMultiplier={1}>
                  {s3Done
                    ? `Completed · +${sessionStatus?.session3.xpEarned} XP`
                    : s2Done
                    ? '10 questions • SRT, WAT, Interview style • AI Evaluation'
                    : 'Complete Session 2 to unlock'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.sessionButton,
                styles.sessionButton3,
                s3Done && styles.sessionButtonCompleted,
                !s2Done && styles.sessionButtonLocked,
              ]}
              onPress={() => s2Done && router.push('/session3')}
              activeOpacity={s2Done ? 0.85 : 1}
              disabled={!s2Done}
            >
              <Text style={[styles.sessionButtonText, !s2Done && { color: Colors.textTertiary }]} maxFontSizeMultiplier={1}>
                {s3Done ? 'REVIEW SESSION 3' : s2Done ? 'START SESSION 3' : 'LOCKED'}
              </Text>
              {s2Done && <Text style={styles.sessionButtonArrow} maxFontSizeMultiplier={1}>→</Text>}
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Mission Hero Card */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText} maxFontSizeMultiplier={1}>
            Loading today's mission…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle} maxFontSizeMultiplier={1}>
            MISSION ASSIGNMENT ERROR
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
              ↻ RETRY MISSION LOAD
            </Text>
          </TouchableOpacity>
        </View>
      ) : !mission ? (
        <View style={styles.noMissionBox}>
          <Text style={styles.noMissionIcon}>✓</Text>
          <Text style={styles.noMissionText} maxFontSizeMultiplier={1}>
            No mission available for today. Check back tomorrow.
          </Text>
        </View>
      ) : isCompleted ? (
        <View style={styles.completedCard}>
          <CornerMarkers position="all" color={Colors.success} />
          
          <View style={styles.completedHeader}>
            <Text style={styles.completedIcon}>✓</Text>
            <Text style={styles.completedTitle} maxFontSizeMultiplier={1}>
              MISSION COMPLETE
            </Text>
          </View>
          
          <View style={styles.completedContent}>
            <Text style={styles.completedLabel} maxFontSizeMultiplier={1}>
              TODAY'S OBJECTIVE
            </Text>
            <Text style={styles.completedSubtitle} maxFontSizeMultiplier={1}>
              {mission.title}
            </Text>
            <View style={styles.completedDivider} />
            <Text style={styles.completedMessage} maxFontSizeMultiplier={1}>
              Mission objectives achieved. Training cycle resumes tomorrow at 0600 hours.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.missionHero}>
          <CornerMarkers position="all" />
          
          {/* Mission ID tag (top-right) */}
          <View style={styles.missionIdTag}>
            <Text style={styles.missionIdText} maxFontSizeMultiplier={1}>
              ID: {mission.id}
            </Text>
          </View>

          {/* Hero section with gradient overlay */}
          <View style={styles.heroImageSection}>
            <View style={styles.heroImagePlaceholder} />
            <View style={styles.heroGradient} />
            
            {/* Priority badge */}
            <View style={styles.priorityBadge}>
              <View style={styles.priorityDot} />
              <Text style={styles.priorityText} maxFontSizeMultiplier={1}>
                PRIORITY: ALPHA
              </Text>
            </View>
            
            {/* Mission title on image */}
            <Text style={styles.heroTitle} maxFontSizeMultiplier={1}>
              {mission.title}
            </Text>
          </View>

          {/* Mission content section */}
          <View style={styles.heroContent}>
            <View style={styles.heroMeta}>
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
            
            <Text style={styles.heroDescription} maxFontSizeMultiplier={1}>
              "Mastering the {mission.category.toLowerCase()} skills critical for officer selection." — 
              This mission develops your tactical readiness.
            </Text>

            <TouchableOpacity
              style={styles.commenceButton}
              onPress={handleCommence}
              activeOpacity={0.85}
            >
              <Text style={styles.commenceButtonText} maxFontSizeMultiplier={1}>
                COMMENCE MISSION
              </Text>
              <Text style={styles.commenceButtonArrow} maxFontSizeMultiplier={1}>
                →
              </Text>
            </TouchableOpacity>
          </View>
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
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.md,
  },
  headerTitle: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.label,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm + 2,
  },
  profileAvatar: {
    width:           40,
    height:          40,
    borderRadius:    Radius.md,
    backgroundColor: Colors.bgSurface,
    borderWidth:     1,
    borderColor:     Colors.outlineVar + '80',
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  profileAvatarText: {
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingSm,
    color:         Colors.primary,
    letterSpacing: -0.5,
  },
  profileMeta: {
    gap:        Spacing.xs - 2,
    flexShrink: 1,
  },
  profileRank: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  profileXPBar: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.xs + 2,
    flex:          1,
  },
  profileXPTrack: {
    flex:            1,
    height:          4,
    backgroundColor: Colors.bgHighest,
    borderRadius:    Radius.xs,
    overflow:        'hidden',
  },
  profileXPFill: {
    height:          4,
    backgroundColor: Colors.primary,
    borderRadius:    Radius.xs,
  },
  profileXPText: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro - 2,
    color:      Colors.textTertiary,
  },
  
  // ── Streak Card ───────────────────────────────────────────────
  streakCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    marginBottom:    Spacing.xl,
    position:        'relative',
    overflow:        'hidden',
  },
  streakCardActive: {
    backgroundColor: Colors.success + '11',
    borderColor:     Colors.success + '44',
  },
  streakWatermark: {
    position: 'absolute',
    top:      0,
    right:    0,
    padding:  Spacing.md,
    opacity:  0.05,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginBottom:  Spacing.md,
  },
  streakIcon: {
    fontSize: 24,
  },
  streakLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.label,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  streakValue: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.display,
    color:         Colors.primary,
    letterSpacing: -2,
    lineHeight:    48,
    marginBottom:  Spacing.xs,
  },
  streakStatus: {
    fontFamily:    Fonts.body,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // ── Mission Hero Card ─────────────────────────────────────────
  missionHero: {
    backgroundColor: TacticalColors.surfaceCard,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     TacticalColors.borderTactical,
    overflow:        'hidden',
    position:        'relative',
  },
  missionIdTag: {
    position: 'absolute',
    top:      Spacing.md,
    right:    Spacing.md,
    zIndex:   10,
    backgroundColor: 'rgba(16, 20, 21, 0.8)',
    borderRadius:    Radius.xs,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
  },
  missionIdText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.primary,
    letterSpacing: 0.5,
  },
  heroImageSection: {
    height:   192,
    position: 'relative',
  },
  heroImagePlaceholder: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: Colors.bgHighest,
  },
  heroGradient: {
    position: 'absolute',
    bottom:   0,
    left:     0,
    right:    0,
    height:   120,
    backgroundColor: 'transparent',
    borderBottomWidth: 60,
    borderBottomColor: TacticalColors.surfaceCard,
    opacity: 0.95,
  },
  priorityBadge: {
    position:        'absolute',
    bottom:          Spacing.xl + Spacing.lg,
    left:            Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius:    Radius.sm,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical:   Spacing.xs - 2,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.xs - 2,
  },
  priorityDot: {
    width:           4,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.onPrimary,
  },
  priorityText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro - 1,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.wider,
  },
  heroTitle: {
    position:      'absolute',
    bottom:        Spacing.lg,
    left:          Spacing.lg,
    right:         Spacing.lg,
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingLg,
    color:         Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight:    36,
  },
  heroContent: {
    padding: Spacing.lg,
    gap:     Spacing.md,
  },
  heroMeta: {
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
  heroDescription: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    color:      Colors.textSecondary,
    fontStyle:  'italic',
    lineHeight: 24,
  },
  commenceButton: {
    backgroundColor:   Colors.primary,
    paddingVertical:   Spacing.md + 4,
    borderRadius:      Radius.md,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing.sm,
    marginTop:         Spacing.xs,
  },
  commenceButtonText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
  commenceButtonArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.onPrimary,
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
  noMissionBox: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.xl,
    alignItems:      'center',
    gap:             Spacing.md,
  },
  noMissionIcon: {
    fontSize: 48,
    color:    Colors.textTertiary,
  },
  noMissionText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    textAlign:  'center',
    lineHeight: 20,
  },
  
  // ── Completed Mission Card ────────────────────────────────────
  completedCard: {
    backgroundColor: Colors.success + '11',
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.success,
    overflow:        'hidden',
    position:        'relative',
  },
  completedHeader: {
    backgroundColor:   Colors.success + '22',
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.success + '33',
  },
  completedIcon: {
    fontSize: 24,
    color:    Colors.success,
  },
  completedTitle: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.success,
    letterSpacing: LetterSpacing.widest,
  },
  completedContent: {
    padding: Spacing.lg,
    gap:     Spacing.md,
  },
  completedLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  completedSubtitle: {
    fontFamily: Fonts.heading,
    fontSize:   FontSizes.headingSm,
    color:      Colors.textPrimary,
    lineHeight: 28,
  },
  completedDivider: {
    height:          1,
    backgroundColor: Colors.outlineVar,
    marginVertical:  Spacing.xs,
  },
  completedMessage: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  
  // ── Day 1 Training Card ───────────────────────────────────────
  day0Card: {
    backgroundColor: Colors.primary + '11',
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.primary + '44',
    padding:         Spacing.lg,
    marginBottom:    Spacing.xl,
    position:        'relative',
  },
  day0Header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.md,
    marginBottom:   Spacing.md,
  },
  day0Icon: {
    fontSize: 32,
  },
  day0HeaderText: {
    flex: 1,
    gap:  Spacing.xs - 2,
  },
  day0Title: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.widest,
  },
  day0Subtitle: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  day0Button: {
    backgroundColor:   Colors.primary,
    paddingVertical:   Spacing.md,
    borderRadius:      Radius.md,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing.sm,
  },
  day0ButtonText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
  day0ButtonArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.onPrimary,
  },
  
  // ── Session Cards ─────────────────────────────────────────────
  sessionCard: {
    backgroundColor: Colors.confidence + '11',
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.confidence + '44',
    padding:         Spacing.lg,
    marginBottom:    Spacing.lg,
    position:        'relative',
  },
  sessionCard3: {
    backgroundColor: Colors.leadership + '11',
    borderColor:     Colors.leadership + '44',
  },
  sessionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.md,
    marginBottom:   Spacing.md,
  },
  sessionIcon: {
    fontSize: 32,
  },
  sessionHeaderText: {
    flex: 1,
    gap:  Spacing.xs - 2,
  },
  sessionTitle: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.confidence,
    letterSpacing: LetterSpacing.widest,
  },
  sessionSubtitle: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  sessionButton: {
    backgroundColor:   Colors.confidence,
    paddingVertical:   Spacing.md,
    borderRadius:      Radius.md,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing.sm,
  },
  sessionButton3: {
    backgroundColor: Colors.leadership,
  },
  sessionButtonCompleted: {
    backgroundColor: Colors.success + 'CC',
  },
  sessionButtonLocked: {
    backgroundColor: Colors.bgHighest,
  },
  sessionCardLocked: {
    opacity: 0.65,
    borderColor: Colors.outlineVar,
  },
  sessionButtonText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodyMd,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
  sessionButtonArrow: {
    fontFamily: Fonts.monoMedium,
    fontSize:   FontSizes.bodyLg,
    color:      Colors.onPrimary,
  },
});
