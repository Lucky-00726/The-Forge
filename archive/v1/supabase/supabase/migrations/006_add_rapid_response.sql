-- ═══════════════════════════════════════════════════════════
-- Migration 006: Add Rapid Response Mission Support
-- ═══════════════════════════════════════════════════════════
-- Adds time_limit_seconds column for timed missions
-- No RPC changes, no failed_at tracking (beta approach)
-- ═══════════════════════════════════════════════════════════

-- Add time_limit_seconds column to missions table
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS time_limit_seconds integer;

COMMENT ON COLUMN missions.time_limit_seconds IS
  'Time limit in seconds for timed missions (e.g., Rapid Response). NULL = no time limit.';

-- ═══════════════════════════════════════════════════════════
-- Migration 006 Complete
-- ═══════════════════════════════════════════════════════════
