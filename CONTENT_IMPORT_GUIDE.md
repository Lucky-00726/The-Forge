# Content Import Guide — The Forge

Complete guide for importing content from CSV files into The Forge question bank.

---

## Overview

The Forge uses a database-driven content system that supports 8 question types across multiple categories. This guide walks through the complete process of importing content from CSV files.

---

## Quick Start

### 1. Prepare Your CSV Files

Place your CSV files in a dedicated folder (e.g., `data/` or `content/`).

**Required CSV columns:**
```
id,category,subcategory,difficulty,question_type,question,prompt,answer_data,xp_reward,time_limit,tags,source,active
```

**Example:**
```csv
id,category,subcategory,difficulty,question_type,question,prompt,answer_data,xp_reward,time_limit,tags,source,active
INT-001,Interview Prep,Motivation,Medium,Interview,Why do you want to join the Armed Forces?,Be honest and specific.,"{""minWords"":30,""evaluationCriteria"":[""Communication"",""Responsibility""]}",25,,"[""interview"",""motivation""]",Team Curated,true
```

See `scripts/questions-template.csv` for complete examples of all question types.

---

### 2. Run Content Audit (Optional but Recommended)

Before importing, audit your content to identify issues:

```bash
npx ts-node scripts/content-audit.ts content/*.csv
```

**This will:**
- Count total questions
- Detect duplicates
- Identify quality issues (missing fields, invalid data)
- Generate a report: `CONTENT_AUDIT_REPORT_YYYY-MM-DD.md`

**Review the report** and fix any issues before importing.

---

### 3. Run Enhanced Import

Import all CSV files:

```bash
npx ts-node scripts/enhanced-import.ts content/*.csv
```

**This will:**
- Validate all questions
- Remove duplicates automatically
- Import valid questions in batches
- Generate import statistics
- Save an import log: `import-log-YYYY-MM-DD.json`

---

## CSV Format Requirements

### Supported Question Types

1. **MCQ** — Multiple Choice Questions
2. **SingleWord** — Single word answers
3. **Numeric** — Numeric answers with tolerance
4. **RapidResponse** — Timed multiple choice
5. **TrueFalse** — True/False questions
6. **SRT** — Situation Reaction Tests
7. **WAT** — Word Association Tests
8. **Interview** — Interview questions

---

### CSV Column Definitions

| Column | Required | Type | Description |
|--------|----------|------|-------------|
| `id` | Yes | Text | Unique identifier (e.g., `MCQ-001`, `SRT-042`) |
| `category` | Yes | Text | Question category (see below) |
| `subcategory` | No | Text | Sub-category (e.g., `TAT`, `WAT`, `NDA`) |
| `difficulty` | Yes | Text | `Easy`, `Medium`, or `Hard` |
| `question_type` | Yes | Text | One of 8 types above |
| `question` | Yes | Text | The question text |
| `prompt` | No | Text | Additional guidance for subjective questions |
| `answer_data` | Yes | JSON | Answer data structure (varies by type) |
| `xp_reward` | Yes | Number | XP points (typically 10-30) |
| `time_limit` | No | Number | Time limit in seconds (for RapidResponse) |
| `tags` | Yes | JSON Array | Tags for filtering (e.g., `["SSB","basics"]`) |
| `source` | No | Text | Content source (e.g., `Team Curated`) |
| `active` | Yes | Boolean | `true` or `false` |

---

### Valid Categories

```
- SSB Fundamentals
- OLQs
- Psychological Tests
- GTO Tasks
- Interview Prep
- Leadership
- Decision Making
- Communication
- General Knowledge
```

---

### Answer Data Structures

#### MCQ / RapidResponse
```json
{
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Explanation of correct answer"
}
```

#### SingleWord
```json
{
  "correctAnswer": "National Defence Academy",
  "acceptableAnswers": ["national defence academy", "nda"],
  "explanation": "NDA stands for National Defence Academy"
}
```

