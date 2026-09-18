# THE FORGE — Project Context
### Permanent Source of Truth · All Agents Read This First

> **If you are a new Claude session joining this project: read this entire file before touching any code. Every decision, constraint, and convention in this project flows from this document.**

---

## 1. Product Vision

The Forge is a daily-habit mobile app that helps NDA, CDS, and NCC aspirants develop Officer-Like Qualities through short, structured daily missions. The product transforms passive preparation into consistent action.

**Core product loop:**
```
Open app → Complete daily mission → Gain XP → Maintain streak → Increase rank → Return tomorrow
```

**Product personality:** Disciplined. Modern. Elite. Military-inspired. It should feel like a training protocol, not a quiz app or motivational poster.

---

## 2. Target Users

| User Type | Description |
|---|---|
| NDA Aspirants | Students aged 16–22 preparing for National Defence Academy entrance |
| CDS Aspirants | Graduates preparing for Combined Defence Services exam |
| NCC Cadets | Active NCC cadets developing leadership and awareness skills |
| General | Defence-oriented students not targeting a specific examination |

**Current beta cohort:** 5–10 NCC cadets (known contacts, manually onboarded).

---

## 3. Problem Statement

Most defence aspirants:
- Know what they *should* do
- Understand SSB concepts theoretically
- Consume motivational content passively

But struggle with:
- Consistency and daily discipline
- Communication under pressure
- Real-world decision-making
- Self-confidence in group settings
- Applying knowledge to action

Preparation remains passive. The Forge makes it active.

---

## 4. MVP Definition

### What the MVP proves
1. Do users complete daily missions?
2. Do they return the next day?
3. Does the experience feel worth their time?

### MVP scope (FROZEN — do not expand without explicit approval)
- Email authentication (no Google, no phone OTP)
- Dashboard showing today's mission + XP + streak
- 3 mission types: Reflect & Write, Poll + Reasoning, Daily Challenge
- Flat XP system (no multipliers in V1)
- Simple 3-rank system: Cadet → Officer → Commander
- Streak counter (no grace period, no freeze in V1)
- Profile screen with stats and feedback input
- 14 missions seeded for beta (days 1–14)

### Explicitly NOT in MVP
- Voice/audio missions
- Google OAuth
- Push notifications
- Achievements / badges
- Tactical Intel tab
- Mission library / browsing
- Leaderboards
- XP multipliers
- Streak grace period
- PostHog analytics
- Cron jobs
- Any AI features

---

## 5. Business Model

**Current phase:** Pre-revenue. Beta validation only.

**V1 (now):** Free. 5–10 testers. Manual onboarding.

**V2 hypothesis:** Freemium model.
- Free tier: 1 mission/day, basic tracking
- Pro tier (₹199–₹299/month): Full mission library, voice missions, advanced analytics

**V3 hypothesis:** Institutional licensing to coaching centres and NCC units.

---

## 6. Tech Stack

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Mobile | React Native | 0.76.5 | Cross-platform, single codebase |
| Framework | Expo | SDK 52 | OTA updates without App Store review |
| Navigation | Expo Router | v4 | File-based routing, typed routes |
| Language | TypeScript | ~5.3 | Strict mode, prevents runtime bugs |
| Backend | Supabase | Latest | Auth + Postgres + API in one, free tier adequate for beta |
| Database | PostgreSQL | 15+ | Via Supabase |
| State | Zustand | v5 | Lightweight, no boilerplate, selector pattern |
| Storage | expo-secure-store | ~14 | JWT persistence, Keychain/EncryptedSharedPreferences |
| Styling | React Native StyleSheet | — | No third-party styling library |

**Not in use (and why):**
- React Query: Unnecessary complexity for 5–10 users. Add in V2.
- Redux: Overkill for this state model.
- NativeWind/Tailwind: Adds compilation complexity with no benefit for this design system.
- Lottie: Animations deferred to V2 post-validation.

---

