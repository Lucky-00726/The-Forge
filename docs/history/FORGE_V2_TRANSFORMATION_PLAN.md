# FORGE V2 — TRANSFORMATION PLAN

**Date:** June 14, 2026  
**Purpose:** Complete architectural transformation from mission-based gamification to SSB training platform  
**Approach:** Inventory → Strategy → Implementation

---

## EXECUTIVE SUMMARY

Forge V1 is a daily mission app with generic self-improvement content and complex mission rotation logic.

Forge V2 is an SSB preparation platform delivering structured training days with focused question types, AI evaluation, and direct SSB test coverage.

This document provides:
1. Complete file inventory (keep/modify/archive/delete)
2. Database migration strategy
3. New architecture design
4. Implementation sequence

No alternatives. No proposals. **This is the plan.**

---

## PART 1: FILE INVENTORY

### FILES TO KEEP (No Changes)

**Core Infrastructure:**
- `babel.config.js` — Build configuration
- `app.config.ts` — Expo configuration
- `.gitignore` — Version control rules
- `.env` / `.env.example` — Environment templates
- `package.json` — Dependencies (review later for optimization)

**Design System:**
- `src/constants/tokens.ts` — Colors, fonts, spacing remain valid
- `src/components/ui/CornerMarkers.tsx` — Tactical aesthetic component
- `src/components/ui/ScreenMeta.tsx` — Operational metadata display
- `src/components/ui/TacticalButton.tsx` — Primary action button

**Assets:**
- `assets/` — Icons, splash, fonts (no changes)

**Auth Architecture:**
- `app/(auth)/_layout.tsx` — Auth stack layout
- `app/(auth)/login.tsx` — Login screen
- `app/(auth)/signup.tsx` — Signup screen
- `app/(auth)/forgot-password.tsx` — Password reset
- `app/(auth)/check-email.tsx` — Email verification
- `authstore.ts` — Zustand auth store (retain)
- `src/store/auth.store.ts` — Auth state management
- `src/hooks/useAuth.ts` — Auth hook

**Utilities:**
- `src/utils/date.ts` — Date utilities (reusable)
- `src/utils/validation.ts` — Input validation

---

### FILES TO MODIFY

#### Database Layer

**File:** `supabase/migrations/001_initial_schema.sql`  
**Changes:**
- Replace `missions` table with `training_days`, `sessions`, `questions`
- Add `question_type` enum: `MCQ | Single Word | Numeric | Rapid Response | Subjective`
- Remove `mission_completions` → Replace with `session_progress` and `question_responses`
- Add `xp_events` table for granular XP tracking
- Add `achievements` table for gamification
- Keep `users` table structure (XP, streak, rank logic remains valid)

**File:** `src/services/supabase.ts`  
**Changes:**
- Update to include new database schema types
- No architectural changes needed

#### Type Definitions

**File:** `src/types/index.ts`  
**Changes:**
- Remove: `MissionCategory`, `MissionType`, `DbMission`, `DbMissionCompletion`
- Add:
  - `TrainingDay` — Day structure with 3 sessions
  - `Session` — 20/40/25 question groups
  - `QuestionType` — MCQ, Single Word, Numeric, Rapid Response, Subjective
  - `Question` — Question entity
  - `QuestionResponse` — User answer entity
  - `SessionProgress` — Session completion tracking
- Keep: `DbUser`, `RANK_THRESHOLDS` (XP/rank system unchanged)

#### UI Screens

**File:** `app/(tabs)/_layout.tsx`  
**Changes:**
- Keep 3-tab structure
- Rename "Training" → "Library" or keep as "Training"
- Icons update if needed

**File:** `app/(tabs)/index.tsx` (Dashboard)  
**Changes:**
- Remove featured mission logic
- Display current training day (e.g., "Day 3 — Session 2")
- Show progress: "15/40 questions complete"
- CTA: "Continue Training" → Routes to current session
- Keep streak/XP/rank display

**File:** `app/(tabs)/missions.tsx` (Training Library)  
**Changes:**
- Replace mission list with training day cards
- Show Days 0-8 with lock states:
  - **Day 0-Current:** Accessible
  - **Future Days:** Locked with "Coming Soon"
- Each day card shows:
  - Day number
  - Title (e.g., "OIR Fundamentals")
  - Session progress (3/3 complete)
  - XP earned vs total
  - Status badge

