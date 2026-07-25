# SECURITY FIXES APPLIED ✅
## Server-Authoritative XP and Featured Mission Selection

**Date:** June 13, 2026  
**Status:** ✅ Complete — Ready for Testing

---

## Executive Summary

Applied **critical security fixes** to prevent XP manipulation and featured mission exploits. The server now has complete authority over XP calculation and featured mission determination.

### Changes Made

**✅ FIX #1: Server-Authoritative XP**
- Removed `p_xp` parameter from `complete_mission()` RPC
- Server fetches XP directly from `missions.xp_reward` table
- Client cannot manipulate XP values

**✅ FIX #2: Server-Authoritative Featured Selection**
- Removed `p_is_featured` parameter from `complete_mission()` RPC
- Server determines featured mission (highest XP per week/day)
- Server enforces 1 featured mission per day limit
- Client cannot lie about featured status

**✅ POLICY DECISIONS IMPLEMENTED:**
- Streak increments on ANY completed mission (not just featured)
- No daily cap (all 5 missions available)
- Featured mission = highest XP per week/day

---

## Files Modified

### 1. Database Migration
**File:** `supabase/migrations/004_mission_library_secure.sql`

**New schema:**
- `mission_completions.is_featured` column (server-set, not client)
- `uq_user_mission_date` constraint (allows multiple missions/day)

**New functions:**
- `get_featured_mission_id(week, day)` — Returns mission ID with highest XP
- `has_completed_featured_today(user_id)` — Check featured completion
- `get_today_completion_count(user_id)` — Count today's completions

**Updated RPC:**
```sql
-- OLD (insecure)
complete_mission(p_user_id, p_mission_id, p_responses, p_xp, p_is_featured)

-- NEW (secure)
complete_mission(p_user_id, p_mission_id, p_responses)
```

---

### 2. TypeScript Service
**File:** `src/services/mission.service.ts`

**Function signature change:**
```typescript
// OLD (insecure)
completeMission({
  userId: string,
  missionId: string,
  responses: MissionResponse,
  xp: number,            // ❌ Client-controlled
  isFeatured: boolean    // ❌ Client-controlled
})

// NEW (secure)
completeMission({
  userId: string,
  missionId: string,
  responses: MissionResponse
  // ✅ Server determines XP and featured status
})
```

---

### 3. Mission Engine Hook
**File:** `src/hooks/useMissionEngine.ts`

**Updated submitMission():**
- Removed `xp: mission.xp_reward` parameter
- Removed `isFeatured` logic (server handles)
- Added `is_featured` to success screen params (server-returned)

---

## Attack Scenarios Prevented

### ❌ ATTACK #1: XP Manipulation (NOW PREVENTED)

**Before (vulnerable):**
```typescript
// Malicious client
await supabase.rpc('complete_mission', {
  p_xp: 9999  // ❌ Client controls XP
});
// Result: User gets 9999 XP, reaches Commander in 1 mission
```

**After (secure):**
```typescript
// Client cannot pass XP
await supabase.rpc('complete_mission', {
  p_mission_id: 'W1D1-COM'
  // Server fetches XP from missions table
});
```

**Server logic:**
```sql
-- RPC fetches XP from database
SELECT xp_reward INTO v_base_xp
FROM missions
WHERE id = p_mission_id;

-- Client input ignored

IF v_base_xp IS NULL THEN
  RAISE EXCEPTION 'Mission not found';
END IF;
```

**Verdict:** ✅ **XP manipulation impossible.**

---

### ❌ ATTACK #2: Featured Mission Exploit (NOW PREVENTED)

**Before (vulnerable):**
```typescript
// Malicious client marks all 5 missions as featured
for (let mission of missions) {
  await supabase.rpc('complete_mission', {
    p_mission_id: mission.id,
    p_xp: mission.xp_reward,
    p_is_featured: true  // ❌ Client claims all are featured
  });
}
// Result: 5 × 100% XP = 220+ XP/day instead of 135 XP
```