## 7. Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL        Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY   Supabase anon/public key (safe for client)
EAS_PROJECT_ID                  EAS project ID (build-time only)
```

All client-side vars use `EXPO_PUBLIC_` prefix. Never commit `.env`. Template is in `.env.example`.

---

## 8. Folder Structure

```
the-forge/
├── app/                          ← Expo Router routes (file = URL)
│   ├── _layout.tsx               ← Root: fonts, polyfill, AuthGate, StatusBar
│   ├── (auth)/                   ← Stack group: shown when no session
│   │   ├── _layout.tsx           ← Auth stack navigator config
│   │   ├── login.tsx             ← Email + password sign-in
│   │   ├── signup.tsx            ← Email + password + display name
│   │   ├── forgot-password.tsx   ← Reset request
│   │   └── check-email.tsx       ← Post-reset confirmation
│   ├── (tabs)/                   ← Tab group: shown when session exists
│   │   ├── _layout.tsx           ← 2-tab navigator (HOME, DOSSIER)
│   │   ├── index.tsx             ← Dashboard: mission card + XP + streak
│   │   └── profile.tsx           ← Officer Dossier: stats + feedback + sign out
│   └── mission/                  ← Modal stack over tabs
│       ├── [id].tsx              ← Mission detail router (delegates to type component)
│       └── success.tsx           ← Post-completion: XP + streak + CTA
│
├── src/
│   ├── constants/
│   │   └── tokens.ts             ← Design tokens: Colors, Fonts, Spacing, Radius
│   ├── types/
│   │   ├── index.ts              ← All domain types: DbUser, DbMission, MissionContent, etc.
│   │   └── database.ts           ← Supabase Database type stubs
│   ├── utils/
│   │   └── date.ts               ← IST date helpers: todayIST(), daysBetween(), etc.
│   ├── services/
│   │   ├── supabase.ts           ← Supabase client singleton
│   │   ├── auth.service.ts       ← All Supabase Auth calls
│   │   └── mission.service.ts    ← Mission fetch + complete_mission() RPC call
│   ├── store/
│   │   ├── auth.store.ts         ← Zustand: session, user, profile
│   │   └── mission.store.ts      ← Zustand: active mission state machine
│   ├── hooks/
│   │   ├── useAuthInitializer.ts ← Boot hook: getSession + onAuthStateChange
│   │   ├── useAuth.ts            ← Auth actions: login, register, logout, forgotPassword
│   │   ├── useFormValidation.ts  ← Generic validation + per-form validators
│   │   └── useMissionEngine.ts   ← Mission execution: timer, submission, RPC call
│   └── components/
│       ├── ui/
│       │   └── index.tsx         ← TacticalInput, TacticalButton, ErrorBanner, ScreenMeta
│       └── mission-types/
│           ├── ReflectWrite.tsx  ← Text area + live word count gate
│           ├── PollReasoning.tsx ← Option selector + reasoning text area
│           └── DailyChallenge.tsx← Checkbox complete + optional reflection
│
├── assets/
│   ├── fonts/                    ← Geist (×2), Inter (×2), JetBrains Mono (×2)
│   ├── icon.png                  ← 1024×1024
│   ├── splash.png                ← 2048×2048
│   └── adaptive-icon.png         ← Android adaptive icon
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql← 4 tables, RLS, trigger, complete_mission() RPC
│       └── 002_seed_missions.sql ← 14 missions for days 1–14
│
├── package.json
├── app.config.ts
├── tsconfig.json
├── babel.config.js
├── .env.example
├── .gitignore
└── DAY1_SETUP.md
```

---

## 9. Database Schema Summary

**4 tables only. Simple by design.**

### `public.users`
Extends `auth.users` via FK. Contains XP, rank, streak inline.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | FK → auth.users |
| display_name | text | Set on signup |
| target | text | NDA/CDS/NCC/GENERAL |
| total_xp | integer | Denormalised, updated by RPC |
| current_rank | text | Cadet/Officer/Commander |
| current_streak | integer | Updated by RPC |
| last_active_date | date | IST, used for streak calc |
| created_at | timestamptz | Used to determine week_number |

### `public.missions`
Content catalogue. Seeded via SQL. No admin UI in V1.

| Column | Type | Notes |
|---|---|---|
| id | text PK | e.g. "COM-001" |
| title | text | |
| category | text | Communication/Confidence/Leadership/Awareness/Officer Thinking |
| mission_type | text | Reflect & Write/Poll + Reasoning/Daily Challenge |
| week_number | smallint | Content treadmill |
| unlock_day | smallint | 1–7 within week |
| xp_reward | smallint | 40–50 |
| content | jsonb | Type-specific payload |

### `public.mission_completions`
Append-only. `UNIQUE(user_id, completed_date)` = one mission per day.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | → users |
| mission_id | text FK | → missions |
| completed_date | date | IST calendar date |
| xp_awarded | smallint | |
| responses | jsonb | Raw user answers |

### `public.feedback`
Simple message store for beta tester input.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | FK → users, nullable |
| message | text | |
| created_at | timestamptz | |

### Key database rules
- **`complete_mission()` is a Postgres RPC** — not an Edge Function. It runs both writes (INSERT completion + UPDATE user) atomically in one transaction.
- **All dates are IST (UTC+5:30).** Use `(now() AT TIME ZONE 'Asia/Kolkata')::date` in SQL. Use `todayIST()` from `src/utils/date.ts` in TypeScript.
- **No cron jobs in V1.** Mission selection is deterministic client-side from `user.created_at`.
- **No Edge Functions in V1.** The Postgres RPC replaces the complete-mission Edge Function.
- **RLS is enabled on all tables.** Users can only read/write their own rows.

---

## 10. UI/UX Principles

1. **Tactical Minimalism** — Dark background, amber accents, mono typography for metadata. No gradients, no decorative elements.
2. **Density is discipline** — Information is concise. No filler text. No padding copy.
3. **Actions are clear** — Every screen has exactly one primary action. No ambiguous CTAs.
4. **System font fallback** — If custom fonts fail to load, the app must still render correctly.
5. **maxFontSizeMultiplier={1}** on all `Text` components with fixed layout roles to prevent Android system font scaling from breaking layout.
6. **No empty states without instruction** — If data is missing, tell the user what to do.

---

## 11. Design System

All visual values live in `src/constants/tokens.ts`. Never hardcode hex values or pixel values in component files.

### Key colours
| Token | Value | Usage |
|---|---|---|
| `Colors.bgBase` | `#101415` | Root background, StatusBar |
| `Colors.primary` | `#FFBF00` | Amber — CTA buttons, mission accent, XP |
| `Colors.onPrimary` | `#402D00` | Text on amber buttons |
| `Colors.textPrimary` | `#E0E3E5` | Main text |
| `Colors.textSecondary` | `#B4B2A9` | Body text, descriptions |
| `Colors.textTertiary` | `#888780` | Labels, metadata, mono IDs |
| `Colors.success` | `#4ADE80` | Completion, streak active |
| `Colors.error` | `#FF8A80` | Errors, destructive actions |

