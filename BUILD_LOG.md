# THE FORGE — Build Log
### Living document · Update after every session · Newest entries at top

---

## Current Status

| Field | Value |
|---|---|
| **Phase** | Day 1 complete / Day 2 in progress |
| **Build state** | App boots, auth works end-to-end, home and profile screens load |
| **Blocking issues** | None currently |
| **Next milestone** | Mission execution engine (Day 2) |
| **Last working build** | Local dev — `npx expo start` |
| **Deployment** | Not deployed. TestFlight/APK pending mission engine completion |
| **Beta testers** | 0 onboarded (awaiting complete core loop) |
| **Target beta date** | Day 14 of build sprint |

---

## Module Completion Status

| Module | Status | Files | Notes |
|---|---|---|---|
| Project config | ✅ Complete | `package.json`, `app.config.ts`, `tsconfig.json`, `babel.config.js`, `.env.example` | Pinned versions, path aliases, reanimated plugin |
| Design tokens | ✅ Complete | `src/constants/tokens.ts` | Colors, Fonts, Spacing, Radius, RankColors |
| Types | ✅ Complete | `src/types/index.ts`, `src/types/database.ts` | All domain types, Supabase stubs |
| Date utilities | ✅ Complete | `src/utils/date.ts` | `todayIST()`, `daysBetween()`, `currentWeekNumber()`, `currentDayOfWeek()` |
| Supabase client | ✅ Complete | `src/services/supabase.ts` | SecureStoreAdapter, `detectSessionInUrl: false` |
| Auth service | ✅ Complete | `src/services/auth.service.ts` | `signUp`, `signIn`, `signOut` (403 guard), `fetchProfile`, `sendPasswordReset` |
| Auth store | ✅ Complete | `src/store/auth.store.ts` | `INITIAL_STATE` vs `LOGGED_OUT_STATE` separation, all selectors |
| Auth initializer | ✅ Complete | `src/hooks/useAuthInitializer.ts` | Boot session check + `onAuthStateChange` + double-clearAuth guard |
| useAuth hook | ✅ Complete | `src/hooks/useAuth.ts` | `logout()` calls `clearAuth()` before `signOut()` |
| Form validation | ✅ Complete | `src/hooks/useFormValidation.ts` | Generic hook + `loginValidator`, `signupValidator`, `forgotPasswordValidator` |
| Shared UI | ✅ Complete | `src/components/ui/index.tsx` | `TacticalInput`, `TacticalButton`, `ErrorBanner`, `ScreenMeta`, `Divider`, `TextLink` |
| Root layout | ✅ Complete | `app/_layout.tsx` | Fonts, polyfill, `AuthGate` (profile removed from deps) |
| Auth screens | ✅ Complete | `login.tsx`, `signup.tsx`, `forgot-password.tsx`, `check-email.tsx` | Full auth flow working |
| Tab navigator | ✅ Complete | `app/(tabs)/_layout.tsx` | 2 tabs: HOME + DOSSIER |
| Dashboard | ✅ Complete | `app/(tabs)/index.tsx` | Mission card, XP, streak, deterministic mission selection |
| Profile screen | ✅ Complete | `app/(tabs)/profile.tsx` | Stats, rank bar, feedback, sign out — `require()` bug fixed |
| Database schema | ✅ Complete | `supabase/migrations/001_initial_schema.sql` | 4 tables, RLS, trigger, `complete_mission()` RPC |
| Mission seed data | ✅ Complete | `supabase/migrations/002_seed_missions.sql` | 14 missions, days 1–14, 3 types, 5 categories |
| Mission service | ⬜ Not started | `src/services/mission.service.ts` | Fetch + RPC call |
| Mission store | ⬜ Not started | `src/store/mission.store.ts` | State machine: IDLE→ACTIVE→SUBMITTING→DONE |
| Mission engine hook | ⬜ Not started | `src/hooks/useMissionEngine.ts` | Timer, submit, RPC, navigation |
| ReflectWrite component | ⬜ Not started | `src/components/mission-types/ReflectWrite.tsx` | Text area + word count gate |
| PollReasoning component | ⬜ Not started | `src/components/mission-types/PollReasoning.tsx` | Option selector + reasoning |
| DailyChallenge component | ⬜ Not started | `src/components/mission-types/DailyChallenge.tsx` | Checkbox + optional reflection |
| Mission detail screen | ⬜ Not started | `app/mission/[id].tsx` | Fetches mission, delegates to type component |
| Mission success screen | ⬜ Not started | `app/mission/success.tsx` | XP awarded, streak, Return CTA |

