# Content System — Quick Start Guide

**5-minute setup for database-driven content**

---

## Prerequisites

- Supabase project running
- Environment variables configured (`.env`)
- 700 questions ready in CSV format

---

## Step 1: Run Migration (2 minutes)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Paste contents of `supabase/migrations/002_question_bank.sql`
4. Click **Run**
5. Check **Table Editor** → Confirm `questions` table exists

---

## Step 2: Import Questions (3 minutes)

```bash
# Test with sample
npx ts-node scripts/import-questions.ts scripts/questions-template.csv

# Import your 700 questions
npx ts-node scripts/import-questions.ts path/to/your-questions.csv
```

**Verify import:**
```sql
SELECT COUNT(*) FROM questions;  -- Should show 700+
```

---

## Step 3: Update Sessions (Per session: ~1 hour each)

### Session 1 Changes

**File**: `app/day0-prototype.tsx`

```typescript
// 1. Add imports
import { getSession1Questions } from '../src/services/content.service';
import type { MCQQuestion } from '../src/types/questions';

// 2. Replace state
const [questions, setQuestions] = useState<MCQQuestion[]>([]);
const [loading, setLoading] = useState(true);

// 3. Add loader
useEffect(() => {
  async function load() {
    const { success, data } = await getSession1Questions();
    if (success) setQuestions(data as MCQQuestion[]);
    setLoading(false);
  }
  load();
}, []);

// 4. Update answer checking
// OLD: currentQuestion.correctIndex
// NEW: currentQuestion.answer_data.correctIndex
```

### Session 2 Changes

**File**: `app/session2.tsx`

Same imports and loader as Session 1, but import `Question` type instead.

Update answer checking:
```typescript
// MCQ/RapidResponse
currentQuestion.answer_data.correctIndex

// SingleWord
currentQuestion.answer_data.acceptableAnswers

// Numeric
currentQuestion.answer_data.correctAnswer

// TrueFalse
currentQuestion.answer_data.correctAnswer
```

### Session 3 Changes

**File**: `app/session3.tsx`

Same pattern as Session 1.

Update field access:
```typescript
// OLD: currentQuestion.minWords
// NEW: currentQuestion.answer_data.minWords

// OLD: currentQuestion.evaluationCriteria
// NEW: currentQuestion.answer_data.evaluationCriteria
```

---

## Step 4: Test

```bash
# Start Expo
npx expo start

# Test each session:
# 1. Run Session 1 → Verify MCQ works
# 2. Run Session 2 → Test all question types
# 3. Run Session 3 → Verify AI evaluation works
```

---

## Step 5: Cleanup

```bash
# After testing passes
rm src/data/day0-mock.ts
rm src/data/session2-mock.ts
rm src/data/session3-mock.ts

git add .
git commit -m "feat: database-driven content system"
```

---

## Troubleshooting

**Questions don't load?**
```typescript
// Add debug logging
const result = await getSession1Questions();
console.log('Result:', result);
```

**Answer checking fails?**
- Check: `answer_data.correctIndex` (not `correctIndex`)
- Check: `answer_data.correctAnswer` (not `correctAnswer`)

**AI evaluation fails?**
- Verify: `answer_data.evaluationCriteria` exists
- Check: Question type is SRT/WAT/Interview

---

## CSV Format Reference

```csv
id,category,subcategory,difficulty,question_type,question,prompt,answer_data,xp_reward,time_limit,tags,source,active
MCQ-001,SSB Fundamentals,Basics,Easy,MCQ,What does SSB stand for?,,"{""options"":[""A"",""B""],""correctIndex"":0,""explanation"":""...""}",10,,"[""SSB""]",Team,true
```

**Key Points:**
- `answer_data` must be valid JSON
- Use double quotes `""` inside JSON strings
- `tags` is a JSON array: `["tag1","tag2"]`
- `time_limit` only for RapidResponse

---

## Success Checklist

- [ ] Migration applied
- [ ] Questions imported (700+)
- [ ] Session 1 loads from database
- [ ] Session 2 loads from database
- [ ] Session 3 loads from database
- [ ] All question types work
- [ ] XP system works
- [ ] AI evaluation works
- [ ] Mock files deleted

---

**Total Time**: ~7 hours (including testing)  
**See Full Guide**: `CONTENT_MIGRATION_PLAN.md`  
**Implementation Steps**: `CONTENT_IMPLEMENTATION_CHECKLIST.md`