**After (secure):**
```typescript
// Client cannot specify featured status
await supabase.rpc('complete_mission', {
  p_mission_id: mission.id
  // Server determines if this is THE featured mission
});
```

**Server logic:**
```sql
-- Step 1: Server determines featured mission
v_featured_id := get_featured_mission_id(v_mission_week, v_mission_day);
-- Returns mission with highest XP (e.g., W1D1-COM = 50 XP)

-- Step 2: Check if this mission is featured
v_is_featured := (p_mission_id = v_featured_id);

-- Step 3: Enforce one featured per day
IF v_is_featured = true THEN
  IF EXISTS (
    SELECT 1 FROM mission_completions
    WHERE user_id = p_user_id
      AND completed_date = v_today
      AND is_featured = true
  ) THEN
    RAISE EXCEPTION 'Featured mission already completed today';
  END IF;
END IF;

-- Step 4: Calculate XP
IF v_is_featured THEN
  v_awarded_xp := v_base_xp;  -- 100%
ELSE
  v_awarded_xp := FLOOR(v_base_xp * 0.5);  -- 50%
END IF;
```

**Verdict:** ✅ **Featured exploit impossible. Only 1 featured mission per day enforced server-side.**

---

## Featured Mission Selection Logic

### Algorithm

**Server determines featured mission for each week/day:**

```sql
SELECT id
FROM missions
WHERE week_number = p_week_number
  AND unlock_day = p_unlock_day
ORDER BY 
  xp_reward DESC,           -- 1. Highest XP first
  CASE category             -- 2. Category tiebreaker
    WHEN 'Officer Thinking' THEN 1
    WHEN 'Leadership' THEN 2
    WHEN 'Awareness' THEN 3
    WHEN 'Confidence' THEN 4
    WHEN 'Communication' THEN 5
    ELSE 6
  END
LIMIT 1;
```

**Examples from Week 1:**

| Day | Missions (XP) | Featured | Reason |
|---|---|---|---|
| D1 | COM(50), CONF(40), LEAD(30), AWR(40), OT(60) | OT (60) | Highest XP |
| D2 | CONF(50), COM(60), AWR(30), LEAD(70), OT(40) | LEAD (70) | Highest XP |
| D3 | LEAD(50), COM(40), CONF(60), AWR(40), OT(30) | CONF (60) | Highest XP |
| D4 | OT(90), COM(40), CONF(50), AWR(60), LEAD(40) | OT (90) | Highest XP |
| D5 | AWR(50), OT(40), COM(30), CONF(40), LEAD(60) | LEAD (60) | Highest XP |
| D6 | CONF(80), LEAD(40), AWR(50), COM(50), OT(60) | CONF (80) | Highest XP |
| D7 | OT(60), COM(40), CONF(30), LEAD(50), AWR(40) | OT (60) | Highest XP |

**Key property:** Featured mission is deterministic and server-authoritative.

---

## Testing Procedures

### Test 1: Server Determines XP (Cannot Be Manipulated)

**Goal:** Verify server ignores any client XP value and fetches from database.

**Steps:**
```sql
-- Run in Supabase SQL Editor
-- Replace <your-uuid> with actual user ID

-- Complete W1D1-COM (base XP = 50)
SELECT complete_mission(
  p_user_id := '<your-uuid>'::uuid,
  p_mission_id := 'W1D1-COM',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":2}'::jsonb
);

-- Expected result:
-- {
--   "xp_awarded": 50,        -- Full XP (this is featured mission for W1D1)
--   "is_featured": true,
--   "base_xp": 50,
--   ...
-- }

-- Verify in database
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY id DESC LIMIT 1;

-- Expected: W1D1-COM | 50 | true
```

**Pass criteria:** XP awarded = 50 (matches missions.xp_reward), not any other value.

---

### Test 2: Server Determines Featured Mission

**Goal:** Verify server correctly identifies highest XP mission as featured.

