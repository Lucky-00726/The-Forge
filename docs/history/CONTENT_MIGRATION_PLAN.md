# Content Migration Plan — The Forge

**Objective**: Replace hardcoded mock questions with database-driven content system

**Status**: Ready for Implementation  
**Created**: June 18, 2026

---

## Overview

Replace hardcoded questions in `day0-mock.ts`, `session2-mock.ts`, `session3-mock.ts` with dynamic database loading while preserving all existing UI, gameplay, XP, analytics, and AI evaluation functionality.

---

## Files Created

### 1. Database Schema
**File**: `supabase/migrations/002_question_bank.sql`
- `questions` table with 8 question types
- Indexes for performance
- RPC functions: `get_session_questions`, `get_mixed_session_questions`
- Row-level security policies

### 2. TypeScript Types
**File**: `src/types/questions.ts`
- Type definitions for all 8 question types
- Database row interfaces
- Query parameter types

### 3. Content Service
**File**: `src/services/content.service.ts`
- `getSession1Questions()` — 10 MCQ
- `getSession2Questions()` — 20 mixed types
- `getSession3Questions()` — 10 subjective
- Generic query functions

### 4. Import Script
**File**: `scripts/import-questions.ts`
- CSV/JSON import support
- Validation
- Batch processing
- Error reporting

### 5. CSV Template
**File**: `scripts/questions-template.csv`
- Example questions for all 8 types
- Proper JSON formatting
- Tag structure

---

## Implementation Plan

### Phase 1: Database Setup ✅ CREATED

**Files Created:**
- `supabase/migrations/002_question_bank.sql`
- `src/types/questions.ts`
- `src/services/content.service.ts`
- `scripts/import-questions.ts`
- `scripts/questions-template.csv`

**Next Steps:**
1. Run migration in Supabase dashboard
2. Verify table creation
3. Test RPC functions

---

### Phase 2: Import Initial Content 🔄 READY

**Prerequisites:**
- Migration applied
- 700 questions converted to CSV/JSON format

**Steps:**

1. **Convert Content to CSV**
   - Use `scripts/questions-template.csv` as reference
   - Ensure answer_data is valid JSON
   - Validate all required fields

2. **Test Import with Sample**
   ```bash
   npx ts-node scripts/import-questions.ts scripts/questions-template.csv
   ```

3. **Import Full Content**
   ```bash
   npx ts-node scripts/import-questions.ts path/to/700-questions.csv
   ```

4. **Verify Import**
   ```sql
   -- In Supabase SQL Editor
   SELECT question_type, COUNT(*) 
   FROM questions 
   WHERE active = true 
   GROUP BY question_type;
   ```

**Expected Output:**
```
MCQ           150
SRT            80
WAT            60
Interview      50
SingleWord    100
Numeric        90
RapidResponse  80
TrueFalse      90
```

---

### Phase 3: Update Session 1 (Day 0) 🔄 READY

**File to Modify**: `app/day0-prototype.tsx`

**Current State:**
```typescript
import { DAY0_QUESTIONS, TOTAL_QUESTIONS, MAX_XP } from '../src/data/day0-mock';
```

**Changes Required:**

1. **Add Content Service Import**
   ```typescript
   import { getSession1Questions } from '../src/services/content.service';
   import type { MCQQuestion } from '../src/types/questions';
   ```

2. **Replace State Initialization**
   ```typescript
   // OLD:
   const questions = DAY0_QUESTIONS;
   const totalQuestions = TOTAL_QUESTIONS;

   // NEW:
   const [questions, setQuestions] = useState<MCQQuestion[]>([]);
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   ```

3. **Add useEffect to Load Questions**
   ```typescript
   useEffect(() => {
     async function loadQuestions() {
       setLoading(true);
       const { success, data, error } = await getSession1Questions();
       
       if (success) {
         setQuestions(data as MCQQuestion[]);
       } else {
         setLoadError(error || 'Failed to load questions');
       }
       
       setLoading(false);
     }
     
     loadQuestions();
   }, []);
   ```

4. **Add Loading/Error UI**
   ```typescript
   if (loading) {
     return <LoadingScreen message="Loading questions..." />;
   }
   
   if (loadError) {
     return <ErrorScreen message={loadError} onRetry={() => window.location.reload()} />;
   }
   
   if (questions.length === 0) {
     return <ErrorScreen message="No questions available" />;
   }
   ```

5. **Update Question Access**
   ```typescript
   // OLD:
   const currentQuestion = questions[currentIndex];

   // NEW (no change needed - same structure):
   const currentQuestion = questions[currentIndex];
   const totalQuestions = questions.length;
   const maxXP = questions.reduce((sum, q) => sum + q.xp_reward, 0);
   ```

