# THE FORGE — Day 1 Setup Guide

Get from zero to a running app in under 2 hours.

---

## Prerequisites

- Node.js 20+ (`node --version`)
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- A Supabase account (free tier is fine)
- Expo Go on your phone for quick testing

---

## Step 1 — Supabase project (20 min)

1. Go to [supabase.com](https://supabase.com) → **New project**
   - Region: **ap-south-1 (Mumbai)** — lowest latency for Indian users
   - Save the database password somewhere safe

2. Once the project is ready, go to **Settings → API**
   - Copy **Project URL** and **anon/public key**

3. **Authentication settings** (critical for MVP):
   - Dashboard → **Authentication → Settings**
   - **Confirm email**: **OFF** ← testers sign up and log in immediately
   - **Site URL**: `theforge://` ← needed for password reset deep link

4. **Run migrations** — Dashboard → SQL Editor → New query:
   - Paste the contents of `supabase/migrations/001_initial_schema.sql` → Run
   - Paste the contents of `supabase/migrations/002_seed_missions.sql` → Run

5. Verify the seed worked:
   ```sql
   select id, title, week_number, unlock_day from missions order by week_number, unlock_day;
   ```
   You should see 14 rows.

---

## Step 2 — Project setup (10 min)

```bash
# Clone or create the project directory
cd the-forge

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

Edit `.env` with your Supabase values:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3 — Fonts (15 min)

Download these font files and place them in `assets/fonts/`:

| File | Download from |
|---|---|
| `Geist-Bold.ttf` | [vercel.com/font](https://vercel.com/font) |
| `Geist-SemiBold.ttf` | [vercel.com/font](https://vercel.com/font) |
| `Inter-Regular.ttf` | [fonts.google.com](https://fonts.google.com/specimen/Inter) |
| `Inter-Medium.ttf` | [fonts.google.com](https://fonts.google.com/specimen/Inter) |
| `JetBrainsMono-Regular.ttf` | [jetbrains.com/lego/fonts](https://www.jetbrains.com/lego/fonts) |
| `JetBrainsMono-Medium.ttf` | [jetbrains.com/lego/fonts](https://www.jetbrains.com/lego/fonts) |

> **Shortcut for Day 1:** Replace font references in `src/constants/tokens.ts` with system fonts temporarily:
> ```ts
> display:     'System',
> heading:     'System',
> body:        'System',
> bodyMedium:  'System',
> mono:        Platform.OS === 'ios' ? 'Courier New' : 'monospace',
> monoMedium:  Platform.OS === 'ios' ? 'Courier New' : 'monospace',
> ```
> Add real fonts on Day 2.

---

## Step 4 — Run the app (2 min)

```bash
npx expo start
```

- Press **i** → iOS Simulator
- Press **a** → Android Emulator
- Scan QR code → Expo Go on your phone

---

## Step 5 — Verify Day 1 is working

Work through this checklist:

- [ ] App launches and shows the login screen (no crash)
- [ ] Sign up creates an account (check Supabase Auth → Users)
- [ ] After signup, home screen loads with today's mission
- [ ] Streak count shows 0, XP shows 0
- [ ] Profile screen shows the display name and Cadet rank
- [ ] Sign out returns to login screen
- [ ] Log back in — session persists, goes straight to home

---

## Day 2 tasks (what's NOT in Day 1)

| Task | File to create |
|---|---|
| Mission detail screen | `app/mission/[id].tsx` |
| Reflect & Write execution | `src/components/mission-types/ReflectWrite.tsx` |
| Poll + Reasoning execution | `src/components/mission-types/PollReasoning.tsx` |
| Daily Challenge execution | `src/components/mission-types/DailyChallenge.tsx` |
| Mission success screen | `app/mission/success.tsx` |
| complete_mission() RPC call | `src/services/mission.service.ts` |

---

## Useful Supabase queries during beta

```sql
-- See all completions today
select u.display_name, mc.mission_id, mc.completed_date, mc.xp_awarded
from mission_completions mc
join users u on u.id = mc.user_id
where mc.completed_date = (now() at time zone 'Asia/Kolkata')::date
order by mc.completed_date desc;

-- See all user progress
select display_name, total_xp, current_rank, current_streak, last_active_date
from users
order by total_xp desc;

-- Count completions per user (retention signal)
select u.display_name, count(*) as missions_done
from mission_completions mc
join users u on u.id = mc.user_id
group by u.display_name
order by missions_done desc;

-- D7 retention check
select u.display_name,
  count(*) as total_completions,
  max(mc.completed_date) as last_active
from mission_completions mc
join users u on u.id = mc.user_id
group by u.display_name
having max(mc.completed_date) >= current_date - 7;
```

---

## Common issues

**"Font not found" crash on launch**
→ Check `assets/fonts/` contains all 6 files with exact names from `app/_layout.tsx`.
→ Or use the system font shortcut above for Day 1.

**"EXPO_PUBLIC_SUPABASE_URL is not set" warning**
→ Make sure `.env` exists (not just `.env.example`) and `npx expo start` was run after creating it.

**Signup succeeds but home screen shows no mission**
→ The seed SQL may not have run. Check: `select count(*) from missions;` — should be 14.
→ Also verify the user's `created_at` date in the `users` table — week_number is calculated from this.

**Home screen shows a mission but it's the wrong one**
→ The deterministic selection uses `week_number` and `day_of_week` from `user.created_at`.
→ A user who just signed up should see `week_number = 1, unlock_day = 1` (COM-001 or CONF-001).
→ Check `src/utils/date.ts` → `currentWeekNumber()` and `currentDayOfWeek()`.

**RLS error on insert**
→ Make sure the RLS policies from `001_initial_schema.sql` ran correctly.
→ Test: `select * from missions` in the Supabase SQL editor as anon role.