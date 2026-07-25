// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Provider Types
// Provider-agnostic interfaces for AI evaluation
// ─────────────────────────────────────────────────────────────

/**
 * Structured evaluation result from AI provider
 */
export interface EvaluationResult {
  score: number; // 1-5 scale
  strengths: string[]; // 2-4 items
  improvements: string[]; // 2-4 items
  feedback: string; // 2-3 sentences, actionable guidance
}

/**
 * Question context for AI evaluation
 */
export interface QuestionContext {
  questionId: string;
  questionType: 'SRT' | 'WAT' | 'Interview';
  questionText: string;
  evaluationCriteria: string[]; // OLQs to assess
  minWords?: number;
  prompt?: string;
}

/**
 * User response to be evaluated
 */
export interface UserResponse {
  answer: string;
  wordCount: number;
}

/**
 * Complete evaluation request
 */
export interface EvaluationRequest {
  question: QuestionContext;
  response: UserResponse;
}

/**
 * AI Provider interface
 * All providers must implement this interface
 */
export interface AIProvider {
  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Evaluate a single subjective answer
   * @param request - Question context and user response
   * @returns Structured evaluation result
   * @throws Error if evaluation fails
   */
  evaluateAnswer(request: EvaluationRequest): Promise<EvaluationResult>;

  /**
   * Health check - verify provider is accessible
   * @returns true if provider is healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * AI Provider configuration
 */
export interface AIProviderConfig {
  provider: 'openrouter' | 'gemini' | 'nvidia-nim';
  apiKey: string;
  model?: string;
  baseURL?: string;
  timeout?: number; // milliseconds
}

/**
 * Evaluation error types
 */
export class EvaluationError extends Error {
  constructor(
    message: string,
    public readonly code: 'PROVIDER_ERROR' | 'INVALID_RESPONSE' | 'TIMEOUT' | 'RATE_LIMIT',
    public readonly provider: string
  ) {
    super(message);
    this.name = 'EvaluationError';
  }
}
