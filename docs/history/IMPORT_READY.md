# Import Ready - Final Steps

## Status: Ready to Import Real Content

### What's Prepared:

1. ✅ **Import Script Created** (`scripts/import-master-content.js`)
   - Reads Forge-Master-Content.csv
   - Maps content types correctly
   - Handles all 7 content types
   - Generates statistics

2. ✅ **Session 1 Updated** (already uses database)

3. ✅ **Database Schema Ready** (questions table exists)

### Required Manual Steps:

#### Step 1: Create the CSV File

You have the `Forge-Master-Content.csv` document attached. Save it as:
```
scripts/Forge-Master-Content.csv
```

The file should contain all rows starting with:
```
forge_id,content_type,category,title_or_question,difficulty,status
SD001,Self Description,Self Opinion,What do you think of yourself?,Medium,approved
...
```

#### Step 2: Apply Database Migration (if not done)

If the `questions` table doesn't exist:
1. Go to Supabase Dashboard → SQL Editor
2. Copy from `supabase/migrations/002_question_bank.sql`
3. Execute it

#### Step 3: Run Import

```bash
node scripts/import-master-content.js
```

**Expected Output:**
```
Parsed XXX records from CSV
Converted XXX approved records to questions

Content breakdown:
  OIR: 63
  SRT: 152
  WAT: 300
  TAT: 26
  Interview: XXX
  Group Discussion: 5
  Lecturette: 122
  Self Description: 10

Importing to Supabase...
  ✅ Batch 1: 50 questions
  ✅ Batch 2: 50 questions
  ...

📊 Import Statistics:
  Total imported: XXX
  Failed: 0
  Duplicates removed: 0

📋 Count by Content Type:
  OIR: 63
  SRT: 152
  WAT: 300
  TAT: 26
  Interview: XXX
  Group Discussion: 5
  Lecturette: 122
  Self Description: 10

🔍 Verifying database...
  Total active records in database: XXX

📋 Database Records by Question Type:
  MCQ: XX
  SRT: 152
  WAT: 300
  Interview: XXX

✅ Import complete!
```

#### Step 4: Test Session 1

```bash
npm start
```

Navigate to Day 0 → Session 1

**Verify:**
- [ ] Loading spinner appears
- [ ] Questions load from database
- [ ] First question shows database content
- [ ] Can complete session

**Capture Proof:**
- Question ID: _______
- Question text: _______
- Category: _______
- XP value: _______

#### Step 5: Update Session 2 & 3

Only after Session 1 is verified working.

---

## Content Type Mapping

| CSV content_type | Database question_type | Category |
|-----------------|------------------------|----------|
| OIR | MCQ | General Knowledge |
| SRT | SRT | Psychological Tests |
| WAT | WAT | Psychological Tests |
| TAT | Interview | Psychological Tests |
| Interview/Personal Interview | Interview | Interview Prep |
| Group Discussion | Interview | Communication |
| Lecturette | Interview | Communication |
| Self Description | Interview | Communication |

---

## Next Steps After Import Success:

1. Test Session 1 end-to-end
2. Update Session 2 to use database
3. Test Session 2 end-to-end
4. Update Session 3 to use database
5. Test Session 3 with AI evaluation
6. Verify XP system still works

**No mock data will be displayed after this.**
