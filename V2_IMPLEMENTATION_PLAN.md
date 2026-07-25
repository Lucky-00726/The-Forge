# FORGE V2 — IMPLEMENTATION PLAN

**Date:** June 15, 2026  
**Target:** Day 0 Playable Experience  
**Approach:** Build → Test → Iterate

---

## A. CURRENT ACTIVE ARCHITECTURE

### Production-Ready (No Changes Required)

**Infrastructure:**
- Expo SDK 52 + React Native 0.85.3
- TypeScript strict mode
- Babel + Metro configured
- Supabase client working

**Design System:**
- `src/constants/tokens.ts` — All design tokens
- `src/constants/ranks.ts` — XP thresholds
- `src/components/ui/` — 8 reusable components

**Auth System:**
- `src/services/supabase.ts` — Client singleton
- `src/services/auth.service.ts` — Auth operations
- `src/store/auth.store.ts` — Auth state
- `src/hooks/useAuth.ts` — Auth facade
- `src/hooks/useAuthInitializer.ts` — Boot check
- `app/(auth)/` — All auth screens working

**Utilities:**
- `src/utils/date.ts` — IST date functions
- `src/hooks/useFormValidation.ts` — Validation helpers

**Navigation:**
- `app/_layout.tsx` — Root layout with AuthGate
- `app/(tabs)/_layout.tsx` — Tab navigator
- Expo Router v4 file-based routing

---

### Requires V2 Updates

**Type Definitions:**
- `src/types/index.ts` — Add training day types
- `src/types/database.ts` — Regenerate from V2 schema

**Services (V1 Files):**
- `src/services/mission.service.ts` — DELETE
- Need: `training.service.ts`, `question.service.ts`

**State (V1 Files):**
- `src/store/mission.store.ts` — DELETE (use hook state)

**Hooks (V1 Files):**
- `src/hooks/useMissionEngine.ts` — DELETE
- Need: `useTrainingEngine.ts`

**Screens (V1 UI):**
- `app/(tabs)/index.tsx` — Update for training days
- `app/(tabs)/missions.tsx` — Update for day cards
- `app/(tabs)/profile.tsx` — Update stats display
- `app/mission/` folder — DELETE
- Need: `app/session/[sessionId].tsx`, `app/session/summary.tsx`

**Components (V1 Mission Types):**
- `src/components/mission-types/` — DELETE folder
- Need: `src/components/question-types/` — 6 new components

**Database:**
- Supabase V1 schema active
- Need: V2 migration script

---

## B. IMPLEMENTATION ORDER

### Phase 1: Database Foundation (Day 1 Morning — 4 hours)

**Goal:** V2 schema ready for data

**Tasks:**
1. Create `supabase/migrations/007_v2_schema.sql`
2. Rename `missions` → `questions`
3. Add columns: `training_day`, `session_number`, `question_type`, `order_index`
4. Modify RPC: `complete_mission()` → `complete_question()`
5. Test migration locally
6. Seed Day 0 structure (1 training day, 3 sessions, 0 questions initially)

**Deliverable:** Database ready to store training days, sessions, questions

---

### Phase 2: Type Definitions (Day 1 Afternoon — 2 hours)

**Goal:** Type safety for V2 domain

**Tasks:**
1. Update `src/types/index.ts`:
   - Remove: Mission types
   - Add: `TrainingDay`, `Session`, `Question`, `QuestionType`, `QuestionResponse`, `SessionProgress`
2. Regenerate `src/types/database.ts` from V2 schema

**Deliverable:** TypeScript types for all V2 entities

---

### Phase 3: Service Layer (Day 2 Morning — 6 hours)

**Goal:** Data fetching and submission logic

**Tasks:**
1. Create `src/services/training.service.ts`:
   - `fetchTrainingDay(dayNumber)` — Get day with sessions
   - `fetchSessionQuestions(sessionId)` — Get ordered questions
   - `getCurrentProgress(userId)` — Get user's current position

2. Create `src/services/question.service.ts`:
   - `submitAnswer(questionId, answer, timeTaken)` — Submit + validate
   - `completeSession(sessionId)` — Mark session done

3. Delete `src/services/mission.service.ts`

**Deliverable:** All V2 data operations available

---

