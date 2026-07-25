// ─────────────────────────────────────────────────────────────
// THE FORGE — Form Validation
// ─────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import type {
  LoginForm,
  SignupForm,
  ForgotPasswordForm,
  FormErrors,
} from '../types';

export function useFormValidation<T extends object>(
  validator: (values: T) => FormErrors<T>,
) {
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const validate = useCallback(
    (values: T): boolean => {
      const newErrors = validator(values);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validator],
  );

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setErrors({}), []);

  return { errors, validate, clearFieldError, clearAll };
}

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Enter a valid email address.';
  return undefined;
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return undefined;
}

function validateDisplayName(name: string): string | undefined {
  if (!name.trim()) return 'Display name is required.';
  if (name.trim().length < 2) return 'Must be at least 2 characters.';
  if (name.trim().length > 24) return 'Must be 24 characters or fewer.';
  if (!/^[a-zA-Z0-9 ._-]+$/.test(name.trim()))
    return 'Letters, numbers, spaces, . _ - only.';
  return undefined;
}

export function loginValidator(v: LoginForm): FormErrors<LoginForm> {
  const errors: FormErrors<LoginForm> = {};
  const emailErr    = validateEmail(v.email);
  const passwordErr = validatePassword(v.password);
  if (emailErr)    errors.email    = emailErr;
  if (passwordErr) errors.password = passwordErr;
  return errors;
}

export function signupValidator(v: SignupForm): FormErrors<SignupForm> {
  const errors: FormErrors<SignupForm> = {};
  const emailErr    = validateEmail(v.email);
  const passwordErr = validatePassword(v.password);
  const nameErr     = validateDisplayName(v.display_name);
  if (emailErr)    errors.email        = emailErr;
  if (passwordErr) errors.password     = passwordErr;
  if (nameErr)     errors.display_name = nameErr;
  return errors;
}

export function forgotPasswordValidator(
  v: ForgotPasswordForm,
): FormErrors<ForgotPasswordForm> {
  const errors: FormErrors<ForgotPasswordForm> = {};
  const emailErr = validateEmail(v.email);
  if (emailErr) errors.email = emailErr;
  return errors;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).filter((w) => w.length > 0).length;
}

export function countCharacters(text: string): number {
  return text.trim().length;
}
