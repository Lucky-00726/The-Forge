-- ═══════════════════════════════════════════════════════════
-- PHASE 1 TESTING SCRIPT
-- Copy-paste sections into Supabase SQL Editor
-- Replace <your-test-user-uuid> with your actual user ID
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- SECTION 1: PRE-MIGRATION VERIFICATION
-- Run BEFORE executing migration
-- ───────────────────────────────────────────────────────────

-- Check current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mission_completions'
  AND table_schema = 'public'
ORDER BY ordinal_position;
-- Expected: NO is_featured column

-- Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND table_schema = 'public';
-- Expected: uq_user_date exists


-- ───────────────────────────────────────────────────────────
-- SECTION 2: RUN MIGRATION
-- Execute supabase/migrations/004_mission_library_phase1.sql
-- in Supabase Dashboard → SQL Editor
-- ───────────────────────────────────────────────────────────


-- ───────────────────────────────────────────────────────────
-- SECTION 3: POST-MIGRATION VERIFICATION
-- Run AFTER executing migration
-- ───────────────────────────────────────────────────────────

-- 3A. Verify is_featured column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'mission_completions'
  AND column_name = 'is_featured';
-- Expected: is_featured | boolean | NO | false

-- 3B. Verify new constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND constraint_name = 'uq_user_mission_date';
-- Expected: uq_user_mission_date | UNIQUE

-- 3C. Verify old constraint removed
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'mission_completions'
  AND constraint_name = 'uq_user_date';
-- Expected: 0 rows

-- 3D. Verify functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'complete_mission',
    'has_completed_featured_today',
    'get_today_completion_count'
  )
ORDER BY routine_name;
-- Expected: 3 rows

-- 3E. Verify RPC signature
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'complete_mission';
-- Expected: p_user_id uuid, p_mission_id text, p_responses jsonb, p_xp integer, p_is_featured boolean DEFAULT false

-- 3F. Verify index created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'mission_completions'
  AND indexname = 'idx_completions_user_date_featured';
-- Expected: 1 row


-- ───────────────────────────────────────────────────────────
-- SECTION 4: FUNCTIONAL TESTS
-- Replace <your-test-user-uuid> with actual UUID
-- ───────────────────────────────────────────────────────────

-- 4A. Get your user UUID (if you don't know it)
SELECT id, display_name, email
FROM auth.users
LIMIT 5;
-- Copy the UUID you want to test with

-- NOTE: Replace '<your-test-user-uuid>' in all queries below!


-- ───────────────────────────────────────────────────────────
-- TEST 1: Complete Featured Mission (100% XP)
-- ───────────────────────────────────────────────────────────

-- Call RPC
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>'::uuid,
  p_mission_id := 'W1D1-COM',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Test option","reasoning":"Testing featured mission completion","word_count":4}'::jsonb,
  p_xp := 50,
  p_is_featured := true
);
-- Expected: xp_awarded = 50, is_featured = true

-- Verify in database
SELECT mission_id, xp_awarded, is_featured, completed_date
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY id DESC
LIMIT 1;
-- Expected: W1D1-COM | 50 | true


-- ───────────────────────────────────────────────────────────
-- TEST 2: Complete Training Mission (50% XP)
-- ───────────────────────────────────────────────────────────

-- Call RPC
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>'::uuid,
  p_mission_id := 'W1D1-CONF',
  p_responses := '{"type":"Reflect & Write","text":"Testing training mission completion with some text to meet word count requirements","word_count":13}'::jsonb,
  p_xp := 40,
  p_is_featured := false
);
-- Expected: xp_awarded = 20 (50% of 40), is_featured = false

-- Verify in database
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY id DESC
LIMIT 1;
-- Expected: W1D1-CONF | 20 | false


-- ───────────────────────────────────────────────────────────
-- TEST 3: Duplicate Mission Prevention
-- ───────────────────────────────────────────────────────────

-- Try to complete W1D1-COM again
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>'::uuid,
  p_mission_id := 'W1D1-COM',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Duplicate","reasoning":"This should fail","word_count":3}'::jsonb,
  p_xp := 50,
  p_is_featured := true
);
-- Expected: xp_awarded = 0, already_completed = true

-- Verify only 1 completion for W1D1-COM today
SELECT COUNT(*)
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND mission_id = 'W1D1-COM'
  AND completed_date = CURRENT_DATE;
-- Expected: 1 (not 2)


-- ───────────────────────────────────────────────────────────
-- TEST 4: Helper Functions
-- ───────────────────────────────────────────────────────────

-- Check if featured completed today
SELECT has_completed_featured_today('<your-test-user-uuid>'::uuid);
-- Expected: true

-- Check completion count
SELECT get_today_completion_count('<your-test-user-uuid>'::uuid);
-- Expected: 2 (W1D1-COM + W1D1-CONF)

-- List completed mission IDs
SELECT mission_id, is_featured, xp_awarded
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE
ORDER BY is_featured DESC, mission_id;
-- Expected: 2 rows (1 featured, 1 training)


-- ───────────────────────────────────────────────────────────
-- TEST 5: XP Rounding for Training Missions
-- ───────────────────────────────────────────────────────────

-- Test 30 XP mission → 50% = 15 XP
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>'::uuid,
  p_mission_id := 'W1D1-LEAD',
  p_responses := '{"type":"Reflect & Write","text":"Testing XP rounding","word_count":3}'::jsonb,
  p_xp := 30,
  p_is_featured := false
);
-- Expected: xp_awarded = 15

-- Test 70 XP mission → 50% = 35 XP
SELECT complete_mission(
  p_user_id := '<your-test-user-uuid>'::uuid,
  p_mission_id := 'W1D2-LEAD',
  p_responses := '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Testing XP rounding","word_count":3}'::jsonb,
  p_xp := 70,
  p_is_featured := false
);
-- Expected: xp_awarded = 35

-- Verify rounding
SELECT mission_id, xp_awarded, is_featured
FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND mission_id IN ('W1D1-LEAD', 'W1D2-LEAD')
ORDER BY mission_id;
-- Expected: W1D1-LEAD = 15, W1D2-LEAD = 35


-- ───────────────────────────────────────────────────────────
-- TEST 6: User XP and Rank Update
-- ───────────────────────────────────────────────────────────

-- Check user's total XP
SELECT total_xp, current_rank, current_streak
FROM users
WHERE id = '<your-test-user-uuid>';
-- Expected: total_xp should reflect all awarded XP
-- From tests above: 50 + 20 + 15 + 35 = 120 XP (plus any previous)


-- ───────────────────────────────────────────────────────────
-- CLEANUP (Optional)
-- Remove test completions if you want to reset
-- ───────────────────────────────────────────────────────────

-- WARNING: This deletes test data. Only run if you want to reset.
/*
DELETE FROM mission_completions
WHERE user_id = '<your-test-user-uuid>'
  AND completed_date = CURRENT_DATE;

-- Reset user XP if needed
UPDATE users
SET total_xp = 0, current_rank = 'Cadet', current_streak = 0
WHERE id = '<your-test-user-uuid>';
*/


-- ═══════════════════════════════════════════════════════════
-- ALL TESTS COMPLETE
-- ═══════════════════════════════════════════════════════════
-- If all tests pass, Phase 1 is ready for Phase 2.
-- Report results in PHASE1_IMPLEMENTATION_REPORT.md checklist.
-- ═══════════════════════════════════════════════════════════
