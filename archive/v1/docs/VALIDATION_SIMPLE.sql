-- ═══════════════════════════════════════════════════════════
-- SIMPLE VALIDATION TEST (Supabase Compatible)
-- Replace YOUR-UUID-HERE on line 5
-- ═══════════════════════════════════════════════════════════

-- ⚠️ REPLACE THIS WITH YOUR USER UUID:
DO $$
DECLARE
  test_user_id uuid := 'YOUR-UUID-HERE'::uuid;
BEGIN

-- Cleanup
DELETE FROM mission_completions WHERE user_id = test_user_id AND completed_date = CURRENT_DATE;
UPDATE users SET total_xp = 0, current_streak = 0, current_rank = 'Cadet', last_active_date = NULL WHERE id = test_user_id;

RAISE NOTICE 'Starting validation tests...';
RAISE NOTICE '';

-- TEST 1: Complete W1D1-COM (50 XP, will be training)
PERFORM complete_mission(test_user_id, 'W1D1-COM', '{}'::jsonb);
RAISE NOTICE 'TEST 1: Completed W1D1-COM';

-- TEST 2: Complete W1D1-OT (60 XP, should be featured)
PERFORM complete_mission(test_user_id, 'W1D1-OT', '{}'::jsonb);
RAISE NOTICE 'TEST 2: Completed W1D1-OT (featured)';

-- TEST 3: Complete W1D1-CONF (40 XP, training)
PERFORM complete_mission(test_user_id, 'W1D1-CONF', '{}'::jsonb);
RAISE NOTICE 'TEST 3: Completed W1D1-CONF (training)';

-- TEST 4: Complete W1D1-LEAD (30 XP, training)
PERFORM complete_mission(test_user_id, 'W1D1-LEAD', '{}'::jsonb);
RAISE NOTICE 'TEST 4: Completed W1D1-LEAD (training)';

-- TEST 5: Complete W1D1-AWR (40 XP, training)
PERFORM complete_mission(test_user_id, 'W1D1-AWR', '{}'::jsonb);
RAISE NOTICE 'TEST 5: Completed W1D1-AWR (training)';

-- TEST 6: Try duplicate (should be prevented)
BEGIN
  PERFORM complete_mission(test_user_id, 'W1D1-COM', '{}'::jsonb);
  RAISE NOTICE 'TEST 6: ERROR - Duplicate was NOT prevented!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'TEST 6: PASS - Duplicate prevented (expected error)';
END;

RAISE NOTICE '';
RAISE NOTICE '═══════════════════════════════════════';
RAISE NOTICE 'VALIDATION COMPLETE - Check results below';
RAISE NOTICE '═══════════════════════════════════════';

END $$;

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run these to check results)
-- ═══════════════════════════════════════════════════════════

-- Query 1: Show all completions
SELECT 
  mission_id,
  is_featured,
  xp_awarded,
  CASE WHEN is_featured THEN '100%' ELSE '50%' END as xp_rate
FROM mission_completions
WHERE user_id = 'YOUR-UUID-HERE'::uuid
  AND completed_date = CURRENT_DATE
ORDER BY is_featured DESC, mission_id;

-- Query 2: Show user state
SELECT 
  total_xp,
  current_rank,
  current_streak,
  last_active_date
FROM users
WHERE id = 'YOUR-UUID-HERE'::uuid;

-- Query 3: Check featured mission selection
SELECT 
  week_number,
  unlock_day,
  get_featured_mission_id(week_number, unlock_day) as featured_mission
FROM (VALUES (1,1), (1,2), (1,3), (1,4), (1,5), (1,6), (1,7)) AS t(week_number, unlock_day);

-- ═══════════════════════════════════════════════════════════
-- EXPECTED RESULTS
-- ═══════════════════════════════════════════════════════════
-- Query 1 should show:
--   W1D1-OT   | true  | 60 | 100%  (featured)
--   W1D1-AWR  | false | 20 | 50%   (training)
--   W1D1-COM  | false | 25 | 50%   (training)
--   W1D1-CONF | false | 20 | 50%   (training)
--   W1D1-LEAD | false | 15 | 50%   (training)
--   Total: 5 missions
--
-- Query 2 should show:
--   total_xp: 140
--   current_rank: Cadet
--   current_streak: 1
--
-- Query 3 should show:
--   W1D1 → W1D1-OT (60 XP)
--   W1D2 → W1D2-LEAD (70 XP)
--   etc.
-- ═══════════════════════════════════════════════════════════

-- ✅ ALL TESTS PASS IF:
-- 1. Query 1 shows 5 missions (1 featured, 4 training)
-- 2. Total XP = 140 (60 + 25 + 20 + 15 + 20)
-- 3. Only W1D1-OT is marked is_featured = true
-- 4. Rank is Cadet
-- 5. Streak is 1
