// ─────────────────────────────────────────────────────────────
// THE FORGE — Real Content Import Script
// Import questions-template.csv into content_questions table
// Usage: npx ts-node scripts/import-real-content.ts
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
  console.error('   Make sure .env file exists with these variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────
// Apply Migration First
// ─────────────────────────────────────────────────────────────

async function applyMigration(): Promise<boolean> {
  console.log('\n📋 Applying migration 003_content_migration.sql...');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/003_content_migration.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return false;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by statement (basic SQL splitter)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`   Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 10) continue; // Skip empty or comment-only statements

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      
      if (error) {
        // Check if error is just "relation already exists" which is fine
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Statement ${i + 1}: Table/function already exists (skipping)`);
        } else {
          console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
        }
      } else {
        console.log(`   ✅ Statement ${i + 1} executed`);
      }
    } catch (err: any) {
      console.error(`   ❌ Statement ${i + 1} exception:`, err.message);
    }
  }

  console.log('✅ Migration application complete\n');
  return true;
}

// ─────────────────────────────────────────────────────────────
// Parse CSV
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

interface ContentQuestion {
  id: string;
  section: string | null;
  content_type: string;
  category: string | null;
  subcategory: string | null;
  question: string | null;
  title: string | null;
  description: string | null;
  theme: string | null;
  word: string | null;
  situation: string | null;
  answer: string | null;
  answer_type: string | null;
  difficulty: string | null;
  keywords: string | null;
  tags: string[] | null;
  source: string | null;
  status: string;
  question_category: string;
  xp_reward: number;
  time_limit: number | null;
  discussion_type: string | null;
  quality_tested: string | null;
  active: boolean;
}

function parseCSV(filePath: string): ContentQuestion[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records: CSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record) => {
    // Parse answer_data JSON
    let answerData: any = {};
    try {
      answerData = JSON.parse(record.answer_data || '{}');
    } catch (err) {
      console.warn(`⚠️  Invalid answer_data JSON for ${record.id}`);
    }

    // Parse tags
    let tags: string[] = [];
    if (record.tags) {
      try {
        tags = JSON.parse(record.tags);
      } catch {
        tags = record.tags.split(',').map((t: string) => t.trim());
      }
    }

    // Map question_type to question_category
    const categoryMap: Record<string, string> = {
      'MCQ': 'OIR',
      'SingleWord': 'OIR',
      'Numeric': 'OIR',
      'RapidResponse': 'OIR',
      'TrueFalse': 'OIR',
      'SRT': 'SRT',
      'WAT': 'WAT',
      'Interview': 'Interview',
    };

    const questionCategory = categoryMap[record.question_type] || 'OIR';

    // Construct row for content_questions table
    const contentQuestion: ContentQuestion = {
      id: record.id,
      section: null,
      content_type: record.question_type,
      category: record.category || null,
      subcategory: record.subcategory || null,
      question: record.question || null,
      title: null,
      description: null,
      theme: null,
      word: record.question_type === 'WAT' ? record.question : null,
      situation: record.question_type === 'SRT' ? record.question : null,
      answer: null, // Will extract from answer_data if MCQ
      answer_type: null,
      difficulty: record.difficulty || 'Medium',
      keywords: tags.join(', '),
      tags,
      source: record.source || 'Team Curated',
      status: 'approved',
      question_category: questionCategory,
      xp_reward: parseInt(record.xp_reward, 10) || 10,
      time_limit: record.time_limit ? parseInt(record.time_limit, 10) : null,
      discussion_type: null,
      quality_tested: null,
      active: record.active !== 'false',
    };

    return contentQuestion;
  });
}

// ─────────────────────────────────────────────────────────────
// Import Questions
// ─────────────────────────────────────────────────────────────

async function importQuestions(questions: ContentQuestion[]): Promise<void> {
  console.log(`\n📦 Importing ${questions.length} questions into content_questions table...`);

  const batchSize = 50;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('content_questions')
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
  console.log(`   📝 Total: ${questions.length}`);
}

// ─────────────────────────────────────────────────────────────
// Verify Import
// ─────────────────────────────────────────────────────────────

async function verifyImport(): Promise<void> {
  console.log('\n🔍 Verifying imported content...');

  const categories = ['OIR', 'SRT', 'WAT', 'Interview'];

  for (const category of categories) {
    const { data, error } = await supabase
      .from('content_questions')
      .select('id, content_type, question_category', { count: 'exact' })
      .eq('question_category', category)
      .eq('active', true);

    if (error) {
      console.error(`   ❌ ${category}: Error -`, error.message);
    } else {
      console.log(`   ✅ ${category}: ${data?.length || 0} questions`);
    }
  }

  // Check total
  const { count, error: countError } = await supabase
    .from('content_questions')
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
  console.log('THE FORGE — Real Content Import');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Apply migration (will skip if already applied)
  console.log('\n📋 Step 1: Ensure database schema is ready');
  console.log('   Note: If tables exist, this will show warnings but continue');
  
  // For now, skip migration application via RPC since it requires admin access
  // User should manually apply migration using Supabase dashboard or CLI
  console.log('   ⚠️  Please ensure migration 003_content_migration.sql is applied');
  console.log('   You can apply it via Supabase Dashboard → SQL Editor');
  console.log('   Or via: npx supabase db push (if Supabase CLI is configured)\n');

  // Step 2: Parse CSV
  console.log('📋 Step 2: Parse CSV file');
  const csvPath = path.join(__dirname, 'questions-template.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const questions = parseCSV(csvPath);
  console.log(`   ✅ Parsed ${questions.length} questions from CSV\n`);

  // Step 3: Import
  console.log('📋 Step 3: Import to Supabase');
  await importQuestions(questions);

  // Step 4: Verify
  console.log('\n📋 Step 4: Verify import');
  await verifyImport();

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Import complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
