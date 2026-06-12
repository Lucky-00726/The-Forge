# THE FORGE — Task Board
### Engineering Task Board · Update status when picking up or completing a task
### Priority: P0 = Blocker · P1 = Critical path · P2 = Important · P3 = Nice to have

---

## Legend

| Status | Meaning |
|---|---|
| `BACKLOG` | Defined, not yet scheduled |
| `TODO` | Scheduled for current sprint, not started |
| `IN PROGRESS` | Actively being worked on — set your name as Owner |
| `REVIEW` | Code complete, needs review or testing |
| `BLOCKED` | Cannot proceed — blocker listed |
| `DONE` | Verified complete |

---

## ✅ DONE

---

### TASK-001 — Project scaffold and configuration
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** None
- **Owner:** —
- **Deliverables:** `package.json`, `app.config.ts`, `tsconfig.json`, `babel.config.js`, `.env.example`, `.gitignore`
- **Done when:** `npx expo start` runs without errors

---

### TASK-002 — Design token system
- **Priority:** P0
- **Effort:** 1h
- **Dependencies:** TASK-001
- **Owner:** —
- **Deliverables:** `src/constants/tokens.ts` with Colors, Fonts, FontSizes, Spacing, Radius, RankColors
- **Done when:** All tokens exported and importable

---

### TASK-003 — TypeScript type system
- **Priority:** P0
- **Effort:** 1.5h
- **Dependencies:** TASK-001
- **Owner:** —
- **Deliverables:** `src/types/index.ts`, `src/types/database.ts`
- **Done when:** All DB shapes and domain types defined; no `any` in type files

---

### TASK-004 — IST date utilities
- **Priority:** P0
- **Effort:** 1h
- **Dependencies:** TASK-001
- **Owner:** —
- **Deliverables:** `src/utils/date.ts` with `todayIST()`, `daysBetween()`, `currentWeekNumber()`, `currentDayOfWeek()`
- **Done when:** Functions return correct values at midnight IST boundary

---

### TASK-005 — Supabase client singleton
- **Priority:** P0
- **Effort:** 1h
- **Dependencies:** TASK-001
- **Owner:** —
- **Deliverables:** `src/services/supabase.ts`
- **Done when:** Client created with SecureStoreAdapter, `detectSessionInUrl: false`

---

### TASK-006 — Auth service
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-005, TASK-003
- **Owner:** —
- **Deliverables:** `src/services/auth.service.ts`
- **Done when:** All 5 functions (`signUp`, `signIn`, `signOut`, `fetchProfile`, `sendPasswordReset`) implemented with error normalisation

---

### TASK-007 — Auth store (Zustand)
- **Priority:** P0
- **Effort:** 1h
- **Dependencies:** TASK-003
- **Owner:** —
- **Deliverables:** `src/store/auth.store.ts`
- **Done when:** `INITIAL_STATE` and `LOGGED_OUT_STATE` separated; all selectors exported

---

### TASK-008 — useAuthInitializer hook
- **Priority:** P0
- **Effort:** 1.5h
- **Dependencies:** TASK-006, TASK-007
- **Owner:** —
- **Deliverables:** `src/hooks/useAuthInitializer.ts`
- **Done when:** Boot session check + `onAuthStateChange` listener + double-clearAuth guard working

---

### TASK-009 — useAuth hook
- **Priority:** P0
- **Effort:** 1.5h
- **Dependencies:** TASK-006, TASK-007
- **Owner:** —
- **Deliverables:** `src/hooks/useAuth.ts`
- **Done when:** `logout()` calls `clearAuth()` before `signOut()`; all actions return correct results

---

### TASK-010 — Form validation hook
- **Priority:** P0
- **Effort:** 1h
- **Dependencies:** TASK-003
- **Owner:** —
- **Deliverables:** `src/hooks/useFormValidation.ts`
- **Done when:** Generic hook + 3 validators exported and tested in screens

---

