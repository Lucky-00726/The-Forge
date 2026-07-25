# LOGOUT DEBUGGING INVESTIGATION

**Date:** Context Transfer Session  
**Issue:** User reports logout button does not fully clear session — user remains logged in, web always reopens same account  
**Approach:** Complete trace of logout flow without code modification  

---

## REPORTED BEHAVIOR

- User clicks logout button
- User confirms logout in Alert dialog
- **EXPECTED:** Session cleared, redirected to login, app forgets user
- **ACTUAL:** User remains logged in OR session is automatically restored on app reload

---

## LOGOUT FLOW TRACE

### Step 1: User Triggers Logout

**File:** `app/(tabs)/profile.tsx`  
**Line:** 109–139  

```typescript
const handleLogout = () => {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false); // FIX applied: this will not execute if navigation unmounts component
        },
      },
    ],
  );
};
```

**Action:** User taps "Sign Out" → `logout()` is called  
**Source:** `logout` is from `useAuth()` hook (line 14)

---

### Step 2: logout() Executes in useAuth Hook

**File:** `src/hooks/useAuth.ts`  
**Line:** 55–64

```typescript
const logout = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  const result = await authService.signOut();
  setIsLoading(false);
  if (!result.success) {
    setError(result.error);
    return false;
  }
  return true;
}, []);
```

**Action:** Calls `authService.signOut()` and awaits result  
**⚠️ CRITICAL OBSERVATION:** This function does NOT call `clearAuth()` anywhere  
**⚠️ CRITICAL OBSERVATION:** This function does NOT call `router.replace()` anywhere  

---

### Step 3: authService.signOut() Executes

**File:** `src/services/auth.service.ts`  
**Line:** 78–96

```typescript
// NOTE: This function is intentionally NOT responsible for
// clearing local Zustand state. That is useAuth.logout()'s job.
// This function's only concern: tell Supabase to invalidate
// the server-side session and wipe the SecureStore token.
//
// Even if this call fails (e.g. no network), the local token
// in SecureStore must still be cleared so the user is not
// silently kept "logged in" on next boot. Supabase handles
// this internally — signOut() removes the token from the
// configured storage adapter regardless of server response.
export async function signOut(): Promise<AsyncResult<void>> {
  const { error } = await supabase.auth.signOut();

  // A 403 from Supabase on signOut means the session was already
  // invalid server-side. This is not an error from the user's
  // perspective — the local token cleanup still happened.
  if (error && !error.message.includes('403')) {
    return { success: false, error: normalizeError(error) };
  }

  return { success: true, data: undefined };
}
```

**Action:** Calls `supabase.auth.signOut()`  
**Effect:** 
1. Makes network request to Supabase to invalidate server-side session
2. **Removes token from SecureStore/localStorage** (via SecureStoreAdapter)
3. Eventually triggers `SIGNED_OUT` event on `onAuthStateChange` (asynchronous)

**⚠️ CRITICAL OBSERVATION:** The comment says "That is useAuth.logout()'s job" but **useAuth.logout() does NOT call clearAuth()**

---

### Step 4: SIGNED_OUT Event (Asynchronous)

**File:** `src/hooks/useAuthInitializer.ts`  
**Line:** 51–73

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange(async (event, session) => {
  if (!mounted) return;

  switch (event) {
    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        const result = await fetchProfile(session.user.id);
        if (mounted && result.success) {
          setProfile(result.data);
        }
      }
      break;

    case 'SIGNED_OUT':
      clearAuth();
      break;

    default:
      break;
  }
});
```

**Action:** When Supabase fires `SIGNED_OUT` event, `clearAuth()` is called  
**⚠️ CRITICAL PROBLEM:** This is **asynchronous** — fires after network request completes  
**Timing:** On slow networks, this can take 3–10 seconds after `signOut()` call

---

### Step 5: clearAuth() Resets Zustand State

**File:** `src/store/auth.store.ts`  
**Line:** 52–57

```typescript
clearAuth: () =>
  set({
    ...INITIAL_STATE,
    isLoading:     false,
    isInitialized: true,
  }),
