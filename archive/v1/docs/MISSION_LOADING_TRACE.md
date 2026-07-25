# MISSION LOADING EXECUTION TRACE

**Problem**: Dashboard mission card loads forever (spinner never stops)

**Trace Date**: 2026-06-12

---

## EXECUTION PATH: Dashboard → Service → Supabase

### STEP 1: Dashboard Component Mount
**File**: `app/(tabs)/index.tsx`  
**Function**: `HomeScreen` component

**Initial State** (line 48-52):
```typescript
const [mission, setMission] = useState<DbMission | null>(null);
const [isCompleted, setIsCompleted] = useState(false);
const [loading, setLoading] = useState(true);  // ← STARTS TRUE
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**useEffect Trigger** (line 97-99):
```typescript
useEffect(() => {
  void loadTodayMission();
}, [loadTodayMission]);
```

**Inputs**:
- `profile`: DbUser | null (from useAuth)
- `userId`: string | null (from useAuthStore)

**Loading State**: `loading = true` (initial state)

---

### STEP 2: loadTodayMission Callback
**File**: `app/(tabs)/index.tsx` (line 55-95)  
**Function**: `loadTodayMission`

**Entry Check** (line 56-57):
```typescript
if (!profile || !userId) return;
```

**❌ CRITICAL BUG IDENTIFIED**:
- **If `!profile || !userId`**: Function returns **WITHOUT** calling `setLoading(false)`
- **Result**: `loading` remains `true` forever
- **UI Impact**: Spinner shows forever

**When does this happen?**
1. **On mount**: `profile` may still be loading from Supabase
2. **After logout**: Both become `null`
3. **Network delay**: Auth state not ready yet

**Loading State After Early Return**: `loading = true` (NEVER CHANGED)

---

### STEP 3A: Date Calculations (IF profile exists)
**File**: `src/utils/date.ts`

**Input** (line 62):
```typescript
const joinedDate = profile.created_at.split('T')[0]; // e.g. "2026-06-01"
```

**currentWeekNumber calculation** (line 63):
```typescript
const weekNum = currentWeekNumber(joinedDate);
```

**Implementation** (date.ts line 60-62):
```typescript
export function currentWeekNumber(joinedDate: string): number {
  return Math.floor(daysSinceJoined(joinedDate) / 7) + 1;
}
```

**daysSinceJoined calculation** (date.ts line 49-51):
```typescript
export function daysSinceJoined(joinedDate: string): number {
  return daysBetween(todayIST(), joinedDate);
}
```

**todayIST calculation** (date.ts line 14-17):
```typescript
export function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS);  // +330 minutes
  return ist.toISOString().slice(0, 10);  // "2026-06-12"
}
```

**Example**:
- `joinedDate = "2026-06-01"` (user created account on June 1)
- `todayIST() = "2026-06-12"` (today is June 12)
- `daysSinceJoined = 11 days`
- `weekNum = floor(11 / 7) + 1 = 1 + 1 = 2` ✅

**currentDayOfWeek calculation** (line 64):
```typescript
const dayNum = currentDayOfWeek(joinedDate);
```

**Implementation** (date.ts line 68-70):
```typescript
export function currentDayOfWeek(joinedDate: string): number {
  return (daysSinceJoined(joinedDate) % 7) + 1;
}
```

**Example**:
- `daysSinceJoined = 11`
- `dayNum = (11 % 7) + 1 = 4 + 1 = 5` ✅

**Outputs**:
- `weekNum = 2` (Week 2)
- `dayNum = 5` (Day 5 of Week 2)

---

### STEP 4: Mission Service Call
**File**: `src/services/mission.service.ts` (line 52-79)  
**Function**: `fetchTodayMission`

**Inputs**:
- `userId`: "uuid-string"
- `weekNumber`: 2
- `dayNum`: 5

**Supabase Query** (line 62-67):
```typescript
const { data, error } = await supabase
  .from('missions')
  .select('*')
  .eq('week_number', weekNumber)    // WHERE week_number = 2
  .eq('unlock_day', dayOfWeek)      // AND unlock_day = 5
  .maybeSingle();
```

**Actual SQL executed**:
```sql
SELECT * FROM missions 
WHERE week_number = 2 
  AND unlock_day = 5 
