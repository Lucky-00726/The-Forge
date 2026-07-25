-- ═══════════════════════════════════════════════════════════
-- THE FORGE — Mission Seed Data: Week 1 + Week 2
-- 70 missions total (35 per week)
-- Original content preserved exactly as provided
-- ═══════════════════════════════════════════════════════════

-- Clear existing missions (if rerunning migration)
TRUNCATE TABLE missions CASCADE;

-- ═══════════════════════════════════════════════════════════
-- WEEK 1 — BUILDING YOUR FOUNDATION (35 missions, 1,690 XP)
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- Day 1 — Mon: Building your foundation (220 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (id, week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
('W1D1-COM', 1, 1, 'Communication', 'Poll + Reasoning', 'scenario', 'SSB', 'Group Project Conflict',
'{"scenario":"You''re in a college group project. Your idea gets ignored by the team. The deadline is tomorrow.","question":"What do you do?","options":["Speak up immediately and push my idea","Accept the team decision and work on execution","Suggest revisiting all ideas one final time","Do the work myself without discussion"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 1, 'CONF', 'reflect_write', 'reflect', 'Daily life', 'Moments of Silence',
'{"prompt":"Think of one moment this week where you held back from saying something you believed was right. Why did you stay quiet — and what would you say now?","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 1, 'LEAD', 'reflect_write', 'rapid_fire', 'SSB', 'Indian Military Leaders',
'{"prompt":"RAPID FIRE — You have 20 seconds: Name one Indian military leader who demonstrated exceptional leadership under crisis and state what specifically they did.","time_limit":20,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 1, 'AWR', 'poll_reasoning', 'poll', 'SSB', 'Defence Budget Poll',
'{"question":"POLL: Should India increase its defence budget to 3% of GDP (from ~2%)?","options":["Yes - India faces growing security threats","No - Resources needed for development","Yes but gradually over 5 years","No - Better spending efficiency matters more"],"requires_reasoning":true,"reasoning_prompt":"Pick a side and give your strongest argument in 2 sentences."}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 1, 'OT', 'daily_challenge', 'challenge', 'Daily life', 'Understanding Intent',
'{"task":"REAL WORLD TASK: Today, when someone gives you a task or instruction, before doing it — pause and ask: ''What is the intent behind this, not just the task itself?''","completion_criteria":"Note what you discover."}',
60);

-- ───────────────────────────────────────────────────────────
-- Day 2 — Tue: Pressure testing (250 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 2, 'CONF', 'poll_reasoning', 'scenario', 'SSB', 'Average Candidate Response',
'{"scenario":"Your SSB interviewer leans forward and says: ''You seem like a very average candidate. Why should we select you over the hundreds of others?'' You have 30 seconds.","question":"How do you respond?","options":["Highlight unique experiences","Acknowledge average metrics then pivot to values","Challenge the premise respectfully","Demonstrate leadership through the response itself"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 2, 'COM', 'daily_challenge', 'challenge', 'Daily life', 'Speak Last Challenge',
'{"task":"REAL WORLD TASK: Have one conversation today where you speak LAST — let everyone else in the room/group chat finish before you respond.","completion_criteria":"Observe what you notice that you''d have missed by jumping in."}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 2, 'AWR', 'reflect_write', 'rapid_fire', 'SSB', 'Operation Sindoor',
'{"prompt":"RAPID FIRE — 25 seconds: What is Operation Sindoor and what does it signal about India''s current strategic doctrine?","time_limit":25,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 2, 'LEAD', 'poll_reasoning', 'dilemma', 'Daily life', 'Study Group Freeloader',
'{"scenario":"DILEMMA: Your study group has a member who consistently doesn''t contribute but still gets credit. The rest of the group is frustrated and looking to you to handle it.","question":"What do you do?","options":["Confront the person privately","Raise it with the entire group","Talk to the instructor","Set clear contribution rules going forward"],"requires_reasoning":true}',
70);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 2, 'OT', 'reflect_write', 'reflect', 'SSB', 'Wrong Decision Analysis',
'{"prompt":"In 3 sentences, describe a time you made a wrong decision. What made it wrong — poor information, poor reasoning, or poor values? What would you change?","word_limit":150}',
40);

-- ───────────────────────────────────────────────────────────
-- Day 3 — Wed: Influence & initiative (220 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 3, 'LEAD', 'poll_reasoning', 'scenario', 'SSB', 'GTO Stuck Group',
'{"scenario":"In a GTO Progressive Group Task, your group is stuck and time is running out. The appointed leader has gone quiet. No one is acting.","question":"What do you do?","options":["Take charge immediately","Ask the leader a direct question","Suggest one specific next step","Start executing a solution yourself"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 3, 'COM', 'poll_reasoning', 'poll', 'Daily life', 'Friend Wrong Decision',
'{"question":"POLL: A friend is making a life decision you think is wrong (career choice, relationship, etc.). Do you say something or stay out of it?","options":["Say something - friends speak truth","Stay out - it''s their life","Ask questions without judging","Offer perspective if asked"],"requires_reasoning":true,"reasoning_prompt":"Pick a side and defend it."}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 3, 'CONF', 'daily_challenge', 'challenge', 'Daily life', 'Initiate Conversation',
'{"task":"REAL WORLD TASK: Today, initiate a conversation with someone you normally wouldn''t — a professor, a senior, a stranger in a shared space. Start the conversation.","completion_criteria":"Note how it goes."}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 3, 'AWR', 'reflect_write', 'reflect', 'SSB', 'Geopolitical Event Analysis',
'{"prompt":"Name one current geopolitical event affecting India''s security. In 3 sentences: what happened, why it matters to India, and what India''s likely response calculus is.","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 3, 'OT', 'reflect_write', 'rapid_fire', 'SSB', 'Three Services',
'{"prompt":"RAPID FIRE — 20 seconds: What are the 3 services of the Indian Armed Forces and name one unique operational role of each?","time_limit":20,"is_timed":true}',
30);

-- ───────────────────────────────────────────────────────────
-- Day 4 — Thu: Values under pressure (280 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 4, 'OT', 'poll_reasoning', 'dilemma', 'SSB', 'Ethics: Cheating Friend',
'{"scenario":"ETHICS DILEMMA: You are the only witness to a fellow cadet cheating on an important academy exam. He''s your closest friend and will be expelled if reported.","question":"What do you do?","options":["Report immediately - integrity first","Confront friend privately first","Report anonymously","Stay silent - not my responsibility"],"requires_reasoning":true}',
90);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 4, 'COM', 'reflect_write', 'reflect', 'Daily life', 'Difficult Conversation',
'{"prompt":"Think of the last time you had a difficult conversation (with a parent, friend, teacher). Write 3 sentences: what you said, what you wish you''d said differently, and why.","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 4, 'CONF', 'poll_reasoning', 'scenario', 'Daily life', 'Presentation Projector Fails',
'{"scenario":"You walk into a room for a presentation and the projector fails. 20 people are watching. You have no slides.","question":"What do you do in the first 15 seconds?","options":["Acknowledge it with humor and proceed verbally","Ask for 5 minutes to fix it","Start drawing on whiteboard","Ask audience to gather around your laptop"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 4, 'AWR', 'daily_challenge', 'challenge', 'SSB', 'Read Defence Editorial',
'{"task":"REAL WORLD TASK: Read one editorial today from a national newspaper (The Hindu, Indian Express, or Hindustan Times) about defence or foreign policy.","completion_criteria":"Summarise the argument in 3 bullet points."}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 4, 'LEAD', 'poll_reasoning', 'poll', 'Daily life', 'Leader Should Be Liked',
'{"question":"POLL: A leader should always be liked by their team. Agree or disagree?","options":["Agree - likability builds trust","Disagree - respect matters more","Agree but with boundaries","Disagree - results matter most"],"requires_reasoning":true,"reasoning_prompt":"Give your strongest 2-sentence argument."}',
40);

