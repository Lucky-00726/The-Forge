-- ═══════════════════════════════════════════════════════════
-- Debug: Check if complete_mission RPC exists and is correct
-- ═══════════════════════════════════════════════════════════

-- Check 1: Does the function exist?
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_function_result(oid) AS return_type
FROM pg_proc
WHERE proname = 'complete_mission'
  AND pronamespace = 'public'::regnamespace;

-- Check 2: Get the function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'complete_mission'
  AND pronamespace = 'public'::regnamespace;

-- Check 3: Does get_featured_mission_id exist?
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname = 'get_featured_mission_id'
  AND pronamespace = 'public'::regnamespace;

-- Check 4: Test calling complete_mission with a test mission
-- REPLACE 'your-user-id' with your actual user ID from auth.users
-- REPLACE 'W1D1-OT' with actual mission ID from your database
/*
SELECT complete_mission(
  'your-user-id'::uuid,
  'W1D1-OT',
  '{"type": "Reflect & Write", "text": "Test response", "word_count": 20}'::jsonb
);
*/

-- Check 5: View your missions
SELECT id, title, xp_reward, week_number, unlock_day, category
FROM missions
ORDER BY week_number, unlock_day, category
LIMIT 10;

-- Check 6: View your user data
-- REPLACE 'your-user-id' with your actual user ID
/*
SELECT id, display_name, total_xp, current_rank, current_streak
FROM users
WHERE id = 'your-user-id'::uuid;
*/