6. **Update Answer Checking**
   ```typescript
   // OLD:
   const isCorrect = selectedIndex === currentQuestion.correctIndex;

   // NEW:
   const isCorrect = selectedIndex === currentQuestion.answer_data.correctIndex;
   ```

7. **Delete Mock File** (after testing)
   - Keep `src/data/day0-mock.ts` for now as fallback
   - Delete after verified working

---

### Phase 4: Update Session 2 🔄 READY

**File to Modify**: `app/session2.tsx`

**Current State:**
```typescript
import { SESSION2_QUESTIONS, SESSION2_TOTAL_QUESTIONS, SESSION2_MAX_XP } from '../src/data/session2-mock';
```

**Changes Required:**

1. **Add Content Service Import**
   ```typescript
   import { getSession2Questions } from '../src/services/content.service';
   import type { Question } from '../src/types/questions';
   ```

2. **Replace State Initialization**
   ```typescript
   // OLD:
   const questions = SESSION2_QUESTIONS;

   // NEW:
   const [questions, setQuestions] = useState<Question[]>([]);
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   ```

3. **Add useEffect to Load Questions**
   ```typescript
   useEffect(() => {
     async function loadQuestions() {
       setLoading(true);
       const { success, data, error } = await getSession2Questions();
       
       if (success) {
         setQuestions(data);
       } else {
         setLoadError(error || 'Failed to load questions');
       }
       
       setLoading(false);
     }
     
     loadQuestions();
   }, []);
   ```

4. **Update Answer Checking Logic**
   ```typescript
   // For MCQ/RapidResponse:
   const isCorrect = selectedIndex === currentQuestion.answer_data.correctIndex;

   // For SingleWord:
   const isCorrect = currentQuestion.answer_data.acceptableAnswers
     .map(a => a.toLowerCase())
     .includes(answer.toLowerCase().trim());

   // For Numeric:
   const isCorrect = Math.abs(
     numericAnswer - currentQuestion.answer_data.correctAnswer
   ) <= (currentQuestion.answer_data.tolerance || 0);

   // For TrueFalse:
   const isCorrect = selectedValue === currentQuestion.answer_data.correctAnswer;
   ```

5. **Delete Mock File** (after testing)

---

### Phase 5: Update Session 3 🔄 READY

**File to Modify**: `app/session3.tsx`

**Current State:**
```typescript
import { SESSION3_QUESTIONS, SESSION3_TOTAL_QUESTIONS, SESSION3_MAX_XP } from '../src/data/session3-mock';
```

**Changes Required:**

1. **Add Content Service Import**
   ```typescript
   import { getSession3Questions } from '../src/services/content.service';
   import type { SRTQuestion, WATQuestion, InterviewQuestion } from '../src/types/questions';
   ```

2. **Replace State Initialization**
   ```typescript
   // OLD:
   const questions = SESSION3_QUESTIONS;

   // NEW:
   const [questions, setQuestions] = useState<(SRTQuestion | WATQuestion | InterviewQuestion)[]>([]);
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   ```

3. **Add useEffect to Load Questions**
   ```typescript
   useEffect(() => {
     async function loadQuestions() {
       setLoading(true);
       const { success, data, error } = await getSession3Questions();
       
       if (success) {
         setQuestions(data as (SRTQuestion | WATQuestion | InterviewQuestion)[]);
       } else {
         setLoadError(error || 'Failed to load questions');
       }
       
       setLoading(false);
     }
     
     loadQuestions();
   }, []);
   ```

4. **Update Question Access**
   ```typescript
   // OLD:
   const minWords = currentQuestion.minWords ?? 10;

   // NEW:
   const minWords = currentQuestion.answer_data.minWords ?? 10;
   ```

5. **Update AI Evaluation Input**
   ```typescript
   // OLD:
   const question = SESSION3_QUESTIONS.find((q) => q.id === r.questionId);

   // NEW (should work if questions array is in scope):
   const question = questions.find((q) => q.id === r.questionId);
   ```

6. **Delete Mock File** (after testing)

---

### Phase 6: Testing 🧪 PENDING

**Test Checklist:**

Session 1 Testing:
- [ ] Questions load on mount
- [ ] Progress bar updates correctly
- [ ] Answer selection works
- [ ] Correct/incorrect feedback displays
- [ ] Explanation shows after answer
- [ ] XP awarded matches question xp_reward
- [ ] Session completes successfully
- [ ] Analytics events fire
- [ ] No TypeScript errors