-- ───────────────────────────────────────────────────────────
-- Day 5 — Fri: Awareness & analysis (220 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 5, 'AWR', 'poll_reasoning', 'scenario', 'SSB', 'Aksai Chin Question',
'{"scenario":"In your PI, the interviewer asks: ''India and China both claim Aksai Chin. Who is right?'' You have to answer — not dodge.","question":"How do you respond?","options":["India is right - historical claim","Neither fully right - territorial disputes are complex","India is right based on 1947 accession","Explain India''s position without claiming absolute right"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 5, 'OT', 'reflect_write', 'reflect', 'Daily life', 'Autopilot Decision',
'{"prompt":"Write down one decision you made this week on autopilot — without really thinking. Looking back, was it the right call? What would a more deliberate version of you have decided?","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 5, 'COM', 'reflect_write', 'rapid_fire', 'SSB', 'Lecturette Opening',
'{"prompt":"RAPID FIRE — 20 seconds: Give the opening 2 sentences of a lecturette on ''The role of technology in modern warfare.'' Make them memorable.","time_limit":20,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 5, 'CONF', 'poll_reasoning', 'poll', 'Daily life', 'Admit I Don''t Know',
'{"question":"POLL: Is it okay to admit ''I don''t know'' in an SSB interview?","options":["Yes - honesty shows confidence","No - shows lack of preparation","Yes but with plan to find out","No - find a related answer"],"requires_reasoning":true,"reasoning_prompt":"Pick a side with reasoning."}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 5, 'LEAD', 'daily_challenge', 'challenge', 'Daily life', 'Delegation Practice',
'{"task":"REAL WORLD TASK: Today, delegate something you would normally do yourself — to a sibling, friend, or teammate. Brief them clearly. Then let them do it without hovering.","completion_criteria":"Note what happens."}',
60);

