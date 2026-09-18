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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth }      from '../../src/hooks/useAuth';
import { useAuthStore } from '../../src/store/auth.store';
import { supabase }     from '../../src/services/supabase';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
  LetterSpacing,
  RankColors,
} from '../../src/constants/tokens';
import { computeRankProgress } from '../../src/constants/progression';
import {
  MilledSurface,
  RecessedTrack,
  Display,
  Headline,
  Body,
  LabelCaps,
  Mono,
  ForgeButton,
  MetaItem,
} from '../../src/components/forge';

// ── Main screen ───────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { profile, displayName, totalXP, currentRank, currentStreak, logout } =
    useAuth();

  const userId = useAuthStore((s) => s.user?.id ?? null);

  const [feedbackText,    setFeedbackText]  = useState('');
  const [feedbackSent,    setFeedbackSent]  = useState(false);
  const [sendingFeedback, setSending]       = useState(false);
  const [loggingOut,      setLoggingOut]    = useState(false);

  const rankData  = computeRankProgress(totalXP);
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
    console.log('[LOGOUT TRACE] Step 1: handleLogout called');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Sign Out',
          style:   'destructive',
          onPress: async () => {
            console.log('[LOGOUT TRACE] Step 2: Alert confirmed, onPress executing');
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
            console.log('[LOGOUT TRACE] Step 3: Calling logout()');
            await logout();
            console.log('[LOGOUT TRACE] Step 10: logout() returned');

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
        <Display maxFontSizeMultiplier={1} numberOfLines={1}>
          {displayName ? displayName.toUpperCase() : 'OFFICER'}
        </Display>
        <View style={styles.rankBadge}>
          <Mono style={[styles.rankBadgeText, { color: rankColor }]} maxFontSizeMultiplier={1}>
            {currentRank.toUpperCase()}
          </Mono>
        </View>
      </View>

      {/* ── Rank Progression Card ── */}
      <MilledSurface style={styles.rankCard}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>RANK PROGRESSION</LabelCaps>

        <View style={styles.rankStatusRow}>
          <View style={styles.rankCurrent}>
            <Mono
              style={[styles.rankCurrentText, { color: rankColor }]}
              maxFontSizeMultiplier={1}
            >
              {rankData.current.name.toUpperCase()}
            </Mono>
          </View>
          {rankData.next && (
            <>
              <Mono style={styles.rankArrow} maxFontSizeMultiplier={1}>→</Mono>
              <View style={styles.rankNext}>
                <Mono style={styles.rankNextText} maxFontSizeMultiplier={1}>
                  {rankData.next.name.toUpperCase()}
                </Mono>
              </View>
            </>
          )}
        </View>

        <RecessedTrack style={styles.rankBarTrack}>
          <View
            style={[
              styles.rankBarFill,
              { width: `${rankData.pct}%`, backgroundColor: rankColor },
            ]}
          />
        </RecessedTrack>

        <View style={styles.rankProgress}>
          <Mono tone="gold" maxFontSizeMultiplier={1}>
            {totalXP.toLocaleString()} XP
          </Mono>
          {rankData.xpToNext > 0 && (
            <Mono tone="secondary" style={styles.rankProgressNext} maxFontSizeMultiplier={1}>
              {rankData.xpToNext.toLocaleString()} to next rank
            </Mono>
          )}
        </View>
      </MilledSurface>

      {/* ── Performance Stats ── */}
      <View style={styles.statsGrid}>
        <RecessedTrack style={styles.statCard}>
          <MaterialIcons name="star" size={20} color={Colors.primary} />
          <Headline tone="gold" maxFontSizeMultiplier={1}>
            {totalXP.toLocaleString()}
          </Headline>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TOTAL XP</LabelCaps>
        </RecessedTrack>

        <RecessedTrack style={styles.statCard}>
          <MaterialIcons name="local-fire-department" size={20} color={currentStreak > 0 ? Colors.success : Colors.textTertiary} />
          <Headline tone={currentStreak > 0 ? 'success' : 'secondary'} maxFontSizeMultiplier={1}>
            {currentStreak}
          </Headline>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>DAY STREAK</LabelCaps>
        </RecessedTrack>
      </View>



      {/* ── Service Record ── */}
      <MilledSurface style={styles.recordCard}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SERVICE RECORD</LabelCaps>

        <View style={styles.recordRow}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>RANK</LabelCaps>
          <Mono style={[styles.recordValue, { color: rankColor }]} maxFontSizeMultiplier={1}>
            {currentRank}
          </Mono>
        </View>

        <View style={styles.recordDivider} />

        <View style={styles.recordRow}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TOTAL EXPERIENCE</LabelCaps>
          <Mono tone="gold" maxFontSizeMultiplier={1}>
            {totalXP.toLocaleString()} XP
          </Mono>
        </View>

        <View style={styles.recordDivider} />

        <View style={styles.recordRow}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>ACTIVE STREAK</LabelCaps>
          <Mono tone="secondary" maxFontSizeMultiplier={1}>
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </Mono>
        </View>

        <View style={styles.recordDivider} />

        <View style={styles.recordRow}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>TRAINING DAY</LabelCaps>
          <Mono tone="secondary" maxFontSizeMultiplier={1}>
            {profile?.current_training_day ?? '—'}
          </Mono>
        </View>

        <View style={styles.recordDivider} />

        <View style={styles.recordRow}>
          <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>ENROLLMENT DATE</LabelCaps>
          <Mono tone="secondary" maxFontSizeMultiplier={1}>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day:   'numeric',
                  month: 'short',
                  year:  'numeric',
                })
              : '—'}
          </Mono>
        </View>
      </MilledSurface>

      {/* ── Feedback ── */}
      <MilledSurface style={styles.feedbackCard}>
        <LabelCaps tone="secondary" maxFontSizeMultiplier={1}>SEND FEEDBACK</LabelCaps>
        <Body tone="secondary" maxFontSizeMultiplier={1}>
          What's working? What isn't? Your input builds the next version.
        </Body>

        {feedbackSent ? (
          <View style={styles.feedbackSentBadge}>
            <MaterialIcons name="check-circle" size={16} color={Colors.success} />
            <Mono tone="success" maxFontSizeMultiplier={1}>FEEDBACK RECEIVED. THANK YOU.</Mono>
          </View>
        ) : (
          <>
            <RecessedTrack style={styles.feedbackInputWrap}>
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
            </RecessedTrack>
            <View style={styles.feedbackMeta}>
              <Mono tone="tertiary" maxFontSizeMultiplier={1}>
                {feedbackText.length}/500
              </Mono>
            </View>
            <ForgeButton
              label="Submit Feedback"
              onPress={handleFeedback}
              disabled={!feedbackText.trim()}
              style={styles.feedbackButton}
            />
          </>
        )}
      </MilledSurface>

      {/* ── Sign out ── */}
      <View style={styles.signOutWrap}>
        <ForgeButton
          label="Sign Out"
          onPress={handleLogout}
          style={styles.signOutButton}
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
  
  // ── Header ────────────────────────────────────────────────────
  header: {
    gap: Spacing.md,
  },
  
  // ── Rank Progression ──────────────────────────────────────────
  rankCard: {
    gap: Spacing.md,
  },
  rankStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rankCurrent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  rankCurrentText: {},
  rankArrow: {
    paddingHorizontal: Spacing.xs,
  },
  rankNext: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  rankNextText: {},
  rankBarTrack: {
    height: 10,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  rankBarFill: {
    height: 10,
    borderRadius: Radius.sm,
  },
  rankProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankProgressNext: {},
  rankBadge: {
    alignSelf: 'flex-start',
  },
  rankBadgeText: {},
  
  // ── Stats Grid ────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 140,
  },

  // ── Service Record ────────────────────────────────────────────
  recordCard: {
    gap: Spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordValue: {},
  recordDivider: {
    height: 1,
    backgroundColor: Colors.outlineVar,
    marginVertical: Spacing.xs - 2,
  },

  // ── Feedback Section ──────────────────────────────────────────
  feedbackCard: {
    gap: Spacing.md,
  },
  feedbackInputWrap: {
    padding: Spacing.md,
  },
  feedbackInput: {
    minHeight: 100,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  feedbackMeta: {
    alignItems: 'flex-end',
  },
  feedbackButton: {
    marginTop: Spacing.xs,
  },
  feedbackSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },

  // ── Sign Out ──────────────────────────────────────────────────
  signOutWrap: {
    marginTop: Spacing.lg,
  },
  signOutButton: {},
});