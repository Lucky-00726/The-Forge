# MISSION LIBRARY DATABASE VALIDATION REPORT

**Date:** 2026-06-13  
**Purpose:** Validate whether Mission Library (5 missions/day) can be implemented without database changes  
**Status:** ANALYSIS COMPLETE  

---

## EXECUTIVE SUMMARY

**❌ CANNOT BE IMPLEMENTED WITHOUT DATABASE CHANGES**

The current schema has a **BLOCKING CONSTRAINT** that prevents multiple mission completions per day.

**Critical Issue:**
```sql
constraint uq_user_date unique (user_id, completed_date)
```

This constraint **MUST BE REMOVED OR REPLACED** to allow 5 missions per day.

**Minimal Migration Required:**
1. Drop existing `uq_user_date` constraint
2. Add new `uq_user_mission_date` constraint
3. Update RPC function error handling
4. No data migration needed (existing completions unaffected)

---

## CURRENT DATABASE SCHEMA

### mission_completions Table

```sql
create table public.mission_completions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null
                              references public.users(id)
                              on delete cascade,
  mission_id      text        not null
                              references public.missions(id),
  completed_date  date        not null,    -- IST calendar date
  xp_awarded      smallint    not null,
  responses       jsonb,                    -- raw user answers

  -- ❌ BLOCKING CONSTRAINT
  constraint uq_user_date unique (user_id, completed_date)
);
```

**Comment from schema:**
> "Core invariant: one mission completion per user per calendar day"

**Problem:** This constraint explicitly limits users to **ONE completion per day**.


### Current Constraints

**Primary Key:**
```sql
id uuid primary key default gen_random_uuid()
```
✅ No issue - allows unlimited rows

**Foreign Keys:**
```sql
user_id uuid references public.users(id) on delete cascade
mission_id text references public.missions(id)
```
✅ No issue - allows same user multiple times

**Unique Constraint (BLOCKING):**
```sql
constraint uq_user_date unique (user_id, completed_date)
```
❌ **BLOCKS multiple completions per day**

**Index:**
```sql
create index idx_completions_user_date
  on public.mission_completions (user_id, completed_date desc);
```
✅ No issue - index is fine, only constraint blocks

---

## CURRENT RPC BEHAVIOR

### complete_mission() Function

**Function Signature:**
```sql
create or replace function public.complete_mission(
  p_user_id    uuid,
  p_mission_id text,
  p_responses  jsonb,
  p_xp         integer
)
returns jsonb
```

**Key Logic:**

#### 1. Row Locking (Prevents Concurrent Completions)
```sql
select last_active_date, current_streak
into   v_last_active, v_old_streak
from   public.users
where  id = p_user_id
for update;  -- ✅ Row lock - good for concurrency
```

#### 2. INSERT Attempt
```sql
insert into public.mission_completions (
  user_id,
  mission_id,
  completed_date,
  xp_awarded,
  responses
) values (
  p_user_id,
  p_mission_id,
  v_today,
  p_xp,
  p_responses
);
```

**If `uq_user_date` violated:**
- Throws `unique_violation` error (23505)
- Caught in exception handler
- Returns `already_completed: true`

#### 3. Exception Handler (Current)
```sql
exception
  when unique_violation then
    -- Already completed today — return current state
    return jsonb_build_object(
      'xp_awarded',   0,
      'new_total_xp', total_xp,
      'new_streak',   current_streak,
      'new_rank',     current_rank,
      'already_completed', true
    );
```

**Problem:** This assumes ANY completion today means "already done"

**For 5 missions/day:** Need to check if THIS SPECIFIC mission was completed


---

## CURRENT STREAK CALCULATION LOGIC

### From complete_mission() RPC

```sql
-- ── Calculate new streak ──────────────────────────────────
v_new_streak :=
  case
    -- Already completed today
    when v_last_active = v_today then
      v_old_streak
    -- Completed yesterday → increment
    when v_last_active = v_today - interval '1 day' then
      v_old_streak + 1
    -- First ever mission
    when v_last_active is null then
      1
    -- Gap > 1 day → reset
    else
      1
  end;
```