-- ───────────────────────────────────────────────────────────
-- Day 6 — Sat: Character stress test (280 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 6, 'CONF', 'poll_reasoning', 'dilemma', 'SSB', 'Friend Not Selected',
'{"scenario":"DILEMMA: You are selected for SSB but your close friend, who is more physically fit, is not. He''s devastated. He tells you ''You got lucky — I was clearly better.''","question":"What do you say?","options":["Acknowledge his pain, don''t defend selection","Explain that fitness isn''t everything","Say nothing - let him process","Challenge his framing respectfully"],"requires_reasoning":true}',
80);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 6, 'LEAD', 'reflect_write', 'reflect', 'SSB', 'Leader You Admire',
'{"prompt":"In 3 sentences, describe the leader you admire most — in your personal life (not a historical figure). What one quality of theirs would you most like to develop, and why?","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 6, 'AWR', 'poll_reasoning', 'scenario', 'Daily life', 'Viral Nuclear Test',
'{"scenario":"A friend sends you a viral social media post claiming India conducted a secret nuclear test. It sounds plausible. You''re in a group chat with 200 people.","question":"What do you do?","options":["Share it if it seems credible","Verify through official sources first","Ignore it completely","Ask the friend for their source"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 6, 'COM', 'poll_reasoning', 'scenario', 'SSB', 'Uniform Civil Code Lecturette',
'{"scenario":"You''re giving a 3-minute lecturette on ''Should India have a uniform civil code?'' You personally have a strong opinion.","question":"How do you structure the talk?","options":["Present both sides equally then state position","State position upfront then defend it","Present both sides, avoid taking position","Focus on one side, acknowledge other briefly"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 6, 'OT', 'daily_challenge', 'challenge', 'Daily life', 'Decision Rating',
'{"task":"REAL WORLD TASK: Before you sleep tonight, write down 3 decisions you made today — rate each as Good / Acceptable / Poor — and write one sentence on why.","completion_criteria":"No justification, just honest rating."}',
60);

