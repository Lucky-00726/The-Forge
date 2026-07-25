# DAY 3 - PHASE 2 REVISION: COMPREHENSIVE PROPOSAL

**Date:** 2026-06-13  
**Status:** PROPOSAL - Awaiting Approval  
**Scope:** Mission Experience Redesign + Daily Mission System  

---

## TASK A: MISSION EXPERIENCE REDESIGN

### Problem Statement
Current mission components feel like **forms** instead of **officer assessments**.

**Current Experience:**
- Generic labels ("YOUR RESPONSE", "SELECT YOUR ANSWER")
- Standard form inputs
- Minimal tactical styling
- No sense of being evaluated
- Low engagement visual hierarchy

**Desired Experience:**
- Feel like SSB interview / GTO task / Psychological testing
- Every interaction feels consequential
- Tactical, high-stakes presentation
- Clear assessment framing
- Officer-level language throughout

---

## MISSION COMPONENT REDESIGN PLAN

### 1. REFLECT & WRITE Redesign

#### Current State
```
┌─────────────────────────────┐
│ PROMPT                      │
│ [Question text]             │
└─────────────────────────────┘
┌─────────────────────────────┐
│ YOUR RESPONSE               │
│ [Textarea - looks like form]│
│ 0 / 30 words                │
│ [Progress bar]              │
└─────────────────────────────┘
[Submit Response]
```

#### Proposed Redesign
```
┌─────────────────────────────┐
│ ⚠ EVALUATION BRIEFING       │ ← Corner markers, tactical header
│                             │
│ [Prompt text in body-lg]    │
│ italic, high line-height    │
└─────────────────────────────┘

┌─────────────────────────────┐
│ OFFICER RESPONSE REQUIRED   │ ← Assessment framing
│ [Mono font, widest spacing] │
│                             │
│ [Text area]                 │
│ • Darker background         │
│ • Border: tactical color    │
│ • Mono font for input       │
│                             │
│ WORD COUNT: 0 / 30          │ ← Mono font, technical style
│ [Segmented progress bar]    │ ← 5 segments, gaps between
│                             │
│ STATUS: PREPARING           │ ← Live status indicator
└─────────────────────────────┘

[SUBMIT FOR EVALUATION →]
```

**Key Changes:**
1. **Assessment Language**
   - "OFFICER RESPONSE REQUIRED" (not "YOUR RESPONSE")
   - "EVALUATION BRIEFING" (not "PROMPT")
   - "SUBMIT FOR EVALUATION" (not "Submit Response")

2. **Visual Hierarchy**
   - Corner markers on briefing card
   - Segmented progress bar (5 segments with gaps)
   - Live status: "PREPARING" → "READY" → "SUBMITTING"
   - Technical metadata styling

3. **Input Experience**
   - Monospace font for text input (tactical aesthetic)
   - Darker background (feels like command terminal)
   - Character count with technical formatting
   - Real-time validation feedback

4. **Completion States**
   - "ASSESSMENT COMPLETE" screen
   - "RESPONSE RECORDED" confirmation
   - Tactical checkmark animation

---

### 2. POLL + REASONING Redesign

#### Current State
```
┌─────────────────────────────┐
│ QUESTION                    │
│ [Question text]             │
└─────────────────────────────┘
SELECT YOUR ANSWER
○ Option A
○ Option B
○ Option C
[Reasoning textarea appears]
```

#### Proposed Redesign
```
┌─────────────────────────────┐
│ SCENARIO ASSESSMENT         │ ← Corner markers
│ ID: POL-042                 │ ← Mission ID tag
│                             │
│ [Scenario text]             │
│ Bold, high-impact           │
└─────────────────────────────┘

┌─────────────────────────────┐
│ DECISION REQUIRED           │ ← Assessment framing
│                             │
│ SELECT COURSE OF ACTION:    │
│                             │
│ ▸ ALPHA   [Option A text]  │ ← Tactical bullet points
│ ▸ BRAVO   [Option B text]  │
│ ▸ CHARLIE [Option C text]  │
│ ▸ DELTA   [Option D text]  │
│                             │
│ [Selected option highlighted│
│  with tactical accent]      │
└─────────────────────────────┘

┌─────────────────────────────┐
│ TACTICAL REASONING          │ ← Only appears after selection
│ JUSTIFY YOUR DECISION:      │
│                             │
│ [Reasoning input]           │
│ Mono font, tactical style   │
│                             │
│ ANALYSIS: 0 / 20 WORDS      │
│ [Segmented progress]        │
└─────────────────────────────┘

[SUBMIT ASSESSMENT →]
```

