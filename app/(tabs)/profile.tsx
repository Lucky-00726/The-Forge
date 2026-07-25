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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
import { computeRankProgress } from '../../src/constants/progression';

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
        <ScreenMeta id="DOSSIER" label="Officer Profile" />
        <Text style={styles.name} maxFontSizeMultiplier={1} numberOfLines={1}>
          {displayName ? displayName.toUpperCase() : 'OFFICER'}
        </Text>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankBadgeText, { color: rankColor }]} maxFontSizeMultiplier={1}>
            {currentRank.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ── Rank Progression Card ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel} maxFontSizeMultiplier={1}>
          RANK PROGRESSION
        </Text>

        <View style={styles.rankStatusRow}>
          <View style={styles.rankCurrent}>
            <Text
              style={[styles.rankCurrentText, { color: rankColor }]}
              maxFontSizeMultiplier={1}
            >
              {rankData.current.name.toUpperCase()}
            </Text>
          </View>
          {rankData.next && (
            <>
              <View style={styles.rankArrow}>
                <Text style={styles.rankArrowText} maxFontSizeMultiplier={1}>→</Text>
              </View>
              <View style={styles.rankNext}>
                <Text style={styles.rankNextText} maxFontSizeMultiplier={1}>
                  {rankData.next.name.toUpperCase()}
                </Text>
              </View>
            </>
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

        <View style={styles.rankProgress}>
          <Text style={styles.rankProgressLabel} maxFontSizeMultiplier={1}>
            {totalXP.toLocaleString()} XP
          </Text>
          {rankData.xpToNext > 0 && (
            <Text style={styles.rankProgressNext} maxFontSizeMultiplier={1}>
              {rankData.xpToNext.toLocaleString()} to next rank
            </Text>
          )}
        </View>
      </View>

      {/* ── Performance Stats ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconBox}>
            <Text style={styles.statEmoji}>⭐</Text>
          </View>
          <Text style={styles.statValue} maxFontSizeMultiplier={1}>
            {totalXP.toLocaleString()}
          </Text>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1}>
            TOTAL XP
          </Text>
        </View>

        <View style={[
          styles.statCard,
          currentStreak > 0 && styles.statCardActive
        ]}>
          <View style={styles.statIconBox}>
            <Text style={styles.statEmoji}>🔥</Text>
          </View>
          <Text style={[
            styles.statValue,
            currentStreak > 0 && { color: Colors.success }
          ]} maxFontSizeMultiplier={1}>
            {currentStreak}
          </Text>
          <Text style={styles.statLabel} maxFontSizeMultiplier={1}>
            DAY STREAK
          </Text>
        </View>
      </View>



      {/* ── Service Record ── */}
      <View style={styles.card}>
        <Text style={styles.cardLabel} maxFontSizeMultiplier={1}>
          SERVICE RECORD
        </Text>
        
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel} maxFontSizeMultiplier={1}>
            RANK
          </Text>
          <Text style={[styles.recordValue, { color: rankColor }]} maxFontSizeMultiplier={1}>
            {currentRank}
          </Text>
        </View>
        
        <View style={styles.recordDivider} />
        
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel} maxFontSizeMultiplier={1}>
            TOTAL EXPERIENCE
          </Text>
          <Text style={styles.recordValue} maxFontSizeMultiplier={1}>
            {totalXP.toLocaleString()} XP
          </Text>
        </View>
        
        <View style={styles.recordDivider} />
        
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel} maxFontSizeMultiplier={1}>
            ACTIVE STREAK
          </Text>
          <Text style={styles.recordValue} maxFontSizeMultiplier={1}>
            {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
        
        <View style={styles.recordDivider} />
        
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel} maxFontSizeMultiplier={1}>
            ENROLLMENT DATE
          </Text>
          <Text style={styles.recordValue} maxFontSizeMultiplier={1}>
            {profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                  day:   'numeric',
                  month: 'short',
                  year:  'numeric',
                })
              : '—'}
          </Text>
        </View>
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
  
  // ── Header ────────────────────────────────────────────────────
  header: {
    marginBottom: Spacing.xl,
  },
  name: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.headingLg,
    color:         Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom:  Spacing.md,
    lineHeight:    36,
  },
  rankBadge: {
    alignSelf:          'flex-start',
    backgroundColor:    Colors.bgSurface,
    borderWidth:        2,
    borderColor:        Colors.outlineVar,
    borderRadius:       Radius.md,
    paddingHorizontal:  Spacing.md,
    paddingVertical:    Spacing.xs + 1,
  },
  rankBadgeText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    letterSpacing: LetterSpacing.widest,
  },
  
  // ── Cards ─────────────────────────────────────────────────────
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
  cardDescription: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  
  // ── Rank Progression ──────────────────────────────────────────
  rankStatusRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
  },
  rankCurrent: {
    backgroundColor:   Colors.bgHighest,
    borderRadius:      Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs + 2,
  },
  rankCurrentText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    letterSpacing: LetterSpacing.wide,
  },
  rankArrow: {
    paddingHorizontal: Spacing.xs,
  },
  rankArrowText: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.bodyMd,
    color:      Colors.textTertiary,
  },
  rankNext: {
    backgroundColor:   Colors.bgLow,
    borderRadius:      Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs + 2,
  },
  rankNextText: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textSecondary,
    letterSpacing: LetterSpacing.wide,
  },
  rankBarTrack: {
    height:          10,
    backgroundColor: Colors.bgHighest,
    borderRadius:    Radius.sm,
    overflow:        'hidden',
  },
  rankBarFill: {
    height:       10,
    borderRadius: Radius.sm,
  },
  rankProgress: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  rankProgressLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textPrimary,
    letterSpacing: 0.5,
  },
  rankProgressNext: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro,
    color:      Colors.textTertiary,
  },
  
  // ── Stats Grid ────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap:           Spacing.md,
    marginBottom:  Spacing.md,
  },
  statCard: {
    flex:            1,
    backgroundColor: Colors.bgSurface,
    borderRadius:    Radius.lg,
    borderWidth:     2,
    borderColor:     Colors.outlineVar,
    padding:         Spacing.lg,
    alignItems:      'center',
    gap:             Spacing.sm,
    minHeight:       140,
  },
  statCardActive: {
    backgroundColor: Colors.success + '11',
    borderColor:     Colors.success + '44',
  },
  statIconBox: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: Colors.bgHighest,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xs,
  },
  statEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontFamily:    Fonts.heading,
    fontSize:      FontSizes.headingMd,
    color:         Colors.textPrimary,
    letterSpacing: 0,
  },
  statLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  
  // ── Service Record ────────────────────────────────────────────
  recordRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  recordLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  recordValue: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.textPrimary,
    letterSpacing: 0.5,
  },
  recordDivider: {
    height:          1,
    backgroundColor: Colors.outlineVar,
    marginVertical:  Spacing.xs - 2,
  },
  
  // ── Feedback Section ──────────────────────────────────────────
  feedbackHint: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
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
  
  // ── Sign Out ──────────────────────────────────────────────────
  signOutWrap: {
    marginTop: Spacing.lg,
  },
});