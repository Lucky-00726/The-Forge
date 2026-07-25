# FUNNEL METRICS DESIGN
**For:** The Forge Beta Launch  
**Date:** June 18, 2026  
**Purpose:** Retention measurement before Gemini AI integration

---

## OVERVIEW

Track user progression through Day 0 training flow to identify drop-off points and optimize retention before implementing AI evaluation features.

---

## TRACKED EVENTS

### Session Events
| Event | Trigger | Metadata Captured |
|-------|---------|-------------------|
| **session1_started** | User enters Session 1 (Day 0) | userId, sessionNumber: 1, timestamp |
| **session1_completed** | User completes Session 1 | userId, sessionNumber: 1, completionTimeSeconds, score, totalQuestions, xpEarned, timestamp |
| **session2_started** | User enters Session 2 | userId, sessionNumber: 2, timestamp |
| **session2_completed** | User completes Session 2 | userId, sessionNumber: 2, completionTimeSeconds, score, totalQuestions, xpEarned, timestamp |
| **session3_started** | User enters Session 3 | userId, sessionNumber: 3, timestamp |
| **session3_completed** | User completes Session 3 | userId, sessionNumber: 3, completionTimeSeconds, totalQuestions, xpEarned, timestamp |
| **day0_completed** | User completes all 3 sessions | userId, timestamp |

---

## FUNNEL VISUALIZATION

```
┌───────────────────────────────────────────────────────────────┐
│                    DAY 0 COMPLETION FUNNEL                    │
└───────────────────────────────────────────────────────────────┘

SESSION 1 STARTED
    │  100% (baseline)
    ├─────────────────────────────────────────────────────────┐
    │                                                         │
    ▼                                                         ▼
SESSION 1 COMPLETED                                   SESSION 1 ABANDONED
    │  Target: >85%                                      │  Max: <15%
    │                                                    └─ Drop-off Point #1
    ▼
SESSION 2 STARTED
    │  Target: >90% (of Session 1 completers)
    ├─────────────────────────────────────────────────────────┐
    │                                                         │
    ▼                                                         ▼
SESSION 2 COMPLETED                                   SESSION 2 ABANDONED
    │  Target: >80%                                      │  Max: <20%
    │                                                    └─ Drop-off Point #2
    ▼
SESSION 3 STARTED
    │  Target: >90% (of Session 2 completers)
    ├─────────────────────────────────────────────────────────┐
    │                                                         │
    ▼                                                         ▼
SESSION 3 COMPLETED                                   SESSION 3 ABANDONED
    │  Target: >70%                                      │  Max: <30%
    │                                                    └─ Drop-off Point #3
    ▼
DAY 0 COMPLETED
    │  Target: >60% (of Session 1 starters)
    └─ SUCCESS: User ready for Day 1
```

---

## KEY METRICS

### 1. COMPLETION RATES
**Formula:** (Completed / Started) × 100

```typescript
session1CompletionRate = (session1_completed / session1_started) × 100
session2CompletionRate = (session2_completed / session2_started) × 100
session3CompletionRate = (session3_completed / session3_started) × 100
overallCompletionRate = (day0_completed / session1_started) × 100
```

**Targets:**
- Session 1: **>85%** (quick MCQ, should retain most)
- Session 2: **>80%** (mixed types, moderate difficulty)
- Session 3: **>70%** (subjective, higher cognitive load)
- Overall Day 0: **>60%** (end-to-end completion)

---

### 2. DROP-OFF POINTS
**Formula:** (Started - Completed) / Started × 100

```typescript
session1DropOff = ((session1_started - session1_completed) / session1_started) × 100
session2DropOff = ((session2_started - session2_completed) / session2_started) × 100
session3DropOff = ((session3_started - session3_completed) / session3_started) × 100
```

**Red Flags:**
- Session 1 drop-off **>15%** → Questions too hard or too boring
- Session 2 drop-off **>20%** → Mixed types confusing or timer too aggressive
- Session 3 drop-off **>30%** → Subjective questions too demanding

---

### 3. SESSION TRANSITION RATES
**Formula:** (Next Session Started / Previous Session Completed) × 100

