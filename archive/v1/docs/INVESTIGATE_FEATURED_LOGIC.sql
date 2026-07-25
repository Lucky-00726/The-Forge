-- ═══════════════════════════════════════════════════════════
-- Investigation: Featured Mission Logic
-- ═══════════════════════════════════════════════════════════

-- Query 1: What missions exist for Week 1, Day 2?
SELECT 
  id,
  title,
  xp_reward,
  category,
  week_number,
  unlock_day
FROM missions
WHERE week_number = 1 AND unlock_day = 2
ORDER BY xp_reward DESC, category;

-- Query 2: Which mission is featured for Week 1, Day 2?
SELECT get_featured_mission_id(1, 2) as featured_mission_id;

-- Query 3: What missions has user completed today?
SELECT 
  mc.mission_id,
  mc.is_featured,
  mc.xp_awarded,
  mc.completed_date,
  m.title,
  m.xp_reward,
  m.week_number,
  m.unlock_day
FROM mission_completions mc
JOIN missions m ON m.id = mc.mission_id
WHERE mc.user_id = '1bd44f06-f1a6-431d-aa92-6def3910aee6'
  AND mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
ORDER BY mc.created_at;

-- Query 4: Check user's current day progression
SELECT 
  created_at,
  (now() AT TIME ZONE 'Asia/Kolkata')::date as today_ist,
  created_at::date as join_date,
  EXTRACT(EPOCH FROM ((now() AT TIME ZONE 'Asia/Kolkata') - created_at)) / 86400 as days_since_join
FROM users
WHERE id = '1bd44f06-f1a6-431d-aa92-6def3910aee6';

-- Query 5: What week/day should user see today?
-- This requires the date utility logic from the app
-- Manual calculation: days_since_join determines week_number and unlock_day

-- Query 6: All featured completions today (any user)
SELECT 
  user_id,
  mission_id,
  is_featured,
  completed_date
FROM mission_completions
WHERE completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
  AND is_featured = true;
