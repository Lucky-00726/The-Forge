# PRODUCTION READINESS AUDIT — Day 2 Mission System

**Audit Date**: 2026-06-12  
**Scope**: Mission loading, completion, XP/streak updates, duplicate prevention, session persistence, error handling, navigation  
**Status**: NOT PRODUCTION READY

---

## CRITICAL ISSUES (Must fix before launch)

### **CRITICAL-001: Dashboard Loading Infinite Loop**
**Component**: `app/(tabs)/index.tsx` (line 56-57)  
**Issue**: `loadTodayMission()` returns early when `!profile || !userId` without calling `setLoading(false)`

**Impact**:
- Dashboard shows loading spinner forever if profile fetch fails
- No error feedback to user
- App appears frozen
- Blocks entire mission system

**Evidence**:
```typescript
const loadTodayMission = useCallback(async () => {
  if (!profile || !userId) return;  // ← NO setLoading(false)
  // ... rest of function
}, [profile, userId]);
```

**When it happens**:
- Profile fetch fails (user not in `public.users` table)
- Trigger `handle_new_user()` didn't fire
- RLS policy blocks profile read
- Network error during profile fetch

**Severity**: CRITICAL (blocks core functionality)

---

### **CRITICAL-002: Silent Profile Fetch Failure**
**Component**: `src/hooks/useAuthInitializer.ts` (line 34-37)  
**Issue**: `fetchProfile()` failure is silently ignored, no error state, no retry

**Impact**:
- User logged in but profile never loads
- Dashboard stuck in loading forever (see CRITICAL-001)
- No user feedback that something is wrong
- No way for user to recover without app restart

**Evidence**:
```typescript
const result = await fetchProfile(session.user.id);
if (mounted && result.success) {
  setProfile(result.data);
}
// ← No else clause, no error handling, no logging
```

**Why profile fetch fails**:
1. User doesn't exist in `public.users` table (trigger failed)
2. RLS policy `auth.uid() = id` doesn't match
3. Network interruption during fetch
4. Database connection issue

**Severity**: CRITICAL (blocks authentication flow)

---

### **CRITICAL-003: No Profile Existence Verification After Signup**
**Component**: `src/services/auth.service.ts` (line 54-61)  
**Issue**: Signup creates auth user but doesn't verify profile row was created

