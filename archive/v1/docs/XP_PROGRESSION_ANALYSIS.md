# THE FORGE — XP Progression Analysis
## Mission Library Architecture: Featured vs Training Missions

**Date:** June 13, 2026  
**Purpose:** Evaluate XP models to prevent rank inflation while preserving engagement  
**Context:** 70-mission content library with hybrid dashboard design (1 Featured + 4 Training missions/day)

---

## Current State Analysis

### Mission Library Structure
- **Total Missions:** 70 (35 Week 1 + 35 Week 2)
- **Daily Distribution:** 5 missions per day × 14 days
- **XP Range:** 30–90 XP per mission
- **Daily XP Potential (Full):** 220–280 XP/day

### Current Rank Thresholds
| Rank | XP Required | Milestone |
|---|---|---|
| Cadet | 0 XP | Starting rank |
| Officer | 400 XP | First promotion |
| Commander | 1200 XP | Beta ceiling |

### XP Distribution by Mission Type
From FORGE_CONTENT_V1.md analysis:

**Week 1 (35 missions):**
- 30 XP: 5 missions (Rapid Fire)
- 40 XP: 14 missions (Reflect & Write, Poll + Reasoning)
- 50 XP: 8 missions (Scenario)
- 60 XP: 6 missions (Daily Challenge, Special Scenario)
- 70 XP: 1 mission (Dilemma)
- 80 XP: 1 mission (Dilemma)
- **Week 1 Total:** 1,690 XP (average 241 XP/day)

**Week 2 (35 missions):**
- 30 XP: 7 missions (Rapid Fire)
- 40 XP: 12 missions (Reflect & Write, Poll + Reasoning)
- 50 XP: 8 missions (Scenario)
- 60 XP: 5 missions (Daily Challenge, Special Scenario)
- 70 XP: 1 mission (Dilemma)
- 80 XP: 1 mission (Dilemma)
- 90 XP: 1 mission (Ethics Dilemma)
- **Week 2 Total:** 1,740 XP (average 248 XP/day)

**Total Available:** 3,430 XP across 70 missions

---

## Problem Statement

**Current Risk:** If users complete all 5 missions daily at full XP:
- Day 2: Reach Officer (400 XP)
- Day 5: Reach Commander (1,200 XP)
- Day 14: Accumulate 3,430 XP (286% over Commander threshold)

**Consequences:**
- Rank progression feels meaningless
- No sense of scarcity or achievement
- Beta testers max out in under 1 week
- No ceiling-related retention pressure
- "Everyone gets a trophy" psychology

---

## Model A: Full XP for All Missions

### Configuration
- **Featured Mission:** Full XP (as specified in content library)
- **Training Missions:** Full XP (as specified in content library)
- **Daily XP:** 220–280 XP (5 missions × full value)

### Progression Timeline

| Day | Daily XP | Cumulative XP | Rank |
|---|---|---|---|
| 1 | 220 | 220 | Cadet |
| 2 | 250 | 470 | **Officer** (reached at 400) |
| 3 | 220 | 690 | Officer |
| 4 | 280 | 970 | Officer |
| 5 | 220 | 1,190 | Officer |
| 6 | 280 | 1,470 | **Commander** (reached at 1,200) |
| 7 | 220 | 1,690 | Commander |
| 8 | 230 | 1,920 | Commander |
| 9 | 240 | 2,160 | Commander |
| 10 | 260 | 2,420 | Commander |
| 11 | 260 | 2,680 | Commander |
| 12 | 230 | 2,910 | Commander |
| 13 | 270 | 3,180 | Commander |
| 14 | 250 | 3,430 | Commander |

**Days to Officer:** 2 days  
**Days to Commander:** 6 days  
**Final XP:** 3,430 XP (186% over Commander threshold after 8 days)

### Pros
✅ Simple — no XP calculation complexity  
✅ Every mission feels equally valuable  
✅ Matches user expectation from mission type labels  
✅ No perceived "punishment" for completing extra missions  
✅ Encourages exploration of all mission types

### Cons
❌ **Rank inflation:** Commander in 6 days, ceiling hit by Week 1  
❌ No scarcity — rank progression feels cheap  
❌ No retention hook after Day 6 (already maxed)  
❌ "Everyone gets a trophy" psychology  
❌ Beta testers accumulate 186% excess XP with nowhere to go  
❌ Featured vs Training distinction is cosmetic only  

### Recommendation
**Do NOT use for beta.** Progression is too fast and undermines the disciplined, elite product personality.

---

## Model B: Featured Full XP, Training 50% XP

