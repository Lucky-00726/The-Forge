# THE FORGE — Integration Reference
### Quick Reference for Mission Engine Integration

**Purpose:** This document shows how all Day 2 components connect. Use this when adding new mission types or debugging the mission flow.

---

## **Component Architecture**

```
┌─────────────────────────────────────────────────────┐
│                  Dashboard Screen                    │
│              (app/(tabs)/index.tsx)                  │
│                                                       │
│  - Calculates week_number and day_of_week           │
│  - Calls fetchTodayMission()                        │
│  - Shows mission card                               │
│  - Navigates to /mission/[id]                       │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Mission Detail Screen                   │
│              (app/mission/[id].tsx)                  │
│                                                       │
│  - Uses useMissionEngine hook                       │
│  - Calls loadMission(id)                            │
│  - Routes to type component                         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Mission Type Component                  │
│     (ReflectWrite | PollReasoning | Challenge)      │
│                                                       │
│  - Renders type-specific UI                         │
│  - Validates submission requirements                │
│  - Calls onSubmit(response)                         │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              useMissionEngine Hook                   │
│          (src/hooks/useMissionEngine.ts)            │
│                                                       │
│  - Calls completeMission() service                  │
│  - Updates auth profile optimistically              │
│  - Navigates to /mission/success                    │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Mission Service                         │
│          (src/services/mission.service.ts)          │
│                                                       │
│  - Calls supabase.rpc('complete_mission')          │
│  - Returns AsyncResult<CompleteMissionResult>       │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Postgres RPC Function                   │
│          (complete_mission in Supabase)             │
│                                                       │
│  - INSERT mission_completions                       │
│  - UPDATE users (XP, streak, rank)                  │
│  - Returns { xp_awarded, new_total_xp, ... }        │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│              Success Screen                          │
│            (app/mission/success.tsx)                 │
│                                                       │
│  - Displays XP, streak, rank                        │
│  - Shows promotion message if applicable            │
│  - "Return to Base" → router.replace('/(tabs)')     │
└─────────────────────────────────────────────────────┘
```

---

## **Data Flow: Mission Selection**

```typescript
// Dashboard (app/(tabs)/index.tsx)

// 1. Get user profile
const profile = useAuth().profile;
const userId = useAuthStore((s) => s.user?.id);

// 2. Calculate week and day
const joinedDate = profile.created_at.split('T')[0]; // YYYY-MM-DD
const weekNum = currentWeekNumber(joinedDate);       // e.g. 1
const dayNum = currentDayOfWeek(joinedDate);         // e.g. 1-7

// 3. Fetch today's mission
const result = await missionService.fetchTodayMission(
  userId,
  weekNum,
  dayNum
);

// 4. Check if already completed
const completionResult = await missionService.checkTodayCompletion(
  userId,
  todayIST()
);

// 5. Show appropriate state
if (completionResult.data) {
  // Show "Today's Mission Complete" card
} else if (result.data) {
  // Show mission card with "Commence Mission" button
} else {
  // Show "No mission available" state
}
```

---

## **Data Flow: Mission Execution**

```typescript
// Mission Detail Screen (app/mission/[id].tsx)

// 1. Load mission on mount
const { loadMission, submitMission, mission } = useMissionEngine();

useEffect(() => {
  void loadMission(params.id);
}, [params.id]);

// 2. Route to type component
{mission.mission_type === 'Reflect & Write' && (
  <ReflectWrite
    content={mission.content as ReflectWriteContent}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
  />
)}

// 3. Handle submission
const handleSubmit = async (responses: MissionResponse) => {
  await submitMission(responses);
  // useMissionEngine navigates to success automatically
};
```

---

## **Data Flow: Submission**

```typescript
// useMissionEngine Hook (src/hooks/useMissionEngine.ts)

const submitMission = useCallback(
  async (responses: MissionResponse) => {
    // 1. Call RPC
    const result = await missionService.completeMission({
      userId,
      missionId: mission.id,
      responses,
      xp: mission.xp_reward,
    });

    if (!result.success) {
      setError(result.error);
      return false;
    }

    // 2. Update profile optimistically (no refetch needed)
    updateProfileField('total_xp', result.data.new_total_xp);
    updateProfileField('current_streak', result.data.new_streak);
    updateProfileField('current_rank', result.data.new_rank);

    // 3. Navigate to success with params
    router.push({
      pathname: '/mission/success',
      params: {
        xp_awarded: result.data.xp_awarded.toString(),
        new_total_xp: result.data.new_total_xp.toString(),
        new_streak: result.data.new_streak.toString(),
        new_rank: result.data.new_rank,
        mission_title: mission.title,
      },
    });

    return true;
  },
  [userId, mission, updateProfileField, router]
);
```

---

## **State Management**

### **Mission Store (Zustand)**

