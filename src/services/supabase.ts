// ─────────────────────────────────────────────────────────────
// THE FORGE — Supabase Client
// Singleton. Import from here everywhere.
// Never call createClient() more than once.
//
// Token storage uses expo-secure-store:
//   iOS    → Keychain Services
//   Android→ EncryptedSharedPreferences
//   Web    → localStorage (Expo Go web only)
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '../types/database';

// ── SecureStore adapter ───────────────────────────────────────
const SecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null,
      );
    }
    return SecureStore.getItemAsync(key);
  },

  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },

  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ── Env var validation ────────────────────────────────────────
const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ── Runtime diagnostic: print active config at module load ───
// Extracts only the project ref from the JWT (first 20 chars of payload)
// so we never log the full key.
function anonKeyProjectRef(key: string): string {
  try {
    const payload = key.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.ref ?? decoded.iss ?? '(no ref in payload)';
  } catch {
    return key ? '(present but unparseable)' : 'MISSING';
  }
}

console.log('[DIAG][Supabase] EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL || 'EMPTY — env var not set');
console.log('[DIAG][Supabase] ANON_KEY project ref:', anonKeyProjectRef(SUPABASE_ANON_KEY));
console.log('[DIAG][Supabase] Expected project ref: xpfpvfnxvoxjosnvowub');
console.log('[DIAG][Supabase] URL matches expected:', SUPABASE_URL.includes('xpfpvfnxvoxjosnvowub'));

if (__DEV__) {
  if (!SUPABASE_URL)      console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_URL is not set');
  if (!SUPABASE_ANON_KEY) console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
}

// ── Client ────────────────────────────────────────────────────
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage:            SecureStoreAdapter,
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: false,
    },
  },
);

export default supabase;
