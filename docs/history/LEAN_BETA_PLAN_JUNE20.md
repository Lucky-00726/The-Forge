# FORGE V2 — LEAN BETA PLAN (JUNE 20 DEADLINE)

**Today:** June 14, 2026  
**Beta Launch:** June 20, 2026 (6 days)  
**Team:** Founder (60+ hours) + Co-founder (content)

---

## CRITICAL REALIZATION

**The transformation plan is overengineered for beta.**

We don't need:
- Hostinger migration (Supabase works fine for beta)
- 700 questions (too much content creation)
- Complex session architecture
- Achievement system
- XP events table
- Separate session_progress tracking

**Beta needs:**
- 3 training days (Day 0, 1, 2) = ~100 questions total
- Questions that work today
- XP/streak/rank (already working)
- AI evaluation (add this only)
- UI that shows training days instead of missions

**Strategy:** Minimal database changes. Maximum UI reskin. Ship fast.

---

## BETA SCOPE (JUNE 20)

### INCLUDE

**Core Features:**
- Training Days 0-2 (Day 3-8 show "Coming Soon")
- 3 sessions per day (Session 1: 10q, Session 2: 15q, Session 3: 10q = 35q/day)
- 5 question types (MCQ, Single Word, Numeric, Rapid Response, Subjective)
- AI evaluation for Subjective questions only
- XP system (unchanged from V1)
- Streak system (unchanged)
- Rank system (unchanged)
- Tactical UI (unchanged)
- Dashboard shows current training day
- Training library shows Days 0-8 with lock states

**Total Content Needed:**
- Day 0: 35 questions (SSB orientation)
- Day 1: 35 questions (OIR + PPDT focus)
- Day 2: 35 questions (SRT + WAT focus)
- **Total: 105 questions**

### EXCLUDE (POST-BETA)

- Hostinger SQL migration (use Supabase for beta)
- Days 3-8 content (lock screen says "Coming Soon")
- Achievement badges
- Analytics dashboard
- Detailed progress charts
- Session timers (except Rapid Response)
- Leaderboards
- Social features
- APK optimization (<50MB)
- Performance profiling

---

## MINIMAL DATABASE CHANGES

### Keep V1 Tables, Minimal Modifications

**Strategy:** Don't rebuild schema. Adapt existing structure.

#### users table
**Action:** NO CHANGES (already has XP, streak, rank)

#### missions table → Rename to questions
**Action:** Rename table + modify columns
```sql
ALTER TABLE missions RENAME TO questions;
ALTER TABLE missions DROP COLUMN week_number;
ALTER TABLE missions DROP COLUMN unlock_day;
ADD COLUMN training_day INTEGER NOT NULL DEFAULT 0;
ADD COLUMN session_number INTEGER NOT NULL DEFAULT 1;
ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
ADD COLUMN question_type TEXT NOT NULL DEFAULT 'MCQ';
RENAME COLUMN mission_type TO question_format; -- Keep for UI display
```

**question_type values:** `MCQ | Single Word | Numeric | Rapid Response | Subjective`

**question_format values:** `Multiple Choice | Short Answer | Rapid Decision | Written Response`

#### mission_completions → Rename to question_responses
**Action:** Rename table + modify columns
```sql
ALTER TABLE mission_completions RENAME TO question_responses;
ALTER TABLE mission_completions RENAME COLUMN mission_id TO question_id;
ALTER TABLE mission_completions RENAME COLUMN is_featured TO ai_evaluated;
DROP CONSTRAINT uq_user_mission_date;
ADD CONSTRAINT uq_user_question UNIQUE (user_id, question_id);
ADD COLUMN is_correct BOOLEAN NULL;
ADD COLUMN time_taken_seconds INTEGER NULL;
ADD COLUMN ai_feedback JSONB NULL;
```

**ai_feedback structure:**
```json
{
  "score": 7,
  "strengths": ["Clear reasoning", "Good structure"],
  "weaknesses": ["Could be more specific"],
  "suggestions": ["Add example scenario"]
}
```

#### New: session_progress (simplified)
```sql
CREATE TABLE session_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  training_day INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  questions_completed INTEGER DEFAULT 0,
  questions_total INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NULL,
  UNIQUE(user_id, training_day, session_number)
);
```

