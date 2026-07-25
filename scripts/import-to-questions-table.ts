// ─────────────────────────────────────────────────────────────
// THE FORGE — Import to Questions Table
// Import questions-template.csv into the existing 'questions' table
// This table structure is already in place from migration 002
// Usage: npx ts-node scripts/import-to-questions-table.ts
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env file
import { config } from 'dotenv';
config();

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  console.error('   Make sure .env file exists with these variables');
  process.exit(1);
}

console.log('✅ Supabase URL:', SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CSVRow {
  id: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  question_type: string;
  question: string;
  prompt?: string;
  answer_data: string;
  xp_reward: string;
  time_limit?: string;
  tags: string;
  source?: string;
  active: string;
}

interface QuestionRow {
  id: string;
  category: string;
  subcategory: string | null;
  difficulty: string;
  question_type: string;
  question: string;
  prompt: string | null;
  answer_data: any;
  xp_reward: number;
  time_limit: number | null;
  tags: string[];
  source: string | null;
  active: boolean;
}

// ─────────────────────────────────────────────────────────────
// Parse CSV
// ─────────────────────────────────────────────────────────────

function parseCSV(filePath: string): QuestionRow[] {
  console.log(`\n📂 Reading ${filePath}...`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`   Found ${records.length} rows in CSV`);

  return records.map((record) => {
    // Parse answer_data JSON
    let answerData: any = {};
    try {
      answerData = JSON.parse(record.answer_data || '{}');
    } catch (err) {
      console.warn(`⚠️  Invalid answer_data JSON for ${record.id}:`, record.answer_data);
    }

    // Parse tags
    let tags: string[] = [];
    if (record.tags) {
      try {
        tags = JSON.parse(record.tags);
      } catch {
        tags = record.tags.split(',').map((t: string) => t.trim()).filter(t => t.length > 0);
      }
    }

    // Construct row for questions table
    const questionRow: QuestionRow = {
      id: record.id,
      category: record.category || 'General Knowledge',
      subcategory: record.subcategory || null,
      difficulty: record.difficulty || 'Medium',
      question_type: record.question_type,
      question: record.question,
      prompt: record.prompt || null,
      answer_data: answerData,
      xp_reward: parseInt(record.xp_reward, 10) || 10,
      time_limit: record.time_limit ? parseInt(record.time_limit, 10) : null,
      tags,
      source: record.source || 'Team Curated',
      active: record.active !== 'false',
    };

    return questionRow;
  });
}

// ─────────────────────────────────────────────────────────────
// Validate Questions
// ─────────────────────────────────────────────────────────────

function validateQuestion(q: QuestionRow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!q.id) errors.push('Missing id');
  if (!q.category) errors.push('Missing category');
  if (!q.difficulty) errors.push('Missing difficulty');
  if (!q.question_type) errors.push('Missing question_type');
  if (!q.question) errors.push('Missing question text');
  if (!q.answer_data) errors.push('Missing answer_data');

  const validTypes = ['MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse', 'SRT', 'WAT', 'Interview'];
  if (!validTypes.includes(q.question_type)) {
    errors.push(`Invalid question_type: ${q.question_type}`);
  }

  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!validDifficulties.includes(q.difficulty)) {
    errors.push(`Invalid difficulty: ${q.difficulty}`);
  }

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
  if (!validCategories.includes(q.category)) {
    errors.push(`Invalid category: ${q.category}`);
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────────────────────
// Import Questions
// ─────────────────────────────────────────────────────────────

async function importQuestions(questions: QuestionRow[]): Promise<void> {
  console.log(`\n📦 Importing ${questions.length} questions into 'questions' table...`);

  // Validate
  const invalidQuestions: { question: QuestionRow; errors: string[] }[] = [];
  const validQuestions: QuestionRow[] = [];

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

  console.log(`\n✅ ${validQuestions.length} valid questions to import`);

  const batchSize = 50;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < validQuestions.length; i += batchSize) {
    const batch = validQuestions.slice(i, i + batchSize);

    console.log(`   📤 Uploading batch ${Math.floor(i / batchSize) + 1}...`);

    const { error } = await supabase
      .from('questions')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      imported += batch.length;
      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} questions imported`);
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Invalid: ${invalidQuestions.length}`);
  console.log(`   📝 Total: ${questions.length}`);
}

// ─────────────────────────────────────────────────────────────
// Verify Import
// ─────────────────────────────────────────────────────────────

async function verifyImport(): Promise<void> {
  console.log('\n🔍 Verifying imported content...');

  const types = ['MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse', 'SRT', 'WAT', 'Interview'];

  for (const type of types) {
    const { data, error } = await supabase
      .from('questions')
      .select('id', { count: 'exact' })
      .eq('question_type', type)
      .eq('active', true);

    if (error) {
      console.error(`   ❌ ${type}: Error -`, error.message);
    } else {
      console.log(`   ✅ ${type}: ${data?.length || 0} questions`);
    }
  }

  // Check total
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  if (!countError) {
    console.log(`\n   📊 Total active questions in database: ${count}`);
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('THE FORGE — Import Questions to Database');
  console.log('═══════════════════════════════════════════════════════════');

  // Parse CSV
  const csvPath = path.join(__dirname, 'questions-template.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const questions = parseCSV(csvPath);
  console.log(`   ✅ Parsed ${questions.length} questions from CSV`);

  // Import
  await importQuestions(questions);

  // Verify
  await verifyImport();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Import complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  console.error(err.stack);
  process.exit(1);
});
