# AI Evaluation Testing Guide

Quick reference for testing the AI evaluation integration in Session 3.

---

## Setup

### 1. Get OpenRouter API Key

1. Visit: https://openrouter.ai/
2. Sign up / Log in
3. Go to: https://openrouter.ai/keys
4. Create new API key
5. Copy the key

### 2. Configure Environment

**File**: `.env`

```env
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
EXPO_PUBLIC_OPENROUTER_MODEL=openai/gpt-oss-20b:free
```

### 3. Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Start fresh
npx expo start --clear
```

---

## Test Scenarios

### Scenario 1: Happy Path (AI Success)

**Steps**:
1. Start Session 3 from dashboard
2. Answer all 10 questions (meet minimum word counts)
3. After final question, submit
4. Observe: "EVALUATING RESPONSES..." loading state
5. Wait 2-5 seconds
6. Navigate to completion screen
7. Verify: AI Evaluation section appears below objective metrics
8. Verify: Overall Score, Strengths, Improvements, Summary displayed

**Expected Console Logs**:
```
[Analytics] { event: 'session3_started', sessionNumber: 3, ... }
[AI Evaluation] Starting batch evaluation for 10 responses
[AI Evaluation] Model: openai/gpt-oss-20b:free
[AI Evaluation] Success - Score: 72/100 (2340ms)
[Analytics] { event: 'ai_evaluation_completed', overallScore: 72, duration: 2340, ... }
[Analytics] { event: 'session3_completed', xpEarned: 200, ... }
[Analytics] { event: 'day0_completed' }
```

**Acceptance Criteria**:
- ✅ Loading state appears
- ✅ AI evaluation completes within 5 seconds
- ✅ Feedback displays correctly
- ✅ XP awarded (200 XP)
- ✅ User can navigate to dashboard

---

### Scenario 2: Missing API Key

**Steps**:
1. Remove `EXPO_PUBLIC_OPENROUTER_API_KEY` from `.env`
2. Restart app
3. Complete Session 3 (all 10 questions)
4. Submit final question

**Expected Console Logs**:
```
[Analytics] { event: 'session3_started', ... }
[AI Evaluation] No API key found
[Analytics] { event: 'ai_evaluation_failed', error: 'Missing API key', ... }
[Analytics] { event: 'session3_completed', ... }
[Analytics] { event: 'day0_completed' }
```

**Expected Behavior**:
- ✅ No loading state appears (instant navigation)
- ✅ Completion screen shows objective metrics
- ✅ AI evaluation section NOT shown
- ✅ Message: "AI evaluation provides developmental feedback..."
- ✅ XP awarded (200 XP)
- ✅ User completes session normally

---

### Scenario 3: Invalid API Key

**Steps**:
1. Set `EXPO_PUBLIC_OPENROUTER_API_KEY=invalid-key-12345`
2. Restart app
3. Complete Session 3
4. Submit final question

**Expected Console Logs**:
```
[AI Evaluation] Starting batch evaluation for 10 responses
[AI Evaluation] API error: 401 - Unauthorized
[Analytics] { event: 'ai_evaluation_failed', error: 'API error: 401', ... }
[Analytics] { event: 'session3_completed', ... }
```

**Expected Behavior**:
- ✅ Loading state appears briefly
- ✅ Session completes normally
- ✅ No AI evaluation shown
- ✅ XP awarded correctly

---

### Scenario 4: Request Timeout

**Steps**:
1. Use valid API key
2. Modify timeout in `ai-evaluation.service.ts` to 100ms (for testing):
   ```typescript
   const REQUEST_TIMEOUT = 100; // Force timeout
   ```
3. Complete Session 3

**Expected Console Logs**:
```
[AI Evaluation] Starting batch evaluation for 10 responses
[AI Evaluation] Request timeout
[Analytics] { event: 'ai_evaluation_failed', error: 'Request timeout', ... }
```

**Expected Behavior**:
- ✅ Loading state appears
- ✅ Timeout after 100ms
- ✅ Session completes normally
- ✅ No AI evaluation shown

**Cleanup**: Restore timeout to `45000` after testing.

---

### Scenario 5: Network Failure

**Steps**:
1. Disconnect from internet
2. Complete Session 3

**Expected Console Logs**:
```
[AI Evaluation] Starting batch evaluation for 10 responses
[AI Evaluation] Error: Network request failed
[Analytics] { event: 'ai_evaluation_failed', error: 'Network request failed', ... }
```

**Expected Behavior**:
- ✅ Session completes normally
- ✅ No AI evaluation shown
- ✅ XP awarded correctly

---

## Quality Checks

### 1. Response Quality Test

**Purpose**: Verify AI provides meaningful feedback

**Test Answers**:

**Strong Answers** (expect high score):
- Detailed, action-oriented
- Clear reasoning
- Demonstrates responsibility
- Well-structured

**Weak Answers** (expect low score):
- Very short (1-2 words)
- No reasoning
- Vague or unclear
- No action orientation

**Expected**:
- Strong answers → Score 70-90
- Mixed answers → Score 50-70
- Weak answers → Score 30-50

---

### 2. Feedback Relevance Test

**Check**:
- ✅ Strengths are specific (not generic)
- ✅ Improvements are actionable
- ✅ Summary is coherent (2-3 sentences)
- ✅ No psychological claims ("You have leadership qualities")
- ✅ Feedback based on actual responses

---

### 3. Performance Test

**Measure**:
- Average request duration (target: < 5 seconds)
- Success rate (target: > 95%)
- Timeout rate (target: < 5%)

**Log Analysis**:
```bash
# Filter AI evaluation logs
npx expo start | grep "AI Evaluation"
```

---

### 4. Analytics Verification

**Check Console for Events**:
1. `ai_evaluation_started` — Includes `responseCount: 10`
2. `ai_evaluation_completed` — Includes `overallScore`, `duration`, `model`
3. `ai_evaluation_failed` — Includes `error`, `duration`
4. `session3_completed` — Still fires on AI failure
5. `day0_completed` — Still fires on AI failure

---

### 5. TypeScript Verification

```bash
# Check for errors
npx tsc --noEmit
```

**Expected**: 0 errors

---

## Troubleshooting

### Issue: AI evaluation never completes

**Possible Causes**:
- Invalid API key
- OpenRouter service down
- Network issue

**Debug**:
1. Check console for error logs
2. Verify API key format: `sk-or-v1-...`
3. Test API key manually: https://openrouter.ai/playground
4. Check OpenRouter status: https://status.openrouter.ai/

---

### Issue: Evaluation fails with JSON parse error

**Possible Causes**:
- Model returned invalid JSON
- Model response exceeded max tokens

**Debug**:
1. Check console log for raw content
2. Try different model (paid models more reliable)
3. Increase max_tokens if needed

---

### Issue: Feedback is generic or low quality

**Possible Causes**:
- Using free model (lower quality)
- Prompt needs refinement

**Solutions**:
1. Switch to paid model: `anthropic/claude-3.5-sonnet`
2. Review system prompt in `ai-evaluation.service.ts`
3. Add more context to user prompt

---

### Issue: Loading state persists forever

**Possible Causes**:
- Timeout not working
- Navigation blocked

**Debug**:
1. Check `evaluating` state in Session 3
2. Verify timeout configuration
3. Check for thrown errors in try/catch

---

## Manual API Test (cURL)

Test OpenRouter directly:

```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b:free",
    "messages": [
      {
        "role": "user",
        "content": "Say hello"
      }
    ]
  }'