### Modified RPC Functions

#### complete_question (replaces complete_mission)
```sql
CREATE OR REPLACE FUNCTION complete_question(
  p_user_id UUID,
  p_question_id TEXT,
  p_user_answer TEXT,
  p_time_taken INTEGER DEFAULT NULL
) RETURNS JSONB
```

**Logic:**
1. Fetch question from `questions` table
2. For MCQ/Single Word/Numeric: Compare answer, set is_correct
3. For Subjective: Set is_correct = NULL, queue AI evaluation
4. Calculate XP: correct = full xp_reward, incorrect = 0, subjective = full (pending evaluation)
5. Update users.total_xp, streak, rank
6. Update session_progress.questions_completed
7. Return result

#### get_current_training_day (new)
```sql
CREATE OR REPLACE FUNCTION get_current_training_day(p_user_id UUID)
RETURNS JSONB
```

**Logic:**
1. Check session_progress for incomplete sessions
2. Return lowest incomplete training_day + session_number
3. If all complete up to Day 2, return "Day 3 locked"

---

## MIGRATION STRATEGY

### Phase 1: Database (June 15, 4 hours)

**Founder Tasks:**
1. Create migration file `007_v2_beta_schema.sql`
2. Rename tables (missions → questions, mission_completions → question_responses)
3. Add new columns (training_day, session_number, question_type, etc.)
4. Create session_progress table
5. Update RPC functions (complete_question, get_current_training_day)
6. Update RLS policies
7. Test locally

**Migration Script:**
```sql
-- Backup V1 data
CREATE TABLE missions_backup AS SELECT * FROM missions;
CREATE TABLE mission_completions_backup AS SELECT * FROM mission_completions;

-- Rename and modify
ALTER TABLE missions RENAME TO questions;
ALTER TABLE mission_completions RENAME TO question_responses;
-- [Add all column modifications]

-- Create new tables
CREATE TABLE session_progress (...);

-- Drop old functions
DROP FUNCTION complete_mission;
DROP FUNCTION get_featured_mission_id;

-- Create new functions
CREATE FUNCTION complete_question(...);
CREATE FUNCTION get_current_training_day(...);
```

### Phase 2: Content Creation (June 15-17, Co-founder)

**Day 0 (35 questions) — SSB Orientation**
- Session 1 (10q): What is SSB? (MCQ focus)
- Session 2 (15q): OLQ basics (MCQ + Short Answer)
- Session 3 (10q): SSB test types overview (MCQ + Subjective)

**Day 1 (35 questions) — OIR + PPDT**
- Session 1 (10q): OIR verbal reasoning (MCQ)
- Session 2 (15q): OIR non-verbal + PPDT intro (MCQ + Numeric)
- Session 3 (10q): PPDT scenarios (Subjective + Rapid Response)

**Day 2 (35 questions) — SRT + WAT**
- Session 1 (10q): SRT situations (Rapid Response + Single Word)
- Session 2 (15q): WAT practice (Single Word + MCQ)
- Session 3 (10q): Leadership scenarios (Subjective)

**Content Format (Spreadsheet):**
```
training_day | session_number | order_index | question_type | category | question_text | content (JSON) | correct_answer | xp_reward | time_limit_seconds
0 | 1 | 1 | MCQ | OIR | "What does SSB stand for?" | {"options": ["...", "...", "...", "..."]} | "Services Selection Board" | 10 | NULL
```

**Co-founder Deliverable:** Google Sheet with 105 questions by June 17 EOD

### Phase 3: AI Integration (June 16, 6 hours)