**Streak Logic:**
- ✅ Based on `last_active_date` (date of last completion)
- ✅ Increments if yesterday's date
- ✅ Resets if > 1 day gap
- ⚠️ **Does NOT distinguish between mission types**

**Current Behavior:**
- Any mission completion updates `last_active_date`
- Streak continues as long as daily completions exist
- Does NOT require specific "featured" mission

**For 5 Missions/Day:**
- Needs modification to track WHICH mission maintains streak
- Proposal: Only "featured" mission should affect streak
- Library missions should NOT update `last_active_date`

**Impact:** RPC function MUST be updated to distinguish featured vs library missions

---

## CURRENT COMPLETION CHECK LOGIC

### From mission.service.ts

```typescript
export async function checkTodayCompletion(
  userId: string,
  today: string, // YYYY-MM-DD IST
): Promise<AsyncResult<boolean>> {
  const { data, error } = await supabase
    .from('mission_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('completed_date', today)
    .maybeSingle();  // ❌ Assumes single row per day

  if (error) {
    return { success: false, error: normalizeError(error) };
  }

  return { success: true, data: !!data };
}
```

**Problem:** 
- Uses `.maybeSingle()` which expects 0 or 1 row
- Returns boolean: "completed today" (any mission)
- Does NOT check WHICH mission was completed

**For 5 Missions/Day:**
- Must check specific mission: `.eq('mission_id', missionId)`
- Use `.maybeSingle()` for specific mission check
- OR return array of completed mission IDs

**Required Change:**
```typescript
// NEW: Check if specific mission completed today
export async function checkMissionCompletion(
  userId: string,
  missionId: string,
  today: string
): Promise<AsyncResult<boolean>> {
  const { data, error } = await supabase
    .from('mission_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_id', missionId)  // ← Check specific mission
    .eq('completed_date', today)
    .maybeSingle();
  
  return { success: true, data: !!data };
}
```


---

## CAN 5 MISSIONS/DAY BE IMPLEMENTED WITHOUT DATABASE CHANGES?

### ❌ NO - DATABASE MIGRATION REQUIRED

**Reason:** The `uq_user_date` constraint is a **hard blocker** at the database level.

**Evidence:**
```sql
constraint uq_user_date unique (user_id, completed_date)
```

**Attempt to insert 2nd completion same day:**
```sql
-- First mission completion (succeeds)
INSERT INTO mission_completions (user_id, mission_id, completed_date, ...)
VALUES ('user-123', 'COM-001', '2026-06-13', ...);
-- ✅ Success

-- Second mission completion (FAILS)
INSERT INTO mission_completions (user_id, mission_id, completed_date, ...)
VALUES ('user-123', 'LEAD-001', '2026-06-13', ...);
-- ❌ ERROR: duplicate key value violates unique constraint "uq_user_date"
-- DETAIL: Key (user_id, completed_date)=(user-123, 2026-06-13) already exists.
```

**Constraint is enforced by PostgreSQL, not application code.**

**Cannot be bypassed by:**
- Client-side logic changes ❌
- RPC updates alone ❌
- Application-level checks ❌
- Different query patterns ❌

**Must be changed at database level:** ✅

---

## MINIMAL MIGRATION REQUIRED

### Migration Script

```sql
-- ═════════════════════════════════════════════════════════════
-- Migration: Enable Multiple Mission Completions Per Day
-- Purpose: Allow users to complete up to 5 missions daily
-- ═════════════════════════════════════════════════════════════

-- Step 1: Drop existing constraint
ALTER TABLE public.mission_completions
DROP CONSTRAINT uq_user_date;

-- Step 2: Add new constraint (prevent duplicate mission completion same day)
ALTER TABLE public.mission_completions
ADD CONSTRAINT uq_user_mission_date 
UNIQUE (user_id, mission_id, completed_date);

-- Comment
COMMENT ON CONSTRAINT uq_user_mission_date 
ON public.mission_completions IS
'Allows multiple missions per day, but prevents duplicate completion of same mission on same day.';
```

