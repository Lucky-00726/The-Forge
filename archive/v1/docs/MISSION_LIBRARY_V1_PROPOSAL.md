# MISSION LIBRARY V1 PROPOSAL

**Date:** 2026-06-13  
**Status:** PROPOSAL - Awaiting Approval  
**Objective:** Extend daily engagement by providing access to additional missions beyond the featured mission  

---

## EXECUTIVE SUMMARY

**Current Problem:**
- Users complete 1 featured mission per day
- Dashboard becomes empty after completion
- 70-mission content library underutilized
- No reason to return until tomorrow
- Low daily engagement time (< 5 minutes)

**Proposed Solution:**
- **1 Featured Mission** (hero card, daily assignment)
- **4 Additional Training Missions** (library access, user choice)
- **Total: ~5 missions per day**
- Featured Mission preserved as primary experience
- Library provides optional extended training

**Key Principles:**
1. ✅ Featured Mission remains the hero experience
2. ✅ Library missions are optional, not required
3. ✅ No database schema changes (client-side logic)
4. ✅ Deterministic unlocks (based on user join date)
5. ✅ XP rewards preserved for all missions
6. ✅ Streak only requires featured mission completion

---

## UX FLOW COMPARISON

### Current Flow (1 Mission/Day)

```
User opens app
↓
Dashboard shows 1 Featured Mission
↓
User completes mission (5 min)
↓
Dashboard shows "MISSION COMPLETE"
↓
User closes app (nothing else to do)
```

**Result:** Single session, 5 min engagement, "come back tomorrow"

### Proposed Flow (5 Missions/Day)

```
User opens app
↓
Dashboard shows:
  - 1 Featured Mission (hero card)
  - "ADDITIONAL TRAINING" section
↓
User completes Featured Mission (5 min)
↓
Dashboard updates:
  - Featured Mission: "COMPLETE" ✓
  - Additional Training: 4 missions still available
  - New "TRAINING LIBRARY" tab unlocked
↓
User continues to Training Library (optional)
↓
User selects additional missions (3-4 more)
↓
Total engagement: 20-25 minutes
```

**Result:** Extended engagement, user choice, more XP earned


---

## DASHBOARD CHANGES

### Before (Current)

```
┌─────────────────────────────────────┐
│ MISSION COMMAND                     │
│ [Profile] [XP Bar]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔥 ACTIVE ENGAGEMENT                │
│ 05 DAY STREAK                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔥 PRIMARY MISSION                  │
│ [Hero Image Section]                │
│ Communication Drill                 │
│ +50 XP • PRIORITY: ALPHA            │
│ [COMMENCE MISSION →]                │
└─────────────────────────────────────┘

(Dashboard ends here)
```

**After Completion:**
```
┌─────────────────────────────────────┐
│ ✓ MISSION COMPLETE                  │
│ Communication Drill                 │
│ Mission objectives achieved.        │
│ Training cycle resumes tomorrow.    │
└─────────────────────────────────────┘

(Nothing else to do)
```

### After (Proposed)

```
┌─────────────────────────────────────┐
│ MISSION COMMAND                     │
│ [Profile] [XP Bar]                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔥 ACTIVE ENGAGEMENT                │
│ 05 DAY STREAK                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔥 FEATURED MISSION                 │ ← "PRIMARY" → "FEATURED"
│ [Hero Image Section]                │
│ Communication Drill                 │
│ +50 XP • PRIORITY: ALPHA            │
│ [COMMENCE MISSION →]                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐ ← NEW SECTION
│ ADDITIONAL TRAINING                 │
│ 4 missions available today          │
│                                     │
│ [VIEW TRAINING LIBRARY →]           │
└─────────────────────────────────────┘
```

**After Featured Mission Complete:**
```
┌─────────────────────────────────────┐
│ ✓ FEATURED MISSION COMPLETE         │
│ Communication Drill                 │
│ Primary objective achieved.         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ADDITIONAL TRAINING                 │
│ 4 missions available today          │ ← Still available
│                                     │
│ [VIEW TRAINING LIBRARY →]           │
└─────────────────────────────────────┘
```


---

## MISSION LIBRARY SCREEN DESIGN

### Navigation Access

**Method 1: Bottom Tab (Recommended)**
```
Bottom Nav:
[⌂ HOME] [📚 LIBRARY] [▣ DOSSIER]
```
- Always accessible
- Clear dedicated space
- Encourages exploration

**Method 2: Dashboard Button**
```
[VIEW TRAINING LIBRARY →] button on dashboard
```
- Discovered after featured mission
- Less prominent but cleaner

**Recommendation:** Use Method 1 (Bottom Tab) for visibility

### Screen Layout