**Founder Tasks:**
1. Sign up for Google AI Studio (Gemini API)
2. Create `src/services/ai-evaluation.service.ts`
3. Implement `evaluateSubjectiveAnswer(questionText, userAnswer)`
4. Call from question submission flow (async, don't block UI)
5. Store result in question_responses.ai_feedback
6. Test with 5 sample subjective answers

**AI Prompt Template:**
```
You are an SSB evaluator. Rate this answer 1-10.

Question: {questionText}
Answer: {userAnswer}

Return JSON:
{
  "score": 7,
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["point 1"],
  "suggestions": ["tip 1", "tip 2"]
}

Be constructive. Focus on officer-like qualities.
```

**Timeout:** 8 seconds. If fails, return:
```json
{
  "score": null,
  "strengths": ["Answer recorded"],
  "weaknesses": [],
  "suggestions": ["Evaluation pending"]
}
```

### Phase 4: Type Definitions (June 16, 2 hours)

**Founder Tasks:**
1. Update `src/types/index.ts`
2. Keep existing types (DbUser, etc.)
3. Add new types:

```typescript
export interface DbQuestion {
  id: string;
  title: string;
  category: string; // "OIR", "PPDT", "SRT", etc.
  question_type: 'MCQ' | 'Single Word' | 'Numeric' | 'Rapid Response' | 'Subjective';
  question_format: string; // Display name
  training_day: number;
  session_number: number;
  order_index: number;
  xp_reward: number;
  time_limit_seconds: number | null;
  content: QuestionContent;
  correct_answer?: string;
}

export interface QuestionResponse {
  id: string;
  user_id: string;
  question_id: string;
  user_answer: string;
  is_correct: boolean | null;
  xp_awarded: number;
  time_taken_seconds: number | null;
  ai_feedback: AIFeedback | null;
  completed_date: string;
}

export interface AIFeedback {
  score: number | null;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface SessionProgress {
  training_day: number;
  session_number: number;
  questions_completed: number;
  questions_total: number;
  completed_at: string | null;
}
```

### Phase 5: Services Layer (June 17, 6 hours)

**Founder Tasks:**

**File:** `src/services/training.service.ts` (new)
```typescript
export async function fetchTrainingDay(dayNumber: number): Promise<AsyncResult<DbQuestion[]>>
export async function fetchSession(day: number, session: number): Promise<AsyncResult<DbQuestion[]>>
export async function getCurrentTrainingDay(userId: string): Promise<AsyncResult<SessionProgress>>
export async function getSessionProgress(userId: string, day: number, session: number): Promise<AsyncResult<SessionProgress>>
```

**File:** `src/services/question.service.ts` (new)
```typescript
export async function submitQuestionResponse(params: {
  userId: string;
  questionId: string;
  userAnswer: string;
  timeTaken?: number;
}): Promise<AsyncResult<QuestionResponse>>
```

**File:** `src/services/ai-evaluation.service.ts` (new)
```typescript
export async function evaluateSubjectiveAnswer(
  questionText: string,
  userAnswer: string
): Promise<AIFeedback>
```

**File:** `src/services/mission.service.ts`
**Action:** DELETE (no longer needed)

### Phase 6: UI Components (June 17-18, 12 hours)

#### Question Type Components

**Create:** `src/components/question-types/`

**MCQQuestion.tsx** (2 hours)
- 4 radio buttons
- Submit button
- Instant feedback on submit (correct/incorrect)
- Show explanation

**SingleWordQuestion.tsx** (1 hour)
- Text input (1 word)
- Character limit: 50
- Submit button
- Case-insensitive validation

**NumericQuestion.tsx** (1 hour)
- Number input
- Unit display (if applicable)
- Submit button
- Exact match validation

**RapidResponseQuestion.tsx** (2 hours)
- Reuse existing timer logic from V1
- 3-4 options
- Timer countdown
- Auto-submit on timeout

**SubjectiveQuestion.tsx** (3 hours)
- Multiline text input
- Word count display
- Min 20 words, Max 200 words
- Submit button
- Loading state for AI evaluation
- Display AI feedback (score, strengths, weaknesses, suggestions)

#### Training Screens

**Update:** `app/(tabs)/index.tsx` (Dashboard) (2 hours)
- Remove featured mission logic
- Call `getCurrentTrainingDay(userId)`
- Display current day/session
- Show progress: "Session 2: 8/15 questions complete"
- CTA: "Continue Training" → Navigate to `/session/${day}/${session}`
- Keep streak/XP/rank display (no changes)

**Update:** `app/(tabs)/missions.tsx` (Training Library) (3 hours)
- Replace mission cards with training day cards
- Show Days 0-8
- Days 0-2: Unlocked
- Days 3-8: Locked card with "Coming Soon — More content after beta"
- Each unlocked day shows:
  - Day number + title
  - 3 session badges (complete/in-progress/locked)
  - Total XP available
  - Tap to navigate to day detail (or continue session)

**Create:** `app/session/[day]/[session].tsx` (Question Flow) (4 hours)
- Fetch session questions ordered by order_index
- Display one question at a time
- Progress bar: "Question 5/15"
- Render appropriate question type component
- On submit: Call submitQuestionResponse()
- Show result feedback
- Next button → Load next question
- On session complete → Navigate to session summary

**Create:** `app/session/summary.tsx` (Session Summary) (2 hours)
- Display session stats:
  - Questions answered: 15/15
  - Correct: 12/15 (80%)
  - XP earned: +150
  - Time taken: 8 minutes
- Show incorrect questions (review mode)
- CTA: "Continue to Next Session" or "Back to Library"

**Create:** `app/day-complete.tsx` (Day Completion) (2 hours)
- Show day complete animation
- Display:
  - Day title
  - Total XP earned
  - Accuracy
  - Rank progress
- If Day < 2: "Next day unlocked!"
- If Day = 2: "More training days coming soon!"
- CTA: "Continue Training" → Navigate to next day

### Phase 7: Hooks (June 18, 4 hours)

**File:** `src/hooks/useMissionEngine.ts`
**Action:** DELETE

**Create:** `src/hooks/useTrainingEngine.ts`
```typescript
export function useTrainingEngine() {
  const loadSession = async (day: number, session: number) => { ... }
  const submitAnswer = async (questionId: string, answer: string, timeTaken?: number) => { ... }
  const nextQuestion = () => { ... }
  const completeSession = () => { ... }
  
  return { currentQuestion, progress, submitAnswer, nextQuestion, ... }
}
```

### Phase 8: Database Seeding (June 18, 2 hours)

**Founder Tasks:**
1. Receive 105 questions from co-founder (Google Sheet)
2. Convert to SQL INSERT statements
3. Create `supabase/migrations/008_seed_beta_content.sql`
4. Seed questions for Days 0-2
5. Test query: `SELECT * FROM questions WHERE training_day = 0 AND session_number = 1 ORDER BY order_index`

### Phase 9: Testing (June 19, 8 hours)

**Founder Tasks:**
1. End-to-end flow testing (Day 0, Session 1 → Day 2, Session 3)
2. Test all 5 question types
3. Test AI evaluation (5 subjective questions)
4. Test XP calculations
5. Test streak logic
6. Test session progress tracking
7. Test locked days UI
8. Fix critical bugs
9. Test on physical device (Android/iOS)

### Phase 10: Polish & Deploy (June 20, 6 hours)

**Founder Tasks:**
1. Fix UI issues
2. Add loading states
3. Add error handling
4. Test offline behavior
5. Build production APK
6. Deploy to Supabase (if using)
7. Beta launch to 5 test users
8. Monitor logs

---

## FOUNDER DAILY BREAKDOWN

### June 15 (Sunday) — Database & Setup
**10 hours**
- [2h] Review plan, set up environment
- [4h] Create database migration (007_v2_beta_schema.sql)
- [2h] Update RPC functions
- [2h] Test migration locally

### June 16 (Monday) — AI & Types
**10 hours**
- [3h] AI evaluation service setup (Google AI Studio)
- [3h] Implement evaluateSubjectiveAnswer()
- [2h] Update type definitions
- [2h] Test AI evaluation with samples

### June 17 (Tuesday) — Services & Components Start
**12 hours**
- [4h] Build training.service.ts + question.service.ts
- [4h] Build MCQQuestion + SingleWordQuestion
- [4h] Build NumericQuestion + start RapidResponseQuestion

### June 18 (Wednesday) — Components & Seeding
**12 hours**
- [4h] Finish RapidResponse + SubjectiveQuestion
- [4h] Update Dashboard + Training Library
- [2h] Database seeding (receive content from co-founder)
- [2h] Build useTrainingEngine hook

### June 19 (Thursday) — Screens & Testing
**12 hours**
- [4h] Build session flow screen
- [2h] Build session summary screen
- [2h] Build day complete screen
- [4h] End-to-end testing + bug fixes

### June 20 (Friday) — Polish & Launch
**8 hours**
- [4h] Final bug fixes
- [2h] UI polish + error handling
- [2h] Build APK + deploy + beta launch

**Total: 64 hours over 6 days**

---

## CO-FOUNDER DAILY BREAKDOWN

### June 15 (Sunday) — Research & Setup
**4 hours**
- Research SSB question types (OIR, PPDT, SRT, WAT)
- Review SSB books (Arihant, Disha)
- Set up Google Sheet template
- Write 10 sample questions

### June 16 (Monday) — Day 0 Content
**8 hours**
- Write Day 0, Session 1 (10 questions: MCQ on SSB basics)
- Write Day 0, Session 2 (15 questions: MCQ + Short Answer on OLQs)
- Write Day 0, Session 3 (10 questions: MCQ + Subjective on SSB tests)
- **Deliverable: 35 questions**

### June 17 (Tuesday) — Day 1 & Day 2 Content
**10 hours**
- Write Day 1 content (35 questions: OIR + PPDT focus)
- Write Day 2 content (35 questions: SRT + WAT focus)
- **Deliverable: 70 questions**
- **Total: 105 questions by EOD**

### June 18 (Wednesday) — Review & Refinement
**6 hours**
- Review all 105 questions
- Fix errors, improve clarity
- Add explanations for MCQ answers
- Format for database seeding

### June 19 (Thursday) — Testing Support
**4 hours**
- Test questions in app
- Fix content issues
- Write additional questions if needed

### June 20 (Friday) — Beta Support
**2 hours**
- Monitor beta user feedback
- Quick content fixes if needed

**Total: 34 hours over 6 days**

---

## MINIMUM CONTENT REQUIREMENTS

### Day 0: SSB Orientation (35 questions)
**Session 1 (10q):** SSB basics, selection process, OLQ intro  
**Question Types:** 8 MCQ, 2 Single Word

**Session 2 (15q):** OLQ deep dive, officer qualities  
**Question Types:** 10 MCQ, 3 Single Word, 2 Subjective

**Session 3 (10q):** SSB test overview, preparation tips  
**Question Types:** 5 MCQ, 2 Rapid Response, 3 Subjective

### Day 1: OIR + PPDT (35 questions)
**Session 1 (10q):** OIR verbal reasoning  
**Question Types:** 8 MCQ, 2 Numeric

**Session 2 (15q):** OIR non-verbal + PPDT intro  
**Question Types:** 10 MCQ, 3 Numeric, 2 Single Word

**Session 3 (10q):** PPDT scenario practice  
**Question Types:** 3 Rapid Response, 4 Subjective, 3 MCQ

### Day 2: SRT + WAT (35 questions)
**Session 1 (10q):** SRT situations  
**Question Types:** 7 Rapid Response, 3 Single Word

**Session 2 (15q):** WAT practice  
**Question Types:** 12 Single Word, 3 MCQ

**Session 3 (10q):** Leadership scenarios  
**Question Types:** 5 Subjective, 3 Rapid Response, 2 MCQ

**Total: 105 questions**

### Question Distribution by Type
- MCQ: 47 questions (45%)
- Single Word: 20 questions (19%)
- Numeric: 5 questions (5%)
- Rapid Response: 15 questions (14%)
- Subjective: 18 questions (17%)

---

## POST-BETA (After June 20)

### Postponed Features
1. **Days 3-8 Content** (420 questions) — 2-3 weeks
2. **Hostinger SQL Migration** — 1 week
3. **Achievement System** — 1 week
4. **Analytics Dashboard** — 1 week
5. **Detailed Progress Charts** — 3 days
6. **APK Optimization** — 3 days
7. **Performance Profiling** — 2 days
8. **Session Timers** (non-Rapid Response) — 2 days
9. **Question Review Mode** — 3 days
10. **Offline Support** — 1 week

### Post-Beta Priority Order
1. **Days 3-8 Content** (unlock full training)
2. **Bug Fixes from Beta Feedback**
3. **Hostinger Migration** (reduce costs)
4. **Achievement System** (engagement)
5. **Everything else**

---

## RISK LIST

### HIGH RISK

**1. Co-founder Content Delay**
- **Risk:** 105 questions not ready by June 17
- **Mitigation:** Founder writes placeholder questions on June 16
- **Fallback:** Launch with Day 0 only (35 questions)

**2. AI Evaluation Failure**
- **Risk:** Google AI Studio API fails or is too slow
- **Mitigation:** 8-second timeout, fallback to "Evaluation pending"
- **Fallback:** Skip AI evaluation for beta, add post-launch

**3. Database Migration Issues**
- **Risk:** Migration breaks existing data
- **Mitigation:** Full backup before migration, test on local DB first
- **Rollback:** Keep V1 backup tables

**4. Time Overrun on UI Components**
- **Risk:** Question type components take longer than 12 hours
- **Mitigation:** Use simpler UI, skip animations
- **Fallback:** Launch with MCQ + Subjective only

### MEDIUM RISK

**5. Session Flow Complexity**
- **Risk:** Session navigation logic is complex
- **Mitigation:** Simple linear flow, no skip/back buttons
- **Fallback:** One question per screen, simple Next button

**6. XP Calculation Bugs**
- **Risk:** Wrong XP awarded
- **Mitigation:** Reuse V1 logic, minimal changes
- **Test:** Manual XP verification on June 19

**7. Streak Logic Breaks**
- **Risk:** Streak resets incorrectly
- **Mitigation:** Don't touch streak logic, already works in V1
- **Test:** Complete sessions on consecutive days

### LOW RISK

**8. Locked Day UI**
- **Risk:** Users confused by locked days
- **Mitigation:** Clear "Coming Soon" message
- **Fallback:** Hide Days 3-8 entirely

**9. Question Content Quality**
- **Risk:** Questions are poorly written
- **Mitigation:** Co-founder reviews all questions twice
- **Fallback:** Post-beta content updates

**10. APK Size**
- **Risk:** APK > 50MB
- **Impact:** Low priority for beta
- **Action:** Defer optimization to post-beta

---

## SUCCESS CRITERIA (BETA)

### Must-Have (Launch Blockers)
- [ ] User can complete Day 0, Session 1 end-to-end
- [ ] XP is awarded correctly
- [ ] Streak updates correctly
- [ ] AI evaluation works for 1 subjective question
- [ ] Dashboard shows current training day
- [ ] Training library shows Days 0-8 with locks
- [ ] No crash on critical flows

### Nice-to-Have (Non-Blockers)
- [ ] All 105 questions work perfectly
- [ ] AI evaluation < 5 seconds
- [ ] Beautiful animations
- [ ] Perfect error handling
- [ ] Offline support

### Beta User Goals
- 5 users complete Day 0 by June 21
- 3 users complete Day 1 by June 22
- 1 user completes Day 2 by June 23
- Collect feedback on:
  - Question clarity
  - AI feedback quality
  - XP balance
  - UI/UX

---

## WHAT CHANGED FROM TRANSFORMATION PLAN

### REMOVED
- ❌ Hostinger migration (use Supabase for beta)
- ❌ 700 questions (cut to 105)
- ❌ Days 3-8 content (postponed)
- ❌ Achievement system (postponed)
- ❌ xp_events table (unnecessary)
- ❌ Complex session architecture (simplified)
- ❌ Analytics (postponed)
- ❌ APK optimization (postponed)

### SIMPLIFIED
- ✅ Reuse V1 tables (rename, don't rebuild)
- ✅ Reuse V1 XP/streak/rank logic
- ✅ Minimal RPC changes
- ✅ Simple session tracking (one table)
- ✅ No separate question entity (reuse missions table)

### ADDED
- ✅ AI evaluation service (essential for beta value prop)
- ✅ 5 question type components (essential for SSB coverage)
- ✅ Session flow UI (essential for training structure)

### RESULT
- **64 founder hours** (down from ~200 hours)
- **105 questions** (down from 700)
- **Days 0-2** (down from Days 0-8)
- **Beta June 20** (achievable)
- **Post-beta expansion clear**

---

## CONCLUSION

This plan cuts 70% of the transformation scope while preserving:
- Core value prop (SSB training with AI feedback)
- Working features (XP/streak/rank)
- Expansion path (add Days 3-8 post-beta)

**The shortest path to beta is to reuse V1 architecture with minimal changes and focus all energy on content + AI evaluation.**

**Next step:** Founder approval → Begin June 15 execution.

---

*End of Lean Beta Plan*