```typescript
// src/store/mission.store.ts

interface MissionStoreState {
  phase:         'IDLE' | 'ACTIVE' | 'SUBMITTING' | 'DONE' | 'ERROR';
  mission:       DbMission | null;
  responses:     Partial<MissionResponse> | null;
  error:         string | null;
  submittedAt:   string | null;
}

// Actions
setMission(mission)    // Load mission, set phase to ACTIVE
setPhase(phase)        // Change phase manually
setError(error)        // Set error, phase to ERROR
markSubmitted()        // Set submittedAt, phase to DONE
reset()                // Clear to INITIAL_STATE

// Selectors
selectMission          // Get current mission
selectPhase            // Get current phase
selectIsSubmitting     // phase === 'SUBMITTING'
selectCanSubmit...     // Per-type validation
```

### **Auth Store Updates**

```typescript
// Optimistic profile updates (no refetch)
updateProfileField('total_xp', newValue);
updateProfileField('current_streak', newValue);
updateProfileField('current_rank', newValue);

// These update immediately in the UI
// RPC has already written to database
// No race conditions because RPC is authoritative
```

---

## **Type Discrimination**

### **Mission Content (Database → Component)**

```typescript
// src/types/index.ts

export type MissionContent =
  | ReflectWriteContent
  | PollReasoningContent
  | DailyChallengeContent;

// Each has `type` discriminator
interface ReflectWriteContent {
  type: 'Reflect & Write';
  prompt: string;
  min_words: number;
  context?: string;
}

// Component routing (app/mission/[id].tsx)
{mission.mission_type === 'Reflect & Write' && (
  <ReflectWrite content={mission.content as ReflectWriteContent} ... />
)}
```

### **Mission Response (Component → RPC)**

```typescript
// src/types/index.ts

export type MissionResponse =
  | ReflectWriteResponse
  | PollReasoningResponse
  | DailyChallengeResponse;

// Each component returns its typed response
interface ReflectWriteResponse {
  type: 'Reflect & Write';
  text: string;
  word_count: number;
}

// Stored in mission_completions.responses (jsonb)
```

---

## **Adding a New Mission Type (Future V2)**

**Example: Voice Recording Mission**

### **1. Add Type to Database**
```sql
ALTER TABLE missions DROP CONSTRAINT missions_mission_type_check;
ALTER TABLE missions ADD CONSTRAINT missions_mission_type_check
CHECK (mission_type IN (
  'Reflect & Write',
  'Poll + Reasoning',
  'Daily Challenge',
  'Voice Recording'  -- NEW
));
```

### **2. Add TypeScript Types**
```typescript
// src/types/index.ts

export interface VoiceRecordingContent {
  type: 'Voice Recording';
  prompt: string;
  max_duration_seconds: number;
  context?: string;
}

export interface VoiceRecordingResponse {
  type: 'Voice Recording';
  audio_uri: string;
  duration_seconds: number;
}

// Add to union types
export type MissionContent =
  | ReflectWriteContent
  | PollReasoningContent
  | DailyChallengeContent
  | VoiceRecordingContent;  // NEW

export type MissionResponse =
  | ReflectWriteResponse
  | PollReasoningResponse
  | DailyChallengeResponse
  | VoiceRecordingResponse;  // NEW
```

### **3. Create Component**
```typescript
// src/components/mission-types/VoiceRecording.tsx

import { Audio } from 'expo-av';

interface VoiceRecordingProps {
  content: VoiceRecordingContent;
  onSubmit: (response: VoiceRecordingResponse) => void;
  isSubmitting: boolean;
}

export default function VoiceRecording({ content, onSubmit, isSubmitting }) {
  // Record audio
  // Validate duration
  // onSubmit({ type: 'Voice Recording', audio_uri, duration_seconds })
}
```

### **4. Add Route in Mission Detail**
```typescript
// app/mission/[id].tsx

import VoiceRecording from '@/components/mission-types/VoiceRecording';

// Add to routing logic
{mission.mission_type === 'Voice Recording' && (
  <VoiceRecording
    content={mission.content as VoiceRecordingContent}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
  />
)}
```

### **5. Add Validation Selector**
```typescript
// src/store/mission.store.ts

export const selectCanSubmitVoiceRecording = (
  s: MissionStore,
  hasRecording: boolean,
  duration: number,
  maxDuration: number,
): boolean => {
  return s.phase === 'ACTIVE' && hasRecording && duration <= maxDuration;
};
```

**That's it!** No changes needed to:
- Mission service (already handles any MissionResponse)
- useMissionEngine (already generic)
- RPC (stores responses as jsonb)
- Success screen (type-agnostic)

---

## **Key Integration Points**

### **1. Dashboard → Mission Detail**
```typescript
// Dashboard: navigate with mission ID
router.push(`/mission/${mission.id}`);

// Mission Detail: read from params
const params = useLocalSearchParams<{ id: string }>();
void loadMission(params.id);
```

### **2. Mission Detail → Success**
```typescript
// useMissionEngine navigates automatically after RPC
router.push({
  pathname: '/mission/success',
  params: { /* all result fields as strings */ },
});
```

### **3. Success → Dashboard**
```typescript
// Success screen: use replace to prevent back navigation
router.replace('/(tabs)');

// Dashboard remounts and shows "completed" state
```

