# VALIDATION MANUAL TEST GUIDE
## Step-by-Step Testing Instructions

**Purpose:** Verify all security fixes and functionality before Phase 2  
**Time Required:** 15-20 minutes

---

## Prerequisites

1. ✅ Migration `004_mission_library_secure.sql` executed successfully
2. ✅ No errors in Supabase logs
3. ✅ You have your user UUID ready

---

## Getting Your User UUID

```sql
-- Run in Supabase SQL Editor
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'display_name' as display_name
FROM auth.users
LIMIT 5;
```

Copy your UUID (looks like: `123e4567-e89b-12d3-a456-426614174000`)

---

## Option A: Automated Test Suite (Recommended)

### Step 1: Prepare Test Script

1. Open `VALIDATION_TEST_SUITE.sql`
2. Find line 16: `\set test_user_id '''YOUR-USER-UUID-HERE'''`
3. Replace `YOUR-USER-UUID-HERE` with your actual UUID
4. Save the file

### Step 2: Run Tests

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `VALIDATION_TEST_SUITE.sql`
3. Paste and click **Run**
4. Wait for all tests to complete (~30 seconds)

### Step 3: Review Results

Look for these test results:

```
✅ TEST 1: Server-Authoritative XP → PASS
✅ TEST 2: Server Determines Featured Mission → PASS
✅ TEST 3: Training Mission XP (50%) → PASS
✅ TEST 4: One Featured Per Day Enforcement → PASS
✅ TEST 5: Multiple Missions Per Day → PASS
✅ TEST 6: Duplicate Mission Prevention → PASS
✅ TEST 7: Total XP Calculation → PASS
✅ TEST 8: Streak Calculation → PASS
✅ TEST 9: Rank Progression → PASS
✅ TEST 10: Featured Mission Determinism → PASS
```

**All tests must show ✅ PASS**

---

## Option B: Manual Step-by-Step Tests

If automated suite fails or you want to run tests manually:

### Test 1: Server Determines XP

**Goal:** Verify server fetches XP from missions table

```sql
-- Replace <your-uuid> with your actual UUID

-- Clear previous completions
DELETE FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE;

-- Complete mission
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-COM',
  '{}'::jsonb
);

-- Check result
SELECT 
  mc.mission_id,
  m.xp_reward as expected,
  mc.xp_awarded as actual,
  CASE WHEN mc.xp_awarded = m.xp_reward THEN '✅ PASS' ELSE '❌ FAIL' END
FROM mission_completions mc
JOIN missions m ON m.id = mc.mission_id
WHERE mc.user_id = '<your-uuid>'
  AND mc.mission_id = 'W1D1-COM'
  AND mc.completed_date = CURRENT_DATE;
```

**Expected:** `xp_awarded = 50` (matches missions table)

---

### Test 2: Featured Mission Selection

**Goal:** Verify server selects highest XP mission as featured

```sql
-- Check W1D1 featured mission
SELECT get_featured_mission_id(1, 1) as featured_mission;
-- Expected: W1D1-OT (60 XP = highest)

-- Complete featured mission
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-OT',
  '{}'::jsonb
);

-- Verify featured status
SELECT 
  mission_id,
  is_featured,
  xp_awarded,
  CASE WHEN is_featured = true AND xp_awarded = 60 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND mission_id = 'W1D1-OT'
  AND completed_date = CURRENT_DATE;
```

**Expected:** `is_featured = true`, `xp_awarded = 60`

---

### Test 3: Training Mission (50% XP)

```sql
-- Complete training mission (CONF = 40 XP base)
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-CONF',
  '{}'::jsonb
);

-- Verify 50% XP
SELECT 
  mission_id,
  is_featured,
  xp_awarded,
  CASE WHEN is_featured = false AND xp_awarded = 20 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND mission_id = 'W1D1-CONF'
  AND completed_date = CURRENT_DATE;
```

**Expected:** `is_featured = false`, `xp_awarded = 20` (50% of 40)

---

### Test 4: One Featured Per Day

```sql
-- Count featured missions
SELECT 
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
  CASE WHEN COUNT(*) FILTER (WHERE is_featured = true) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE;
```

**Expected:** `featured_count = 1`

---

### Test 5: Multiple Missions Per Day

```sql
-- Complete more missions
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-LEAD', '{}'::jsonb);
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-AWR', '{}'::jsonb);
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-COM', '{}'::jsonb);

-- Count total
SELECT 
  COUNT(*) as total,
  CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE;
```

