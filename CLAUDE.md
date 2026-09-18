# The Forge — project context

Gamified officer-development platform for NDA / CDS / SSB aspirants and NCC cadets.
React Native + Expo Router + TypeScript, Supabase backend, Google Sheets as CMS.

**Expo has changed.** Read the versioned docs at https://docs.expo.dev/versions/v56.0.0/
before writing any code. Do not rely on memory of older Expo APIs.

The app is FUNCTIONAL and has been tested in a standalone Android APK. The working
state is the thing to protect. Before changing anything here, understand how it
currently works. When in doubt: do not delete, do not rewrite, do not assume — ask.

---

## Invariants — do not break these

These are load-bearing. Several were bugs that have already been fixed once.

**Progression is by training day, never by calendar date.**
A user sits at `users.current_training_day` (1–30). It advances only when all three
sessions for that day are complete. Three days away from the app does not advance it.
`session_date` still exists, but only for analytics and streaks.

**Session identity is `(user_id, training_day, session_number)`.**
Not `(user_id, session_date, session_number)`. This is the unique constraint in
migration 009 and the lookup key everywhere.

**Sessions are pinned.** `getOrAssignSession` stores question IDs on first assignment;
`fetchFn` runs only on a miss. Reopening a session must return the same questions in
the same order. Never regenerate a pinned session.

**Session 2's shuffle runs once.** `shuffleSession2Constrained` guarantees no two
adjacent questions share a type. It runs inside `fetchFn`, so it executes at first
assignment only. Never reshuffle on reopen.

**Progression goes through the RPC.** `complete_daily_session` is transactional,
concurrency-safe, idempotent, and resolves identity from `auth.uid()`. Never increment
the training day client-side. Never bypass it.

**`app/_layout.tsx` is the authoritative root.** It owns the SplashScreen lifecycle,
`useAuthInitializer()`, the AuthGate, the root container and the status bar.
`app/(auth)/_layout.tsx` is intentionally 14 lines. Moving startup logic back into the
auth group caused a production splash-screen hang. Do not reintroduce:
- a second `SplashScreen.preventAutoHideAsync()`
- a second auth listener or a duplicate `useAuthInitializer()`
- splash gating on anything that can fail in a release bundle (fonts, network)

**Session 3 timers come from data, not the UI.** The controller owns `timeRemaining`;
components receive it as a prop. A component that calls `setInterval` or computes a
duration is a defect regardless of how it looks.

**Content is deployed, not read live.** The app never touches Google Sheets at runtime.
Pipeline: Sheet → `scripts/deploy-beta.js` → `import_staging_questions` →
`replace_question_bank` RPC → `questions` → app.

---

## Architecture map

```
Google Sheet (published CSV)
  → scripts/deploy-beta.js          validates all 30 days, refuses on failure
  → import_staging_questions
  → replace_question_bank RPC       atomic swap
  → questions
  → src/services/content-session-engine.ts   build + constrained shuffle
  → src/services/daily-session.service.ts    pin to user_daily_sessions
  → src/services/content-pipeline.ts         get_questions_by_ids, order preserved
  → session screens
  → complete_daily_session RPC               progression
```

**Curriculum shape:** 30 days × 34 questions = 1020.
Session 1 = 12 MCQ (one per category). Session 2 = 12 mixed (3 MCQ, 3 SingleWord,
2 TrueFalse, 2 RapidResponse, 2 Numeric). Session 3 = 10 (4 SRT, 3 WAT, 3 Interview).

**Screens.** Note the misleading legacy names:
- `app/day0-prototype.tsx` — **production Session 1 screen**, not a prototype
- `app/day0-complete.tsx` — **production Session 1 completion screen**
- `app/session2.tsx`, `app/session3.tsx`, `app/session-complete.tsx` (S2 + S3 share this)
- `app/(tabs)/index.tsx` — Home and Training

---

## Design system

`src/constants/tokens.ts` is the single source of visual truth, imported by all 19
screens and all 12 shared components. Never hardcode a hex value in a component.

Target design is "Industrial Precision": dark graphite surfaces, Forge gold primary
(`#F2CA50` bright, `#D4AF37` for filled buttons), warm off-white text, 4px corner
radius, 1px borders, strict 8pt grid. Corner brackets are the signature detail —
`src/components/ui/CornerMarkers.tsx` already implements them.

Avoid pill-shaped buttons; they clash with the instrument aesthetic.

---

## Known issues, in priority order

Work top-down. Each item has its evidence. Commit after each.

### Blockers before external testers