### **4. Profile Sync**
```typescript
// After completion, profile updates optimistically
updateProfileField('total_xp', newValue);

// Dashboard reads from auth store
const { totalXP, currentStreak, currentRank } = useAuth();

// Profile screen reads from same store
// No refetch needed, instant update
```

---

## **Error Handling Patterns**

### **Service Layer (AsyncResult)**
```typescript
// NEVER throw, always return AsyncResult
export async function fetchMissionById(id: string): Promise<AsyncResult<DbMission>> {
  try {
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { success: false, error: normalizeError(error) };
    }

    return { success: true, data: data as DbMission };
  } catch (err) {
    return { success: false, error: 'Unexpected error occurred' };
  }
}
```

### **Hook Layer**
```typescript
// Check result.success before proceeding
const result = await missionService.fetchMissionById(id);

if (!result.success) {
  setError(result.error);  // Store error in Zustand
  return false;
}

// Use result.data safely
setMission(result.data);
```

### **Component Layer**
```typescript
// Read error from hook/store
const { error } = useMissionEngine();

// Show error banner
{error && (
  <View style={styles.errorBox}>
    <Text>{error}</Text>
  </View>
)}
```

---

## **Date Handling (CRITICAL)**

### **Always Use IST**
```typescript
// CORRECT
import { todayIST } from '@/utils/date';
const today = todayIST();  // '2026-06-12'

// WRONG - will break streak logic
const today = new Date().toISOString().slice(0, 10);  // UTC date!
```

### **Deterministic Calculation**
```typescript
import { currentWeekNumber, currentDayOfWeek } from '@/utils/date';

// User created on 2026-06-12
const joinedDate = '2026-06-12';

// Today is 2026-06-12 (same day)
currentWeekNumber(joinedDate);  // 1
currentDayOfWeek(joinedDate);   // 1

// Tomorrow (2026-06-13)
currentWeekNumber(joinedDate);  // 1
currentDayOfWeek(joinedDate);   // 2

// 7 days later (2026-06-19)
currentWeekNumber(joinedDate);  // 2
currentDayOfWeek(joinedDate);   // 1
```

---

## **Database Queries (Common Operations)**

### **Get Today's Completion for User**
```sql
SELECT * FROM mission_completions
WHERE user_id = $1
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;
```

### **Get Mission for Week/Day**
```sql
SELECT * FROM missions
WHERE week_number = $1
  AND unlock_day = $2;
```

### **Complete Mission (RPC Call)**
```typescript
const { data, error } = await supabase.rpc('complete_mission', {
  p_user_id: userId,
  p_mission_id: missionId,
  p_responses: responses,
  p_xp: xpReward,
});
```

---

## **Performance Considerations**

### **Optimistic Updates**
- Profile fields update immediately (no refetch)
- Dashboard shows completed state instantly
- User sees updated XP/streak/rank on success screen

### **No Over-Fetching**
- Mission detail only fetches one mission (by ID)
- Dashboard only fetches one mission (by week/day)
- Profile loads once per session

### **Caching Strategy (V1)**
- No React Query in V1
- Zustand stores hold current mission/profile
- Manual refresh via pull-to-refresh

---

## **Debugging Checklist**

### **Mission not showing on dashboard?**
1. Check `created_at` in users table
2. Verify week/day calculation: `currentWeekNumber()`, `currentDayOfWeek()`
3. Check mission seed: `SELECT * FROM missions WHERE week_number = 1 AND unlock_day = 1;`
4. Check `.env` file has correct Supabase values

### **Submit button not enabling?**
1. Check word count: `countWords(text)`
2. Check min_words requirement in mission content
3. Check component validation logic
4. Check Zustand selector: `selectCanSubmit...()`

### **XP/streak not updating?**
1. Check RPC return: `console.log(result.data)`
2. Check optimistic update: verify `updateProfileField()` called
3. Check database: `SELECT * FROM users WHERE id = ...`
4. Check profile screen: refresh by navigating away and back

### **Already completed error?**
1. Check `mission_completions` table for today's entry
2. This is expected behavior (UNIQUE constraint working)
3. Dashboard should show "completed" state

---

## **Reference: All Entry Points**

| Entry Point | File | Purpose |
|------------|------|---------|
| Dashboard | `app/(tabs)/index.tsx` | Mission selection, completion check |
| Mission Detail | `app/mission/[id].tsx` | Load mission, route to type component |
| Success | `app/mission/success.tsx` | Display results, return navigation |
| Mission Store | `src/store/mission.store.ts` | State machine, validation selectors |
| Mission Service | `src/services/mission.service.ts` | Fetch, check, complete operations |
| Mission Engine | `src/hooks/useMissionEngine.ts` | Orchestration, optimistic updates |
| Type Components | `src/components/mission-types/*.tsx` | Type-specific UI and validation |

---

**For full implementation details, see:**
- `DAY2_COMPLETION.md` — Complete implementation report
- `DAY2_SUMMARY.md` — Executive summary
- `TESTING_GUIDE.md` — Testing procedures

---

*This document is a living reference. Update when adding new mission types or changing integration points.*