```
┌─────────────────────────────────────┐
│ ← BACK              TRAINING LIBRARY│ ← Header
│ OPS-02                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ MISSION PROGRESS                    │ ← Progress Card
│                                     │
│ ▰▰▰▱▱  2/5 completed today          │
│                                     │
│ Featured Mission: ✓ Complete        │
│ Additional Training: 1/4 complete   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ AVAILABLE MISSIONS                  │ ← Category Filter
│ [ALL] [COM] [CONF] [LEAD] [AWR] ... │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ▸ Communication                     │ ← Mission Card
│   Persuasion under pressure         │
│   +40 XP • Reflect & Write          │
│   [START MISSION →]                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ▸ Leadership                        │
│   Delegation priorities             │
│   +50 XP • Poll + Reasoning         │
│   [START MISSION →]                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✓ Confidence                        │ ← Completed
│   Public speaking tactics           │
│   +60 XP • Already completed        │
│   [COMPLETED ✓]                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🔒 Awareness                        │ ← Locked (future day)
│   Environmental scanning            │
│   Unlocks tomorrow                  │
│   [LOCKED]                          │
└─────────────────────────────────────┘
```

### Visual States

**Available Mission:**
- Tactical card with corner markers
- Category icon/color
- Mission title + XP
- "START MISSION →" button
- Tap to start immediately

**Completed Mission:**
- Green accent border
- Checkmark icon
- "COMPLETED ✓" badge (disabled button)
- Gray text
- Cannot restart same day

**Locked Mission:**
- Reduced opacity (0.5)
- Lock icon 🔒
- "Unlocks tomorrow" text
- No interaction


---

## UNLOCK STRATEGY

### Deterministic Daily Unlock Algorithm

**Goal:** Make 5 missions available daily without database schema changes

**Algorithm:**
```typescript
function getDailyMissions(userId: string, joinDate: Date, today: Date): Mission[] {
  const daysSinceJoin = calculateDaysSince(joinDate, today);
  const weekNum = Math.floor(daysSinceJoin / 7) + 1;
  const dayNum = (daysSinceJoin % 7) + 1;
  
  // Featured Mission (existing logic)
  const featuredMission = selectFeaturedMission(weekNum, dayNum);
  
  // Additional 4 missions (NEW)
  const additionalMissions = selectAdditionalMissions(weekNum, dayNum, featuredMission);
  
  return [featuredMission, ...additionalMissions];
}
```

### Selection Strategy

**Option A: Same Week, Different Days (Recommended)**
```typescript
function selectAdditionalMissions(weekNum, dayNum, featured) {
  // Get 4 missions from same week, different days
  const otherDays = [1,2,3,4,5,6,7].filter(d => d !== dayNum);
  const missions = otherDays.slice(0, 4).map(day => 
    getMissionForWeekAndDay(weekNum, day)
  );
  return missions;
}
```

**Example: User on Week 1, Day 3**
```
Featured Mission: Week 1, Day 3 (Communication)
Additional Missions:
  - Week 1, Day 1 (Confidence)
  - Week 1, Day 2 (Leadership)
  - Week 1, Day 4 (Awareness)
  - Week 1, Day 5 (Officer Thinking)
```

**Advantages:**
- ✅ Thematically related (same week)
- ✅ Balanced categories (1 per category)
- ✅ Simple logic
- ✅ Predictable for users

**Option B: Round-Robin Categories**
```typescript
function selectAdditionalMissions(weekNum, dayNum, featured) {
  const categories = ['Communication', 'Confidence', 'Leadership', 'Awareness', 'Officer Thinking'];
  const otherCategories = categories.filter(c => c !== featured.category);
  
  return otherCategories.map((cat, idx) => 
    selectMissionFromCategory(cat, weekNum, (dayNum + idx) % 7)
  );
}
```

**Advantages:**
- ✅ One mission per category daily
- ✅ No duplicate categories
- ✅ Clear rotation pattern

**Recommendation:** Use Option A (same week, different days)

### Unlock Rules

1. **Featured Mission:** Always unlocked, always visible on dashboard
2. **Additional 4 Missions:** Unlocked same time as featured mission (midnight IST)
3. **Completion Limit:** Can complete all 5 in one day (no artificial throttling)
4. **Reset Timing:** New 5 missions at midnight IST daily
5. **Cannot Repeat:** Same mission cannot be completed twice in one day


---

## COMPLETION TRACKING STRATEGY

### Current System (Featured Mission Only)

**Table:** `mission_completions`
```sql
mission_completions (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  mission_id      TEXT,
  completed_date  DATE,
  xp_awarded      INTEGER,
  response        JSONB,
  
  UNIQUE(user_id, completed_date)  ← ONE completion per day
)
```

**Problem:** `UNIQUE(user_id, completed_date)` constraint prevents multiple missions per day

### Proposed System (No Schema Changes)

**Strategy:** Remove the UNIQUE constraint assumption, allow multiple rows per day