**Impact**:
- User signs up successfully
- Trigger fails to create profile row (silent)
- User logs in
- Profile fetch fails (row doesn't exist)
- Dashboard loading infinite loop

**Evidence**:
```typescript
// 2. Update display_name on the profile row created by the trigger
const { error: profileError } = await supabase
  .from('users')
  .update({ display_name: form.display_name.trim() })
  .eq('id', data.user.id);

if (profileError) {
  // Non-fatal: auth succeeded, profile name can be updated later
  console.warn('[signUp] profile update failed:', profileError.message);
}
// ← Doesn't check if row exists, just warns if update fails
```

**Trigger can fail if**:
- Extension `uuid-ossp` not installed
- `public.users` table doesn't exist
- RLS blocks INSERT (shouldn't happen with `security definer`)
- Concurrent INSERT race condition

**Severity**: CRITICAL (breaks user onboarding)

---

## HIGH ISSUES (Fix before beta)

### **HIGH-001: Duplicate Completion Detection Returns Error Instead of Idempotent Success**
**Component**: `src/services/mission.service.ts` (line 128-132)  
**Issue**: When RPC returns `already_completed: true`, service treats it as an error

**Impact**:
- User completes mission
- Network interruption
- User retries
- RPC correctly prevents double-XP
- But client shows error message instead of success
- Confusing UX — user thinks completion failed

**Evidence**:
```typescript
if ('already_completed' in data && data.already_completed) {
  return {
    success: false,  // ← WRONG: should be success: true
    error: 'You have already completed today\'s mission.',
  };
}
```

**Correct behavior**: Duplicate completion should return:
```typescript
{
  success: true,  // ← Idempotent success
  data: { xp_awarded: 0, new_total_xp, new_streak, new_rank }
}
```

**Severity**: HIGH (breaks retry flow, confusing UX)

---

### **HIGH-002: Race Condition on Rapid Duplicate Submissions**
**Component**: RPC `complete_mission()` + Client  
**Issue**: User can double-tap submit button before first request completes

**Impact**:
- Two RPC calls in flight simultaneously
- Both read `last_active_date` before either updates it
- Both attempt INSERT
- One succeeds, one gets `unique_violation`
- Second returns `already_completed: true`
- Client shows error banner (see HIGH-001)

**Evidence**:
- No client-side submission debounce
- `isSubmitting` flag set AFTER service call starts
- RPC row lock happens AFTER fetch, not before

**Mitigation**: 
- RPC atomic transaction + UNIQUE constraint prevents double-XP ✅
- But UX is broken (error shown on retry)

**Severity**: HIGH (common user behavior, breaks UX)

---

### **HIGH-003: Profile Update Optimistic Without Fallback**
**Component**: `src/hooks/useMissionEngine.ts` (line 82-84)  
**Issue**: Profile fields updated optimistically but no fallback if navigation fails

**Impact**:
- Mission completed in database
- Profile updated in Zustand store
- Navigation to success screen fails (route error, memory issue)
- User stuck on mission screen
- No way to reach success screen
- Dashboard still shows "not completed" until refetch

**Evidence**:
```typescript
updateProfileField('total_xp', result.data.new_total_xp);
updateProfileField('current_streak', result.data.new_streak);
updateProfileField('current_rank', result.data.new_rank);

router.push({
  pathname: '/mission/success',
  params: { ... }
});
// ← No error handling if router.push fails
```

**Severity**: HIGH (edge case but unrecoverable)

---

### **HIGH-004: No Network Error Recovery on Dashboard**
**Component**: `app/(tabs)/index.tsx`  
**Issue**: Network error during mission fetch shows generic error, no retry button

**Impact**:
- User on slow/intermittent network
- Mission fetch times out
- Error message shown but no action available
- Must pull-to-refresh to retry
- Not discoverable for non-technical users

**Evidence**:
- Error UI has no retry button (only in mission detail screen)
- Pull-to-refresh exists but not obvious
- Error message doesn't suggest refresh

**Severity**: HIGH (poor UX on Indian mobile networks)

---

## MEDIUM ISSUES (Fix post-launch)

### **MEDIUM-001: Completion Check Failure Silently Ignored**
**Component**: `app/(tabs)/index.tsx` (line 84-86)  
**Issue**: If `checkTodayCompletion()` fails, error is ignored, `isCompleted` stays false

**Impact**:
- Mission already completed in database
- Completion check fails (network, RLS, etc.)
- Dashboard shows "COMMENCE MISSION" instead of "COMPLETE"
- User clicks, loads mission, attempts submit
- Gets "already completed" error
- Confusing UX

**Evidence**:
```typescript
if (completionResult.success) {
  setIsCompleted(completionResult.data);
}
// ← No else clause, failure is silent
```

**Severity**: MEDIUM (bad UX but user can discover via submission error)

---

### **MEDIUM-002: Mission Store Not Reset on Logout**
**Component**: `src/store/mission.store.ts`  
**Issue**: Mission store has no logout handler, stale data persists

**Impact**:
- User A completes mission
- Logs out
- User B logs in on same device
- Mission store still has User A's mission data
- Low impact (mission detail screen calls `reset()` on mount)
- But state is stale between logout and next mission load

**Evidence**:
- No listener in mission store for auth state change
- No `clearAuth` call to mission store

**Severity**: MEDIUM (low impact due to `reset()` on mission screen mount)

---

### **MEDIUM-003: No Loading State for Submission**
**Component**: `app/mission/[id].tsx`  
**Issue**: Submit button doesn't show loading state during RPC call

**Impact**:
- User taps submit
- Network delay (2-5 seconds)
- No feedback that submission is processing
- User may double-tap (see HIGH-002)

**Evidence**:
- Mission type components receive `isSubmitting` prop
- But `isSubmitting` is set AFTER `completeMission()` starts
- Gap between user tap and visual feedback

**Severity**: MEDIUM (contributes to HIGH-002)

---

### **MEDIUM-004: Success Screen Rank Promotion Detection Heuristic**
**Component**: `app/mission/success.tsx` (line 43-46)  
**Issue**: Rank promotion detection uses XP threshold heuristic, not actual rank change

**Impact**:
- If mission awards 100 XP, promotion may not show
- If user completes Week 1 Day 1 with 390 XP, promotion may show incorrectly
- False positives and false negatives possible

**Evidence**:
```typescript
const showRankPromotion = (
  (newRank === 'Officer' && newTotalXP >= 400 && newTotalXP < 450) ||
  (newRank === 'Commander' && newTotalXP >= 1200 && newTotalXP < 1250)
);
// ← Assumes XP rewards are 40-50, will break if rewards change
```

**Correct fix**: RPC should return `rank_changed: boolean`

**Severity**: MEDIUM (works for MVP, breaks if XP rewards change)

---

### **MEDIUM-005: No Handling for User Without `created_at`**
**Component**: `app/(tabs)/index.tsx` (line 62)  
**Issue**: Assumes `profile.created_at` always exists and is well-formed

**Impact**:
- If `created_at` is null or malformed: crash
- If `created_at` is future date: negative week/day
- If `created_at` is epoch: user in week 2700+

**Evidence**:
```typescript
const joinedDate = profile.created_at.split('T')[0]; // ← No validation
```

**Likelihood**: LOW (database default ensures value)

**Severity**: MEDIUM (app crash if assumption breaks)

---

## LOW ISSUES (Nice to have)

### **LOW-001: No Telemetry for Profile Fetch Failures**
**Component**: `src/hooks/useAuthInitializer.ts`  
**Issue**: Profile fetch failure not logged or tracked

**Impact**:
- Can't diagnose why users stuck in loading
- Can't measure trigger failure rate
- Can't detect RLS issues in production

**Severity**: LOW (dev observability, not user-facing)

---

### **LOW-002: No Retry Limit on Mission Load Failure**
**Component**: `app/mission/[id].tsx`  
**Issue**: User can retry mission load infinitely, no circuit breaker

**Impact**:
- If mission doesn't exist (bad ID), infinite retry possible
- Network cost for user
- Server load (minimal)

**Severity**: LOW (user controls retry, not automatic)

---

### **LOW-003: Success Screen Navigation Uses `router.push` Instead of `router.replace`**
**Component**: `src/hooks/useMissionEngine.ts` (line 88)  
**Issue**: Uses `push` instead of `replace`, allows back navigation to completed mission

**Impact**:
- User can tap back from success screen
- Returns to mission detail screen (mission already complete)
- Confusing state

**Expected behavior**: `router.replace` prevents back nav

**Evidence**:
```typescript
router.push({  // ← Should be router.replace
  pathname: '/mission/success',
  params: { ... }
});
```

**Severity**: LOW (intentional design choice per DECISIONS.md)

---

### **LOW-004: No Validation of Mission Content Types at Runtime**
**Component**: `app/mission/[id].tsx` (line 165-183)  
**Issue**: Type assertions without runtime validation

**Impact**:
- If database content doesn't match `mission_type` string, TypeScript cast succeeds but wrong component renders
- Edge case: admin error during content seeding

**Evidence**:
```typescript
{mission.mission_type === 'Reflect & Write' && (
  <ReflectWrite
    content={mission.content as ReflectWriteContent}  // ← No validation
    ...
  />
)}
```

**Severity**: LOW (would be caught in testing, not runtime)

---

## SESSION PERSISTENCE AUDIT ✅

**Verified**:
- ✅ Supabase client uses `SecureStoreAdapter` (see `src/services/supabase.ts`)
- ✅ Session stored in `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android)
- ✅ `useAuthInitializer` calls `getSession()` on mount
- ✅ `onAuthStateChange` listener refreshes session on token expiry
- ✅ Session persists across app restarts

**Status**: WORKING CORRECTLY

---

## DUPLICATE COMPLETION PREVENTION AUDIT ⚠️

**Database Level** ✅:
- ✅ UNIQUE constraint on `(user_id, completed_date)`
- ✅ RPC uses `FOR UPDATE` row lock
- ✅ RPC handles `unique_violation` exception
- ✅ Returns `already_completed: true` on duplicate

**Service Level** ❌:
- ❌ Service treats `already_completed` as error (HIGH-001)
- ❌ No idempotent success return

**Client Level** ❌:
- ❌ No double-tap prevention (HIGH-002)
- ❌ Submit button not disabled during submission

**Status**: DATABASE WORKS, CLIENT BROKEN

---

## XP UPDATE AUDIT ✅

**RPC Logic** ✅:
- ✅ Atomic transaction (INSERT completion + UPDATE users)
- ✅ `total_xp = total_xp + p_xp` (correct accumulation)
- ✅ Returns new XP value

**Client Update** ✅:
- ✅ Optimistic update via `updateProfileField()`
- ✅ Dashboard reads from store (updated immediately)
- ✅ Success screen shows updated XP

**Rollback** ⚠️:
- ⚠️ No rollback if navigation fails (HIGH-003)

**Status**: WORKS CORRECTLY (with HIGH-003 caveat)

---

## STREAK UPDATE AUDIT ✅

**RPC Logic** ✅:
- ✅ Reads `last_active_date` and `current_streak`
- ✅ Increments if yesterday: `v_old_streak + 1`
- ✅ Resets if gap > 1 day: `1`
- ✅ First mission: `1`
- ✅ Uses IST timezone: `(now() at time zone 'Asia/Kolkata')::date`

**Edge Cases** ✅:
- ✅ Same day: keeps current (prevented by UNIQUE)
- ✅ Yesterday: increments
- ✅ First ever: sets to 1
- ✅ Gap: resets to 1

**Client Update** ✅:
- ✅ Optimistic update via `updateProfileField()`
- ✅ Dashboard shows updated streak
- ✅ Success screen shows updated streak

**Status**: WORKING CORRECTLY

---

## ERROR HANDLING AUDIT ❌

| Scenario | Dashboard | Mission Detail | Service | RPC |
|----------|-----------|----------------|---------|-----|
| Profile fetch fails | ❌ Infinite loading | N/A | ✅ Returns error | N/A |
| Mission fetch fails | ✅ Shows error | ✅ Shows error | ✅ Returns error | N/A |
| Mission not found | ✅ Shows "no mission" | ✅ Shows error | ✅ Returns null | N/A |
| Completion check fails | ❌ Silent failure | N/A | ✅ Returns error | N/A |
| Duplicate completion | ✅ Shows "complete" card | ❌ Shows error | ❌ Returns error | ✅ Returns `already_completed` |
| Network timeout | ⚠️ No retry button | ✅ Has retry | ✅ Returns error | N/A |
| RLS blocks read | ❌ Infinite loading | ✅ Shows error | ✅ Returns error | N/A |
| User not found (RPC) | N/A | N/A | N/A | ✅ Raises exception |

**Status**: PARTIAL (3 critical failures)

---

## NAVIGATION FLOW AUDIT ✅

**Flow**: Dashboard → Mission Detail → Success → Dashboard

**Verified**:
- ✅ Dashboard: `router.push(/mission/${id})`
- ✅ Mission Detail: Loads mission, delegates to type component
- ✅ Type Component: Validates, calls `onSubmit`, passes `MissionResponse`
- ✅ Engine Hook: Calls RPC, updates profile, navigates to success
- ✅ Success: `router.replace('/(tabs)')` (correct)
- ✅ Back from Mission Detail: `router.back()` returns to dashboard

**Edge Cases**:
- ⚠️ Navigation failure after completion (HIGH-003)
- ⚠️ Success screen uses `push` not `replace` in hook (LOW-003)

**Status**: WORKS CORRECTLY (with HIGH-003 caveat)

---

## SUMMARY

### **Production Readiness**: ❌ NOT READY

### **Blockers**:
1. **CRITICAL-001**: Dashboard infinite loading
2. **CRITICAL-002**: Silent profile fetch failure
3. **CRITICAL-003**: No profile verification after signup

### **Must Fix Before Beta**:
4. **HIGH-001**: Duplicate completion returns error
5. **HIGH-002**: Race condition on double-tap
6. **HIGH-003**: No fallback if navigation fails
7. **HIGH-004**: No network error retry

### **Fix Post-Launch**:
- **MEDIUM** issues (5 total) — degraded UX but not breaking
- **LOW** issues (4 total) — nice-to-haves

### **What Works**:
- ✅ XP updates (atomic, correct)
- ✅ Streak updates (correct logic, IST timezone)
- ✅ Duplicate prevention (database level)
- ✅ Session persistence (SecureStore, token refresh)
- ✅ Navigation flow (all routes work)
- ✅ Mission loading (when profile exists)

### **What's Broken**:
- ❌ Profile loading error handling (CRITICAL)
- ❌ Dashboard loading states (CRITICAL)
- ❌ Duplicate completion UX (HIGH)
- ❌ Network error recovery (HIGH)

---

## RECOMMENDED FIX ORDER

1. **CRITICAL-002**: Add error handling to `useAuthInitializer` (blocks everything)
2. **CRITICAL-001**: Add `setLoading(false)` to dashboard early return
3. **CRITICAL-003**: Verify profile row exists after signup
4. **HIGH-001**: Make duplicate completion return success
5. **HIGH-002**: Add debounce to submit button
6. **HIGH-004**: Add retry button to dashboard error state
7. **HIGH-003**: Add error handling to navigation
8. **MEDIUM** issues: Address in V1.1
9. **LOW** issues: Address in V2

---

**Audit Complete**: 2026-06-12  
**Recommendation**: DO NOT LAUNCH until CRITICAL issues fixed