### Phase 4: Question Components (Day 2-3 — 12 hours)

**Goal:** Render and handle each question type

**Build Order (simplest to complex):**

1. **MCQQuestion.tsx** (2h) — 4 options, single select, submit
2. **SingleWordQuestion.tsx** (1h) — Text input, max 50 chars
3. **NumericQuestion.tsx** (1h) — Number input, unit display
4. **RapidResponseQuestion.tsx** (2h) — Move from V1, update API calls
5. **SubjectiveQuestion.tsx** (4h) — Multiline, word count, AI feedback slot
6. **QuestionFeedback.tsx** (2h) — Reusable result display

**Deliverable:** All question types renderable and submittable

---

### Phase 5: Training Engine Hook (Day 3 Afternoon — 6 hours)

**Goal:** Session flow state machine

**Create `src/hooks/useTrainingEngine.ts`:**
- `loadSession(sessionId)` — Fetch questions, set state
- `submitAnswer(questionId, answer)` — Submit, get result, advance
- `nextQuestion()` — Move to next question
- `completeSession()` — Finish session, navigate to summary

**State Management:**
- `currentQuestion` — Current question object
- `questionIndex` — Position in session (0-based)
- `totalQuestions` — Session question count
- `responses` — Array of user answers
- `isSubmitting` — Loading state

**Deliverable:** Session flow logic ready

---

### Phase 6: Session Flow Screen (Day 4 Morning — 5 hours)

**Goal:** Question-by-question playable experience

**Create `app/session/[sessionId].tsx`:**
- Load session via `useTrainingEngine`
- Display progress bar ("Question 5/10")
- Render current question (delegate to question type component)
- Handle submission via hook
- Show feedback after submit
- Next button to advance
- Navigate to summary when complete

**Deliverable:** Playable session from start to finish

---

### Phase 7: Session Summary Screen (Day 4 Afternoon — 3 hours)

**Goal:** Session completion feedback

**Create `app/session/summary.tsx`:**
- Display stats (questions answered, correct count, XP earned)
- Show session time
- "Continue to Next Session" OR "Back to Training" button
- Tactical celebration UI

**Deliverable:** Session completion flow complete

---

### Phase 8: Dashboard Update (Day 5 Morning — 3 hours)

**Goal:** Show current training progress

**Update `app/(tabs)/index.tsx`:**
- Remove: Featured mission logic
- Add: Current training day display
- Add: Current session display
- Add: Progress indicator
- Call: `training.service.getCurrentProgress()`
- CTA: "Start Day 0" OR "Continue Session X"

**Deliverable:** Dashboard shows V2 progress

---

### Phase 9: Training Library Update (Day 5 Afternoon — 4 hours)

**Goal:** Browse training days

**Update `app/(tabs)/missions.tsx`:**
- Remove: Mission cards
- Add: Training day cards (Days 0-8)
- Show: Lock states (Days 1-8 locked initially)
- Show: Session progress badges
- Call: `training.service.fetchTrainingDay()`
- Tap: Navigate to session flow

**Deliverable:** Day selection screen working

---

### Phase 10: Content Seeding (Day 6 — Co-founder)

**Goal:** 35 questions for Day 0

**Create Day 0 Questions:**
- Session 1: 10 MCQ questions (SSB basics)
- Session 2: 15 MCQ + Single Word questions (OLQ introduction)
- Session 3: 10 MCQ + Subjective questions (SSB test overview)

**Format:** SQL INSERT statements or CSV → SQL conversion

**Deliverable:** Day 0 fully playable with real content

---

## C. HIGHEST-LEVERAGE FEATURE

### **Question-by-Question Session Flow**

**Why This First:**

1. **Core Experience** — This IS the product (users answer questions)
2. **Validates Types** — Forces all type definitions to be correct
3. **Tests Services** — Question submission must work
4. **Unblocks Components** — Requires all question type components
5. **Enables Testing** — Can test with mock data before full content

**Without This:**
- Cannot test question rendering
- Cannot validate answer submission
- Cannot test XP flow
- Cannot demonstrate product to anyone

**With This:**
- Day 0 becomes playable immediately after content seed
- All V2 architecture is proven working
- Can iterate on UX before building remaining 8 days

---

