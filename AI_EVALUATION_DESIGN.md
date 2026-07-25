# AI EVALUATION DESIGN — GEMINI INTEGRATION

**Purpose:** Provide developmental feedback for Session 3 subjective responses  
**Model:** Google Gemini (recommended: gemini-1.5-pro or gemini-1.5-flash)  
**Evaluation Focus:** Officer Like Qualities (OLQs), not binary right/wrong

---

## EVALUATION CRITERIA

### 5 Core OLQs to Assess

1. **Initiative**
   - Takes action without being told
   - Proactive approach
   - Identifies opportunities
   - Self-starter mindset

2. **Leadership**
   - Takes charge in situations
   - Influences others positively
   - Makes decisions under pressure
   - Inspires confidence

3. **Responsibility**
   - Accepts accountability
   - Follows through on commitments
   - Considers consequences
   - Owns outcomes

4. **Communication**
   - Clear expression
   - Appropriate tone
   - Effective articulation
   - Logical flow

5. **Decision Making**
   - Logical reasoning
   - Considers multiple options
   - Decisive action
   - Practical thinking

---

## EVALUATION APPROACH

### NOT Binary Scoring
❌ Do not evaluate as "correct" or "incorrect"  
❌ Do not give numerical scores like 7/10  
❌ Do not compare to a "perfect answer"

### Developmental Feedback
✅ Identify demonstrated OLQs  
✅ Highlight strengths shown  
✅ Suggest areas for growth  
✅ Provide constructive guidance  
✅ Frame feedback positively

---

## GEMINI PROMPT STRUCTURE

### System Context
```
You are an AI evaluator trained to assess SSB (Services Selection Board) 
candidate responses for Officer Like Qualities (OLQs). Your role is to 
provide developmental feedback that helps aspirants improve their 
thinking and approach.

You evaluate responses for 5 core OLQs:
1. Initiative
2. Leadership  
3. Responsibility
4. Communication
5. Decision Making

Your feedback should be:
- Constructive and encouraging
- Specific to the candidate's response
- Action-oriented (what to develop)
- Positive in tone (growth mindset)
- Not binary (no right/wrong)
```

### Evaluation Prompt Template

For each question:

```
Question Type: [SRT/WAT/Interview]
Question: [question text]
Candidate Response: [user answer]

Evaluate this response for the following OLQs:
[list of evaluation criteria for this question]

Provide feedback in this structure:

**Demonstrated Strengths:**
- List 2-3 OLQs clearly shown in the response
- Cite specific parts of their answer

**Areas for Development:**
- List 1-2 OLQs that could be stronger
- Explain what's missing or could improve

**Actionable Guidance:**
- Provide 2-3 specific suggestions to enhance this type of response
- Focus on mindset and approach, not memorization

Keep feedback concise (150-200 words total) and encouraging.
```

---

## IMPLEMENTATION ARCHITECTURE

### Storage Structure

```typescript
interface SubjectiveEvaluation {
  id: string;                    // uuid
  user_id: string;               // FK to users
  question_id: string;           // e.g., 'S3Q01'
  session_number: number;        // 3
  response_text: string;         // User's answer
  word_count: number;
  
  // AI Evaluation Results
  demonstrated_strengths: string[];  // OLQs shown
  areas_for_development: string[];   // OLQs to improve
  actionable_guidance: string[];     // Specific tips
  
  evaluation_status: 'pending' | 'completed' | 'failed';
  evaluated_at: string | null;   // ISO timestamp
  created_at: string;             // ISO timestamp
}
```

### Database Table (Supabase)

```sql
CREATE TABLE subjective_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  session_number INTEGER NOT NULL,
  response_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  
  -- AI evaluation results
  demonstrated_strengths TEXT[] DEFAULT '{}',
  areas_for_development TEXT[] DEFAULT '{}',
  actionable_guidance TEXT[] DEFAULT '{}',
  
  evaluation_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (evaluation_status IN ('pending', 'completed', 'failed')),
  evaluated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_question UNIQUE (user_id, question_id, created_at)
);

CREATE INDEX idx_subjective_evaluations_user_id 
  ON subjective_evaluations(user_id);
CREATE INDEX idx_subjective_evaluations_status 
  ON subjective_evaluations(evaluation_status);
```

---

## SERVICE IMPLEMENTATION

### evaluation.service.ts

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import type { AsyncResult } from '../types';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

interface EvaluationInput {
  userId: string;
  questionId: string;
  questionType: 'SRT' | 'WAT' | 'Interview';
  questionText: string;
  responseText: string;
  wordCount: number;
  evaluationCriteria: string[];
}

