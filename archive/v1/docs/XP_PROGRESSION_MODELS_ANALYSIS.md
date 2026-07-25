# XP PROGRESSION MODELS ANALYSIS

**Date:** 2026-06-13  
**Purpose:** Evaluate 3 XP reward models for Mission Library to balance engagement with progression pacing  
**Status:** ANALYSIS FOR APPROVAL  

---

## EXECUTIVE SUMMARY

**Problem:** With 5 missions/day at full XP, users reach Commander in 4 days (too fast)

**Solution:** Compare 3 XP reward models to find optimal balance

**Quick Comparison:**

| Model | Featured XP | Library XP | Days to Commander (Max) | Days to Commander (Avg) |
|-------|-------------|------------|-------------------------|-------------------------|
| **A** | 100% | 100% | 4.3 days | 7-11 days |
| **B** | 100% | 50% | 7.1 days | 11-15 days |
| **C** | 100% | Reduced Fixed | 8-10 days | 12-16 days |

**Recommendation:** **Model B** (50% XP for library missions)

---

## BASELINE ASSUMPTIONS

### Current System

**Rank Thresholds:**
```
Cadet:     0 XP
Officer:   400 XP
Commander: 1,200 XP
```

**Average XP per Mission (from 70-mission analysis):**
```
Communication:    50 XP avg
Confidence:       55 XP avg
Leadership:       70 XP avg
Awareness:        40 XP avg
Officer Thinking: 65 XP avg

Overall Average: 56 XP/mission
```

**Daily Mission Structure:**
- 1 Featured Mission (required for streak)
- 4 Training Library Missions (optional)
- Total: 5 missions available daily

### User Behavior Assumptions

**Casual User (30% of users):**
- Completes: 1 mission/day (featured only)
- Engagement: 5 min/day

**Moderate User (50% of users):**
- Completes: 2-3 missions/day (featured + 1-2 library)
- Engagement: 10-15 min/day

**Engaged User (20% of users):**
- Completes: 4-5 missions/day (featured + 3-4 library)
- Engagement: 20-25 min/day

---

## DATABASE VALIDATION

### Current Schema Analysis

**mission_completions table:**
```sql
create table if not exists public.mission_completions (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.users(id) on delete cascade,
  mission_id      text        not null references public.missions(id),
  completed_date  date        not null,    -- IST calendar date
  xp_awarded      smallint    not null,
  responses       jsonb,                    -- raw user answers
  
  -- Core invariant: one mission completion per user per calendar day
  constraint uq_user_date unique (user_id, completed_date)
);
```

**Current Constraint:** `UNIQUE(user_id, completed_date)`

### Critical Finding: **DATABASE BLOCKS 5 MISSIONS PER DAY**

**Problem:** The current database schema enforces **ONE mission per user per calendar day**.

```sql
-- This constraint PREVENTS multiple missions per day:
constraint uq_user_date unique (user_id, completed_date)
```

**Impact:**
- ❌ Cannot complete 5 missions per day with current schema
- ❌ Mission Library requires fundamental database change
- ❌ Streak logic assumes 1 mission/day
- ❌ RPC function `complete_mission()` relies on this constraint

**Current RPC Behavior:**
```sql
-- The complete_mission() function uses this constraint for idempotency:
insert into public.mission_completions (...)
-- Will throw unique_violation (23505) if already completed today
```

---

## ANSWER: CAN 5 MISSIONS/DAY BE IMPLEMENTED WITHOUT DATABASE CHANGES?

### ❌ **NO — Database Migration Required**

**Minimal Required Changes:**

### 1. Change Unique Constraint

**From:**
```sql
constraint uq_user_date unique (user_id, completed_date)
```

**To:**
```sql
constraint uq_user_mission_date unique (user_id, mission_id, completed_date)
```

**Reasoning:** Allow multiple missions per day, but prevent duplicate completion of same mission on same day.

### 2. Update complete_mission() RPC

**Current idempotency logic breaks** — needs revision to handle multiple completions per day.

**Changes needed:**
- Remove assumption that `completed_date` uniqueness = already completed
- Check for specific `(user_id, mission_id, completed_date)` combination
- Update streak logic to track "any mission completed today" vs "specific mission completed"

