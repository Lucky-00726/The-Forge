# DAY 0 VALIDATION SLICE

**Date:** June 15, 2026  
**Purpose:** Validate training experience before full V2 build  
**Scope:** Minimal working slice with mock data

---

## STRATEGY

**Build a throwaway prototype to validate UX before committing to full architecture.**

### What Gets Built (Temporary)
- Mock question data (hardcoded 10 MCQs)
- Minimal session flow component
- Temporary XP award logic
- Simple progress tracking

### What Gets Deferred
- Database schema changes
- Full service layer
- Complete type definitions
- Content management system
- All 6 question types (MCQ only)
- Days 1-8

### Why This Approach
1. **Fast validation** — 4-6 hours vs 3 days
2. **UX testing** — Experience the flow before locking architecture
3. **Risk reduction** — Validate before heavy lifting
4. **Learn quickly** — Discover issues early

---

## SCOPE: 4 FILES TO CREATE/MODIFY

### 1. Mock Data (10 MCQ Questions)
**File:** `src/data/day0-mock.ts` (NEW)
**Purpose:** Hardcoded question data

### 2. Session Flow Screen
**File:** `app/day0-prototype.tsx` (NEW)
**Purpose:** Complete session experience

### 3. Dashboard Entry Point
**File:** `app/(tabs)/index.tsx` (MODIFY)
**Purpose:** Add "Try Day 0" button

### 4. Completion Screen
**File:** `app/day0-complete.tsx` (NEW)
**Purpose:** Show results + award XP

---

## IMPLEMENTATION STEPS

### Step 1: Create Mock Data (30 minutes)

**Create:** `src/data/day0-mock.ts`

```typescript
export interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xp: number;
}

export const DAY0_QUESTIONS: MockQuestion[] = [
  {
    id: 'D0Q01',
    question: 'What does SSB stand for?',
    options: [
      'Services Selection Board',
      'Special Service Bureau',
      'Strategic Services Branch',
      'Staff Selection Board'
    ],
    correctIndex: 0,
    explanation: 'SSB stands for Services Selection Board, the organization responsible for selecting officers for the Indian Armed Forces.',
    xp: 10
  },
  // ... 9 more questions
];
```

**Content:** 10 SSB basic knowledge MCQs

---

### Step 2: Create Session Flow Screen (2-3 hours)

**Create:** `app/day0-prototype.tsx`

**Features:**
- Display one question at a time
- Show progress "Question X/10"
- 4 radio button options
- Submit button
- Instant feedback (correct/incorrect + explanation)
- Next button after feedback
- Navigate to completion after Q10

**State Management:**
```typescript
const [currentIndex, setCurrentIndex] = useState(0);
const [selectedOption, setSelectedOption] = useState<number | null>(null);
const [showFeedback, setShowFeedback] = useState(false);
const [responses, setResponses] = useState<boolean[]>([]);
```

**No External Services:** All logic contained in this file

---

### Step 3: Modify Dashboard (15 minutes)

**Modify:** `app/(tabs)/index.tsx`

**Changes:**
- Add "Day 0 Prototype" button above the mission card
- Simple navigation to `/day0-prototype`

**Placement:** Between streak card and mission hero

---

### Step 4: Create Completion Screen (30 minutes)

**Create:** `app/day0-complete.tsx`

**Features:**
- Show score (X/10 correct)
- Display total XP earned
- Save XP to user profile (reuse existing auth.service)
- "Return to Dashboard" button
- Celebration micro-animation (simple fade-in)

**Data Flow:**
- Receives results via route params
- Calls auth.service to update user XP
- Shows success confirmation

---

### Step 5: Testing Checklist

**Manual Validation:**
- [ ] Dashboard shows "Try Day 0" button
- [ ] Button navigates to prototype screen
- [ ] All 10 questions display correctly
- [ ] Options are selectable (radio behavior)
- [ ] Submit shows feedback (correct/incorrect)
- [ ] Explanation displays after submit
- [ ] Progress indicator updates (1/10, 2/10...)
- [ ] After Q10, navigates to completion screen
- [ ] Completion screen shows correct score
- [ ] XP is added to user profile
- [ ] Return to dashboard works
- [ ] Total XP reflects new award on dashboard

---

## IMPLEMENTATION ORDER

1. **Mock data** (src/data/day0-mock.ts) — Foundation
2. **Session flow** (app/day0-prototype.tsx) — Core UX
3. **Completion screen** (app/day0-complete.tsx) — Results
4. **Dashboard modification** (app/(tabs)/index.tsx) — Entry point

---

## ESTIMATED TIME: 4-6 HOURS

**Breakdown:**
- Mock data: 30 min
- Session flow: 2-3 hours
- Completion: 30 min
- Dashboard: 15 min
- Testing: 1 hour
- Buffer: 30-45 min

---

## POST-VALIDATION

**If successful:**
- Delete throwaway files
- Continue with V2_IMPLEMENTATION_PLAN.md Phase 1
- Build production schema, services, and content system

**If needs iteration:**
- Refine question flow
- Adjust feedback mechanism
- Test with co-founder
- Iterate until UX validated

---

## FILES TO DELETE AFTER VALIDATION

- `src/data/day0-mock.ts`
- `app/day0-prototype.tsx`
- `app/day0-complete.tsx`
- Dashboard modification (revert button addition)

Keep this document as evidence of validation approach.