**File:** `app/(tabs)/profile.tsx`  
**Changes:**
- Update stats to reflect V2 metrics:
  - Training days completed
  - Questions answered
  - Accuracy rate (if tracking)
- Remove mission-specific references

**File:** `app/mission/[id].tsx`  
**Action:** DELETE (replaced by training flow)

**File:** `app/mission/success.tsx` & `app/mission/failure.tsx`  
**Action:** MODIFY
- Rename folder: `app/mission/` → `app/session/`
- Create:
  - `app/session/question.tsx` — Single question screen
  - `app/session/summary.tsx` — Session complete summary (replaces success)
  - `app/day-complete.tsx` — Day completion screen

#### Mission Type Components

**Folder:** `src/components/mission-types/`  
**Action:** DELETE entire folder

**Replace with:** `src/components/question-types/`
- `MCQQuestion.tsx` — Multiple choice (4 options)
- `SingleWordQuestion.tsx` — Text input (1 word answer)
- `NumericQuestion.tsx` — Number input
- `RapidResponseQuestion.tsx` — Timed decision (reuse timer logic)
- `SubjectiveQuestion.tsx` — Paragraph text input

#### Services

**File:** `src/services/mission.service.ts`  
**Action:** DELETE

**Replace with:**
- `src/services/training.service.ts`
  - `fetchTrainingDay(dayNumber)`
  - `fetchSession(dayNumber, sessionNumber)`
  - `submitQuestionResponse(questionId, answer, timeTaken)`
  - `completeSession(sessionId)`
  - `getSessionProgress(sessionId)`
- `src/services/ai-evaluation.service.ts`
  - `evaluateSubjectiveAnswer(question, userAnswer)`
  - Returns: `{ score: number, strengths: string[], weaknesses: string[], suggestions: string[] }`

#### Hooks

**File:** `src/hooks/useMissionEngine.ts`  
**Action:** DELETE

**Replace with:**
- `src/hooks/useTrainingEngine.ts`
  - `loadSession(dayNum, sessionNum)`
  - `submitAnswer(questionId, answer, timeTaken)`
  - `nextQuestion()`
  - `completeSession()`

---

### FILES TO ARCHIVE

Move to `archive/v1/` folder (do not delete, preserve for reference):

- `supabase/migrations/003_seed_week1_week2_missions.sql`
- `supabase/migrations/004_mission_library_secure.sql`
- `supabase/migrations/005_fix_rpc_exception_handler.sql`
- `supabase/migrations/006_add_rapid_response.sql`
- `docs/FORGE_CONTENT_V1.md`
- All DAY*_*.md files (build logs, summaries)
- `VALIDATION_*.sql` files

---

### FILES TO DELETE

**Documentation (outdated):**
- `AGENTS.md` (obsolete guidance)
- `BUG_FIXES_APPLIED.md`
- `BUILD_LOG.md`
- `BOTTOM_NAV_LABEL_FIX.md`
- `CLAUDE.md`

**Database Validation (no longer needed):**
- `COMPLETE_SCHEMA.sql`

---

## PART 2: DATABASE MIGRATION STRATEGY

### Current Database (V1)

**Tables:**
- `users` (keep structure)
- `missions` (DELETE)
- `mission_completions` (DELETE)
- `feedback` (keep)

**Functions:**
- `complete_mission()` (DELETE)
- `get_featured_mission_id()` (DELETE)
- `has_completed_featured_today()` (DELETE)

### Target Database (V2)

#### New Tables

**training_days**
```sql
id              SERIAL PRIMARY KEY
day_number      SMALLINT UNIQUE NOT NULL (0-8)
title           TEXT NOT NULL
description     TEXT
theme           TEXT -- "OIR Basics", "PPDT Introduction", etc.
total_xp        INTEGER NOT NULL
is_locked       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**sessions**
```sql
id                   SERIAL PRIMARY KEY
training_day_id      INTEGER REFERENCES training_days(id)
session_number       SMALLINT NOT NULL (1-3)
question_count       INTEGER NOT NULL (20, 40, or 25)
estimated_minutes    INTEGER NOT NULL (5, 10, or 15-20)
xp_reward            INTEGER NOT NULL
order_index          SMALLINT NOT NULL
created_at           TIMESTAMPTZ DEFAULT NOW()
UNIQUE(training_day_id, session_number)
```

**questions**
```sql
id                   SERIAL PRIMARY KEY
session_id           INTEGER REFERENCES sessions(id)
question_type        TEXT NOT NULL CHECK (question_type IN (
                       'MCQ', 'Single Word', 'Numeric', 
                       'Rapid Response', 'Subjective'
                     ))
