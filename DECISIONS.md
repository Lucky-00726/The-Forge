# THE FORGE — Decision Log
### All major technical and product decisions · Newest entries at bottom

> **Purpose:** Every significant decision made during the design and build of The Forge is recorded here. When a new agent joins the project, this file explains *why* things are the way they are — preventing well-intentioned agents from re-litigating settled decisions or introducing changes that violate established constraints.

---

## Decision Format

Each entry contains:
- **Decision:** What was decided
- **Reason:** Why this was the right choice at the time
- **Alternatives considered:** What else was evaluated
- **Tradeoffs:** What was given up or accepted
- **Date:** When the decision was made

---

---

## PRODUCT DECISIONS

---

### DEC-001 — Target NDA/CDS/NCC aspirants as primary users

**Decision:** The product is specifically designed for Indian defence aspirants, not generic productivity or habit-app users.

**Reason:** Defence aspirants have a clear, high-stakes goal (selection board / NDA entrance), a well-defined set of qualities they must develop (Officer-Like Qualities), and a culture of discipline that makes daily habits psychologically resonant. The SSB selection process evaluates communication, confidence, leadership, awareness, and decision-making — five pillars that map directly to mission categories. This specificity creates a product that feels built *for them*, not adapted for them.

**Alternatives considered:**
- Generic productivity / habit tracker: Crowded market, no differentiation, no cultural resonance
- Broader "competitive exam" audience: Too diffuse, no unified identity or aspiration
- Corporate leadership training: Wrong demographic, wrong price point for MVP validation

**Tradeoffs:**
- Smaller total addressable market in the short term
- Mission content must be domain-specific (cannot reuse generic prompts)
- Requires domain knowledge from founders to write compelling missions

**Date:** Project Initialization

---

### DEC-002 — Mission-based product architecture (not course-based or quiz-based)

**Decision:** The core product unit is a **daily mission** — a short, actionable task that requires the user to do something, not just learn something. The product is not a course, not a quiz app, and not a content feed.

**Reason:** The problem we are solving is passive preparation. Reading and watching are not the gap — *doing* is the gap. A mission forces action. It can be completed in 5–10 minutes. It produces a response that the user can reflect on. The mission format also maps naturally to military training protocols, which reinforces the brand identity.

**Alternatives considered:**
- Video course platform: Passive consumption, does not address the "doing" gap
- Quiz / MCQ format: Existing competitors (Testbook, etc.) own this space; no differentiation
- Forum / community: Social dynamics too complex for MVP; requires critical mass to work
- Flashcard system: Rote knowledge, not officer-quality development