### TASK-011 — Shared UI primitives
- **Priority:** P0
- **Effort:** 3h
- **Dependencies:** TASK-002
- **Owner:** —
- **Deliverables:** `src/components/ui/index.tsx`
- **Done when:** All 6 components render correctly on iOS and Android

---

### TASK-012 — Root layout and AuthGate
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-008, TASK-007, TASK-002
- **Owner:** —
- **Deliverables:** `app/_layout.tsx`
- **Done when:** `profile` not in AuthGate deps; redirect works on logout; fonts load; polyfill is first import

---

### TASK-013 — Auth screens
- **Priority:** P0
- **Effort:** 3h
- **Dependencies:** TASK-009, TASK-010, TASK-011
- **Owner:** —
- **Deliverables:** `login.tsx`, `signup.tsx`, `forgot-password.tsx`, `check-email.tsx`, `(auth)/_layout.tsx`
- **Done when:** Full auth flow works end-to-end

---

### TASK-014 — Tab navigator
- **Priority:** P0
- **Effort:** 1h
- **Dependencies:** TASK-002
- **Owner:** —
- **Deliverables:** `app/(tabs)/_layout.tsx`
- **Done when:** 2 tabs render with correct icons and labels

---

### TASK-015 — Dashboard screen
- **Priority:** P0
- **Effort:** 3h
- **Dependencies:** TASK-014, TASK-004, TASK-009
- **Owner:** —
- **Deliverables:** `app/(tabs)/index.tsx`
- **Done when:** Mission card shows for today; XP and streak display; refresh control works

---

### TASK-016 — Profile screen
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-009, TASK-011
- **Owner:** —
- **Deliverables:** `app/(tabs)/profile.tsx`
- **Done when:** Stats display, feedback inserts to DB, sign out works (BUG-001 verified fixed)

---

### TASK-017 — Database schema migration
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** Supabase project created
- **Owner:** —
- **Deliverables:** `supabase/migrations/001_initial_schema.sql` run successfully
- **Done when:** All 4 tables exist, RLS enabled, `complete_mission()` RPC callable

---

### TASK-018 — Mission seed data
- **Priority:** P0
- **Effort:** 3h
- **Dependencies:** TASK-017
- **Owner:** —
- **Deliverables:** `supabase/migrations/002_seed_missions.sql` run successfully
- **Done when:** `SELECT count(*) FROM missions` returns 14

---

### TASK-019 — Logout bug fix (BUG-001)
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-009, TASK-007, TASK-012, TASK-016, TASK-008, TASK-006
- **Owner:** —
- **Files changed:** `useAuth.ts`, `auth.store.ts`, `_layout.tsx`, `profile.tsx`, `useAuthInitializer.ts`, `auth.service.ts`
- **Done when:** Logout clears session, redirects to login, no stale state on re-login

---

## 🔄 IN PROGRESS

*(Pick a task from TODO, move it here, and add your name as Owner)*

---

## 📋 TODO

---

### TASK-020 — Mission store (state machine)
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-003
- **Owner:** —
- **Deliverables:** `src/store/mission.store.ts`
- **Description:** Zustand store for active mission execution. States: `IDLE → BRIEFING → ACTIVE → SUBMITTING → COMPLETED → FAILED`. Stores current phase, mission object, responses (partial), and error. `reset()` action clears to IDLE.
- **Done when:** All state transitions defined; `canSubmit()` selector validates per-type rules

---

### TASK-021 — Mission service
- **Priority:** P0
- **Effort:** 1.5h
- **Dependencies:** TASK-005, TASK-003, TASK-004
- **Owner:** —
- **Deliverables:** `src/services/mission.service.ts`
- **Description:** Two functions:
  1. `fetchMissionById(id)` — fetches single mission row from Supabase
  2. `completeMission(payload)` — calls `supabase.rpc('complete_mission', {...})`, handles `already_completed` response gracefully
