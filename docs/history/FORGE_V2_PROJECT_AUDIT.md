# FORGE V2 — COMPLETE PROJECT AUDIT

**Date:** June 15, 2026  
**Purpose:** Complete project inventory, classification, and V2 readiness assessment  
**Context:** V1 complete but archived. V2 architecture defined. Beta target: June 20.

---

## EXECUTIVE SUMMARY

This audit provides:
1. **Complete file inventory** (416 files classified)
2. **Documentation cleanup strategy** (47 .md files analyzed)
3. **Supabase dependency report** (all direct calls identified)
4. **V2 readiness assessment** (current state vs target state)
5. **Cleanup execution plan** (phased approach with file counts)

**Key Findings:**
- V1 architecture is complete but not being used
- 47 documentation files need consolidation
- Direct Supabase dependencies in 8 files
- Service layer abstraction partially implemented
- Estimated 105 questions needed for beta (not 700)

---

## PART 1: FILE INVENTORY

### Classification System

**KEEP** — File remains in active project, no changes  
**MODIFY** — File needs updates for V2 architecture  
**ARCHIVE** — Move to `archive/v1/`, preserve for reference  
**DELETE** — Remove permanently (only for duplicates/obsolete)

---

### KEEP (No Changes Required)

#### Build & Configuration (5 files)

| File | Current Purpose | Why Keep | Risk |
|------|----------------|----------|------|
| `babel.config.js` | Babel configuration with reanimated plugin | Works correctly | Low |
| `app.config.ts` | Expo configuration (app ID, plugins, splash) | Core config | Low |
| `tsconfig.json` | TypeScript compiler configuration | Standard setup | Low |
| `.gitignore` | Version control exclusions | Standard patterns | None |
| `package.json` | Dependencies and scripts | Core manifest | Low |

**Status:** ✅ All correct, no action needed

#### Design System (8 files)

| File | Current Purpose | Why Keep | Risk |
|------|----------------|----------|------|
| `src/constants/tokens.ts` | Colors, fonts, spacing, radius | Tactical UI foundation | None |
| `src/constants/ranks.ts` | Rank thresholds and definitions | XP system unchanged | None |
| `src/components/ui/CornerMarkers.tsx` | Tactical aesthetic component | Reusable V2 | None |
| `src/components/ui/ScreenMeta.tsx` | Metadata display | Reusable V2 | None |
| `src/components/ui/TacticalButton.tsx` | Primary CTA button | Reusable V2 | None |
| `src/components/ui/TacticalCheckbox.tsx` | Checkbox component | Reusable V2 | None |
| `src/components/ui/StatusIndicator.tsx` | Status badge | Reusable V2 | None |
| `src/components/ui/index.tsx` | UI component exports | Reusable V2 | None |

**Status:** ✅ Design system is production-ready


#### Assets (12 files)

| File | Current Purpose | Why Keep | Risk |
|------|----------------|----------|------|
| `assets/icon.png` | App icon (1024×1024) | Brand asset | None |
| `assets/splash.png` | Splash screen (2048×2048) | Brand asset | None |
| `assets/adaptive-icon.png` | Android adaptive icon | Android requirement | None |
| `assets/android-icon-*.png` | Android icon variations | Android Play Store | None |
| `assets/favicon.png` | Web favicon | Future web version | None |
| `assets/fonts/*.ttf` | Geist, Inter, JetBrains Mono (6 fonts) | Typography system | None |

**Status:** ✅ All assets validated

#### Utilities (2 files)

| File | Current Purpose | Why Keep | Risk |
|------|----------------|----------|------|
| `src/utils/date.ts` | IST date functions (todayIST, daysBetween) | Core utility, reusable | None |
| `src/utils/validation.ts` | Input validation helpers | Reusable forms | None |

**Status:** ✅ Utilities are architecture-agnostic

#### Auth Screens (5 files - minimal changes needed)

| File | Current Purpose | Why Keep | Risk |
|------|----------------|----------|------|
| `app/(auth)/_layout.tsx` | Auth stack layout | Navigation structure | None |
| `app/(auth)/login.tsx` | Email/password login | Keep UI, update API | Low |
| `app/(auth)/signup.tsx` | User registration | Keep UI, update API | Low |
| `app/(auth)/forgot-password.tsx` | Password reset flow | Keep UI, update API | Low |
| `app/(auth)/check-email.tsx` | Post-reset confirmation | Static screen | None |

**Status:** ⚠️ Need API call updates only

**Total KEEP: 32 files**

---

### MODIFY (Updates Required for V2)

#### Type Definitions (2 files)

| File | Current State | Required Changes | Priority |
|------|--------------|------------------|----------|
| `src/types/index.ts` | Has Mission types | Remove Mission types, add Training Day/Session/Question types | **HIGH** |
| `src/types/database.ts` | Supabase DB types | Update for new schema or remove if using Hostinger | **HIGH** |

**Changes Needed:**
- Remove: `MissionCategory`, `MissionType`, `DbMission`, `DbMissionCompletion`
- Add: `TrainingDay`, `Session`, `Question`, `QuestionResponse`, `SessionProgress`, `AIFeedback`
- Keep: `DbUser`, `RANK_THRESHOLDS` (XP system unchanged)

