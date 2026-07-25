// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Evaluation Prompts
// System prompts and evaluation templates
// ─────────────────────────────────────────────────────────────

import type { QuestionContext, UserResponse } from './types';

/**
 * System prompt for AI evaluator
 */
export const EVALUATION_SYSTEM_PROMPT = `You are an expert SSB (Services Selection Board) evaluator for the Indian Armed Forces. Your role is to assess candidate responses based on Officer Like Qualities (OLQs).

## Your Evaluation Principles:
1. **Developmental, not punitive**: Focus on growth, not just scoring
2. **Specific and actionable**: Provide concrete guidance for improvement
3. **SSB-aligned**: Evaluate based on OLQs (Initiative, Leadership, Responsibility, Decision Making, Communication)
4. **Balanced**: Highlight both strengths and areas for development
5. **Authentic**: Value genuine responses over rehearsed perfection

## Scoring Scale (1-5):
- **1 (Poor)**: Response shows minimal understanding or effort; lacks clarity; misses question intent
- **2 (Below Average)**: Response is vague or generic; limited demonstration of OLQs; needs significant work
- **3 (Average)**: Response is acceptable; shows basic understanding; demonstrates some OLQs but lacks depth
- **4 (Good)**: Response is clear and thoughtful; demonstrates multiple OLQs; shows officer-like thinking
- **5 (Excellent)**: Response is exceptional; demonstrates strong OLQs; clear, actionable, authentic; officer-ready

## Output Format:
You MUST respond with valid JSON only:
{
  "score": <1-5>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "feedback": "2-3 sentences of actionable guidance"
}

Do NOT include any text outside the JSON object.`;

/**
 * Generate evaluation prompt for a specific question
 */
export function buildEvaluationPrompt(
  question: QuestionContext,
  response: UserResponse
): string {
  const criteriaList = question.evaluationCriteria.join(', ');

  let contextSection = '';
  if (question.questionType === 'SRT') {
    contextSection = `
## Question Type: Situation Reaction Test (SRT)
SRT questions test how a candidate responds to practical scenarios. Look for:
- Immediate, decisive action
- Practical thinking (not overthinking)
- Responsibility and ownership
- Clear reasoning`;
  } else if (question.questionType === 'WAT') {
    contextSection = `
## Question Type: Word Association Test (WAT)
WAT reveals subconscious associations and thought patterns. Look for:
- Immediate, instinctive response
- Positive, officer-like associations
- Brevity and clarity (not over-explained)
- Values-based thinking`;
  } else if (question.questionType === 'Interview') {
    contextSection = `
## Question Type: Interview
Interview questions assess self-awareness, motivation, and authenticity. Look for:
- Honest, genuine responses
- Self-awareness (knows strengths and weaknesses)
- Specific examples from real life
- Clear articulation of thoughts
- Growth mindset`;
  }

  const minWordsNote =
    question.minWords && response.wordCount < question.minWords
      ? `\n⚠️ Response is below minimum word count (${response.wordCount}/${question.minWords} words). Consider this in your evaluation.`
      : '';

  return `${contextSection}

## Question:
"${question.questionText}"
${question.prompt ? `\nGuidance: ${question.prompt}` : ''}

## Evaluation Criteria (OLQs to assess):
${criteriaList}

## Candidate's Response:
"${response.answer}"

Word count: ${response.wordCount}${minWordsNote}

## Your Task:
Evaluate this response based on the criteria above. Provide:
1. **Score (1-5)**: Rate the overall quality
2. **Strengths (2-4 items)**: What did the candidate do well?
3. **Improvements (2-4 items)**: What could be better?
4. **Feedback (2-3 sentences)**: Actionable guidance for the candidate

Remember: Be constructive, specific, and developmental. Output valid JSON only.`;
}
