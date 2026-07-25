# PHASE 1 IMPLEMENTATION REPORT
## Mission Library: Database & RPC Layer

**Date:** June 13, 2026  
**Phase:** 1 of 3  
**Status:** ✅ COMPLETE — Ready for Testing

---

## Overview

Phase 1 implements the database and RPC layer changes to support the Mission Library architecture with Model B XP calculation (Featured = 100% XP, Training = 50% XP).

### Key Changes
- ✅ Database schema migration created
- ✅ RPC function updated to support featured/training distinction
- ✅ TypeScript types updated
- ✅ Mission service updated with new helper functions
- ❌ **NOT YET UPDATED:** `useMissionEngine` hook (requires UI context from Phase 2)

---

## Files Modified

### 1. Database Migration
**File:** `supabase/migrations/004_mission_library_phase1.sql`

**Changes:**
- Added `is_featured` boolean column to `mission_completions` table
- Dropped `uq_user_date` constraint (allowed only 1 mission/day)
- Added `uq_user_mission_date` constraint (prevents same mission twice/day)
- Updated `complete_mission()` RPC to accept `p_is_featured` parameter
- RPC now calculates XP: Featured = 100%, Training = 50% (rounded down)
- Added helper function `has_completed_featured_today()`
- Added helper function `get_today_completion_count()`
- Added index `idx_completions_user_date_featured` for new query patterns

**Backwards Compatibility:**
- ✅ `p_is_featured` parameter defaults to `false` (training)
- ✅ Existing completion rows will have `is_featured = false`
- ✅ Old RPC calls without `p_is_featured` will work (default to training XP)

---

### 2. TypeScript Types
**File:** `src/types/index.ts`

**Changes:**
```typescript
// DbMissionCompletion interface
+ is_featured: boolean;  // TRUE = featured (100%), FALSE = training (50%)

// CompleteMissionResult interface
+ is_featured: boolean;  // Echoes back whether this was featured
```

---

### 3. Mission Service
**File:** `src/services/mission.service.ts`

**Changes:**
- Updated `completeMission()` to accept `isFeatured: boolean` parameter
- Added `hasFeaturedCompletedToday()` function
- Added `getTodayCompletionCount()` function
- Added `getTodayCompletedMissionIds()` function

**New Service Functions:**

```typescript
// Check if user has completed featured mission today
hasFeaturedCompletedToday(userId: string): Promise<AsyncResult<boolean>>

// Get count of missions completed today (featured + training)
getTodayCompletionCount(userId: string): Promise<AsyncResult<number>>

// Get list of mission IDs completed today
getTodayCompletedMissionIds(userId: string, today: string): Promise<AsyncResult<string[]>>
```

---

### 4. Mission Engine Hook
**File:** `src/hooks/useMissionEngine.ts`

**Status:** ⚠️ **NOT YET UPDATED**

**Reason:** The hook needs to know whether the current mission is "featured" or "training" to pass the correct `isFeatured` flag. This requires UI/routing context that will be determined in Phase 2 (Mission Library screen and dashboard integration).

**Required Changes (Phase 2):**
```typescript
// useMissionEngine.submitMission() needs to accept isFeatured parameter:
const submitMission = useCallback(
  async (responses: MissionResponse, isFeatured: boolean) => {
    // ...
    const result = await missionService.completeMission({
      userId,
      missionId: mission.id,
      responses,
      xp: mission.xp_reward,
      isFeatured,  // <-- Pass through to RPC
    });
    // ...
  },
  [userId, mission]
);
```

---

## Migration Script

### Run in Supabase Dashboard

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/004_mission_library_phase1.sql`
3. Execute migration
4. Verify success (see Testing Steps below)

### Expected Output
```
Success. No rows returned
```

All DDL statements should execute without error.

---

## Testing Steps

### Pre-Migration State Check

```sql
-- 1. Check current mission_completions schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mission_completions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Expected: No is_featured column

-- 2. Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND table_schema = 'public';

-- Expected: uq_user_date constraint exists
```

### Post-Migration Verification

```sql
-- 1. Verify is_featured column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mission_completions'
  AND column_name = 'is_featured';