-- ───────────────────────────────────────────────────────────
-- Day 7 — Sun: Integration & reflection (220 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 7, 'OT', 'poll_reasoning', 'scenario', 'SSB', 'NCC Camp Morale',
'{"scenario":"You are an NCC cadet leading a 5-day camp. On Day 3, you notice team morale is dropping — people are tired, irritable, and one cadet hasn''t eaten properly.","question":"What do you do?","options":["Call a team meeting immediately","Address the cadet''s food issue first","Inject energy with a group activity","Talk to senior cadets privately first"],"requires_reasoning":true}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 7, 'COM', 'reflect_write', 'reflect', 'Daily life', 'Hard to Communicate',
'{"prompt":"Think of one person in your life who is hard to communicate with. Write 2 sentences on what makes it hard — and 2 sentences on what YOU could do differently (not what they should change).","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 7, 'CONF', 'reflect_write', 'rapid_fire', 'SSB', 'Why Join Indian Army',
'{"prompt":"RAPID FIRE — 20 seconds: Complete this sentence with the most powerful answer you can: ''I want to join the Indian Army because...'' — no clichés allowed.","time_limit":20,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 7, 'LEAD', 'poll_reasoning', 'scenario', 'Daily life', 'Sibling Wrong Decision',
'{"scenario":"Your younger sibling is about to make a decision you know from experience is a mistake. But they haven''t asked for your advice.","question":"Do you speak up?","options":["Yes - share the lesson learned","No - let them learn themselves","Yes but frame as question","Wait until they ask"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(1, 7, 'AWR', 'reflect_write', 'reflect', 'SSB', 'Week 1 Review',
'{"prompt":"WEEK REVIEW: Name one thing you learned about India''s defence forces this week — and one gap in your knowledge you discovered. What''s your plan to fill it?","word_limit":150}',
40);


-- ═══════════════════════════════════════════════════════════
-- WEEK 2 — GEOPOLITICS & CURRENT AFFAIRS (35 missions, 1,740 XP)
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- Day 8 (Week 2, Day 1) — Mon: India & its neighbours (230 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 1, 'GEO', 'poll_reasoning', 'scenario', 'SSB', 'India''s Biggest Challenge',
'{"scenario":"Your PI interviewer asks: ''India shares borders with 7 countries. Which neighbour is India''s biggest strategic challenge in 2025 — and why not the obvious answer?''","question":"How do you respond?","options":["China - military and economic power","Pakistan - terrorism and proxy war","Nepal - changing strategic alignment","Bangladesh - water disputes and migration"],"requires_reasoning":true}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 1, 'CA', 'reflect_write', 'rapid_fire', 'SSB', 'Operation Sindoor Details',
'{"prompt":"RAPID FIRE — 25 seconds: What was Operation Sindoor, when did it happen, and name one strategic signal it sent to Pakistan?","time_limit":25,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 1, 'COM', 'poll_reasoning', 'poll', 'Daily life', 'Talk to Pakistan',
'{"question":"POLL: India should talk to Pakistan despite ongoing cross-border terrorism. Agree or disagree?","options":["Agree - dialogue is the only path","Disagree - talks reward terrorism","Agree but with preconditions","Disagree - actions speak louder"],"requires_reasoning":true,"reasoning_prompt":"Give your 2-sentence argument — no fence-sitting."}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 1, 'LEAD', 'reflect_write', 'reflect', 'Daily life', 'Different Background Teaching',
'{"prompt":"Write about a time someone from a different background (region, religion, economic class) taught you something important. What did it change about how you see leadership?","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 1, 'OT', 'daily_challenge', 'challenge', 'Daily life', 'Map India''s Neighbours',
'{"task":"REAL WORLD TASK: Find India on a physical or digital map. Identify all 7 land-border neighbours and one current issue with each. Write it down.","completion_criteria":"Time yourself — aim for under 5 minutes."}',
60);

-- ───────────────────────────────────────────────────────────
-- Day 9 (Week 2, Day 2) — Tue: Power, conflict & doctrine (240 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 2, 'GEO', 'poll_reasoning', 'dilemma', 'SSB', 'US Defence Partnership',
'{"scenario":"DILEMMA: India is offered a defence partnership by the US that gives India advanced weapons but requires India to share intelligence on China.","question":"Should India accept?","options":["Yes - strategic advantage outweighs risk","No - compromises strategic autonomy","Yes but negotiate terms","No - maintain non-alignment"],"requires_reasoning":true}',
80);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 2, 'CA', 'poll_reasoning', 'scenario', 'SSB', 'Agnipath Scheme GD',
'{"scenario":"In a GD, the topic is: ''India''s Agnipath scheme has done more harm than good.'' You have 3 minutes to form a position.","question":"What''s your stance and core argument?","options":["Agree - undermines military readiness","Disagree - modernizes force structure","Agree - poor implementation overshadows intent","Disagree - early to judge long-term impact"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 2, 'CONF', 'reflect_write', 'rapid_fire', 'SSB', 'No First Use Doctrine',
'{"prompt":"RAPID FIRE — 20 seconds: What is India''s ''No First Use'' nuclear doctrine and name one country that does NOT follow this doctrine?","time_limit":20,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 2, 'AWR', 'reflect_write', 'reflect', 'SSB', 'Atmanirbhar Defence',
'{"prompt":"Name one Indian defence indigenisation success from the last 3 years (under the Atmanirbhar Bharat push). What does it mean for India''s long-term strategic independence?","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 2, 'OT', 'poll_reasoning', 'poll', 'SSB', 'UNSC Membership',
'{"question":"POLL: India should pursue permanent membership of the UN Security Council — even if it means diplomatic friction with current P5 members. Agree or disagree?","options":["Agree - India deserves a seat","Disagree - costs outweigh benefits","Agree but through gradual diplomacy","Disagree - UNSC is outdated anyway"],"requires_reasoning":true}',
40);