### 3. Add Mission Tracking

**Problem:** How do we know which mission is "today's featured mission" vs library missions?

**Options:**

**Option A: Add featured_mission_id to users table**
```sql
alter table users add column today_featured_mission text references missions(id);
```

**Option B: Use deterministic algorithm (existing approach)**
```typescript
// Keep current approach:
week_number = floor(daysSince(user.created_at) / 7) + 1
day_of_week = (daysSince(user.created_at) % 7) + 1
featured_mission = find(week_number, unlock_day=day_of_week)
```

**Recommendation:** Keep Option B (deterministic), simpler with no migration.

---

## XP PROGRESSION IMPACT ANALYSIS

### Current Progression (1 Mission/Day)

**XP Per Mission:** 56 XP average (from 70-mission analysis)

**Cadet → Officer (400 XP):**
- Days required: 400 ÷ 56 = **7.1 days**

**Officer → Commander (800 XP gap):**
- Days required: 800 ÷ 56 = **14.3 days**

**Total to Commander:**
- Days required: 1200 ÷ 56 = **21.4 days** (≈3 weeks)

### Proposed: 5 Missions/Day at Full XP

**Daily XP potential:** 56 × 5 = **280 XP/day**

**Cadet → Officer (400 XP):**
- Days required: 400 ÷ 280 = **1.4 days** ❌ TOO FAST

**Officer → Commander (800 XP):**
- Days required: 800 ÷ 280 = **2.9 days** ❌ TOO FAST

**Total to Commander:**
- Days required: 1200 ÷ 280 = **4.3 days** ❌ WAY TOO FAST

**User Behavior Impact:**

| User Type | Missions/Day | Days to Commander |
|-----------|--------------|-------------------|
| Casual (Featured only) | 1 | 21.4 days ✅ |
| Moderate (2-3 total) | 2.5 | 8.6 days ⚠️ |
| Engaged (4-5 total) | 4.5 | 4.8 days ❌ |

**Problem:** Engaged users reach max rank in less than a week = **no progression incentive**.

---

## MODEL A: FULL XP FOR ALL MISSIONS

### Structure
- Featured Mission: **100% XP** (56 avg)
- Library Mission 1-4: **100% XP** (56 avg each)
- Daily max: 280 XP

### Progression Timeline

**Cadet → Officer (400 XP):**
- Casual (1/day): 7.1 days
- Moderate (2.5/day): 2.9 days
- Engaged (4.5/day): **1.4 days** ❌

**Officer → Commander (800 XP):**
- Casual: 14.3 days
- Moderate: 5.7 days
- Engaged: **2.9 days** ❌

**Total to Commander:**
- Casual: **21.4 days** ✅
- Moderate: **8.6 days** ⚠️
- Engaged: **4.3 days** ❌

### Assessment

**Pros:**
- ✅ Simple to understand
- ✅ No discrimination between mission types
- ✅ Casual users unaffected

**Cons:**
- ❌ Engaged users finish too fast (4 days)
- ❌ Removes progression incentive after Week 1
- ❌ Moderate users rush through Officer rank
- ❌ Encourages "XP farming" behavior

**Verdict:** ❌ **REJECTED** — Too fast for engaged users

---

## MODEL B: REDUCED XP FOR LIBRARY MISSIONS (50%)

### Structure
- Featured Mission: **100% XP** (56 avg)
- Library Mission 1-4: **50% XP** (28 avg each)
- Daily max: 56 + (28 × 4) = **168 XP**

### Progression Timeline

**Cadet → Officer (400 XP):**
- Casual (1 featured/day): **7.1 days** (56 XP/day)
- Moderate (1 featured + 1.5 library/day): **4.8 days** (98 XP/day)
- Engaged (1 featured + 3.5 library/day): **2.5 days** (154 XP/day)

**Officer → Commander (800 XP):**
- Casual: **14.3 days**
- Moderate: **8.2 days**
- Engaged: **5.2 days**

**Total to Commander (1200 XP):**
- Casual: **21.4 days** ✅
- Moderate: **12.2 days** ✅
- Engaged: **7.8 days** ✅

