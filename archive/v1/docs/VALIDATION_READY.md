# ✅ VALIDATION TESTS READY

**Status:** Ready for Execution  
**Date:** June 13, 2026

---

## What Was Delivered

### 🧪 Test Suite
**`VALIDATION_TEST_SUITE.sql`** — Automated test script
- 10 comprehensive tests
- Automatic pass/fail detection
- Detailed output logging
- Single script execution (~30 seconds)

### 📋 Manual Test Guide
**`VALIDATION_MANUAL_TESTS.md`** — Step-by-step instructions
- Individual test procedures
- Expected results for each test
- Copy-paste SQL commands
- Troubleshooting guidance

### 📊 Results Template
**`VALIDATION_RESULTS_TEMPLATE.md`** — Documentation template
- Test result recording form
- Pass/fail checklist
- Issue tracking section
- Approval sign-off

---

## Quick Start

### Step 1: Get Your User UUID
```sql
SELECT id, email FROM auth.users LIMIT 5;
```

### Step 2: Run Automated Tests
1. Open `VALIDATION_TEST_SUITE.sql`
2. Replace `YOUR-USER-UUID-HERE` with your UUID (line 16)
3. Copy entire file
4. Paste in Supabase SQL Editor → Run
5. Wait 30 seconds for results

### Step 3: Verify All Tests Pass
Look for 10× `✅ PASS` in results

### Step 4: Fill Results Template
Use `VALIDATION_RESULTS_TEMPLATE.md`

### Step 5: Confirm Approval
All tests must pass before Phase 2

---

## Tests Covered

| # | Test | Validates |
|---|---|---|
| 1 | Server-Authoritative XP | XP fetched from DB, not client |
| 2 | Featured Mission Selection | Server picks highest XP |
| 3 | Training Mission XP | 50% calculation correct |
| 4 | One Featured Per Day | Enforcement works |
| 5 | Multiple Missions Per Day | 5 missions completable |
| 6 | Duplicate Prevention | Cannot complete same mission 2× |
| 7 | Total XP Calculation | Sum matches user.total_xp |
| 8 | Streak Calculation | Increments on first mission |
| 9 | Rank Progression | Cadet → Officer → Commander |
| 10 | Featured Determinism | Consistent across calls |

---

## Expected Results Summary

**After running W1D1 missions (5 total):**
- Featured: W1D1-OT (60 XP @ 100%) = 60 XP
- Training: W1D1-COM (50 XP @ 50%) = 25 XP
- Training: W1D1-CONF (40 XP @ 50%) = 20 XP
- Training: W1D1-LEAD (30 XP @ 50%) = 15 XP
- Training: W1D1-AWR (40 XP @ 50%) = 20 XP
- **Total: 140 XP**

**User state:**
- total_xp: 140
- current_rank: Cadet
- current_streak: 1
- Completions today: 5
- Featured completions: 1

---

## Critical Success Criteria

All of these must be TRUE:

✅ Server determines XP (client cannot manipulate)  
✅ Server determines featured (client cannot lie)  
✅ Only 1 featured mission per day  
✅ Training missions get 50% XP  
✅ Can complete 5 missions in one day  
✅ Cannot complete same mission twice  
✅ XP totals are accurate  
✅ Streak logic works  
✅ Rank thresholds work  
✅ Featured selection is deterministic

---

## Files Ready for Testing

```
VALIDATION_TEST_SUITE.sql          ← Run this in Supabase
VALIDATION_MANUAL_TESTS.md         ← Alternative manual approach
VALIDATION_RESULTS_TEMPLATE.md     ← Fill this after testing
```

---

## After Testing

### If All Tests Pass:
1. Fill out `VALIDATION_RESULTS_TEMPLATE.md`
2. Confirm: "All 10 tests passed"
3. I will proceed to Phase 2

### If Any Test Fails:
1. Fill out template with failure details
2. Copy error messages
3. Check Supabase logs
4. Report which test failed and why
5. **Do NOT proceed to Phase 2**

---

## Time Estimate

- **Automated tests:** 5 minutes
- **Manual verification:** 10 minutes
- **Fill template:** 5 minutes
- **Total:** ~20 minutes

---

## Next Step

**Run the tests now:**

```bash
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Open VALIDATION_TEST_SUITE.sql
# 4. Replace YOUR-USER-UUID-HERE with your UUID
# 5. Run the script
# 6. Review results
```

---

**I am blocked on Phase 2 until you confirm all tests pass.**