1. **OpenRouter API key ships inside the APK.**
   `src/services/ai-evaluation.service.ts:142` reads `EXPO_PUBLIC_OPENROUTER_API_KEY`;
   `app/session3.tsx:37` imports it. Expo inlines `EXPO_PUBLIC_*` into the JS bundle, so
   the key is extractable from any distributed APK. Move the call behind a Supabase Edge
   Function and remove the key from the client. Rotate the key regardless.
   **No APK goes to an external tester until this is done.**

2. **A single bad question blocks a training day permanently.**
   `content-session-engine.ts:186, 196, 217` throw when a day does not return exactly
   12/12/10. Because progression is by training day, a user who reaches a broken day can
   never advance past it. Add a runtime fallback that degrades instead of blocking.
   Keep the deploy-time validation in `deploy-beta.js:418–490` — that is the right place
   for a hard failure.

3. **XP can be awarded twice.**
   `app/session-complete.tsx:148` calls `awardSessionXP`, then `:163` calls
   `markSessionCompleted` — two non-transactional RPCs. If the second fails, XP is banked
   but the session is not marked complete, and `isSessionCompleted` then lets the user
   replay it for more XP. Fold the XP into `complete_daily_session`, or make
   `award_progression` idempotent per `(user, day, session)`.

### Correctness

4. **The stale-screen guard never fires.**
   `complete_daily_session` takes `p_expected_day` to reject a screen opened on an earlier
   day, but `daily-session.service.ts:249–255` re-reads `current_training_day` immediately
   before the call, so the values always match. Capture the day where the session is
   pinned (`content-pipeline.ts:14`), carry it through the screen, pass it to
   `markSessionCompleted`.

5. **`user_daily_sessions.training_day` is nullable with no backfill.** Postgres treats
   NULLs as distinct in unique constraints, so a null write bypasses
   `(user_id, training_day, session_number)` entirely. Add `NOT NULL`.

6. **Deactivating a question corrupts pinned sessions.**
   `get_questions_by_ids` filters `active = true` with no count re-check on restore, so a
   pinned 12-question session silently returns 11. Before deactivating anything, confirm
   no live rows in `user_daily_sessions` reference it.

7. **Production logging leaks.** `daily-session.service.ts` logs user IDs and full pinned
   question ID arrays on every session open, ungated. Wrap in `__DEV__`.

8. **`shuffleSession2Constrained` hardcodes `result.length === 12`** (line 146) instead of
   `questions.length`. Fine today, breaks if Session 2's size ever changes.

### Content pipeline

9. **The Sheet has no `session` column** — its header cell reads `3`, so
   `deploy-beta.js:220` falls back to inferring session from ID prefix and question type
   for all 1020 rows. **Verified safe:** replaying the inference against the true column
   gives 0 mismatches. Fix the header anyway; no staging rehearsal needed.

10. **`status: 'approved'` is hardcoded** (`deploy-beta.js:337`), so the Sheet's `status`
    column is ignored and cannot act as an editorial gate.

11. **`SRT_OVERRIDES`** (`deploy-beta.js:25–66`) rewrites 10 SRT questions at import, so
    the Sheet is not the only content source. Two of the ten (`SRT0135`, `SRT0137`) are in
    the spare pool and never reach a user. These belong in the Sheet.

12. **Absolute Windows paths** (`deploy-beta.js:4, 9–10`) pin `node_modules` and `.env` to
    one machine. The content pipeline cannot run anywhere else or in CI.

### Content quality

13. **Three Session 2 pairs give away each other's answer in the same session:**
    Day 1 `S2-SW-022`/`S2-TF-031`, Day 4 `S2-RR-037`/`S2-TF-037`,
    Day 16 `S2-SW-067`/`S2-TF-061`.

14. **Nine SRTs are second-person** while the other 111 are third-person —
    `SRT0005`–`SRT0013`, which is Days 1–3, the first days every tester sees.
    `SRT0010` also reads "a women's purse".

15. **Difficulty does not progress** across Days 1–30 — flat at roughly 5 Easy /
    22 Medium / 5 Hard from Day 3 on. Reweighting means changing `day` values, which is
    **not** safe once testers have pinned sessions.

---

## Verification standard

TypeScript compiling is not evidence that anything works. After any session change,
verify on a device:

- correct training day, correct question count, correct question IDs
- Session 2 has no two adjacent questions of the same type
- pinned order survives closing and reopening the app
- Session 3 timers come from DB values; auto-submit fires; backgrounding mid-question
  does not break it
- completion writes, XP is awarded exactly once, day advances only after all three
- back navigation and session persistence

For UI changes also check: loading and empty states, long text, small Android screens,
keyboard behaviour.

Commands: `npx tsc --noEmit` · `npx expo-doctor` · `npx expo start`

## Git

Commit after each discrete change, never one giant rewrite. If a phase breaks something,
revert that phase rather than rebuilding. Tag before risky work:
`git tag pre-ui-migration`.