**Migration Safety:**
- ✅ No data changes required
- ✅ Existing rows unaffected (already satisfy new constraint)
- ✅ Reversible if needed
- ✅ No downtime (constraint swap is fast)
- ✅ Indexes remain valid

**Rollback Script (if needed):**
```sql
-- Revert to single mission per day
ALTER TABLE public.mission_completions
DROP CONSTRAINT uq_user_mission_date;

ALTER TABLE public.mission_completions
ADD CONSTRAINT uq_user_date 
UNIQUE (user_id, completed_date);
```


### RPC Function Update Required

**Current Exception Handler:**
```sql
exception
  when unique_violation then
    -- Assumes ANY unique violation = already completed today
    return jsonb_build_object(
      'already_completed', true,
      ...
    );
```

**Updated Exception Handler:**
```sql
exception
  when unique_violation then
    -- After constraint change, unique_violation means THIS SPECIFIC mission
    -- was already completed today (not just "any mission today")
    return jsonb_build_object(
      'already_completed', true,
      'message', 'You have already completed this mission today.',
      'xp_awarded', 0,
      'new_total_xp', (SELECT total_xp FROM users WHERE id = p_user_id),
      'new_streak', (SELECT current_streak FROM users WHERE id = p_user_id),
      'new_rank', (SELECT current_rank FROM users WHERE id = p_user_id)
    );
```

**No logic change needed** - just error message clarity.

---

## ADDITIONAL CHANGES REQUIRED

### 1. Streak Logic Update

**Current:** Any mission completion updates `last_active_date`

**Proposed:** Only "featured" mission updates `last_active_date`

**Implementation Option A: Add `is_featured` Parameter**
```sql
create or replace function public.complete_mission(
  p_user_id     uuid,
  p_mission_id  text,
  p_responses   jsonb,
  p_xp          integer,
  p_is_featured boolean default false  -- ← NEW parameter
)
```

**Streak logic:**
```sql
-- Only update last_active_date if featured mission
IF p_is_featured THEN
  UPDATE users
  SET last_active_date = v_today,
      current_streak = v_new_streak,
      ...
  WHERE id = p_user_id;
ELSE
  -- Library mission: update XP and rank, but NOT streak
  UPDATE users
  SET total_xp = total_xp + p_xp,
      current_rank = CASE
        WHEN total_xp + p_xp >= 1200 THEN 'Commander'
        WHEN total_xp + p_xp >= 400 THEN 'Officer'
        ELSE 'Cadet'
      END
  WHERE id = p_user_id;
END IF;
```

**Implementation Option B: Check Mission Table**
```sql
-- Query missions table to determine if featured
SELECT is_featured INTO v_is_featured
FROM missions
WHERE id = p_mission_id;

-- Requires adding is_featured column to missions table
-- NOT RECOMMENDED (adds schema complexity)
```

**Recommendation:** Option A (pass `is_featured` as parameter from client)

### 2. Client-Side Service Updates

**mission.service.ts - New Functions:**