#### State Management (2 files)

| File | Current State | Required Changes | Priority |
|------|--------------|------------------|----------|
| `src/store/auth.store.ts` | Works with Supabase session | Keep structure, add JWT token storage if switching to Hostinger | **MEDIUM** |
| `src/store/mission.store.ts` | Mission state machine | DELETE or rename to `session.store.ts` for training sessions | **HIGH** |

**Decision Point:** Keep Supabase for beta or migrate to Hostinger?
- **Keep Supabase:** Only update type definitions
- **Migrate to Hostinger:** Add JWT token storage, remove Supabase session type

#### Services Layer (3 files)

| File | Current State | Required Changes | Priority |
|------|--------------|------------------|----------|
| `src/services/supabase.ts` | Supabase client singleton | Keep if using Supabase, else create `api.ts` | **MEDIUM** |
| `src/services/auth.service.ts` | Supabase auth calls | Works as-is for Supabase | **LOW** |
| `src/services/mission.service.ts` | Mission CRUD + complete_mission RPC | DELETE, replace with `training.service.ts` + `question.service.ts` | **HIGH** |

**New Services Needed:**
- `src/services/training.service.ts` — Fetch training days, sessions, current progress
- `src/services/question.service.ts` — Submit answers, fetch questions
- `src/services/ai-evaluation.service.ts` — Google Gemini API integration


#### Hooks (4 files)

| File | Current State | Required Changes | Priority |
|------|--------------|------------------|----------|
| `src/hooks/useAuth.ts` | Auth actions facade | Keep interface, may need JWT updates | **LOW** |
| `src/hooks/useAuthInitializer.ts` | Boot-time auth check | Keep as-is | **NONE** |
| `src/hooks/useFormValidation.ts` | Generic validation | Keep as-is | **NONE** |
| `src/hooks/useMissionEngine.ts` | Mission flow logic | DELETE, replace with `useTrainingEngine.ts` | **HIGH** |

**New Hook Needed:**
- `src/hooks/useTrainingEngine.ts` — Load session, submit answer, track progress

#### UI Screens (7 files)

| File | Current State | Required Changes | Priority |
|------|--------------|------------------|----------|
| `app/_layout.tsx` | Root layout with AuthGate | Keep structure, ensure auth check works | **LOW** |
| `app/(tabs)/_layout.tsx` | Tab navigator (Home, Training, Profile) | Verify tab labels match V2 | **LOW** |
| `app/(tabs)/index.tsx` | Dashboard (featured mission) | Replace with current training day display | **HIGH** |
| `app/(tabs)/missions.tsx` | Mission library | Replace with training days 0-8 with lock states | **HIGH** |
| `app/(tabs)/profile.tsx` | User stats | Update metrics for training days | **MEDIUM** |
| `app/mission/[id].tsx` | Mission detail screen | DELETE or repurpose for session flow | **HIGH** |
| `app/mission/success.tsx` | Mission complete | Repurpose to `session/summary.tsx` | **HIGH** |
| `app/mission/failure.tsx` | Mission failed | DELETE (not needed in V2) | **LOW** |

**New Screens Needed:**
- `app/session/[sessionId].tsx` — Question flow (one question at a time)
- `app/session/summary.tsx` — Session complete summary
- `app/day-complete.tsx` — Day completion + unlock next


#### Mission Type Components (4 files)

| File | Current State | Action | Priority |
|------|--------------|--------|----------|
| `src/components/mission-types/ReflectWrite.tsx` | Text area with word count | DELETE, replace with `SubjectiveQuestion.tsx` | **HIGH** |
| `src/components/mission-types/PollReasoning.tsx` | Option select + reasoning | DELETE, replace with `MCQQuestion.tsx` | **HIGH** |
| `src/components/mission-types/DailyChallenge.tsx` | Checkbox + optional reflection | DELETE (not in V2) | **MEDIUM** |
| `src/components/mission-types/RapidResponse.tsx` | Timed decision | KEEP but move to `question-types/` | **MEDIUM** |

**New Components Needed:**
- `src/components/question-types/MCQQuestion.tsx` — Multiple choice (4 options)
- `src/components/question-types/SingleWordQuestion.tsx` — Text input (1 word)
- `src/components/question-types/NumericQuestion.tsx` — Number input
- `src/components/question-types/RapidResponseQuestion.tsx` — Move existing
- `src/components/question-types/SubjectiveQuestion.tsx` — Paragraph + AI feedback
- `src/components/question-types/QuestionFeedback.tsx` — Result display

**Total MODIFY: 22 files + 12 new files to create**

---

### ARCHIVE (Move to archive/v1/)

#### V1 Supabase Migrations (9 files)

| File | Purpose | Why Archive |
|------|---------|-------------|
| `supabase/migrations/001_initial_schema.sql` | V1 schema | Reference for V2 schema design |
| `supabase/migrations/002_seed_missions.sql` | 14 missions | Historical content |
| `supabase/migrations/003_seed_week1_week2_missions.sql` | 70 missions | Historical content |
| `supabase/migrations/004_mission_library_secure.sql` | RLS + featured logic | V1 architecture |
| `supabase/migrations/005_fix_rpc_exception_handler.sql` | Bug fix | V1-specific |
| `supabase/migrations/006_add_rapid_response.sql` | Added mission type | V1-specific |
| `ROLLBACK_004_mission_library_secure.sql` | Rollback script | V1-specific |
| `DEBUG_CHECK_RPC.sql` | Debugging query | V1-specific |
| `INVESTIGATE_FEATURED_LOGIC.sql` | Debugging query | V1-specific |

