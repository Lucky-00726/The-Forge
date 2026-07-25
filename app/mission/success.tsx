// ─────────────────────────────────────────────────────────────
// THE FORGE — Mission Success Screen (Stitch Design)
// Route: /mission/success
// Shows XP awarded, streak, rank promotion with tactical radar visual
// No back gesture — mission is done.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TacticalButton,
  ScreenMeta,
  CornerMarkers,
  RadarPulse,
  ActivityChart,
  TechnicalSpecsPanel,
  SegmentedProgressBar,
} from '../../src/components/ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  RankColors,
  TacticalColors,
} from '../../src/constants/tokens';
import { computeRankProgress } from '../../src/constants/progression';

export default function MissionSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    xp_awarded:   string;
    new_total_xp: string;
    new_streak:   string;
    new_rank:     string;
    mission_title?: string;
  }>();

  const xpAwarded   = parseInt(params.xp_awarded, 10) || 0;
  const newTotalXP  = parseInt(params.new_total_xp, 10) || 0;
  const newStreak   = parseInt(params.new_streak, 10) || 0;
  const newRank     = params.new_rank || 'Cadet';
  const missionTitle = params.mission_title || 'Mission';

  const rankColor = RankColors[newRank] ?? Colors.textTertiary;

  // Use progression.ts for rank progress — single source of truth
  const { next: nextRankObj, pct: rankProgress } = computeRankProgress(newTotalXP);
  const nextRank = nextRankObj?.name ?? null;
  const nextThreshold = nextRankObj?.minXP ?? newTotalXP;

  // Rank promotion: total XP just crossed a threshold within the last 50 XP
  const showRankPromotion = nextRankObj === null
    ? false
    : newTotalXP >= nextThreshold - 800 && newTotalXP < nextThreshold;

  const handleReturn = () => {
    router.replace('/(tabs)');
  };

  // Responsive layout: use grid on tablet/desktop, single column on mobile
  const useGridLayout = width >= 768;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Metadata */}
      <View style={styles.topMeta}>
        <ScreenMeta id="MISSION-COMPLETE" label="Operational Update" />
      </View>

      {/* Main Headline */}
      <Text
        style={styles.headline}
        maxFontSizeMultiplier={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        numberOfLines={2}
      >
        MISSION{'\n'}ACCOMPLISHED
      </Text>

      {/* Mission Title Badge */}
      <View style={styles.missionBadge}>
        <Text style={styles.missionLabel} maxFontSizeMultiplier={1}>
          OBJECTIVE COMPLETED
        </Text>
        <Text style={styles.missionTitle} maxFontSizeMultiplier={1} numberOfLines={3}>
          {missionTitle}
        </Text>
      </View>

      {/* Main Content: Hero Block + Side Panel */}
      <View style={[styles.mainContent, useGridLayout && styles.mainContentGrid]}>
        
        {/* LEFT: Hero Visual Block (Radar) */}
        <View style={[styles.heroBlock, useGridLayout && styles.heroBlockGrid]}>
          <CornerMarkers position="all" color={Colors.primary} />
          
          <RadarPulse size={200} pulseColor={Colors.primary}>
            <View style={styles.radarCenter}>
              <Text style={styles.radarSymbol} maxFontSizeMultiplier={1}>
                ★
              </Text>
              <Text style={styles.radarTitle} maxFontSizeMultiplier={1}>
                {newRank.toUpperCase()}
              </Text>
              <Text style={styles.radarSubtitle} maxFontSizeMultiplier={1}>
                RANK STATUS: {showRankPromotion ? 'ASCENDING' : 'ACTIVE'}
              </Text>
            </View>
          </RadarPulse>
        </View>

        {/* RIGHT: Stats Panel */}
        <View style={[styles.sidePanel, useGridLayout && styles.sidePanelGrid]}>
          
          {/* XP Block */}
          <View style={styles.xpBlock}>
            <Text style={styles.xpLabel} maxFontSizeMultiplier={1}>
              EXPERIENCE EARNED
            </Text>
            <View style={styles.xpValueContainer}>
              <Text style={styles.xpPlus} maxFontSizeMultiplier={1}>+</Text>
              <Text style={styles.xpValue} maxFontSizeMultiplier={1}>
                {xpAwarded}
              </Text>
              <Text style={styles.xpUnit} maxFontSizeMultiplier={1}>XP</Text>
            </View>
            
            {nextRank && (
              <>
                <Text style={styles.nextRankLabel} maxFontSizeMultiplier={1}>
                  NEXT: {nextRank.toUpperCase()}
                </Text>
                <SegmentedProgressBar
                  segments={8}
                  progress={rankProgress}
                  activeColor={rankColor}
                />
                <View style={styles.progressMeta}>
                  <Text style={styles.progressText} maxFontSizeMultiplier={1}>
                    {newTotalXP.toLocaleString()} / {nextThreshold.toLocaleString()} XP
                  </Text>
                  <Text style={styles.progressPercent} maxFontSizeMultiplier={1}>
                    {Math.round(rankProgress)}%
                  </Text>
                </View>
              </>
            )}
            
            {!nextRank && (
              <View style={styles.maxRankBadge}>
                <Text style={styles.maxRankText} maxFontSizeMultiplier={1}>
                  MAXIMUM RANK ACHIEVED
                </Text>
              </View>
            )}
          </View>

          {/* Streak Block */}
          <View style={[
            styles.streakBlock,
            newStreak > 0 && styles.streakBlockActive
          ]}>
            <View style={styles.streakHeader}>
              <View style={styles.streakIconBox}>
                <Text style={styles.streakIconText}>↑</Text>
              </View>
              <View style={styles.streakMeta}>
                <Text style={styles.streakLabel} maxFontSizeMultiplier={1}>
                  ACTIVE STREAK
                </Text>
                <Text style={[
                  styles.streakValue,
                  newStreak > 0 && { color: Colors.success }
                ]} maxFontSizeMultiplier={1}>
                  {newStreak < 10 ? `0${newStreak}` : newStreak} {newStreak === 1 ? 'DAY' : 'DAYS'}
                </Text>
              </View>
            </View>

            <ActivityChart currentStreak={newStreak} />
          </View>

          {/* Technical Specs Panel */}
          <TechnicalSpecsPanel
            specs={[
              { label: 'DEPLOYMENT', value: 'ACTIVE' },
              { label: 'DATA SYNC', value: 'COMPLETE' },
              { label: 'LOADOUT', value: 'OPTIMAL' },
            ]}
          />
        </View>
      </View>

      {/* Rank Promotion Announcement */}
      {showRankPromotion && (
        <View style={styles.promotionAnnouncement}>
          <CornerMarkers position="all" color={rankColor} size={10} />
          <View style={styles.promotionHeader}>
            <Text style={styles.promotionHeaderText} maxFontSizeMultiplier={1}>
              RANK ADVANCEMENT
            </Text>
          </View>
          <Text style={styles.promotionText} maxFontSizeMultiplier={1}>
            You have been promoted to <Text style={[styles.promotionRank, { color: rankColor }]}>{newRank}</Text>. 
            Your consistent effort demonstrates officer-like discipline and commitment.
          </Text>
        </View>
      )}

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <TacticalButton
          label="Continue Training"
          onPress={handleReturn}
        />
        <Text style={styles.footerNote} maxFontSizeMultiplier={1}>
          Progress saved · Next mission available tomorrow at 0600 hours
        </Text>
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
  },
  
  // ── Top Section ───────────────────────────────────────────────
  topMeta: {
    marginBottom: Spacing.md,
  },
  headline: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.display,
    color:         Colors.textPrimary,
    textAlign:     'center',
    lineHeight:    50,
    letterSpacing: -2,
    marginBottom:  Spacing.xl,
  },
  missionBadge: {
    backgroundColor:   TacticalColors.surfaceCard,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.outlineVar,
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems:        'center',
    gap:               Spacing.xs,
    marginBottom:      Spacing.xl,
  },
  missionLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.widest,
  },
  missionTitle: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodyMd,
    color:      Colors.textPrimary,
    textAlign:  'center',
    lineHeight: 22,
  },
  
  // ── Main Content Grid ─────────────────────────────────────────
  mainContent: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  mainContentGrid: {
    flexDirection: 'row',
    alignItems:    'flex-start',
  },
  
  // ── Hero Block (Radar) ────────────────────────────────────────
  heroBlock: {
    position:        'relative',
    backgroundColor: TacticalColors.surfaceCard,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     TacticalColors.borderTactical,
    padding:         Spacing.xl,
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       280,
  },
  heroBlockGrid: {
    flex: 1.5,
  },
  radarCenter: {
    alignItems: 'center',
    gap:        Spacing.xs,
  },
  radarSymbol: {
    fontFamily:    Fonts.display,
    fontSize:      56,
    color:         Colors.primary,
    marginBottom:  Spacing.xs,
    lineHeight:    64,
  },
  radarTitle: {
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingMd,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  radarSubtitle: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.widest,
    textAlign:     'center',
  },
  
  // ── Side Panel (Stats) ────────────────────────────────────────
  sidePanel: {
    gap: Spacing.md,
  },
  sidePanelGrid: {
    flex: 1,
  },
  
  // ── XP Block ──────────────────────────────────────────────────
  xpBlock: {
    backgroundColor: Colors.primary + '11',
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.primary,
    padding:         Spacing.lg,
    gap:             Spacing.md,
  },
  xpLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.widest,
    textAlign:     'center',
  },
  xpValueContainer: {
    flexDirection:  'row',
    alignItems:     'baseline',
    justifyContent: 'center',
    gap:            Spacing.xs,
  },
  xpPlus: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.headingLg,
    color:         Colors.primary,
    letterSpacing: -1,
  },
  xpValue: {
    fontFamily:    Fonts.display,
    fontSize:      56,
    color:         Colors.primary,
    letterSpacing: -2,
    lineHeight:    56,
  },
  xpUnit: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.headingMd,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  nextRankLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
    textAlign:     'center',
  },
  progressMeta: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  progressText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textSecondary,
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  maxRankBadge: {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  maxRankText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.onPrimary,
    letterSpacing: LetterSpacing.widest,
  },
  
  // ── Streak Block ──────────────────────────────────────────────
  streakBlock: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    gap:             Spacing.md,
  },
  streakBlockActive: {
    backgroundColor: Colors.success + '11',
    borderColor:     Colors.success + '44',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
  },
  streakIconBox: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: Colors.bgHighest,
    alignItems:      'center',
    justifyContent:  'center',
  },
  streakIconText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.headingMd,
    color:         Colors.success,
    letterSpacing: 0,
  },
  streakMeta: {
    flex: 1,
    gap:  Spacing.xs - 2,
  },
  streakLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  streakValue: {
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingMd,
    color:         Colors.textPrimary,
    letterSpacing: 0,
  },
  
  // ── Promotion Announcement ────────────────────────────────────
  promotionAnnouncement: {
    position:        'relative',
    backgroundColor: Colors.primary + '11',
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.primary + '44',
    overflow:        'hidden',
    marginBottom:    Spacing.xl,
  },
  promotionHeader: {
    backgroundColor:   Colors.primary + '22',
    paddingVertical:   Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary + '33',
  },
  promotionHeaderText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.widest,
    textAlign:     'center',
  },
  promotionText: {
    fontFamily:        Fonts.body,
    fontSize:          FontSizes.bodyMd,
    color:             Colors.textPrimary,
    textAlign:         'center',
    lineHeight:        24,
    paddingVertical:   Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  promotionRank: {
    fontFamily:    Fonts.monoMedium,
    letterSpacing: LetterSpacing.wide,
  },
  
  // ── CTA Section ───────────────────────────────────────────────
  ctaSection: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  footerNote: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    textAlign:     'center',
    lineHeight:    16,
    letterSpacing: 0.5,
  },
});