interface EvaluationResult {
  demonstratedStrengths: string[];
  areasForDevelopment: string[];
  actionableGuidance: string[];
}

export async function submitForEvaluation(
  input: EvaluationInput
): Promise<AsyncResult<string>> {
  // 1. Save response to database with status 'pending'
  const { data, error } = await supabase
    .from('subjective_evaluations')
    .insert({
      user_id: input.userId,
      question_id: input.questionId,
      session_number: 3,
      response_text: input.responseText,
      word_count: input.wordCount,
      evaluation_status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: 'Failed to save response.' };
  }

  // 2. Trigger async evaluation (process in background)
  void evaluateResponse(data.id, input);

  return { success: true, data: data.id };
}

async function evaluateResponse(
  evaluationId: string,
  input: EvaluationInput
): Promise<void> {
  try {
    // Build evaluation prompt
    const prompt = buildEvaluationPrompt(input);

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse AI response into structured format
    const evaluation = parseEvaluationResponse(text);

    // Update database with results
    await supabase
      .from('subjective_evaluations')
      .update({
        demonstrated_strengths: evaluation.demonstratedStrengths,
        areas_for_development: evaluation.areasForDevelopment,
        actionable_guidance: evaluation.actionableGuidance,
        evaluation_status: 'completed',
        evaluated_at: new Date().toISOString(),
      })
      .eq('id', evaluationId);
  } catch (error) {
    console.error('[evaluateResponse] Failed:', error);
    
    // Mark as failed
    await supabase
      .from('subjective_evaluations')
      .update({ evaluation_status: 'failed' })
      .eq('id', evaluationId);
  }
}

function buildEvaluationPrompt(input: EvaluationInput): string {
  return `
You are an AI evaluator trained to assess SSB (Services Selection Board) 
candidate responses for Officer Like Qualities (OLQs). Your role is to 
provide developmental feedback that helps aspirants improve.

Question Type: ${input.questionType}
Question: ${input.questionText}
Candidate Response: ${input.responseText}

Evaluate for these OLQs: ${input.evaluationCriteria.join(', ')}

Provide feedback in this EXACT format:

DEMONSTRATED STRENGTHS:
- [strength 1]
- [strength 2]
- [strength 3]

AREAS FOR DEVELOPMENT:
- [area 1]
- [area 2]

ACTIONABLE GUIDANCE:
- [tip 1]
- [tip 2]
- [tip 3]

Keep each point concise (1-2 sentences). Be specific and encouraging.
Focus on mindset and approach, not memorization.
`;
}

function parseEvaluationResponse(text: string): EvaluationResult {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  const demonstratedStrengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const actionableGuidance: string[] = [];

  let currentSection: 'strengths' | 'development' | 'guidance' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('DEMONSTRATED STRENGTHS')) {
      currentSection = 'strengths';
      continue;
    } else if (trimmed.includes('AREAS FOR DEVELOPMENT')) {
      currentSection = 'development';
      continue;
    } else if (trimmed.includes('ACTIONABLE GUIDANCE')) {
      currentSection = 'guidance';
      continue;
    }

    // Parse bullet points
    if (trimmed.startsWith('-')) {
      const content = trimmed.substring(1).trim();
      if (currentSection === 'strengths') {
        demonstratedStrengths.push(content);
      } else if (currentSection === 'development') {
        areasForDevelopment.push(content);
      } else if (currentSection === 'guidance') {
        actionableGuidance.push(content);
      }
    }
  }

  return {
    demonstratedStrengths,
    areasForDevelopment,
    actionableGuidance,
  };
}