- **Done when:** Both functions return typed `AsyncResult<T>`, handle errors without throwing

---

### TASK-022 — useMissionEngine hook
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-020, TASK-021, TASK-007
- **Owner:** —
- **Deliverables:** `src/hooks/useMissionEngine.ts`
- **Description:** Connects `mission.store` to:
  - Mission submission (calls `completeMission()` RPC)
  - `auth.store.updateProfileField()` for optimistic XP/streak update
  - Navigation to `mission/success` with result params
  - Error handling with retry state
- **Done when:** Submitting a mission updates store, calls RPC, navigates to success screen

---

### TASK-023 — ReflectWrite mission component
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-002, TASK-011, TASK-020
- **Owner:** —
- **Deliverables:** `src/components/mission-types/ReflectWrite.tsx`
- **Description:**
  - Multiline `TextInput` for the user's written response
  - Live word count display (e.g. "14 / 30 words")
  - Progress bar that fills amber → green at `min_words`
  - Submit button disabled below `min_words`
  - `onSubmit` callback receives `{ text, word_count }`
- **Done when:** Word count gates submit correctly; can submit exactly at `min_words`

---

### TASK-024 — PollReasoning mission component
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-002, TASK-011, TASK-020
- **Owner:** —
- **Deliverables:** `src/components/mission-types/PollReasoning.tsx`
- **Description:**
  - List of option rows (TouchableOpacity, single-select)
  - Selected option highlighted with amber border
  - Multiline TextInput for reasoning after option selected
  - Submit disabled until option selected AND reasoning meets `min_words`
  - `onSubmit` callback receives `{ selected_option, reasoning, word_count }`
- **Done when:** Option selection works; reasoning gate works; can submit when both conditions met

---

### TASK-025 — DailyChallenge mission component
- **Priority:** P0
- **Effort:** 1.5h
- **Dependencies:** TASK-002, TASK-011, TASK-020
- **Owner:** —
- **Deliverables:** `src/components/mission-types/DailyChallenge.tsx`
- **Description:**
  - Briefing card showing `content.briefing`
  - Task description card showing `content.task`
  - Large checkbox / toggle to mark challenge as completed
  - Optional reflection `TextInput` (shown after checkbox ticked)
  - Submit enabled as soon as checkbox is ticked (reflection not required)
  - `onSubmit` callback receives `{ completed: true, reflection: string }`
- **Done when:** Can submit with checkbox only; reflection is optional but saves correctly

---

### TASK-026 — Mission detail screen
- **Priority:** P0
- **Effort:** 2.5h
- **Dependencies:** TASK-021, TASK-022, TASK-023, TASK-024, TASK-025
- **Owner:** —
- **Deliverables:** `app/mission/[id].tsx`
- **Description:**
  - Reads `id` from route params
  - Calls `fetchMissionById(id)` on mount
  - Displays mission header: ID, title, category chip, type tag, XP badge
  - Routes to correct type component based on `mission.mission_type`
  - Passes `onSubmit` callback to type component
  - Shows loading spinner while fetching
  - Shows error state with retry if fetch fails
  - Back button navigates to `/(tabs)` (not stack pop, to avoid re-loading home)
- **Done when:** All 3 mission types render and can be submitted from this screen

---

### TASK-027 — Mission success screen
- **Priority:** P0
- **Effort:** 1.5h
- **Dependencies:** TASK-026, TASK-022, TASK-002
- **Owner:** —
- **Deliverables:** `app/mission/success.tsx`
- **Description:**
  - Receives via route params: `xp_awarded`, `new_total_xp`, `new_streak`, `new_rank`
  - Displays XP gained prominently (large mono number with `+` prefix)
  - Displays new streak count
  - Shows rank promotion message if `new_rank` differs from previous rank
  - Single CTA: "RETURN TO BASE" → `router.replace('/(tabs)')`
  - No back gesture — mission is done, can't undo
- **Done when:** Screen displays correct values from params; Return CTA navigates home