**Modified Constraint Logic:**
```sql
-- CURRENT (implicit):
-- One row per user per day

-- PROPOSED (same table, different logic):
-- Multiple rows per user per day
-- One row per mission completion

-- No ALTER TABLE needed, just change application logic
```

**Application Logic:**
```typescript
// BEFORE: Check if user completed ANY mission today
const { data: completion } = await supabase
  .from('mission_completions')
  .select('*')
  .eq('user_id', userId)
  .eq('completed_date', today)
  .single();  // Assumes ONE completion per day

// AFTER: Check if user completed THIS SPECIFIC mission today
const { data: completion } = await supabase
  .from('mission_completions')
  .select('*')
  .eq('user_id', userId)
  .eq('mission_id', missionId)  // ← Check specific mission
  .eq('completed_date', today)
  .maybeSingle();  // May or may not exist
```

### Migration Strategy

**Phase 1: Add Constraint (if not exists)**
```sql
-- Check if constraint exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'mission_completions' 
  AND constraint_name = 'uq_user_mission_date';

-- If not exists, add it
ALTER TABLE mission_completions
ADD CONSTRAINT uq_user_mission_date 
UNIQUE(user_id, mission_id, completed_date);
```

**Phase 2: Update Application Code**
- Change completion check to include `mission_id`
- Allow multiple completions per day
- Track each mission separately

**Phase 3: Update Streak Logic**
```typescript
// Streak ONLY counts featured mission
async function checkStreakCompletion(userId: string, today: string) {
  const featuredMission = await getFeaturedMissionForToday(userId, today);
  
  const { data } = await supabase
    .from('mission_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('mission_id', featuredMission.id)  // ← Only featured mission
    .eq('completed_date', today)
    .maybeSingle();
  
  return !!data;  // Returns true if featured mission completed
}
```

**Key Point:** Streak requires featured mission only, not all 5 missions


---

## NAVIGATION CHANGES

### Current Navigation

```
Bottom Tabs:
[⌂ HOME] [▣ DOSSIER]

Screens:
- Home (Dashboard)
- Profile (Dossier)
```

### Proposed Navigation (Option 1: 3-Tab Layout)

```
Bottom Tabs:
[⌂ HOME] [📚 LIBRARY] [▣ DOSSIER]

Screens:
- Home (Dashboard with featured mission)
- Library (Training Library with 4 additional missions)
- Profile (Dossier)
```

**Tab Labels:**
- HOME (4 chars)
- LIBRARY (7 chars) or TRAIN (5 chars)
- DOSSIER (7 chars)

**Visual:**
```
┌──────────────────────────────────┐
│  ⌂          📚          ▣        │
│ HOME      LIBRARY     DOSSIER    │
└──────────────────────────────────┘
```

### Proposed Navigation (Option 2: Modal Access)

```
Bottom Tabs:
[⌂ HOME] [▣ DOSSIER]

Navigation:
- Dashboard has "VIEW TRAINING LIBRARY →" button
- Opens Library as modal/screen
- Back button returns to dashboard
```

**Advantages:**
- ✅ No tab bar changes
- ✅ Preserves current 2-tab simplicity
- ✅ Library feels like "extra" content

**Disadvantages:**
- ❌ Less discoverable
- ❌ More taps to access
- ❌ Not always visible

### Recommended Approach: Option 1 (3-Tab Layout)

**Rationale:**
1. Library is a core feature (not secondary)
2. Always accessible (no need to complete featured mission first)
3. Clear visual hierarchy
4. Matches user expectation (training = separate section)

**Tab Icon Options:**
- 📚 (Book) - "Library" metaphor
- ⚡ (Lightning) - "Training" energy
- 🎯 (Target) - "Missions" goal-oriented
- 📋 (Clipboard) - "Assignments" tactical

**Recommendation:** 📚 (Book icon) + "LIBRARY" label


---

## USER EXPERIENCE SCENARIOS

### Scenario 1: Engaged User (Completes All 5)

**Morning:**
```
09:00 - User opens app
      - Sees featured mission (Communication)
      - Completes featured mission (+50 XP)
      - Notices "ADDITIONAL TRAINING" section
      
09:10 - User taps "VIEW TRAINING LIBRARY"
      - Sees 4 additional missions available
      - Selects Confidence mission (+40 XP)
      - Completes mission
      
09:15 - User continues to Leadership mission (+50 XP)
09:20 - User continues to Awareness mission (+40 XP)
09:25 - User continues to Officer Thinking mission (+60 XP)

Total: 5 missions, 240 XP, 25 minutes
```

**Evening:**
```
19:00 - User returns to app
      - Dashboard shows "All missions complete"
      - Library shows all 5 missions completed
      - Satisfied with progress
      - Returns tomorrow
```