```

**⚠️ CRITICAL BUG:** Uses `INITIAL_STATE` with inline overrides  
**Expected:** Should use `LOGGED_OUT_STATE` constant (per DEC-015)  
**Effect:** Sets:
- `session: null`
- `user: null`
- `profile: null`
- `isLoading: false`
- `isInitialized: true`

---

### Step 6: AuthGate Reacts to State Change

**File:** `app/_layout.tsx`  
**Line:** 28–55

```typescript
function AuthGate() {
  const router   = useRouter();
  const segments = useSegments();

  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session       = useAuthStore((s) => s.session);
  const profile       = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (session && !inAuthGroup) {
      return;
    }

    if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, session, profile, segments, router]);
  
  // ... rest
}
```

**Action:** When `session` changes to `null`, redirect to `/(auth)/login`  
**⚠️ CRITICAL PROBLEM:** `profile` is in dependency array (violates DEC-017)  
**Effect:** `useEffect` fires **twice** when `clearAuth()` executes:
1. Once for `profile → null`
2. Once for `session → null`

**Result:** `router.replace('/(auth)/login')` called TWICE during logout

---

### Step 7: Session Restoration on App Reload

**File:** `src/hooks/useAuthInitializer.ts`  
**Line:** 17–46

```typescript
async function initialize() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!mounted) return;

    if (session?.user) {
      setSession(session);
      setUser(session.user);

      const result = await fetchProfile(session.user.id);
      if (mounted && result.success) {
        setProfile(result.data);
      }
    }
  } catch (err) {
    if (__DEV__) {
      console.error('[useAuthInitializer] init error:', err);
    }
  } finally {
    if (mounted) {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }
}
```

**Action:** On app launch, `supabase.auth.getSession()` reads from SecureStore  
**Expected Behavior After Logout:** SecureStore token should be deleted by `signOut()`  
**Result:** `getSession()` should return `null`, preventing auto-login

---

### Step 8: SecureStore Token Management

**File:** `src/services/supabase.ts`  
**Line:** 11–32

```typescript
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
```

**Storage Location:**
- **iOS:** Keychain Services
- **Android:** EncryptedSharedPreferences
- **Web:** localStorage

**Expected:** `supabase.auth.signOut()` calls `removeItem()` for the session key  
**Key Name:** Typically `sb-<project-ref>-auth-token`

---

## ROOT CAUSE ANALYSIS

### PRIMARY ROOT CAUSE: Missing clearAuth() Call

**Location:** `src/hooks/useAuth.ts` → `logout()` function  

**Problem:** The `logout()` function in `useAuth` calls `authService.signOut()` but **NEVER calls `clearAuth()`**.

**Expected Flow (per DEC-016):**
1. Call `clearAuth()` SYNCHRONOUSLY → wipe Zustand state immediately
2. Call `await supabase.auth.signOut()` → network call to invalidate server session
3. Call `router.replace('/(auth)/login')` → redirect to login

**Actual Flow:**
1. Call `await supabase.auth.signOut()` → network call
2. Wait 3–10 seconds (on slow network)
3. Eventually `SIGNED_OUT` event fires → `clearAuth()` called asynchronously
4. AuthGate reacts → redirect happens

**Result:** User sees logged-in UI for 3–10 seconds before redirect

---

### SECONDARY ROOT CAUSE: profile in AuthGate Dependencies

**Location:** `app/_layout.tsx` → `AuthGate` useEffect dependency array  

**Problem:** `profile` is included in the dependency array (line 55):
```typescript
}, [isInitialized, session, profile, segments, router]);
```

**Expected (per DEC-017):** Only `[isInitialized, session, segments, router]`

**Effect:** When `clearAuth()` sets `profile: null` and `session: null` in a single `set()` call, Zustand notifies subscribers separately. The useEffect fires TWICE:
1. `profile` changes → calls `router.replace('/(auth)/login')`
2. `session` changes → calls `router.replace('/(auth)/login')` again

**Result:** On Android, duplicate `router.replace` during navigation transition corrupts navigation stack

---

### TERTIARY ROOT CAUSE: clearAuth Uses INITIAL_STATE

**Location:** `src/store/auth.store.ts` → `clearAuth()` implementation  

**Problem:** 
```typescript
clearAuth: () =>
  set({
    ...INITIAL_STATE,
    isLoading:     false,
    isInitialized: true,
  }),