---

### TASK-028 — End-to-end core loop test
- **Priority:** P0
- **Effort:** 2h
- **Dependencies:** TASK-027
- **Owner:** —
- **Description:** Both founders manually complete the full loop:
  1. Sign up fresh account
  2. Home screen shows Day 1 mission
  3. Open mission → complete all 3 types across separate test accounts
  4. Success screen shows correct XP and streak
  5. Return to home → XP and streak updated
  6. Profile shows updated stats
  7. Sign out and sign back in → correct state persists
  8. Day 2 mission shows on Day 2 (test by adjusting `created_at` in DB)
- **Done when:** All 8 steps pass without bugs on both iOS and Android

---

### TASK-029 — Android physical device testing
- **Priority:** P1
- **Effort:** 2h
- **Dependencies:** TASK-027
- **Owner:** —
- **Description:** Test on at least 2 real Android devices. Verify:
  - Layout does not overflow or clip on common Indian Android devices (Redmi Note, Samsung Galaxy)
  - `maxFontSizeMultiplier={1}` is applied to all fixed-layout Text components
  - Keyboard avoidance works on signup and mission text inputs
  - SecureStore persists correctly across app restart
  - Streak and mission logic works in IST timezone
- **Done when:** No layout bugs on tested devices

---

### TASK-030 — Seed missions for weeks 3–4 (days 15–28)
- **Priority:** P1
- **Effort:** 3h
- **Dependencies:** TASK-018
- **Owner:** —
- **Deliverables:** `supabase/migrations/003_seed_week3_week4.sql`
- **Description:** Write 14 more missions following the same format as `002_seed_missions.sql`. Maintain category balance across all 5 pillars. Mix all 3 mission types. Content must be relevant to NDA/CDS/NCC preparation.
- **Done when:** `SELECT count(*) FROM missions WHERE week_number IN (3,4)` returns 14

---

### TASK-031 — UI polish pass
- **Priority:** P1
- **Effort:** 3h
- **Dependencies:** TASK-027
- **Owner:** —
- **Description:**
  - All loading states have spinners (no blank screens)
  - All error states have readable copy (no raw error strings)
  - Empty states have instructions (no blank space)
  - Consistent spacing across all screens
  - All Text components have `maxFontSizeMultiplier={1}` where layout-critical
  - Sign out confirmation Alert is worded correctly
  - Keyboard dismisses correctly on all forms
- **Done when:** No blank or broken states found during walkthrough of every screen

---

### TASK-032 — Create 10 beta tester accounts
- **Priority:** P1
- **Effort:** 1h
- **Dependencies:** TASK-028, Supabase project live
- **Owner:** —
- **Description:**
  - Create 10 accounts in Supabase (or have testers sign up and verify)
  - Confirm each account has `display_name` set
  - Confirm `users` table shows correct `created_at` for each tester
  - Confirm Day 1 mission loads for each account
  - Document account list (name + email) in a private note — NOT in this repo
- **Done when:** 10 accounts verified working in Supabase dashboard

---

### TASK-033 — EAS build configuration
- **Priority:** P1
- **Effort:** 2h
- **Dependencies:** TASK-028
- **Owner:** —
- **Deliverables:** `eas.json` with dev/preview/production profiles
- **Description:**
  - Run `eas build:configure`
  - Set `EAS_PROJECT_ID` in `.env`
  - Configure preview profile for internal distribution
  - iOS: link to Apple Developer account, enable push entitlement (for V2)
  - Android: configure APK output (not AAB) for direct distribution
- **Done when:** `eas build --profile preview --platform all` completes without error

---

### TASK-034 — TestFlight distribution (iOS)
- **Priority:** P1
- **Effort:** 1h
- **Dependencies:** TASK-033
- **Owner:** —
- **Description:**
  - Build IPA via EAS
  - Upload to App Store Connect
  - Add 10 tester Apple IDs to internal group
  - Send TestFlight invite links
