# Import Your Forge Content — Step by Step

**You have 8 CSV files ready to import!**

---

## Files You Have

1. ✅ `Forge-Self-Description-Dataset.csv` (10 questions)
2. ✅ `Forge-Lecturette-Dataset.csv` (122 topics)
3. ✅ `Forge-GD-Dataset.csv` (5 topics)
4. ✅ `Forge-OIR-Dataset.csv` (63 questions)
5. ✅ `Forge-TAT-Dataset.csv` (26 themes)
6. ⏳ Interview Questions (waiting for upload)
7. ⏳ SRT Situations (waiting for upload)
8. ⏳ WAT Words (waiting for upload)

**Total so far**: ~226 questions + 3 more files coming

---

## Step 1: Create Folders

```bash
# In your project root
mkdir raw-data
mkdir content
```

---

## Step 2: Place Your CSV Files

Put all 8 CSV files in the `raw-data/` folder:

```
forge/
├── raw-data/                              ← YOUR CSV FILES HERE
│   ├── Forge-Self-Description-Dataset.csv
│   ├── Forge-Lecturette-Dataset.csv
│   ├── Forge-GD-Dataset.csv
│   ├── Forge-OIR-Dataset.csv
│   ├── Forge-TAT-Dataset.csv
│   ├── Forge-Interview-Dataset.csv        ← Upload when ready
│   ├── Forge-SRT-Dataset.csv              ← Upload when ready
│   └── Forge-WAT-Dataset.csv              ← Upload when ready
├── content/                               ← Converted files go here
├── scripts/
└── ...
```

---

## Step 3: Install Dependencies

```bash
npm install
```

This installs:
- `csv-parse` — CSV reading
- `csv-stringify` — CSV writing
- `ts-node` — TypeScript execution
- `@types/node` — Node types

---

## Step 4: Convert Your CSV Files

Your CSV files have custom formats, so we need to convert them first:

```bash
npx ts-node scripts/convert-forge-csvs.ts raw-data content
```

**This will:**
- Read all CSV files from `raw-data/`
- Convert to standard format
- Save to `content/` folder

**Example output:**
```
📄 Processing Forge-Self-Description-Dataset.csv...
   Found 10 records
   ✅ Converted 10 records
   💾 Saved to Self-Description.csv

📄 Processing Forge-Lecturette-Dataset.csv...
   Found 122 records
   ✅ Converted 122 records
   💾 Saved to Lecturette.csv

...

✅ Conversion complete!
   Total records converted: 700+
   Output folder: content
```

---

## Step 5: Test Database Connection

```bash
npx ts-node scripts/test-import.ts
```

**This checks:**
- ✓ Database connection works
- ✓ Questions table exists
- ✓ RPC functions work

**If tests fail**, fix issues before proceeding.

---

## Step 6: Run Content Audit

```bash
npx ts-node scripts/content-audit.ts content/*.csv
```

**This will:**
- Count total questions
- Detect duplicates
- Identify quality issues
- Generate report: `CONTENT_AUDIT_REPORT_YYYY-MM-DD.md`

**Review the report** and fix any critical issues.

---

## Step 7: Import Content

```bash
npx ts-node scripts/enhanced-import.ts content/*.csv
```

**This will:**
- Validate all questions
- Remove duplicates automatically
- Import to database in batches
- Show detailed statistics
- Save log: `scripts/import-log-YYYY-MM-DD.json`

**Expected output:**
```
✅ 700 valid questions
🔄 Removed 36 duplicates
⏳ Importing 664 questions...
   ✅ Batch 1: 50 questions
   ✅ Batch 2: 50 questions
   ...

📊 IMPORT STATISTICS
   Successfully Imported: 664
   Failed: 0

✅ Import completed successfully
```

---

## Step 8: Verify in Database

Open Supabase SQL Editor and run:

```sql
-- Count by type
SELECT question_type, COUNT(*) 
FROM questions 
WHERE active = true 
GROUP BY question_type 
ORDER BY COUNT(*) DESC;
```

**Expected result:**
```
question_type  | count
---------------|------
Interview      | 300+  (Self Description + Lecturette + GD + Interview)
SRT            | 150+  (SRT + TAT themes)
WAT            | 100+
SingleWord     | 60+   (OIR questions)
```

---

## Step 9: Update Session Files

Now that database has content, update the app to load from database:

### Session 1 (Day 0)
File: `app/day0-prototype.tsx`

**Add imports:**
```typescript
import { getSession1Questions } from '../src/services/content.service';
import type { MCQQuestion } from '../src/types/questions';
```

**Replace hardcoded questions with database loading**
(See `CONTENT_MIGRATION_PLAN.md` Phase 3 for detailed code)

### Session 2
File: `app/session2.tsx`

**Add imports:**
```typescript
import { getSession2Questions } from '../src/services/content.service';
```

**Replace hardcoded questions with database loading**
(See `CONTENT_MIGRATION_PLAN.md` Phase 4 for detailed code)

### Session 3
File: `app/session3.tsx`

**Add imports:**
```typescript
import { getSession3Questions } from '../src/services/content.service';
```

**Replace hardcoded questions with database loading**
(See `CONTENT_MIGRATION_PLAN.md` Phase 5 for detailed code)

---

## Step 10: Test in App

```bash
npm start
```

**Test checklist:**
- [ ] Session 1 loads questions
- [ ] Session 2 loads mixed questions
- [ ] Session 3 loads SRT/WAT/Interview
- [ ] AI evaluation works
- [ ] XP awarded correctly
- [ ] Progress saved
- [ ] Analytics fire

---

## Step 11: Clean Up (After Verification)

Once everything works:

```bash
# Delete mock files
rm src/data/day0-mock.ts
rm src/data/session2-mock.ts
rm src/data/session3-mock.ts
```

---

## Question Type Mapping

Your CSV files will be converted to these question types:

| Your File | Question Type | Category | Count |
|-----------|---------------|----------|-------|
| Self Description | Interview | Communication | 10 |
| Lecturette | Interview | Communication | 122 |
| Group Discussion | Interview | GTO Tasks | 5 |
| OIR | SingleWord | SSB Fundamentals | 63 |
| TAT | SRT | Psychological Tests | 26 |
| Interview | Interview | Interview Prep | TBD |
| SRT | SRT | Psychological Tests | TBD |
| WAT | WAT | Psychological Tests | TBD |

---

## Troubleshooting

### Missing environment variables

**Check `.env` file:**
```bash
type .env
```

Should have:
```
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

### Conversion errors

**Review raw CSV file** — check for:
- Missing required columns
- Invalid status values
- Malformed data

---

### Import fails

**Check Supabase:**
1. Migration `002_question_bank.sql` applied?
2. RLS policies allow insert?
3. Network connection working?

---

## Summary

**Commands to run:**

```bash
# 1. Install
npm install

# 2. Convert
npx ts-node scripts/convert-forge-csvs.ts raw-data content

# 3. Test
npx ts-node scripts/test-import.ts

# 4. Audit
npx ts-node scripts/content-audit.ts content/*.csv

# 5. Import
npx ts-node scripts/enhanced-import.ts content/*.csv

# 6. Verify
# (Run SQL query in Supabase)

# 7. Start app
npm start
```

---

## Current Status

✅ 5 CSV files uploaded  
⏳ Waiting for 3 more files (Interview, SRT, WAT)  
✅ Conversion script ready  
✅ Import system ready  

**Next**: Upload remaining 3 CSV files, then run conversion!

---

**Need help?** See:
- `CONTENT_IMPORT_GUIDE.md` — Complete reference
- `CONTENT_MIGRATION_PLAN.md` — Session integration details
- `CONTENT_IMPORT_QUICKSTART.md` — Quick reference