**Expected:** `total = 5`

---

### Test 6: Duplicate Prevention

```sql
-- Try to complete same mission again
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-COM',
  '{}'::jsonb
);
-- Expected: Returns with already_completed = true

-- Verify count unchanged
SELECT COUNT(*) as total
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE;
```

**Expected:** `total = 5` (not 6)

---

### Test 7: Total XP Calculation

```sql
-- W1D1 completions:
-- OT: 60 (featured 100%)
-- CONF: 20 (training 50% of 40)
-- LEAD: 15 (training 50% of 30)
-- AWR: 20 (training 50% of 40)
-- COM: 25 (training 50% of 50)
-- Expected total: 140

SELECT 
  total_xp,
  CASE WHEN total_xp = 140 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users
WHERE id = '<your-uuid>';
```

**Expected:** `total_xp = 140`

---

### Test 8: Streak Calculation

```sql
SELECT 
  current_streak,
  last_active_date,
  CASE WHEN current_streak >= 1 THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users
WHERE id = '<your-uuid>';
```

**Expected:** `current_streak >= 1`

---

### Test 9: Rank Thresholds

```sql
-- Check rank at 140 XP (should be Cadet)
SELECT 
  current_rank,
  total_xp,
  CASE WHEN current_rank = 'Cadet' THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users
WHERE id = '<your-uuid>';

-- Manually set to 400 XP
UPDATE users SET total_xp = 350 WHERE id = '<your-uuid>';

-- Complete one more mission to trigger rank update
SELECT complete_mission('<your-uuid>'::uuid, 'W1D2-COM', '{}'::jsonb);

-- Check rank at 400+ XP (should be Officer)
SELECT 
  current_rank,
  total_xp,
  CASE WHEN current_rank = 'Officer' THEN '✅ PASS' ELSE '❌ FAIL' END
FROM users
WHERE id = '<your-uuid>';
```

**Expected:** Cadet → Officer at 400 XP

---

### Test 10: Featured Determinism

```sql
-- Check featured missions for multiple days
SELECT 
  week_number,
  unlock_day,
  get_featured_mission_id(week_number, unlock_day) as featured,
  (SELECT xp_reward FROM missions 
   WHERE id = get_featured_mission_id(week_number, unlock_day)) as featured_xp,
  (SELECT MAX(xp_reward) FROM missions m2 
   WHERE m2.week_number = missions.week_number 
   AND m2.unlock_day = missions.unlock_day) as max_xp
FROM (
  SELECT DISTINCT week_number, unlock_day
  FROM missions
  WHERE week_number = 1
  ORDER BY unlock_day
  LIMIT 7
) missions;
```

**Expected:** `featured_xp = max_xp` for all rows (featured is always highest)

---

## Test Results Template

Copy this and fill in after running tests:

```
VALIDATION TEST RESULTS
Date: _____________
Tester: _____________

[ ] TEST 1: Server-Authoritative XP ......... PASS / FAIL
[ ] TEST 2: Featured Mission Selection ...... PASS / FAIL
[ ] TEST 3: Training Mission XP (50%) ....... PASS / FAIL
[ ] TEST 4: One Featured Per Day ............ PASS / FAIL
[ ] TEST 5: Multiple Missions Per Day ....... PASS / FAIL
[ ] TEST 6: Duplicate Prevention ............ PASS / FAIL
[ ] TEST 7: Total XP Calculation ............ PASS / FAIL
[ ] TEST 8: Streak Calculation .............. PASS / FAIL
[ ] TEST 9: Rank Progression ................ PASS / FAIL
[ ] TEST 10: Featured Determinism ........... PASS / FAIL

ALL TESTS PASSED: YES / NO

Notes:
_____________________________________________
_____________________________________________
```

---

## If Any Test Fails

1. **Note which test failed**
2. **Copy the error message**
3. **Check Supabase logs:** Dashboard → Logs → Postgres Logs
4. **Review:** `SECURITY_FIXES_APPLIED.md` for expected behavior
5. **Do NOT proceed to Phase 2**
6. **Report failure with:**
   - Test number
   - Expected result
   - Actual result
   - Error message (if any)

---

## After All Tests Pass

✅ Mark tests as complete in `PHASE1_SECURITY_INDEX.md`  
✅ Ready to proceed to Phase 2  
✅ Notify that validation is complete

---

*Run tests carefully and verify each result before proceeding.*
