# Next Steps: Content Import

**Created**: June 19, 2026  
**Status**: Ready to Execute

---

## What Just Happened

I've created a complete CSV import system with:

✅ **Enhanced import script** — Validates, deduplicates, imports  
✅ **Content audit script** — Pre-import analysis  
✅ **CSV preparation script** — Format transformation  
✅ **Test script** — Verify system works  
✅ **Complete documentation** — Guides and references  

---

## Your CSV Files

You mentioned having CSV files for:
- Interview Questions
- SRT (Situation Reaction Tests)
- WAT (Word Association Tests)
- TATOI
- Group Discussion
- Lecturette
- Self Description

**Where are they?**

I don't see them in the repository yet. You'll need to:

1. **Create a folder**: `content/` in the project root
2. **Place your CSV files** there
3. **Run the import process**

---

## Do This Now

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `csv-parse` — CSV parsing
- `csv-stringify` — CSV generation
- `ts-node` — TypeScript execution
- `@types/node` — Node.js types

---

### Step 2: Test the System

```bash
npx ts-node scripts/test-import.ts
```

This will:
- ✓ Check database connection
- ✓ Verify questions table exists
- ✓ Test RPC functions
- ✓ Show current content count

**If tests fail**, fix issues before proceeding.

---

### Step 3: Place Your CSV Files

Create a `content/` folder:

```
forge/
├── content/                    ← CREATE THIS
│   ├── interview-questions.csv
│   ├── srt-situations.csv
│   ├── wat-words.csv
│   ├── tat-situations.csv
│   ├── oir-tests.csv
│   ├── group-discussion.csv
│   ├── lecturette.csv
│   └── self-description.csv
├── scripts/
├── app/
└── ...
```

---

### Step 4: Check CSV Format

Your CSV files should have these columns:

```
id,category,subcategory,difficulty,question_type,question,prompt,answer_data,xp_reward,time_limit,tags,source,active
```

**If format is different**, use the prepare script:

```bash
npx ts-node scripts/prepare-csv.ts content/old-format.csv content/new-format.csv
```

**See example**: `scripts/questions-template.csv`

---

### Step 5: Run Content Audit

```bash
npx ts-node scripts/content-audit.ts content/*.csv
```

**This will:**
- Count total questions
- Detect duplicates
- Identify quality issues
- Generate report

**Review the report**: `CONTENT_AUDIT_REPORT_YYYY-MM-DD.md`

**Fix critical issues** in your CSV files.

---

### Step 6: Import Content

```bash
npx ts-node scripts/enhanced-import.ts content/*.csv
```

**This will:**
- Validate all questions
- Remove duplicates automatically
- Import to database
- Show statistics
- Save log

**Expected output**:
```
✅ 687 valid questions
🔄 Removed 36 duplicates
⏳ Importing 651 questions...
   ✅ Batch 1: 50 questions
   ✅ Batch 2: 50 questions
   ...
   
✅ Import completed successfully
```

---

### Step 7: Verify in Database

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

---

## After Import

### Update Session Files

Replace hardcoded mock data with database loading:

#### 1. Session 1 (`app/day0-prototype.tsx`)
- Import: `import { getSession1Questions } from '../src/services/content.service'`
- Load: `const { data } = await getSession1Questions()`
- Remove: `import { DAY0_QUESTIONS } from '../src/data/day0-mock'`

#### 2. Session 2 (`app/session2.tsx`)
- Import: `import { getSession2Questions } from '../src/services/content.service'`
- Load: `const { data } = await getSession2Questions()`
- Remove: `import { SESSION2_QUESTIONS } from '../src/data/session2-mock'`

#### 3. Session 3 (`app/session3.tsx`)
- Import: `import { getSession3Questions } from '../src/services/content.service'`
- Load: `const { data } = await getSession3Questions()`
- Remove: `import { SESSION3_QUESTIONS } from '../src/data/session3-mock'`