#### Numeric
```json
{
  "correctAnswer": 5,
  "tolerance": 0,
  "unit": "days",
  "explanation": "SSB is a 5-day process"
}
```

#### TrueFalse
```json
{
  "correctAnswer": false,
  "explanation": "Psychological tests are more important"
}
```

#### SRT / WAT / Interview
```json
{
  "minWords": 15,
  "evaluationCriteria": ["Initiative", "Decision Making", "Leadership"]
}
```

---

## Example CSV Rows

### MCQ Question
```csv
MCQ-001,SSB Fundamentals,Basics,Easy,MCQ,What does SSB stand for?,,"{""options"":[""Services Selection Board"",""Special Service Bureau"",""Strategic Services Branch"",""Staff Selection Board""],""correctIndex"":0,""explanation"":""SSB stands for Services Selection Board.""}",10,,"[""SSB"",""basics""]",Team Curated,true
```

### SRT Question
```csv
SRT-001,Psychological Tests,SRT,Medium,SRT,You are leading a night patrol when your radio fails. You hear gunfire 2 km away. Your response?,,""{""minWords"":15,""evaluationCriteria"":[""Initiative"",""Decision Making"",""Leadership""]}",20,,"[""SRT"",""leadership""]",SSB Manual,true
```

### Interview Question
```csv
INT-001,Interview Prep,Motivation,Medium,Interview,Why do you want to join the Armed Forces?,Be honest and specific.,"{""minWords"":30,""evaluationCriteria"":[""Communication"",""Responsibility"",""Initiative""]}",25,,"[""interview"",""motivation""]",Team Curated,true
```

---

## Import Process Details

### Step 1: Content Audit

```bash
npx ts-node scripts/content-audit.ts content/*.csv
```

**Output:**
```
📊 CONTENT AUDIT REPORT
══════════════════════════════════════════════════════════════════════

📈 Summary:
   Total Questions:      723
   Unique Questions:     687
   Duplicates:           36
   Quality Issues:       12
   Duplicate Rate:       5.0%

📁 By File:
   interview-questions.csv                  150
   srt-situations.csv                       120
   wat-words.csv                            100
   ...

📝 By Question Type:
   Interview            150
   SRT                  120
   WAT                  100
   MCQ                   80
   ...

⚡ By Difficulty:
   Easy                 200 (27.7%)
   Medium               350 (48.4%)
   Hard                 173 (23.9%)

💡 Recommendations:
   ⚠️  Remove 36 duplicate questions before import
   ⚠️  Fix 12 quality issues before import
   
   Overall Quality Score: 8.7/10
```

**Action Items:**
- Review duplicate groups in the report
- Fix quality issues (missing IDs, empty questions, etc.)
- Re-run audit after fixes

---

### Step 2: Enhanced Import

```bash
npx ts-node scripts/enhanced-import.ts content/*.csv
```

**Output:**
```
🚀 THE FORGE — Enhanced Question Import
══════════════════════════════════════════════════════════════════════

📄 Parsing interview-questions.csv...
   ✅ Parsed 150 questions

📄 Parsing srt-situations.csv...
   ✅ Parsed 120 questions

📄 Parsing wat-words.csv...
   ✅ Parsed 100 questions

📊 Total questions from 3 file(s): 370

🔍 Validating 370 questions...
   ⚠️  INT-042: Question text is very short
   ⚠️  SRT-088: Unusual xp_reward: 5

✅ 368 valid questions

🔄 Removed 15 duplicates

⏳ Importing 353 questions in batches of 50...
   ✅ Batch 1: 50 questions
   ✅ Batch 2: 50 questions
   ✅ Batch 3: 50 questions
   ...
   ✅ Batch 8: 3 questions

📊 IMPORT STATISTICS
══════════════════════════════════════════════════════════════════════

📈 Overall:
   Total Records:        370
   Valid Records:        368
   Invalid Records:      2
   Duplicates Removed:   15
   Successfully Imported: 353
   Failed:               0

📝 By Question Type:
   Interview            148
   SRT                  118
   WAT                   87
   ...

⚡ By Difficulty:
   Easy                 95
   Medium               175
   Hard                 83

📚 By Category:
   Interview Prep                    148
   Psychological Tests               205
   ...

══════════════════════════════════════════════════════════════════════
✨ Success Rate: 95.4%
══════════════════════════════════════════════════════════════════════

📄 Import log saved: scripts/import-log-2026-06-19.json

✅ Import completed successfully
```

