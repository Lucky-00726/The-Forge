// ─────────────────────────────────────────────────────────────
// THE FORGE — Profile Screen (Officer Dossier)
// Route: /(tabs)/profile
//
// FIXED BUGS:
//
// 1. Replaced illegal `require()` hook call with a proper
//    top-level import + useAuthStore hook call. Calling hooks
//    via require() inside a component body violates React's
//    Rules of Hooks. On some React Native versions this causes
//    "Invalid hook call" errors; on others it silently returns
//    a stale or undefined value, breaking user_id in feedback.
//
// 2. Removed setLoggingOut(false) after await logout().
//    logout() calls clearAuth() synchronously and then calls
//    router.replace('/(auth)/login'). This component unmounts
//    during the navigation. Calling setState on an unmounted
//    component causes a React warning and, in some versions,
//    a no-op memory leak. The loading state is no longer needed
//    post-navigation because the component is gone.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth }      from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/store/auth.store';
import { supabase }     from '../../src/services/supabase';
import {
  TacticalButton,
  ScreenMeta,
} from '../../src/components/ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  RankColors,
} from '../../src/constants/tokens';

// ── Rank progress helper ──────────────────────────────────────
const RANKS = [
  { name: 'Cadet',     minXP: 0    },
  { name: 'Officer',   minXP: 400  },
  { name: 'Commander', minXP: 1200 },
];

function getRankProgress(totalXP: number) {
  let current = RANKS[0];
  let next: typeof RANKS[number] | null = RANKS[1];

  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= RANKS[i].minXP) {
      current = RANKS[i];
      next    = RANKS[i + 1] ?? null;
      break;
    }
  }

  if (!next) return { current, next: null, pct: 100, xpToNext: 0 };

  const band     = next.minXP - current.minXP;
  const into     = totalXP - current.minXP;
  const pct      = Math.min(Math.round((into / band) * 100), 100);
  const xpToNext = next.minXP - totalXP;

  return { current, next, pct, xpToNext };
}

