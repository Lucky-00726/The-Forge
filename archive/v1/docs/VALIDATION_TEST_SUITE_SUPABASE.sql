-- ═══════════════════════════════════════════════════════════
-- VALIDATION TEST SUITE (Supabase Compatible)
-- Run this script in Supabase SQL Editor after migration
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- STEP 1: REPLACE THIS LINE WITH YOUR USER UUID
-- ───────────────────────────────────────────────────────────
-- Find your UUID by running: SELECT id, email FROM auth.users LIMIT 5;
-- Then replace 'YOUR-USER-UUID-HERE' below with your actual UUID

DO $$
DECLARE
  test_user_id uuid := 'YOUR-USER-UUID-HERE'::uuid;  -- ⚠️ REPLACE THIS
  v_result jsonb;
BEGIN

-- ───────────────────────────────────────────────────────────
-- PRE-TEST CLEANUP
-- ───────────────────────────────────────────────────────────
DELETE FROM mission_completions
WHERE user_id = test_user_id
  AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date;

UPDATE users
SET total_xp = 0,
    current_streak = 0,
    current_rank = 'Cadet',
    last_active_date = NULL
WHERE id = test_user_id;

RAISE NOTICE '✅ PRE-TEST CLEANUP COMPLETE';

-- ═══════════════════════════════════════════════════════════
-- TEST 1: Server Determines XP
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 1: Server-Authoritative XP ═══';

SELECT complete_mission(
  test_user_id,
  'W1D1-COM',
  '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":2}'::jsonb
) INTO v_result;

IF (v_result->>'xp_awarded')::integer = 50 THEN
  RAISE NOTICE '✅ TEST 1: PASS - XP awarded: % (expected: 50)', COALESCE((v_result->>'xp_awarded')::text, 'null');
ELSE
  RAISE NOTICE '❌ TEST 1: FAIL - XP awarded: % (expected: 50)', COALESCE((v_result->>'xp_awarded')::text, 'null');
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 2: Server Determines Featured Mission
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 2: Featured Mission Selection ═══';

IF get_featured_mission_id(1, 1) = 'W1D1-OT' THEN
  RAISE NOTICE '✅ TEST 2A: PASS - Featured mission is W1D1-OT (60 XP = highest)';
ELSE
  RAISE NOTICE '❌ TEST 2A: FAIL - Featured mission is % (expected: W1D1-OT)', get_featured_mission_id(1, 1)::text;
END IF;

SELECT complete_mission(
  test_user_id,
  'W1D1-OT',
  '{"type":"Daily Challenge","completed":true,"reflection":"Test"}'::jsonb
) INTO v_result;

IF (v_result->>'is_featured')::boolean = true AND (v_result->>'xp_awarded')::integer = 60 THEN
  RAISE NOTICE '✅ TEST 2B: PASS - OT marked as featured with 60 XP';
ELSE
  RAISE NOTICE '❌ TEST 2B: FAIL - is_featured: %, xp: %', 
    COALESCE((v_result->>'is_featured')::text, 'null'), 
    COALESCE((v_result->>'xp_awarded')::text, 'null');
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 3: Training Mission (50% XP)
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 3: Training Mission XP (50%) ═══';

SELECT complete_mission(
  test_user_id,
  'W1D1-CONF',
  '{"type":"Reflect & Write","text":"Test","word_count":1}'::jsonb
) INTO v_result;

IF (v_result->>'is_featured')::boolean = false AND (v_result->>'xp_awarded')::integer = 20 THEN
  RAISE NOTICE '✅ TEST 3: PASS - Training mission awarded 20 XP (50 percent of 40)';
ELSE
  RAISE NOTICE '❌ TEST 3: FAIL - is_featured: %, xp: % (expected: false, 20)', 
    COALESCE((v_result->>'is_featured')::text, 'null'), 
    COALESCE((v_result->>'xp_awarded')::text, 'null');
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 4: One Featured Per Day
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 4: One Featured Per Day ═══';

SELECT complete_mission(
  test_user_id,
  'W1D1-COM',
  '{"type":"Poll + Reasoning","selected_option":"Test","reasoning":"Test","word_count":1}'::jsonb
) INTO v_result;

IF (SELECT COUNT(*) FROM mission_completions 
    WHERE user_id = test_user_id 
    AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
    AND is_featured = true) = 1 THEN
  RAISE NOTICE '✅ TEST 4: PASS - Only 1 featured mission per day';
ELSE
  RAISE NOTICE '❌ TEST 4: FAIL - Featured count: %', 
    (SELECT COUNT(*)::text FROM mission_completions 
     WHERE user_id = test_user_id 
     AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
     AND is_featured = true);
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 5: Multiple Missions Per Day
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 5: Multiple Missions Per Day ═══';

SELECT complete_mission(test_user_id, 'W1D1-LEAD', '{}'::jsonb) INTO v_result;
SELECT complete_mission(test_user_id, 'W1D1-AWR', '{}'::jsonb) INTO v_result;