```

**Expected**: JSON response with `choices[0].message.content`

---

## Production Readiness Checklist

Before deploying to production:

- [ ] Valid API key configured in production environment
- [ ] Model selection confirmed (free or paid)
- [ ] Error handling tested for all scenarios
- [ ] Analytics events tracking correctly
- [ ] TypeScript compiles with 0 errors
- [ ] Performance meets targets (< 5s request time)
- [ ] Success rate > 95% in beta testing
- [ ] User feedback on AI quality is positive
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

---

## Quick Reference

**Start Session 3**: Dashboard → "Begin Training" → Session 3  
**Check Logs**: Console in terminal running `npx expo start`  
**View Analytics**: Search console for `[Analytics]`  
**View AI Logs**: Search console for `[AI Evaluation]`  
**Reset State**: Clear app data or reinstall

**Environment Variables**:
- `EXPO_PUBLIC_OPENROUTER_API_KEY` — Required for AI
- `EXPO_PUBLIC_OPENROUTER_MODEL` — Optional (defaults to free model)

**Free Model**: `openai/gpt-oss-20b:free`  
**Recommended Paid Model**: `anthropic/claude-3.5-sonnet`

---

**Testing Date**: June 18, 2026  
**Status**: Ready for Testing  
**Tester**: Review this guide before starting