**See**: `CONTENT_MIGRATION_PLAN.md` for detailed integration steps

---

### Test in App

1. **Run app**: `npm start`
2. **Play Session 1** — Verify MCQ questions load
3. **Play Session 2** — Verify mixed question types load
4. **Play Session 3** — Verify SRT/WAT/Interview load
5. **Check AI evaluation** — Verify feedback works
6. **Check XP calculation** — Verify points awarded correctly

---

### Clean Up (After Verification)

Once database content is working:

```bash
# Delete mock files
rm src/data/day0-mock.ts
rm src/data/session2-mock.ts
rm src/data/session3-mock.ts
```

**Important**: Keep mock files until you verify database content works perfectly.

---

## Troubleshooting

### Missing CSV Files

**Error**: `❌ Files not found`

**Solution**: Place CSV files in `content/` folder with proper names.

---

### Invalid CSV Format

**Error**: `❌ CSV parse error`

**Solution**: Use prepare script to normalize format:
```bash
npx ts-node scripts/prepare-csv.ts content/bad-format.csv content/fixed-format.csv
```

---

### Database Connection Failed

**Error**: `❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY`

**Solution**: Check `.env` file:
```bash
type .env
```

Should contain:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

### Migration Not Applied

**Error**: `❌ Table not found or not accessible`

**Solution**: 
1. Open Supabase SQL Editor
2. Run `supabase/migrations/002_question_bank.sql`
3. Verify: `SELECT COUNT(*) FROM questions`

---

## Documentation Files

### Quick Reference
- `CONTENT_IMPORT_QUICKSTART.md` — 4-step guide
- `CONTENT_IMPORT_SUMMARY.md` — System overview
- `NEXT_STEPS_CONTENT_IMPORT.md` — This file

### Complete Reference
- `CONTENT_IMPORT_GUIDE.md` — Full documentation
- `CONTENT_MIGRATION_PLAN.md` — Migration strategy
- `scripts/questions-template.csv` — Format examples

### Implementation
- `scripts/enhanced-import.ts` — Main import script
- `scripts/content-audit.ts` — Audit script
- `scripts/prepare-csv.ts` — Format conversion
- `scripts/test-import.ts` — System test

---

## Commands Cheat Sheet

```bash
# Install dependencies
npm install

# Test system
npx ts-node scripts/test-import.ts

# Prepare CSV format (if needed)
npx ts-node scripts/prepare-csv.ts input.csv output.csv

# Audit content
npx ts-node scripts/content-audit.ts content/*.csv

# Import content
npx ts-node scripts/enhanced-import.ts content/*.csv

# Start app
npm start
```

---

## Success Criteria

When you've successfully completed this:

✅ Dependencies installed  
✅ System tests pass  
✅ CSV files in `content/` folder  
✅ Audit report reviewed  
✅ Content imported to database  
✅ Verification queries run successfully  
✅ Sessions load questions from database  
✅ AI evaluation still works  
✅ XP system functions correctly  
✅ Mock files deleted  

---

## What I Need From You

**To proceed with import, I need:**

1. **Your CSV files** — Place them in the repository or share them with me
2. **CSV format confirmation** — Do they match the required format?
3. **Any format variations** — Different column names? Different structure?

**Once you provide the CSV files, I can:**
- Review their format
- Run the audit
- Help fix any issues
- Execute the import
- Verify the results

---

## Ready to Import?

**If you have CSV files ready:**

1. Create `content/` folder
2. Place CSV files there
3. Run: `npm install`
4. Run: `npx ts-node scripts/test-import.ts`
5. Run: `npx ts-node scripts/content-audit.ts content/*.csv`
6. Fix any issues from audit
7. Run: `npx ts-node scripts/enhanced-import.ts content/*.csv`

**If you need help with CSV format:**

Share a sample of your CSV structure and I'll help adapt the import script.

---

**Next Action**: Place CSV files in `content/` folder and run test script.