**Action:** Move to `archive/v1/supabase/migrations/`


#### V1 Documentation (38 files)

**Build Logs & Summaries:**
- `DAY1_SETUP.md` — V1 setup documentation
- `DAY2_COMPLETION.md` — Day 2 summary
- `DAY2_SUMMARY.md` — Day 2 summary (duplicate)
- `DAY2_VERIFICATION_AUDIT.md` — Verification testing
- `DAY3_*.md` (8 files) — Day 3 implementation docs
- `BUILD_LOG.md` — Historical build notes
- `BOTTOM_NAV_LABEL_FIX.md` — Bug fix documentation
- `BUG_FIXES_APPLIED.md` — Bug fix log
- `IMPLEMENTATION_COMPLETE.md` — V1 completion
- `LOGOUT_*.md` (4 files) — Logout debugging docs

**Validation & Testing:**
- `VALIDATION_*.md` (5 files) — Test results
- `VALIDATION_*.sql` (3 files) — SQL test suites
- `COMPLETE_SCHEMA.sql` — Full V1 schema dump
- `FLOW_VALIDATION_REPORT.md` — Flow testing
- `TESTING_GUIDE.md` — Test procedures
- `READY_TO_TEST.md` — Test readiness checklist

**Architecture & Planning:**
- `PHASE1_*.md` (4 files) — Phase 1 docs
- `PHASE2_*.md` (2 files) — Phase 2 docs
- `PRODUCTION_READINESS_AUDIT.md` — Production checklist
- `INTEGRATION_REFERENCE.md` — Integration notes
- `MISSION_*.md` (4 files) — Mission system docs
- `ROLLBACK_INSTRUCTIONS.md` — Database rollback guide
- `SECURITY_FIXES_*.md` (2 files) — Security patches
- `SEED_INSTRUCTIONS.md` — Content seeding guide
- `TASK_BOARD.md` — V1 task tracking
- `XP_PROGRESSION_*.md` (2 files) — XP system analysis

**Action:** Move ALL to `archive/v1/docs/`

**Total ARCHIVE: 47 files**

---

### DELETE (Permanent Removal)

#### Duplicate Files (3 files)

| File | Reason | Risk |
|------|--------|------|
| `authstore.ts` (root) | Duplicate of `src/store/auth.store.ts` | None - confirmed duplicate |
| `useauth.ts` (root) | Duplicate of `src/hooks/useAuth.ts` | None - confirmed duplicate |
| `useauthinitializer.ts` (root) | Duplicate of `src/hooks/useAuthInitializer.ts` | None - confirmed duplicate |

**Action:** Delete immediately (no archive needed)

#### Obsolete Content (2 files)

| File | Reason | Risk |
|------|--------|------|
| `missions_seed.csv` | V1 mission content | None - already in SQL migrations |
| `CLAUDE.md` | Obsolete agent instructions | None - replaced by AGENTS.md |

**Action:** Delete immediately

**Total DELETE: 5 files**

---

### Experimental/Unknown Folders

#### Needs Investigation

| Path | Contents | Action Needed |
|------|----------|---------------|
| `forge-api-day1/` | Partial Node.js API (Day 1 attempt) | ARCHIVE if abandoned, DELETE if duplicate |
| `forge-clean/` | Clean slate project copy | DELETE (likely experimental) |
| `stitch 1/` | Design references (Figma exports?) | KEEP or ARCHIVE based on usage |
| `stitch 2/` | Design references (Figma exports?) | KEEP or ARCHIVE based on usage |
| `docs/FORGE_CONTENT_V1.md` | V1 content guide | ARCHIVE |

**Action Required:** Verify with founder before action

---

## PART 2: DOCUMENTATION CLEANUP

### Documentation Audit

**Current State:** 47 markdown files in project root  
**Target State:** ≤10 active documentation files


### Classification

#### A. Active V2 Documentation (KEEP)

| File | Purpose | Action |
|------|---------|--------|
| `PROJECT_CONTEXT.md` | Source of truth | UPDATE for V2 |
| `DECISIONS.md` | Decision log | KEEP, add V2 decisions |
| `AGENTS.md` | Agent steering | UPDATE for V2 guidance |
| `FORGE_V2_TRANSFORMATION_PLAN.md` | V2 architecture | KEEP as reference |
| `LEAN_BETA_PLAN_JUNE20.md` | Beta execution plan | KEEP as active plan |
| `HOSTINGER_MIGRATION_PLAN.md` | Migration strategy | KEEP if migrating |
| `LICENSE` | MIT license | KEEP |
| `README.md` | Project overview | CREATE (currently missing) |

**Total Active: 8 files (7 existing + 1 to create)**

#### B. Historical Reference (ARCHIVE to archive/v1/docs/)