- **Done when:** All 10 testers can install via TestFlight

---

### TASK-035 — APK direct distribution (Android)
- **Priority:** P1
- **Effort:** 1h
- **Dependencies:** TASK-033
- **Owner:** —
- **Description:**
  - Build APK via EAS (`--profile preview --platform android`)
  - Host APK at a shareable link (Google Drive / direct download)
  - Test install on a clean Android device (disable "Install from unknown sources" warning)
- **Done when:** Tester can install APK and run the app

---

### TASK-036 — Beta tester onboarding calls
- **Priority:** P1
- **Effort:** 2.5h (15 min × 10 testers)
- **Dependencies:** TASK-034, TASK-035
- **Owner:** —
- **Description:**
  - Schedule 15-minute call per tester
  - Walk each tester through: install → sign up → complete Mission 1
  - Confirm they are in the WhatsApp group for daily nudges
  - Answer any setup questions
  - Record device model for Android testers
- **Done when:** All 10 testers have completed Mission 1

---

### TASK-037 — Daily operations setup (WhatsApp + SQL query)
- **Priority:** P1
- **Effort:** 1h
- **Dependencies:** TASK-036
- **Owner:** —
- **Description:**
  - Create WhatsApp Business broadcast list with all 10 testers
  - Write all 14 daily broadcast messages in advance (mission title + 1 line copy)
  - Save the daily completion-check SQL query as a saved query in Supabase:
    ```sql
    SELECT u.display_name, mc.mission_id, mc.completed_date
    FROM mission_completions mc
    JOIN users u ON u.id = mc.user_id
    WHERE mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
    ORDER BY mc.completed_date DESC;
    ```
  - Set a phone reminder for 8am and 9pm IST for the 14-day beta period
- **Done when:** Broadcast list ready, messages written, reminder set

---

### TASK-038 — Day 7 check-in calls
- **Priority:** P1
- **Effort:** 1.5h (10 min × 10 testers)
- **Dependencies:** TASK-036
- **Owner:** —
- **Description:**
  - Schedule 10-minute voice call or voice note exchange with each tester on Day 7
  - Ask: "What did you like?", "What felt pointless?", "Did you think about XP or your streak?"
  - Record raw quotes verbatim — do not summarise yet
  - Note which testers completed ≥5 missions by Day 7
- **Done when:** Notes recorded for all available testers

---

### TASK-039 — Beta debrief and go/no-go decision memo
- **Priority:** P1
- **Effort:** 3h
- **Dependencies:** TASK-038
- **Owner:** —
- **Description:**
  - Pull SQL report: completions by user, by mission type, by day
  - Calculate D1, D7, D14 retention metrics
  - Schedule 20-minute debrief calls with testers who completed ≥5 missions
  - Write 1-page decision memo: continue / pivot / stop
  - Reference go/no-go framework from `PROJECT_CONTEXT.md` § Success Metrics
- **Done when:** Decision memo written and shared with both founders

---

## 🚧 BLOCKED

*(Move tasks here if they cannot proceed — include blocker reason)*

---

## 📦 BACKLOG

*(V2 and V3 tasks — do not start until V1 beta is complete)*

---

### TASK-040 — Push notification infrastructure (V2)
- **Priority:** P2
- **Effort:** 6h
- **Dependencies:** V1 beta complete + retention signal
- **Owner:** —
- **Description:** `expo-notifications` + Expo Push API + `push_tokens` table + `send-notifications` Edge Function + pg_cron job at 21:30 IST

---

### TASK-041 — Voice missions: Scenario type (V2)
- **Priority:** P2
- **Effort:** 8h
- **Dependencies:** TASK-029 (know tester device set), V1 complete
- **Owner:** —
- **Description:** `expo-av` Audio.Recording + permission handling + Scenario mission component with option select + 30s voice response

---

