-- ═══════════════════════════════════════════════════════════
-- THE FORGE — Migration 002: Add Week 2 Categories
-- Adds GEO (Geopolitics) and CA (Current Affairs) categories
-- ═══════════════════════════════════════════════════════════

-- Step 1: Clear existing missions (so constraint change won't fail)
TRUNCATE TABLE missions CASCADE;

-- Step 2: Drop existing category constraint
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_category_check;

-- Step 3: Add new constraint with GEO and CA
ALTER TABLE missions ADD CONSTRAINT missions_category_check 
  CHECK (category IN ('COM', 'CONF', 'LEAD', 'AWR', 'OT', 'GEO', 'CA'));

-- Step 4: Add optional subtype column to preserve Scenario/Dilemma/Rapid Fire distinction
ALTER TABLE missions ADD COLUMN IF NOT EXISTS subtype TEXT;

-- Step 5: Add optional source_type column to preserve SSB/Daily life metadata
ALTER TABLE missions ADD COLUMN IF NOT EXISTS source_type TEXT 
  CHECK (source_type IN ('SSB', 'Daily life'));

COMMENT ON COLUMN missions.subtype IS 'Mission subtype for UI hints: scenario, dilemma, rapid_fire, poll, reflect, challenge';
COMMENT ON COLUMN missions.source_type IS 'Content origin: SSB (Service Selection Board) or Daily life';
