# LOGOUT TRACE TESTING GUIDE

**Date:** Context Transfer Session  
**Purpose:** Trace exact execution flow from Sign Out button press through all logout steps  
**Status:** Console logs added, ready for testing  

---

## CONSOLE LOGS ADDED

Temporary trace logs have been added to 5 files:

1. **`app/(tabs)/profile.tsx`** — Button press handler (Steps 1–3, 10)
2. **`src/hooks/useAuth.ts`** — logout() function (Steps 4–9)
3. **`src/store/auth.store.ts`** — clearAuth() function
4. **`src/services/auth.service.ts`** — signOut() function
5. **`src/hooks/useAuthInitializer.ts`** — onAuthStateChange listener
6. **`app/_layout.tsx`** — AuthGate redirect logic

---

## EXPECTED EXECUTION FLOW

If everything works correctly, the console logs should appear in this order:

```
[LOGOUT TRACE] Step 1: handleLogout called
[LOGOUT TRACE] Step 2: Alert confirmed, onPress executing
[LOGOUT TRACE] Step 3: Calling logout()
[LOGOUT TRACE] Step 4: logout() executing
[LOGOUT TRACE] Step 5: Calling clearAuth()
[LOGOUT TRACE] clearAuth: Setting LOGGED_OUT_STATE
[LOGOUT TRACE] clearAuth: State updated to: {session: null, user: null, profile: null, isLoading: false, isInitialized: true}
[LOGOUT TRACE] AuthGate: useEffect triggered. isInitialized: true session: NULL
[LOGOUT TRACE] AuthGate: inAuthGroup: false segments: ["(tabs)", "profile"]
[LOGOUT TRACE] AuthGate: No session and not in auth group, calling router.replace("/(auth)/login")
[LOGOUT TRACE] AuthGate: router.replace("/(auth)/login") called
[LOGOUT TRACE] Step 6: clearAuth() completed
[LOGOUT TRACE] Step 7: Calling authService.signOut()
[LOGOUT TRACE] authService.signOut: Calling supabase.auth.signOut()
[LOGOUT TRACE] authService.signOut: supabase.auth.signOut() completed, error: null
[LOGOUT TRACE] authService.signOut: Returning success
[LOGOUT TRACE] Step 8: authService.signOut() returned: {success: true, data: undefined}
[LOGOUT TRACE] Step 9: logout() about to return true
[LOGOUT TRACE] Step 10: logout() returned
[LOGOUT TRACE] useAuthInitializer: onAuthStateChange event: SIGNED_OUT
[LOGOUT TRACE] useAuthInitializer: SIGNED_OUT event received, calling clearAuth()
[LOGOUT TRACE] clearAuth: Setting LOGGED_OUT_STATE
[LOGOUT TRACE] clearAuth: State updated to: {session: null, user: null, profile: null, isLoading: false, isInitialized: true}
```

---

## TESTING STEPS

### Step 1: Start the App with Console Visible

**For Web (Easiest):**
```bash
npx expo start --web
```
- Open browser DevTools (F12)
- Go to Console tab
- Click "Sign Out" button

**For iOS/Android:**
```bash
npx expo start
```
- Open React Native Debugger OR
- Run `adb logcat` (Android) / Console.app (iOS)
- Click "Sign Out" button

---

### Step 2: Click Sign Out and Record Logs

1. Navigate to Profile screen
2. Click "Sign Out" button
3. Confirm in Alert dialog
4. Copy ALL console output starting from `[LOGOUT TRACE]`
5. Paste into a text file

---

### Step 3: Analyze the Trace

Compare actual logs against expected flow above.

**For each step, mark:**
- ✅ **PASS** — Log appeared in correct order
- ❌ **FAIL** — Log did NOT appear OR appeared out of order
- ⚠️ **UNEXPECTED** — Log appeared multiple times or with error

---

## EXECUTION CHECKLIST

Use this checklist to verify each step:

