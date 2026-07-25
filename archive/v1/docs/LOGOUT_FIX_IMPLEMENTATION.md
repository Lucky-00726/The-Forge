# LOGOUT FIX IMPLEMENTATION

**Date:** Context Transfer Session  
**Issue:** User remains logged in after logout  
**Root Cause:** `clearAuth()` not called synchronously before `signOut()`  
**Fix Applied:** DEC-016 + DEC-017 + DEC-015 compliance  

---

## FILES MODIFIED

3 files changed:

1. `src/hooks/useAuth.ts`
2. `app/_layout.tsx`
3. `src/store/auth.store.ts`

---

## CHANGE 1: Add clearAuth() Before signOut()

**File:** `src/hooks/useAuth.ts`  
**Lines Changed:** 65–71 (added 3 lines inside `logout()` function)

### BEFORE:
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

### AFTER:
```typescript
const logout = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  
  // DEC-016: Clear Zustand state synchronously BEFORE network call
  // This ensures immediate redirect regardless of network conditions
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

### WHY THIS CHANGE WAS NECESSARY:

**Problem:** `await authService.signOut()` makes a network request that takes 3–10 seconds on Indian mobile networks. During this time, the Zustand store still holds `session !== null`, so AuthGate sees an authenticated user and does NOT redirect.

**Solution:** Call `clearAuth()` synchronously BEFORE the network call:
- Executes in <1ms
- Sets `session → null` immediately
- AuthGate reacts in the same render cycle
- Redirect happens instantly regardless of network conditions

**DEC-016 Compliance:** Per decision log, `clearAuth()` MUST be called synchronously before `signOut()` to ensure immediate logout UX on slow networks.

---

## CHANGE 2: Remove profile from AuthGate Dependencies

**File:** `app/_layout.tsx`  
**Line Changed:** 55 (dependency array)

### BEFORE:
```typescript
}, [isInitialized, session, profile, segments, router]);
```

### AFTER:
```typescript
}, [isInitialized, session, segments, router]);
```

### WHY THIS CHANGE WAS NECESSARY:

**Problem:** When `clearAuth()` calls `set({ session: null, profile: null })`, Zustand notifies each subscriber separately. With `profile` in the dependency array, the `useEffect` fires TWICE:
1. First fire: `profile` changes from `DbUser` to `null`
2. Second fire: `session` changes from `Session` to `null`

**Result:** `router.replace('/(auth)/login')` is called TWICE during logout.

**Android Behavior:** Duplicate `router.replace()` calls during an active navigation transition corrupt the navigation stack.

**Solution:** Remove `profile` from dependency array. The redirect logic only checks `session` — `profile` is not needed.

**DEC-017 Compliance:** Per decision log, AuthGate must NOT include `profile` in its dependency array to prevent duplicate navigation calls.

---

## CHANGE 3: Create LOGGED_OUT_STATE Constant

**File:** `src/store/auth.store.ts`  
**Lines Changed:** 34–42 (added new constant), 66 (simplified clearAuth)

### BEFORE:
```typescript
const INITIAL_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     true,
  isInitialized: false,
};

// ... later in store:

clearAuth: () =>
  set({
    ...INITIAL_STATE,
    isLoading:     false,
    isInitialized: true,
  }),
```

### AFTER:
```typescript
const INITIAL_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     true,
  isInitialized: false,
};

// DEC-015: Separate state for post-logout to prevent loading spinner
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

### WHY THIS CHANGE WAS NECESSARY:

**Problem:** The original `clearAuth()` spread `INITIAL_STATE` and then overrode two fields inline:
```typescript
set({
  ...INITIAL_STATE,    // isLoading: true, isInitialized: false
  isLoading: false,    // override
  isInitialized: true, // override
})
```

**Risk:** If a future refactor simplifies this to `set(INITIAL_STATE)`, the app would show a loading spinner after logout instead of redirecting.

**Solution:** Create a separate named constant `LOGGED_OUT_STATE` with the correct values. The intent is now explicit and the implementation is correct by construction.

**DEC-015 Compliance:** Per decision log, `INITIAL_STATE` (for store creation) and `LOGGED_OUT_STATE` (for post-logout) must be separate constants with explanatory comments.

---

## EXACT LINES CHANGED

### File 1: `src/hooks/useAuth.ts`