### Real-World Projection

Assuming behavioral patterns:
- Casual: 7 days/week = **21.4 days** (3 weeks)
- Moderate: 5 days/week = **17 days** (2.5 weeks)
- Engaged: 6 days/week = **9.3 days** (1.5 weeks)

### Assessment

**Pros:**
- ✅ Featured mission retains full value (streak incentive)
- ✅ Library missions still rewarding (50% better than nothing)
- ✅ Engaged users progress in ~8 days (reasonable)
- ✅ Moderate users progress in ~12 days (sweet spot)
- ✅ Casual users unaffected
- ✅ Discourages pure XP farming (diminishing returns)

**Cons:**
- ⚠️ Library missions feel "less valuable" (by design)
- ⚠️ Requires clear UI indication of XP difference

**Verdict:** ✅ **RECOMMENDED**

---

## MODEL C: TIERED FIXED XP REDUCTION

### Structure
- Featured Mission: **100% XP** (56 avg)
- Library Mission #1: **75% XP** (42)
- Library Mission #2: **50% XP** (28)
- Library Mission #3: **25% XP** (14)
- Library Mission #4: **25% XP** (14)
- Daily max: 56 + 42 + 28 + 14 + 14 = **154 XP**

### Progression Timeline

**Cadet → Officer (400 XP):**
- Casual (1/day): **7.1 days** (56 XP/day)
- Moderate (1 + 1.5 library/day): **5.0 days** (80 XP/day)
- Engaged (1 + 3.5 library/day): **2.8 days** (143 XP/day)

**Officer → Commander (800 XP):**
- Casual: **14.3 days**
- Moderate: **10 days**
- Engaged: **5.6 days**

**Total to Commander:**
- Casual: **21.4 days** ✅
- Moderate: **15 days** ✅
- Engaged: **8.4 days** ✅

### Assessment

**Pros:**
- ✅ Rewards "first extra mission" more (75% XP)
- ✅ Gradual XP decay feels fair
- ✅ Similar progression to Model B

**Cons:**
- ❌ Complex to explain ("why is mission #3 worth less?")
- ❌ Order dependency feels arbitrary
- ❌ Requires tracking mission completion order
- ❌ UI complexity (show different XP for each slot?)

**Verdict:** ⚠️ **POSSIBLE BUT COMPLEX**

---

## SIDE-BY-SIDE COMPARISON

| Metric | Model A (100%) | Model B (50%) | Model C (Tiered) |
|--------|----------------|---------------|------------------|
| **Daily Max XP** | 280 | 168 | 154 |
| **Casual → Commander** | 21.4 days | 21.4 days | 21.4 days |
| **Moderate → Commander** | 8.6 days | 12.2 days | 15 days |
| **Engaged → Commander** | 4.3 days | 7.8 days | 8.4 days |
| **UI Complexity** | Low | Low | High |
| **XP Farming Risk** | High | Medium | Low |
| **Fairness Perception** | High | Medium | Medium |

---

## FINAL RECOMMENDATION

### ✅ **Model B: 50% XP for Library Missions**

**Reasoning:**

1. **Optimal Progression Pacing**
   - Engaged users: ~8 days (retains challenge)
   - Moderate users: ~12 days (sweet spot)
   - Casual users: unchanged (~21 days)

2. **Behavioral Design**
   - Featured mission = full value (streak protected)
   - Library missions = bonus XP (not required, but helpful)
   - Diminishing returns discourage pure XP farming

3. **Implementation Simplicity**
   - Single rule: `library_xp = base_xp * 0.5`
   - No order tracking required
   - Clear UI communication

4. **User Perception**
   - Featured = "the real mission"
   - Library = "extra training" (bonus XP feels earned)

---

## IMPLEMENTATION REQUIREMENTS

### Database Changes (Required)

**Migration 004: Enable Multiple Missions Per Day**

```sql
-- 1. Drop old constraint
ALTER TABLE mission_completions
DROP CONSTRAINT uq_user_date;

-- 2. Add new constraint (prevent duplicate mission completion)
ALTER TABLE mission_completions
ADD CONSTRAINT uq_user_mission_date UNIQUE (user_id, mission_id, completed_date);

-- 3. Add index for library mission queries
CREATE INDEX idx_completions_user_mission_date
ON mission_completions (user_id, mission_id, completed_date DESC);
```

