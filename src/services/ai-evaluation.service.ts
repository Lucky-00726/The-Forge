// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Evaluation Service
// OpenRouter integration for Session 3 subjective responses
// Single batch request for all responses
// ─────────────────────────────────────────────────────────────

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-20b:free';
const REQUEST_TIMEOUT = 45000; // 45 seconds
// A full Session 3 batch (up to 10 responses) produces sizeable JSON
// (score + 3-4 strengths + 3-4 improvements + summary). 500 tokens could
// truncate that mid-JSON → parse failure. 2000 leaves comfortable headroom.
const MAX_TOKENS = 2000;

export interface SubjectiveResponse {
  questionId: string;
  questionType: 'SRT' | 'WAT' | 'Interview';
  question: string;
  answer: string;
}

export interface AIEvaluationResult {
  overallScore: number; // 0-100 scale
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface EvaluationMetrics {
  success: boolean;
  duration: number; // milliseconds
  model: string;
  error?: string;
}

/**
 * System prompt for AI evaluator
 */
const SYSTEM_PROMPT = `You are an experienced SSB evaluator for the Indian Armed Forces.

## Evaluation Focus:
- Practical thinking
- Clarity of expression
- Action orientation
- Response quality
- Completeness

## Important Guidelines:
- Be objective and evidence-based
- Do NOT make psychological claims
- Do NOT assume leadership, courage, initiative, or officer qualities unless directly demonstrated in the response
- Do NOT over-interpret short answers
- Focus on what the candidate actually wrote, not what you imagine they meant

## Question Type Context:
**SRT (Situation Reaction Test):**
- Evaluate action clarity
- Assess realism and practicality
- Check response sequence (what they would do first, next, etc.)

**WAT (Word Association Test):**
- Evaluate positivity and constructiveness
- Assess brevity and clarity
- Check if response is appropriate for a word association context

**Interview:**
- Evaluate clarity and structure
- Assess self-awareness
- Check communication effectiveness

## Output Format:
You MUST respond with ONLY valid JSON in this exact format:
{
  "overallScore": <number between 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "2-3 sentences of overall feedback"
}

Do NOT include any text outside the JSON object.`;

/**
 * Build user prompt with all responses
 */
function buildEvaluationPrompt(responses: SubjectiveResponse[]): string {
  let prompt = `Evaluate the following ${responses.length} candidate responses from an SSB training session.\n\n`;

  responses.forEach((response, index) => {
    prompt += `═══════════════════════════════════════════════════════\n`;
    prompt += `QUESTION ${index + 1} [${response.questionType}]\n`;
    prompt += `${response.question}\n\n`;
    prompt += `CANDIDATE'S RESPONSE:\n`;
    prompt += `"${response.answer}"\n\n`;
  });

  prompt += `═══════════════════════════════════════════════════════\n\n`;
  prompt += `Based on all ${responses.length} responses above, provide:\n`;
  prompt += `1. Overall score (0-100) for the complete session\n`;
  prompt += `2. Top 3-4 strengths demonstrated across responses\n`;
  prompt += `3. Top 3-4 areas for improvement\n`;
  prompt += `4. Summary feedback (2-3 sentences)\n\n`;
  prompt += `Remember: Be objective. Focus on what was actually written. Do not make assumptions about qualities not clearly demonstrated.\n\n`;
  prompt += `Output valid JSON only.`;

  return prompt;
}

/**
 * Robustly extract an AIEvaluationResult from a raw model response.
 *
 * Free / instruct models often:
 *   - wrap JSON in markdown fences:  ```json { ... } ```
 *   - prepend/append prose around the JSON object
 *   - emit smart quotes or trailing commas
 *
 * This strips fences and isolates the outermost {...} block before parsing,
 * so well-formed JSON embedded in noisy output still succeeds.
 */
function parseEvaluationContent(raw: string): AIEvaluationResult {
  let text = raw.trim();

  // Strip leading/trailing markdown code fences (```json, ```)
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Isolate the outermost JSON object if there is surrounding prose.
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(text) as AIEvaluationResult;
}

/**
 * Evaluate all Session 3 responses in a single API call
 */
export async function evaluateSession3Responses(
  responses: SubjectiveResponse[]
): Promise<{ result: AIEvaluationResult | null; metrics: EvaluationMetrics }> {
  const startTime = Date.now();
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  const model = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || DEFAULT_MODEL;

  // Validate API key
  if (!apiKey) {
    console.error('[AI Evaluation] No API key found');
    return {
      result: null,
      metrics: {
        success: false,
        duration: Date.now() - startTime,
        model,
        error: 'Missing API key',
      },
    };
  }

  // Validate responses
  if (!responses || responses.length === 0) {
    console.error('[AI Evaluation] No responses provided');
    return {
      result: null,
      metrics: {
        success: false,
        duration: Date.now() - startTime,
        model,
        error: 'No responses to evaluate',
      },
    };
  }

  console.log(`[AI Evaluation] Starting batch evaluation for ${responses.length} responses`);
  console.log(`[AI Evaluation] Model: ${model}`);

  try {
    // Build prompt
    const prompt = buildEvaluationPrompt(responses);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    // Make API request
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://theforge.app',
        'X-Title': 'The Forge - SSB Training',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    // Always log the HTTP status for production diagnostics
    console.log(`[AI Evaluation] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[AI Evaluation] API error: ${response.status} - ${errorText}`);

      return {
        result: null,
        metrics: {
          success: false,
          duration,
          model,
          error: `API error: ${response.status}`,
        },
      };
    }

    // Parse response
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Token usage + response length diagnostics
    const usage = data.usage ?? {};
    const finishReason = data.choices?.[0]?.finish_reason ?? 'unknown';
    console.log(
      `[AI Evaluation] tokens prompt=${usage.prompt_tokens ?? '?'} ` +
        `completion=${usage.completion_tokens ?? '?'} total=${usage.total_tokens ?? '?'} ` +
        `| finish_reason=${finishReason} | content_length=${content ? content.length : 0}`
    );
    if (finishReason === 'length') {
      console.warn('[AI Evaluation] finish_reason=length — response was truncated by max_tokens; JSON may be incomplete.');
    }

    if (!content) {
      console.error('[AI Evaluation] No content in response. Raw payload:', JSON.stringify(data).slice(0, 500));
      return {
        result: null,
        metrics: {
          success: false,
          duration,
          model,
          error: 'Empty response',
        },
      };
    }

    // Parse JSON from content. Free/instruct models frequently wrap the JSON
    // in markdown fences (```json ... ```) or add prose around it, which breaks
    // a naive JSON.parse. Extract and sanitize before parsing.
    let result: AIEvaluationResult;
    try {
      result = parseEvaluationContent(content);
    } catch (parseError) {
      console.error('[AI Evaluation] JSON parse error:', parseError);
      console.error('[AI Evaluation] Raw content:', content.slice(0, 500));
      return {
        result: null,
        metrics: {
          success: false,
          duration,
          model,
          error: 'Invalid JSON response',
        },
      };
    }

    // Validate result structure
    if (
      typeof result.overallScore !== 'number' ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.improvements) ||
      typeof result.summary !== 'string'
    ) {
      console.error('[AI Evaluation] Invalid result structure:', result);
      return {
        result: null,
        metrics: {
          success: false,
          duration,
          model,
          error: 'Invalid result structure',
        },
      };
    }

    // Clamp score to 0-100
    result.overallScore = Math.max(0, Math.min(100, result.overallScore));

    console.log(`[AI Evaluation] Success - Score: ${result.overallScore}/100 (${duration}ms)`);

    return {
      result,
      metrics: {
        success: true,
        duration,
        model,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[AI Evaluation] Request timeout');
        return {
          result: null,
          metrics: {
            success: false,
            duration,
            model,
            error: 'Request timeout',
          },
        };
      }

      console.error('[AI Evaluation] Error:', error.message);
      return {
        result: null,
        metrics: {
          success: false,
          duration,
          model,
          error: error.message,
        },
      };
    }

    console.error('[AI Evaluation] Unknown error:', error);
    return {
      result: null,
      metrics: {
        success: false,
        duration,
        model,
        error: 'Unknown error',
      },
    };
  }
}