### TASK-042 — Voice missions: Rapid Fire type (V2)
- **Priority:** P2
- **Effort:** 6h
- **Dependencies:** TASK-041
- **Owner:** —
- **Description:** Per-question 15s timer + voice recording + auto-advance on timeout

---

### TASK-043 — Google OAuth (V2)
- **Priority:** P2
- **Effort:** 4h
- **Dependencies:** V1 complete
- **Owner:** —
- **Description:** Google Cloud Console setup, SHA-1 fingerprint registration, Supabase provider config, deep link callback

---

### TASK-044 — XP multipliers (V2)
- **Priority:** P2
- **Effort:** 2h
- **Dependencies:** V1 retention validated
- **Owner:** —
- **Description:** Streak multipliers (×1.1 at 7d, ×1.2 at 14d, ×1.5 at 30d) + focus area multiplier (×1.15) in `complete_mission()` RPC

---

### TASK-045 — Streak grace period (V2)
- **Priority:** P2
- **Effort:** 2h
- **Dependencies:** V1 streak validated
- **Owner:** —
- **Description:** `freeze_used_date` column on `users`, 1 freeze per 7-day rolling window, client display of "Resilience Protocol available"

---

### TASK-046 — Achievements system (V2)
- **Priority:** P2
- **Effort:** 4h
- **Dependencies:** V1 complete
- **Owner:** —
- **Description:** `achievements` + `user_achievements` tables, badge display component, unlock triggers in `complete_mission()` RPC

---

### TASK-047 — Tactical Intel tab (V2)
- **Priority:** P2
- **Effort:** 5h
- **Dependencies:** V1 complete
- **Owner:** —
- **Description:** `intel_briefings` table, 3rd tab in navigator, expandable card feed, category filter

---

### TASK-048 — React Query migration (V2)
- **Priority:** P2
- **Effort:** 4h
- **Dependencies:** V1 complete
- **Owner:** —
- **Description:** Replace direct Supabase calls + useState with React Query for caching, background refresh, stale-time control

---

### TASK-049 — PostHog analytics (V2)
- **Priority:** P2
- **Effort:** 3h
- **Dependencies:** V1 complete
- **Owner:** —
- **Description:** `posthog-react-native`, 15-event catalogue from architecture doc, ACMAU funnel dashboard

---

### TASK-050 — Full 7-rank ladder (V2)
- **Priority:** P3
- **Effort:** 2h
- **Dependencies:** V1 rank validated
- **Owner:** —
- **Description:** Expand 3 ranks to 7 (Recruit → Cadet → Junior Cadet → Senior Cadet → Elite Vanguard → Commander → Officer), dedicated rank progression screen

---

### TASK-051 — Automated test suite (V2)
- **Priority:** P2
- **Effort:** 8h
- **Dependencies:** V1 complete
- **Owner:** —
- **Description:** Jest + React Native Testing Library, unit tests for date utilities and store logic, integration tests for auth flow

---

### TASK-052 — App Store submission (V2)
- **Priority:** P2
- **Effort:** 4h
- **Dependencies:** V2 features stable
- **Owner:** —
- **Description:** App Store Connect listing, screenshots, privacy policy, review submission

---

### TASK-053 — Squad / group missions (V3)
- **Priority:** P3
- **Effort:** 16h+
- **Dependencies:** V2 complete, 100+ users
- **Owner:** —
- **Description:** Realtime group state, shared mission progress, squad leaderboard

---

### TASK-054 — Premium subscription tier (V3)
- **Priority:** P3
- **Effort:** 12h+
- **Dependencies:** V2 complete, retention proven
- **Owner:** —
- **Description:** RevenueCat integration, paywall screen, feature gating, subscription management

---

### TASK-055 — Admin content panel (V3)
- **Priority:** P3
- **Effort:** 8h+
- **Dependencies:** V2 complete
- **Owner:** —
- **Description:** Web-based mission editor, replaces SQL seeding, WYSIWYG content for each mission type