**Key Changes:**
1. **Military Framing**
   - Options labeled: ALPHA, BRAVO, CHARLIE, DELTA
   - "DECISION REQUIRED" (not "SELECT YOUR ANSWER")
   - "TACTICAL REASONING" (not "Reasoning")
   - "JUSTIFY YOUR DECISION" (not "Explain your reasoning")

2. **Visual Treatment**
   - Corner markers on scenario card
   - Tactical bullet points (▸)
   - Selected option gets full highlight + corner markers
   - Mission ID tag (top-right)

3. **Progressive Disclosure**
   - Reasoning section only appears AFTER selection
   - Feels like: "Make decision → Now defend it"
   - Mirrors SSB process flow

4. **Status Indicators**
   - "DECISION: PENDING" → "DECISION: LOCKED" → "READY FOR SUBMISSION"
   - Live word count analysis
   - Completion status

---

### 3. DAILY CHALLENGE Redesign

#### Current State
```
┌─────────────────────────────┐
│ MISSION BRIEFING            │
│ [Briefing text]             │
└─────────────────────────────┘
┌─────────────────────────────┐
│ YOUR TASK                   │
│ [Task text]                 │
└─────────────────────────────┘
☐ MARK AS COMPLETED
[Optional reflection appears]
```

#### Proposed Redesign
```
┌─────────────────────────────┐
│ FIELD OPERATION             │ ← Corner markers
│ DURATION: 24:00:00          │ ← Countdown timer
│                             │
│ [Briefing in body-lg]       │
│ Professional tone           │
└─────────────────────────────┘

┌─────────────────────────────┐
│ MISSION PARAMETERS          │ ← Tactical framing
│                             │
│ PRIMARY OBJECTIVE:          │
│ [Task text, indented]       │
│                             │
│ COMPLETION CRITERIA:        │
│ • Execute task in real world│
│ • Observe outcomes          │
│ • Report findings           │
└─────────────────────────────┘

┌─────────────────────────────┐
│ MISSION STATUS              │ ← Interactive status card
│                             │
│ [Checkbox styled as]        │
│ ◯ MISSION INCOMPLETE        │ ← Tactical styling
│ ◉ MISSION EXECUTED          │ ← When checked
│                             │
│ Tap to confirm completion   │
└─────────────────────────────┘

┌─────────────────────────────┐ ← Only after completion
│ FIELD REPORT                │
│                             │
│ DOCUMENT YOUR OBSERVATIONS: │
│                             │
│ [Reflection input]          │
│ Tactical styling            │
│                             │
│ REPORT STATUS: OPTIONAL     │
└─────────────────────────────┘

[SUBMIT FIELD REPORT →]
```

**Key Changes:**
1. **Operation Framing**
   - "FIELD OPERATION" (not "Mission Briefing")
   - "PRIMARY OBJECTIVE" (not "YOUR TASK")
   - "MISSION EXECUTED" (not "Mark as completed")
   - "FIELD REPORT" (not "Reflection")

2. **Real-World Connection**
   - 24-hour countdown timer (resets daily)
   - "COMPLETION CRITERIA" bulleted list
   - "Execute in real world" language
   - "DOCUMENT YOUR OBSERVATIONS" (not "write reflection")

3. **Status Progression**
   ```
   MISSION INCOMPLETE (red accent)
   ↓
   MISSION EXECUTED (green accent)
   ↓
   REPORT SUBMITTED (complete)
   ```

4. **Visual Enhancement**
   - Corner markers on all sections
   - Timer with tactical font
   - Status changes color and icon
   - Field report optional but encouraged

---

## SHARED COMPONENTS TO CREATE

### 1. SegmentedProgressBar Component
```typescript
// Visual progress with gaps between segments
<SegmentedProgressBar
  segments={5}
  progress={60} // 0-100
  activeColor={Colors.success}
  inactiveColor={Colors.bgHighest}
/>
```

### 2. StatusIndicator Component
```typescript
// Live status with icon + text
<StatusIndicator
  status="preparing" | "ready" | "submitting" | "complete"
  label="RESPONSE STATUS"
/>
```

### 3. TacticalCheckbox Component
```typescript
// Military-styled checkbox
<TacticalCheckbox
  checked={completed}
  onToggle={() => setCompleted(!completed)}
  label="MISSION EXECUTED"
  uncheckedLabel="MISSION INCOMPLETE"
/>
```