export async function fetchUserEvaluations(
  userId: string
): Promise<AsyncResult<any[]>> {
  const { data, error } = await supabase
    .from('subjective_evaluations')
    .select('*')
    .eq('user_id', userId)
    .eq('evaluation_status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: data ?? [] };
}
```

---

## INTEGRATION POINTS

### Session 3 Completion
When user completes Session 3:
1. Save all responses to `subjective_evaluations` table
2. Status: `pending`
3. Show "AI evaluation pending" message
4. Award XP immediately (don't wait for evaluation)

### Background Processing
- Evaluation runs asynchronously after session completion
- User can continue using app while evaluation processes
- Typical evaluation time: 2-5 seconds per question (10 questions = 20-50 seconds total)

### Viewing Feedback
- Add "Feedback" tab or section in Profile
- Show completed evaluations with:
  - Question text
  - User's response
  - AI feedback (strengths, development areas, guidance)
- Status indicator: Pending ⏳ | Completed ✓ | Failed ❌

---

## API KEY SETUP

### Environment Variables

```.env
GEMINI_API_KEY=your_api_key_here
```

### Obtaining Gemini API Key
1. Go to https://ai.google.dev/
2. Sign in with Google account
3. Go to "Get API Key"
4. Create new project or select existing
5. Generate API key
6. Copy to `.env` file

### Cost Considerations
- Gemini 1.5 Flash: Free tier available (15 requests/minute)
- Estimated cost for beta: $0 (within free tier)
- Monitor usage: https://ai.google.dev/pricing

---

## FEEDBACK DISPLAY COMPONENT

### EvaluationCard.tsx

```typescript
interface EvaluationCardProps {
  questionText: string;
  responseText: string;
  demonstratedStrengths: string[];
  areasForDevelopment: string[];
  actionableGuidance: string[];
}

export function EvaluationCard({
  questionText,
  responseText,
  demonstratedStrengths,
  areasForDevelopment,
  actionableGuidance,
}: EvaluationCardProps) {
  return (
    <View style={styles.card}>
      <CornerMarkers position="all" color={Colors.primary} />
      
      {/* Question */}
      <Text style={styles.question}>{questionText}</Text>
      
      {/* User's Response */}
      <View style={styles.responseSection}>
        <Text style={styles.sectionLabel}>YOUR RESPONSE</Text>
        <Text style={styles.responseText}>{responseText}</Text>
      </View>
      
      {/* Strengths */}
      <View style={styles.strengthsSection}>
        <Text style={styles.sectionLabel}>✓ DEMONSTRATED STRENGTHS</Text>
        {demonstratedStrengths.map((strength, idx) => (
          <View key={idx} style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{strength}</Text>
          </View>
        ))}
      </View>
      
      {/* Development Areas */}
      <View style={styles.developmentSection}>
        <Text style={styles.sectionLabel}>↑ AREAS FOR DEVELOPMENT</Text>
        {areasForDevelopment.map((area, idx) => (
          <View key={idx} style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{area}</Text>
          </View>
        ))}
      </View>
      
      {/* Guidance */}
      <View style={styles.guidanceSection}>
        <Text style={styles.sectionLabel}>→ ACTIONABLE GUIDANCE</Text>
        {actionableGuidance.map((tip, idx) => (
          <View key={idx} style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

---

## TESTING STRATEGY

### Test Cases

**1. SRT Response Evaluation**
- Input: "I will immediately alert higher authority and secure the area"
- Expected: Recognize Initiative, Responsibility, Decision Making
- Check: Feedback is specific to the response

**2. WAT Response Evaluation**
- Input: "RESPONSIBILITY - Accept accountability for all actions"
- Expected: Recognize Responsibility OLQ
- Check: Feedback acknowledges brief format

**3. Interview Response Evaluation**
- Input: "I want to join the Armed Forces to serve my country and lead men in challenging situations"
- Expected: Recognize Leadership, Initiative
- Check: Guidance suggests deepening self-awareness

**4. Edge Cases**
- Very short response (< minimum words): Should still evaluate, note brevity
- Generic response: Feedback should encourage specificity
- Weak response: Feedback should be constructive, not discouraging

---

## ROLLOUT PLAN

### Phase 1: Backend Implementation
1. Create `subjective_evaluations` table in Supabase
2. Implement `evaluation.service.ts`
3. Test Gemini API integration
4. Test prompt quality with sample responses

### Phase 2: Session 3 Integration
1. Update Session 3 completion to save responses
2. Trigger async evaluation
3. Show "pending" status to user

### Phase 3: Feedback UI
1. Create Feedback screen/tab
2. Implement `EvaluationCard` component
3. Add navigation from profile

### Phase 4: Testing & Refinement
1. Test with real user responses
2. Refine prompts based on feedback quality
3. Adjust parsing logic if needed
4. Monitor API costs

---

## SUCCESS METRICS

### Quality Indicators
- ✅ Feedback is specific (cites user's actual words)
- ✅ Feedback is constructive (growth-oriented)
- ✅ Feedback is actionable (concrete suggestions)
- ✅ Feedback is encouraging (positive tone)

### User Experience
- ⏱️ Evaluation completes within 60 seconds
- 📊 90%+ evaluations complete successfully
- 🎯 Users find feedback helpful (qualitative)
- 🔄 Users attempt subjective questions again based on feedback

---

**Status:** Design complete  
**Next:** Implement backend (evaluation service + database table)  
**After:** Integrate with Session 3, create feedback UI