LIMIT 1;
```

**Seeded mission that matches**:
```sql
-- Day 12 (Week 2, Day 5)
('COM-003', 'Friend Wrong Decision', 'Communication', 'Reflect & Write', 2, 5, 40, {...})
```

**Result**: `data = mission object` ✅

---

### STEP 5A: Success Path (mission found)
**File**: `src/services/mission.service.ts` (line 74-76)

**Check** (line 73):
```typescript
if (data) {
  return { success: true, data: data as DbMission };
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    id: 'COM-003',
    title: 'Friend Wrong Decision',
    category: 'Communication',
    mission_type: 'Reflect & Write',
    week_number: 2,
    unlock_day: 5,
    xp_reward: 40,
    content: { type: "Reflect & Write", ... }
  }
}
```

**Back to Dashboard** (index.tsx line 71-72):
```typescript
if (!missionResult.success) {
  setError(missionResult.error);
  setLoading(false);  // ← Loading stops on error
  return;
}
```

**Mission found, no error** → continues

**Set Mission** (line 75):
```typescript
setMission(missionResult.data);  // mission = DbMission object
```

**Loading State**: Still `true` (not stopped yet)

---

### STEP 6: Completion Check
**File**: `app/(tabs)/index.tsx` (line 78-90)

**Check if completion check should run** (line 78):
```typescript
if (missionResult.data) {  // true (mission exists)
```

**Call checkTodayCompletion** (line 79-82):
```typescript
const completionResult = await missionService.checkTodayCompletion(
  userId,
  todayIST(),  // "2026-06-12"
);
```

**Service Function** (mission.service.ts line 82-101):
```typescript
const { data, error } = await supabase
  .from('mission_completions')
  .select('id')
  .eq('user_id', userId)
  .eq('completed_date', today)  // "2026-06-12"
  .maybeSingle();
```

**SQL executed**:
```sql
SELECT id FROM mission_completions
WHERE user_id = 'uuid'
  AND completed_date = '2026-06-12'
LIMIT 1;
```

**Result**:
- **Not completed**: `data = null` → returns `{ success: true, data: false }`
- **Already completed**: `data = { id: 'uuid' }` → returns `{ success: true, data: true }`

**Back to Dashboard** (index.tsx line 84-86):
```typescript
if (completionResult.success) {
  setIsCompleted(completionResult.data);  // true or false
}
```

**Loading State**: Still `true` (still not stopped!)

---

### STEP 7: Loading State Finally Updated
**File**: `app/(tabs)/index.tsx` (line 89)

**FINALLY** (line 89):
```typescript
setLoading(false);  // ← ONLY place where loading stops in success path
```

**Loading State**: `loading = false` ✅

**Mission Card Renders**: Based on `mission` and `isCompleted` values

---

### STEP 5B: Error Path (Supabase error)
**File**: `src/services/mission.service.ts` (line 69-72)

**If Supabase returns error**:
```typescript
if (error) {
  return {
    success: false,
    error: normalizeError(error),
  };
}
```

**Back to Dashboard** (index.tsx line 71-74):
```typescript
if (!missionResult.success) {
  setError(missionResult.error);
  setLoading(false);  // ← Loading stops
  return;
}
```

**Loading State**: `loading = false` ✅  
**UI**: Error box shown

---

### STEP 5C: No Mission Path (data = null, no error)
**File**: `src/services/mission.service.ts` (line 78-79)

**If no mission found for week/day**:
```typescript
return { success: true, data: null };
```

**Back to Dashboard** (index.tsx line 71-74):
```typescript
if (!missionResult.success) {
  // Does NOT enter — success is true
}

setMission(missionResult.data);  // mission = null
```

**Completion check** (line 78):
```typescript
if (missionResult.data) {  // false (null)
  // SKIPS completion check
}
```

**Finally** (line 89):
```typescript
setLoading(false);  // ← Loading stops
```

**Loading State**: `loading = false` ✅  
**UI**: "No mission available" box shown

---

## ROOT CAUSE ANALYSIS

### ❌ PRIMARY BUG: Early Return Without setLoading(false)

**Location**: `app/(tabs)/index.tsx` line 56-57

```typescript
const loadTodayMission = useCallback(async () => {
  if (!profile || !userId) return;  // ← BUG: returns without setLoading(false)
  
  setError(null);
  // ... rest of function
```

**When this causes infinite loading**:

1. **Component mounts** → `loading = true` (initial state)
2. **useEffect runs** → calls `loadTodayMission()`
3. **Profile not loaded yet** → `!profile` is true
4. **Function returns early** → `setLoading(false)` NEVER called
5. **Loading spinner shows forever** → no error, no mission, just loading

**Scenarios where profile is null**:

| Scenario | profile | userId | Result |
|----------|---------|--------|--------|
| Auth still loading | null | null | ❌ Infinite loading |
| Profile fetch failed | null | string | ❌ Infinite loading |
| User logged out | null | null | ❌ Infinite loading |
| Just logged in, profile loading | null | string | ❌ Infinite loading (briefly) |
| Ready | DbUser | string | ✅ Works |

**Why this is the root cause**:
- No other code path can leave `loading = true` forever
- All other paths explicitly call `setLoading(false)`
- Error path: line 73
- Success path: line 89
- Only the early return skips it

---

## LOADING STATE TRANSITION MAP

```
INITIAL: loading = true
    ↓
loadTodayMission() called
    ↓
    ├─ !profile || !userId? → EARLY RETURN (loading stays TRUE) ❌ BUG
    │
    ├─ Supabase error? → setLoading(false) ✅
    │
    ├─ No mission (null)? → setMission(null) → setLoading(false) ✅
    │
    └─ Mission found? → setMission(data) → check completion → setLoading(false) ✅
```

---

## CAN LOADING REMAIN TRUE FOREVER?

**YES** — in exactly ONE scenario:

**Location**: `app/(tabs)/index.tsx` line 56-57

**Condition**: `!profile || !userId` evaluates to `true`

**When**:
1. Auth state not initialized yet
2. Profile fetch from Supabase failed
3. User is logged out (shouldn't reach dashboard, but AuthGate timing)
4. Network issue prevented profile load

**Frequency**: 
- **High** if auth initialization is slow
- **Moderate** if profile fetch has latency
- **Low** if everything is fast and working

---

## OTHER OBSERVATIONS

### ✅ Mission Query is Correct
- SQL: `WHERE week_number = 2 AND unlock_day = 5`
- Returns correct mission from seed data
- `.maybeSingle()` handles 0 or 1 result correctly

### ✅ Date Calculations are Correct
- IST offset applied correctly (+330 minutes)
- `daysSinceJoined` calculated correctly
- `currentWeekNumber` = `floor(days / 7) + 1` ✅
- `currentDayOfWeek` = `(days % 7) + 1` ✅

### ✅ Error Handling Works
- All Supabase errors call `setLoading(false)`
- Error message normalized and displayed
- No infinite loading on error

### ✅ No Mission Case Works
- `data = null` returns `{ success: true, data: null }`
- Dashboard checks `!mission` and shows "No mission available"
- `setLoading(false)` is called

### ⚠️ Completion Check Could Be Skipped
- If `checkTodayCompletion` has an error, it's silently ignored (line 84-86)
- `setIsCompleted` only called if `completionResult.success`
- But `setLoading(false)` still happens at line 89
- **Not a bug** — just falls back to `isCompleted = false` (initial state)

---

## ANSWER TO SPECIFIC QUESTIONS

### Q: What week_number is calculated?
**A**: `floor(daysSinceJoined / 7) + 1`  
Example: 11 days since joined → week 2

### Q: What unlock_day is calculated?
**A**: `(daysSinceJoined % 7) + 1`  
Example: 11 days since joined → day 5

### Q: What mission query is executed?
**A**: 
```sql
SELECT * FROM missions 
WHERE week_number = 2 
  AND unlock_day = 5 
LIMIT 1;
```
Expected result: `COM-003` (Friend Wrong Decision)

### Q: What happens if no mission is found?
**A**: 
- Service returns `{ success: true, data: null }`
- Dashboard sets `mission = null`
- Dashboard calls `setLoading(false)`
- UI shows "No mission available" message
- ✅ Works correctly

### Q: What happens if Supabase returns null?
**A**: Same as above (no mission found case)

### Q: Can loading remain true forever?
**A**: **YES** — if `!profile || !userId` on line 56-57

### Q: Where exactly would that happen?
**A**: `app/(tabs)/index.tsx` line 56-57 — early return without `setLoading(false)`

---

## SINGLE MOST LIKELY ROOT CAUSE

**Location**: `app/(tabs)/index.tsx` line 56-57

**Bug**: Early return when profile/userId not ready, without setting `loading = false`

**Fix Required** (conceptual — not implementing):
```typescript
const loadTodayMission = useCallback(async () => {
  if (!profile || !userId) {
    setLoading(false);  // ← Add this line
    return;
  }
  // ... rest of function
```

**Why this is the root cause**:
- Only code path that leaves `loading = true` forever
- All other paths explicitly set `loading = false`
- Profile loading is async and may be delayed
- Very common on app startup or after auth state changes

**Confidence**: 99% — this is the bug causing infinite loading

---

## TRACE COMPLETE

**Status**: Root cause identified  
**Issue**: Missing `setLoading(false)` in early return path  
**Impact**: Dashboard shows loading spinner forever when profile not ready  
**Severity**: HIGH (blocks entire dashboard on slow auth)