## D. MINIMUM PLAYABLE DAY 0

### Required Screens (3)

1. **Dashboard** (`app/(tabs)/index.tsx`)
   - Shows "Day 0 — Session 1" status
   - CTA: "Start Training"
   - XP/Streak/Rank display (already works)

2. **Session Flow** (`app/session/[sessionId].tsx`)
   - Loads 10 questions for Session 1
   - Renders MCQQuestion component
   - Submits answer
   - Shows feedback
   - Advances to next question
   - Completes session

3. **Session Summary** (`app/session/summary.tsx`)
   - Shows "Session 1 Complete"
   - Displays: 10/10 questions, 8 correct, +80 XP
   - Button: "Continue to Session 2" OR "Back to Dashboard"

---

### Required Services (2)

1. **`training.service.ts`**
   ```typescript
   fetchSessionQuestions(sessionId: number): Promise<Question[]>
   getCurrentProgress(userId: string): Promise<CurrentProgress>
   ```

2. **`question.service.ts`**
   ```typescript
   submitAnswer(params: {
     userId: string;
     questionId: string;
     answer: string;
     timeTaken?: number;
   }): Promise<QuestionResponse>
   ```

---

### Required Components (2)

1. **`MCQQuestion.tsx`**
   - 4 radio buttons
   - Submit button
   - Feedback display (correct/incorrect + explanation)

2. **`QuestionFeedback.tsx`**
   - Correct/incorrect badge
   - Explanation text
   - Next button

**Defer:** SingleWord, Numeric, RapidResponse, Subjective (add in Phase 2)

---

### Required Hook (1)

**`useTrainingEngine.ts`**
- Manages session state
- Handles question navigation
- Submits answers
- Tracks progress

---

### Required Database (1 migration)

**V2 Schema:**
- `questions` table (renamed from missions)
- Columns: `training_day`, `session_number`, `question_type`, `order_index`
- RPC: `complete_question()`

---

### Required Content (10 questions)

**Day 0, Session 1:**
- 10 MCQ questions about SSB basics
- Each with 4 options, 1 correct answer, explanation

**Example:**
```sql
INSERT INTO questions (id, title, training_day, session_number, order_index, question_type, content, correct_answer, xp_reward) VALUES
('D0S1Q01', 'What does SSB stand for?', 0, 1, 1, 'MCQ', '{"options": ["Services Selection Board", "Special Service Bureau", "Strategic Services Branch", "Staff Selection Board"], "explanation": "SSB stands for Services Selection Board..."}', 'Services Selection Board', 10);
```

---

## IMPLEMENTATION TIMELINE

### Day 1 (June 15)
- ✅ Cleanup complete
- Database V2 schema (4h)
- Type definitions (2h)

### Day 2 (June 16)
- Service layer (6h)
- MCQQuestion component (2h)
- QuestionFeedback component (2h)

### Day 3 (June 17)
- useTrainingEngine hook (6h)
- Session flow screen (4h)

### Day 4 (June 18)
- Session summary screen (3h)
- Dashboard update (3h)
- Testing with mock data (2h)

### Day 5 (June 19)
- Training library update (4h)
- Content seeding (co-founder delivers 10 questions)
- Integration testing (3h)

### Day 6 (June 20)
- Full Day 0 testing (35 questions from co-founder)
- Bug fixes
- Beta launch

---

## SUCCESS CRITERIA

**Day 0 Playable Means:**
1. User logs in
2. Dashboard shows "Start Day 0"
3. Taps button → Navigates to Session 1
4. Sees Question 1/10
5. Selects answer → Submits
6. Sees feedback (correct/incorrect)
7. Taps Next → Question 2/10
8. Completes all 10 questions
9. Sees "Session 1 Complete" with XP earned
10. XP updates in database and UI

**This proves V2 architecture works end-to-end.**

---

## FIRST TASK

**Build the database V2 schema migration.**

This unblocks everything else.

**File to create:** `supabase/migrations/007_v2_schema.sql`

**Next task after schema:** Update `src/types/index.ts`

---

**END OF IMPLEMENTATION PLAN**

*Focus: Playable Day 0, Session 1 with 10 MCQ questions*  
*Timeline: 6 days*  
*First deliverable: Database migration*