question_text        TEXT NOT NULL
content              JSONB NOT NULL -- Type-specific structure
correct_answer       TEXT NULL -- NULL for subjective questions
xp_value             INTEGER NOT NULL
time_limit_seconds   INTEGER NULL -- For Rapid Response
order_index          INTEGER NOT NULL
ssb_test_category    TEXT NOT NULL -- "OIR", "PPDT", "SRT", "WAT", "TAT", etc.
difficulty           TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard'))
created_at           TIMESTAMPTZ DEFAULT NOW()
```

**Content JSONB Structure by Type:**

**MCQ:**
```json
{
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "explanation": "Why this is correct..."
}
```

**Single Word / Numeric:**
```json
{
  "hint": "Optional hint text",
  "unit": "meters" // For numeric questions
}
```

**Rapid Response:**
```json
{
  "scenario": "Situational context...",
  "options": ["Action 1", "Action 2", "Action 3"]
}
```

**Subjective:**
```json
{
  "context": "Background information...",
  "word_limit": 150,
  "evaluation_criteria": ["Clarity", "Leadership", "Decision-making"]
}
```

**question_responses**
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID REFERENCES users(id)
question_id         INTEGER REFERENCES questions(id)
session_progress_id UUID REFERENCES session_progress(id)
user_answer         TEXT NOT NULL
is_correct          BOOLEAN NULL -- NULL for subjective until AI evaluates
time_taken_seconds  INTEGER NULL
xp_awarded          INTEGER NOT NULL DEFAULT 0
ai_evaluation       JSONB NULL -- For subjective questions
answered_at         TIMESTAMPTZ DEFAULT NOW()
```

**AI Evaluation JSONB:**
```json
{
  "score": 7,
  "max_score": 10,
  "strengths": ["Clear reasoning", "Leadership shown"],
  "weaknesses": ["Could elaborate more on consequences"],
  "suggestions": ["Consider mentioning team impact"],
  "evaluated_at": "2026-06-14T10:30:00Z"
}
```

**session_progress**
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id           UUID REFERENCES users(id)
session_id        INTEGER REFERENCES sessions(id)
questions_answered INTEGER DEFAULT 0
questions_total   INTEGER NOT NULL
xp_earned         INTEGER DEFAULT 0
started_at        TIMESTAMPTZ DEFAULT NOW()
completed_at      TIMESTAMPTZ NULL
status            TEXT CHECK (status IN ('in_progress', 'completed', 'abandoned'))
UNIQUE(user_id, session_id)
```

**xp_events**
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id      UUID REFERENCES users(id)
event_type   TEXT NOT NULL -- 'question_correct', 'session_complete', 'day_complete'
xp_amount    INTEGER NOT NULL
source_id    TEXT NOT NULL -- question_id or session_id
created_at   TIMESTAMPTZ DEFAULT NOW()
```

**achievements**
```sql
id              SERIAL PRIMARY KEY
achievement_key TEXT UNIQUE NOT NULL -- 'first_day_complete', 'week_streak'
title           TEXT NOT NULL
description     TEXT NOT NULL
xp_reward       INTEGER NOT NULL
icon            TEXT NOT NULL
requirement     JSONB NOT NULL -- Criteria for unlocking
```

**user_achievements**
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
achievement_id  INTEGER REFERENCES achievements(id)
unlocked_at     TIMESTAMPTZ DEFAULT NOW()
UNIQUE(user_id, achievement_id)
```

#### New Functions

**get_user_current_session(p_user_id UUID)**
Returns the next incomplete session for the user's current training day.

**complete_session_rpc(p_user_id UUID, p_session_id INTEGER)**
- Updates session_progress.completed_at
- Awards session XP
- Updates user.total_xp
- Checks if training day is complete
- Returns summary data

**submit_question_response(p_user_id UUID, p_question_id INTEGER, p_answer TEXT, p_time_taken INTEGER)**
- Validates answer
- Awards XP for correct answers
- Updates session_progress.questions_answered
- Returns result + AI evaluation (if subjective)

**unlock_next_day(p_user_id UUID)**
Called after completing Day N to unlock Day N+1.

#### Migration Steps

1. **Create archive of V1 database**
   ```sql
   -- Dump existing missions and completions to CSV
   ```

2. **Run schema migration**
   ```bash
   supabase migration new v2_schema
   ```

3. **Seed training content**
   - Days 0-8 with session structures
   - Populate questions (AI-assisted content generation from SSB books)

4. **Update RLS policies**
   - Users can only read their own `session_progress`
   - Users can only insert their own `question_responses`
   - All `questions` and `sessions` readable by authenticated users

5. **Test migration in staging environment**
   - Verify XP calculations
   - Test session flow end-to-end
   - Validate AI evaluation integration

---

## PART 3: NEW ARCHITECTURE

### Information Flow

```
User Opens App
  ↓
