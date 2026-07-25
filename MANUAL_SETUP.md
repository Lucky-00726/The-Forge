# Manual Database Setup Required

The `questions` table doesn't exist yet in your Supabase database. You need to apply the migration manually.

## Step 1: Apply Migration via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `xpfpvfnxvoxjosnvowub`
3. Navigate to **SQL Editor**
4. Copy the SQL from `supabase/migrations/002_question_bank.sql`
5. Paste and execute it

## Step 2: Run Import Script

After the migration is applied, run:

```bash
node scripts/run-import.js
```

## Expected Output:

```
Parsed 8 questions
Importing to Supabase...
Import successful!

Verifying import...
Total active questions: 8

Breakdown by type:
  MCQ: 1
  SRT: 1
  WAT: 1
  Numeric: 1
  SingleWord: 1
  RapidResponse: 1
  TrueFalse: 1
  Interview: 1

✅ Done!
```

## Step 3: Test Session 1

```bash
npm start
```

Navigate to Day 0 → Session 1 and verify questions load from database.

---

**Note:** The migration file is located at:
`supabase/migrations/002_question_bank.sql`