### Scenario 2: Casual User (Completes Featured Only)

**Morning:**
```
08:00 - User opens app
      - Sees featured mission (Leadership)
      - Completes featured mission (+50 XP)
      - Sees "ADDITIONAL TRAINING" section
      - Decides to skip (busy day)
      - Closes app

Total: 1 mission, 50 XP, 5 minutes
```

**Result:** Same experience as current system, no pressure

### Scenario 3: Moderate User (Featured + 1-2 Additional)

**Morning:**
```
10:00 - User opens app
      - Completes featured mission (+50 XP)
      - Opens library
      - Completes 1 additional mission (+40 XP)
      - Saves others for evening
      
18:00 - User returns
      - Completes 1 more mission (+50 XP)
      
Total: 3 missions, 140 XP, 15 minutes across 2 sessions
```

### Scenario 4: Content-Hungry User (Finishes Early)

**Morning:**
```
07:00 - User opens app
      - Completes all 5 missions quickly (20 min)
      - All missions complete
      - Dashboard shows completion state
      - Library shows 0 available
      
Afternoon:
- User returns hoping for more
- No new missions until tomorrow
- Clear message: "New missions unlock tomorrow at 0600"
```

**Result:** User maximizes daily content but has clear boundary


---

## XP & PROGRESSION IMPACT

### Current System (1 Mission/Day)

**Daily XP Range:** 30-90 XP
```
Communication:    40-60 XP
Confidence:       40-70 XP
Leadership:       50-90 XP
Awareness:        30-50 XP
Officer Thinking: 50-80 XP

Average: ~55 XP/day
```

**Time to Ranks:**
```
Cadet → Officer:     400 XP ÷ 55 = ~7.3 days
Officer → Commander: 800 XP ÷ 55 = ~14.5 days
Total to Commander:  1200 XP ÷ 55 = ~21.8 days
```

### Proposed System (Up to 5 Missions/Day)

**Daily XP Range:** 30-450 XP (if all 5 completed)

**Example Daily Totals:**
- Featured only: 50 XP (same as current)
- Featured + 1: 90-140 XP
- Featured + 2: 130-190 XP
- Featured + 3: 170-240 XP
- All 5: 240-450 XP

**Average if users complete 3/5 missions:** ~150 XP/day

**Accelerated Time to Ranks:**
```
If avg 150 XP/day:
Cadet → Officer:     400 XP ÷ 150 = ~2.7 days
Officer → Commander: 800 XP ÷ 150 = ~5.3 days
Total to Commander:  1200 XP ÷ 150 = ~8 days
```

### Balancing Considerations

**Problem:** Ranks unlock too quickly

**Solution Options:**

**Option A: Increase Rank Thresholds**
```
Current:
- Officer: 400 XP
- Commander: 1200 XP

Proposed:
- Officer: 800 XP (2x)
- Commander: 2400 XP (2x)

Result with 150 XP/day:
- Officer: ~5.3 days
- Commander: ~16 days
```

**Option B: Keep Thresholds, Accept Faster Progression**
- Users who engage more progress faster (reward)
- Casual users still take 7-21 days (unchanged)
- Natural self-selection

**Option C: Diminishing Returns After Featured**
```
Featured mission: Full XP (50 XP)
Additional missions: 80% XP (40 XP → 32 XP)

Result:
- Featured: 50 XP
- 4 Additional at 80%: 160 XP × 0.8 = 128 XP
- Total: 178 XP/day (more balanced)
```

**Recommendation:** Option B (Keep thresholds, accept faster progression)

**Rationale:**
- Rewards engagement
- Casual users unaffected
- Can adjust thresholds later if needed
- Encourages daily return


---

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)

**Backend:**
- Update mission selection algorithm (5 missions instead of 1)
- Modify completion tracking (allow multiple per day)
- Update streak logic (featured mission only)
- Add database constraint if needed

**Frontend:**
- Add "LIBRARY" tab to bottom navigation
- Update dashboard with "ADDITIONAL TRAINING" section
- Modify completion state handling

**Testing:**
- Verify 5 missions unlock correctly
- Test completion tracking for multiple missions
- Verify streak only counts featured mission

**Deliverables:**
- Working 3-tab navigation
- Dashboard shows featured + library link
- Backend supports 5 missions/day

### Phase 2: Library Screen (Week 1-2)

**UI Components:**
- Mission Library screen layout
- Progress card (2/5 complete)
- Category filter tabs
- Mission cards (available/completed/locked states)

**Logic:**
- Filter missions by category
- Show completion status per mission
- Navigation to mission detail

**Testing:**
- Test all visual states (available/completed/locked)
- Test category filtering
- Test navigation flow

**Deliverables:**
- Complete Library screen
- Category filtering working
- Completion states rendering correctly