### 4. CountdownTimer Component (Daily Challenge only)
```typescript
// 24-hour countdown
<CountdownTimer
  resetTime="00:00 IST"
  onComplete={() => console.log('New day')}
/>
```

---

## IMPLEMENTATION ORDER (Task A)

### Phase A1: Shared Components
1. Create SegmentedProgressBar
2. Create StatusIndicator
3. Create TacticalCheckbox
4. Create CountdownTimer

### Phase A2: Reflect & Write
1. Update component styling
2. Add corner markers to briefing card
3. Implement segmented progress
4. Add status indicator
5. Update button labels
6. Test submission flow

### Phase A3: Poll + Reasoning
1. Add corner markers
2. Implement ALPHA/BRAVO/CHARLIE/DELTA labeling
3. Progressive disclosure for reasoning section
4. Add mission ID tag
5. Implement selection highlighting
6. Test submission flow

### Phase A4: Daily Challenge
1. Add countdown timer
2. Redesign completion checkbox
3. Add corner markers
4. Update all labels
5. Progressive field report disclosure
6. Test submission flow

---

## TASK B: DAILY MISSION SYSTEM

### Problem Statement
**Current:** 1 mission per day → Empty dashboard after completion → "Come back tomorrow"  
**Goal:** 5 missions per day → Sustained engagement → 70-mission library utilization

---

## PROPOSED SYSTEM ARCHITECTURE

### Daily Mission Selection Logic

#### Option 1: Deterministic Category Rotation (RECOMMENDED)
```
Day 1: COM, CONF, LEAD, AWR, OT  (1 from each category)
Day 2: COM, CONF, LEAD, AWR, OT  (next 1 from each)
Day 3: COM, CONF, LEAD, AWR, OT  (next 1 from each)
...

Algorithm:
- User joins on Date X
- Days since join = daysSince(Date X)
- Week number = floor(daysSince / 7) + 1
- Day in week = (daysSince % 7) + 1
- For each category:
    offset = (daysSince * 1) % missionsInCategory
    mission = category_missions[offset]
```

**Advantages:**
- ✅ Deterministic (same user state always gets same missions)
- ✅ Balanced (1 mission per category daily)
- ✅ No database state to track
- ✅ Works offline (calculation only)
- ✅ Scales to 70+ missions easily

**Disadvantages:**
- ❌ Missions repeat after cycling through all in category
- ❌ No adaptive difficulty

---

#### Option 2: Featured + Pool System
```
Daily Featured Mission:
- 1 primary mission (hero card on dashboard)
- Selected from current week/day
- Highest XP reward
- Themed content

Additional Missions Pool:
- 4 missions from same week
- Different categories
- Lower priority visual treatment
```

**Advantages:**
- ✅ Clear hierarchy (1 hero, 4 supporting)
- ✅ Matches Stitch's single-mission focus
- ✅ Easy to present visually

**Disadvantages:**
- ❌ Featured selection logic needed
- ❌ Pool might feel "secondary"

---

#### Option 3: Difficulty Tiers
```
Daily Missions by Tier:
- 1 Easy (30 XP) - Quick warm-up
- 2 Medium (40-50 XP) - Standard training
- 1 Hard (60-70 XP) - Challenge mission
- 1 Bonus (varies) - Optional stretch goal
```

**Advantages:**
- ✅ Progressive difficulty
- ✅ Clear achievement ladder
- ✅ Bonus mission creates "extra credit" feel

**Disadvantages:**
- ❌ Requires difficulty rating in database
- ❌ Hard to balance difficulty across types

---

### RECOMMENDED APPROACH: Hybrid System

```
DAILY MISSION STRUCTURE:

1. PRIMARY FEATURED MISSION
   - Highest XP of the day (60-90 XP)
   - Hero card on dashboard
   - Week-appropriate content
   - Rotates through categories

2. CORE TRAINING MISSIONS (3)
   - Standard XP (40-50 XP)
   - Different categories
   - Compact card presentation
   - Always available

3. BONUS CHALLENGE (1)
   - Optional "stretch goal"
   - High difficulty
   - Extra XP reward
   - Can skip without penalty
```

---

## DASHBOARD UX REDESIGN

### Current Dashboard
```
┌─────────────────────────────┐
│ Profile Header              │
│ Streak Card                 │
│                             │
│ [ONE LARGE MISSION CARD]    │ ← Only this
│                             │
│ (Empty after completion)    │
└─────────────────────────────┘
```

