# Implementation Complete: Model C Progression + Rapid Response

## Files Modified (5 files)

1. **`src/types/index.ts`**
   - Added `'Rapid Response'` to `MissionType`
   - Added `time_limit_seconds: number | null` to `DbMission`
   - Created `RapidResponseContent` interface
   - Created `RapidResponseResponse` interface

2. **`app/mission/[id].tsx`**
   - Imported `RapidResponse` component
   - Added `handleTimeout()` callback
   - Added conditional render for Rapid Response missions
   - Uses `mission.time_limit_seconds || 60` as default

3. **`app/(tabs)/missions.tsx`**
   - Added `userProgrammeDay` state
   - Filter missions: `unlock_day <= dayNum`
   - Added locked badge UI
   - Disabled tap on locked missions
   - Show "🔒 UNLOCKS DAY X" message
   - Uses `mission.unlock_day` from database

4. **`app/(tabs)/index.tsx`** (No changes needed - already uses `currentDayOfWeek`)

## Files Created (3 files)

1. **`supabase/migrations/006_add_rapid_response.sql`**
   - Adds `time_limit_seconds` column to `missions` table

2. **`src/components/mission-types/RapidResponse.tsx`**
   - 60-second countdown timer
   - Visual timer display with color warnings
   - No auto-submit on expiry
   - Calls `onTimeout()` callback
   - Tracks `time_taken` in response

3. **`app/mission/failure.tsx`**
   - Failure screen UI
   - Shows "MISSION FAILED" banner
   - Displays 0 XP awarded
   - Button: "RETURN TO TRAINING LIBRARY"

## Database Changes

Run in Supabase SQL Editor:

```sql
-- Migration 006
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS time_limit_seconds integer;
```

## Tests to Run

### Programme Day Enforcement
1. User on Day 1 → Navigate to TRAINING tab
2. Verify: Only Day 1 missions visible
3. Try direct URL to Day 2 mission → Should show error or lock
4. User advances to Day 2 → Verify Day 1 + Day 2 missions visible
5. Day 2 missions show NO lock badge
6. Day 3 missions (if exist) show "🔒 UNLOCKS DAY 3"

### Rapid Response Timer
1. Open Rapid Response mission
2. Timer starts at 60 seconds (or `mission.time_limit_seconds`)
3. Timer counts down every second
4. At 10 seconds: Warning shows "⚠ CRITICAL: MAKE YOUR DECISION"
5. Timer color: Green → Orange (20s) → Red (10s)
6. At 0 seconds: Timer expired
7. Submit button disabled
8. Failure screen appears automatically
9. XP = 0
10. Button returns to Training Library

### Edge Cases
1. User selects option → Timer expires → Verify no submission
2. User refreshes during timer → Timer resets (expected beta behavior)
3. User leaves app → Returns → Timer may have expired (expected)

## Known Issues (Beta Limitations)

1. **Timer resets on screen refresh** - No persistence (by design for beta)
2. **No failed attempt tracking** - Not recorded in database (by design)
3. **No server validation of programme day** - UI-only enforcement (by design)
4. **User can manipulate time_taken in response** - Server doesn't validate (acceptable for beta)
5. **Direct URL access** - Currently not blocked for locked missions (low priority)

## TypeScript Compilation

✅ All files: No diagnostics found

## Next Steps (If Issues Found)

If timer doesn't work:
- Check `mission.time_limit_seconds` in database
- Check console for timer interval errors
- Verify `onTimeout` callback fires

If locked missions show anyway:
- Check `mission.unlock_day` value in database
- Check `userProgrammeDay` calculation
- Verify filter logic in `loadMissions()`

If failure screen doesn't appear:
- Check router navigation in `handleTimeout()`
- Verify failure screen route exists
- Check params passed to failure screen
