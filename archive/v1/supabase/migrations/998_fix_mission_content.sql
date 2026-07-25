-- ═══════════════════════════════════════════════════════════════
-- THE FORGE — Fix Mission Content
-- Add missing reasoning_prompt to Poll + Reasoning missions
-- ═══════════════════════════════════════════════════════════════

-- Update all Poll + Reasoning missions to have min_words and reasoning_prompt
UPDATE missions
SET content = jsonb_set(
  jsonb_set(
    content,
    '{min_words}',
    '20'::jsonb,
    true
  ),
  '{reasoning_prompt}',
  '"Explain your reasoning in 2-3 sentences."'::jsonb,
  true
)
WHERE mission_type = 'Poll + Reasoning'
  AND (content->>'reasoning_prompt') IS NULL;

-- Verify the update
SELECT id, title, mission_type, 
       content->>'reasoning_prompt' as reasoning_prompt,
       content->>'min_words' as min_words
FROM missions
WHERE mission_type = 'Poll + Reasoning'
ORDER BY week_number, unlock_day;
