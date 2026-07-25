# DAY 0 VALIDATION SLICE — QUICK START GUIDE

**Status:** ✅ Implementation Complete  
**Ready to Test:** Yes  
**Time to Test:** 15-20 minutes

---

## WHAT YOU GOT

A working prototype that validates the training experience:
- 10 MCQ questions about SSB fundamentals
- Question-by-question session flow
- Instant feedback with explanations
- XP awards (saves to your profile)
- Score and performance summary

---

## HOW TO TEST

### 1. Start the App
```bash
npx expo start
```

### 2. Login
- Use your existing account
- Navigate to Dashboard (Home tab)

### 3. Look for the New Card
You'll see a new amber-colored card above your daily mission:

```
🎯 DAY 0 TRAINING VALIDATION
   Test the new question-by-question session flow
   [BEGIN PROTOTYPE SESSION →]
```

### 4. Run Through the Flow
1. Tap "Begin Prototype Session"
2. Answer all 10 questions
3. Get instant feedback after each
4. See your final score and XP award
5. Return to dashboard

---

## WHAT TO EVALUATE

### UX Questions
- ✅ Does the flow feel natural?
- ✅ Is feedback clear and helpful?
- ✅ Does progress feel tangible?
- ✅ Is the completion screen rewarding?

### Design Questions
- ✅ Does it match The Forge's tactical aesthetic?
- ✅ Are correct/incorrect states obvious?
- ✅ Is typography readable?

### Technical Questions
- ✅ Does XP save correctly?
- ✅ Does the back button work?
- ✅ Any crashes or errors?

---

## AFTER TESTING

### If You Love It ✅
Reply: "Day 0 validated. Proceed with V2."

I'll:
1. Delete the 3 throwaway files
2. Revert the dashboard modification
3. Start building the full V2 architecture per `V2_IMPLEMENTATION_PLAN.md`

### If You Want Changes 🔄
Reply with specific feedback:
- "The feedback should show before/after the question"
- "XP animation is too fast"
- "Need better explanation formatting"
- Etc.

I'll iterate on the prototype until it's right, THEN commit to V2.

---

## FILES CREATED

**Throwaway (will be deleted):**
- `src/data/day0-mock.ts` — Mock questions
- `app/day0-prototype.tsx` — Session flow
- `app/day0-complete.tsx` — Completion screen

**Modified (will be reverted):**
- `app/(tabs)/index.tsx` — Added Day 0 card
- `src/services/auth.service.ts` — Added temporary `awardXP()`

---

## IMPORTANT NOTES

### This is a Prototype
- Uses mock/hardcoded data
- No database changes
- No migrations
- Only 10 questions
- MCQ only
- Throwaway code

### The Real V2 Will Have
- Full database schema
- Service layer architecture
- 6 question types
- 8 days of content
- Content management system
- Session state management
- Days 1-8 implementation

---

## QUESTIONS?

**"Can I test this multiple times?"**  
Yes! Each time you tap "Begin Prototype", you start fresh. XP awards stack.

**"What if I close the app mid-session?"**  
Your progress isn't saved until completion. This is intentional for the prototype.

**"Will this affect my daily mission?"**  
No. This is separate from your V1 mission system. Both work independently.

**"What happens to my XP?"**  
It's real! The XP is added to your total_xp and counts toward rank progression.

**"Should my co-founder test this?"**  
YES! Get their feedback before we commit to full V2 build.

---

## TIMELINE

**Today (June 15):**
- Test Day 0 prototype
- Gather feedback
- Make iteration decisions

**Tomorrow (June 16) if validated:**
- Delete prototype files
- Start Phase 1 of V2 (database schema)
- Build production architecture

**Goal:**
- Beta launch June 20 (5 days from now)
- V2 experience validated and production-ready

---

**Ready to test?** Fire up the app and try it out! 🎯