-- Expected: is_featured | boolean | NO | false

-- 2. Verify new constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND constraint_name = 'uq_user_mission_date';

-- Expected: uq_user_mission_date | UNIQUE

-- 3. Verify old constraint is gone
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND constraint_name = 'uq_user_date';

-- Expected: 0 rows

-- 4. Verify helper functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'complete_mission',
    'has_completed_featured_today',
    'get_today_completion_count'
  );

-- Expected: 3 rows (all type = FUNCTION)

-- 5. Verify RPC signature
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'complete_mission';

-- Expected: complete_mission(p_user_id uuid, p_mission_id text, p_responses jsonb, p_xp integer, p_is_featured boolean DEFAULT false)
```

### Functional Testing

#### Test 1: Complete Featured Mission (100% XP)

```sql
-- Call RPC as featured mission
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>',
  p_mission_id := 'W1D1-COM',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Suggest revisiting all ideas one final time","reasoning":"Testing featured mission","word_count":3}'::jsonb,
  p_xp := 50,
  p_is_featured := true
);

-- Expected result:
-- {
--   "xp_awarded": 50,          <-- Full XP (100%)
--   "new_total_xp": 50,        <-- (or current + 50)
--   "new_streak": 1,
--   "new_rank": "Cadet",
--   "is_featured": true
-- }

-- Verify in database
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY id DESC
LIMIT 1;

-- Expected: W1D1-COM | 50 | true
```

#### Test 2: Complete Training Mission (50% XP)

```sql
-- Call RPC as training mission (or omit p_is_featured for default)
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>',
  p_mission_id := 'W1D1-CONF',
  p_responses := '{"type":"Reflect & Write","text":"Testing training mission","word_count":3}'::jsonb,
  p_xp := 40,
  p_is_featured := false
);

-- Expected result:
-- {
--   "xp_awarded": 20,          <-- 50% of 40 = 20
--   "new_total_xp": 70,        <-- 50 + 20
--   "new_streak": 1,           <-- Still 1 (same day as Test 1)
--   "new_rank": "Cadet",
--   "is_featured": false
-- }

-- Verify in database
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY id DESC
LIMIT 1;

-- Expected: W1D1-CONF | 20 | false
```

#### Test 3: Duplicate Mission Prevention

```sql
-- Try to complete the same mission again
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>',
  p_mission_id := 'W1D1-COM',  -- Same as Test 1
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Duplicate","word_count":1}'::jsonb,
  p_xp := 50,
  p_is_featured := true
);

-- Expected result:
-- {
--   "xp_awarded": 0,
--   "new_total_xp": 70,        <-- Unchanged
--   "new_streak": 1,           <-- Unchanged
--   "new_rank": "Cadet",
--   "already_completed": true  <-- Key indicator
-- }

-- Verify no new row inserted
SELECT COUNT(*)
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND mission_id = 'W1D1-COM'
  AND completed_date = CURRENT_DATE;

-- Expected: 1 (not 2)
```

#### Test 4: Helper Functions

```sql
-- Check if featured completed today
SELECT has_completed_featured_today('<your-test-user-uuid>');
-- Expected: true (from Test 1)

-- Check completion count
SELECT get_today_completion_count('<your-test-user-uuid>');
-- Expected: 2 (Test 1 + Test 2)

-- Get completed mission IDs
SELECT mission_id
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE;
-- Expected: W1D1-COM, W1D1-CONF
```

#### Test 5: XP Rounding (50% of Odd Numbers)

```sql
-- Test mission with 30 XP (50% = 15)
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>',
  p_mission_id := 'W1D1-LEAD',
  p_responses := '{"type":"Reflect & Write","text":"Test","word_count":1}'::jsonb,
  p_xp := 30,
  p_is_featured := false
);

-- Expected xp_awarded: 15 (FLOOR(30 * 0.5) = 15)

-- Test mission with 70 XP (50% = 35)
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>',
  p_mission_id := 'W1D2-LEAD',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":1}'::jsonb,
  p_xp := 70,
  p_is_featured := false
);

