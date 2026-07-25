// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Evaluation Test Runner
// Validates AI evaluation quality against test cases
// ─────────────────────────────────────────────────────────────

import type { AIProvider, EvaluationResult } from './types';
import type { TestCase } from './test-cases';
import { ALL_TEST_CASES, STRONG_ANSWERS, AVERAGE_ANSWERS, WEAK_ANSWERS } from './test-cases';

/**
 * Test result for a single case
 */
export interface TestResult {
  testCase: TestCase;
  result: EvaluationResult | null;
  error: string | null;
  passed: boolean;
  scoreDeviation: number; // Difference from expected score
  timeTaken: number; // milliseconds
}

/**
 * Summary of test run
 */
export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  avgScoreDeviation: number;
  avgTimeTaken: number;
  strongResults: TestResult[];
  averageResults: TestResult[];
  weakResults: TestResult[];
}

/**
 * Test configuration
 */
export interface TestConfig {
  maxScoreDeviation: number; // Maximum acceptable deviation from expected score (default: 1.0)
  timeout: number; // Per-test timeout in milliseconds (default: 30000)
  verbose: boolean; // Log individual test results (default: false)
}

const DEFAULT_CONFIG: TestConfig = {
  maxScoreDeviation: 1.0,
  timeout: 30000,
  verbose: false,
};

/**
 * Run all test cases against an AI provider
 */
export async function runEvaluationTests(
  provider: AIProvider,
  config: Partial<TestConfig> = {}
): Promise<TestSummary> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const results: TestResult[] = [];

  for (const testCase of ALL_TEST_CASES) {
    const result = await runSingleTest(provider, testCase, finalConfig);
    results.push(result);

    if (finalConfig.verbose) {
      logTestResult(result);
    }
  }

  return generateSummary(results);
}

/**
 * Run a single test case
 */
async function runSingleTest(
  provider: AIProvider,
  testCase: TestCase,
  config: TestConfig
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // Add timeout to evaluation
    const evaluationPromise = provider.evaluateAnswer(testCase.request);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout')), config.timeout);
    });

    const result = await Promise.race([evaluationPromise, timeoutPromise]);
    const timeTaken = Date.now() - startTime;

    // Check if score is within acceptable deviation
    const scoreDeviation = Math.abs(result.score - testCase.expectedScore);
    const passed = scoreDeviation <= config.maxScoreDeviation;

    return {
      testCase,
      result,
      error: null,
      passed,
      scoreDeviation,
      timeTaken,
    };
  } catch (error) {
    const timeTaken = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      testCase,
      result: null,
      error: errorMessage,
      passed: false,
      scoreDeviation: Infinity,
      timeTaken,
    };
  }
}

/**
 * Generate summary from test results
 */
function generateSummary(results: TestResult[]): TestSummary {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  const successfulResults = results.filter((r) => r.result !== null);
  const avgScoreDeviation =
    successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.scoreDeviation, 0) / successfulResults.length
      : 0;

  const avgTimeTaken =
    results.length > 0 ? results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length : 0;

  const strongResults = results.filter((r) => r.testCase.expectedQuality === 'strong');
  const averageResults = results.filter((r) => r.testCase.expectedQuality === 'average');
  const weakResults = results.filter((r) => r.testCase.expectedQuality === 'weak');

  return {
    totalTests: results.length,
    passed,
    failed,
    avgScoreDeviation,
    avgTimeTaken,
    strongResults,
    averageResults,
    weakResults,
  };
}

/**
 * Log test result to console
 */
function logTestResult(result: TestResult): void {
  const status = result.passed ? '✓' : '✗';
  const quality = result.testCase.expectedQuality.toUpperCase().padEnd(8);

  if (result.error) {
    console.log(
      `${status} [${quality}] ${result.testCase.id} - ERROR: ${result.error} (${result.timeTaken}ms)`
    );
  } else if (result.result) {
    console.log(
      `${status} [${quality}] ${result.testCase.id} - Score: ${result.result.score} (Expected: ${result.testCase.expectedScore}, Δ: ${result.scoreDeviation.toFixed(2)}) (${result.timeTaken}ms)`
    );
  }
}

/**
 * Print test summary to console
 */
export function printTestSummary(summary: TestSummary): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('           AI EVALUATION TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total Tests:  ${summary.totalTests}`);
  console.log(`Passed:       ${summary.passed} (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed:       ${summary.failed}`);
  console.log(`Avg Deviation: ${summary.avgScoreDeviation.toFixed(2)}`);
  console.log(`Avg Time:     ${summary.avgTimeTaken.toFixed(0)}ms\n`);

  console.log('BY QUALITY CATEGORY:');
  console.log('─────────────────────────────────────────────────');

  printCategorySummary('STRONG', summary.strongResults);
  printCategorySummary('AVERAGE', summary.averageResults);
  printCategorySummary('WEAK', summary.weakResults);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Print summary for a quality category
 */
function printCategorySummary(category: string, results: TestResult[]): void {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  const successfulResults = results.filter((r) => r.result !== null);
  const avgScore =
    successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.result!.score, 0) / successfulResults.length
      : 0;

  console.log(
    `${category.padEnd(8)}: ${passed}/${total} passed (${passRate.toFixed(0)}%) - Avg Score: ${avgScore.toFixed(2)}`
  );
}

/**
 * Export test results to JSON for analysis
 */
export function exportTestResults(summary: TestSummary): string {
  const exportData = {
    summary: {
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failed,
      passRate: ((summary.passed / summary.totalTests) * 100).toFixed(1) + '%',
      avgScoreDeviation: summary.avgScoreDeviation.toFixed(2),
      avgTimeTaken: summary.avgTimeTaken.toFixed(0) + 'ms',
    },
    categories: {
      strong: formatCategoryResults(summary.strongResults),
      average: formatCategoryResults(summary.averageResults),
      weak: formatCategoryResults(summary.weakResults),
    },
    detailedResults: summary.strongResults
      .concat(summary.averageResults)
      .concat(summary.weakResults)
      .map((r) => ({
        testId: r.testCase.id,
        expectedQuality: r.testCase.expectedQuality,
        expectedScore: r.testCase.expectedScore,
        actualScore: r.result?.score,
        scoreDeviation: r.scoreDeviation,
        passed: r.passed,
        timeTaken: r.timeTaken,
        error: r.error,
        strengths: r.result?.strengths,
        improvements: r.result?.improvements,
        feedback: r.result?.feedback,
      })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Format category results for export
 */
function formatCategoryResults(results: TestResult[]): object {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const successfulResults = results.filter((r) => r.result !== null);
  const avgScore =
    successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.result!.score, 0) / successfulResults.length
      : 0;

  return {
    total,
    passed,
    failed: total - passed,
    passRate: ((passed / total) * 100).toFixed(1) + '%',
    avgScore: avgScore.toFixed(2),
  };
}