Dashboard loads current training day
  ↓
get_user_current_session() → Returns Day X, Session Y
  ↓
User taps "Continue Training"
  ↓
Navigate to /session/[sessionId]
  ↓
Fetch session questions (ordered)
  ↓
Display question 1/40
  ↓
User submits answer
  ↓
submit_question_response() → Awards XP, validates answer
  ↓
Show result feedback (correct/incorrect + explanation)
  ↓
Next question
  ↓
[Repeat until session complete]
  ↓
complete_session_rpc() → Awards session XP
  ↓
Navigate to /session/summary
  ↓
Show: Questions answered, Accuracy, XP earned, Next session preview
  ↓
If all 3 sessions complete → Navigate to /day-complete
  ↓
Unlock next day (if Day < 8)
```

### Navigation Structure

```
app/
├── (tabs)/
│   ├── index.tsx           [Dashboard - Current training day]
│   ├── library.tsx         [Training Days 0-8 with lock states]
│   └── profile.tsx         [Stats & achievements]
├── (auth)/                 [No changes]
├── session/
│   ├── [sessionId].tsx     [Question flow screen]
│   └── summary.tsx         [Session complete screen]
└── day-complete.tsx        [Day completion + unlock next]
```

### Component Structure

```
src/components/
├── ui/                     [Tactical design system - no changes]
├── question-types/
│   ├── MCQQuestion.tsx
│   ├── SingleWordQuestion.tsx
│   ├── NumericQuestion.tsx
│   ├── RapidResponseQuestion.tsx
│   └── SubjectiveQuestion.tsx
├── training/
│   ├── DayCard.tsx         [Training day display card]
│   ├── SessionCard.tsx     [Session display card]
│   ├── ProgressBar.tsx     [Question progress indicator]
│   └── QuestionFeedback.tsx [Result + explanation display]
└── profile/
    └── AchievementBadge.tsx
```

### Service Layer

```
src/services/
├── supabase.ts             [No changes]
├── training.service.ts     [Training day/session data]
├── question.service.ts     [Question submission & validation]
└── ai-evaluation.service.ts [Subjective answer evaluation]
```

### AI Evaluation Architecture

**Provider Interface:**
```typescript
interface AIEvaluationProvider {
  evaluate(question: string, userAnswer: string, criteria: string[]): Promise<AIEvaluationResult>;
}

interface AIEvaluationResult {
  score: number;           // 1-10
  maxScore: number;        // Always 10
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}
```

**Initial Implementation:**
- Google AI Studio (Gemini API)
- Environment variable: `EXPO_PUBLIC_GEMINI_API_KEY`
- Fallback: Return generic feedback if API fails

**Future Providers:**
- OpenAI GPT-4
- Claude (Anthropic)
- Custom fine-tuned model

**Prompt Template:**
```
You are an SSB interview evaluator. Evaluate this candidate's response.

Question: {question_text}
User Answer: {user_answer}
Evaluation Criteria: {criteria}

Provide:
1. Score (1-10)
2. 2-3 strengths
3. 1-2 weaknesses
4. 2-3 improvement suggestions