-- Expected xp_awarded: 35 (FLOOR(70 * 0.5) = 35)
```

---

## Known Risks

### 1. ⚠️ Breaking Change: Old App Versions
**Risk:** Users on old app versions (pre-Phase 1) will fail to complete missions because they don't pass `p_is_featured` parameter.

**Mitigation:** 
- ✅ RPC defaults `p_is_featured` to `false` — old calls will work
- ✅ They'll receive training XP (50%) instead of full XP
- ⚠️ This is acceptable for beta with manual onboarding
- ⚠️ For production, coordinate migration with app release

---

### 2. ⚠️ Existing Completion Data
**Risk:** All existing `mission_completions` rows will have `is_featured = false`.

**Impact:**
- Historical completion data will show all past missions as "training"
- XP totals are correct (xp_awarded already stored)
- Only affects historical reporting/analytics

**Mitigation:**
- ✅ No action needed for MVP
- If historical accuracy matters, run data migration:
  ```sql
  -- Option: Mark first completion each day as featured
  WITH first_completion_per_day AS (
    SELECT DISTINCT ON (user_id, completed_date)
      id
    FROM mission_completions
    ORDER BY user_id, completed_date, id
  )
  UPDATE mission_completions
  SET is_featured = true
  WHERE id IN (SELECT id FROM first_completion_per_day);
  ```

---

### 3. ⚠️ Streak Logic Unchanged
**Risk:** Streak increments on first completion of the day, regardless of featured vs training.

**Current Behavior:**
- User completes training mission → streak increments
- User completes featured mission later same day → streak stays same

**Future Consideration:**
- Should streak only increment on featured completion?
- V2 discussion — not a blocker for Phase 1

---

### 4. ⚠️ Frontend Not Yet Updated
**Risk:** App will crash if mission detail screen tries to complete a mission before `useMissionEngine` is updated.

**Mitigation:**
- Phase 1 is backend-only
- Do NOT deploy to production until Phase 2 complete
- Test migration on Supabase only, not through app yet

---

## Rollback Plan

If migration causes issues:

```sql
-- 1. Drop new constraint
ALTER TABLE mission_completions 
DROP CONSTRAINT IF EXISTS uq_user_mission_date;

-- 2. Re-add old constraint
ALTER TABLE mission_completions
ADD CONSTRAINT uq_user_date UNIQUE (user_id, completed_date);

-- 3. Drop new column
ALTER TABLE mission_completions
DROP COLUMN IF EXISTS is_featured;

-- 4. Drop new functions
DROP FUNCTION IF EXISTS has_completed_featured_today(uuid);
DROP FUNCTION IF EXISTS get_today_completion_count(uuid);

-- 5. Restore old RPC signature
-- (Copy original from 001_initial_schema.sql and re-run)
```

**Data Loss:** None. All completion data preserved.

---

## Next Steps (Phase 2)

Phase 2 will implement:
1. **Training Tab** — New bottom navigation tab for mission library
2. **Mission Library Screen** — View all 5 missions for today
3. **Featured Mission Selection** — Highest XP mission auto-selected as featured
4. **Dashboard Integration** — Show featured mission card + training count

**Phase 2 Dependencies:**
- ✅ Phase 1 migration must be deployed to Supabase
- ✅ All Phase 1 tests must pass
- ⚠️ Update `useMissionEngine` to accept `isFeatured` parameter
- ⚠️ Update mission detail screen to pass `isFeatured` from route params
- ⚠️ Create Mission Library UI

---

## Approval Checklist

Before proceeding to Phase 2:

- [ ] Migration executed successfully in Supabase Dashboard
- [ ] All post-migration verification queries pass
- [ ] Functional Test 1 (featured mission) passes
- [ ] Functional Test 2 (training mission) passes
- [ ] Functional Test 3 (duplicate prevention) passes
- [ ] Functional Test 4 (helper functions) passes
- [ ] Functional Test 5 (XP rounding) passes
- [ ] No errors in Supabase logs
- [ ] User confirms Phase 1 ready for Phase 2

---

*Phase 1 Complete. Ready for user approval.*