---

## Troubleshooting

### Common Issues

#### 1. Missing Environment Variables

**Error:**
```
❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY
```

**Solution:**
Check your `.env` file contains:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

#### 2. Invalid JSON in answer_data

**Error:**
```
⚠️  Invalid answer_data JSON for MCQ-042: {options:[...]}
```

**Solution:**
Ensure answer_data is valid JSON:
- Use double quotes for strings: `"options"`
- Escape quotes in CSV: `"{""options"":[""A"",""B""]}"`
- Validate with a JSON linter

---

#### 3. Invalid Question Type

**Error:**
```
MCQ-042: Invalid question_type: MultipleChoice
```

**Solution:**
Use exact question type names:
```
MCQ, SingleWord, Numeric, RapidResponse, TrueFalse, SRT, WAT, Interview
```

---

#### 4. Database Connection Failed

**Error:**
```
❌ Batch 1 failed: connection timeout
```

**Solution:**
1. Check Supabase project is running
2. Verify network connection
3. Check RLS policies allow insert
4. Try with smaller batch size:
   ```bash
   # Modify scripts/enhanced-import.ts
   await importQuestions(allQuestions, 25); // Smaller batches
   ```

---

## Verification

After import, verify questions in Supabase:

### SQL Query
```sql
-- Count by type
SELECT question_type, COUNT(*) 
FROM questions 
WHERE active = true 
GROUP BY question_type 
ORDER BY COUNT(*) DESC;

-- Sample questions
SELECT id, category, question_type, question 
FROM questions 
WHERE active = true 
LIMIT 10;

-- Check for missing answer_data
SELECT id, question_type 
FROM questions 
WHERE answer_data = '{}' OR answer_data IS NULL;
```

---

## Session Mapping

After import, questions are loaded by sessions:

### Session 1 (Day 0)
- **Type**: MCQ only
- **Count**: 10 questions
- **Function**: `get_session_questions(['MCQ'], 10)`

### Session 2
- **Types**: Mixed (MCQ, SingleWord, Numeric, RapidResponse, TrueFalse)
- **Count**: 20 questions
- **Function**: `get_mixed_session_questions({MCQ: 6, SingleWord: 4, Numeric: 4, RapidResponse: 4, TrueFalse: 2})`

### Session 3
- **Types**: SRT, WAT, Interview
- **Count**: 10 questions
- **Function**: `get_session_questions(['SRT', 'WAT', 'Interview'], 10)`

---

## Best Practices

### Content Quality

1. **Question Text**
   - Clear and concise
   - 10-500 characters
   - No spelling/grammar errors

2. **Answer Data**
   - Complete and valid JSON
   - Correct field names
   - Sensible values

3. **Difficulty Distribution**
   - Easy: 25-30%
   - Medium: 45-50%
   - Hard: 20-25%

4. **Category Balance**
   - Avoid overloading one category
   - Ensure variety across sessions
   - Tag properly for filtering

### Import Workflow

1. **Always audit first** — Fix issues before importing
2. **Test with sample** — Import 10-20 questions first
3. **Verify in database** — Check questions loaded correctly
4. **Test in app** — Play through sessions
5. **Full import** — Import remaining content
6. **Monitor errors** — Check import logs

---

## Support

For issues or questions:

1. Check import logs: `scripts/import-log-*.json`
2. Review audit report: `CONTENT_AUDIT_REPORT_*.md`
3. Verify database schema: `supabase/migrations/002_question_bank.sql`
4. Test individual questions in Supabase SQL Editor

---

**Last Updated**: June 19, 2026
