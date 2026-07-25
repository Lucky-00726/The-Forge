-- ═══════════════════════════════════════════════════════════════
-- THE FORGE — Database Cleanup Script
-- Run this to fix duplicate missions and malformed data
-- ═══════════════════════════════════════════════════════════════

-- Step 1: View all missions to see what you have
SELECT id, title, week_number, unlock_day, category, mission_type
FROM missions
ORDER BY week_number, unlock_day;

-- Step 2: Find duplicate week/day combinations
SELECT week_number, unlock_day, COUNT(*) as count, 
       STRING_AGG(id, ', ') as mission_ids
FROM missions
GROUP BY week_number, unlock_day
HAVING COUNT(*) > 1
ORDER BY week_number, unlock_day;

-- Step 3: DELETE ALL MISSIONS (start fresh)
-- Uncomment the line below after reviewing the data above
-- DELETE FROM missions;

-- Step 4: Add unique constraint to prevent future duplicates
-- Uncomment after deleting duplicates
-- ALTER TABLE missions 
-- ADD CONSTRAINT missions_week_day_unique 
-- UNIQUE (week_number, unlock_day);