### Proposed Dashboard (5 Missions)
```
┌─────────────────────────────┐
│ Profile Header              │
│ Streak Card                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🔥 PRIMARY MISSION          │ ← Featured, full hero card
│ [Large image section]        │
│ "Tactical Leadership Drill" │
│ +70 XP • PRIORITY: ALPHA    │
│ [COMMENCE MISSION →]        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ ADDITIONAL TRAINING         │ ← Section header
└─────────────────────────────┘

┌───────────────┬─────────────┐ ← 2x2 grid (compact)
│ Communication │ Confidence  │
│ +40 XP        │ +50 XP      │
│ [START]       │ [START]     │
├───────────────┼─────────────┤
│ Awareness     │ Leadership  │
│ +40 XP        │ +60 XP      │
│ [START]       │ [START]     │
└───────────────┴─────────────┘

┌─────────────────────────────┐
│ ⭐ BONUS CHALLENGE          │ ← Optional
│ High Difficulty • +90 XP    │
│ [ATTEMPT BONUS]             │
└─────────────────────────────┘
```

**Visual Hierarchy:**
1. **Primary Mission** - 40% of vertical space, full attention
2. **Additional Training** - 40% of space, grid layout
3. **Bonus Challenge** - 20% of space, optional feel

---

## DATABASE CHANGES REQUIRED

### Option 1: No Schema Changes (Use Existing)
**Use current schema + smart client-side logic**

```sql
-- NO CHANGES NEEDED
-- Existing fields sufficient:
-- missions.week_number
-- missions.unlock_day  
-- missions.category
-- missions.xp_reward
```

**Client-side calculation:**
```typescript
function getDailyMissions(userId: string, joinDate: Date): DbMission[] {
  const daysSinceJoin = calculateDaysSince(joinDate);
  const weekNum = Math.floor(daysSinceJoin / 7) + 1;
  const dayNum = (daysSinceJoin % 7) + 1;
  
  // Fetch all missions for week/day
  const missions = await fetchMissionsFor(weekNum, dayNum);
  
  // Client-side selection of 5
  return selectFiveMissions(missions, daysSinceJoin);
}
```

**Advantages:**
- ✅ Zero migration needed
- ✅ Works with existing 70 missions
- ✅ Deterministic logic
- ✅ No additional database state

---

### Option 2: Add Priority Field (Minimal Change)
```sql
ALTER TABLE missions 
ADD COLUMN priority_level TEXT 
CHECK (priority_level IN ('primary', 'standard', 'bonus'));

-- Update existing missions
UPDATE missions 
SET priority_level = 
  CASE 
    WHEN xp_reward >= 70 THEN 'primary'
    WHEN xp_reward >= 60 THEN 'bonus'
    ELSE 'standard'
  END;
```

**Advantages:**
- ✅ Clear visual hierarchy
- ✅ Easy to query: `WHERE priority_level = 'primary'`
- ✅ Minimal schema change

---

### Option 3: Daily Featured Table (Full Tracking)
```sql
CREATE TABLE daily_featured_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mission_id TEXT REFERENCES missions(id),
  featured_date DATE NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  position INTEGER, -- 1-5
  
  UNIQUE(user_id, featured_date, position)
);
```

**Advantages:**
- ✅ Perfect audit trail
- ✅ Supports personalization later
- ✅ Can track which missions user saw

**Disadvantages:**
- ❌ Requires migration
- ❌ Adds database state
- ❌ More complex query logic

---

## RECOMMENDED IMPLEMENTATION

### Database: Option 1 (No Changes)
- Use existing schema
- Client-side deterministic selection
- Simple, maintainable, scalable

### Mission Selection Algorithm
```typescript
function selectDailyFive(
  allMissions: DbMission[], 
  daysSinceJoin: number
): {
  primary: DbMission;
  core: DbMission[];
  bonus: DbMission | null;
} {
  // 1. Select primary (highest XP, rotate categories)
  const primary = selectPrimary(allMissions, daysSinceJoin);
  
  // 2. Select 3 core (different categories, medium XP)
  const core = selectCore(allMissions, primary.category);
  
  // 3. Select 1 bonus (highest difficulty available)
  const bonus = selectBonus(allMissions, [...core, primary]);
  
  return { primary, core, bonus };
}
```