### Typography
| Token | Font | Usage |
|---|---|---|
| `Fonts.display` | Geist-Bold | Screen headlines (THE FORGE wordmark) |
| `Fonts.heading` | Geist-SemiBold | Section titles, mission titles |
| `Fonts.body` | Inter-Regular | Body text, descriptions |
| `Fonts.bodyMedium` | Inter-Medium | Emphasized body text |
| `Fonts.mono` | JetBrainsMono-Regular | IDs, metadata, labels, codes |
| `Fonts.monoMedium` | JetBrainsMono-Medium | Button labels, key data |

### Spacing scale
`xs=4, sm=8, md=16, lg=24, xl=32, xxl=48, gutter=20`

### Border radius
`xs=2, sm=4, md=8, lg=12, xl=16, full=9999`

---

## 12. Architecture Rules

These are non-negotiable constraints. Every agent must follow them.

### Auth
1. **`useAuth` is the only hook auth screens import.** Components never call `auth.service.ts` directly.
2. **`useAuthInitializer` runs exactly once** in `app/_layout.tsx`. Never call it anywhere else.
3. **`clearAuth()` must be called before `supabase.auth.signOut()` in `logout()`** — not after. Waiting for the async call creates a race condition with `AuthGate`.
4. **`AuthGate` dependency array must NOT include `profile`.** Profile loading is async post-session. Including it causes double-fire on logout.

### State management
5. **Zustand stores are written to by hooks only.** Components read via selectors, never by subscribing to the full store.
6. **`INITIAL_STATE` (isLoading: true) is only for store creation.** `clearAuth()` uses `LOGGED_OUT_STATE` (isLoading: false, isInitialized: true) — these are different objects and must stay separate.
7. **Never use `require()` inside a component body to access a hook.** This violates React's Rules of Hooks.

### Database / Supabase
8. **All dates stored and compared as IST.** Import `todayIST()` from `src/utils/date.ts`. Never call `new Date()` directly in product code.
9. **`complete_mission()` is the only write path for XP + streak + rank.** Never update these fields directly from a component.
10. **RLS policies protect all tables.** The anon key is safe to use in the client. Never use the service_role key in app code.

### Code style
11. **TypeScript strict mode.** No `any` unless in a commented exception with a reason.
12. **All service functions return `AsyncResult<T>`** — they never throw. Error messages are normalised to user-readable strings in `auth.service.ts` and `mission.service.ts`.
13. **`react-native-url-polyfill/auto` must be the first import in `app/_layout.tsx`.** Moving it breaks Supabase on Android.
14. **`react-native-reanimated/plugin` must be the last Babel plugin.** Moving it breaks reanimated.

### Navigation
15. **`app/(auth)/` and `app/(tabs)/` folder names require parentheses.** These are Expo Router route groups, not optional decoration.
16. **`router.replace()` is used for auth redirects**, not `router.push()`. This prevents the back button from returning to a protected screen after logout.

---

## 13. Coding Standards

### File naming
- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Services: `camelCase.service.ts`
- Stores: `camelCase.store.ts`
- Utilities: `camelCase.ts`
- Constants: `camelCase.ts`

### Component structure order
1. Imports (external → internal → types)
2. Types / interfaces local to this file
3. Helper functions (pure, no hooks)
4. Main component (exported default)
5. StyleSheet at bottom