```typescript
s1_to_s2_transition = (session2_started / session1_completed) × 100
s2_to_s3_transition = (session3_started / session2_completed) × 100
```

**Targets:**
- Session 1 → 2: **>90%** (seamless flow)
- Session 2 → 3: **>90%** (momentum maintained)

**Red Flag:** <85% indicates friction in transition (button not visible, unclear flow)

---

### 4. AVERAGE COMPLETION TIMES
**Formula:** Sum(completionTimeSeconds) / Count(completed)

```typescript
avgSession1Time = SUM(session1_completed.completionTimeSeconds) / COUNT(session1_completed)
avgSession2Time = SUM(session2_completed.completionTimeSeconds) / COUNT(session2_completed)
avgSession3Time = SUM(session3_completed.completionTimeSeconds) / COUNT(session3_completed)
totalAvgTime = avgSession1Time + avgSession2Time + avgSession3Time
```

**Expected Times:**
- Session 1: 5-7 minutes (300-420s)
- Session 2: 7-9 minutes (420-540s)
- Session 3: 11-13 minutes (660-780s)
- **Total:** 23-29 minutes (1380-1740s)

**Red Flags:**
- Session 1 >10 min → Questions too hard, explanations too long
- Session 2 >12 min → RapidResponse timer not working, users overthinking
- Session 3 >18 min → Too many questions, word count requirements too high

---

## ANALYSIS FRAMEWORK

### COHORT SEGMENTATION

Track completion rates by:
1. **Time of Day:** Morning (6-12), Afternoon (12-18), Evening (18-24), Night (0-6)
2. **Device Type:** iOS vs Android
3. **User Target:** NDA, CDS, NCC, GENERAL
4. **Day of Week:** Monday-Sunday

**Goal:** Identify patterns (e.g., "Evening users have 20% higher completion")

---

### BEHAVIORAL PATTERNS

**Fast Completers** (Total time <20 min):
- Completion rate: ?
- Accuracy: ?
- Hypothesis: Gaming for XP vs genuinely skilled

**Slow Completers** (Total time >35 min):
- Completion rate: ?
- Accuracy: ?
- Hypothesis: Thorough thinking vs struggling with content

**Optimal Range** (23-29 min):
- Target cohort for understanding ideal user behavior

---

### DROP-OFF ANALYSIS

For each abandoned session, track:
1. **Question Number at Abandonment** (if mid-session)
2. **Time Spent Before Abandonment**
3. **Previous Session Score** (if applicable)
4. **Device Type / Time of Day**

**Goal:** Identify specific questions or patterns causing drop-offs

---

## DASHBOARD DESIGN

### REAL-TIME METRICS (Beta Admin Panel)

```
┌─────────────────────────────────────────────────────────────┐
│                 DAY 0 FUNNEL - LAST 7 DAYS                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SESSION 1                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%      │
│  Started: 1,234 users                                       │
│                                                             │
│  SESSION 1 COMPLETED                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87%            │
│  Completed: 1,073 users | Drop-off: 13% ✓                  │
│  Avg Time: 6m 12s ✓                                         │
│                                                             │
│  SESSION 2 STARTED                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 92%             │
│  Started: 987 users | Transition: 92% ✓                    │
│                                                             │
│  SESSION 2 COMPLETED                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 83%                 │
│  Completed: 819 users | Drop-off: 17% ✓                    │
│  Avg Time: 8m 34s ✓                                         │
│                                                             │
│  SESSION 3 STARTED                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 89%                  │
│  Started: 729 users | Transition: 89% ⚠️                   │
│                                                             │
│  SESSION 3 COMPLETED                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 72%                      │
│  Completed: 525 users | Drop-off: 28% ✓                    │
│  Avg Time: 12m 18s ✓                                        │
│                                                             │
│  DAY 0 COMPLETE                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 62%                       │
│  Completed: 765 users                                       │
│  Overall Completion: 62% ✓                                  │
│  Avg Total Time: 27m 04s ✓                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

✓ = Meeting target
⚠️ = Below target, needs attention
❌ = Critical issue
```

---

## ALERTING THRESHOLDS

