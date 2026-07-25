# ROLLBACK INSTRUCTIONS
## How to Undo Migration 004_mission_library_secure.sql

**File:** `ROLLBACK_004_mission_library_secure.sql`  
**Purpose:** Restore database to pre-migration state if issues occur

---

## ⚠️ WARNING: Data Loss

**Rollback will DELETE:**
- All `is_featured` data (featured vs training distinction lost)
- Multiple missions completed per day (only first completion kept)

**Example:**
- User completed 5 missions today
- After rollback: Only 1 mission remains (first completed)
- 4 mission completions **PERMANENTLY DELETED**

---

## When to Use Rollback

**Use rollback if:**
- ✅ Migration causes errors
- ✅ App crashes after migration
- ✅ Tests fail consistently
- ✅ Performance issues detected
- ✅ Need to revert to stable state

**Do NOT use rollback if:**
- ❌ Tests are still in progress
- ❌ Only 1-2 test failures (debug first)
- ❌ Users have completed multiple missions (data loss)

---

## Pre-Rollback Checklist

Before running rollback:

1. **Backup current state:**
```sql
-- Export mission_completions
COPY (SELECT * FROM mission_completions) TO '/tmp/completions_backup.csv' CSV HEADER;

-- Export users
COPY (SELECT * FROM users) TO '/tmp/users_backup.csv' CSV HEADER;
```

2. **Document issue:**
- What error occurred?
- Which test failed?
- Error message from logs?

3. **Confirm need:**
- Can issue be fixed without rollback?
- Is data loss acceptable?

---

## Rollback Execution

### Step 1: Open Supabase Dashboard
Navigate to: **SQL Editor** → **New Query**

### Step 2: Copy Rollback Script
Open: `ROLLBACK_004_mission_library_secure.sql`  
Copy: Entire file contents

### Step 3: Execute Rollback
1. Paste script into SQL Editor
2. Review warnings at top of script
3. Click **Run**
4. Wait for completion (~5 seconds)

### Step 4: Verify Rollback Success
```sql
-- Check constraint restored
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND constraint_name = 'uq_user_date';
-- Expected: 1 row (constraint exists)

-- Check column removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'mission_completions'
  AND column_name = 'is_featured';
-- Expected: 0 rows (column removed)

-- Check RPC signature restored
SELECT routine_name, pg_get_function_arguments(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'complete_mission';
-- Expected: (p_user_id uuid, p_mission_id text, p_responses jsonb, p_xp integer)
```

---

## What Rollback Does

### Schema Changes (Reverted):
1. ✅ Drops `mission_completions.is_featured` column
2. ✅ Drops `uq_user_mission_date` constraint
3. ✅ Restores `uq_user_date` constraint (1 mission/day)
4. ✅ Drops `idx_completions_user_date_featured` index
5. ✅ Restores `idx_completions_user_date` index

### Functions (Removed):
1. ✅ `get_featured_mission_id()` — Deleted
2. ✅ `has_completed_featured_today()` — Deleted
3. ✅ `get_today_completion_count()` — Deleted

### RPC (Restored):
1. ✅ `complete_mission()` — Restored to original signature
   - Accepts: `p_user_id`, `p_mission_id`, `p_responses`, `p_xp`
   - Returns: `xp_awarded`, `new_total_xp`, `new_streak`, `new_rank`

### Data Cleanup:
1. ⚠️ **Deletes duplicate completions per day** (keeps only first)
2. ⚠️ **Deletes is_featured column data**

---

## After Rollback

### Client Code Impact
**Current client code will BREAK** after rollback.

**Reason:** Client no longer passes `xp` and `isFeatured` parameters.

**Fix Required:**
1. Revert `src/services/mission.service.ts` to pre-security-fix version
2. Revert `src/hooks/useMissionEngine.ts` to pre-security-fix version
3. Client must pass `xp` and `isFeatured` again

**Alternative:** Keep client code, re-run migration 004 after fixing issues.

---

## Data Loss Example

**Before rollback:**
```
User: Alice
Date: 2026-06-13
Completions:
  - W1D1-OT (featured, 60 XP)
  - W1D1-COM (training, 25 XP)
  - W1D1-CONF (training, 20 XP)
  - W1D1-LEAD (training, 15 XP)
  - W1D1-AWR (training, 20 XP)
Total: 5 missions, 140 XP
```

**After rollback:**
```
User: Alice
Date: 2026-06-13
Completions:
  - W1D1-OT (60 XP)
Total: 1 mission, 60 XP ⚠️

LOST:
  - W1D1-COM (25 XP)
  - W1D1-CONF (20 XP)
  - W1D1-LEAD (15 XP)
  - W1D1-AWR (20 XP)

XP adjustment needed: -80 XP
```

**Manual XP correction required:**
```sql
-- Manually adjust user XP to compensate for lost completions
UPDATE users
SET total_xp = total_xp - 80  -- Subtract lost XP
WHERE id = '<user-uuid>';
```

---

## Rollback Verification Checklist

After rollback, verify:

- [ ] `uq_user_date` constraint exists
- [ ] `uq_user_mission_date` constraint removed
- [ ] `is_featured` column removed
- [ ] `get_featured_mission_id()` function removed
- [ ] `has_completed_featured_today()` function removed
- [ ] `get_today_completion_count()` function removed
- [ ] `complete_mission()` accepts 4 parameters (not 3)
- [ ] No errors in Supabase logs
- [ ] Test user can complete mission with old RPC signature

---

## Re-Migration After Rollback

If you need to re-apply migration 004 after fixing issues:

1. **Fix the issue** that caused rollback
2. **Update migration file** if needed
3. **Test on staging first**
4. **Re-run migration:** `004_mission_library_secure.sql`
5. **Re-deploy client code** (if reverted)

---

## Alternative: Partial Rollback

If only specific issue needs fixing, consider partial rollback:

**Example: Keep schema, only revert RPC:**
```sql
-- Just restore old RPC signature (keep schema changes)
-- Copy only STEP 2 from rollback script
```

**Consult before partial rollback** — may cause inconsistencies.

---

## Support

**If rollback fails:**
1. Copy error message
2. Check Supabase logs
3. Document state of database
4. Do NOT attempt fixes without backup

**Critical failure:**
- Restore from Supabase point-in-time backup
- Contact Supabase support if needed

---

*Keep this document accessible during migration. Review before executing rollback.*