### Phase 3: Polish & Optimization (Week 2)

**UX Enhancements:**
- Loading states
- Empty states (all missions complete)
- Smooth transitions
- Progress animations

**Performance:**
- Optimize mission queries
- Cache mission data
- Preload mission content

**Testing:**
- Load testing with 70 missions
- Test on slow networks
- Test completion edge cases

**Deliverables:**
- Polished user experience
- Performance optimized
- Edge cases handled

### Phase 4: Analytics & Iteration (Week 3+)

**Metrics to Track:**
- Average missions completed per day
- Featured vs library completion rates
- Session duration changes
- Daily return rate
- XP progression speed

**Iteration Based on Data:**
- Adjust unlock algorithm if needed
- Modify XP rewards if imbalanced
- Add/remove features based on usage


---

## TECHNICAL REQUIREMENTS

### No Database Schema Changes

**Existing Tables (Sufficient):**
```sql
missions (
  id              TEXT PRIMARY KEY,
  week_number     INTEGER,
  unlock_day      INTEGER,
  category        TEXT,
  mission_type    TEXT,
  title           TEXT,
  xp_reward       INTEGER,
  content         JSONB
)

mission_completions (
  id              UUID PRIMARY KEY,
  user_id         UUID,
  mission_id      TEXT,
  completed_date  DATE,
  xp_awarded      INTEGER,
  response        JSONB
)

users (
  id              UUID PRIMARY KEY,
  created_at      TIMESTAMPTZ,
  total_xp        INTEGER,
  current_streak  INTEGER,
  rank            TEXT
)
```

**All Required:**
- ✅ Mission metadata
- ✅ Completion tracking
- ✅ User progress
- ✅ No new columns needed

### Client-Side Logic

**Mission Selection (Deterministic):**
```typescript
// services/mission.service.ts
export async function getDailyMissions(
  userId: string, 
  joinDate: string
): Promise<Mission[]> {
  const today = todayIST();
  const daysSinceJoin = calculateDaysSince(joinDate, today);
  const weekNum = currentWeekNumber(joinDate);
  const dayNum = currentDayOfWeek(joinDate);
  
  // Featured mission (existing)
  const featured = await fetchMissionForDay(weekNum, dayNum);
  
  // Additional 4 missions (NEW)
  const otherDays = [1,2,3,4,5,6,7].filter(d => d !== dayNum);
  const additional = await Promise.all(
    otherDays.slice(0, 4).map(day => 
      fetchMissionForDay(weekNum, day)
    )
  );
  
  return [featured, ...additional];
}
```

**Completion Check (Per Mission):**
```typescript
export async function checkMissionCompletion(
  userId: string,
  missionId: string,
  date: string
): Promise<boolean> {
  const { data } = await supabase
    .from('mission_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_id', missionId)
    .eq('completed_date', date)
    .maybeSingle();
  
  return !!data;
}
```

**Multiple Completions Query:**
```typescript
export async function getTodayCompletions(
  userId: string,
  date: string
): Promise<string[]> {
  const { data } = await supabase
    .from('mission_completions')
    .select('mission_id')
    .eq('user_id', userId)
    .eq('completed_date', date);
  
  return data?.map(c => c.mission_id) || [];
}
```


---

## FILES TO CREATE/MODIFY

### New Files (3)

1. **`app/(tabs)/library.tsx`**
   - Mission Library screen
   - Category filtering
   - Mission cards with states
   - Progress tracking

2. **`src/components/library/MissionCard.tsx`**
   - Reusable mission card component
   - Available/Completed/Locked states
   - Category badge
   - XP display

3. **`src/components/library/ProgressCard.tsx`**
   - Daily progress display
   - "2/5 complete" visual
   - Featured vs additional breakdown

### Modified Files (5)

4. **`app/(tabs)/_layout.tsx`**
   - Add "LIBRARY" tab
   - 3-tab navigation
   - Tab icons and labels

5. **`app/(tabs)/index.tsx`**
   - Update "PRIMARY" → "FEATURED"
   - Add "ADDITIONAL TRAINING" section
   - Link to library tab

6. **`src/services/mission.service.ts`**
   - Add `getDailyMissions()` (returns 5)
   - Add `getTodayCompletions()` (returns array)
   - Update completion check logic

7. **`src/hooks/useMissionEngine.ts`**
   - Support multiple completions per day
   - Track completion state per mission

8. **`app/mission/[id].tsx`**
   - Minor: Show completion state if already done
   - Prevent duplicate completion same day

**Total:** 8 files (3 new, 5 modified)

---

## RISKS & MITIGATION

### Risk 1: User Overwhelm

**Risk:** 5 missions feels like too much work

**Mitigation:**
- Featured mission remains primary focus
- Additional missions clearly optional
- "2/5 complete" progress shows achievement, not burden
- Users self-select engagement level

