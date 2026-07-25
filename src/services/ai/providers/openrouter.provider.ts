// ─────────────────────────────────────────────────────────────
// THE FORGE — OpenRouter AI Provider
// Implementation for OpenRouter API
// ─────────────────────────────────────────────────────────────

import type { AIProvider, EvaluationRequest, EvaluationResult, AIProviderConfig } from '../types';
import { EvaluationError } from '../types';
import { EVALUATION_SYSTEM_PROMPT, buildEvaluationPrompt } from '../prompts';

const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class OpenRouterProvider implements AIProvider {
  readonly name = 'OpenRouter';

  private apiKey: string;
  private model: string;
  private baseURL: string;
  private timeout: number;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODEL;
    this.baseURL = config.baseURL || OPENROUTER_BASE_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;

    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  async evaluateAnswer(request: EvaluationRequest): Promise<EvaluationResult> {
    const prompt = buildEvaluationPrompt(request.question, request.response);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://theforge.app',
          'X-Title': 'The Forge - SSB Training',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: EVALUATION_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new EvaluationError(
            'Rate limit exceeded. Please try again later.',
            'RATE_LIMIT',
            this.name
          );
        }
        throw new EvaluationError(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
          'PROVIDER_ERROR',
          this.name
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new EvaluationError(
          'No content in OpenRouter response',
          'INVALID_RESPONSE',
          this.name
        );
      }

      // Parse JSON response
      const result = JSON.parse(content) as EvaluationResult;

      // Validate structure
      this.validateResult(result);

      return result;
    } catch (error) {
      if (error instanceof EvaluationError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new EvaluationError(
            'Evaluation request timed out',
            'TIMEOUT',
            this.name
          );
        }

        throw new EvaluationError(
          `OpenRouter evaluation failed: ${error.message}`,
          'PROVIDER_ERROR',
          this.name
        );
      }

      throw new EvaluationError(
        'Unknown error during evaluation',
        'PROVIDER_ERROR',
        this.name
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch {
      return false;
    }
  }

  private validateResult(result: any): asserts result is EvaluationResult {
    if (typeof result !== 'object' || result === null) {
      throw new EvaluationError(
        'Invalid response format: not an object',
        'INVALID_RESPONSE',
        this.name
      );
    }

    if (typeof result.score !== 'number' || result.score < 1 || result.score > 5) {
      throw new EvaluationError(
        'Invalid score: must be number between 1-5',
        'INVALID_RESPONSE',
        this.name
      );
    }

    if (!Array.isArray(result.strengths) || result.strengths.length === 0) {
      throw new EvaluationError(
        'Invalid strengths: must be non-empty array',
        'INVALID_RESPONSE',
        this.name
      );
    }

    if (!Array.isArray(result.improvements) || result.improvements.length === 0) {
      throw new EvaluationError(
        'Invalid improvements: must be non-empty array',
        'INVALID_RESPONSE',
        this.name
      );
    }

    if (typeof result.feedback !== 'string' || result.feedback.length === 0) {
      throw new EvaluationError(
        'Invalid feedback: must be non-empty string',
        'INVALID_RESPONSE',
        this.name
      );
    }
  }
}