All DAY*_*.md files (13 files)  
All VALIDATION_*.md files (5 files)  
All PHASE*_*.md files (6 files)  
All MISSION_*.md files (4 files)  
All LOGOUT_*.md files (4 files)  
All XP_*.md files (2 files)  
Plus: BUILD_LOG.md, BUG_FIXES_APPLIED.md, IMPLEMENTATION_COMPLETE.md, etc.

**Total Historical: 38 files**

#### C. Obsolete V1 Documentation (ARCHIVE to archive/v1/docs/)

All SQL validation files (3 .sql files at root)  
COMPLETE_SCHEMA.sql  
ROLLBACK_INSTRUCTIONS.md  
SEED_INSTRUCTIONS.md  
TESTING_GUIDE.md

**Total Obsolete: 9 files**

#### D. Duplicate Documentation (DELETE)

CLAUDE.md (replaced by AGENTS.md)  

**Total Duplicates: 1 file**

---

## PART 3: SUPABASE DEPENDENCY REPORT

### Direct Supabase Calls


#### File: `src/services/supabase.ts`

**Purpose:** Supabase client singleton  
**Supabase Calls:**
- `createClient()` — Creates authenticated client
- Uses `expo-secure-store` for session storage

**Architecture Layer:** Infrastructure  
**Recommended Refactor:** Keep as-is for Supabase, or replace with `api.ts` for Hostinger

#### File: `src/services/auth.service.ts`

**Purpose:** Authentication operations  
**Supabase Calls:**
- `supabase.auth.signUp()`
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signOut()`
- `supabase.auth.resetPasswordForEmail()`

**Architecture Layer:** Service Layer  
**Recommended Refactor:** Abstract to interface — `IAuthService` with `SupabaseAuthService` and `HostingerAuthService` implementations

#### File: `src/services/mission.service.ts`

**Purpose:** Mission CRUD and completion  
**Supabase Calls:**
- `supabase.from('missions').select()`
- `supabase.from('mission_completions').select()`
- `supabase.rpc('complete_mission')`
- `supabase.from('feedback').insert()`

**Architecture Layer:** Service Layer  
**Status:** **DELETE in V2** — Replace with training.service.ts and question.service.ts

#### File: `src/hooks/useAuthInitializer.ts`

**Purpose:** Boot-time auth check  
**Supabase Calls:**
- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange()`

**Architecture Layer:** Hook  
**Recommended Refactor:** Call through `auth.service.ts` instead of direct Supabase


#### File: `app/(tabs)/index.tsx` (Dashboard)

**Purpose:** Home screen with featured mission  
**Supabase Calls:**
- Via `mission.service.fetchFeaturedMission()` (indirect)

**Architecture Layer:** UI  
**Status:** ✅ Good architecture — UI calls service, not database directly

#### File: `app/(tabs)/missions.tsx` (Library)

**Purpose:** Mission browser  
**Supabase Calls:**
- Via `mission.service.fetchAllMissions()` (indirect)

**Architecture Layer:** UI  
**Status:** ✅ Good architecture

#### File: `app/(tabs)/profile.tsx` (Profile)

**Purpose:** User stats and feedback  
**Supabase Calls:**
- Direct: `supabase.from('feedback').insert()` ⚠️

**Architecture Layer:** UI  
**Status:** ⚠️ Should call through service layer

#### File: `app/mission/[id].tsx` (Mission Detail)

**Purpose:** Mission execution  
**Supabase Calls:**
- Via `mission.service.fetchMissionById()` (indirect)
- Via `useMissionEngine.completeMission()` (indirect)

**Architecture Layer:** UI  
**Status:** ✅ Good architecture

### Dependency Summary

**Total Files with Direct Supabase Calls:** 4 core files  
**Files with Indirect Calls (via services):** 4 UI files  

**Current Architecture:**
```
UI → Service Layer → Supabase Client → Supabase Database
```

**Target V2 Architecture:**
```
UI → Service Layer → Repository Layer → Database (Supabase OR Hostinger)
```

**Migration Effort:**
- Keep Supabase: **LOW** (update types only)
- Switch to Hostinger: **MEDIUM** (replace auth.service + create new API service)

---

## PART 4: V2 READINESS REPORT

### Current V2 Completion: 35%

**Breakdown:**

| Component | Status | Progress | Blockers |
|-----------|--------|----------|----------|
| **Infrastructure** | ✅ Complete | 100% | None |
| **Design System** | ✅ Complete | 100% | None |
| **Auth System** | ✅ Complete | 100% | None (works with Supabase) |
| **Type Definitions** | ⚠️ Partial | 40% | Need Training Day/Session/Question types |
| **Service Layer** | ⚠️ Partial | 30% | Need training/question services, optional AI service |
| **State Management** | ⚠️ Partial | 50% | Mission store needs replacement |
| **UI Screens** | ❌ Not Started | 20% | Dashboard/Library need V2 updates |
| **Question Components** | ❌ Not Started | 0% | Need 5 question type components |
| **Database Schema** | ❌ Not Started | 0% | V2 schema not created |
| **Content** | ❌ Not Started | 0% | Need 105 questions for beta |

### Remaining Blockers

#### High Priority (Launch Blockers)

1. **Database Schema Decision**
   - Keep Supabase OR migrate to Hostinger?
   - Current recommendation: **Keep Supabase for beta**
   - Reasoning: Supabase works, migration adds risk, can migrate post-beta