| # | Step | Expected Log | PASS/FAIL | Notes |
|---|------|--------------|-----------|-------|
| 1 | Button onPress | `Step 1: handleLogout called` | | |
| 2 | Alert confirmed | `Step 2: Alert confirmed` | | |
| 3 | logout() called | `Step 3: Calling logout()` | | |
| 4 | logout() executing | `Step 4: logout() executing` | | |
| 5 | clearAuth() called | `Step 5: Calling clearAuth()` | | |
| 5a | clearAuth() setting state | `clearAuth: Setting LOGGED_OUT_STATE` | | |
| 5b | clearAuth() state updated | `clearAuth: State updated to:` | | |
| 5c | AuthGate useEffect fires | `AuthGate: useEffect triggered` | | |
| 5d | AuthGate checks session | `session: NULL` | | |
| 5e | AuthGate calls replace | `calling router.replace("/(auth)/login")` | | |
| 5f | router.replace executed | `router.replace("/(auth)/login") called` | | |
| 6 | clearAuth() completed | `Step 6: clearAuth() completed` | | |
| 7 | authService called | `Step 7: Calling authService.signOut()` | | |
| 7a | supabase.auth called | `authService.signOut: Calling supabase.auth.signOut()` | | |
| 7b | supabase.auth completed | `authService.signOut: supabase.auth.signOut() completed` | | |
| 7c | authService returning | `authService.signOut: Returning success` | | |
| 8 | authService returned | `Step 8: authService.signOut() returned` | | |
| 9 | logout() returning | `Step 9: logout() about to return true` | | |
| 10 | logout() returned | `Step 10: logout() returned` | | |
| 11 | SIGNED_OUT event | `useAuthInitializer: onAuthStateChange event: SIGNED_OUT` | | |
| 12 | Listener clearAuth | `useAuthInitializer: SIGNED_OUT event received, calling clearAuth()` | | |

---

## WHAT TO LOOK FOR

### SCENARIO A: Immediate Redirect (Expected)

**Timeline:**
- Steps 1–6 execute in <100ms
- User sees login screen before Step 7 completes
- Steps 7–10 complete in background (2–5 seconds)
- Step 11–12 fire after network completes (redundant cleanup)

**Logs Should Show:**
- All steps 1–10 present
- Steps 5c–5f appear IMMEDIATELY after Step 5b (same React render cycle)
- Steps 7–10 complete 2–5 seconds later
- Steps 11–12 appear last (redundant but harmless)

**Result:** ✅ LOGOUT FIX WORKING

---

### SCENARIO B: Delayed Redirect (Bug Still Present)

**Timeline:**
- Steps 1–5 execute quickly
- Steps 5c–5f do NOT appear after Step 5b
- User still sees profile screen
- Steps 7–10 complete
- Steps 11–12 fire
- THEN redirect happens

**Logs Should Show:**
- Steps 1–6 present
- Steps 5c–5f MISSING or appear MUCH LATER
- Steps 7–12 complete
- AuthGate logs appear AFTER Step 12 instead of after Step 5b

**Result:** ❌ AuthGate NOT reacting to clearAuth() synchronously

**Root Cause:** Zustand selector not triggering re-render, OR router.replace() not executing

---

### SCENARIO C: No Redirect at All (Worst Case)

**Timeline:**
- Steps 1–10 execute
- AuthGate logs NEVER appear
- User stuck on profile screen
- Steps 11–12 may or may not fire

**Logs Should Show:**
- Steps 1–10 present
- Steps 5c–5f completely MISSING
- Steps 11–12 may appear but no redirect

**Result:** ❌ AuthGate useEffect NOT firing

**Root Cause:** AuthGate component not mounted, OR dependency array broken, OR session selector broken

---

### SCENARIO D: Duplicate Redirects (Secondary Bug)

**Timeline:**
- Steps 1–6 execute
- AuthGate logs appear TWICE
- `router.replace()` called twice

**Logs Should Show:**
- Steps 5c–5f appear
- Then DUPLICATE of steps 5c–5f
- Two calls to `router.replace("/(auth)/login")`

**Result:** ⚠️ `profile` still in dependency array (DEC-017 violation)

**Root Cause:** We removed `profile` from deps but it's somehow back, OR another selector is causing double-fire

