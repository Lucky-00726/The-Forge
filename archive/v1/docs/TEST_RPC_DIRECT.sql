-- ═══════════════════════════════════════════════════════════
-- Direct RPC Test - Replace placeholders with your data
-- ═══════════════════════════════════════════════════════════

-- STEP 1: Find your user ID
SELECT id, email, display_name, total_xp, current_rank
FROM users
LIMIT 5;

-- Copy your user ID from above, then run:

-- STEP 2: Find today's featured mission
SELECT 
  m.id,
  m.title,
  m.xp_reward,
  m.week_number,
  m.unlock_day,
  m.category,
  get_featured_mission_id(m.week_number, m.unlock_day) as featured_id
FROM missions m
WHERE week_number = 1 AND unlock_day = 1
ORDER BY xp_reward DESC;

-- STEP 3: Test complete_mission RPC
-- REPLACE: 'your-user-id-here' with actual UUID from STEP 1
-- REPLACE: 'W1D1-OT' with featured mission ID from STEP 2

SELECT complete_mission(
  'your-user-id-here'::uuid,
  'W1D1-OT',
  '{"type": "Reflect & Write", "text": "This is a test response with more than twenty characters", "word_count": 50}'::jsonb
);

-- If you get an error, paste the FULL error message here