**Line 65:** (blank line added for spacing)  
**Line 66–67:** (comment added)
```typescript
// DEC-016: Clear Zustand state synchronously BEFORE network call
// This ensures immediate redirect regardless of network conditions
```
**Line 68:** (new line added)
```typescript
useAuthStore.getState().clearAuth();
```
**Line 69:** (blank line added for spacing)

**Total:** +5 lines

---

### File 2: `app/_layout.tsx`

**Line 55:** Removed `profile` from dependency array

**Before:**
```typescript
}, [isInitialized, session, profile, segments, router]);
```

**After:**
```typescript
}, [isInitialized, session, segments, router]);
```

**Total:** 1 line modified (removed 1 variable from array)

---

### File 3: `src/store/auth.store.ts`

**Lines 34–42:** Added `LOGGED_OUT_STATE` constant
```typescript
// DEC-015: Separate state for post-logout to prevent loading spinner
const LOGGED_OUT_STATE: AuthStoreState = {
  session:       null,
  user:          null,
  profile:       null,
  isLoading:     false,
  isInitialized: true,
};
```

**Line 66:** Simplified `clearAuth()` implementation

**Before:**
```typescript
clearAuth: () =>
  set({
    ...INITIAL_STATE,
    isLoading:     false,
    isInitialized: true,
  }),
```

**After:**
```typescript
clearAuth: () => set(LOGGED_OUT_STATE),
```

**Total:** +9 lines, simplified 1 function

---

## SUMMARY OF CHANGES

| File | Lines Added | Lines Removed | Lines Modified |
|------|-------------|---------------|----------------|
| `src/hooks/useAuth.ts` | 5 | 0 | 0 |
| `app/_layout.tsx` | 0 | 0 | 1 |
| `src/store/auth.store.ts` | 9 | 5 | 1 |
| **TOTAL** | **14** | **5** | **2** |

**Net Change:** +9 lines of code

---

## VERIFICATION CHECKLIST

After this fix, the following behavior should be observed:

### ✅ Immediate Redirect (DEC-016 Fix)
- [ ] User taps "Sign Out"
- [ ] Redirect to login happens within <100ms
- [ ] No delay even on slow network
- [ ] No delay even in airplane mode

### ✅ No Duplicate Navigation (DEC-017 Fix)
- [ ] No React Navigation warnings in logs
- [ ] No navigation stack corruption on Android
- [ ] Single `router.replace()` call per logout

### ✅ Session Not Restored After Logout
- [ ] User logs out
- [ ] App is closed completely
- [ ] App is reopened
- [ ] User is NOT auto-logged in
- [ ] Login screen is shown

### ✅ Network Failure Handling
- [ ] Enable airplane mode
- [ ] Tap "Sign Out"
- [ ] User is logged out locally (redirect happens)
- [ ] No error shown to user
- [ ] Session token cleaned up when network restored

---

## WHAT WAS NOT CHANGED

Per requirements, the following were NOT modified:

- ❌ Mission engine code (no changes in `src/store/mission.store.ts`, `src/services/mission.service.ts`, etc.)
- ❌ Database code (no changes to SQL schema or RPCs)
- ❌ Auth service signOut() implementation (left as-is)
- ❌ Profile screen logout button (no UI changes)
- ❌ AuthInitializer SIGNED_OUT handler (left as-is — redundant but harmless)
- ❌ No additional cleanup or refactoring

**Only the minimal fix for logout was implemented.**

---

## DECISION LOG COMPLIANCE

This implementation satisfies:

- ✅ **DEC-016:** `clearAuth()` called synchronously BEFORE `signOut()` in `useAuth.logout()`
- ✅ **DEC-017:** `profile` removed from AuthGate `useEffect` dependency array
- ✅ **DEC-015:** `LOGGED_OUT_STATE` constant created, `clearAuth()` uses named constant

All three decision log requirements are now enforced in the codebase.

---

## EXPECTED USER EXPERIENCE AFTER FIX

### Before Fix:
1. User taps "Sign Out"
2. Button shows loading spinner
3. User waits 3–10 seconds staring at profile screen
4. Eventually redirected to login
5. **Feels broken**

### After Fix:
1. User taps "Sign Out"
2. Button shows loading spinner
3. **Immediately** redirected to login (<100ms)
4. Token cleanup happens in background
5. **Feels instant and correct**

---

## IMPLEMENTATION COMPLETE

The minimal logout fix has been applied. No mission engine, database, or unrelated code was modified.

**Status:** ✅ READY FOR TESTING
