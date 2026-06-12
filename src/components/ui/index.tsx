// ─────────────────────────────────────────────────────────────
// THE FORGE — Shared UI Components
// Primitive components used across auth and mission screens.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, LetterSpacing } from '../../constants/tokens';

interface TacticalInputProps extends TextInputProps {
  label:          string;
  error?:         string;
  hint?:          string;
  containerStyle?: ViewStyle;
}

export function TacticalInput({
  label,
  error,
  hint,
  containerStyle,
  ...props
}: TacticalInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Text style={styles.inputLabel}>{label.toUpperCase()}</Text>
      <TextInput
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error  && styles.inputError,
          props.style,
        ]}
        placeholderTextColor={Colors.textTertiary}
        selectionColor={Colors.primary}
        cursorColor={Colors.primary}
        maxFontSizeMultiplier={1}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!!hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

interface TacticalButtonProps {
  label:       string;
  onPress:     () => void;
  loading?:    boolean;
  disabled?:   boolean;
  variant?:    'primary' | 'ghost' | 'danger';
  style?:      ViewStyle;
  labelStyle?: TextStyle;
  fullWidth?:  boolean;
}

export function TacticalButton({
  label,
  onPress,
  loading   = false,
  disabled  = false,
  variant   = 'primary',
  style,
  labelStyle,
  fullWidth = true,
}: TacticalButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.button,
    fullWidth && styles.buttonFullWidth,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'ghost'   && styles.buttonGhost,
    variant === 'danger'  && styles.buttonDanger,
    isDisabled            && styles.buttonDisabled,
    style,
  ];

  const textColor = {
    primary: Colors.onPrimary,
    ghost:   Colors.textSecondary,
    danger:  Colors.error,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={buttonStyle}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.onPrimary : Colors.primary}
        />
      ) : (
        <Text
          style={[styles.buttonLabel, { color: textColor }, labelStyle]}
          maxFontSizeMultiplier={1}
        >
          {label.toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText} maxFontSizeMultiplier={1}>
        {message}
      </Text>
    </View>
  );
}

export function ScreenMeta({ id, label }: { id: string; label: string }) {
  return (
    <View style={styles.screenMeta}>
      <Text style={styles.screenMetaId} maxFontSizeMultiplier={1}>{id}</Text>
      <Text style={styles.screenMetaDivider} maxFontSizeMultiplier={1}>{'—'}</Text>
      <Text style={styles.screenMetaLabel} maxFontSizeMultiplier={1}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      {!!label && (
        <Text style={styles.dividerLabel} maxFontSizeMultiplier={1}>{label}</Text>
      )}
      {!!label && <View style={styles.dividerLine} />}
    </View>
  );
}

export function TextLink({
  label,
  onPress,
  style,
}: {
  label:   string;
  onPress: () => void;
  style?:  TextStyle;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.textLink, style]} maxFontSizeMultiplier={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inputContainer: { marginBottom: Spacing.lg },
  inputLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
    marginBottom:  Spacing.xs,
  },
  input: {
    fontFamily:        Fonts.body,
    fontSize:          FontSizes.bodyMd,
    color:             Colors.textPrimary,
    backgroundColor:   Colors.bgLow,
    borderWidth:       1,
    borderColor:       Colors.outlineVar,
    borderRadius:      Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm + 4,
    height:            52,
  },
  inputFocused: { borderColor: Colors.primary },
  inputError:   { borderColor: Colors.error },
  errorText: {
    fontFamily:  Fonts.body,
    fontSize:    FontSizes.micro,
    color:       Colors.error,
    marginTop:   Spacing.xs,
    lineHeight:  16,
  },
  hintText: {
    fontFamily:  Fonts.body,
    fontSize:    FontSizes.micro,
    color:       Colors.textTertiary,
    marginTop:   Spacing.xs,
    lineHeight:  16,
  },
  button: {
    height:            54,
    borderRadius:      Radius.md,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.xl,
  },
  buttonFullWidth: { width: '100%' },
  buttonPrimary:   { backgroundColor: Colors.primary },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     Colors.outlineVar,
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     Colors.error,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonLabel: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    letterSpacing: LetterSpacing.widest,
  },
  errorBanner: {
    backgroundColor: Colors.errorBg,
    borderRadius:    Radius.md,
    borderWidth:     1,
    borderColor:     Colors.error + '55',
    padding:         Spacing.md,
    marginBottom:    Spacing.lg,
  },
  errorBannerText: {
    fontFamily: Fonts.body,
    fontSize:   FontSizes.bodySm,
    color:      Colors.error,
    lineHeight: 20,
  },
  screenMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
    marginBottom:  Spacing.xl,
  },
  screenMetaId: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.micro,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
  screenMetaDivider: {
    fontFamily: Fonts.mono,
    fontSize:   FontSizes.micro,
    color:      Colors.outlineVar,
  },
  screenMetaLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wide,
  },
  divider: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.md,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex:            1,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVar,
  },
  dividerLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      FontSizes.micro,
    color:         Colors.textTertiary,
    letterSpacing: LetterSpacing.wider,
  },
  textLink: {
    fontFamily:    Fonts.monoMedium,
    fontSize:      FontSizes.bodySm,
    color:         Colors.primary,
    letterSpacing: LetterSpacing.wide,
  },
});