```typescript
// Get all completed mission IDs for today
export async function getTodayCompletions(
  userId: string,
  today: string
): Promise<AsyncResult<string[]>> {
  const { data, error } = await supabase
    .from('mission_completions')
    .select('mission_id')
    .eq('user_id', userId)
    .eq('completed_date', today);
  
  if (error) {
    return { success: false, error: normalizeError(error) };
  }
  
  return { 
    success: true, 
    data: data?.map(c => c.mission_id) || [] 
  };
}

// Check if specific mission completed today
export async function checkMissionCompletion(
  userId: string,
  missionId: string,
  today: string
): Promise<AsyncResult<boolean>> {
  const { data, error } = await supabase
    .from('mission_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .eq('completed_date', today)
    .maybeSingle();
  
  if (error) {
    return { success: false, error: normalizeError(error) };
  }
  
  return { success: true, data: !!data };
}

// Complete mission with featured flag
export async function completeMission(payload: {
  userId: string;
  missionId: string;
  responses: MissionResponse;
  xp: number;
  isFeatured: boolean;  // ← NEW parameter
}): Promise<AsyncResult<CompleteMissionResult>> {
  const { data, error } = await supabase.rpc('complete_mission', {
    p_user_id: payload.userId,
    p_mission_id: payload.missionId,
    p_responses: payload.responses,
    p_xp: payload.xp,
    p_is_featured: payload.isFeatured,  // ← Pass to RPC
  });
  
  // ... rest of function
}
```


---

## XP PROGRESSION IMPACT ANALYSIS

### Current System (1 Mission/Day)

**Rank Thresholds:**
```
Cadet:     0 XP
Officer:   400 XP
Commander: 1,200 XP
```

**XP Rewards by Category (from seed data analysis):**
```
Communication:    40-60 XP (avg: 50 XP)
Confidence:       40-70 XP (avg: 55 XP)
Leadership:       50-90 XP (avg: 70 XP)
Awareness:        30-50 XP (avg: 40 XP)
Officer Thinking: 50-80 XP (avg: 65 XP)

Overall Average: ~56 XP/mission
```

**Current Progression:**

**Cadet → Officer (400 XP required):**
```
400 XP ÷ 56 XP/day = 7.14 days
```

**Officer → Commander (800 XP more):**
```
800 XP ÷ 56 XP/day = 14.29 days
```

**Total to Commander (1,200 XP):**
```
1,200 XP ÷ 56 XP/day = 21.43 days (~3 weeks)
```

---

### Proposed System (5 Missions/Day)

**User Behavior Scenarios:**

#### Scenario 1: Casual User (Featured Only)
**Missions/Day:** 1  
**XP/Day:** 56 XP (unchanged)  
**Time to Officer:** 7.1 days  
**Time to Commander:** 21.4 days  
**Impact:** ✅ No change

#### Scenario 2: Moderate User (Featured + 1-2 Library)
**Missions/Day:** 2-3  
**XP/Day:** 112-168 XP (2-3x)

**Calculation (2.5 missions avg):**
```
Cadet → Officer:
400 XP ÷ 140 XP/day = 2.86 days

Officer → Commander:
800 XP ÷ 140 XP/day = 5.71 days

Total to Commander:
1,200 XP ÷ 140 XP/day = 8.57 days (~9 days)
```

**Impact:** ⚠️ **2.5x faster progression**

#### Scenario 3: Engaged User (All 5 Missions)
**Missions/Day:** 5  
**XP/Day:** 280 XP (5x)

**Calculation:**
```
Cadet → Officer:
400 XP ÷ 280 XP/day = 1.43 days (~1.5 days)

Officer → Commander:
800 XP ÷ 280 XP/day = 2.86 days (~3 days)

Total to Commander:
1,200 XP ÷ 280 XP/day = 4.29 days (~4-5 days)
```

**Impact:** ⚠️ **5x faster progression**


---

## PROGRESSION COMPARISON TABLE

| User Type | Missions/Day | XP/Day | Days to Officer | Days to Commander | Total Days |
|-----------|--------------|--------|-----------------|-------------------|------------|
| **Current (All Users)** | 1 | 56 | 7.1 | 14.3 | **21.4** |
| **Casual (Featured Only)** | 1 | 56 | 7.1 | 14.3 | **21.4** |
| **Light (Featured + 1)** | 2 | 112 | 3.6 | 7.1 | **10.7** |
| **Moderate (Featured + 2)** | 3 | 168 | 2.4 | 4.8 | **7.1** |
| **Engaged (Featured + 3)** | 4 | 224 | 1.8 | 3.6 | **5.4** |
| **Maximum (All 5)** | 5 | 280 | 1.4 | 2.9 | **4.3** |

