-- ═══════════════════════════════════════════════════════════
-- VALIDATION TEST SUITE
-- Run this script in Supabase SQL Editor after migration
-- Tests all security fixes and functionality
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- SETUP: Get your test user UUID
-- ───────────────────────────────────────────────────────────
-- Run this first to get your user ID:
-- SELECT id, email, raw_user_meta_data->>'display_name' as display_name
-- FROM auth.users
-- LIMIT 5;

-- REPLACE THIS with your actual UUID:
\set test_user_id '''YOUR-USER-UUID-HERE'''

-- Example: \set test_user_id '''123e4567-e89b-12d3-a456-426614174000'''

-- ───────────────────────────────────────────────────────────
-- PRE-TEST CLEANUP
-- Clear today's completions for clean test
-- ───────────────────────────────────────────────────────────
DELETE FROM mission_completions
WHERE user_id = :test_user_id::uuid
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- Reset user state for consistent testing
UPDATE users
SET total_xp = 0,
    current_streak = 0,
    current_rank = 'Cadet',
    last_active_date = NULL
WHERE id = :test_user_id::uuid;

SELECT 'PRE-TEST CLEANUP COMPLETE' as status;

-- ═══════════════════════════════════════════════════════════
-- TEST 1: Server Determines XP (Cannot Be Manipulated)
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 1: Server-Authoritative XP ═══' as test_header;

-- Complete W1D1-COM mission (base XP = 50)
SELECT complete_mission(
  :test_user_id::uuid,
  'W1D1-COM',
  '{"type":"Poll + Reasoning","selected_option":"Test option","reasoning":"Testing server XP calculation","word_count":4}'::jsonb
);

-- Verify XP awarded matches missions table
SELECT 
  'TEST 1 RESULT' as test,
  CASE 
    WHEN mc.xp_awarded = m.xp_reward THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  mc.mission_id,
  m.xp_reward as expected_xp,
  mc.xp_awarded as actual_xp,
  mc.is_featured
FROM mission_completions mc
JOIN missions m ON m.id = mc.mission_id
WHERE mc.user_id = :test_user_id::uuid
  AND mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
  AND mc.mission_id = 'W1D1-COM';

-- ═══════════════════════════════════════════════════════════
-- TEST 2: Server Determines Featured Mission (Highest XP)
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 2: Server Determines Featured Mission ═══' as test_header;

-- W1D1 missions: COM(50), CONF(40), LEAD(30), AWR(40), OT(60)
-- Expected featured: OT (60 XP = highest)

-- Get featured mission ID for W1D1
SELECT 
  'TEST 2A: Featured Selection' as test,
  get_featured_mission_id(1, 1) as featured_mission_id,
  CASE 
    WHEN get_featured_mission_id(1, 1) = 'W1D1-OT' THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Complete the featured mission (OT)
SELECT complete_mission(
  :test_user_id::uuid,
  'W1D1-OT',
  '{"type":"Daily Challenge","completed":true,"reflection":"Testing featured mission"}'::jsonb
);

-- Verify it was marked as featured with 100% XP
SELECT 
  'TEST 2B: Featured Mission Completion' as test,
  CASE 
    WHEN mc.is_featured = true AND mc.xp_awarded = 60 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  mc.mission_id,
  mc.is_featured,
  mc.xp_awarded as actual_xp,
  60 as expected_xp
FROM mission_completions mc
WHERE mc.user_id = :test_user_id::uuid
  AND mc.mission_id = 'W1D1-OT'
  AND mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- ═══════════════════════════════════════════════════════════
-- TEST 3: Training Mission Gets 50% XP
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 3: Training Mission XP (50%) ═══' as test_header;

-- Complete W1D1-CONF as training mission (base XP = 40, expect 20)
SELECT complete_mission(
  :test_user_id::uuid,
  'W1D1-CONF',
  '{"type":"Reflect & Write","text":"Testing training mission XP calculation with sufficient word count","word_count":9}'::jsonb
);

-- Verify 50% XP calculation
SELECT 
  'TEST 3 RESULT' as test,
  CASE 
    WHEN mc.is_featured = false AND mc.xp_awarded = 20 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  mc.mission_id,
  mc.is_featured,
  40 as base_xp,
  20 as expected_xp,
  mc.xp_awarded as actual_xp