### Risk 2: Rapid XP Inflation

**Risk:** Users reach max rank too quickly

**Mitigation:**
- Monitor progression rates
- Can adjust rank thresholds later
- Consider diminishing returns on additional missions
- Fast progression rewards engagement (positive)

### Risk 3: Content Exhaustion

**Risk:** Users complete all 70 missions in 2-3 weeks

**Mitigation:**
- Unlock algorithm cycles through content
- Missions repeat (by design)
- Repetition aids mastery (gamification principle)
- New content pipeline for later phases

### Risk 4: Featured Mission Neglect

**Risk:** Users skip featured, do library missions only

**Mitigation:**
- Featured mission required for streak
- Featured mission highest XP priority
- Dashboard hero card emphasizes featured
- Library missions support featured (not replace)

### Risk 5: Library Discoverability

**Risk:** Users don't notice library tab

**Mitigation:**
- Bottom tab always visible
- Dashboard "ADDITIONAL TRAINING" section prompts
- First-time tooltip: "4 more missions available"
- Onboarding flow mentions library


---

## SUCCESS METRICS

### Engagement Metrics

**Before (1 Mission/Day):**
- Daily Active Users (DAU): Baseline
- Avg Session Duration: ~5 minutes
- Missions Completed/Day: 1.0
- Daily Return Rate: X%

**After (5 Missions/Day) - Targets:**
- DAU: +10-20% (more reasons to open)
- Avg Session Duration: 10-15 minutes (2-3x increase)
- Missions Completed/Day: 2.5-3.0 (casual users 2, engaged users 5)
- Daily Return Rate: +15% (more content available)

### Progression Metrics

**XP Earnings:**
- Min (casual): 50 XP/day (unchanged)
- Avg (moderate): 150 XP/day (3x current)
- Max (engaged): 300 XP/day (6x current)

**Time to Commander:**
- Casual: 21 days (unchanged)
- Moderate: 8-10 days (2-3x faster)
- Engaged: 4-5 days (4-5x faster)

### Feature Adoption

**Library Usage:**
- % Users who open library: Target 60%+
- % Missions from library: Target 40-60% of total
- Avg library missions per user: Target 1.5-2.5

### Content Utilization

**Mission Completion Diversity:**
- Unique missions completed per user/week: 10-15 (vs 7 current)
- Category balance: All 5 categories used regularly
- Mission repeat rate: Acceptable (repetition aids learning)

---

## ALTERNATIVES CONSIDERED

### Alternative A: Unlock 1 New Mission Every 6 Hours

**Structure:**
- Midnight: Featured mission + Mission 2
- 6am: Mission 3 unlocks
- Noon: Mission 4 unlocks
- 6pm: Mission 5 unlocks

**Advantages:**
- ✅ Encourages multiple daily sessions
- ✅ Prevents binge completion
- ✅ Spreads engagement across day

**Disadvantages:**
- ❌ Artificial throttling frustrates users
- ❌ Punishes users with specific routines
- ❌ Timezone complexity
- ❌ "Check-in" game feel (manipulative)

**Rejected:** Too artificial, reduces user agency

### Alternative B: 3 Missions/Day (Featured + 2)

**Structure:**
- 1 Featured mission
- 2 Additional missions
- Total: 3/day

**Advantages:**
- ✅ Less overwhelming than 5
- ✅ Still extends engagement
- ✅ More sustainable content use

**Disadvantages:**
- ❌ Less engaging than 5
- ❌ Users still want more after 3
- ❌ Doesn't fully utilize 70-mission library

**Rejected:** Too conservative, undershoot on engagement

### Alternative C: Unlimited Library (No Daily Limit)

**Structure:**
- 1 Featured mission (required for streak)
- Unlimited access to all 70 missions
- Can complete any/all missions anytime

**Advantages:**
- ✅ Maximum user agency
- ✅ No artificial limits
- ✅ Content-hungry users satisfied

**Disadvantages:**
- ❌ Extremely rapid progression
- ❌ Content exhaustion in days
- ❌ No reason to return tomorrow
- ❌ Devalues missions (too many)

**Rejected:** Undermines daily habit formation

### ✅ Alternative D: 5 Missions/Day (Proposed)

**Structure:**
- 1 Featured mission (hero, required for streak)
- 4 Additional missions (optional, library)
- Total: 5/day

**Advantages:**
- ✅ Significant engagement increase (5x content)
- ✅ Optional nature reduces pressure
- ✅ Featured mission preserved as hero
- ✅ Balances user agency with structure

**Chosen:** Best balance of engagement and sustainability


---

## USER FEEDBACK SCENARIOS

### Positive Feedback (Expected)

**Content-Hungry Users:**
> "Finally! I wanted to do more missions after finishing the daily one. The library is perfect."