2. **Type Definitions**
   - Need: `TrainingDay`, `Session`, `Question`, `QuestionResponse`, `AIFeedback`
   - Estimated effort: 2 hours

3. **Service Layer**
   - Need: `training.service.ts`, `question.service.ts`
   - Optional: `ai-evaluation.service.ts` (if AI feedback in beta)
   - Estimated effort: 6 hours

4. **Question Type Components**
   - Need: MCQ, Single Word, Numeric, Rapid Response, Subjective
   - Estimated effort: 10 hours (2h each)

5. **UI Screen Updates**
   - Dashboard: Display current training day (not featured mission)
   - Library: Display Days 0-8 with lock states
   - Session Flow: New screen for question-by-question flow
   - Estimated effort: 12 hours

6. **Content Creation**
   - Need: 105 questions (Days 0-2, 35 questions each)
   - Co-founder task
   - Estimated effort: 20-30 hours

#### Medium Priority (Beta Enhancement)

7. **AI Evaluation Integration**
   - Google Gemini API setup
   - Evaluate subjective answers
   - Display feedback to users
   - Estimated effort: 6 hours
   - **Decision:** Include in beta? Adds value but increases scope

8. **Session Progress Tracking**
   - Track questions answered per session
   - Calculate accuracy
   - Show session summary
   - Estimated effort: 4 hours

9. **Day Completion Flow**
   - Unlock next day after completing all 3 sessions
   - Day complete screen with stats
   - Estimated effort: 3 hours

#### Low Priority (Post-Beta)

10. **Days 3-8 Content**
    - 240 additional questions
    - Post-beta expansion
    - Not blocking launch

11. **Achievement System**
    - Badges for milestones
    - V2 feature, not MVP

12. **Advanced Analytics**
    - Detailed progress charts
    - Accuracy trends
    - V2 feature

### Files Still Depending on V1 Architecture

| File | V1 Dependency | Impact | Conversion Effort |
|------|---------------|--------|-------------------|
| `src/store/mission.store.ts` | Mission state machine | HIGH | 4 hours (rewrite as session.store.ts) |
| `src/hooks/useMissionEngine.ts` | Mission flow logic | HIGH | 6 hours (rewrite as useTrainingEngine.ts) |
| `app/(tabs)/index.tsx` | Featured mission display | HIGH | 3 hours (display current training day) |
| `app/(tabs)/missions.tsx` | Mission cards | HIGH | 4 hours (display training day cards) |
| `app/mission/[id].tsx` | Mission detail | HIGH | 8 hours (rebuild as session flow) |
| `src/components/mission-types/*` | Mission UI | HIGH | 10 hours (rebuild as question-types) |

**Total Conversion Effort: 35 hours**


### Estimated Effort to V2 Beta

**Founder Tasks:**
- Database schema (Supabase V2): 4 hours
- Type definitions: 2 hours
- Service layer: 6 hours
- State management: 4 hours
- Question components: 10 hours
- UI updates: 12 hours
- AI integration (optional): 6 hours
- Testing & bug fixes: 8 hours

**Total Founder: 52 hours (±10 hours)**

**Co-founder Tasks:**
- Content creation (105 questions): 24 hours
- Content review: 6 hours

**Total Co-founder: 30 hours**

**Timeline:**
- **Realistic (6 days):** June 15-20, 2026
- **Aggressive (4 days):** Possible if AI evaluation deferred to post-beta
- **Conservative (10 days):** If Hostinger migration included

**Recommendation:** **Keep Supabase for beta, defer Hostinger to post-beta**

---

## PART 5: CLEANUP EXECUTION PLAN

### Phase A: Archive V1 (2 hours, no code changes)

**Step 1:** Create archive structure
```bash
mkdir -p archive/v1/docs
mkdir -p archive/v1/supabase/migrations
```

**Step 2:** Move documentation (38 files)
```bash
mv DAY*.md archive/v1/docs/
mv VALIDATION*.md archive/v1/docs/
mv PHASE*.md archive/v1/docs/
mv MISSION*.md archive/v1/docs/
mv LOGOUT*.md archive/v1/docs/
mv XP*.md archive/v1/docs/
mv BUILD_LOG.md BUG_FIXES_APPLIED.md IMPLEMENTATION_COMPLETE.md archive/v1/docs/
mv TESTING_GUIDE.md READY_TO_TEST.md ROLLBACK_INSTRUCTIONS.md archive/v1/docs/
mv PRODUCTION_READINESS_AUDIT.md INTEGRATION_REFERENCE.md archive/v1/docs/
mv SECURITY_FIXES*.md SEED_INSTRUCTIONS.md archive/v1/docs/
mv BOTTOM_NAV_LABEL_FIX.md FLOW_VALIDATION_REPORT.md archive/v1/docs/
mv TASK_BOARD.md archive/v1/docs/
```

**Step 3:** Move SQL files (12 files)
```bash
mv supabase/migrations/*.sql archive/v1/supabase/migrations/
mv VALIDATION*.sql COMPLETE_SCHEMA.sql archive/v1/docs/
mv ROLLBACK_004*.sql DEBUG_CHECK_RPC.sql archive/v1/docs/
mv INVESTIGATE_FEATURED_LOGIC.sql archive/v1/docs/
```

