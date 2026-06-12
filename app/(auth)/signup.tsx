// ─────────────────────────────────────────────────────────────
// THE FORGE — Signup Screen
// Route: /(auth)/signup
// Email + password + display name combined.
// No separate username screen — MVP simplification.
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
  signupValidator,
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
} from '../../src/constants/tokens';
import type { SignupForm } from '../../src/types';

export default function SignupScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [values, setValues] = useState<SignupForm>({
    email:        '',
    password:     '',
    display_name: '',
  });

  const { errors, validate, clearFieldError } = useFormValidation(signupValidator);

  const handleChange =
    (field: keyof SignupForm) => (text: string) => {
      setValues((prev) => ({ ...prev, [field]: text }));
      clearFieldError(field);
      if (error) clearError();
    };

  const handleRegister = async () => {
    if (!validate(values)) return;
    const success = await register(values);
    if (success) {
      // AuthGate will redirect to /(tabs) once session is set
    }
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
        {/* ── Back ── */}
        <TextLink
          label="← BACK"
          onPress={() => router.back()}
          style={styles.backLink}
        />

        {/* ── Header ── */}
        <View style={styles.header}>
          <ScreenMeta id="AUTH-02" label="Enlistment" />
          <Text style={styles.headline} maxFontSizeMultiplier={1}>
            ENLIST
          </Text>
          <Text style={styles.tagline} maxFontSizeMultiplier={1}>
            Create your officer profile.{'\n'}Training begins immediately.
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <ErrorBanner message={error} />

          <TacticalInput
            label="Display Name"
            value={values.display_name}
            onChangeText={handleChange('display_name')}
            error={errors.display_name}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="name"
            returnKeyType="next"
            placeholder="e.g. Arjun Sharma"
            hint="This is how you appear in the app. 2–24 characters."
          />

          <TacticalInput
            label="Email"
            value={values.email}
            onChangeText={handleChange('email')}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            placeholder="officer@example.com"
          />

          <TacticalInput
            label="Password"
            value={values.password}
            onChangeText={handleChange('password')}
            error={errors.password}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            placeholder="Min 6 characters"
          />

          <TacticalButton
            label="Enlist"
            onPress={handleRegister}
            loading={isLoading}
          />
        </View>

        {/* ── Footer ── */}
        <Text style={styles.terms} maxFontSizeMultiplier={1}>
          By enlisting you agree to our Terms of Service.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText} maxFontSizeMultiplier={1}>
            Already enlisted?
          </Text>
          <TextLink
            label="  LOG IN"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flex: 1 },
  container: {
    flexGrow:          1,
    paddingHorizontal: Spacing.gutter,
    paddingTop:        Spacing.xl,
    paddingBottom:     Spacing.xxl,
  },
  backLink: {
    marginBottom: Spacing.xl,
    color:        Colors.textTertiary,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headline: {
    fontFamily:   Fonts.display,
    fontSize:     FontSizes.headingLg + 6,
    color:        Colors.textPrimary,
    letterSpacing:-0.5,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  terms: {
    fontFamily:  Fonts.body,
    fontSize:    FontSizes.micro,
    color:       Colors.textTertiary,
    textAlign:   'center',
    lineHeight:  16,
    marginBottom: Spacing.xl,
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    marginTop:      'auto',
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textTertiary,
  },
});