### Configuration
- **Featured Mission:** Full XP (as specified in content library)
- **Training Missions:** 50% of base XP (rounded down)
- **Daily XP:** ~140–165 XP (1 featured @ full + 4 training @ 50%)

### Calculation Example (Day 1)
- Featured: Communication (50 XP) → **50 XP**
- Training 1: Confidence (40 XP) → **20 XP**
- Training 2: Leadership (30 XP) → **15 XP**
- Training 3: Awareness (40 XP) → **20 XP**
- Training 4: Officer Thinking (60 XP) → **30 XP**
- **Total:** 135 XP

### Progression Timeline (Using Week 1/2 daily XP averages)

Assumptions:
- Featured mission rotates through highest-XP mission each day
- Training missions are the remaining 4 at 50%
- Average featured XP: ~55 XP
- Average training XP per mission: ~22.5 XP (50% of 45 XP average)
- **Estimated daily XP:** ~145 XP

| Day | Daily XP | Cumulative XP | Rank |
|---|---|---|---|
| 1 | 135 | 135 | Cadet |
| 2 | 145 | 280 | Cadet |
| 3 | 135 | 415 | **Officer** (reached at 400) |
| 4 | 165 | 580 | Officer |
| 5 | 135 | 715 | Officer |
| 6 | 165 | 880 | Officer |
| 7 | 135 | 1,015 | Officer |
| 8 | 145 | 1,160 | Officer |
| 9 | 150 | 1,310 | **Commander** (reached at 1,200) |
| 10 | 160 | 1,470 | Commander |
| 11 | 160 | 1,630 | Commander |
| 12 | 145 | 1,775 | Commander |
| 13 | 165 | 1,940 | Commander |
| 14 | 150 | 2,090 | Commander |

**Days to Officer:** 3 days  
**Days to Commander:** 9 days  
**Final XP:** ~2,090 XP (74% over Commander threshold)

### Pros
✅ **Balanced progression:** Officer by Day 3, Commander by Day 9  
✅ Featured mission has clear mechanical advantage (not just cosmetic)  
✅ Training missions still valuable but not equivalent  
✅ Encourages strategic prioritization ("Do I complete training today or save energy?")  
✅ Creates scarcity without feeling punitive  
✅ Leaves room for V2 features (multipliers, streaks) to matter  
✅ 50% is intuitive and easy to communicate  

### Cons
⚠️ Users may feel "cheated" if they expect full XP for training missions  
⚠️ Requires UI clarity: "Training Mission (+20 XP)" vs "Featured Mission (+50 XP)"  
⚠️ Still hits Commander ceiling by Day 9 (5 days before content ends)  
⚠️ 74% XP excess at end of Week 2  

### Recommendation
**Strong candidate for beta.** Balances progression speed with engagement. Requires clear UI communication but creates meaningful choice architecture.

---

## Model C: Featured Full XP, Training Fixed Reduced XP

### Configuration
- **Featured Mission:** Full XP (as specified in content library)
- **Training Missions:** Fixed XP per mission type (ignores base value)
  - Rapid Fire: **10 XP**
  - Reflect & Write: **15 XP**
  - Poll + Reasoning: **15 XP**
  - Daily Challenge: **20 XP**
  - Scenario: **20 XP**
  - Dilemma: **25 XP**
- **Daily XP:** ~110–135 XP (1 featured @ full + 4 training @ fixed)

### Calculation Example (Day 1)
- Featured: Communication Scenario (50 XP) → **50 XP**
- Training 1: Reflect & Write (40 XP base) → **15 XP**
- Training 2: Rapid Fire (30 XP base) → **10 XP**
- Training 3: Poll + Reasoning (40 XP base) → **15 XP**
- Training 4: Daily Challenge (60 XP base) → **20 XP**
- **Total:** 110 XP

### Progression Timeline

| Day | Featured | Training Total | Daily XP | Cumulative XP | Rank |
|---|---|---|---|---|---|
| 1 | 50 | 60 | 110 | 110 | Cadet |
| 2 | 50 | 70 | 120 | 230 | Cadet |
| 3 | 50 | 60 | 110 | 340 | Cadet |
| 4 | 90 | 65 | 155 | 495 | **Officer** (at 400) |
| 5 | 40 | 70 | 110 | 605 | Officer |
| 6 | 80 | 65 | 145 | 750 | Officer |
| 7 | 60 | 60 | 120 | 870 | Officer |
| 8 | 60 | 65 | 125 | 995 | Officer |
| 9 | 50 | 70 | 120 | 1,115 | Officer |
| 10 | 50 | 65 | 115 | 1,230 | **Commander** (at 1,200) |
| 11 | 90 | 60 | 150 | 1,380 | Commander |
| 12 | 40 | 70 | 110 | 1,490 | Commander |
| 13 | 80 | 65 | 145 | 1,635 | Commander |
| 14 | 50 | 65 | 115 | 1,750 | Commander |