Format response as JSON.
```

---

## PART 4: CONTENT MIGRATION

### V1 Content Disposal

**70 missions (Week 1 + Week 2)** → Archive for reference

### V2 Content Requirements

**Days 0-8 (9 training days)**
- Day 0: Orientation & SSB Overview (20 questions)
- Days 1-8: Rotating SSB test coverage

**Total Questions Needed:**
- Day 0: 1 session × 20 questions = 20 questions
- Days 1-8: 8 days × (20 + 40 + 25) = 680 questions
- **Total: 700 questions minimum**

**Question Distribution by SSB Test:**
- OIR (Officer Intelligence Rating): ~150 questions
- PPDT (Picture Perception & Description Test): ~80 questions
- SRT (Situation Reaction Test): ~120 questions
- WAT (Word Association Test): ~100 questions
- TAT (Thematic Apperception Test): ~80 questions
- Interview Preparation: ~100 questions
- GTO (Group Testing Officer): ~70 questions

**Content Generation Strategy:**
1. Source from SSB preparation books (Arihant, Disha, Pathfinder)
2. AI-assisted question generation (GPT-4 + manual review)
3. Expert review by SSB coaching instructors
4. Beta testing with aspirants for difficulty calibration

---

## PART 5: IMPLEMENTATION SEQUENCE

### Phase 1: Database Migration (Week 1)
- [ ] Create V2 schema migration file
- [ ] Archive V1 tables
- [ ] Test migration locally
- [ ] Deploy to Hostinger SQL (if decided) or keep Supabase
- [ ] Seed Days 0-2 with sample questions (60 questions)

### Phase 2: Core Services (Week 1-2)
- [ ] Implement `training.service.ts`
- [ ] Implement `question.service.ts`
- [ ] Create question response RPC
- [ ] Create session completion RPC
- [ ] Write service tests

### Phase 3: AI Integration (Week 2)
- [ ] Set up Google AI Studio account
- [ ] Implement `ai-evaluation.service.ts`
- [ ] Create evaluation prompt templates
- [ ] Test evaluation accuracy
- [ ] Add fallback logic

### Phase 4: UI Components (Week 2-3)
- [ ] Build question type components
- [ ] Create session flow screen
- [ ] Build session summary screen
- [ ] Build day completion screen
- [ ] Update dashboard for V2
- [ ] Update training library for V2

### Phase 5: Content Population (Week 3-4)
- [ ] Generate Days 0-8 questions (700 total)
- [ ] Review and validate content
- [ ] Seed production database
- [ ] QA test all question types

### Phase 6: Testing & Beta (Week 4)
- [ ] End-to-end flow testing
- [ ] XP calculation validation
- [ ] AI evaluation accuracy testing
- [ ] Beta launch to 10 users
- [ ] Collect feedback

### Phase 7: Launch (Week 5)
- [ ] Fix beta issues
- [ ] Performance optimization
- [ ] APK size review (target <50 MB)
- [ ] Production launch
- [ ] Monitor error logs

---

## PART 6: RISK MITIGATION

### High-Risk Areas

**1. AI Evaluation Latency**
- **Risk:** Subjective question evaluation takes >5 seconds
- **Mitigation:**
  - Show loading state with encouraging messages
  - Cache common evaluations
  - Set 10-second timeout → Fallback to "Under Review"

**2. Content Quality**
- **Risk:** AI-generated questions are low quality
- **Mitigation:**
  - Manual review of all questions before seed
  - Beta testing with real aspirants
  - Continuous feedback loop post-launch

**3. XP Balance**
- **Risk:** Users gain XP too fast or too slow
- **Mitigation:**
  - Calculate total XP available per day
  - Balance against rank thresholds
  - Aim: Reach "Officer" by Day 4, "Commander" by Day 8

**4. Database Migration Failure**
- **Risk:** Data loss during V1 → V2 migration
- **Mitigation:**
  - Full backup before migration
  - Test migration on staging database
  - Run migration during low-traffic hours
  - Rollback plan ready

---

## PART 7: SUCCESS METRICS

**Technical Metrics:**
- Average session load time: <2 seconds
- Question submit latency: <1 second (non-AI)
- AI evaluation latency: <5 seconds
- Crash rate: <0.5%
- APK size: <50 MB

**User Metrics:**
- Day 1 completion rate: >80%
- Day 7 retention rate: >40%
- Average session completion time: Within estimates (5/10/20 min)
- Subjective question engagement: >60% of users attempt them

**Content Metrics:**
- Question clarity rating: >4.0/5.0
- AI evaluation helpfulness: >3.5/5.0
- Content relevance to SSB: >4.5/5.0

---

## CONCLUSION

This plan transforms Forge from a generic mission-based app into a focused SSB training platform.

**Key Changes:**
- Replace missions → Training days with structured sessions
- Remove mission categories → SSB test categories
- Add AI evaluation for subjective questions
- Implement programme day progression (Day 0-8)
- Simplify gamification (keep XP/streak/rank)

**Next Step:**
Begin Phase 1 — Database Migration.

**No further planning documents will be created.**  
**Implementation begins now.**

---

*End of Transformation Plan*
