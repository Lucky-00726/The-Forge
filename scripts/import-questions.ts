// ─────────────────────────────────────────────────────────────
// THE FORGE — Question Import Script
// Imports questions from CSV/JSON into Supabase
// Usage: npx ts-node scripts/import-questions.ts <file.csv|file.json>
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
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

// ─────────────────────────────────────────────────────────────
// CSV Parsing
// ─────────────────────────────────────────────────────────────

function parseCSV(filePath: string): QuestionImport[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((record: any) => {
    // Parse answer_data JSON string
    let answerData = {};
    try {
      answerData = JSON.parse(record.answer_data || '{}');
    } catch (err) {
      console.warn(`⚠️  Invalid answer_data JSON for ${record.id}:`, record.answer_data);
    }

    // Parse tags array
    let tags: string[] = [];
    if (record.tags) {
      try {
        tags = JSON.parse(record.tags);
      } catch {
        tags = record.tags.split(',').map((t: string) => t.trim());
      }
    }

    return {
      id: record.id,
      category: record.category,
      subcategory: record.subcategory || null,
      difficulty: record.difficulty,
      question_type: record.question_type,
      question: record.question,
      prompt: record.prompt || null,
      answer_data: answerData,
      xp_reward: parseInt(record.xp_reward, 10) || 10,
      time_limit: record.time_limit ? parseInt(record.time_limit, 10) : null,
      tags,
      source: record.source || null,
      active: record.active !== 'false',
    };
  });
}

// ─────────────────────────────────────────────────────────────
// JSON Parsing
// ─────────────────────────────────────────────────────────────

function parseJSON(filePath: string): QuestionImport[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(fileContent);

  if (Array.isArray(data)) {
    return data;
  } else if (data.questions && Array.isArray(data.questions)) {
    return data.questions;
  } else {
    throw new Error('Invalid JSON structure. Expected array or {questions: [...]}');
  }
}

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function validateQuestion(question: QuestionImport): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!question.id) errors.push('Missing id');
  if (!question.category) errors.push('Missing category');
  if (!question.difficulty) errors.push('Missing difficulty');
  if (!question.question_type) errors.push('Missing question_type');
  if (!question.question) errors.push('Missing question text');
  if (!question.answer_data) errors.push('Missing answer_data');

  const validTypes = ['MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse', 'SRT', 'WAT', 'Interview'];
  if (!validTypes.includes(question.question_type)) {
    errors.push(`Invalid question_type: ${question.question_type}`);
  }

  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!validDifficulties.includes(question.difficulty)) {
    errors.push(`Invalid difficulty: ${question.difficulty}`);
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────
// Import
// ─────────────────────────────────────────────────────────────

async function importQuestions(questions: QuestionImport[], batchSize = 50): Promise<void> {
  console.log(`\n📦 Importing ${questions.length} questions...`);

  // Validate all questions first
  const invalidQuestions: { question: QuestionImport; errors: string[] }[] = [];
  const validQuestions: QuestionImport[] = [];

  for (const question of questions) {
    const validation = validateQuestion(question);
    if (validation.valid) {
      validQuestions.push(question);
    } else {
      invalidQuestions.push({ question, errors: validation.errors });
    }
  }

  if (invalidQuestions.length > 0) {
    console.error(`\n❌ ${invalidQuestions.length} invalid questions:`);
    invalidQuestions.forEach(({ question, errors }) => {
      console.error(`   ${question.id}: ${errors.join(', ')}`);
    });
  }

  if (validQuestions.length === 0) {
    console.error('\n❌ No valid questions to import');
    return;
  }

  console.log(`\n✅ ${validQuestions.length} valid questions`);
  console.log('⏳ Importing in batches...');

  let imported = 0;
  let failed = 0;

  for (let i = 0; i < validQuestions.length; i += batchSize) {
    const batch = validQuestions.slice(i, i + batchSize);

    const { data, error } = await supabase.from('questions').upsert(batch, {
      onConflict: 'id',
    });

    if (error) {
      console.error(`   ❌ Batch ${i / batchSize + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      imported += batch.length;
      console.log(`   ✅ Batch ${i / batchSize + 1}: ${batch.length} questions`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Invalid: ${invalidQuestions.length}`);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: npx ts-node scripts/import-questions.ts <file.csv|file.json>');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const ext = path.extname(filePath).toLowerCase();
  let questions: QuestionImport[] = [];

  console.log(`\n📂 Reading ${filePath}...`);

  try {
    if (ext === '.csv') {
      questions = parseCSV(filePath);
    } else if (ext === '.json') {
      questions = parseJSON(filePath);
    } else {
      console.error('❌ Unsupported file format. Use .csv or .json');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Parse error:', err);
    process.exit(1);
  }

  await importQuestions(questions);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
