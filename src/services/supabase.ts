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

console.log('[STARTUP][Supabase] EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL || 'EMPTY — env var not set');
console.log('[STARTUP][Supabase] ANON_KEY project ref:', anonKeyProjectRef(SUPABASE_ANON_KEY));
console.log('[STARTUP][Supabase] Expected project ref: xpfpvfnxvoxjosnvowub');
console.log('[STARTUP][Supabase] URL matches expected:', SUPABASE_URL.includes('xpfpvfnxvoxjosnvowub'));

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[STARTUP][Supabase][CRITICAL] SUPABASE_URL or SUPABASE_ANON_KEY is empty! Supabase createClient will throw an error and crash the app!');
}

if (__DEV__) {
  if (!SUPABASE_URL)      console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_URL is not set');
  if (!SUPABASE_ANON_KEY) console.warn('[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
}

// ── Client ────────────────────────────────────────────────────
console.log('[STARTUP][Supabase] Creating Supabase client...');
let supabaseClient;
try {
  supabaseClient = createClient<Database>(
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
  console.log('[STARTUP][Supabase] Supabase client created successfully!');
} catch (e: any) {
  console.error('[STARTUP][Supabase][FATAL] Supabase createClient crashed:', e.message);
  throw e;
}

export const supabase = supabaseClient;

export default supabase;