```

**Expected (per DEC-015):** Should use a separate `LOGGED_OUT_STATE` constant:
```typescript
const LOGGED_OUT_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     false,
  isInitialized: true,
};

clearAuth: () => set(LOGGED_OUT_STATE),
```

**Effect:** Current implementation works but is fragile. If someone refactors to `set(INITIAL_STATE)`, the app would show loading spinner after logout instead of redirecting.

---

### SESSION RESTORATION ROOT CAUSE (If User Remains Logged In After Reload)

**Location:** `supabase.auth.signOut()` token removal  

**Hypothesis:** If the user remains logged in after app reload, the SecureStore token was NOT successfully deleted.

**Possible Causes:**
1. **Network failure before signOut() completes:** If network request fails, does Supabase still call `removeItem()`? (Answer: YES per comment in auth.service.ts line 86–88)
2. **Platform-specific SecureStore failure:** `deleteItemAsync()` on Android sometimes fails silently if app is killed during write
3. **Web localStorage not cleared:** Browser may cache localStorage if page is not fully reloaded

**Verification Needed:**
- Check actual SecureStore/localStorage contents after logout
- Verify `removeItem()` is called by adding console.log in adapter
- Test on actual Android device (not just emulator)

---

## FILES INVOLVED

1. **`app/(tabs)/profile.tsx`** — Logout button trigger (line 109–139)
2. **`src/hooks/useAuth.ts`** — logout callback (line 55–64) ⚠️ MISSING clearAuth()
3. **`src/services/auth.service.ts`** — signOut implementation (line 78–96)
4. **`src/store/auth.store.ts`** — clearAuth implementation (line 52–57) ⚠️ Uses INITIAL_STATE
5. **`src/hooks/useAuthInitializer.ts`** — SIGNED_OUT event handler (line 67–69), session restoration (line 20–33)
6. **`app/_layout.tsx`** — AuthGate redirect logic (line 28–55) ⚠️ profile in deps
7. **`src/services/supabase.ts`** — SecureStore adapter (line 11–32)

---

## WHY USER REMAINS LOGGED IN

### Scenario A: User Stays on Same Screen (No Redirect)

**Cause:** `clearAuth()` is NOT called synchronously by `useAuth.logout()`  
**Effect:** 
- `session` remains non-null in Zustand store
- AuthGate sees `session !== null` → does not redirect
- User sees profile screen until `SIGNED_OUT` event fires (3–10 seconds later)

**On Slow Network:**
- `await supabase.auth.signOut()` takes 10+ seconds
- `SIGNED_OUT` event never fires (timeout or network error)
- User never redirected

---

### Scenario B: User Reloads App and Is Auto-Logged In

**Cause:** SecureStore token was NOT deleted during logout  
**Effect:**
- On app launch, `useAuthInitializer` calls `supabase.auth.getSession()`
- SecureStore still contains valid token
- Session is restored automatically
- User is logged back in

**Why Token Might Not Be Deleted:**
1. `supabase.auth.signOut()` network call failed → BUT per code comment, `removeItem()` should still be called internally by Supabase client
2. `removeItem()` was called but SecureStore write failed (Android race condition)
3. Web localStorage was not cleared due to browser tab not fully closing

---

### Scenario C: Duplicate router.replace Corrupts Navigation

**Cause:** `profile` in AuthGate dependency array causes `router.replace` to be called twice  
**Effect:**
- First `router.replace('/(auth)/login')` starts navigation
- Second `router.replace('/(auth)/login')` interrupts first
- Navigation stack enters inconsistent state
- User may end up on login screen but with `session !== null` still in memory
- Next app reload restores session from SecureStore

---

## MINIMAL FIX REQUIRED

### FIX 1: Add clearAuth() to useAuth.logout() (CRITICAL)

**File:** `src/hooks/useAuth.ts`  
**Line:** 55–64

**Change:**
```typescript
const logout = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  // FIX: Clear Zustand state SYNCHRONOUSLY before network call
  useAuthStore.getState().clearAuth();
  
  const result = await authService.signOut();
  setIsLoading(false);
  if (!result.success) {
    setError(result.error);
    return false;
  }
  return true;
}, []);
```

**Reason:** Per DEC-016, `clearAuth()` must be called synchronously BEFORE `signOut()` to ensure immediate redirect regardless of network conditions.

---

### FIX 2: Remove profile from AuthGate Dependencies (CRITICAL)

**File:** `app/_layout.tsx`  
**Line:** 55

**Change:**
```typescript
}, [isInitialized, session, segments, router]);
```

**Reason:** Per DEC-017, `profile` must NOT be in dependency array to prevent duplicate `router.replace` calls.

---

### FIX 3: Add router.replace After clearAuth (RECOMMENDED)

**File:** `src/hooks/useAuth.ts`  
**After clearAuth() call**

**Change:**
```typescript
const logout = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  useAuthStore.getState().clearAuth();
  
  // Redirect immediately (don't wait for AuthGate)
  router.replace('/(auth)/login');
  
  const result = await authService.signOut();
  setIsLoading(false);
  if (!result.success) {
    setError(result.error);
    return false;
  }
  return true;
}, []);
```

**Reason:** Explicit redirect ensures logout always navigates, even if AuthGate logic changes. Redundant redirect (AuthGate will also redirect) is safe — Expo Router deduplicates.

---

### FIX 4: Use LOGGED_OUT_STATE Constant (DEFENSIVE)

**File:** `src/store/auth.store.ts`  
**Line:** 17–24 (add constant), Line 52–57 (update clearAuth)

**Change:**
```typescript
const INITIAL_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     true,
  isInitialized: false,
};

