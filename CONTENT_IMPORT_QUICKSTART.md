# Content Import Quick Start

**Goal**: Import your CSV content files into The Forge database in 4 steps.

---

## Prerequisites

✅ You have CSV files with content  
✅ Supabase project is set up  
✅ `.env` file contains Supabase credentials  
✅ Database migration `002_question_bank.sql` has been applied

---

## Step 1: Organize Your CSV Files

Create a `content/` folder and place your CSV files there:

```
content/
├── interview-questions.csv
├── srt-situations.csv
├── wat-words.csv
├── tat-situations.csv
├── oir-tests.csv
├── group-discussion.csv
├── lecturette.csv
└── self-description.csv
```

---

## Step 2: Check CSV Format

Your CSV files should have these columns:

```
id,category,subcategory,difficulty,question_type,question,prompt,answer_data,xp_reward,time_limit,tags,source,active
```

**If your CSV format is different**, use the prepare script:

```bash
npx ts-node scripts/prepare-csv.ts content/old-format.csv content/new-format.csv
```

This will auto-detect fields and transform to the correct format.

---

## Step 3: Run Content Audit

Before importing, check for duplicates and quality issues:

```bash
npx ts-node scripts/content-audit.ts content/*.csv
```

**Review the output:**
- Total questions found
- Duplicate count
- Quality issues

**Fix any critical issues** in your CSV files, then re-run the audit.

**A report will be saved**: `CONTENT_AUDIT_REPORT_YYYY-MM-DD.md`

---

## Step 4: Import Content

Import all CSV files into the database:

```bash
npx ts-node scripts/enhanced-import.ts content/*.csv
```

**This will:**
- Validate all questions
- Remove duplicates automatically
- Import in batches
- Show statistics

**Expected output:**
```
✅ 687 valid questions
🔄 Removed 36 duplicates
⏳ Importing 651 questions...
   ✅ Batch 1: 50 questions
   ✅ Batch 2: 50 questions
   ...
   
📊 IMPORT STATISTICS
   Successfully Imported: 651
   Failed: 0
   
✅ Import completed successfully
```

**A log will be saved**: `scripts/import-log-YYYY-MM-DD.json`

---

## Step 5: Verify in Database

Open Supabase SQL Editor and run:

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
```

**Expected result:**
```
question_type  | count
---------------|------
Interview      | 150
SRT            | 120
WAT            | 100
MCQ            | 80
...
```

---

## Troubleshooting

### ❌ Missing environment variables

**Solution**: Check `.env` file:
```bash
type .env
```

Should contain:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

---

### ❌ CSV parse error

**Solution**: Use the prepare script to normalize format:
```bash
npx ts-node scripts/prepare-csv.ts content/problem-file.csv content/fixed-file.csv
```

---

### ❌ Invalid answer_data JSON

**Solution**: Ensure answer_data is valid JSON in your CSV:
```csv
"{""options"":[""A"",""B""],""correctIndex"":0}"
```

Note the escaped double quotes.

---

### ❌ Database connection failed

**Solution**: 
1. Check Supabase project is running
2. Verify credentials in `.env`
3. Check RLS policies allow insert

---

## Next Steps

After successful import:

1. **Test in app** — Run sessions to load questions
2. **Update session files** — Replace mock data with database calls
3. **Monitor analytics** — Track question performance
4. **Add more content** — Import additional CSV files anytime

---

## Common Commands

```bash
# Audit single file
npx ts-node scripts/content-audit.ts content/interview.csv

# Audit all files
npx ts-node scripts/content-audit.ts content/*.csv

# Prepare CSV format
npx ts-node scripts/prepare-csv.ts input.csv output.csv

# Import single file
npx ts-node scripts/enhanced-import.ts content/interview.csv

# Import all files
npx ts-node scripts/enhanced-import.ts content/*.csv

# Check database
psql -h your-db.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM questions;"
```

---

## Files Created

After running the import process, you'll have:

- `CONTENT_AUDIT_REPORT_YYYY-MM-DD.md` — Audit results
- `scripts/import-log-YYYY-MM-DD.json` — Import statistics
- Database populated with questions

---

## Support

For detailed information, see:
- `CONTENT_IMPORT_GUIDE.md` — Complete guide
- `scripts/questions-template.csv` — Format examples
- `CONTENT_MIGRATION_PLAN.md` — Migration strategy

---

**Ready to import? Start with Step 1!**
