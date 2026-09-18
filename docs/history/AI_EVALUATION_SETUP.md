# AI EVALUATION SETUP GUIDE
**Status:** Beta Implementation  
**Provider:** OpenRouter (Claude 3.5 Sonnet)  
**Testing Required:** YES (validation before Session 3 integration)

---

## ARCHITECTURE OVERVIEW

### Provider Abstraction Pattern
```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│          (Session 3 → AI Evaluation Request)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Provider Interface                     │
│     evaluateAnswer(request) → EvaluationResult              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐         ┌──────────────────────┐
│  OpenRouter      │         │  Gemini (Future)     │
│  Provider        │         │  NVIDIA NIM (Future) │
│  (Beta)          │         │                      │
└──────────────────┘         └──────────────────────┘
```

---

## FILE STRUCTURE

```
src/services/ai/
├── types.ts                      # Core interfaces
├── prompts.ts                    # System prompts
├── provider.factory.ts           # Provider creation
├── index.ts                      # Public exports
├── providers/
│   └── openrouter.provider.ts    # OpenRouter implementation
├── test-cases.ts                 # 30 test answers
└── test-runner.ts                # Validation framework
```

---

## SETUP INSTRUCTIONS

### 1. GET OPENROUTER API KEY

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Create account / Sign in
3. Navigate to **API Keys**
4. Create new key: "The Forge - Beta"
5. Copy API key

---

### 2. CONFIGURE ENVIRONMENT VARIABLES

**File:** `.env`

```bash
# AI Provider Configuration
EXPO_PUBLIC_AI_PROVIDER=openrouter
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
EXPO_PUBLIC_AI_MODEL=anthropic/claude-3.5-sonnet
EXPO_PUBLIC_AI_TIMEOUT=30000
```

**Why OpenRouter?**
- Access to multiple models (Claude, GPT-4, Gemini) via single API
- Pay-as-you-go pricing (no subscriptions)
- Fast model switching (change `EXPO_PUBLIC_AI_MODEL`)
- Fallback options if primary model unavailable

---

### 3. INSTALL DEPENDENCIES

No additional dependencies required! Uses native `fetch` API.

---

### 4. RUN VALIDATION TESTS (MANDATORY)

**IMPORTANT:** Do NOT integrate into Session 3 until tests pass.

```typescript
// Test script (create in project root)
import { createAIProvider } from './src/services/ai';
import { runEvaluationTests, printTestSummary, exportTestResults } from './src/services/ai/test-runner';

async function runTests() {
  console.log('Creating OpenRouter provider...');
  const provider = createAIProvider({
    provider: 'openrouter',
    apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY!,
    model: 'anthropic/claude-3.5-sonnet',
  });

  console.log('Running health check...');
  const healthy = await provider.healthCheck();
  if (!healthy) {
    throw new Error('Provider health check failed');
  }

  console.log('Running evaluation tests (30 cases)...\n');
  const summary = await runEvaluationTests(provider, {
    maxScoreDeviation: 1.0,
    timeout: 30000,
    verbose: true,
  });

  printTestSummary(summary);

  // Export results
  const json = exportTestResults(summary);
  console.log('\nTest results exported to test-results.json');
  // Write to file...
}

runTests();
```

**Run:**
```bash
npx ts-node run-ai-tests.ts
```

---

## VALIDATION CRITERIA

### Tests MUST Pass:
- [ ] **Overall Pass Rate:** >80% (24/30 tests)
- [ ] **Strong Answers:** >90% correctly identified (9/10)
- [ ] **Weak Answers:** >80% correctly identified (8/10)
- [ ] **Average Time:** <5 seconds per evaluation
- [ ] **No Timeouts:** All requests complete within 30s

### If Tests Fail:
1. Check API key validity
2. Review failed test cases
3. Adjust prompt engineering (`prompts.ts`)
4. Consider model change (GPT-4, Gemini, etc.)
5. Re-test until criteria met

---

## EVALUATION OUTPUT FORMAT

```typescript
interface EvaluationResult {
  score: number;         // 1-5 scale
  strengths: string[];   // 2-4 items
  improvements: string[]; // 2-4 items
  feedback: string;      // 2-3 sentences
}
```

**Example:**
```json
{
  "score": 4,
  "strengths": [
    "Clear decision-making: You identified the priority (team safety) immediately",
    "Practical approach: Using hand signals shows resourcefulness",
    "Communication awareness: Sending a runner ensures command is informed"
  ],
  "improvements": [
    "Consider mentioning how you'd assess threat level before moving",
    "Could elaborate on what defensive position means specifically"
  ],
  "feedback": "Your response demonstrates strong initiative and leadership. To improve further, add more detail about threat assessment and tactical positioning. This shows deeper strategic thinking valued at SSB."
}
```

---

## PROMPT ENGINEERING

### System Prompt Strategy
Located in `src/services/ai/prompts.ts`

**Key Elements:**
1. **Role Definition:** SSB evaluator expert
2. **Evaluation Principles:** Developmental, specific, SSB-aligned
3. **Scoring Rubric:** Clear 1-5 scale with definitions
4. **Output Format:** Structured JSON enforced
5. **Context:** Question type (SRT/WAT/Interview) specific guidance

**Customization:**
- Adjust scoring strictness
- Modify feedback tone
- Change evaluation criteria emphasis
- Add domain-specific knowledge

---

