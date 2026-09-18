# DAY 0 VALIDATION TESTING GUIDE

**Purpose:** Systematically test the Day 0 prototype to gather data for V2 decisions  
**Time Required:** 20-30 minutes (including report completion)  
**Document to Fill:** `DAY0_VALIDATION_REPORT.md`

---

## PREPARATION (5 minutes)

### 1. Setup Your Environment
```bash
# Start the development server
npx expo start
```

### 2. Open the Validation Report
Open `DAY0_VALIDATION_REPORT.md` in your editor alongside the app.

### 3. Have a Timer Ready
- Use your phone's stopwatch or timer
- You'll track overall time and per-question time

### 4. Clear Your Mind
- Test as if you're a first-time user
- Note your genuine reactions
- Don't rush — experience it naturally

---

## TESTING PROTOCOL

### Phase 1: Initial State (2 minutes)

**Before starting the session:**

1. Record your starting XP: ________
2. Record your starting rank: ________
3. Take a screenshot of your dashboard (optional)
4. Note the time: ____:____

### Phase 2: Session Execution (5-10 minutes)

**Start the timer when you tap "Begin Prototype Session"**

**For EACH question:**
1. Read the question carefully
2. Consider all options
3. Select your answer
4. Tap "Submit Answer"
5. Read the feedback
6. Read the explanation
7. Note the time spent (rough estimate or mark every 2-3 questions)
8. Tap "Next Question"

**Important:** Don't rush! Experience it at a natural pace.

### Phase 3: Completion (2 minutes)

**When you reach the completion screen:**
1. Stop the timer
2. Record total time
3. Note your score
4. Watch the XP save animation
5. Review the insights
6. Tap "Return to Command"

### Phase 4: Dashboard Verification (1 minute)

**Back on the dashboard:**
1. Verify XP updated correctly
2. Check rank progress bar
3. Note if rank changed
4. Take final screenshot (optional)

---

## DATA COLLECTION CHECKLIST

### ✅ Must Record

**Timing Data:**
- [ ] Total session time (start to completion)
- [ ] Approximate time per question (or every few questions)
- [ ] Time spent reading explanations

**Performance Data:**
- [ ] Final score (X/10)
- [ ] XP earned
- [ ] Starting vs ending total XP

**Subjective Experience:**
- [ ] Where engagement peaked
- [ ] Where engagement dipped (if at all)
- [ ] Any moments of confusion
- [ ] Any urge to quit

**Session Length Opinion:**
- [ ] Did 10 feel right, too short, or too long?
- [ ] Would you do 20 questions?
- [ ] What's your ideal session length?

---

## TESTING VARIATIONS (Optional)

### Test 1: Natural Pace
Complete the session at your natural reading/thinking pace.

### Test 2: Speed Run
If you have time, test again and try to complete as quickly as possible while still reading. This shows the minimum time commitment.

### Test 3: Deep Reading
Test again but read every explanation thoroughly. This shows the maximum time commitment.

**This helps us understand the time range: X to Y minutes**

---

## COMMON PITFALLS TO AVOID

### ❌ Don't Do This:
- Rush through without reading
- Skip feedback/explanations to save time
- Test while distracted
- Test multiple times back-to-back (causes bias)

### ✅ Do This:
- Experience it as a real user would
- Note genuine reactions (confusion, delight, boredom)
- Test at different times of day if possible
- Get your co-founder to test independently

---

## CRITICAL QUESTIONS TO ANSWER

While testing, actively think about these:

### Engagement
- **"Am I still interested at question 7?"**
- **"Would I do this daily?"**
- **"Does the feedback make me want to learn more?"**

### SSB Relevance
- **"Is this teaching me SSB-specific knowledge?"**
- **"Would this help me in the actual SSB interview?"**
- **"Does it feel like generic military trivia or targeted SSB prep?"**

### Session Length
- **"If this were 20 questions, would I finish?"**
- **"What's the maximum I'd do daily?"**
- **"Does 10 feel like enough progress for one day?"**