**Progress-Focused Users:**
> "I can level up faster now by doing more missions. Love that it's optional but available."

**Skill-Building Users:**
> "Being able to practice different categories in one day helps me improve faster."

### Neutral Feedback (Expected)

**Casual Users:**
> "I still just do the featured mission. The library is there but I don't need it."
> → **This is fine!** Library doesn't pressure casual users.

**Time-Constrained Users:**
> "5 missions is a lot for one day. I do 2-3 usually."
> → **This is fine!** Users self-select engagement level.

### Negative Feedback (Potential)

**Completion Anxiety:**
> "Seeing 4 incomplete missions makes me feel like I'm falling behind."

**Mitigation:**
- Emphasize "optional" in messaging
- Progress card shows "2/5" as achievement, not deficit
- Featured mission completion still gives streak

**Progression Imbalance:**
> "Users who do 5 missions daily rank up way faster than me."

**Mitigation:**
- Ranks are personal progression, not competitive
- Casual users still progress at comfortable pace
- Can adjust rank thresholds if needed

**Content Repetition:**
> "I'm seeing the same missions repeat after completing the library."

**Mitigation:**
- Mission repetition is intentional (mastery through practice)
- Rotation algorithm ensures variety
- New content pipeline for future updates

---

## ONBOARDING FLOW CHANGES

### Current Onboarding

```
1. Sign up / Log in
2. Dashboard loads
3. User sees featured mission
4. Tooltip: "Complete daily missions to earn XP"
```

### Proposed Onboarding

```
1. Sign up / Log in
2. Dashboard loads
3. User sees featured mission + "ADDITIONAL TRAINING" section
4. Tooltip 1: "Complete the Featured Mission to maintain your streak"
5. User completes featured mission
6. Tooltip 2: "Great job! You can also access 4 more missions in the Training Library"
7. Highlight library tab with pulse animation
```

**First Library Visit:**
```
User taps library tab
↓
Welcome overlay:
┌─────────────────────────────────────┐
│ 📚 TRAINING LIBRARY                 │
│                                     │
│ Access additional missions to:      │
│ • Earn more XP                      │
│ • Practice different skills         │
│ • Progress faster                   │
│                                     │
│ Completing library missions is      │
│ optional. Focus on the featured     │
│ mission to maintain your streak.    │
│                                     │
│ [GOT IT]                            │
└─────────────────────────────────────┘
```


---

## VISUAL MOCKUPS (Text-Based)

### Dashboard - Before Featured Mission

```
┌──────────────────────────────────────────┐
│ ← BACK              MISSION COMMAND      │
│ OPS-01                                   │
│                                          │
│ [Avatar] OFFICER                         │
│          [████████▌▌] 850 / 1,200 XP    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 🔥 ACTIVE ENGAGEMENT                     │
│ 05 DAY STREAK                            │
│ Operational Consistency: Optimal         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 🔥 FEATURED MISSION                      │
│ [Hero Image: Grayscale + Gradient]      │
│ ┌─ PRIORITY: ALPHA                       │
│ │  Communication Drill                   │
│ └─ ID: COM-042                           │
│                                          │
│ [COMMUNICATION] • Reflect & Write        │
│ +50 XP                                   │
│                                          │
│ "Mastering persuasion skills..."        │
│                                          │
│ [COMMENCE MISSION →]                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ADDITIONAL TRAINING                      │
│ 4 missions available today               │
│                                          │
│ [VIEW TRAINING LIBRARY →]                │
└──────────────────────────────────────────┘
```

### Dashboard - After Featured Mission

```
┌──────────────────────────────────────────┐
│ ✓ FEATURED MISSION COMPLETE              │
│ Communication Drill                      │
│ +50 XP earned                            │
│ Primary objective achieved.              │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ADDITIONAL TRAINING                      │
│ 4 missions available today               │
│                                          │
│ [VIEW TRAINING LIBRARY →]                │
└──────────────────────────────────────────┘
```

### Library Screen - Main View

```
┌──────────────────────────────────────────┐
│ ← BACK              TRAINING LIBRARY     │
│ OPS-02                                   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ MISSION PROGRESS                         │
│ ▰▰▱▱▱  2/5 completed today               │
│                                          │
│ Featured Mission: ✓ Complete             │
│ Additional Training: 1/4 complete        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ CATEGORY FILTER                          │
│ [ALL] COM CONF LEAD AWR OT               │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ▸ CONFIDENCE                             │
│   Public speaking tactics                │
│   +60 XP • Daily Challenge               │
│   [START MISSION →]                      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ✓ LEADERSHIP                             │
│   Delegation priorities                  │
│   +50 XP • Poll + Reasoning              │
│   [COMPLETED ✓]                          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ▸ AWARENESS                              │
│   Environmental scanning                 │
│   +40 XP • Reflect & Write               │
│   [START MISSION →]                      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ▸ OFFICER THINKING                       │
│   Strategic decision matrix              │
│   +70 XP • Poll + Reasoning              │
│   [START MISSION →]                      │
└──────────────────────────────────────────┘
```

