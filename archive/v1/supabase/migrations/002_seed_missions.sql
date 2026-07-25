-- ─────────────────────────────────────────────────────────────
-- THE FORGE — Week 1 + Week 2 Mission Seeds
-- 14 missions covering days 1-14 of the beta.
-- Run AFTER 001_initial_schema.sql.
-- ─────────────────────────────────────────────────────────────

insert into public.missions
  (id, title, category, mission_type, week_number, unlock_day, xp_reward, content)
values

-- ── WEEK 1 ────────────────────────────────────────────────────

-- Day 1
('CONF-001',
 'Held Back Opinion',
 'Confidence',
 'Reflect & Write',
 1, 1, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Describe a recent time when you held back your opinion in a group. What stopped you? What would you say now if you could go back?",
   "context": "There are no wrong answers. Be direct and honest with yourself.",
   "min_words": 30
 }'::jsonb),

-- Day 2
('LEAD-001',
 'Study Group Freeloader',
 'Leadership',
 'Poll + Reasoning',
 1, 2, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "Your 4-person study group has a member who hasn''t contributed for two weeks — missing sessions, not completing their part, but still expecting to share your materials. What do you do?",
   "context": "You are the informal leader of the group.",
   "options": ["Confront them directly and give a final chance", "Remove them from the group immediately", "Distribute their work silently and say nothing", "Bring it to a teacher or authority"],
   "reasoning_prompt": "In 2-3 sentences, explain what principle guides your choice.",
   "min_words": 20
 }'::jsonb),

-- Day 3
('COM-001',
 'Speak Last Challenge',
 'Communication',
 'Daily Challenge',
 1, 3, 50,
 '{
   "type": "Daily Challenge",
   "title": "Speak Last",
   "briefing": "The instinct to speak first is about ego, not communication. Today you train the discipline of listening before leading.",
   "task": "In every group conversation today — class, family, or friends — let everyone else speak before you contribute. Do not interrupt. When you do speak, make your point count. Practice this in at least 2 conversations.",
   "reflection_prompt": "How did it feel to wait? What did you notice that you would have missed if you had spoken first?"
 }'::jsonb),

-- Day 4
('AWR-001',
 'Defence Budget Debate',
 'Awareness',
 'Poll + Reasoning',
 1, 4, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "Should India prioritise increasing its defence budget over social welfare spending?",
   "context": "India allocates approximately 2.1% of GDP to defence. The debate between defence preparedness and social investment is ongoing.",
   "options": ["Prioritise Defence", "Prioritise Social Welfare", "Equal split is essential", "Depends on the current threat level"],
   "reasoning_prompt": "Give one specific reason — a recent event, geopolitical factor, or economic argument.",
   "min_words": 20
 }'::jsonb),

-- Day 5
('OT-001',
 'Wrong Decision Reflection',
 'Officer Thinking',
 'Reflect & Write',
 1, 5, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Describe a decision you made in the last month that turned out to be wrong. What information did you have? What did you miss? What would you decide differently today?",
   "context": "Officer thinking requires honest self-assessment without self-pity.",
   "min_words": 40
 }'::jsonb),

-- Day 6
('CONF-002',
 'Initiate Conversation',
 'Confidence',
 'Daily Challenge',
 1, 6, 50,
 '{
   "type": "Daily Challenge",
   "title": "Initiate — Do Not Wait",
   "briefing": "Confidence is built through action, not preparation. Today''s challenge is about initiating.",
   "task": "Start 3 conversations today that you would normally wait for the other person to begin. This can be with a classmate, a teacher, a shopkeeper, or a family member. Your opening line must be specific and genuine — not just ''hi''.",
   "reflection_prompt": "Which conversation surprised you most? What did you learn about how people respond when you initiate?"
 }'::jsonb),

-- Day 7
('COM-002',
 'Difficult Conversation Reflection',
 'Communication',
 'Reflect & Write',
 1, 7, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Think of a difficult conversation you have been avoiding. Why are you avoiding it? What is the cost of continued silence? Write out exactly what you would say if you had it today.",
   "context": "Be specific — name the person and the situation in your mind, even if you don''t write them here.",
   "min_words": 35
 }'::jsonb),

-- ── WEEK 2 ────────────────────────────────────────────────────

