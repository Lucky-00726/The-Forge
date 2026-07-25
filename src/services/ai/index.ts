// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Service Entry Point
// Exports for AI evaluation system
// ─────────────────────────────────────────────────────────────

export type {
  AIProvider,
  AIProviderConfig,
  EvaluationRequest,
  EvaluationResult,
  QuestionContext,
  UserResponse,
} from './types';

export { EvaluationError } from './types';

export { createAIProvider, getAIProvider, resetAIProvider } from './provider.factory';