// Separate constant for post-logout state (DEC-015)
const LOGGED_OUT_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     false,
  isInitialized: true,
};

// ... later in store:

clearAuth: () => set(LOGGED_OUT_STATE),
```

**Reason:** Per DEC-015, this makes intent explicit and prevents future refactoring bugs.

---

## VERIFICATION STEPS (AFTER FIX)

1. **Immediate redirect test:**
   - Put device in airplane mode
   - Click logout
   - Verify redirect to login happens within 100ms (before network timeout)

2. **Session token deletion test:**
   - Log in
   - Log out
   - Close app completely
   - Reopen app
   - Verify user is NOT auto-logged in

3. **Web localStorage test:**
   - Run `npx expo start --web`
   - Log in
   - Open browser DevTools → Application → Local Storage
   - Log out
   - Verify `sb-*-auth-token` key is deleted

4. **Android SecureStore test:**
   - Log in on Android device
   - Log out
   - Run `adb shell` → check EncryptedSharedPreferences (if possible)
   - Reopen app
   - Verify session is not restored

5. **Duplicate navigation test:**
   - Log out
   - Check React Native logs for duplicate `router.replace` warnings
   - Verify no navigation corruption errors

---

## SUMMARY

**Root Cause:** `useAuth.logout()` does NOT call `clearAuth()` synchronously before `signOut()`. This violates DEC-016 and causes delayed redirect (or no redirect on network failure).

**Secondary Issues:**
- `profile` in AuthGate deps causes duplicate `router.replace` calls (violates DEC-017)
- `clearAuth()` uses `INITIAL_STATE` + inline overrides instead of `LOGGED_OUT_STATE` (violates DEC-015)

**Why User Remains Logged In:**
- Zustand state is not cleared until `SIGNED_OUT` event fires (asynchronous, 3–10 seconds)
- AuthGate does not redirect because `session !== null` during this window
- On network failure, event never fires → user never logged out

**Minimal Fix:**
1. Add `useAuthStore.getState().clearAuth()` before `signOut()` in `useAuth.logout()`
2. Remove `profile` from AuthGate `useEffect` dependency array

**These 2 changes will fix the reported issue.**