-- ───────────────────────────────────────────────────────────
-- Day 10 (Week 2, Day 3) — Wed: India's military & society (260 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 3, 'CA', 'poll_reasoning', 'scenario', 'SSB', 'Defence Forces Pride & Concern',
'{"scenario":"The interviewer says: ''Tell me one thing India''s defence forces did in 2024-25 that made you proud — and one thing that concerned you.'' Both answers required.","question":"How do you respond?","options":["Proud: operational success / Concerned: veteran welfare","Proud: modernization / Concerned: recruitment challenges","Proud: disaster relief / Concerned: equipment delays","Proud: border management / Concerned: work-life balance"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 3, 'GEO', 'reflect_write', 'rapid_fire', 'SSB', 'The Quad',
'{"prompt":"RAPID FIRE — 25 seconds: What is the Quad and name one concrete outcome it has produced in the Indo-Pacific?","time_limit":25,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 3, 'COM', 'daily_challenge', 'challenge', 'Daily life', 'Explain to Family',
'{"task":"REAL WORLD TASK: Explain Operation Sindoor or the Quad to a family member who has no defence background — in under 2 minutes, using only plain language and one analogy.","completion_criteria":"Note their reaction and whether they understood."}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 3, 'CONF', 'poll_reasoning', 'dilemma', 'Daily life', 'SSB Result Not Recommended',
'{"scenario":"DILEMMA: You scored very well in written SSB but performed averagely in your GTO. Your result is ''Not Recommended.'' You genuinely feel the assessors got it wrong.","question":"What is your response?","options":["Accept it and prepare for next attempt","Request feedback to understand gap","Challenge the assessment formally","Reflect on where perception diverged"],"requires_reasoning":true}',
70);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 3, 'LEAD', 'poll_reasoning', 'scenario', 'Daily life', 'College Event Crisis',
'{"scenario":"You are put in charge of organising your college''s annual event. Two days before, your core team has a falling out and two key people quit.","question":"What do you do in the first hour?","options":["Rally remaining team with clear plan","Find immediate replacements","Simplify event scope to essentials","Talk to both people who quit"],"requires_reasoning":true}',
50);

-- ───────────────────────────────────────────────────────────
-- Day 11 (Week 2, Day 4) — Thu: Ethics, identity & purpose (260 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 4, 'OT', 'poll_reasoning', 'dilemma', 'SSB', 'Village Burning Order',
'{"scenario":"ETHICS: You are a junior officer. During a counter-insurgency operation, your senior orders you to burn down a village suspected of sheltering militants — there is no confirmed evidence.","question":"What do you do?","options":["Refuse the order - illegal and unethical","Execute order - chain of command","Question the order and request evidence","Execute but report through proper channels later"],"requires_reasoning":true}',
90);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 4, 'GEO', 'poll_reasoning', 'poll', 'SSB', 'Recognise Taliban',
'{"question":"POLL: India should formally recognise the Taliban government in Afghanistan to protect its strategic interests there. Agree or disagree?","options":["Agree - pragmatism over principles","Disagree - legitimizes terrorism","Agree - regional stability matters","Disagree - women''s rights matter"],"requires_reasoning":true}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 4, 'AWR', 'reflect_write', 'rapid_fire', 'SSB', 'Space Achievement',
'{"prompt":"RAPID FIRE — 20 seconds: Name one Indian space or science achievement from 2023-25 and its defence or strategic significance.","time_limit":20,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 4, 'COM', 'reflect_write', 'reflect', 'Daily life', 'SSB Self Introduction',
'{"prompt":"Write your SSB self-introduction in exactly 5 sentences. Rule: each sentence must reveal something specific — no adjective without evidence, no claim without proof.","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 4, 'CONF', 'daily_challenge', 'challenge', 'SSB', 'Record Weakness Answer',
'{"task":"REAL WORLD TASK: Record yourself (voice or video) answering this PI question: ''What is your biggest weakness and what are you doing about it?'' Play it back.","completion_criteria":"Identify one thing to improve before your next attempt."}',
60);