FROM mission_completions mc
WHERE mc.user_id = :test_user_id::uuid
  AND mc.mission_id = 'W1D1-CONF'
  AND mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- ═══════════════════════════════════════════════════════════
-- TEST 4: Enforce One Featured Per Day
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 4: One Featured Per Day Enforcement ═══' as test_header;

-- Already completed W1D1-OT as featured
-- Try to complete another high-XP mission (COM = 50 XP)
-- Should be marked as training, not featured

SELECT complete_mission(
  :test_user_id::uuid,
  'W1D1-COM',
  '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":1}'::jsonb
);

-- Verify only one featured mission exists
SELECT 
  'TEST 4 RESULT' as test,
  CASE 
    WHEN COUNT(*) FILTER (WHERE is_featured = true) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
  COUNT(*) as total_completions
FROM mission_completions
WHERE user_id = :test_user_id::uuid
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- ═══════════════════════════════════════════════════════════
-- TEST 5: Multiple Missions Per Day Allowed
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 5: Multiple Missions Per Day ═══' as test_header;

-- Complete remaining W1D1 missions (LEAD, AWR)
SELECT complete_mission(
  :test_user_id::uuid,
  'W1D1-LEAD',
  '{"type":"Reflect & Write","text":"Test","word_count":1}'::jsonb
);

SELECT complete_mission(
  :test_user_id::uuid,
  'W1D1-AWR',
  '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":1}'::jsonb
);

-- Verify 5 missions completed today
SELECT 
  'TEST 5 RESULT' as test,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as missions_completed,
  5 as expected_count
FROM mission_completions
WHERE user_id = :test_user_id::uuid
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- ═══════════════════════════════════════════════════════════
-- TEST 6: Duplicate Mission Prevention
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 6: Duplicate Mission Prevention ═══' as test_header;

-- Try to complete W1D1-COM again (already completed in Test 4)
DO $$
DECLARE
  v_result jsonb;
  v_already_completed boolean;
BEGIN
  SELECT complete_mission(
    :test_user_id::uuid,
    'W1D1-COM',
    '{"type":"Poll + Reasoning","selected_option":"Duplicate","reasoning":"This should fail","word_count":3}'::jsonb
  ) INTO v_result;
  
  v_already_completed := (v_result->>'already_completed')::boolean;
  
  RAISE NOTICE 'TEST 6 RESULT: %', 
    CASE WHEN v_already_completed = true THEN '✅ PASS' ELSE '❌ FAIL' END;
  RAISE NOTICE 'Already completed flag: %', v_already_completed;
END $$;

-- Verify still only 5 completions (no duplicate added)
SELECT 
  'TEST 6 VERIFICATION' as test,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as total_completions,
  5 as expected_count
FROM mission_completions
WHERE user_id = :test_user_id::uuid
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- ═══════════════════════════════════════════════════════════
-- TEST 7: XP Accumulation and Calculation
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 7: Total XP Calculation ═══' as test_header;

-- Calculate expected XP:
-- W1D1-OT: 60 (featured 100%)
-- W1D1-COM: 25 (training 50% of 50)
-- W1D1-CONF: 20 (training 50% of 40)
-- W1D1-LEAD: 15 (training 50% of 30)
-- W1D1-AWR: 20 (training 50% of 40)
-- Total expected: 140

SELECT 
  'TEST 7 RESULT' as test,
  CASE 
    WHEN u.total_xp = 140 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  u.total_xp as actual_total_xp,
  140 as expected_total_xp,
  (SELECT SUM(xp_awarded) FROM mission_completions 
   WHERE user_id = :test_user_id::uuid 
   AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date) as sum_from_completions
FROM users u
WHERE u.id = :test_user_id::uuid;

-- ═══════════════════════════════════════════════════════════
-- TEST 8: Streak Increment (First Mission of Day)
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 8: Streak Calculation ═══' as test_header;

-- Streak should be 1 (first mission today, no previous last_active_date)
SELECT 
  'TEST 8 RESULT' as test,
  CASE 
    WHEN u.current_streak = 1 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  u.current_streak as actual_streak,
  1 as expected_streak,
  u.last_active_date
FROM users u
WHERE u.id = :test_user_id::uuid;

-- ═══════════════════════════════════════════════════════════
-- TEST 9: Rank Progression (Cadet → Officer)
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 9: Rank Progression ═══' as test_header;

