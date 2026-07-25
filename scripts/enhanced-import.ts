// ─────────────────────────────────────────────────────────────
// THE FORGE — Enhanced Question Import Script
// Imports questions from multiple CSV files with validation & deduplication
// Usage: npx ts-node scripts/enhanced-import.ts <file1.csv> [file2.csv] [...]
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

// Load from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  console.error('   Please check your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface QuestionImport {
  id: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  question_type: string;
  question: string;
  prompt?: string;
  answer_data: any;
  xp_reward: number;
  time_limit?: number;
  tags: string[];
  source?: string;
  active: boolean;
}

interface ImportStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesRemoved: number;
  imported: number;
  failed: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─────────────────────────────────────────────────────────────
// Content Hash (for duplicate detection)
// ─────────────────────────────────────────────────────────────

function generateContentHash(question: QuestionImport): string {
  // Hash based on question text + type + category
  const content = `${question.question_type}|${question.category}|${question.question}`;
  return crypto.createHash('sha256').update(content.toLowerCase().trim()).digest('hex');
}

// ─────────────────────────────────────────────────────────────
// CSV Parsing with Enhanced Error Handling
// ─────────────────────────────────────────────────────────────

function parseCSV(filePath: string): QuestionImport[] {
  console.log(`\n📄 Parsing ${path.basename(filePath)}...`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  let records: any[];
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err: any) {
    console.error(`   ❌ CSV parse error: ${err.message}`);
    return [];
  }

  const questions: QuestionImport[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNum = i + 2; // +2 for header row and 0-indexing

    try {
      const question = parseQuestionRecord(record, lineNum, filePath);
      if (question) {
        questions.push(question);
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Line ${lineNum}: ${err.message}`);
    }
  }

  console.log(`   ✅ Parsed ${questions.length} questions`);
  return questions;
}

function parseQuestionRecord(record: any, lineNum: number, filePath: string): QuestionImport | null {
  // Parse answer_data JSON string
  let answerData = {};
  if (record.answer_data) {
    try {
      // Handle both JSON string and already-parsed objects
      if (typeof record.answer_data === 'string') {
        answerData = JSON.parse(record.answer_data);
      } else {
        answerData = record.answer_data;
      }
    } catch (err) {
      throw new Error(`Invalid answer_data JSON: ${record.answer_data}`);
    }
  }

  // Parse tags array
  let tags: string[] = [];
  if (record.tags) {
    try {
      if (typeof record.tags === 'string') {
        // Try JSON parse first
        if (record.tags.startsWith('[')) {
          tags = JSON.parse(record.tags);
        } else {
          // Fallback to comma-separated
          tags = record.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(record.tags)) {
        tags = record.tags;
      }
    } catch {
      tags = record.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
  }

  // Auto-generate ID if missing
  let id = record.id;
  if (!id) {
    const prefix = record.question_type?.substring(0, 3).toUpperCase() || 'QST';
    const hash = crypto.createHash('md5').update(record.question || '').digest('hex').substring(0, 6);
    id = `${prefix}-${hash}`;
  }

  return {
    id,
    category: record.category,
    subcategory: record.subcategory || null,
    difficulty: record.difficulty,
    question_type: record.question_type,
    question: record.question,
    prompt: record.prompt || null,
    answer_data: answerData,
    xp_reward: parseInt(record.xp_reward, 10) || 10,
    time_limit: record.time_limit ? parseInt(record.time_limit, 10) : undefined,
    tags,
    source: record.source || path.basename(filePath, '.csv'),
    active: record.active !== 'false',
  };
}

// ─────────────────────────────────────────────────────────────
// Enhanced Validation
// ─────────────────────────────────────────────────────────────

function validateQuestion(question: QuestionImport): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!question.id) errors.push('Missing id');
  if (!question.category) errors.push('Missing category');
  if (!question.difficulty) errors.push('Missing difficulty');
  if (!question.question_type) errors.push('Missing question_type');
  if (!question.question || question.question.trim().length === 0) {
    errors.push('Missing question text');
  }

  // Validate question_type
  const validTypes = ['MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse', 'SRT', 'WAT', 'Interview'];
  if (question.question_type && !validTypes.includes(question.question_type)) {
    errors.push(`Invalid question_type: ${question.question_type}`);
  }

  // Validate difficulty
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (question.difficulty && !validDifficulties.includes(question.difficulty)) {
    errors.push(`Invalid difficulty: ${question.difficulty}`);
  }

  // Validate category
  const validCategories = [
    'SSB Fundamentals',
    'OLQs',
    'Psychological Tests',
    'GTO Tasks',
    'Interview Prep',
    'Leadership',
    'Decision Making',
    'Communication',
    'General Knowledge'
  ];
  if (question.category && !validCategories.includes(question.category)) {
    warnings.push(`Non-standard category: ${question.category}`);
  }

  // Validate answer_data based on question type
  if (question.answer_data && typeof question.answer_data === 'object') {
    const type = question.question_type;
    const data = question.answer_data;

    if (type === 'MCQ' || type === 'RapidResponse') {
      if (!data.options || !Array.isArray(data.options)) {
        errors.push('MCQ/RapidResponse requires options array');
      }
      if (typeof data.correctIndex !== 'number') {
        errors.push('MCQ/RapidResponse requires correctIndex');
      }
    }

    if (type === 'SingleWord') {
      if (!data.correctAnswer && !data.acceptableAnswers) {
        errors.push('SingleWord requires correctAnswer or acceptableAnswers');
      }
    }

    if (type === 'Numeric') {
      if (typeof data.correctAnswer !== 'number') {
        errors.push('Numeric requires correctAnswer number');
      }
    }

    if (type === 'TrueFalse') {
      if (typeof data.correctAnswer !== 'boolean') {
        errors.push('TrueFalse requires correctAnswer boolean');
      }
    }

    if (type === 'SRT' || type === 'WAT' || type === 'Interview') {
      if (!data.minWords && !data.evaluationCriteria) {
        warnings.push(`${type} should have minWords or evaluationCriteria`);
      }
    }
  } else {
    errors.push('answer_data must be an object');
  }

  // Validate XP reward
  if (question.xp_reward < 1 || question.xp_reward > 100) {
    warnings.push(`Unusual xp_reward: ${question.xp_reward}`);
  }

  // Validate question length
  if (question.question.length < 10) {
    warnings.push('Question text is very short');
  }
  if (question.question.length > 500) {
    warnings.push('Question text is very long (>500 chars)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─────────────────────────────────────────────────────────────
// Duplicate Detection
// ─────────────────────────────────────────────────────────────

function removeDuplicates(questions: QuestionImport[]): {
  unique: QuestionImport[];
  duplicates: QuestionImport[];
} {
  const seen = new Map<string, QuestionImport>();
  const duplicates: QuestionImport[] = [];

  for (const question of questions) {
    const hash = generateContentHash(question);
    
    if (seen.has(hash)) {
      duplicates.push(question);
    } else {
      seen.set(hash, question);
    }
  }

  return {
    unique: Array.from(seen.values()),
    duplicates,
  };
}

// ─────────────────────────────────────────────────────────────
// Import with Statistics
// ─────────────────────────────────────────────────────────────

async function importQuestions(questions: QuestionImport[], batchSize = 50): Promise<ImportStats> {
  const stats: ImportStats = {
    totalRecords: questions.length,
    validRecords: 0,
    invalidRecords: 0,
    duplicatesRemoved: 0,
    imported: 0,
    failed: 0,
    byCategory: {},
    byType: {},
    byDifficulty: {},
  };

  console.log(`\n🔍 Validating ${questions.length} questions...`);

  // Validate all questions
  const validQuestions: QuestionImport[] = [];
  const invalidQuestions: { question: QuestionImport; result: ValidationResult }[] = [];

  for (const question of questions) {
    const validation = validateQuestion(question);
    
    if (validation.valid) {
      validQuestions.push(question);
      stats.validRecords++;
      
      // Update stats
      stats.byCategory[question.category] = (stats.byCategory[question.category] || 0) + 1;
      stats.byType[question.question_type] = (stats.byType[question.question_type] || 0) + 1;
      stats.byDifficulty[question.difficulty] = (stats.byDifficulty[question.difficulty] || 0) + 1;
    } else {
      invalidQuestions.push({ question, result: validation });
      stats.invalidRecords++;
    }

    // Log warnings
    if (validation.warnings.length > 0) {
      console.warn(`   ⚠️  ${question.id}: ${validation.warnings.join(', ')}`);
    }
  }

  // Report invalid questions
  if (invalidQuestions.length > 0) {
    console.error(`\n❌ ${invalidQuestions.length} invalid questions:`);
    invalidQuestions.forEach(({ question, result }) => {
      console.error(`   ${question.id}: ${result.errors.join(', ')}`);
    });
  }

  console.log(`\n✅ ${validQuestions.length} valid questions`);

  // Remove duplicates
  const { unique, duplicates } = removeDuplicates(validQuestions);
  stats.duplicatesRemoved = duplicates.length;

  if (duplicates.length > 0) {
    console.log(`\n🔄 Removed ${duplicates.length} duplicates`);
    console.log('   Duplicate IDs:', duplicates.map(d => d.id).join(', '));
  }

  // Import in batches
  console.log(`\n⏳ Importing ${unique.length} questions in batches of ${batchSize}...`);

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    try {
      const { error } = await supabase.from('questions').upsert(batch, {
        onConflict: 'id',
      });

      if (error) {
        console.error(`   ❌ Batch ${batchNum} failed: ${error.message}`);
        stats.failed += batch.length;
      } else {
        stats.imported += batch.length;
        console.log(`   ✅ Batch ${batchNum}: ${batch.length} questions`);
      }
    } catch (err: any) {
      console.error(`   ❌ Batch ${batchNum} error: ${err.message}`);
      stats.failed += batch.length;
    }
  }

  return stats;
}

// ─────────────────────────────────────────────────────────────
// Statistics Report
// ─────────────────────────────────────────────────────────────

function printStats(stats: ImportStats) {
  console.log('\n' + '═'.repeat(60));
  console.log('📊 IMPORT STATISTICS');
  console.log('═'.repeat(60));

  console.log('\n📈 Overall:');
  console.log(`   Total Records:        ${stats.totalRecords}`);
  console.log(`   Valid Records:        ${stats.validRecords}`);
  console.log(`   Invalid Records:      ${stats.invalidRecords}`);
  console.log(`   Duplicates Removed:   ${stats.duplicatesRemoved}`);
  console.log(`   Successfully Imported: ${stats.imported}`);
  console.log(`   Failed:               ${stats.failed}`);

  if (Object.keys(stats.byType).length > 0) {
    console.log('\n📝 By Question Type:');
    Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type.padEnd(20)} ${count}`);
      });
  }

  if (Object.keys(stats.byDifficulty).length > 0) {
    console.log('\n⚡ By Difficulty:');
    Object.entries(stats.byDifficulty)
      .sort((a, b) => b[1] - a[1])
      .forEach(([difficulty, count]) => {
        console.log(`   ${difficulty.padEnd(20)} ${count}`);
      });
  }

  if (Object.keys(stats.byCategory).length > 0) {
    console.log('\n📚 By Category:');
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category.padEnd(30)} ${count}`);
      });
  }

  const successRate = stats.totalRecords > 0
    ? ((stats.imported / stats.totalRecords) * 100).toFixed(1)
    : '0.0';

  console.log('\n' + '═'.repeat(60));
  console.log(`✨ Success Rate: ${successRate}%`);
  console.log('═'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────────────────────
// Save Import Log
// ─────────────────────────────────────────────────────────────

function saveImportLog(stats: ImportStats, files: string[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = path.join(__dirname, `import-log-${timestamp}.json`);

  const logData = {
    timestamp: new Date().toISOString(),
    files,
    stats,
  };

  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  console.log(`\n📄 Import log saved: ${logPath}`);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 THE FORGE — Enhanced Question Import');
  console.log('═'.repeat(60));

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('\n❌ No files specified');
    console.error('\nUsage:');
    console.error('  npx ts-node scripts/enhanced-import.ts <file1.csv> [file2.csv] [...]');
    console.error('\nExample:');
    console.error('  npx ts-node scripts/enhanced-import.ts data/interview.csv data/srt.csv data/wat.csv');
    process.exit(1);
  }

  // Validate all files exist
  const missingFiles = args.filter(f => !fs.existsSync(f));
  if (missingFiles.length > 0) {
    console.error('\n❌ Files not found:');
    missingFiles.forEach(f => console.error(`   ${f}`));
    process.exit(1);
  }

  // Parse all CSV files
  const allQuestions: QuestionImport[] = [];

  for (const filePath of args) {
    const questions = parseCSV(filePath);
    allQuestions.push(...questions);
  }

  console.log(`\n📊 Total questions from ${args.length} file(s): ${allQuestions.length}`);

  if (allQuestions.length === 0) {
    console.error('\n❌ No questions to import');
    process.exit(1);
  }

  // Import questions
  const stats = await importQuestions(allQuestions);

  // Print statistics
  printStats(stats);

  // Save log
  saveImportLog(stats, args);

  // Exit with appropriate code
  if (stats.failed > 0 || stats.invalidRecords > 0) {
    console.log('⚠️  Import completed with errors');
    process.exit(1);
  } else {
    console.log('✅ Import completed successfully');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
