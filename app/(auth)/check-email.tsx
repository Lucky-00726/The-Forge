// ─────────────────────────────────────────────────────────────
// THE FORGE — Check Email Screen
// Route: /(auth)/check-email
// Shown after forgot-password form submits successfully.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TacticalButton,
  ScreenMeta,
  TextLink,
} from '../../src/components/ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
} from '../../src/constants/tokens';

export default function CheckEmailScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenMeta id="AUTH-04" label="Transmission Sent" />

      <Text style={styles.icon}>✉</Text>

      <Text style={styles.headline} maxFontSizeMultiplier={1}>
        CHECK YOUR{'\n'}EMAIL
      </Text>

      <Text style={styles.body} maxFontSizeMultiplier={1}>
        A password recovery link has been dispatched to your registered email
        address.{'\n\n'}
        Return once you have secured the link.
      </Text>

      <View style={styles.actions}>
        <TacticalButton
          label="Back to Login"
          onPress={() => router.replace('/(auth)/login')}
        />
        <TextLink
          label="RESEND LINK"
          onPress={() => router.back()}
          style={styles.resendLink}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:              1,
    backgroundColor:   Colors.bgBase,
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.xxl + 16,
    paddingBottom:     Spacing.xxl,
  },
  icon: {
    fontSize:     40,
    marginBottom: Spacing.lg,
  },
  headline: {
    fontFamily:   Fonts.display,
    fontSize:     FontSizes.headingLg + 4,
    color:        Colors.textPrimary,
    letterSpacing:-0.5,
    lineHeight:   42,
    marginBottom: Spacing.lg,
  },
  body: {
    fontFamily:   Fonts.body,
    fontSize:     FontSizes.bodyMd,
    color:        Colors.textSecondary,
    lineHeight:   24,
    marginBottom: Spacing.xxl,
  },
  actions: {
    gap: Spacing.md,
  },
  resendLink: {
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});