**Steps:**
```sql
-- W1D1 missions: COM(50), CONF(40), LEAD(30), AWR(40), OT(60)
-- Expected featured: OT (60 XP)

-- Complete OT mission
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-OT',
  '{"type":"Daily Challenge","completed":true,"reflection":"Test"}'::jsonb
);

-- Expected: is_featured = true, xp_awarded = 60

-- Complete COM mission (not featured)
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-COM',
  '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":2}'::jsonb
);

-- Expected: is_featured = false, xp_awarded = 25 (50% of 50)

-- Verify
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY is_featured DESC, mission_id;
```

**Pass criteria:**
- W1D1-OT: is_featured = true, xp = 60
- W1D1-COM: is_featured = false, xp = 25

---

### Test 3: Enforce One Featured Per Day

**Goal:** Verify server prevents completing 2nd featured mission.

**Steps:**
```sql
-- Already completed W1D1-OT as featured (from Test 2)

-- Try to complete another mission that would normally be featured
-- (Trick: Try on a day where we haven't completed featured yet)

-- Day 1: Complete OT (featured)
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-OT',
  '{"type":"Daily Challenge","completed":true,"reflection":"Test"}'::jsonb
);
-- Expected: Success, is_featured = true

-- Same day: Try to manually trigger featured logic by completing highest XP mission again
-- (This shouldn't matter since server determines, but test enforcement)

-- The RPC checks: "Has user completed ANY featured mission today?"
-- This check happens BEFORE determining if current mission is featured
-- So even if we try a different mission, if we've already done featured, all others are training

-- Complete CONF mission
SELECT complete_mission(
  '<your-uuid>'::uuid,
  'W1D1-CONF',
  '{"type":"Reflect & Write","text":"Test","word_count":1}'::jsonb
);

-- Expected: is_featured = false, xp = 20 (50% of 40)
-- This is training even though we're completing it, because OT already took featured slot
```

**Pass criteria:** Only 1 mission per day has `is_featured = true`.

---

### Test 4: XP Calculation (Featured vs Training)

**Goal:** Verify 100% vs 50% XP calculation.

**Test cases:**

| Mission | Base XP | Expected Featured | Expected Training |
|---|---|---|---|
| W1D1-OT | 60 | 60 (100%) | 30 (50%) |
| W1D1-COM | 50 | 50 (100%) | 25 (50%) |
| W1D1-CONF | 40 | 40 (100%) | 20 (50%) |
| W1D1-LEAD | 30 | 30 (100%) | 15 (50%) |
| W1D2-LEAD | 70 | 70 (100%) | 35 (50%) |
| W1D4-OT | 90 | 90 (100%) | 45 (50%) |

**SQL test:**
```sql
-- Complete W1D2-LEAD as featured
SELECT complete_mission('<your-uuid>'::uuid, 'W1D2-LEAD', '{}'::jsonb);
-- Expected: xp_awarded = 70, is_featured = true

-- Complete W1D2-COM as training
SELECT complete_mission('<your-uuid>'::uuid, 'W1D2-COM', '{}'::jsonb);
-- Expected: xp_awarded = 30 (50% of 60), is_featured = false
```

**Pass criteria:** All XP values match expected calculation.

---

### Test 5: Duplicate Mission Prevention

**Goal:** Verify cannot complete same mission twice in one day.

**Steps:**
```sql
-- Complete W1D1-COM
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-COM', '{}'::jsonb);
-- Expected: Success

-- Try again
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-COM', '{}'::jsonb);
-- Expected: already_completed = true, xp_awarded = 0
```

**Pass criteria:** 2nd attempt returns `already_completed: true`, no XP awarded.

---

### Test 6: Multiple Missions Per Day

**Goal:** Verify user can complete up to 5 missions in one day.

