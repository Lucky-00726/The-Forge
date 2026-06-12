// ─────────────────────────────────────────────────────────────
// THE FORGE — Login Screen
// Route: /(auth)/login
// Email + password only. No Google. No OTP.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import {
  useFormValidation,
  loginValidator,
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
  LetterSpacing,
} from '../../src/constants/tokens';
import type { LoginForm } from '../../src/types';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  const [values, setValues] = useState<LoginForm>({
    email:    '',
    password: '',
  });

  const { errors, validate, clearFieldError } = useFormValidation(loginValidator);

  const handleChange =
    (field: keyof LoginForm) => (text: string) => {
      setValues((prev) => ({ ...prev, [field]: text }));
      clearFieldError(field);
      if (error) clearError();
    };

  const handleLogin = async () => {
    if (!validate(values)) return;
    await login(values.email, values.password);
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <ScreenMeta id="AUTH-01" label="Identification" />
          <Text style={styles.wordmark} maxFontSizeMultiplier={1}>
            THE{'\n'}FORGE
          </Text>
          <Text style={styles.tagline} maxFontSizeMultiplier={1}>
            Report for duty. Your training awaits.
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <ErrorBanner message={error} />

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
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            placeholder="••••••••"
          />

          {/* Forgot password */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText} maxFontSizeMultiplier={1}>
              FORGOT PASSWORD?
            </Text>
          </TouchableOpacity>

          <TacticalButton
            label="Commence"
            onPress={handleLogin}
            loading={isLoading}
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText} maxFontSizeMultiplier={1}>
            No account?
          </Text>
          <TextLink
            label="  ENLIST NOW"
            onPress={() => router.push('/(auth)/signup')}
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
    paddingTop:        Spacing.xxl + 16,
    paddingBottom:     Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  wordmark: {
    fontFamily:    Fonts.display,
    fontSize:      FontSizes.display,
    color:         Colors.textPrimary,
    letterSpacing: -1,
    lineHeight:    52,
    marginBottom:  Spacing.sm,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  forgotRow: {
    alignSelf:    'flex-end',
    marginTop:    -Spacing.sm,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wider,
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    marginTop:      'auto',
    paddingTop:     Spacing.lg,
  },
  footerText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.textTertiary,
  },
});