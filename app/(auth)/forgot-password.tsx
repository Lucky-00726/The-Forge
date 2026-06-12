// ─────────────────────────────────────────────────────────────
// THE FORGE — Forgot Password Screen
// Route: /(auth)/forgot-password
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import {
  useFormValidation,
  forgotPasswordValidator,
} from '../../src/hooks/useFormValidation';
import {
  TacticalInput,
  TacticalButton,
  ErrorBanner,
  ScreenMeta,
  TextLink,
} from '../../src/components/ui';
import {
  Colors,
  Fonts,
  FontSizes,
  Spacing,
  Radius,
} from '../../src/constants/tokens';
import type { ForgotPasswordForm } from '../../src/types';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const [values, setValues] = useState<ForgotPasswordForm>({ email: '' });
  const { errors, validate, clearFieldError } = useFormValidation(
    forgotPasswordValidator,
  );

  const handleSubmit = async () => {
    if (!validate(values)) return;
    await forgotPassword(values.email);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextLink
          label="← BACK"
          onPress={() => router.back()}
          style={styles.backLink}
        />

        <View style={styles.header}>
          <ScreenMeta id="AUTH-03" label="Access Recovery" />
          <Text style={styles.headline} maxFontSizeMultiplier={1}>
            RESET{'\n'}ACCESS
          </Text>
          <Text style={styles.tagline} maxFontSizeMultiplier={1}>
            Enter your registered email. A recovery link will be dispatched.
          </Text>
        </View>

        <View style={styles.form}>
          <ErrorBanner message={error} />

          <TacticalInput
            label="Email"
            value={values.email}
            onChangeText={(text) => {
              setValues({ email: text });
              clearFieldError('email');
              if (error) clearError();
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            placeholder="officer@example.com"
          />

          <TacticalButton
            label="Send Recovery Link"
            onPress={handleSubmit}
            loading={isLoading}
          />
        </View>

        {/* Protocol note */}
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel} maxFontSizeMultiplier={1}>
            — PROTOCOL NOTE —
          </Text>
          <Text style={styles.noteText} maxFontSizeMultiplier={1}>
            The recovery link expires in 1 hour. Check your spam folder if you
            don't see it within 2 minutes.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const forgotStyles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flex: 1 },
  container: {
    flexGrow:          1,
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.xl,
    paddingBottom:     Spacing.xxl,
  },
  backLink:  { marginBottom: Spacing.xl, color: Colors.textTertiary },
  header:    { marginBottom: Spacing.xl },
  headline: {
    fontFamily:   Fonts.display,
    fontSize:     FontSizes.headingLg + 4,
    color:        Colors.textPrimary,
    letterSpacing:-0.5,
    lineHeight:   42,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  form: { marginBottom: Spacing.xl },
  noteBox: {
    borderLeftWidth:  2,
    borderLeftColor:  Colors.outlineVar,
    paddingLeft:      Spacing.md,
    marginTop:        Spacing.xl,
  },
  noteLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: 1,
    marginBottom:  Spacing.xs,
  },
  noteText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
});

// Assign to named const so the styles const doesn't shadow the export below
const styles = forgotStyles;