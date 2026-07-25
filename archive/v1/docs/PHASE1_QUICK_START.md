# PHASE 1: QUICK START GUIDE
## 5-Minute Testing & Approval

---

## Step 1: Run Migration (2 min)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Open file: `supabase/migrations/004_mission_library_phase1.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **Run**
7. Confirm: "Success. No rows returned"

---

## Step 2: Verify Schema (1 min)

Paste this into SQL Editor and run:

```sql
-- Should return 1 row with is_featured column
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'mission_completions'
  AND column_name = 'is_featured';
```

**Expected:** 1 row returned

---

## Step 3: Test Featured Mission (2 min)

### Get Your User UUID
```sql
SELECT id, display_name 
FROM auth.users 
LIMIT 5;
```
Copy your UUID.

### Complete Featured Mission (100% XP)
```sql
-- Replace <your-uuid> with your actual UUID
SELECT complete_mission(
  p_user_id := '<your-uuid>'::uuid,
  p_mission_id := 'W1D1-COM',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Testing","word_count":2}'::jsonb,
  p_xp := 50,
  p_is_featured := true
);
```

**Expected Result:**
```json
{
  "xp_awarded": 50,
  "is_featured": true,
  ...
}
```

### Complete Training Mission (50% XP)
```sql
SELECT complete_mission(
  p_user_id := '<your-uuid>'::uuid,
  p_mission_id := 'W1D1-CONF',
  p_responses := '{"type":"Reflect & Write","text":"Testing training","word_count":2}'::jsonb,
  p_xp := 40,
  p_is_featured := false
);
```

**Expected Result:**
```json
{
  "xp_awarded": 20,
  "is_featured": false,
  ...
}
```

---

## Step 4: Verify Results

```sql
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY is_featured DESC;
```

**Expected:**
| mission_id | xp_awarded | is_featured |
|---|---|---|
| W1D1-COM | 50 | true |
| W1D1-CONF | 20 | false |

---

## ✅ Success Criteria

- [x] Migration ran without errors
- [x] `is_featured` column exists
- [x] Featured mission gave 50 XP (100% of 50)
- [x] Training mission gave 20 XP (50% of 40)
- [x] Both missions stored correctly

---

## ❌ If Something Failed

1. Check **Supabase Dashboard → Logs → Postgres Logs**
2. Note the error message
3. Open `PHASE1_IMPLEMENTATION_REPORT.md` → Known Risks section
4. If needed, run rollback from report
5. Report issue with error details

---

## 🎯 After Testing Passes

**Approve Phase 1 for Phase 2:**

Type in chat: "Phase 1 tests passed. Proceed to Phase 2."

Phase 2 will implement:
- Mission Library UI
- Featured vs Training selection
- Dashboard integration
- Testing & validation

---

## 📄 Full Documentation

- **Complete Report:** `PHASE1_IMPLEMENTATION_REPORT.md`
- **Full Test Script:** `PHASE1_TEST_SCRIPT.sql`
- **Summary:** `PHASE1_SUMMARY.md`

---

*5-minute test complete. Ready for approval.*