-- ───────────────────────────────────────────────────────────
-- Day 12 (Week 2, Day 5) — Fri: Ground realities & strategy (230 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 5, 'GEO', 'poll_reasoning', 'scenario', 'SSB', 'Belt and Road GD',
'{"scenario":"GD topic: ''China''s Belt and Road Initiative is a debt trap for South Asian nations — and India is right to stay out.'' You have a position.","question":"Argue it in front of the group.","options":["Agree - BRI is predatory lending","Disagree - India missing opportunity","Agree - sovereignty matters most","Disagree - engagement better than isolation"],"requires_reasoning":true}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 5, 'CA', 'reflect_write', 'rapid_fire', 'SSB', 'INS Vikrant',
'{"prompt":"RAPID FIRE — 25 seconds: What is the significance of INS Vikrant and name one capability it gives India that it did not have before?","time_limit":25,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 5, 'LEAD', 'daily_challenge', 'challenge', 'Daily life', 'Amplify Ignored Voice',
'{"task":"REAL WORLD TASK: Today, when you are in a group (class, family, friends), notice who is being ignored or talked over. Make one deliberate effort to bring their voice into the conversation.","completion_criteria":"Note what happened."}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 5, 'OT', 'reflect_write', 'reflect', 'SSB', 'Mountain Warfare Doctrine',
'{"prompt":"In 3 sentences: what is India''s military doctrine for mountain warfare and why does it matter given the current LAC situation?","word_limit":150}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 5, 'AWR', 'poll_reasoning', 'poll', 'SSB', 'Mandatory Physical Training',
'{"question":"POLL: India should reinstate mandatory physical training in all central universities to build a defence-ready youth. Agree or disagree?","options":["Agree - national preparedness","Disagree - individual choice matters","Agree - builds discipline","Disagree - resources better spent elsewhere"],"requires_reasoning":true,"reasoning_prompt":"2-sentence argument."}',
40);

-- ───────────────────────────────────────────────────────────
-- Day 13 (Week 2, Day 6) — Sat: Geopolitical flashpoints (270 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 6, 'GEO', 'poll_reasoning', 'dilemma', 'SSB', 'South China Sea Coalition',
'{"scenario":"DILEMMA: India is asked to choose between joining a US-led naval coalition against China in the South China Sea or staying neutral. There are strong economic and strategic arguments on both sides.","question":"What does India do?","options":["Join - counter China''s rise","Stay neutral - protect trade","Join conditionally - with caveats","Stay neutral - maintain autonomy"],"requires_reasoning":true}',
80);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 6, 'CA', 'poll_reasoning', 'scenario', 'SSB', 'Social Media Defence Awareness',
'{"scenario":"GD topic: ''Social media has made Indian youth more aware of defence issues — but also more prone to misinformation.''","question":"How do you argue this in a GD?","options":["Agree - access without verification","Disagree - net positive for awareness","Agree - echo chambers dominate","Disagree - youth can discern truth"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 6, 'COM', 'reflect_write', 'rapid_fire', 'SSB', 'Russia-Ukraine Impact',
'{"prompt":"RAPID FIRE — 20 seconds: Give a crisp 2-sentence summary of the Russia-Ukraine conflict''s impact on India''s defence procurement strategy.","time_limit":20,"is_timed":true}',
30);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 6, 'CONF', 'poll_reasoning', 'scenario', 'Daily life', 'Kashmir Human Rights Claim',
'{"scenario":"You are at a social gathering and someone loudly claims ''The Indian Army''s human rights record in Kashmir is terrible.'' You disagree. You are the only one who seems bothered.","question":"Do you respond — and how?","options":["Respond with counter-facts","Ask them for specific sources","Stay silent - wrong setting","Respond but seek private conversation"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 6, 'OT', 'daily_challenge', 'challenge', 'SSB', 'Geopolitical Event Analysis',
'{"task":"REAL WORLD TASK: Pick any one recent India-related geopolitical event from this week''s news. Write a 5-sentence analysis: what happened, who the actors are, what India''s interest is, what India likely did/should do, and why it matters long-term.","completion_criteria":"Complete the 5-sentence analysis."}',
60);