### RPC Changes (Required)

**Update complete_mission() function:**

```sql
-- Change exception handling from:
when unique_violation then
  -- Already completed today (any mission)

-- To:
when unique_violation then
  -- Already completed THIS SPECIFIC MISSION today
```

### Client Changes (Required)

1. **Dashboard Logic**
   - Check for featured mission completion (not "any mission")
   - Show "4 more missions available" if featured is done

2. **Mission Library Screen**
   - Filter out already-completed missions for today
   - Show remaining daily missions

3. **XP Display**
   - Featured missions: show full XP
   - Library missions: show "28 XP (Bonus Training)"

---

## RISKS & MITIGATIONS

### Risk 1: Users Feel Cheated by 50% XP

**Mitigation:**
- Frame library missions as "Bonus Training" not "required"
- Show XP comparison: "+28 XP" vs "0 XP (done for today)"
- Emphasize: featured mission = full value

### Risk 2: Database Migration Complexity

**Mitigation:**
- Test migration on staging first
- Validate no existing data violates new constraint
- Provide rollback plan

### Risk 3: Streak Logic Breaks

**Mitigation:**
- Update streak calculation to check for "any mission completed today"
- Test edge cases: user completes only library missions (should count)

### Risk 4: Rapid XP Inflation

**Mitigation:**
- Monitor avg XP/day post-launch
- Add future ranks if needed (Lieutenant, Captain, Major)
- Consider: library missions don't count toward rank after Commander

---

## NEXT STEPS

### Phase 1: Validation (This Document)
- ✅ Database schema analysis
- ✅ XP progression models
- ✅ Recommendation

### Phase 2: Approval Required

**Questions for stakeholder:**

1. **Approve Model B (50% XP for library)?**
   - Alternative: Model C (tiered XP)?

2. **Approve database migration?**
   - Breaking change to core constraint

3. **Approve UX framing?**
   - "Bonus Training" vs "Library Missions"

4. **Future-proof with additional ranks?**
   - Lieutenant (1800 XP)?
   - Captain (2600 XP)?

### Phase 3: Implementation (After Approval)

1. Create database migration
2. Update complete_mission() RPC
3. Update client-side mission engine
4. Create Mission Library UI
5. Update dashboard logic
6. Test end-to-end flow

---

## APPENDIX: CALCULATION DETAILS

### Average XP Per Mission (from 70-mission seed data)

**By Category:**
```
Communication:    50 XP avg (14 missions)
Confidence:       55 XP avg (14 missions)
Leadership:       70 XP avg (14 missions)
Awareness:        40 XP avg (14 missions)
Officer Thinking: 65 XP avg (14 missions)
```

**By Type:**
```
Reflect & Write:   40 XP avg (28 missions)
Poll + Reasoning:  50 XP avg (28 missions)
Daily Challenge:   60 XP avg (14 missions)
```

**Overall Average:** 56 XP/mission

### Rank Thresholds

```
Cadet:     0 - 399 XP    (400 XP to promote)
Officer:   400 - 1199 XP (800 XP to promote)
Commander: 1200+ XP      (max rank)
```

### User Behavior Assumptions

**Casual User (30%):**
- 1 mission/day (featured only)
- Engagement: 5 min/day
- Typical profile: Checking in daily, maintaining streak

**Moderate User (50%):**
- 2-3 missions/day (featured + 1-2 library)
- Engagement: 10-15 min/day
- Typical profile: Engaged but time-constrained

**Engaged User (20%):**
- 4-5 missions/day (featured + 3-4 library)
- Engagement: 20-25 min/day
- Typical profile: Highly motivated, studying for SSB

---

## DOCUMENT STATUS

- **Created:** 2026-06-13
- **Status:** Awaiting Approval
- **Recommendation:** Model B (50% XP for library missions)
- **Blocker:** Database migration required
- **Risk Level:** Medium (breaking schema change)

---

**END OF ANALYSIS**
