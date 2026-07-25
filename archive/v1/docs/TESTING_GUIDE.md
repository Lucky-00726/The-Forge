# THE FORGE — Quick Testing Guide
### Day 2 Mission Engine Testing

**Before you start:** Verify Supabase setup is complete (see DAY1_SETUP.md)

---

## **Quick Start**

```bash
# 1. Start the app
npx expo start

# 2. Press 'i' for iOS Simulator or 'a' for Android

# 3. Create a test account
#    Email: test1@theforge.app
#    Password: test123456
#    Display Name: Test Officer 1
```

---

## **5-Minute Smoke Test**

### **Test 1: Sign Up & Dashboard** (1 min)
- [ ] Sign up creates account
- [ ] Dashboard loads with mission card
- [ ] Stats show: Cadet, 0 XP, 0d streak
- [ ] Mission card shows a week 1, day 1 mission

### **Test 2: Mission Execution** (2 min)
- [ ] Tap "Commence Mission"
- [ ] Mission detail loads with correct type
- [ ] Complete the mission (type text or select option)
- [ ] Submit button enables when requirements met
- [ ] Tap submit → success screen appears

### **Test 3: Success & Return** (1 min)
- [ ] Success screen shows XP awarded (+40 or +50)
- [ ] Streak shows 1 day
- [ ] Rank shows Cadet
- [ ] Tap "Return to Base" → dashboard
- [ ] Dashboard shows "Today's Mission Complete"

### **Test 4: Profile Update** (1 min)
- [ ] Go to Profile tab
- [ ] Stats show: 40-50 XP, 1d streak, Cadet rank
- [ ] Sign out works
- [ ] Sign back in → dashboard shows "completed" state

**✅ If all 4 tests pass: Core loop is working**

---

## **Full Test Suite (15 Cases)**

See `DAY2_COMPLETION.md` § Testing Checklist for:
- All 3 mission types
- Word count gates
- Already completed detection
- Rank promotion
- Streak calculation
- Error handling
- Pull-to-refresh
- Android device testing

---

## **Test Data Access**

### **View mission completions:**
```sql
SELECT u.display_name, mc.mission_id, mc.completed_date, mc.xp_awarded
FROM mission_completions mc
JOIN users u ON u.id = mc.user_id
WHERE mc.completed_date = (now() AT TIME ZONE 'Asia/Kolkata')::date
ORDER BY mc.completed_date DESC;
```

### **View user stats:**
```sql
SELECT display_name, total_xp, current_rank, current_streak, last_active_date
FROM users
ORDER BY created_at DESC;
```

### **Reset test user (for re-testing):**
```sql
-- Delete completions
DELETE FROM mission_completions WHERE user_id = 'YOUR_USER_ID';

-- Reset stats
UPDATE users SET
  total_xp = 0,
  current_rank = 'Cadet',
  current_streak = 0,
  last_active_date = NULL
WHERE id = 'YOUR_USER_ID';
```

---

## **Common Issues & Fixes**

### **Issue: "Mission not found"**
**Cause:** Mission seed not run  
**Fix:** Run `002_seed_missions.sql` in Supabase SQL Editor

### **Issue: "Already completed" immediately**
**Cause:** `created_at` is old, day calculation off  
**Fix:** Check `SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date;` in Supabase

### **Issue: Dashboard shows "No mission available"**
**Cause:** User is on day 15+ (no seed data)  
**Fix:** Expected behavior — need to run TASK-030 (week 3-4 seeds)

### **Issue: Submit button won't enable**
**Cause:** Word count threshold not met  
**Fix:** Type more words until progress bar turns green

### **Issue: Stats not updating after completion**
**Cause:** Profile not refreshing  
**Fix:** Navigate to Profile tab, then back to Home

---

## **Test Account Creation (For Multiple Tests)**

Create 5 test accounts with different `created_at` dates to test week/day progression:

```
test1@theforge.app → today (week 1, day 1)
test2@theforge.app → created yesterday (week 1, day 2)
test3@theforge.app → created 6 days ago (week 1, day 7)
test4@theforge.app → created 7 days ago (week 2, day 1)
test5@theforge.app → created 13 days ago (week 2, day 7)
```

To adjust `created_at` for testing:
```sql
UPDATE auth.users SET created_at = now() - interval '1 day'
WHERE email = 'test2@theforge.app';

UPDATE users SET created_at = now() - interval '1 day'
WHERE id = (SELECT id FROM auth.users WHERE email = 'test2@theforge.app');
```

---

## **Rank Promotion Testing**

To test rank promotion, set XP near threshold:

```sql
-- Test Officer promotion (400 XP threshold)
UPDATE users SET total_xp = 380, current_rank = 'Cadet'
WHERE email = 'test1@theforge.app';

-- Complete a 40 XP mission → should promote to Officer

-- Test Commander promotion (1200 XP threshold)
UPDATE users SET total_xp = 1180, current_rank = 'Officer'
WHERE email = 'test1@theforge.app';

-- Complete a 40 XP mission → should promote to Commander
```

---

## **Streak Testing**

### **Test: Streak increments**
1. Complete mission today (streak = 1)
2. Adjust `last_active_date` to yesterday:
   ```sql
   UPDATE users SET last_active_date = (now() AT TIME ZONE 'Asia/Kolkata')::date - 1
   WHERE email = 'test1@theforge.app';
   ```
3. Complete mission again (streak should be 2)

### **Test: Streak resets**
1. Complete mission today (streak = 1)
2. Adjust `last_active_date` to 3 days ago:
   ```sql
   UPDATE users SET last_active_date = (now() AT TIME ZONE 'Asia/Kolkata')::date - 3
   WHERE email = 'test1@theforge.app';
   ```
3. Complete mission again (streak should reset to 1)

---

## **Android Testing Checklist**

### **Layout Verification:**
- [ ] Test on 5.5" screen (small)
- [ ] Test on 6.7" screen (large)
- [ ] Mission card text doesn't overflow
- [ ] Progress bars render correctly
- [ ] Buttons are tappable (min 44px touch target)

### **Interaction Testing:**
- [ ] Keyboard pushes content up (not covering input)
- [ ] Pull-to-refresh works smoothly
- [ ] Back button works (doesn't exit app unexpectedly)
- [ ] Mission type components scroll correctly
- [ ] Text input cursor visible

### **Performance:**
- [ ] App doesn't lag on mission list scroll
- [ ] Success screen animation smooth
- [ ] Navigation transitions smooth

---

## **If Tests Fail**

1. **Check Supabase connection:**
   - Verify `.env` file values
   - Check Supabase project is not paused

2. **Check migrations:**
   - Verify `SELECT count(*) FROM missions;` returns 14
   - Verify `SELECT count(*) FROM users;` returns your test accounts

3. **Check logs:**
   - iOS: Xcode console
   - Android: `adb logcat | grep ReactNative`
   - Expo: Check Metro bundler terminal

4. **Reset and retry:**
   - Delete mission_completions
   - Reset user stats
   - Sign out and sign back in

---

## **Test Sign-Off**

After completing testing, update `BUILD_LOG.md`:

```markdown
### Testing Status

| Test | Status | Notes |
|------|--------|-------|
| Smoke test (4 cases) | ✅ Pass | Core loop working |
| Full test suite (15 cases) | ✅ Pass | All mission types verified |
| Android device testing | ✅ Pass | Tested on [device names] |
| iOS device testing | ✅ Pass | Tested on [device names] |
```

---

**Next step after testing:** Execute TASK-030 (seed weeks 3-4) and TASK-031 (UI polish)

---

*For detailed test cases, see `DAY2_COMPLETION.md` § Testing Checklist*