---

## Bug History

### BUG-001 — Logout not working (RESOLVED)
- **Reported:** Day 1 implementation review
- **Severity:** Critical — users could not sign out
- **Root cause (5 bugs):**
  1. `useAuth.logout()` called `signOut()` but never called `clearAuth()` — relied entirely on async `onAuthStateChange` listener which lost a race condition on slow networks
  2. `clearAuth()` spread `INITIAL_STATE` which has `isLoading: true` — post-logout state briefly showed spinner instead of redirecting
  3. `profile.tsx` used `require()` inside component body to access `useAuthStore` — violates React's Rules of Hooks, could return stale `user_id` for feedback inserts
  4. `AuthGate` included `profile` in its `useEffect` dependency array — caused double-fire on logout (profile and session both become null), producing navigation stack corruption on Android
  5. `onAuthStateChange(SIGNED_OUT)` handler called `clearAuth()` even after it had already been called by `useAuth.logout()` — duplicate Zustand notification caused AuthGate to re-run and flash login screen
- **Files changed:** `useAuth.ts`, `auth.store.ts`, `_layout.tsx`, `profile.tsx`, `useAuthInitializer.ts`, `auth.service.ts`
- **Fix summary:**
  - `clearAuth()` called synchronously at start of `logout()`, before any await
  - `LOGGED_OUT_STATE` constant introduced separate from `INITIAL_STATE`
  - `profile` removed from `AuthGate` dep array — gate only checks `session`
  - `require()` replaced with proper top-level `useAuthStore` hook call
  - `SIGNED_OUT` handler guards with `getState().session !== null` before calling `clearAuth()`
  - `signOut()` handles 403 gracefully (already-expired session = success)
- **Verified:** Logic reviewed and confirmed correct across all platforms

---

## Day-by-Day Progress

### Day 1 — Foundation
**Date:** Project initialization

**Completed:**
- Full project scaffold: `package.json`, configs, tsconfig, babel, `.env.example`, `.gitignore`
- Design token system (`src/constants/tokens.ts`)
- Complete TypeScript type system (`src/types/index.ts`, `src/types/database.ts`)
- IST date utilities (`src/utils/date.ts`)
- Supabase client singleton with SecureStore adapter
- Auth service (all 5 functions)
- Zustand auth store with `INITIAL_STATE` / `LOGGED_OUT_STATE` separation
- `useAuthInitializer` hook (boot + lifetime listener)
- `useAuth` hook (all auth actions)
- `useFormValidation` hook + all validators
- Shared UI primitives: `TacticalInput`, `TacticalButton`, `ErrorBanner`, `ScreenMeta`, `Divider`, `TextLink`
- Root `_layout.tsx` with `AuthGate`
- Auth stack: login, signup, forgot-password, check-email
- Tab navigator (2 tabs)
- Dashboard screen with deterministic mission card
- Profile screen with stats, feedback, sign out
- Supabase migrations: 4-table schema + 14-mission seed
- `DAY1_SETUP.md` — complete setup guide

**Bugs found and fixed same day:**
- BUG-001: Logout flow (5 bugs, all resolved)

**Day 1 file count:** 29 files

---

### Day 2 — Mission Engine
**Status:** IN PROGRESS