-- Day 8
('LEAD-002',
 'Silent Group Leader',
 'Leadership',
 'Poll + Reasoning',
 2, 1, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "During a group activity, no one is taking initiative. The group is stuck and silent. You have a clear idea of how to proceed but you are naturally the quietest person in the room. What do you do?",
   "context": "Leadership is not about personality — it is about stepping forward when needed.",
   "options": ["Speak up and propose your approach clearly", "Wait to see if someone more vocal takes charge", "Write your idea and pass it to a louder member", "Start doing something small to signal direction without speaking"],
   "reasoning_prompt": "What does your choice reveal about how you define leadership?",
   "min_words": 20
 }'::jsonb),

-- Day 9
('OT-002',
 'Intent Behind Task',
 'Officer Thinking',
 'Daily Challenge',
 2, 2, 50,
 '{
   "type": "Daily Challenge",
   "title": "Intent Behind the Task",
   "briefing": "Officers don''t just follow orders — they understand WHY the order exists. Today you train commander''s intent.",
   "task": "For every task you are given today — by a teacher, parent, coach, or anyone — identify the underlying intent before you start. Ask yourself: what is the real goal behind this instruction? Do this for at least 3 tasks and note each one.",
   "reflection_prompt": "Which task had the most surprising intent? What changed about how you approached it once you understood the why?"
 }'::jsonb),

-- Day 10
('AWR-002',
 'Geopolitical Event Analysis',
 'Awareness',
 'Reflect & Write',
 2, 3, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Choose one major national or international event from the past 30 days. In your own words: what happened, why it matters to India, and what you think will happen next.",
   "context": "Pick an event from defence, politics, or international relations. Use only what you already know — do not look anything up.",
   "min_words": 50
 }'::jsonb),

-- Day 11
('CONF-003',
 'Average Candidate Challenge',
 'Confidence',
 'Poll + Reasoning',
 2, 4, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "During an SSB group discussion, a peer says: ''Most of us here are average candidates with low chances.'' Several others nod. You strongly disagree. What do you do?",
   "context": "Your response in this moment will define how the group sees you.",
   "options": ["Speak up immediately and challenge the statement with reasoning", "Stay silent — it is not worth the confrontation", "Nod along but privately disagree", "Redirect the group to focus on preparation instead of probability"],
   "reasoning_prompt": "What is the most important thing an officer-aspirant should never accept?",
   "min_words": 20
 }'::jsonb),

-- Day 12
('COM-003',
 'Friend Wrong Decision',
 'Communication',
 'Reflect & Write',
 2, 5, 40,
 '{
   "type": "Reflect & Write",
   "prompt": "Your close friend is about to make a decision you believe is seriously wrong — academically, professionally, or personally. Do you tell them directly, even if it risks the friendship? Write what you would actually say to them.",
   "context": "Write the specific words you would use — not what you think you should say, but what you would actually say.",
   "min_words": 35
 }'::jsonb),

-- Day 13
('LEAD-003',
 'Command Presence Drill',
 'Leadership',
 'Daily Challenge',
 2, 6, 50,
 '{
   "type": "Daily Challenge",
   "title": "Command Presence — Voice Drill",
   "briefing": "SSB assessors judge confidence through voice before they judge content. A wavering voice signals uncertainty even when the words are right.",
   "task": "Record yourself on your phone speaking for 60 seconds on any topic — your goals, today''s events, or your opinion on anything. Listen back and identify: pace (too fast?), volume (too low?), filler words (um, uh, like), and trailing sentences. Record a second take and correct what you found.",
   "reflection_prompt": "What was the biggest difference between recording 1 and recording 2? What one thing will you consciously work on next?"
 }'::jsonb),

-- Day 14
('OT-003',
 'Friend Cheating Dilemma',
 'Officer Thinking',
 'Poll + Reasoning',
 2, 7, 40,
 '{
   "type": "Poll + Reasoning",
   "question": "During an important exam, you notice your close friend copying from a hidden cheat sheet. The invigilator hasn''t noticed. Your friend sees that you''ve seen them.",
   "context": "Your friendship is 3 years old. The exam result affects college admission.",
   "options": ["Report to the invigilator immediately", "Say nothing — it is not your responsibility", "Signal your friend discreetly to stop", "Confront your friend directly after the exam"],
   "reasoning_prompt": "Name the most important value at stake here and explain why it matters specifically for someone aspiring to be an officer.",
   "min_words": 25
 }'::jsonb);