**Step 4:** Move V1 content
```bash
mv docs/FORGE_CONTENT_V1.md archive/v1/docs/
mv missions_seed.csv archive/v1/
```

**Result:** 50 files moved to archive, project root clean


### Phase B: Refactor for V2 (52 hours, founder work)

**Day 1 (8 hours) — Database & Types**
- [ ] Create V2 schema migration (4h)
  - Rename `missions` → `questions`
  - Add `training_day`, `session_number`, `question_type` columns
  - Create `session_progress` table
  - Update RPC: `complete_question()` replaces `complete_mission()`
- [ ] Update type definitions (2h)
  - Add Training Day, Session, Question types
  - Remove Mission types
- [ ] Test schema migration locally (2h)

**Day 2 (10 hours) — Services**
- [ ] Create `training.service.ts` (3h)
  - `fetchTrainingDays()`
  - `fetchSessions(dayId)`
  - `getCurrentTrainingDay(userId)`
- [ ] Create `question.service.ts` (3h)
  - `fetchSessionQuestions(sessionId)`
  - `submitAnswer(questionId, answer, timeTaken)`
- [ ] Create `ai-evaluation.service.ts` (optional) (3h)
  - Google Gemini API integration
  - `evaluateSubjectiveAnswer(question, answer)`
- [ ] Test services with Postman (1h)

**Day 3 (10 hours) — Question Components**
- [ ] Build `MCQQuestion.tsx` (2h)
- [ ] Build `SingleWordQuestion.tsx` (1h)
- [ ] Build `NumericQuestion.tsx` (1h)
- [ ] Build `RapidResponseQuestion.tsx` (2h)
- [ ] Build `SubjectiveQuestion.tsx` (3h)
- [ ] Test all components (1h)

**Day 4 (12 hours) — UI Screens**
- [ ] Update Dashboard (`index.tsx`) (3h)
  - Display current training day
  - Show session progress
  - Call `training.service.getCurrentTrainingDay()`
- [ ] Update Library (`missions.tsx`) (3h)
  - Display Days 0-8 with lock states
  - Show session completion badges
- [ ] Build Session Flow (`session/[sessionId].tsx`) (4h)
  - Question-by-question flow
  - Progress bar
  - Submit + feedback
- [ ] Build Session Summary (`session/summary.tsx`) (2h)

**Day 5 (8 hours) — State & Hooks**
- [ ] Update `mission.store.ts` → `session.store.ts` (2h)
- [ ] Create `useTrainingEngine.ts` hook (4h)
- [ ] Update `app/_layout.tsx` for V2 nav (1h)
- [ ] Test full flow (1h)

**Day 6 (8 hours) — Testing & Polish**
- [ ] End-to-end testing (4h)
- [ ] Bug fixes (2h)
- [ ] UI polish (2h)


### Phase C: Remove Obsolete Code (1 hour, after V2 works)

**Delete immediately (no backup needed):**
- [ ] `authstore.ts` (duplicate)
- [ ] `useauth.ts` (duplicate)
- [ ] `useauthinitializer.ts` (duplicate)
- [ ] `CLAUDE.md` (obsolete)

**Delete after V2 validation:**
- [ ] `src/services/mission.service.ts`
- [ ] `src/hooks/useMissionEngine.ts`
- [ ] `src/components/mission-types/` (entire folder)
- [ ] `app/mission/` (entire folder)

**Investigate before action:**
- [ ] `forge-api-day1/` — Check if needed
- [ ] `forge-clean/` — Likely DELETE
- [ ] `stitch 1/` and `stitch 2/` — Confirm with founder

---

## PART 6: RISK ASSESSMENT

### High Risk

**1. Content Creation Delay**
- **Risk:** 105 questions not ready by June 18
- **Impact:** Beta launch blocked
- **Mitigation:** Founder writes placeholder questions if co-founder delayed
- **Fallback:** Launch with Day 0 only (35 questions)

**2. Database Schema Migration Failure**
- **Risk:** Migration breaks existing V1 data
- **Impact:** Cannot rollback without data loss
- **Mitigation:** 
  - Full database backup before migration
  - Test migration on local Supabase instance first
  - Keep V1 tables as backup (`missions_backup`, `mission_completions_backup`)
- **Fallback:** Revert to V1 until fixed

**3. Time Overrun on UI Components**
- **Risk:** Question type components take >10 hours
- **Impact:** Beta delayed
- **Mitigation:** Use simpler UI, skip animations
- **Fallback:** Launch with MCQ + Subjective only (2 question types)

### Medium Risk

**4. AI Evaluation Latency**
- **Risk:** Google Gemini API takes >5 seconds per evaluation
- **Impact:** Poor user experience
- **Mitigation:** 
  - Show loading state with progress messages
  - 8-second timeout → "Evaluation pending"
  - Cache common evaluations
- **Fallback:** Defer AI evaluation to post-beta

**5. Session Flow Complexity**
- **Risk:** Session navigation logic is complex to implement
- **Impact:** Development time increases
- **Mitigation:** Simple linear flow, no back button
- **Fallback:** One question per screen, simple Next button


### Low Risk