IF (SELECT COUNT(*) FROM mission_completions 
    WHERE user_id = test_user_id 
    AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date) = 5 THEN
  RAISE NOTICE '✅ TEST 5: PASS - 5 missions completed today';
ELSE
  RAISE NOTICE '❌ TEST 5: FAIL - Missions completed: %', 
    (SELECT COUNT(*)::text FROM mission_completions 
     WHERE user_id = test_user_id 
     AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date);
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 6: Duplicate Prevention
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 6: Duplicate Prevention ═══';

SELECT complete_mission(
  test_user_id,
  'W1D1-COM',
  '{}'::jsonb
) INTO v_result;

IF (v_result->>'already_completed')::boolean = true THEN
  RAISE NOTICE '✅ TEST 6: PASS - Duplicate prevented (already_completed flag returned)';
ELSE
  RAISE NOTICE '❌ TEST 6: FAIL - Duplicate not prevented';
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 7: Total XP Calculation
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 7: Total XP Calculation ═══';

-- Expected: OT(60) + COM(25) + CONF(20) + LEAD(15) + AWR(20) = 140
IF (SELECT total_xp FROM users WHERE id = test_user_id) = 140 THEN
  RAISE NOTICE '✅ TEST 7: PASS - Total XP: 140';
ELSE
  RAISE NOTICE '❌ TEST 7: FAIL - Total XP: % (expected: 140)', 
    (SELECT total_xp::text FROM users WHERE id = test_user_id);
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 8: Streak Calculation
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 8: Streak Calculation ═══';

IF (SELECT current_streak FROM users WHERE id = test_user_id) = 1 THEN
  RAISE NOTICE '✅ TEST 8: PASS - Streak: 1 (first mission today)';
ELSE
  RAISE NOTICE '❌ TEST 8: FAIL - Streak: % (expected: 1)', 
    (SELECT current_streak::text FROM users WHERE id = test_user_id);
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 9: Rank Progression
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 9: Rank Progression ═══';

IF (SELECT current_rank FROM users WHERE id = test_user_id) = 'Cadet' THEN
  RAISE NOTICE '✅ TEST 9A: PASS - Still Cadet at 140 XP';
ELSE
  RAISE NOTICE '❌ TEST 9A: FAIL - Rank: % (expected: Cadet)', 
    (SELECT current_rank::text FROM users WHERE id = test_user_id);
END IF;

-- Set XP to 350, complete one more mission to reach Officer
UPDATE users SET total_xp = 350 WHERE id = test_user_id;
SELECT complete_mission(test_user_id, 'W1D2-COM', '{}'::jsonb) INTO v_result;

IF (SELECT current_rank FROM users WHERE id = test_user_id) = 'Officer' AND
   (SELECT total_xp FROM users WHERE id = test_user_id) >= 400 THEN
  RAISE NOTICE '✅ TEST 9B: PASS - Officer at 400+ XP';
ELSE
  RAISE NOTICE '❌ TEST 9B: FAIL - Rank: %, XP: % (expected: Officer, 400+)', 
    (SELECT current_rank::text FROM users WHERE id = test_user_id),
    (SELECT total_xp::text FROM users WHERE id = test_user_id);
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST 10: Featured Determinism
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══ TEST 10: Featured Determinism ═══';

IF get_featured_mission_id(1, 1) = 'W1D1-OT' AND
   get_featured_mission_id(1, 2) = 'W1D2-LEAD' AND
   get_featured_mission_id(1, 4) = 'W1D4-OT' THEN
  RAISE NOTICE '✅ TEST 10: PASS - Featured selection is deterministic';
  RAISE NOTICE '   W1D1 → W1D1-OT, W1D2 → W1D2-LEAD, W1D4 → W1D4-OT';
ELSE
  RAISE NOTICE '❌ TEST 10: FAIL - Featured mission selection inconsistent';
END IF;

-- ═══════════════════════════════════════════════════════════
-- TEST SUMMARY
-- ═══════════════════════════════════════════════════════════
RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════════════════════════';
RAISE NOTICE '✅ VALIDATION TEST SUITE COMPLETE';
RAISE NOTICE '═══════════════════════════════════════════════════════════';
RAISE NOTICE 'Missions completed: %', (SELECT COUNT(*)::text FROM mission_completions 
  WHERE user_id = test_user_id AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date);
RAISE NOTICE 'Featured count: %', (SELECT COUNT(*)::text FROM mission_completions 
  WHERE user_id = test_user_id AND completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date AND is_featured = true);
RAISE NOTICE 'Total XP: %', (SELECT total_xp::text FROM users WHERE id = test_user_id);
RAISE NOTICE 'Current Rank: %', (SELECT current_rank::text FROM users WHERE id = test_user_id);
RAISE NOTICE 'Current Streak: %', (SELECT current_streak::text FROM users WHERE id = test_user_id);
RAISE NOTICE '';
RAISE NOTICE 'Review results above. All tests should show ✅ PASS';

END $$;