### Library Screen - All Complete

```
┌──────────────────────────────────────────┐
│ MISSION PROGRESS                         │
│ ▰▰▰▰▰  5/5 completed today               │
│                                          │
│ Featured Mission: ✓ Complete             │
│ Additional Training: 4/4 complete        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ 🎯 EXCELLENT WORK                        │
│                                          │
│ All missions completed for today.        │
│ New missions unlock tomorrow at 0600.    │
│                                          │
│ Total XP Earned Today: +240 XP           │
└──────────────────────────────────────────┘
```


---

## FREQUENTLY ASKED QUESTIONS

### Q1: Why 5 missions instead of 3 or 7?

**A:** 5 is the sweet spot:
- 1 featured (required for streak) + 4 optional
- ~25 minutes total engagement (manageable)
- Utilizes 70-mission library efficiently
- Not overwhelming, not too limited
- Tested balance in gamification research

### Q2: What if users only do library missions and ignore featured?

**A:** Featured mission is incentivized:
- Required for streak (most important metric)
- Highest XP priority
- Hero card on dashboard (visual prominence)
- Library missions complement, not replace

### Q3: Won't rapid XP progression devalue ranks?

**A:** Multiple perspectives:
- Engaged users deserve faster progression (reward)
- Casual users unaffected (same pace)
- Can adjust thresholds if needed
- Ranks are personal growth, not competition

### Q4: How does this affect streak logic?

**A:** Streak remains focused:
- Streak = Complete featured mission daily
- Library missions optional (don't affect streak)
- Streak reset if featured mission skipped
- Library provides bonus content, not requirement

### Q5: What happens when users complete all 70 missions?

**A:** Mission rotation by design:
- Unlock algorithm cycles through content
- Users see missions again (repetition aids mastery)
- Different responses each time (not duplicate submissions)
- New content pipeline for Phase 2+

### Q6: Do library missions have lower XP than featured?

**A:** No artificial penalties:
- All missions award full XP based on difficulty
- Featured mission not artificially inflated
- Library missions same quality/value
- User effort = XP reward (consistent)

### Q7: Can users complete library missions before featured?

**A:** Yes, full user agency:
- No forced order (featured then library)
- Users choose their own path
- Streak still requires featured completion
- Library accessible immediately

### Q8: Will this require backend changes?

**A:** Minimal backend work:
- Mission selection algorithm: client-side
- Completion tracking: existing table
- Only constraint change: allow multiple completions/day
- RPC updates: minor modifications

### Q9: How do you prevent users from completing the same mission twice in one day?

**A:** Database + UI enforcement:
- Check `mission_completions` for (user_id, mission_id, date)
- UI shows "COMPLETED" state (disabled button)
- Backend validates before allowing submission
- Error message if duplicate attempted

### Q10: What if a user's timezone changes?

**A:** Deterministic unlock handles it:
- Unlock based on join date + days elapsed
- "Today" calculated in IST (consistent)
- Timezone change doesn't affect unlock logic
- Missions remain available until next IST midnight

---

## CONCLUSION & RECOMMENDATION

### Summary

**Problem:** Single mission/day creates engagement gap and underutilizes content

**Solution:** Mission Library with 5 missions/day (1 featured + 4 additional)

**Key Benefits:**
- ✅ 5x content available daily
- ✅ Featured mission experience preserved
- ✅ Optional engagement (no pressure)
- ✅ No database schema changes
- ✅ Deterministic unlock algorithm
- ✅ Faster progression for engaged users
- ✅ Casual users unaffected

### Recommended Approach

**Phase 1 (Week 1):** Backend + navigation
- Update mission selection (5 instead of 1)
- Add library tab
- Update dashboard

**Phase 2 (Week 1-2):** Library screen
- Build mission cards
- Progress tracking
- Category filtering

**Phase 3 (Week 2):** Polish
- Animations
- Loading states
- Onboarding updates

**Phase 4 (Week 3+):** Monitor & iterate
- Track metrics
- Adjust based on user behavior
- Plan content expansion

### Success Criteria

**Engagement:**
- Session duration increases to 10-15 min
- Missions/day increases to 2.5-3.0 avg
- Daily return rate +15%

**Progression:**
- Casual users: unchanged pace
- Engaged users: 2-3x faster (reward)
- Overall satisfaction maintained

**Content:**
- 60%+ users explore library
- 40-60% missions from library
- All 5 categories used regularly

---

**Status:** PROPOSAL COMPLETE - Awaiting Approval for Implementation 🚀