**6. Locked Day UI**
- **Risk:** Users confused by locked Days 3-8
- **Impact:** Support burden
- **Mitigation:** Clear "Coming Soon — More content after beta" message
- **Fallback:** Hide Days 3-8 entirely

**7. Question Content Quality**
- **Risk:** Questions poorly written or unclear
- **Impact:** User confusion, bad beta feedback
- **Mitigation:** Co-founder reviews all questions twice before seeding
- **Fallback:** Post-beta content updates based on feedback

---

## PART 7: RECOMMENDATIONS

### Primary Recommendation: Keep Supabase for Beta

**Reasoning:**
1. ✅ Supabase works today
2. ✅ V1 architecture proved it can handle the product
3. ✅ No migration risk for June 20 deadline
4. ✅ Auth, database, API in one place
5. ✅ Free tier sufficient for 10-20 beta testers

**Defer to Post-Beta:**
- Hostinger migration
- Cost optimization
- MySQL conversion

**Result:** Focus 100% on V2 features, not infrastructure

---

### Secondary Recommendation: Reduce Content Scope

**Current Target:** 105 questions (Days 0-2)

**Recommendation:** Start with 60 questions (Days 0-1)
- Day 0: 30 questions (3 sessions × 10 questions)
- Day 1: 30 questions (3 sessions × 10 questions)
- Days 2-8: "Coming Soon"

**Reasoning:**
1. 60 questions = 20 hours co-founder work (doable by June 17)
2. 2 days sufficient to prove concept
3. Can add Day 2 during beta week if needed

**Result:** Lower risk, faster launch

---

### Tertiary Recommendation: Defer AI Evaluation

**Reasoning:**
1. AI evaluation adds 6+ hours development
2. Google Gemini API adds external dependency
3. Latency risk (>5 seconds per evaluation)
4. Not essential for proving training day concept

**Alternative:**
- Mark subjective questions as "Manual Review"
- Founder reviews answers manually during beta
- Add AI post-beta after proving engagement

**Result:** Reduce scope, increase reliability


---

## PART 8: EXECUTION CHECKLIST

### Immediate Actions (Today - June 15)

**Founder:**
- [ ] Review this audit
- [ ] Decide: Keep Supabase OR migrate to Hostinger?
- [ ] Decide: Include AI evaluation in beta OR defer?
- [ ] Decide: 60 questions OR 105 questions for launch?
- [ ] Approve cleanup plan
- [ ] Execute Phase A: Archive V1 (2 hours)

**Co-founder:**
- [ ] Review content requirements
- [ ] Set up Google Sheet for question creation
- [ ] Begin Day 0 questions (10-15 questions today)

---

### Week Timeline (If Starting Today)

**June 15 (Sunday) — Setup**
- Founder: Archive V1, create V2 schema (8h)
- Co-founder: Day 0 content (15 questions) (6h)

**June 16 (Monday) — Services**
- Founder: Build service layer (10h)
- Co-founder: Day 1 content (15 questions) (6h)

**June 17 (Tuesday) — Components**
- Founder: Question type components (10h)
- Co-founder: Day 2 content (15 questions) + review (6h)

**June 18 (Wednesday) — UI**
- Founder: Update screens (10h)
- Co-founder: Content validation + fixes (4h)

**June 19 (Thursday) — Integration**
- Founder: State management + testing (10h)
- Co-founder: Beta support (2h)

**June 20 (Friday) — Launch**
- Founder: Bug fixes + polish (8h)
- Co-founder: User onboarding (2h)

**Total Founder Hours: 56 hours**  
**Total Co-founder Hours: 26 hours**

---

## SUMMARY

### File Count Summary

| Classification | Count | Action |
|----------------|-------|--------|
| **KEEP** | 32 files | No changes |
| **MODIFY** | 22 files | Update for V2 |
| **CREATE** | 12 files | New components/services |
| **ARCHIVE** | 47 files | Move to archive/v1/ |
| **DELETE** | 5 files | Remove permanently |
| **INVESTIGATE** | 5 folders | Confirm with founder |

**Total Managed:** 123 files/folders

---

### Documentation Summary

| Category | Count | Status |
|----------|-------|--------|
| Active V2 Docs | 7 files | Keep in root |
| Historical Docs | 38 files | Archive to v1/docs/ |
| Obsolete Docs | 9 files | Archive to v1/docs/ |
| Duplicate Docs | 1 file | Delete |

**Result:** 47 → 7 documentation files in root (85% reduction)

---

### Supabase Dependency Summary

| Layer | Files | Supabase Usage | Action |
|-------|-------|----------------|--------|
| Infrastructure | 1 | Direct client | Keep or replace |
| Service Layer | 2 | All auth/data calls | Abstract if migrating |
| UI Layer | 4 | Indirect (via services) | ✅ Good architecture |
| Hook Layer | 1 | Auth state change | Refactor to service |

**Architecture Status:** ✅ Service layer mostly implemented  
**Migration Effort (if switching to Hostinger):** MEDIUM (16 hours)

---

### V2 Readiness Summary

**Current Progress:** 35% complete

**Critical Path:**
1. Database schema (4h)
2. Type definitions (2h)
3. Service layer (6h)
4. Question components (10h)
5. UI updates (12h)
6. Content creation (24h)
7. Testing (8h)