// ── Stat row ──────────────────────────────────────────────────
function StatRow({
  label,
  value,
  valueColor,
}: {
  label:       string;
  value:       string | number;
  valueColor?: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel} maxFontSizeMultiplier={1}>
        {label}
      </Text>
      <Text
        style={[styles.statValue, valueColor ? { color: valueColor } : {}]}
        maxFontSizeMultiplier={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const { profile, displayName, totalXP, currentRank, currentStreak, logout } =
    useAuth();

  // FIX: useAuthStore called as a proper React hook at the top
  // level of the component — not via require() inside the body.
  // This gives us the user id for the feedback insert without
  // breaking React's Rules of Hooks.
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [feedbackText,    setFeedbackText]  = useState('');
  const [feedbackSent,    setFeedbackSent]  = useState(false);
  const [sendingFeedback, setSending]       = useState(false);
  const [loggingOut,      setLoggingOut]    = useState(false);

  const rankData  = getRankProgress(totalXP);
  const rankColor = RankColors[currentRank] ?? Colors.textTertiary;

  // ── Feedback submit ────────────────────────────────────────
  const handleFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSending(true);

    await supabase.from('feedback').insert({
      user_id: userId,           // FIX: now correctly reads from hook
      message: feedbackText.trim(),
    });

    setSending(false);
    setFeedbackSent(true);
    setFeedbackText('');
  };

  // ── Sign out ───────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Sign Out',
          style:   'destructive',
          onPress: async () => {
            // Show the spinner on the button
            setLoggingOut(true);

            // logout() will:
            //   1. clearAuth() synchronously → session = null
            //   2. supabase.auth.signOut() in background
            //   3. router.replace('/(auth)/login')
            //   4. This component will unmount during step 3
            //
            // FIX: We do NOT call setLoggingOut(false) after
            // await logout(). The component unmounts when
            // router.replace fires, so calling setState on it
            // produces a React warning. The button loading state
            // is irrelevant once navigation begins.
            await logout();

            // If we somehow reach here (navigation failed),
            // reset the spinner so the user can try again.
            setLoggingOut(false);
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <ScreenMeta id="DOSSIER" label="Officer Profile" />
        <Text style={styles.name} maxFontSizeMultiplier={1} numberOfLines={1}>
          {displayName ? displayName.toUpperCase() : '—'}
        </Text>
        <Text style={[styles.rank, { color: rankColor }]} maxFontSizeMultiplier={1}>
          {currentRank.toUpperCase()}
        </Text>
      </View>

      {/* ── Rank progress ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel} maxFontSizeMultiplier={1}>
          RANK PROGRESSION
        </Text>

        <View style={styles.rankBarRow}>
          <Text
            style={[styles.rankBarLabel, { color: rankColor }]}
            maxFontSizeMultiplier={1}
          >
            {rankData.current.name.toUpperCase()}
          </Text>
          {rankData.next && (
            <Text style={styles.rankBarNext} maxFontSizeMultiplier={1}>
              {rankData.next.name.toUpperCase()} →
            </Text>
          )}
        </View>

        <View style={styles.rankBarTrack}>
          <View
            style={[
              styles.rankBarFill,
              { width: `${rankData.pct}%`, backgroundColor: rankColor },
            ]}
          />
        </View>

        <Text style={styles.rankBarXP} maxFontSizeMultiplier={1}>
          {totalXP.toLocaleString()} XP
          {rankData.xpToNext > 0 &&
            ` · ${rankData.xpToNext.toLocaleString()} to ${rankData.next?.name}`}
        </Text>
      </View>

      {/* ── Stats ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel} maxFontSizeMultiplier={1}>
          PERFORMANCE
        </Text>
        <StatRow
          label="TOTAL XP"
          value={totalXP.toLocaleString()}
          valueColor={Colors.primary}
        />
        <View style={styles.rowDivider} />
        <StatRow
          label="CURRENT STREAK"
          value={`${currentStreak} day${currentStreak !== 1 ? 's' : ''}`}
          valueColor={
            currentStreak > 0 ? Colors.textPrimary : Colors.textTertiary
          }
        />
        <View style={styles.rowDivider} />
        <StatRow
          label="RANK"
          value={currentRank}
          valueColor={rankColor}
        />
        <View style={styles.rowDivider} />
        <StatRow
          label="JOINED"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day:   'numeric',
                  month: 'short',
                  year:  'numeric',
                })
              : '—'
          }
        />
      </View>

      {/* ── Feedback ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel} maxFontSizeMultiplier={1}>
          SEND FEEDBACK
        </Text>
        <Text style={styles.feedbackHint} maxFontSizeMultiplier={1}>
          What's working? What isn't? Your input builds the next version.
        </Text>

        {feedbackSent ? (
          <View style={styles.feedbackSentBadge}>
            <Text style={styles.feedbackSentText} maxFontSizeMultiplier={1}>
              ✓ FEEDBACK RECEIVED. THANK YOU, OFFICER.
            </Text>
          </View>
        ) : (
          <>
            <TextInput
              value={feedbackText}
              onChangeText={setFeedbackText}
              placeholder="Type your feedback here…"
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={4}
              style={styles.feedbackInput}
              textAlignVertical="top"
              maxLength={500}
              maxFontSizeMultiplier={1}
            />
            <Text style={styles.feedbackCount} maxFontSizeMultiplier={1}>
              {feedbackText.length}/500
            </Text>
            <TacticalButton
              label="Submit Feedback"
              onPress={handleFeedback}
              loading={sendingFeedback}
              disabled={!feedbackText.trim()}
              variant="ghost"
            />
          </>
        )}
      </View>

      {/* ── Sign out ── */}
      <View style={styles.signOutWrap}>
        <TacticalButton
          label="Sign Out"
          onPress={handleLogout}
          loading={loggingOut}
          variant="danger"
        />
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.bgBase,
  },
  content: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom:     Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  name: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.headingSm,
    color:         Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom:  Spacing.xs,
  },
  rank: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    letterSpacing: LetterSpacing.wider,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    marginBottom:    Spacing.md,
    gap:             Spacing.md,
  },
  cardLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  rankBarRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  rankBarLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    letterSpacing: LetterSpacing.wide,
  },
  rankBarNext: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  rankBarTrack: {
    height:          8,
    backgroundColor: Colors.bgHighest,
    borderRadius:    4,
    overflow:        'hidden',
  },
  rankBarFill: {
    height:       8,
    borderRadius: 4,
  },
  rankBarXP: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
  },
  statRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  statLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  statValue: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textPrimary,
    letterSpacing: 0.3,
  },
  rowDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVar,
  },
  feedbackHint: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 18,
  },
  feedbackInput: {
    backgroundColor: Colors.bgLow,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.md,
    fontFamily:      Fonts.body,
    fontSize:        FontSizes.bodyMd,
    color:           Colors.textPrimary,
    minHeight:       100,
    lineHeight:      22,
  },
  feedbackCount: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
    textAlign:  'right',
    marginTop:  -Spacing.sm,
  },
  feedbackSentBadge: {
    backgroundColor: Colors.successBg,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.success + '44',
    padding:         Spacing.md,
    alignItems:      'center',
  },
  feedbackSentText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.success,
    letterSpacing: LetterSpacing.wide,
  },
  signOutWrap: {
    marginTop: Spacing.lg,
  },
});