---

### SCENARIO E: Error During signOut

**Timeline:**
- Steps 1–6 execute normally
- Step 7a executes
- Step 7b shows error
- Step 7c says "Returning error"
- Step 8 shows `{success: false, error: "..."}`

**Logs Should Show:**
- All steps 1–6 present (redirect already happened)
- Step 7b: `error: [object Object]` or similar
- Step 7c: `Returning error: ...`
- Step 8: `{success: false, ...}`

**Result:** ✅ if redirect happened at Step 5f (user doesn't see error)  
**Result:** ❌ if redirect did NOT happen (user sees error message)

---

## IDENTIFY THE FIRST FAILING STEP

Based on the logs, answer these questions:

### Question 1: Does clearAuth() Execute?
- ✅ YES → Step 5a and 5b logs appear
- ❌ NO → Step 5a and 5b logs missing

**If NO:** Bug is in `useAuth.logout()` — clearAuth() call not executing

---

### Question 2: Does AuthGate React Immediately?
- ✅ YES → Steps 5c–5f appear within 100ms of Step 5b
- ❌ NO → Steps 5c–5f missing or appear much later (after Step 12)

**If NO:** Bug is in AuthGate subscription to Zustand state — not re-rendering when `session` changes to null

---

### Question 3: Does router.replace() Execute?
- ✅ YES → Step 5f log appears: `router.replace("/(auth)/login") called`
- ❌ NO → Step 5e appears but Step 5f missing

**If NO:** Bug is in `router.replace()` call — function not executing or throwing error

---

### Question 4: Does Redirect Actually Navigate?
- ✅ YES → User sees login screen, profile component unmounts
- ❌ NO → Logs show redirect called but user still on profile screen

**If NO:** Bug is in Expo Router navigation — route change not applied or navigation stack corrupted

---

### Question 5: Does supabase.auth.signOut() Succeed?
- ✅ YES → Step 7b shows `error: null`, Step 7c says "Returning success"
- ❌ NO → Step 7b shows error object, Step 7c says "Returning error"

**If NO:** Network issue or Supabase configuration issue (but redirect should still work from Step 5f)

---

## REPORTING FORMAT

After testing, report findings using this template:

```
## LOGOUT TRACE RESULTS

**Test Environment:** [Web / iOS / Android]
**Network Condition:** [Good / Slow / Offline]

### Execution Steps:
- Step 1 (Button press): [PASS/FAIL]
- Step 2 (Alert confirm): [PASS/FAIL]
- Step 3 (logout called): [PASS/FAIL]
- Step 4 (logout executing): [PASS/FAIL]
- Step 5 (clearAuth called): [PASS/FAIL]
- Step 5a–5b (clearAuth state update): [PASS/FAIL]
- Step 5c–5f (AuthGate redirect): [PASS/FAIL] ← CRITICAL
- Step 6 (clearAuth completed): [PASS/FAIL]
- Step 7–8 (authService): [PASS/FAIL]
- Step 9–10 (logout return): [PASS/FAIL]
- Step 11–12 (SIGNED_OUT event): [PASS/FAIL]

### First Failing Step:
[Step number and name]

### User Experience:
[Describe what user sees]

### Full Console Log:
[Paste all [LOGOUT TRACE] logs here]
```

---

## NEXT STEPS AFTER TESTING

1. **Run test on device/browser**
2. **Record console output**
3. **Identify first failing step using checklist above**
4. **Report results using template**
5. **DO NOT suggest fixes until failing step is proven**

---

## REMOVING LOGS AFTER TESTING

Once the issue is identified, remove all console.log statements:

```bash
# Search for all trace logs:
grep -r "\[LOGOUT TRACE\]" src/ app/

# Or manually remove from:
# - app/(tabs)/profile.tsx
# - src/hooks/useAuth.ts
# - src/store/auth.store.ts
# - src/services/auth.service.ts
# - src/hooks/useAuthInitializer.ts
# - app/_layout.tsx
```

---

## STATUS: READY FOR TESTING

Console logs are in place. Run the test and report findings.