## COST ESTIMATION

### OpenRouter Pricing (Claude 3.5 Sonnet)
- **Input:** ~$3 / 1M tokens
- **Output:** ~$15 / 1M tokens

### Per Evaluation:
- **Input tokens:** ~500 (system prompt + question + answer)
- **Output tokens:** ~200 (evaluation JSON)
- **Cost per evaluation:** ~$0.004 (0.4 cents)

### Monthly Projections:
- **100 users/day × 10 questions:** 1,000 evaluations/day
- **Daily cost:** $4
- **Monthly cost:** ~$120

**Optimization:**
- Batch evaluations (evaluate all 10 Session 3 questions together)
- Shorter system prompts
- Cached prompt responses (provider-specific)

---

## ERROR HANDLING

### Error Types:
```typescript
'PROVIDER_ERROR'    // API failure, network issues
'INVALID_RESPONSE'  // Malformed JSON, missing fields
'TIMEOUT'           // Request exceeded time limit
'RATE_LIMIT'        // Too many requests
```

### Fallback Strategy (Production):
1. **Retry once** (transient errors)
2. **Use rule-based** fallback (if AI fails)
3. **Queue for later** (store response, evaluate async)
4. **User notification:** "Evaluation pending, check back later"

---

## FUTURE PROVIDERS

### Gemini Integration (Coming Soon)
```typescript
// src/services/ai/providers/gemini.provider.ts
export class GeminiProvider implements AIProvider {
  // Direct Google AI Studio API
  // Lower cost, faster response
  // Native JSON mode
}
```

**When to switch:**
- OpenRouter costs too high
- Need lower latency
- Gemini model quality improves

---

### NVIDIA NIM Integration (Future)
```typescript
// src/services/ai/providers/nvidia-nim.provider.ts
export class NvidiaProvider implements AIProvider {
  // Self-hosted LLM option
  // Zero per-request cost
  // Full data control
}
```

**When to consider:**
- Scale requires cost optimization
- Data privacy requirements
- 10k+ evaluations/day

---

## INTEGRATION WORKFLOW

### DO NOT INTEGRATE UNTIL:
- [ ] Validation tests pass (>80%)
- [ ] Co-founder reviews evaluation quality
- [ ] 10 manual spot-checks approved
- [ ] Error handling tested
- [ ] Cost projections validated

### WHEN READY:
1. Update Session 3 completion flow
2. Add "Evaluating..." loading state
3. Call `getAIProvider().evaluateAnswer(request)`
4. Display `EvaluationResult` in completion screen
5. Track evaluation success rate (analytics)

---

## MONITORING & OPTIMIZATION

### Track These Metrics:
- **Evaluation success rate** (target: >95%)
- **Average evaluation time** (target: <5s)
- **API error rate** (target: <5%)
- **Cost per evaluation** (target: <$0.005)
- **User satisfaction with feedback** (qualitative)

### A/B Testing:
- Rule-based vs AI feedback
- Different models (Claude vs GPT-4 vs Gemini)
- Prompt variations
- Scoring strictness levels

---

## SECURITY & PRIVACY

### Data Handling:
- ✅ User responses sent to OpenRouter (anonymized)
- ✅ No PII included in prompts
- ✅ HTTPS only
- ✅ API key in environment variables (never hardcoded)

### OpenRouter Privacy:
- Does NOT store request data by default
- Can enable logging for debugging (opt-in)
- SOC 2 compliant
- GDPR compliant

### User Transparency:
Add to Privacy Policy:
> "Your subjective responses may be sent to third-party AI services (OpenRouter) for evaluation. No personally identifiable information is included. Responses are not stored by the AI provider."

---

## TESTING CHECKLIST

### Before Beta Launch:
- [ ] Run full validation test suite
- [ ] 10 manual spot-checks (read AI feedback quality)
- [ ] Test error scenarios (invalid API key, timeout, network failure)
- [ ] Verify cost calculations match expectations
- [ ] Review prompt engineering quality

### During Beta:
- [ ] Monitor evaluation success rate daily
- [ ] Collect user feedback on AI feedback quality
- [ ] Track evaluation times
- [ ] Watch for rate limiting
- [ ] Review cost vs budget

### Post-Beta:
- [ ] A/B test AI vs rule-based feedback
- [ ] Optimize prompts based on user feedback
- [ ] Consider model alternatives
- [ ] Implement caching/batching optimizations

---

## TROUBLESHOOTING

### Issue: "Provider health check failed"
**Solution:** Verify API key, check OpenRouter status

### Issue: "Rate limit exceeded"
**Solution:** Add exponential backoff, increase rate limits with OpenRouter

### Issue: "Invalid response format"
**Solution:** Check model supports JSON mode, review prompt clarity

### Issue: "Evaluation too slow (>10s)"
**Solution:** Switch to faster model, reduce prompt length, increase timeout

### Issue: "Low quality feedback"
**Solution:** Refine prompts, add more examples, switch models

---

## NEXT STEPS

1. **Run validation tests** → Verify >80% pass rate
2. **Review 10 sample evaluations** → Co-founder approval
3. **Test error scenarios** → Confirm fallback works
4. **Update Session 3 flow** → Add AI evaluation call
5. **Beta launch with monitoring** → Track metrics
6. **Iterate based on data** → Optimize quality and cost

---

**DO NOT SKIP VALIDATION. QUALITY > SPEED.**
