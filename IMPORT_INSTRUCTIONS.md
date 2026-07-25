# The Forge - Database Content Import Instructions

## Objective
Replace mock content with real database content for all Day 0 sessions.

## Current Status
- ✅ Database schema ready (migration 002_question_bank.sql)
- ✅ Content service ready to fetch from database
- ✅ Import script ready (scripts/import-to-questions-table.ts)
- ✅ CSV template with 8 sample questions (scripts/questions-template.csv)
- ⏳ **Next: Run import and update screens**

---

## Step 1: Install Dependencies

```bash
npm install dotenv
```

---

## Step 2: Run the Import Script

This will import questions from `scripts/questions-template.csv` into your Supabase `questions` table.

```bash
npx ts-node scripts/import-to-questions-table.ts
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
THE FORGE — Import Questions to Database
═══════════════════════════════════════════════════════════

📂 Reading scripts/questions-template.csv...
   Found 8 rows in CSV
   ✅ Parsed 8 questions from CSV

📦 Importing 8 questions into 'questions' table...

✅ 8 valid questions to import
   📤 Uploading batch 1...
   ✅ Batch 1: 8 questions imported

📊 Import Summary:
   ✅ Imported: 8
   ❌ Failed: 0
   ⚠️  Invalid: 0
   📝 Total: 8

🔍 Verifying imported content...
   ✅ MCQ: 1 questions
   ✅ SingleWord: 1 questions
   ✅ Numeric: 1 questions
   ✅ RapidResponse: 1 questions
   ✅ TrueFalse: 1 questions
   ✅ SRT: 1 questions
   ✅ WAT: 1 questions
   ✅ Interview: 1 questions

   📊 Total active questions in database: 8

═══════════════════════════════════════════════════════════
✅ Import complete!
═══════════════════════════════════════════════════════════
```

---

## Step 3: Verify Database Content

### Option A: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `xpfpvfnxvoxjosnvowub`
3. Navigate to **Table Editor** → **questions**
4. Verify 8 rows exist with various question types

### Option B: Via SQL Query
Run this in Supabase SQL Editor:

```sql
SELECT question_type, COUNT(*) as count
FROM questions
WHERE active = true
GROUP BY question_type
ORDER BY question_type;
```

Expected result: 1 question for each type (MCQ, SingleWord, Numeric, etc.)

---

## Step 4: Update Session Screens to Use Database

The session screens need to be updated to fetch from the database instead of mock data files.

### Session 1 (day0-prototype.tsx)
**Current:** Imports from `../src/data/day0-mock`  
**Target:** Use `getSession1Questions()` from content.service

### Session 2 (session2.tsx)
**Current:** Imports from `../src/data/session2-mock`  
**Target:** Use `getSession2Questions()` from content.service

### Session 3 (session3.tsx)
**Current:** Imports from `../src/data/session3-mock`  
**Target:** Use `getSession3Questions()` from content.service

---

## Step 5: Test End-to-End

### Test Session 1
1. Start the app: `npm start`
2. Navigate to Day 0 → Session 1
3. **Expected:** Load 10 MCQ questions from database
4. Complete all questions
5. **Expected:** See results screen with XP earned

### Test Session 2
1. Navigate to Day 0 → Session 2
2. **Expected:** Load mixed question types from database
3. Complete all questions
4. **Expected:** See results with session complete message

### Test Session 3
1. Navigate to Day 0 → Session 3
2. **Expected:** Load subjective questions (SRT, WAT, Interview)
3. Complete all questions
4. **Expected:** AI evaluation runs and shows results

---

## Troubleshooting

### Issue: Import script fails with "Missing SUPABASE_URL"
**Solution:** Ensure `.env` file exists with:
```
EXPO_PUBLIC_SUPABASE_URL=https://xpfpvfnxvoxjosnvowub.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Issue: "No questions available" in session screens
**Solution:** 
1. Check database has content: Run Step 3 verification
2. Check RLS policies: Ensure you're authenticated
3. Check console logs for database errors

### Issue: Session screens still show mock data
**Solution:** The screens haven't been updated yet. Follow Step 4 to update them.

---

## Success Criteria

✅ **Database populated:** 8+ questions in `questions` table  
✅ **Session 1 working:** Loads questions from database  
✅ **Session 2 working:** Loads mixed questions from database  
✅ **Session 3 working:** Loads subjective questions + AI evaluation  
✅ **User completes Day 0:** All 3 sessions work end-to-end  

---

## Next Steps After Success

1. **Add more content:** Expand `questions-template.csv` with more questions
2. **Re-import:** Run import script again to add new questions
3. **Test randomization:** Verify different questions appear each session
4. **Remove mock files:** Delete `src/data/*-mock.ts` files once confirmed working

---

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/import-to-questions-table.ts` | Import script |
| `scripts/questions-template.csv` | Source CSV with questions |
| `src/services/content.service.ts` | Database fetch functions |
| `supabase/migrations/002_question_bank.sql` | Database schema |
| `app/day0-prototype.tsx` | Session 1 screen (needs update) |
| `app/session2.tsx` | Session 2 screen (needs update) |
| `app/session3.tsx` | Session 3 screen (needs update) |

---

**Ready to proceed with Step 2!**
