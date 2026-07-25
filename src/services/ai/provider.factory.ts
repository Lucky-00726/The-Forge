// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Provider Factory
// Creates AI provider instances based on environment configuration
// ─────────────────────────────────────────────────────────────

import type { AIProvider, AIProviderConfig } from './types';
import { OpenRouterProvider } from './providers/openrouter.provider';

/**
 * Get AI provider configuration from environment variables
 */
export function getProviderConfig(): AIProviderConfig {
  // Read from environment variables
  // In React Native Expo, use process.env or expo-constants
  const provider = (process.env.EXPO_PUBLIC_AI_PROVIDER || 'openrouter') as AIProviderConfig['provider'];
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
  const model = process.env.EXPO_PUBLIC_AI_MODEL;
  const baseURL = process.env.EXPO_PUBLIC_AI_BASE_URL;
  const timeout = process.env.EXPO_PUBLIC_AI_TIMEOUT
    ? parseInt(process.env.EXPO_PUBLIC_AI_TIMEOUT, 10)
    : undefined;

  return {
    provider,
    apiKey,
    model,
    baseURL,
    timeout,
  };
}

/**
 * Create AI provider instance based on configuration
 */
export function createAIProvider(config?: AIProviderConfig): AIProvider {
  const providerConfig = config || getProviderConfig();

  switch (providerConfig.provider) {
    case 'openrouter':
      return new OpenRouterProvider(providerConfig);

    case 'gemini':
      // TODO: Implement GeminiProvider
      throw new Error('Gemini provider not yet implemented');

    case 'nvidia-nim':
      // TODO: Implement NvidiaProvider
      throw new Error('NVIDIA NIM provider not yet implemented');

    default:
      throw new Error(`Unknown AI provider: ${providerConfig.provider}`);
  }
}

/**
 * Singleton instance for production use
 */
let providerInstance: AIProvider | null = null;

/**
 * Get or create the global AI provider instance
 */
export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    providerInstance = createAIProvider();
  }
  return providerInstance;
}

/**
 * Reset the global provider instance (useful for testing)
 */
export function resetAIProvider(): void {
  providerInstance = null;
}