Session 2 Testing:
- [ ] Mixed question types load
- [ ] MCQ questions work
- [ ] SingleWord validation works
- [ ] Numeric tolerance works
- [ ] RapidResponse timer works
- [ ] TrueFalse works
- [ ] XP calculation correct
- [ ] Analytics events fire

Session 3 Testing:
- [ ] SRT/WAT/Interview mix loads
- [ ] Word count validation works
- [ ] Answer submission works
- [ ] AI evaluation receives correct data
- [ ] AI feedback displays (if API key present)
- [ ] XP awarded correctly
- [ ] Analytics events fire

Performance Testing:
- [ ] Questions load in < 2 seconds
- [ ] No memory leaks
- [ ] Offline handling graceful
- [ ] Error states display correctly

---

### Phase 7: Cleanup 🧹 PENDING

**After Successful Testing:**

1. **Delete Mock Files**
   ```bash
   rm src/data/day0-mock.ts
   rm src/data/session2-mock.ts
   rm src/data/session3-mock.ts
   ```

2. **Update Imports Across Codebase**
   - Search for any remaining references to mock files
   - Update or remove

3. **Update Documentation**
   - Mark mock files as deprecated
   - Update README with new content system

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: migrate to database-driven content system"
   ```

---

## Rollback Plan

**If Issues Arise:**

1. **Revert Session Files**
   - Restore imports to mock files
   - Remove content service calls
   - Test with hardcoded data

2. **Database Rollback**
   ```sql
   -- In Supabase SQL Editor
   DROP TABLE IF EXISTS public.questions CASCADE;
   ```

3. **Keep Mock Files**
   - Don't delete until production verified
   - Maintain as fallback for 1-2 weeks

---

## Content Format Guide

### MCQ Question
```json
{
  "id": "MCQ-001",
  "category": "SSB Fundamentals",
  "subcategory": "Basics",
  "difficulty": "Easy",
  "question_type": "MCQ",
  "question": "What does SSB stand for?",
  "answer_data": {
    "options": ["Services Selection Board", "Special Service Bureau", "Strategic Services Branch", "Staff Selection Board"],
    "correctIndex": 0,
    "explanation": "SSB stands for Services Selection Board."
  },
  "xp_reward": 10,
  "tags": ["SSB", "basics"],
  "source": "Team Curated",
  "active": true
}
```

### SRT Question
```json
{
  "id": "SRT-001",
  "category": "Psychological Tests",
  "subcategory": "SRT",
  "difficulty": "Medium",
  "question_type": "SRT",
  "question": "You are leading a night patrol when your radio fails. You hear gunfire 2 km away. Your response?",
  "answer_data": {
    "minWords": 15,
    "evaluationCriteria": ["Initiative", "Decision Making", "Leadership"]
  },
  "xp_reward": 20,
  "tags": ["SRT", "leadership"],
  "source": "SSB Manual",
  "active": true
}
```

### Numeric Question
```json
{
  "id": "NUM-001",
  "category": "General Knowledge",
  "subcategory": "NDA",
  "difficulty": "Medium",
  "question_type": "Numeric",
  "question": "How many days does the SSB interview process typically last?",
  "answer_data": {
    "correctAnswer": 5,
    "tolerance": 0,
    "unit": "days",
    "explanation": "SSB is a 5-day process."
  },
  "xp_reward": 10,
  "tags": ["SSB", "process"],
  "source": "Team Curated",
  "active": true
}
```

---

## Success Metrics

**Pre-Launch:**
- [ ] All 700 questions imported successfully
- [ ] All 3 sessions load questions from database
- [ ] 0 TypeScript errors
- [ ] All tests pass
- [ ] XP system works correctly
- [ ] AI evaluation works correctly
- [ ] Analytics track correctly

**Post-Launch (Monitor for 7 Days):**
- Question load time < 2 seconds (95th percentile)
- Question load success rate > 99%
- Session completion rate maintains current levels
- No increase in error rates
- User feedback positive

---

## Next Steps

1. **Apply Migration**
   - Run `002_question_bank.sql` in Supabase SQL Editor
   - Verify table created

2. **Prepare Content**
   - Convert 700 questions to CSV format
   - Validate with template

3. **Import Content**
   - Test with sample
   - Import full dataset

4. **Update Sessions**
   - Session 1 first (simplest)
   - Session 2 second (mixed types)
   - Session 3 third (AI integration)

5. **Test Thoroughly**
   - Use checklist above
   - Test on multiple devices

6. **Deploy**
   - Commit changes
   - Deploy to production
   - Monitor metrics

---

**Status**: Implementation plan complete, ready for execution  
**Next Action**: Run database migration  
**Owner**: Development team