**Tradeoffs:**
- Mission content requires significant authoring effort (can't be auto-generated in V1)
- Completion rates are harder to achieve than passive content consumption
- Requires more complex UI than a quiz (3 different mission type components)

**Date:** Project Initialization

---

### DEC-003 — 3 mission types in MVP (Reflect & Write, Poll + Reasoning, Daily Challenge)

**Decision:** V1 supports exactly 3 mission types. Voice missions (Scenario, Rapid Fire) are deferred to V2.

**Reason:** Voice recording via `expo-av` on Android is the single highest-risk feature in the codebase. Audio recording behaviour fragments dramatically across Samsung One UI, Xiaomi MIUI, and stock Android (permission flows, AudioMode settings, 0-byte recording edge cases). The learning we get from text-based missions is identical — "does the user engage with the scenario and respond thoughtfully?" Voice is an enhancement, not a prerequisite for validation.

**Alternatives considered:**
- Build all 5 types for V1: Too much build time; voice risk could delay entire launch
- Text-only Scenario (option select + written justification): Valid fallback — this is actually the V1 approach for scenario-style questions, implemented via Poll + Reasoning type
- Skip voice entirely even in V2: Voice is a genuine differentiator worth building once devices are known

**Tradeoffs:**
- Scenario-type missions require adaptation to Poll + Reasoning format (option select + text)
- Some mission content from the original database cannot be used as-is
- Users won't experience the full vision until V2

**Date:** MVP Reduction Review

---

### DEC-004 — Flat XP system in V1 (no multipliers)

**Decision:** V1 awards flat XP per mission type (40–50 XP). No streak multipliers, no focus area bonuses, no perfect-week bonuses.

**Reason:** We don't know whether XP motivates users at all before building the multiplier system. Multipliers are tuning knobs for a mechanism that must first be proven to work. Building streak multipliers before confirming streak engagement is premature optimisation. "Does the XP number going up feel rewarding?" is a question that can only be answered with the simplest possible implementation.

**Alternatives considered:**
- Full multiplier system from day one: Adds significant complexity (streak tracking across server + client, multiplier calculation in RPC, display logic) before proving core value
- No XP at all: Removes a key engagement signal we need to measure

**Tradeoffs:**
- Users who engage heavily won't feel their effort reflected until V2
- Some of the most interesting game-design decisions are deferred

**Date:** MVP Reduction Review

---

### DEC-005 — 3-rank system in V1 (Cadet → Officer → Commander)

**Decision:** V1 has exactly 3 ranks. The full 7-rank system (Recruit through Officer) is V2.

**Reason:** Three ranks is the minimum viable progression system. It gives new users a first milestone at ~8 missions (Officer at 400 XP) and a committed-user signal at ~24 missions (Commander at 1200 XP). More ranks require more UI, more colour definitions, more copy, and more XP calibration — none of which is needed before proving the mechanic works.

**Alternatives considered:**
- 7 ranks immediately: Correct long-term design but premature for MVP
- 2 ranks or 1 rank: Too little feedback on progress; users can't see themselves advancing

**Tradeoffs:**
- Users who reach Commander quickly (high engagement) will have no further rank progress until V2

**Date:** MVP Reduction Review

---

### DEC-006 — No grace period / freeze for streaks in V1

**Decision:** A broken streak resets to 0 with no recovery mechanism. No Resilience Protocol in V1.

**Reason:** Streak protection mechanics only have value when users are emotionally invested in their streak. We don't know if our users care about their streak yet. A freeze mechanic on a streak nobody cares about is invisible. The decision rule: observe whether testers mention their streak without being prompted — that's the signal to add protection.

**Alternatives considered:**
- 1 grace day per week from launch: Correct V2 design but adds complexity before validation
- Unlimited grace: Defeats the purpose of the streak

**Tradeoffs:**
- Some users will break streaks unfairly (timezone confusion, illness)
- May lose users who would have been retained by a grace mechanic — but this group is small before the streak is proven motivating

**Date:** MVP Reduction Review

---

### DEC-007 — No cron jobs in V1 (deterministic client-side mission selection)

**Decision:** Missions are selected client-side using `week_number` and `day_of_week` calculated from `user.created_at`. No nightly cron job, no `daily_assignments` table.

**Reason:** For 5–10 testers, pre-assigning missions via a cron job requires pg_cron + pg_net extensions, an Edge Function for assignment logic, a `daily_assignments` table, UNIQUE constraint management, a client-side fallback for the gap between midnight and 22:30 IST, and cron secret management. The deterministic client-side calculation achieves identical results with zero infrastructure.

**Alternatives considered:**
- Nightly cron at 22:30 IST: Correct V2 design for personalisation and category rotation
- Server-side RPC for assignment: Still adds an extra round-trip without meaningful benefit at this scale

**Tradeoffs:**
- Cannot do per-user personalisation or category rotation in V1
- All users on the same day_of_week see the same mission (by design for MVP)

**Date:** MVP Reduction Review

---

### DEC-008 — No push notifications in V1 (manual WhatsApp nudges)

**Decision:** Push notifications are not implemented in V1. Streak reminders are sent manually via WhatsApp by the founder.

**Reason:** Push notification infrastructure requires `expo-notifications`, `expo-device`, Expo Push API integration, a `push_tokens` table, a send-notifications Edge Function, and a pg_cron job — minimum 4+ hours of setup. For 5–10 testers where the founder knows each person by name, a personal WhatsApp message is more effective AND teaches what notification copy actually drives opens. The manual process is also the observation that tells you *when* to automate.

**Alternatives considered:**
- Expo push from day one: Correct V2 design
- Local notifications (no server required): Viable shortcut but adds expo-notifications complexity without server-side targeting

**Tradeoffs:**
- Founder must spend ~15 minutes/day on manual outreach during beta
- Not scalable beyond ~20 testers

**Date:** MVP Reduction Review

---

### DEC-009 — No analytics platform in V1 (manual Supabase queries)

**Decision:** PostHog is not integrated in V1. Retention and completion are measured by querying `mission_completions` directly in Supabase's SQL editor.

**Reason:** For 5–10 users, analytics events are noise. A 20-minute conversation with each tester after 7 days gives more actionable insight than a funnel with 10 data points and 15 custom events to maintain. PostHog earns its complexity at cohorts of 100+.

**Alternatives considered:**
- PostHog from day one: Adds SDK integration, event tracking calls throughout codebase, dashboard setup
- Firebase Analytics: Same reasoning as PostHog
- Mixpanel: Same reasoning

**Tradeoffs:**
- Cannot see behaviour patterns beyond completion counts in V1
- Harder to identify exactly where users drop off in the mission flow

**Date:** MVP Reduction Review

---

---

## TECHNICAL DECISIONS

---

### DEC-010 — Expo + React Native (not bare React Native, not Flutter)

**Decision:** The app is built with Expo SDK 52, not bare React Native or Flutter.

**Reason:** Expo provides OTA updates via `expo-updates` — critical for a beta where bugs will be found and need to be fixed without going through App Store review (which takes 24–72 hours). Expo's managed workflow also eliminates native build configuration complexity, allowing two founders to ship faster. The trade-off (slightly larger bundle, some native module limitations) is acceptable for an MVP.

**Alternatives considered:**
- Bare React Native: More control but no OTA, significantly more complex native builds
- Flutter: Cross-platform and performant, but no team expertise and Supabase JS SDK works better with React Native
- React Native (Expo) with EAS: Current choice — best combination of speed and control

**Tradeoffs:**
- Bundle size is larger than bare React Native
- Some advanced native modules require ejection (not expected to be needed for this product)
- Tied to Expo SDK release cycle

**Date:** Project Initialization

---

### DEC-011 — Expo Router v4 (not React Navigation)

**Decision:** Navigation uses Expo Router v4 (file-based routing) rather than React Navigation with manually configured navigators.

**Reason:** File-based routing eliminates an entire category of configuration bugs. Every route is a file — there is no separate navigator config to maintain. Expo Router v4 also provides typed routes (`typedRoutes: true` in `app.config.ts`), preventing navigation typos at compile time. Deep links (`theforge://auth/reset-password`) are configured in `app.config.ts`, not in code.

**Alternatives considered:**
- React Navigation v6: More mature, larger community, but requires manual navigator configuration that creates maintenance burden
- React Navigation with Expo Router as thin wrapper: Adds complexity with no clear benefit

**Tradeoffs:**
- Expo Router is less mature than React Navigation — some edge cases are poorly documented
- `segments[0]` pattern for detecting route groups is not as readable as named route checks
- Folder names with parentheses `(auth)` and `(tabs)` confuse developers unfamiliar with Expo Router

**Date:** Project Initialization

---

### DEC-012 — Supabase (not Firebase, not custom backend)

**Decision:** Backend is Supabase (PostgreSQL + Auth + PostgREST API).

**Reason:** Supabase provides Auth, database, and API in one service with a generous free tier adequate for beta. PostgreSQL gives us full SQL power for the `complete_mission()` RPC and future complex queries. Row Level Security handles data isolation without custom middleware. The `supabase-js` v2 client works well with React Native via the SecureStore adapter. The free tier supports 50k MAU and 500MB database — sufficient for beta.

**Alternatives considered:**
- Firebase: Real-time but NoSQL (poor fit for relational data), Google ecosystem lock-in, higher cost at scale
- Custom Node.js/Express backend: Maximum control but 2–3× more build time, hosting complexity, no built-in auth
- PocketBase: Self-hosted, simpler, but requires infrastructure management and lacks the ecosystem
- Hasura: GraphQL overhead is unnecessary complexity for this data model

**Tradeoffs:**
- Tied to Supabase's pricing and service availability
- PostgreSQL requires more upfront schema design than NoSQL
- Supabase Edge Functions (Deno) have a different runtime than Node.js if we need them in V2

**Date:** Project Initialization

---

### DEC-013 — Postgres RPC for mission completion (not Edge Function)

**Decision:** `complete_mission()` is a Postgres function (RPC), not a Supabase Edge Function.

**Reason:** The mission completion write requires atomicity: INSERT into `mission_completions` AND UPDATE `users` (XP + streak + rank) must succeed or fail together. A Postgres function runs both in a single database transaction. An Edge Function achieves the same but requires: Deno runtime, function deployment, secret management (service role key), and network hops between Edge Function and database. A Postgres RPC takes 30 minutes to write, deploys with the schema migration, and is called with `supabase.rpc()` — identical interface.

**Alternatives considered:**
- Client-side sequential writes: Not atomic — network interruption between the two writes creates inconsistent state
- Edge Function: Correct for V2 when scoring logic becomes complex, but overkill for MVP
- Supabase Database Webhooks: Event-driven, but adds latency and complexity

**Tradeoffs:**
- Postgres function logic is in SQL, not TypeScript — some developers are less comfortable
- Harder to add complex scoring logic (e.g. ML-based) in a SQL function
- Debugging is in Postgres logs, not application logs

**Date:** Architecture Review

---

### DEC-014 — Zustand for state management (not Redux, not Context, not React Query)

**Decision:** Global state is managed with Zustand v5. React Query is not used in V1.

**Reason:** Zustand provides minimal boilerplate, excellent TypeScript support, and a selector pattern that prevents unnecessary re-renders. For the auth state (session, user, profile) and the mission engine state machine, Zustand's synchronous `set()` is exactly what's needed — especially for `clearAuth()` which must fire synchronously during logout. React Query would add value for caching server state at 50+ concurrent users, but adds complexity that isn't warranted for 5–10 beta testers.

**Alternatives considered:**
- Redux Toolkit: Too much boilerplate, action/reducer pattern is overkill for this state model
- React Context + useReducer: No subscription optimization — every context consumer re-renders on any state change
- React Query alone: Excellent for server state but needs a solution for auth state machine
- Jotai: Valid alternative, but less team familiarity; Zustand has more documentation

**Tradeoffs:**
- No built-in caching or background refresh (add React Query in V2)
- No server state synchronisation (manually invalidate after mutations)
- Zustand stores must be carefully structured to avoid excessive re-renders

**Date:** Architecture Review

---

### DEC-015 — INITIAL_STATE and LOGGED_OUT_STATE must be separate constants

**Decision:** The auth store defines two distinct reset states: `INITIAL_STATE` (for store creation, `isLoading: true`, `isInitialized: false`) and `LOGGED_OUT_STATE` (for post-logout, `isLoading: false`, `isInitialized: true`).

**Reason:** This was discovered during BUG-001 analysis. `clearAuth()` originally spread `INITIAL_STATE` and then overrode two fields inline. Any future refactor that changes `clearAuth()` to simply `set(INITIAL_STATE)` would reintroduce a bug where the app shows a loading spinner after logout instead of immediately redirecting. Keeping the two states as named constants with explanatory comments makes the intent clear and the code correct by construction.

**Alternatives considered:**
- Single state with runtime overrides: Fragile, intent not visible
- Boolean `isLoggingOut` flag: More state to manage, same problem

**Tradeoffs:**
- Two constants to maintain if the state shape changes
- Developers must read the comments to understand why there are two constants

**Date:** BUG-001 Resolution

---

### DEC-016 — clearAuth() must be called before supabase.auth.signOut()

**Decision:** In `useAuth.logout()`, `clearAuth()` is called synchronously *before* `await supabase.auth.signOut()`.

**Reason:** This is the primary fix for BUG-001. `supabase.auth.signOut()` makes a network call. The `SIGNED_OUT` event on `onAuthStateChange` fires asynchronously after the call completes. On a slow network (common in India on mobile data), this can take 3–10 seconds. During that time, the Zustand store still holds `session !== null`, so `AuthGate` sees an authenticated user and does not redirect. By calling `clearAuth()` first, the store is wiped synchronously, `AuthGate` reacts in the same tick, and the redirect fires immediately regardless of network conditions.

**Alternatives considered:**
- Wait for `onAuthStateChange(SIGNED_OUT)` to call `clearAuth()`: Original broken approach — races with network
- Call both simultaneously: `clearAuth()` must complete first to avoid the race

**Tradeoffs:**
- If `signOut()` fails server-side, the user is already logged out locally. Their server token will expire naturally. Acceptable tradeoff — being stuck in the app is worse than having a briefly invalid token.

**Date:** BUG-001 Resolution

---

### DEC-017 — AuthGate must not include `profile` in its useEffect dependency array

**Decision:** The `AuthGate` component in `app/_layout.tsx` only subscribes to `isInitialized` and `session` — not `profile`.

**Reason:** During logout, `clearAuth()` sets both `session → null` and `profile → null` in a single Zustand `set()` call. Zustand notifies each subscriber separately. With `profile` in the dependency array, the `useEffect` fires once for `profile → null` and again for `session → null`, causing `router.replace('/(auth)/login')` to be called twice. On Android, a duplicate `router.replace` during an active navigation transition corrupts the navigation stack. Additionally, during login, `profile` is `null` while `fetchProfile()` is in flight — with `profile` in deps, the gate would incorrectly attempt to redirect during this window.

**Alternatives considered:**
- `isInitialized` + `session` + `profile` (original): Caused BUG-001 symptom #4
- Debounce the effect: Hacky, masks the real problem

**Tradeoffs:**
- Screens in `(tabs)` must handle `profile === null` themselves during the brief window after login when profile is loading

**Date:** BUG-001 Resolution

---

### DEC-018 — `react-native-url-polyfill/auto` must be the first import in `_layout.tsx`

**Decision:** The URL polyfill import is unconditionally the first line in `app/_layout.tsx`, before all other imports.

**Reason:** Supabase JS client v2 uses the browser `URL` API internally. React Native's JavaScript environment does not include `URL`. The polyfill patches the global `URL` constructor. If any Supabase code executes before the polyfill is loaded, `URL is not defined` is thrown — on Android this is a silent crash; on some RN versions it's an unhandled promise rejection that breaks all subsequent Supabase calls.

**Alternatives considered:**
- Polyfill in `index.ts`: Works but requires developers to know this convention
- Direct import in `supabase.ts`: Doesn't work — the service file might be imported in tree-shaken order before polyfill

**Tradeoffs:**
- Makes `_layout.tsx` the only valid entry point for the app (already the case with Expo Router)
- Developers who add a new entry file (rare) must remember this

**Date:** Architecture Review

---

### DEC-019 — All dates stored and calculated as IST (UTC+5:30)

**Decision:** Every date used for streak calculation and mission unlock is stored as `YYYY-MM-DD` representing an Indian Standard Time calendar day. The `todayIST()` function in `src/utils/date.ts` is the only permitted way to get "today" in product code.

**Reason:** Streak calculation and mission unlocking are calendar-day operations. If any part of the system uses UTC (the server default), a user in IST who completes a mission at 11pm IST (5:30pm UTC) would have their completion recorded on today's UTC date — correct. But a user who completes at 12:30am IST (7pm previous day UTC) would have their completion recorded on *yesterday's* UTC date — their streak breaks for completing a mission at 12:30am. For all Indian users, IST is the only correct calendar.

**Alternatives considered:**
- Store UTC, convert at display: Error-prone — every comparison must remember to convert
- Rely on device timezone: Device timezones can be set incorrectly
- UTC everywhere: Correct for international apps, wrong for an exclusively Indian audience

**Tradeoffs:**
- IST offset is hardcoded as 330 minutes — requires update if India changes timezone (hasn't since 1945)
- The Postgres RPC uses `(now() AT TIME ZONE 'Asia/Kolkata')::date` — must match client-side `todayIST()`

**Date:** Architecture Review

---

### DEC-020 — Email authentication only in V1 (no Google, no Phone OTP)

**Decision:** V1 supports only email + password authentication.

**Reason:** Google OAuth requires: Google Cloud Console project, SHA-1 fingerprint registration for debug and release builds, Android intent filter configuration, iOS URL scheme configuration, Supabase provider setup, and redirect URI handling — minimum 4 hours of configuration with no learning value for a 10-person beta. Phone OTP requires Twilio or a similar provider, Indian number verification (sometimes rate-limited), and OTP delivery reliability testing. Email signup takes 30 minutes to configure and all 10 beta testers can create an email account.

**Alternatives considered:**
- Phone OTP: Natural for Indian users but high setup cost and SMS delivery reliability issues
- Google OAuth: Reduces friction at scale but adds complexity before need
- Magic link (passwordless email): Viable but adds confusion for users unfamiliar with the pattern

**Tradeoffs:**
- Slightly higher signup friction vs Google OAuth
- Some testers may use throwaway emails — accepted for beta

**Date:** MVP Reduction Review

---

### DEC-021 — Supabase email confirmation disabled for beta

**Decision:** `Email → Confirm email` is set to OFF in Supabase Auth settings during the beta.

**Reason:** Confirmation emails from Supabase's default shared SendGrid pool frequently land in spam on Indian ISPs (Airtel, Jio, BSNL). If a tester cannot confirm their email, they cannot log in — this blocks the entire test before the product has been experienced. For a private 10-person beta, email ownership verification is not a security requirement.

**Alternatives considered:**
- Custom SMTP for better deliverability: Correct for V2, overkill for beta
- Keep confirmation on, warn testers to check spam: Too much friction, too much support load

**Tradeoffs:**
- No email verification in V1 — anyone with an email can create an account
- Must re-enable for V2 production launch

**Date:** Beta Setup Decision

---

### DEC-022 — Design system is Tactical Minimalism (dark, amber, mono type)

**Decision:** The visual design language uses a dark background (`#101415`), amber primary (`#FFBF00`), and JetBrains Mono for metadata and labels.

**Reason:** The product targets military-aspiring young adults who value discipline, precision, and elite aesthetics. The design should feel like a training protocol — clean, serious, purposeful. Amber on dark is a direct reference to military/aviation HUD interfaces and terminal displays. Mono typography for IDs, labels, and data reinforces the "system / protocol" feel. The design intentionally avoids gradients, rounded-corner-heavy cards, and pastel colours associated with consumer wellness apps.

**Alternatives considered:**
- Standard Material Design: Too consumer-app, wrong brand signal
- Military-green camo aesthetic: Too aggressive, dated
- Minimal white/light theme: No differentiation, wrong target demographic association

**Tradeoffs:**
- Dark themes require more careful contrast management for accessibility
- Custom fonts (Geist, Inter, JetBrains Mono) must be bundled, adding ~500KB to app size
- Amber-on-dark has limited colour contrast ratio — must verify WCAG compliance for text on amber buttons

**Date:** Design System Definition

---

### DEC-023 — `useAuth` is the only hook auth screens may import

**Decision:** Components in `app/(auth)/` and `app/(tabs)/` call `useAuth()` for all auth operations. They do not import `auth.service.ts` or `useAuthStore` directly for action calls.

**Reason:** Centralising auth actions in `useAuth` provides a single place to add loading state, error handling, error normalisation, and navigation side-effects. If a screen called `signIn()` directly, it would need to manage `isLoading` state, handle `AsyncResult` errors, and navigate manually — duplicating logic across every screen that touches auth. `useAuth` is the facade that makes each screen's auth code trivial.

**Exceptions:**
- `profile.tsx` reads `useAuthStore` directly for `userId` (for the feedback insert) — this is a read, not an action, and is acceptable.
- `useAuthInitializer.ts` calls `useAuthStore` actions directly — this is the store initialization hook, which is architecturally separate from UI components.

**Tradeoffs:**
- `useAuth` becomes a large hook if many auth actions are added — may need splitting in V2

**Date:** Architecture Review

---

### DEC-024 — No automated tests in V1

**Decision:** V1 ships with no Jest test suite, no React Native Testing Library tests, and no Detox E2E tests.

**Reason:** With a 14–20 day build timeline and a 5–10 person beta, the cost of writing tests exceeds the value. Manual testing by two founders on two platforms is sufficient to catch critical bugs before testers see them. The most important "test" is whether real users complete missions and return — that cannot be measured by a test suite. Tests will be added in V2 once the architecture is stable and the product is proven.

**Alternatives considered:**
- Unit tests for utilities only: Valuable but deferred — `date.ts` and store logic are strong candidates for Day 3
- E2E tests with Detox: High setup cost, high maintenance cost for a changing product

**Tradeoffs:**
- Regression risk is higher — a change to `auth.store.ts` could break logout without detection
- Technical debt from untested code accumulates — must address before V2 launch

**Date:** MVP Scope Decision

---

### DEC-025 — `require()` inside component bodies is explicitly banned

**Decision:** All imports must be at the top level of a module. Using `require()` inside a React component function is forbidden.

**Reason:** This was the direct cause of one of the BUG-001 symptoms. React's Rules of Hooks require that hooks be called at the top level of a React function, not inside loops, conditions, or other functions. `require()` inside a component body can appear to work (Metro bundler caches the module) but the result is that the hook is called outside the component's render cycle — it either throws `Invalid hook call` or returns a stale value from the module cache. In the specific case in `profile.tsx`, the `userId` could have been `undefined` or from a previous session.

**Alternatives considered:**
- Allow `require()` for lazy loading: Not needed in this codebase; dynamic imports are the correct pattern for code splitting

**Tradeoffs:**
- None. This rule has no downside.

**Date:** BUG-001 Resolution

---

---

*Last updated: BUG-001 resolution session. Add new decisions as they are made. Do not delete or retroactively modify entries — append a follow-up entry if a decision is reversed or updated.*