### Drop-Off Risk
- **"When did I check the progress bar anxiously?"**
- **"At what point did I think 'how many more?'"**
- **"If I could save progress and return later, when would I pause?"**

---

## AFTER TESTING

### 1. Complete the Validation Report (10 minutes)
Fill out `DAY0_VALIDATION_REPORT.md` while the experience is fresh.

### 2. Review Your Notes
Look for patterns:
- Did specific questions take longer?
- Did you learn something new?
- Did any feedback feel generic?

### 3. Make Your Recommendation
The most important section of the report is **FINAL VERDICT**:
- Is Day 0 validated?
- Should we proceed to full V2?
- What changes are needed?

### 4. Get Co-Founder Feedback
Have your co-founder test independently and compare notes:
- Did you have similar experiences?
- Different timing?
- Different engagement points?

---

## DECISION TREE

### If Testing Goes Well ✅
**Score: 35-40/40 | Time: 5-10 min | No drop-off urge | High SSB relevance**

→ **Recommendation:** Validate and proceed to V2 Phase 1  
→ **Next:** Delete prototype files, start database schema

### If Testing Shows Minor Issues ⚠️
**Score: 28-34/40 | Time: acceptable | Minor issues identified**

→ **Recommendation:** Make 2-3 specific tweaks to prototype  
→ **Next:** Iterate on throwaway files, re-test, then proceed

### If Testing Shows Major Issues ❌
**Score: <28/40 | Time: too long/short | Drop-off risk | Low SSB relevance**

→ **Recommendation:** Rethink the approach  
→ **Next:** Design workshop before building V2

---

## SUCCESS METRICS

### Minimum Acceptable Thresholds

**Engagement:**
- Overall flow rating: ≥ 3.5/5
- No strong urge to quit
- Would do this daily: Yes or Mostly

**Timing:**
- Total time: 5-12 minutes
- Average per question: 30-70 seconds
- Not too rushed, not too slow

**Content:**
- SSB relevance: ≥ 3/5
- Would recommend to SSB aspirant: Yes or Probably
- Learned something new: Yes (at least a few questions)

**Session Length:**
- 10 questions feels: Just right or Too short
- Would do 20 questions: Yes or Maybe

If you hit these thresholds → **Day 0 is validated** ✅

---

## QUESTIONS FOR KIRO (After Testing)

Based on your validation results, you might ask:

**If validated:**
- "Day 0 validated. Proceed with V2. Keep session length at X questions."

**If needs iteration:**
- "Day 0 mostly validated, but change X before full V2."
- "Should we increase session length to 15 instead of 10 or 20?"
- "Can we add intermediate progress milestones?"

**If rethinking needed:**
- "The MCQ-only approach doesn't feel SSB-focused enough. Should we mix question types from Day 1?"
- "10 questions felt too short, but 20 seems too long. What's the optimal middle ground?"

---

## FINAL CHECKLIST

Before reporting back:

- [ ] Completed full 10-question session
- [ ] Recorded all timing data
- [ ] Filled out subjective ratings (1-5 scales)
- [ ] Identified drop-off risks (if any)
- [ ] Evaluated SSB-specific focus
- [ ] Made session length recommendation (10 vs 20)
- [ ] Wrote final verdict (validated or not)
- [ ] Listed any bugs/issues encountered
- [ ] Got co-founder feedback (or scheduled)
- [ ] Ready to make V2 decision

---

## REPORT SUBMISSION

When you're done testing and filling out the report:

**Share your verdict:**
1. "Day 0 validated. Proceed with V2 at X questions per session."
2. "Day 0 needs these tweaks: [list]"
3. "Day 0 approach needs rethinking because [reason]"

**Include key data:**
- Total time: _____ minutes
- Score: _____ / 10
- Session length preference: _____ questions
- Overall rating: _____ / 40

This gives me the data needed to make the right V2 decisions.

---

**Ready to test?** 🎯

1. Start `npx expo start`
2. Open `DAY0_VALIDATION_REPORT.md`
3. Begin testing with timer ready
4. Experience it naturally
5. Fill out the report
6. Report back with verdict

Good luck with validation testing!