**Days to Officer:** 4 days  
**Days to Commander:** 10 days  
**Final XP:** ~1,750 XP (46% over Commander threshold)

### Pros
✅ **Slowest, most sustainable progression:** Officer Day 4, Commander Day 10  
✅ Featured mission is dramatically more valuable (3–5× training XP)  
✅ Training missions feel like "practice" not "main event"  
✅ Lowest XP inflation (46% excess vs 74–186%)  
✅ Leaves most room for V2 expansion (more ranks, multipliers)  
✅ Reinforces product discipline ("Every rep counts, but focus on the mission")  

### Cons
❌ **Complexity:** 6 different fixed XP values to track  
❌ Training missions may feel "not worth it" (15 XP for 5-minute mission)  
❌ Risk of user frustration ("Why is this worth so little?")  
❌ Harder to communicate than 50% model  
❌ Feels more arbitrary (Why 15 XP specifically?)  
❌ May discourage exploration of training library  

### Recommendation
**Use only if beta data shows Model B causes rank inflation.** More complex and risks discouraging training mission engagement.

---

## Side-by-Side Comparison

| Metric | Model A | Model B | Model C |
|---|---|---|---|
| **Days to Officer** | 2 | 3 | 4 |
| **Days to Commander** | 6 | 9 | 10 |
| **Week 2 Total XP** | 3,430 XP | ~2,090 XP | ~1,750 XP |
| **XP Excess at D14** | +2,230 (186%) | +890 (74%) | +550 (46%) |
| **Featured vs Training XP Gap** | None | 2× | 3–5× |
| **Complexity** | Low | Low | High |
| **User Frustration Risk** | Low | Medium | High |
| **Rank Inflation Risk** | Extreme | Moderate | Low |
| **Engagement Risk** | Low | Low | Medium |

---

## Recommendation for Beta

### Primary Recommendation: **Model B (Featured Full, Training 50%)**

**Rationale:**
1. **Balanced progression:** Officer by Day 3 feels achievable but not trivial. Commander by Day 9 preserves aspiration through Week 2.
2. **Clear value hierarchy:** Featured mission = 2× training value creates strategic choice without punishing exploration.
3. **Low complexity:** 50% is intuitive. UI can show both values: "Training Mission: Confidence (+20 XP from 40 XP base)"
4. **Preserves engagement:** Training missions still worth 15–40 XP — not trivial.
5. **Room for iteration:** If beta data shows Commander is still reached too fast, dial training to 40% or 33%.

**Implementation Notes:**
- Featured mission selection logic: TBD (highest XP? Category rotation? User choice?)
- UI must clearly label "FEATURED MISSION" and "TRAINING MISSION" with XP values
- Profile screen should show: "Completed 1 Featured + 3 Training today"
- Success screen should differentiate: "Featured Mission Complete: +50 XP" vs "Training Mission Complete: +20 XP"

---

### Fallback Recommendation: **Model C (Fixed Reduced XP)**

**Use if:**
- Beta data from Model B shows >60% of users hit Commander before Day 10
- User feedback indicates "I have nothing left to achieve" sentiment
- V2 roadmap includes many more ranks (needs slower baseline progression)

**Risk:** May discourage training mission engagement. Monitor completion rates carefully.

---

### Model A Rejected

**Do NOT use Model A.** 
- Commander in 6 days undermines elite, disciplined product personality
- No retention hook after Week 1
- Beta testers will hit ceiling and churn before providing meaningful feedback
- Featured vs Training distinction becomes cosmetic-only (no mechanical weight)

---

## Open Questions for Implementation

### 1. Featured Mission Selection Logic
How is "Featured Mission" determined each day?

**Option A: Highest XP Mission**
- Pro: Simple deterministic rule
- Con: Always prioritizes Dilemmas/Scenarios, neglects Rapid Fire

**Option B: Category Rotation**
- Pro: Ensures all categories get featured status
- Con: Predictable, less dynamic

**Option C: User Choice**
- Pro: Maximum agency
- Con: Requires "Choose Featured Mission" UI flow

**Recommendation:** Start with **Option A (Highest XP)** for beta simplicity. User choice is V2 feature.

---

### 2. UI Labeling
How do we communicate Featured vs Training in the UI?