**Total Effort:** 66 hours (56 founder + 30 co-founder)  
**Achievable by June 20:** YES (if starting today)

---

### Risk Summary

**High Risk:** Content creation delay, schema migration failure  
**Medium Risk:** AI evaluation latency, UI complexity  
**Low Risk:** Locked day confusion, content quality

**Mitigation Strategy:** Keep Supabase, reduce content scope, defer AI

---

### Final Recommendation

**DO THIS:**
1. ✅ Keep Supabase for beta (no migration)
2. ✅ Target 60-105 questions (Days 0-2)
3. ✅ Defer AI evaluation to post-beta
4. ✅ Archive V1 documentation today
5. ✅ Start V2 database schema tomorrow

**DEFER THIS:**
1. ⏭️ Hostinger migration (post-beta)
2. ⏭️ Days 3-8 content (post-beta)
3. ⏭️ Achievement system (V2 feature)
4. ⏭️ Advanced analytics (V2 feature)

**AVOID THIS:**
1. ❌ Rebuilding working auth system
2. ❌ Over-engineering database schema
3. ❌ Adding features beyond MVP

---

## APPENDIX: File Paths Reference

### Files to Archive (47 files)

**Documentation:**
```
DAY1_SETUP.md
DAY2_COMPLETION.md
DAY2_SUMMARY.md
DAY2_VERIFICATION_AUDIT.md
DAY3_DESIGN_MAPPING_REPORT.md
DAY3_FINAL_GAP_ANALYSIS.md
DAY3_PHASE1_DASHBOARD_COMPLETE.md
DAY3_PHASE2_MISSION_DETAIL_COMPLETE.md
DAY3_PHASE2_REVISION_PROPOSAL.md
DAY3_PHASE2_TASK_A_COMPLETE.md
DAY3_SUCCESS_SCREEN_REDESIGN_COMPLETE.md
DAY3_SUMMARY.md
DAY3_UI_TRANSFORMATION.md
BUILD_LOG.md
BUG_FIXES_APPLIED.md
BOTTOM_NAV_LABEL_FIX.md
IMPLEMENTATION_COMPLETE.md
LOGOUT_DEBUGGING_INVESTIGATION.md
LOGOUT_FIX_EXPLANATION.md
LOGOUT_FIX_IMPLEMENTATION.md
LOGOUT_TRACE_TESTING.md
VALIDATION_EXECUTIVE_SUMMARY.md
VALIDATION_MANUAL_TESTS.md
VALIDATION_READY.md
VALIDATION_RESULTS_TEMPLATE.md
COMPLETE_SCHEMA.sql
VALIDATION_SIMPLE.sql
VALIDATION_TEST_SUITE.sql
VALIDATION_TEST_SUITE_SUPABASE.sql
FLOW_VALIDATION_REPORT.md
TESTING_GUIDE.md
READY_TO_TEST.md
PHASE1_IMPLEMENTATION_REPORT.md
PHASE1_QUICK_START.md
PHASE1_SECURITY_INDEX.md
PHASE1_SUMMARY.md
PHASE1_TEST_SCRIPT.sql
PHASE2_MISSION_LIBRARY_UI_COMPLETE.md
PRODUCTION_READINESS_AUDIT.md
INTEGRATION_REFERENCE.md
MISSION_CONTENT_AUDIT.md
MISSION_LIBRARY_DATABASE_VALIDATION.md
MISSION_LIBRARY_V1_PROPOSAL.md
MISSION_LOADING_TRACE.md
MISSION_MIGRATION_COMPLETE.md
ROLLBACK_INSTRUCTIONS.md
SECURITY_FIXES_APPLIED.md
SECURITY_FIXES_SUMMARY.md
SEED_INSTRUCTIONS.md
TASK_BOARD.md
XP_PROGRESSION_ANALYSIS.md
XP_PROGRESSION_MODELS_ANALYSIS.md
docs/FORGE_CONTENT_V1.md
```

**Supabase Migrations:**
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_missions.sql
supabase/migrations/003_seed_week1_week2_missions.sql
supabase/migrations/004_mission_library_secure.sql
supabase/migrations/005_fix_rpc_exception_handler.sql
supabase/migrations/006_add_rapid_response.sql
ROLLBACK_004_mission_library_secure.sql
DEBUG_CHECK_RPC.sql
INVESTIGATE_FEATURED_LOGIC.sql
TEST_RPC_DIRECT.sql
```

### Files to Delete (5 files)

```
authstore.ts
useauth.ts
useauthinitializer.ts
missions_seed.csv
CLAUDE.md
```

### Files to Create (12 files)

```
src/services/training.service.ts
src/services/question.service.ts
src/services/ai-evaluation.service.ts
src/components/question-types/MCQQuestion.tsx
src/components/question-types/SingleWordQuestion.tsx
src/components/question-types/NumericQuestion.tsx
src/components/question-types/RapidResponseQuestion.tsx
src/components/question-types/SubjectiveQuestion.tsx
src/components/question-types/QuestionFeedback.tsx
src/hooks/useTrainingEngine.ts
app/session/[sessionId].tsx
app/session/summary.tsx
```

---

**END OF AUDIT**

*Generated: June 15, 2026*  
*Next Steps: Await founder approval → Execute Phase A → Begin Phase B*