**Target deliverables:**
- `src/store/mission.store.ts` — state machine
- `src/services/mission.service.ts` — fetch + RPC
- `src/hooks/useMissionEngine.ts` — execution hook
- `src/components/mission-types/ReflectWrite.tsx`
- `src/components/mission-types/PollReasoning.tsx`
- `src/components/mission-types/DailyChallenge.tsx`
- `app/mission/[id].tsx` — detail router
- `app/mission/success.tsx` — completion screen

**Target outcome:** Full core loop working end-to-end (home → mission → complete → success → home with updated XP and streak)

---

## Testing Status

| Test | Status | Notes |
|---|---|---|
| App boots without crash | ✅ Pass | Verified |
| Sign up creates account | ✅ Pass | Verified in Supabase Auth → Users |
| Login with valid credentials | ✅ Pass | |
| Login with invalid credentials | ✅ Pass | Error message shown correctly |
| Session persists across app restart | ✅ Pass | SecureStore working |
| Sign out clears session | ✅ Pass | BUG-001 fixed |
| Sign out redirects to login | ✅ Pass | BUG-001 fixed |
| Back button after logout | ✅ Pass | `router.replace` prevents back to protected screens |
| Home screen loads mission | ✅ Pass | Deterministic selection working |
| Profile screen loads stats | ✅ Pass | XP, streak, rank displaying |
| Feedback submit | ✅ Pass | Inserts to `feedback` table |
| Forgot password email | ⬜ Not tested | Needs real email to test |
| Mission completion | ⬜ Not built | Day 2 |
| XP update after completion | ⬜ Not built | Day 2 |
| Streak update after completion | ⬜ Not built | Day 2 |
| Rank update after completion | ⬜ Not built | Day 2 |
| Android layout — multiple devices | ⬜ Not tested | Test on physical device Day 3 |
| iOS Simulator | ✅ Pass | Basic layout verified |

---

## Deployment Status

| Target | Status | Notes |
|---|---|---|
| Local dev (`npx expo start`) | ✅ Running | |
| iOS Simulator | ✅ Working | |
| Android Emulator | ⬜ Not verified | Test Day 2 |
| Physical Android device | ⬜ Not tested | Test Day 3 |
| Physical iOS device | ⬜ Not tested | Requires Apple Developer account |
| TestFlight | ⬜ Not built | Build after mission engine complete |
| APK direct link | ⬜ Not built | Build after mission engine complete |
| App Store | ⬜ Not planned | Post-beta only |

---

## Supabase Status

| Item | Status | Notes |
|---|---|---|
| Project created | ⬜ Required | Agent must set up — see `DAY1_SETUP.md` |
| Region | ⬜ Required | ap-south-1 (Mumbai) — lowest latency for IN users |
| `001_initial_schema.sql` run | ⬜ Required | Run in SQL Editor |
| `002_seed_missions.sql` run | ⬜ Required | Run after schema |
| Email confirmation disabled | ⬜ Required | Auth → Settings → Confirm email: OFF |
| Site URL set to `theforge://` | ⬜ Required | Auth → URL Configuration |
| `.env` populated | ⬜ Required | Copy from `.env.example` |

> **Note:** If you are a new agent starting development, the Supabase project may or may not exist. Check with the project owner before running migrations again.

---

## Next Milestones

| Milestone | Target Day | Status |
|---|---|---|
| Core loop complete (mission execution) | Day 2 | In progress |
| Android device testing | Day 3 | Pending |
| End-to-end test by both founders | Day 4 | Pending |
| Mission seed expanded to 21 days | Day 5 | Pending |
| UI polish pass | Day 6 | Pending |
| 10 tester accounts created | Day 7 | Pending |
| EAS build (TestFlight + APK) | Day 8 | Pending |
| Tester onboarding calls | Day 9 | Pending |
| Beta live with 5–10 cadets | Day 10 | Pending |
| Day 7 check-in calls | Day 17 | Pending |
| Beta debrief + go/no-go decision | Day 24 | Pending |