### Dashboard Layout
- 1 Hero card (primary mission)
- 2x2 Grid (4 missions: 3 core + 1 bonus)
- Clear visual hierarchy
- All missions accessible immediately

---

## UI CHANGES REQUIRED

### Files to Modify
1. ✅ `app/(tabs)/index.tsx` - Dashboard redesign
2. ✅ `src/services/mission.service.ts` - Add `selectDailyFive()` function
3. ✅ `src/utils/date.ts` - Add `calculateDaysSince()` helper
4. ⚠️ NEW: `src/components/mission-grid/MissionGridCard.tsx` - Compact mission card
5. ⚠️ NEW: `src/components/mission-grid/BonusMissionCard.tsx` - Bonus styling

### New Components
1. **MissionGridCard** - Compact 2-column card
2. **BonusMissionCard** - Optional challenge presentation
3. **MissionProgressIndicator** - "2/5 COMPLETE" display

---

## COMPLETION TRACKING

### Current System
```sql
-- One row per day per user
UNIQUE(user_id, completed_date)
```

### With 5 Missions Per Day
```sql
-- KEEP EXISTING TABLE
-- NO SCHEMA CHANGE NEEDED

-- One row PER MISSION completion
mission_completions (
  user_id,
  mission_id,      -- Which mission
  completed_date   -- When completed
)

-- UNIQUE constraint removed
-- Can complete 5 missions same day
```

**Migration Required:**
```sql
ALTER TABLE mission_completions 
DROP CONSTRAINT uq_user_date;

-- New constraint: one completion per mission per user
ALTER TABLE mission_completions
ADD CONSTRAINT uq_user_mission 
UNIQUE(user_id, mission_id, completed_date);
```

**RPC Update:**
```sql
-- complete_mission() already handles this
-- No change needed - just remove unique_violation handling
```

---

## TESTING PLAN

### Scenarios to Test
1. ✅ User completes 0/5 missions → Dashboard shows all 5
2. ✅ User completes 1/5 → Dashboard shows remaining 4
3. ✅ User completes 5/5 → Dashboard shows completion state
4. ✅ New day → New 5 missions load
5. ✅ Primary mission always different category from yesterday
6. ✅ Bonus mission is optional (can skip)
7. ✅ XP calculation correct for all 5
8. ✅ Streak increments on ANY mission completion

---

## RISKS & MITIGATION

### Risk 1: Overwhelming User
**Risk:** 5 missions feels like too much work  
**Mitigation:**
- Clear "2/5 COMPLETE" progress indicator
- Bonus mission clearly optional
- Can complete over multiple sessions

### Risk 2: Mission Quality Dilution
**Risk:** Users rush through missions for XP  
**Mitigation:**
- Word count gates remain
- Validation unchanged
- Quality over quantity messaging

### Risk 3: Content Runs Out
**Risk:** 70 missions not enough for long-term  
**Mitigation:**
- Missions repeat after cycling (by design)
- Repetition = mastery (gamification principle)
- Plan for content expansion (Phase 2)

---

## ROLLOUT PLAN

### Stage 1: Mission Experience Redesign (This Phase)
- Implement A1-A4 (redesign 3 mission components)
- Test with existing 1-mission-per-day system
- Gather feedback on "officer assessment" feel

### Stage 2: Daily Mission System (Next Phase)
- Implement 5-mission selection logic
- Update dashboard layout
- Add mission grid components
- Migration for completion tracking

### Stage 3: Polish & Optimization (Future)
- Add mission history view
- Implement "mission library" browsing
- Add difficulty ratings
- Personalization engine

---

## SUCCESS METRICS

### Task A (Mission Experience)
- Mission completion rate ≥ 85%
- Time per mission < 5 minutes
- User feedback: "Feels like SSB" (qualitative)

### Task B (Daily System)
- Daily engagement rate ≥ 60%
- Average missions completed per day: 3-4
- User returns next day: ≥ 70%

---

## NEXT STEPS

1. **Review & Approve This Proposal**
2. **Decide Implementation Order:**
   - Option A: Task A first (mission experience), then Task B (system)
   - Option B: Task B first (system), then Task A (experience)
   - Option C: Parallel implementation (both together)
3. **Confirm Database Approach** (No changes vs. Priority field vs. Featured table)
4. **Proceed with Implementation**

---

**Awaiting your decision on:**
1. Approval of mission component redesign direction
2. Approval of 5-mission daily system approach
3. Database change preference (None / Minimal / Full)
4. Implementation order preference

*Do not proceed to implementation until approved.*