-- Current XP = 140, should still be Cadet (Officer at 400)
SELECT 
  'TEST 9A: Still Cadet at 140 XP' as test,
  CASE 
    WHEN u.current_rank = 'Cadet' THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  u.current_rank as actual_rank,
  'Cadet' as expected_rank,
  u.total_xp
FROM users u
WHERE u.id = :test_user_id::uuid;

-- Manually add XP to cross Officer threshold (need 260 more XP to reach 400)
UPDATE users
SET total_xp = 350
WHERE id = :test_user_id::uuid;

-- Complete one more mission to trigger rank recalculation
-- Use W1D2-COM (50 XP base, will be featured for W1D2)
SELECT complete_mission(
  :test_user_id::uuid,
  'W1D2-COM',
  '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test rank progression","word_count":3}'::jsonb
);

-- Should now be Officer (350 + 50 = 400)
SELECT 
  'TEST 9B: Officer at 400 XP' as test,
  CASE 
    WHEN u.current_rank = 'Officer' AND u.total_xp >= 400 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  u.current_rank as actual_rank,
  'Officer' as expected_rank,
  u.total_xp
FROM users u
WHERE u.id = :test_user_id::uuid;

-- ═══════════════════════════════════════════════════════════
-- TEST 10: Featured Mission Determinism
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST 10: Featured Mission Determinism ═══' as test_header;

-- Test featured selection for multiple days
SELECT 
  'TEST 10 RESULT' as test,
  week_number,
  unlock_day,
  get_featured_mission_id(week_number, unlock_day) as featured_mission,
  (SELECT xp_reward FROM missions 
   WHERE id = get_featured_mission_id(week_number, unlock_day)) as featured_xp,
  (SELECT MAX(xp_reward) FROM missions m2 
   WHERE m2.week_number = missions.week_number 
   AND m2.unlock_day = missions.unlock_day) as max_xp_available,
  CASE 
    WHEN (SELECT xp_reward FROM missions 
          WHERE id = get_featured_mission_id(week_number, unlock_day))
         = (SELECT MAX(xp_reward) FROM missions m2 
            WHERE m2.week_number = missions.week_number 
            AND m2.unlock_day = missions.unlock_day)
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
FROM (
  SELECT DISTINCT week_number, unlock_day
  FROM missions
  WHERE week_number IN (1, 2)
  ORDER BY week_number, unlock_day
  LIMIT 7
) missions;

-- ═══════════════════════════════════════════════════════════
-- TEST SUMMARY
-- ═══════════════════════════════════════════════════════════
SELECT '═══ TEST SUITE SUMMARY ═══' as summary_header;

SELECT 
  'SUMMARY' as test,
  COUNT(*) as total_completions_today,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
  COUNT(*) FILTER (WHERE is_featured = false) as training_count,
  SUM(xp_awarded) as total_xp_awarded,
  (SELECT total_xp FROM users WHERE id = :test_user_id::uuid) as user_total_xp,
  (SELECT current_rank FROM users WHERE id = :test_user_id::uuid) as current_rank,
  (SELECT current_streak FROM users WHERE id = :test_user_id::uuid) as current_streak
FROM mission_completions
WHERE user_id = :test_user_id::uuid
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

-- ═══════════════════════════════════════════════════════════
-- DETAILED COMPLETION LOG
-- ═══════════════════════════════════════════════════════════
SELECT '═══ DETAILED COMPLETION LOG ═══' as log_header;

SELECT 
  mc.mission_id,
  m.mission_type,
  m.category,
  m.xp_reward as base_xp,
  mc.xp_awarded as awarded_xp,
  mc.is_featured,
  CASE 
    WHEN mc.is_featured THEN '100%'
    ELSE '50%'
  END as xp_percentage
FROM mission_completions mc
JOIN missions m ON m.id = mc.mission_id
WHERE mc.user_id = :test_user_id::uuid
  AND mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
ORDER BY mc.id;

-- ═══════════════════════════════════════════════════════════
-- VALIDATION COMPLETE
-- ═══════════════════════════════════════════════════════════
SELECT '✅ VALIDATION TEST SUITE COMPLETE' as final_status;
SELECT 'Review results above. All tests should show ✅ PASS' as instruction;