### Commenting standards
- Every file starts with a purpose comment block
- Architecture-level decisions are explained inline, not in separate docs
- Bug fixes include: what was broken, why, what changed

### No-fly zones
- No inline styles (use `StyleSheet.create`)
- No hardcoded colours or spacing values
- No `console.log` in production code (use `__DEV__` guard for debug logs)
- No barrel exports from `src/` root (import from specific paths)

---

## 14. Mission Assignment Logic (No Cron)

Mission selection is deterministic and runs client-side on home screen mount:

```
week_number  = floor(daysSince(user.created_at) / 7) + 1
day_of_week  = (daysSince(user.created_at) % 7) + 1   // 1–7

today_mission = missions.find(
  m => m.week_number === week_number && m.unlock_day === day_of_week
)
```

**Fallback:** If no mission found for the current week/day (content gap), show the most recent uncompleted mission from any prior day. Log a Sentry error when this fires.

---

## 15. Complete Mission Flow

```
User taps "Commence Mission"
  → mission/[id].tsx fetches mission from Supabase
  → Delegates to type-specific component (ReflectWrite / PollReasoning / DailyChallenge)
  → User completes mission
  → useMissionEngine calls supabase.rpc('complete_mission', { p_user_id, p_mission_id, p_responses, p_xp })
  → RPC atomically: INSERT mission_completions + UPDATE users (XP + streak + rank)
  → Returns { xp_awarded, new_total_xp, new_streak, new_rank }
  → Navigate to mission/success.tsx with params
  → Success screen shows XP gained + streak + Return to Home CTA
  → AuthStore profile is refreshed via updateProfileField() for immediate UI update
```

**UNIQUE(user_id, completed_date) constraint** catches duplicate submissions and returns `already_completed: true` — not an error.

---

## 16. Development Workflow

### Git conventions
- Branch naming: `feature/mission-engine`, `fix/logout-bug`, `chore/seed-missions`
- Commit format: `type(scope): description` — e.g. `fix(auth): call clearAuth before signOut`
- No direct commits to `main`. Use PRs even for solo work.

### Before writing any code
1. Read `PROJECT_CONTEXT.md` (this file)
2. Read `BUILD_LOG.md` (current status)
3. Read `TASK_BOARD.md` (pick an active task)
4. Read `DECISIONS.md` (understand why things are the way they are)

### After completing a task
1. Update `BUILD_LOG.md` with what was done
2. Move task in `TASK_BOARD.md`
3. Add any new decisions to `DECISIONS.md`
4. Update `PROJECT_CONTEXT.md` if architecture changed

### Testing approach (MVP)
- Manual testing on 2 devices minimum: iOS Simulator + physical Android
- Test auth flows after every change to auth files
- Test logout specifically: session cleared, redirect works, no stale state on re-login
- No automated tests in V1 (add in V2)

---

## 17. Future Roadmap

### V2 (After retention validation — trigger: D14 retention ≥ 40%)
- Push notifications (streak-at-risk reminders)
- Voice missions (Scenario + Rapid Fire) — expo-av
- Google OAuth
- XP multipliers (streak × focus area)
- Streak grace period / freeze mechanic
- Achievements system
- Tactical Intel tab (current affairs feed)
- React Query for server state caching
- PostHog analytics (ACMAU tracking)
- Expanded rank ladder (7 ranks)

### V3 (Post product-market fit)
- Squad / group missions
- Leaderboards
- Premium subscription tier
- AI-generated personalised missions
- Admin panel for content seeding
- Web version

---

## 18. Success Metrics (Beta)

| Metric | Measurement | Target |
|---|---|---|
| D1 Completion | Completed Mission 1 within 24h of install | ≥ 80% (8/10) |
| D7 Retention | Completed any mission on Day 7 | ≥ 50% (5/10) |
| D14 Retention | Completed any mission on Day 14 | ≥ 40% (4/10) |
| Daily completion rate | total completions / (14 × 10) | ≥ 40% |
| Organic signal | Tester mentions XP/streak unprompted | Any 3 testers |

---

## 19. Known Constraints

- **Fonts must be present in `assets/fonts/` before first run.** The app crashes on launch if any of the 6 font files are missing. Shortcut: use system fonts during development.
- **Supabase email confirmation must be OFF for beta.** Testers sign up and log in immediately. Toggle: Dashboard → Auth → Settings → Confirm email: OFF.
- **IST date handling is critical.** A single `new Date()` call outside `todayIST()` in streak or mission logic will break the feature for all users simultaneously at midnight IST. There are no exceptions to rule #8 in Architecture Rules.
- **`react-native-url-polyfill` must be first.** If it loads after Supabase, Android throws `URL is not defined` on every API call.

---

*Last updated: Project initialization. Update this file whenever architecture, scope, or conventions change.*