### Key Findings

**Fastest Possible Progression:**
- Commander rank in **4-5 days** (vs 21 days currently)
- **5x acceleration** for most engaged users
- **83% reduction** in time to max rank

**Average User Progression:**
- Assuming 2-3 missions/day average
- Commander in **7-11 days**
- **2-3x acceleration** vs current

**Casual User Impact:**
- ✅ **Unchanged** (can continue 1 mission/day)
- No pressure to complete more
- Same progression pace as current

---

## PROGRESSION BALANCING OPTIONS

### Option 1: Keep Current Thresholds (Recommended)

**Thresholds:**
```
Officer:   400 XP (unchanged)
Commander: 1,200 XP (unchanged)
```

**Rationale:**
- Rewards engaged users with faster progression
- Casual users unaffected
- Natural self-selection of engagement level
- Can monitor and adjust later if needed

**Pros:**
- ✅ No additional migration
- ✅ Encourages engagement
- ✅ Immediate implementation
- ✅ Flexible (can adjust later)

**Cons:**
- ⚠️ Very engaged users reach Commander in 4-5 days
- ⚠️ May devalue rank achievement
- ⚠️ Creates wide progression gap between casual/engaged

### Option 2: Increase Thresholds (Conservative)

**Thresholds:**
```
Officer:   800 XP (2x current)
Commander: 2,400 XP (2x current)
```

**Result with 5 missions/day:**
```
Casual (1 mission):  800 ÷ 56 = 14.3 days to Officer (vs 7.1 current)
Moderate (3 missions): 2,400 ÷ 168 = 14.3 days to Commander (vs 7.1)
Engaged (5 missions):  2,400 ÷ 280 = 8.6 days to Commander (vs 4.3)
```

**Pros:**
- ✅ Slows engaged user progression to reasonable pace
- ✅ Maintains 3-week timeline for engaged users
- ✅ Progression feels meaningful

**Cons:**
- ❌ Punishes casual users (2x longer for same rank)
- ❌ Feels like artificial throttling
- ❌ Discourages single-mission users

### Option 3: Diminishing Returns (Complex)

**Structure:**
```
Featured mission:    100% XP (e.g., 50 XP)
1st library mission: 100% XP (e.g., 60 XP)
2nd library mission: 80% XP  (e.g., 40 → 32 XP)
3rd library mission: 60% XP  (e.g., 50 → 30 XP)
4th library mission: 40% XP  (e.g., 70 → 28 XP)
```

**Daily Totals:**
```
1 mission:  50 XP
2 missions: 110 XP
3 missions: 142 XP
4 missions: 172 XP
5 missions: 200 XP (vs 280 with no diminishing)
```

**Result:**
```
Commander with 5 missions/day: 1,200 ÷ 200 = 6 days (vs 4.3)
```

**Pros:**
- ✅ Slows progression while rewarding engagement
- ✅ Encourages doing SOME library missions (not all)
- ✅ More balanced

**Cons:**
- ❌ Complex to explain to users
- ❌ Feels artificial/manipulative
- ❌ Requires RPC logic changes
- ❌ Harder to balance

### Recommendation: Option 1 (Keep Current Thresholds)

**Reasoning:**
1. Rewards engagement (positive reinforcement)
2. Casual users unaffected (important for retention)
3. Simplest to implement (no additional changes)
4. Can monitor real user behavior first
5. Easy to adjust thresholds later if needed
6. Transparency (no hidden diminishing returns)

**Monitoring Plan:**
- Track average missions/day across all users
- Track time-to-Commander distribution
- Adjust thresholds in Phase 2 if needed
- Survey user satisfaction with progression


---

## SUMMARY OF REQUIRED CHANGES

### Database Changes (1 Migration)