-- ───────────────────────────────────────────────────────────
-- Day 14 (Week 2, Day 7) — Sun: Week review & synthesis (250 XP)
-- ───────────────────────────────────────────────────────────

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 7, 'GEO', 'reflect_write', 'reflect', 'SSB', 'Geopolitical Concept Review',
'{"prompt":"Week review: Name one geopolitical concept you encountered this week that you didn''t fully understand before (strategic autonomy, NFU, BRI, Quad, etc.). Write 3 sentences: what it is, why it matters to India, and one open question you still have about it.","word_limit":150}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 7, 'CA', 'poll_reasoning', 'poll', 'SSB', 'Biggest Security Threat',
'{"question":"POLL: India''s biggest national security threat in the next 10 years is: (A) China''s military expansion, (B) Pakistan-sponsored terrorism, (C) Internal insurgency, or (D) Cyber warfare.","options":["China - military and economic challenge","Pakistan - persistent proxy war","Internal insurgency - fragmentation risk","Cyber warfare - invisible battlefield"],"requires_reasoning":true,"reasoning_prompt":"Pick one and defend it in 3 sentences."}',
40);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 7, 'LEAD', 'poll_reasoning', 'scenario', 'SSB', 'Final SSB Day Exhaustion',
'{"scenario":"You are in the final day of SSB. You are exhausted. The last task is a group conference where candidates introduce themselves and assessors observe. You have nothing left.","question":"What do you do?","options":["Push through with energy - fake it","Be authentic about exhaustion","Focus on others - deflect attention","Use humor to deflect fatigue"],"requires_reasoning":true}',
50);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 7, 'COM', 'daily_challenge', 'challenge', 'SSB', 'Lecturette Practice',
'{"task":"REAL WORLD TASK: Write a 90-second lecturette on any topic from this week — geopolitics, current affairs, or defence — and deliver it out loud to yourself or someone else. Time it. Record it if you can.","completion_criteria":"Review: did you use a hook, body, and close?"}',
60);

INSERT INTO missions (week_number, unlock_day, category, mission_type, subtype, source_type, title, content, xp_reward) VALUES
(2, 7, 'OT', 'reflect_write', 'reflect', 'SSB', 'Belief Changed This Week',
'{"prompt":"Final reflection: What is one belief about India, the military, or leadership that this week''s missions challenged or changed? Write 3 sentences — what you believed before, what changed it, and what you believe now.","word_limit":150}',
50);

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════

-- Total mission count
-- Expected: 70
-- SELECT COUNT(*) FROM missions;

-- Missions by week
-- Expected: Week 1 = 35, Week 2 = 35
-- SELECT week_number, COUNT(*) FROM missions GROUP BY week_number ORDER BY week_number;

-- Missions by category
-- Expected: COM=12, CONF=11, LEAD=12, AWR=10, OT=11, GEO=7, CA=7
-- SELECT category, COUNT(*) FROM missions GROUP BY category ORDER BY category;

-- Missions by type
-- Expected: reflect_write=27, poll_reasoning=34, daily_challenge=9
-- SELECT mission_type, COUNT(*) FROM missions GROUP BY mission_type ORDER BY mission_type;

-- Missions by subtype
-- Expected: scenario=19, reflect=15, rapid_fire=12, poll=11, challenge=9, dilemma=4
-- SELECT subtype, COUNT(*) FROM missions GROUP BY subtype ORDER BY subtype;

-- Total XP by week
-- Expected: Week 1 = 1,690, Week 2 = 1,740
-- SELECT week_number, SUM(xp_reward) FROM missions GROUP BY week_number ORDER BY week_number;

-- Total XP across all missions
-- Expected: 3,430
-- SELECT SUM(xp_reward) FROM missions;