**Dashboard Approach:**
```
┌─────────────────────────────────────┐
│  TODAY'S FEATURED MISSION           │
│  ⭐ COMMUNICATION DRILL              │
│  SSB Scenario • 50 XP               │
│  ────────────────────────────────   │
│  [COMMENCE MISSION]                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  TRAINING MISSIONS                  │
│  ├─ Confidence • Reflect & Write • 20 XP (50% of 40)
│  ├─ Leadership • Rapid Fire • 15 XP (50% of 30)
│  ├─ Awareness • Poll + Reasoning • 20 XP (50% of 40)
│  └─ Officer Thinking • Daily Challenge • 30 XP (50% of 60)
└─────────────────────────────────────┘
```

**Success Screen Differentiation:**
- Featured: "MISSION COMPLETE: +50 XP" (large, amber)
- Training: "Training Complete: +20 XP" (smaller, secondary color)

---

### 3. Database Schema Impact
Does this require DB changes?

**No schema changes required.** 
- `missions.xp_reward` remains the base XP value
- XP calculation logic moves to `complete_mission()` RPC:
  ```sql
  IF mission_is_featured THEN
    awarded_xp := mission.xp_reward;
  ELSE
    awarded_xp := FLOOR(mission.xp_reward * 0.5);
  END IF;
  ```
- Mission "featured" status determined client-side or passed as RPC parameter

---

### 4. What Happens When User Completes All 5 Missions?
Do they still get credit for extra completions?

**Beta Policy:**
- User CAN complete all 5 missions in one day
- Each completion is recorded in `mission_completions` table
- XP is awarded per mission (1 featured + 4 training)
- No daily cap in V1
- Profile shows: "Missions Completed Today: 5/5"

**V2 Consideration:** Add daily cap (1 featured + 2 training max/day) if beta shows completion rate >80% causing burnout.

---

## Next Steps

1. **Get User Approval:** Present this analysis, confirm Model B selection
2. **Define Featured Mission Logic:** Decide selection algorithm (recommend: highest XP)
3. **Design Dashboard UI:** Wireframe Featured + Training sections (reference Stitch design)
4. **Update RPC Logic:** Modify `complete_mission()` to accept featured flag and calculate XP accordingly
5. **Update Mission Service:** Add `fetchFeaturedMission()` and `fetchTrainingMissions()` functions
6. **Update Success Screen:** Differentiate Featured vs Training completion UI
7. **Seed Featured Logic:** Determine Week 1 Day 1 featured mission for initial test

---

## Appendix: Daily XP Breakdown by Model

### Model B (50%) — Daily XP Detail

| Day | Featured | Training (4 missions @ 50%) | Daily Total | Cumulative |
|---|---|---|---|---|
| W1D1 | 50 | 85 (40+30+40+60 → 20+15+20+30) | 135 | 135 |
| W1D2 | 70 | 90 (50+60+30+40 → 25+30+15+20) | 160 | 295 |
| W1D3 | 50 | 85 (40+60+40+30 → 20+30+20+15) | 135 | 430 |
| W1D4 | 90 | 95 (40+50+60+40 → 20+25+30+20) | 185 | 615 |
| W1D5 | 50 | 85 (40+30+40+60 → 20+15+20+30) | 135 | 750 |
| W1D6 | 80 | 100 (40+50+50+60 → 20+25+25+30) | 180 | 930 |
| W1D7 | 60 | 80 (40+30+50+40 → 20+15+25+20) | 140 | 1,070 |
| W2D1 | 60 | 85 (30+40+40+60 → 15+20+20+30) | 145 | 1,215 |
| W2D2 | 80 | 80 (50+30+40+40 → 25+15+20+20) | 160 | 1,375 |
| W2D3 | 70 | 95 (50+30+60+50 → 25+15+30+25) | 165 | 1,540 |
| W2D4 | 90 | 85 (40+30+40+60 → 20+15+20+30) | 175 | 1,715 |
| W2D5 | 60 | 85 (30+60+40+40 → 15+30+20+20) | 145 | 1,860 |
| W2D6 | 80 | 95 (50+30+50+60 → 25+15+25+30) | 175 | 2,035 |
| W2D7 | 60 | 95 (40+50+60+50 → 20+25+30+25) | 155 | 2,190 |

**Average Daily XP (Model B):** ~156 XP  
**Officer Reached:** Day 3 (430 XP cumulative)  
**Commander Reached:** Day 9 (1,310 XP cumulative)

---

*End of XP_PROGRESSION_ANALYSIS.md*