**Steps:**
```sql
-- Complete all 5 W1D1 missions
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-OT', '{}'::jsonb);
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-COM', '{}'::jsonb);
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-CONF', '{}'::jsonb);
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-LEAD', '{}'::jsonb);
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-AWR', '{}'::jsonb);

-- Check count
SELECT get_today_completion_count('<your-uuid>'::uuid);
-- Expected: 5

-- Check XP totals
SELECT 
  SUM(xp_awarded) as total_daily_xp,
  SUM(CASE WHEN is_featured THEN xp_awarded ELSE 0 END) as featured_xp,
  SUM(CASE WHEN NOT is_featured THEN xp_awarded ELSE 0 END) as training_xp
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE;

-- Expected (W1D1):
-- total_daily_xp = 135 (60 + 25 + 20 + 15 + 20)
-- featured_xp = 60 (OT)
-- training_xp = 75 (COM 25 + CONF 20 + LEAD 15 + AWR 20)
```

**Pass criteria:** All 5 missions complete, total XP = 135.

---

### Test 7: Streak Increments on Any Mission

**Goal:** Verify streak increments on first mission of day (any mission, not just featured).

**Scenario A: Featured first**
```sql
-- Day 1: Complete featured mission first
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-OT', '{}'::jsonb);
-- Expected: new_streak = (previous + 1)

-- Day 1: Complete training mission later
SELECT complete_mission('<your-uuid>'::uuid, 'W1D1-COM', '{}'::jsonb);
-- Expected: new_streak = same (no increment, already active today)
```

**Scenario B: Training first**
```sql
-- Day 2: Complete training mission first
SELECT complete_mission('<your-uuid>'::uuid, 'W1D2-COM', '{}'::jsonb);
-- Expected: new_streak = (previous + 1)  ✅ Streak increments on training

-- Day 2: Complete featured mission later
SELECT complete_mission('<your-uuid>'::uuid, 'W1D2-LEAD', '{}'::jsonb);
-- Expected: new_streak = same (no increment, already active today)
```

**Pass criteria:** Streak increments on FIRST mission of day, regardless of featured/training status.

---

## Security Checklist

**Before deploying to production:**

- [ ] Test 1: Server determines XP (passes)
- [ ] Test 2: Server determines featured mission (passes)
- [ ] Test 3: One featured per day enforced (passes)
- [ ] Test 4: XP calculation correct (passes)
- [ ] Test 5: Duplicate prevention works (passes)
- [ ] Test 6: Multiple missions per day allowed (passes)
- [ ] Test 7: Streak policy correct (passes)
- [ ] Client code cannot pass `xp` parameter
- [ ] Client code cannot pass `isFeatured` parameter
- [ ] RPC validates mission_id exists in database
- [ ] RPC enforces featured mission limit
- [ ] No console errors in client
- [ ] No errors in Supabase logs

---

## Migration Steps

1. **Backup current database** (if running on production data)
2. Open Supabase Dashboard → SQL Editor
3. Copy entire contents of `supabase/migrations/004_mission_library_secure.sql`
4. Execute migration
5. Verify: `SELECT * FROM information_schema.columns WHERE table_name = 'mission_completions' AND column_name = 'is_featured';`
6. Expected: 1 row returned
7. Run Test 1-7 above
8. Deploy updated app code (service + hook changes)

---

## Rollback Plan

If issues occur:

```sql
-- 1. Drop new functions
DROP FUNCTION IF EXISTS get_featured_mission_id(smallint, smallint);
DROP FUNCTION IF EXISTS has_completed_featured_today(uuid);
DROP FUNCTION IF EXISTS get_today_completion_count(uuid);

-- 2. Drop new constraint
ALTER TABLE mission_completions DROP CONSTRAINT IF EXISTS uq_user_mission_date;

-- 3. Restore old constraint
ALTER TABLE mission_completions ADD CONSTRAINT uq_user_date UNIQUE (user_id, completed_date);

-- 4. Drop new column
ALTER TABLE mission_completions DROP COLUMN IF EXISTS is_featured;

-- 5. Restore old RPC (copy from 001_initial_schema.sql)
```

---

*Security fixes complete. Server now has full authority over XP and featured mission selection.*