### Critical Alerts (Immediate Action Required)
- Session 1 completion <70%
- Session 2 completion <65%
- Session 3 completion <55%
- Overall Day 0 completion <45%
- Any session avg time >150% of expected

### Warning Alerts (Monitor Closely)
- Session 1 completion 70-85%
- Session 2 completion 65-80%
- Session 3 completion 55-70%
- Overall Day 0 completion 45-60%
- Transition rates <85%

---

## IMPLEMENTATION CHECKLIST

**✅ COMPLETED:**
- [x] Analytics service created (`analytics.service.ts`)
- [x] Event tracking added to Session 1
- [x] Event tracking added to Session 2
- [x] Event tracking added to Session 3
- [x] Day 0 completion event tracking
- [x] Completion time captured for all sessions
- [x] Funnel metrics calculation function

**🔲 TODO (Post-Launch):**
- [ ] Set up analytics backend (Mixpanel/Amplitude/Custom)
- [ ] Implement AsyncStorage persistence for offline tracking
- [ ] Build admin dashboard for real-time metrics
- [ ] Set up automated alerting (email/Slack)
- [ ] Export analytics data for analysis
- [ ] A/B testing framework for optimization

---

## DATA PRIVACY & COMPLIANCE

**Collected Data:**
- User ID (anonymized UUID)
- Event type and timestamp
- Session performance metrics (completion time, score, XP)

**NOT Collected:**
- User responses content (Session 3 answers)
- Personal information
- Device identifiers beyond platform type

**Compliance:**
- Data stored locally on device (beta)
- No third-party tracking yet
- User can clear analytics data via app settings

---

## BETA LAUNCH OBJECTIVES

### Week 1 Goals (June 20-27, 2026)
- [ ] Collect 100+ Day 0 attempts
- [ ] Identify primary drop-off point
- [ ] Validate average completion times
- [ ] Measure overall Day 0 completion rate

### Week 2 Goals (June 28 - July 4, 2026)
- [ ] Iterate on identified friction points
- [ ] A/B test changes (if needed)
- [ ] Achieve **>60% Day 0 completion** consistently
- [ ] Document insights for AI integration planning

---

## SUCCESS CRITERIA

Before proceeding to Gemini AI integration, we must achieve:

✅ **Session 1:** >85% completion  
✅ **Session 2:** >80% completion  
✅ **Session 3:** >70% completion  
✅ **Overall:** >60% Day 0 completion  
✅ **Avg Time:** 23-29 minutes total  
✅ **Transitions:** >85% between sessions  

**If targets not met:**
1. Analyze drop-off points
2. Interview users who abandoned
3. Iterate on content/UX
4. Retest before AI integration

---

## NEXT STEPS AFTER BETA

1. **Week 1:** Monitor funnel, collect data
2. **Week 2:** Identify patterns, iterate
3. **Week 3:** Achieve target metrics
4. **Week 4:** Begin Gemini AI integration with validated flow

**Do NOT proceed to AI implementation until funnel metrics meet targets.**

---

## APPENDIX: SAMPLE QUERIES

### Get Completion Rate
```typescript
const events = await getLocalAnalytics();
const metrics = calculateFunnelMetrics(events);
console.log(`Session 1: ${metrics.session1.completionRate}%`);
console.log(`Session 2: ${metrics.session2.completionRate}%`);
console.log(`Session 3: ${metrics.session3.completionRate}%`);
console.log(`Overall: ${metrics.overallCompletionRate}%`);
```

### Get Average Times
```typescript
console.log(`Session 1 avg: ${metrics.session1.averageTimeSeconds}s`);
console.log(`Session 2 avg: ${metrics.session2.averageTimeSeconds}s`);
console.log(`Session 3 avg: ${metrics.session3.averageTimeSeconds}s`);
```

### Get Drop-Off Counts
```typescript
const s1Dropoff = metrics.session1.started - metrics.session1.completed;
const s2Dropoff = metrics.session2.started - metrics.session2.completed;
const s3Dropoff = metrics.session3.started - metrics.session3.completed;
```

---

**PRIORITY:** Retention measurement > AI quality  
**FOCUS:** Validate flow, then enhance with intelligence  
**MANTRA:** "Make it sticky, then make it smart"
