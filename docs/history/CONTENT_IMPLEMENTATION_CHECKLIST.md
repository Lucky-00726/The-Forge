# Content System Implementation Checklist

**Quick reference for implementing database-driven content**

---

## ✅ Files Created (Complete)

- [x] `supabase/migrations/002_question_bank.sql` — Database schema
- [x] `src/types/questions.ts` — TypeScript types
- [x] `src/services/content.service.ts` — Content loading service
- [x] `scripts/import-questions.ts` — Import script
- [x] `scripts/questions-template.csv` — CSV template
- [x] `CONTENT_MIGRATION_PLAN.md` — Detailed migration guide

---

## 🔧 Implementation Order

### 1. Database Setup (30 minutes)

```bash
# Navigate to Supabase Dashboard
# Go to: SQL Editor
# Paste contents of: supabase/migrations/002_question_bank.sql
# Click "Run"
# Verify: Check "Table Editor" for "questions" table
```

**Verify:**
```sql
SELECT COUNT(*) FROM questions;  -- Should return 0
```

---

### 2. Content Import (1 hour)

**A. Prepare Content CSV**
- Use `scripts/questions-template.csv` as reference
- Convert 700 questions to CSV format
- Ensure answer_data is valid JSON
- Example row:
  ```
  MCQ-001,SSB Fundamentals,Basics,Easy,MCQ,What does SSB stand for?,,"{""options"":[""Services Selection Board"",""Special Service Bureau""],""correctIndex"":0,""explanation"":""...""}",10,,"[""SSB""]",Team Curated,true
  ```

**B. Test Import**
```bash
cd forge
npx ts-node scripts/import-questions.ts scripts/questions-template.csv
```

**C. Import Full Dataset**
```bash
npx ts-node scripts/import-questions.ts path/to/700-questions.csv
```

**Verify:**
```sql
SELECT question_type, COUNT(*) 
FROM questions 
WHERE active = true 
GROUP BY question_type;
```

---

### 3. Update Session 1 (1 hour)

**File**: `app/day0-prototype.tsx`

**Step 1**: Add imports
```typescript
import { getSession1Questions } from '../src/services/content.service';
import type { MCQQuestion } from '../src/types/questions';
```

**Step 2**: Replace state
```typescript
const [questions, setQuestions] = useState<MCQQuestion[]>([]);
const [loading, setLoading] = useState(true);
```

**Step 3**: Add loader
```typescript
useEffect(() => {
  async function load() {
    const { success, data } = await getSession1Questions();
    if (success) setQuestions(data as MCQQuestion[]);
    setLoading(false);
  }
  load();
}, []);
```

**Step 4**: Update answer checking
```typescript
// Change: currentQuestion.correctIndex
// To: currentQuestion.answer_data.correctIndex
```

**Test**: Run Session 1, verify questions load

---

### 4. Update Session 2 (1.5 hours)

**File**: `app/session2.tsx`

**Step 1**: Add imports
```typescript
import { getSession2Questions } from '../src/services/content.service';
import type { Question } from '../src/types/questions';
```

**Step 2**: Replace state + add loader (same as Session 1)

**Step 3**: Update answer checking for each type:
```typescript
// MCQ/RapidResponse
const isCorrect = selectedIndex === currentQuestion.answer_data.correctIndex;

// SingleWord
const acceptable = currentQuestion.answer_data.acceptableAnswers;
const isCorrect = acceptable.some(a => 
  a.toLowerCase() === answer.toLowerCase().trim()
);

// Numeric
const isCorrect = Math.abs(
  numericAnswer - currentQuestion.answer_data.correctAnswer
) <= (currentQuestion.answer_data.tolerance || 0);

// TrueFalse
const isCorrect = selected === currentQuestion.answer_data.correctAnswer;
```

**Test**: Run Session 2, test all question types

---

### 5. Update Session 3 (1 hour)

**File**: `app/session3.tsx`

**Step 1**: Add imports
```typescript
import { getSession3Questions } from '../src/services/content.service';
import type { SRTQuestion, WATQuestion, InterviewQuestion } from '../src/types/questions';
```

**Step 2**: Replace state + add loader (same as Session 1)

**Step 3**: Update field access
```typescript
// Change: currentQuestion.minWords
// To: currentQuestion.answer_data.minWords

// Change: currentQuestion.evaluationCriteria
// To: currentQuestion.answer_data.evaluationCriteria
```

**Test**: Run Session 3, verify AI evaluation works

---

### 6. Testing (2 hours)

**Session 1 Tests:**
- [ ] Questions load
- [ ] Can select answer
- [ ] Correct/incorrect feedback
- [ ] XP awarded
- [ ] Session completes
- [ ] Analytics fire

**Session 2 Tests:**
- [ ] All 5 question types work
- [ ] Timer works for RapidResponse
- [ ] Validation works for each type
- [ ] XP calculation correct

**Session 3 Tests:**
- [ ] SRT/WAT/Interview load
- [ ] Word count validation
- [ ] AI evaluation receives data
- [ ] Completion screen shows results

**Performance Tests:**
- [ ] Load time < 2 seconds
- [ ] No errors in console
- [ ] Smooth transitions

---

### 7. Cleanup (15 minutes)

**After Testing Passes:**

```bash
# Delete mock files
rm src/data/day0-mock.ts
rm src/data/session2-mock.ts  
rm src/data/session3-mock.ts

# Commit
git add .
git commit -m "feat: migrate to database-driven content system"
```

---

## 🚨 Troubleshooting

### Questions Don't Load

**Check:**
1. Migration ran successfully
2. Questions imported (run SELECT COUNT(*))
3. RLS policies allow access
4. Content service imports correct

**Debug:**
```typescript
const { success, data, error } = await getSession1Questions();
console.log('Success:', success);
console.log('Count:', data.length);
console.log('Error:', error);
```

### Wrong Answer Checking

**Check:**
- `answer_data.correctIndex` (not `correctIndex`)
- `answer_data.correctAnswer` (not `correctAnswer`)
- `answer_data.acceptableAnswers` (not `acceptableAnswers`)

### AI Evaluation Fails

**Check:**
- Question structure includes `answer_data.evaluationCriteria`
- Question type is SRT/WAT/Interview
- AI service receives correct format

---

## 📊 Success Criteria

**Before Declaring Complete:**
- [ ] 700+ questions in database
- [ ] All 3 sessions load from database
- [ ] All question types work correctly
- [ ] XP system unchanged
- [ ] AI evaluation unchanged
- [ ] Analytics unchanged
- [ ] 0 TypeScript errors
- [ ] 0 console errors during sessions
- [ ] Mock files deleted

---

## ⏱️ Total Time Estimate

- Database setup: 30 min
- Content import: 1 hour
- Session 1 update: 1 hour
- Session 2 update: 1.5 hours
- Session 3 update: 1 hour
- Testing: 2 hours
- Cleanup: 15 min

**Total: ~7 hours**

---

## 🎯 Key Points

1. **Test incrementally** — Update one session at a time
2. **Keep mock files** — Don't delete until fully tested
3. **Verify imports** — Check question counts after import
4. **Monitor performance** — Watch load times
5. **Preserve functionality** — XP, AI, analytics must work

---

**Status**: Implementation guide complete  
**Next**: Run database migration  
**See**: `CONTENT_MIGRATION_PLAN.md` for detailed steps