**File:** `supabase/migrations/004_enable_multiple_missions_per_day.sql`

```sql
-- Drop single-mission-per-day constraint
ALTER TABLE public.mission_completions
DROP CONSTRAINT uq_user_date;

-- Add per-mission-per-day constraint
ALTER TABLE public.mission_completions
ADD CONSTRAINT uq_user_mission_date 
UNIQUE (user_id, mission_id, completed_date);
```

**Estimated Time:** 5 minutes  
**Risk:** Low (no data changes)  
**Reversible:** Yes (rollback script provided)

### RPC Function Changes (1 Function)

**File:** `supabase/migrations/005_update_complete_mission_rpc.sql`

**Changes:**
1. Add `p_is_featured boolean` parameter
2. Update streak logic to only fire for featured missions
3. Update exception handler message (minor)

**Estimated Time:** 15 minutes  
**Risk:** Low (backwards compatible with default parameter)  
**Testing Required:** Test featured vs library missions

### Client-Side Changes (1 File)

**File:** `src/services/mission.service.ts`

**Changes:**
1. Add `getTodayCompletions()` function (returns mission IDs array)
2. Add `checkMissionCompletion()` function (checks specific mission)
3. Update `completeMission()` to pass `isFeatured` flag
4. Update `checkTodayCompletion()` to handle multiple completions

**Estimated Time:** 30 minutes  
**Risk:** Low (additive changes)  
**Testing Required:** Test completion checks for multiple missions

### Total Implementation Effort

**Database:** 20 minutes  
**Client:** 30 minutes  
**Testing:** 1 hour  
**Total:** ~2 hours of technical work

**Risk Level:** LOW  
**Complexity:** LOW  
**Reversibility:** HIGH

---

## VALIDATION CHECKLIST

### ✅ Schema Analysis Complete
- Identified blocking constraint: `uq_user_date`
- Confirmed minimal migration required
- Validated migration safety (no data changes)

### ✅ RPC Behavior Analysis Complete
- Identified streak calculation dependency
- Proposed `is_featured` parameter solution
- Validated exception handling updates

### ✅ Client Logic Analysis Complete
- Identified single-completion assumption in `checkTodayCompletion()`
- Proposed new functions for multi-mission support
- Validated backwards compatibility

### ✅ XP Progression Analysis Complete
- Current: 21.4 days to Commander (1 mission/day)
- Proposed: 4.3-21.4 days (5-1 missions/day)
- Recommendation: Keep current thresholds, monitor

---

## FINAL VERDICT

### ❌ Cannot Implement Without Database Changes

**Blocking Issue:**
```sql
constraint uq_user_date unique (user_id, completed_date)
```

**Minimal Migration Required:**
1. Drop `uq_user_date` constraint
2. Add `uq_user_mission_date` constraint (user + mission + date)
3. Update RPC function (`is_featured` parameter)
4. Update client service (multiple completions support)

**Total Changes:**
- 1 constraint swap (5 min)
- 1 RPC update (15 min)
- 1 service file update (30 min)
- Testing (1 hour)

**Conclusion:** While database changes ARE required, they are **minimal, safe, and reversible**. The migration is straightforward and low-risk.

---

## RECOMMENDATIONS

### 1. Approve Migration
- Constraint change is necessary and safe
- No data migration needed
- Fully reversible if issues arise

### 2. Keep Current Rank Thresholds
- Monitor user behavior first
- Adjust later if needed
- Don't penalize casual users

### 3. Implement in Phases
- Phase 1: Database migration + RPC update
- Phase 2: Client service updates
- Phase 3: UI implementation (library screen)
- Phase 4: Monitor and iterate

### 4. Monitor Metrics
- Track average missions/day per user
- Track time-to-Commander distribution
- Track library adoption rate
- Adjust thresholds in Phase 5 if needed

---

**Validation Complete** ✅  
**Migration Required:** YES (minimal)  
**Risk Level:** LOW  
**Ready for Approval:** YES

