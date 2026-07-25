# The Forge — Content Pipeline

## Structure

```
content/
  session1/    ← MCQ questions for Session 1 (SSB Fundamentals)
  session2/    ← Mixed objective questions for Session 2
  session3/    ← Subjective questions for Session 3 (SRT, WAT, Interview)
```

## Adding questions

### Session 1 (MCQ)

Add a CSV file to `content/session1/` with these columns:

```
id,category,subcategory,difficulty,question_type,question,prompt,answer_data,xp_reward,time_limit,tags,source,active
```

- `id`: Unique. Use prefix `S1-` e.g. `S1-001`
- `question_type`: Must be `MCQ`
- `difficulty`: `Easy` | `Medium` | `Hard`
- `category`: Must be one of the 9 valid values (see below)
- `answer_data`: JSON `{"options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}`

### Session 2 (Mixed objective)

Add CSV files to `content/session2/`. Supported types:

| File | question_type | answer_data shape |
|---|---|---|
| `session2_mcq.csv` | `MCQ` | `{"options":[...],"correctIndex":N,"explanation":"..."}` |
| `session2_singleword.csv` | `SingleWord` | `{"correctAnswer":"...","acceptableAnswers":[...],"explanation":"..."}` |
| `session2_numeric.csv` | `Numeric` | `{"correctAnswer":N,"tolerance":N,"unit":"...","explanation":"..."}` |
| `session2_truefalse.csv` | `TrueFalse` | `{"correctAnswer":true/false,"explanation":"..."}` |
| `session2_rapidresponse.csv` | `RapidResponse` | `{"options":[...],"correctIndex":N,"explanation":"..."}` |

### Session 3 (Subjective)

Add CSV files to `content/session3/`. Supported types:

| Type | answer_data shape |
|---|---|
| `SRT` | `{"minWords":N,"evaluationCriteria":["...","..."]}` |
| `WAT` | `{"minWords":N,"evaluationCriteria":["...","..."]}` |
| `Interview` | `{"minWords":N,"evaluationCriteria":["...","..."]}` |

For Session 3 questions to appear in the session loader, Interview questions must have `"Personal Interview"` in their `tags` array.

## Valid category values

```
SSB Fundamentals
OLQs
Psychological Tests
GTO Tasks
Interview Prep
Leadership
Decision Making
Communication
General Knowledge
```

## Importing

```bash
# Validate before importing (no DB connection needed)
node scripts/validate-nlm-csvs.js

# Import to database
node scripts/import-nlm-session2.js
```

The import script is idempotent — running it twice is safe. Existing rows are upserted on `id`.

## Rollback

```sql
-- Remove all questions from a specific source
DELETE FROM questions WHERE source = 'Your Source Name';
```
