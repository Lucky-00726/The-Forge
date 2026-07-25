// ─────────────────────────────────────────────────────────────
// THE FORGE — Test Import
// Tests the import system with the template CSV
// Usage: npx ts-node scripts/test-import.ts
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

async function testConnection() {
  console.log('🔌 Testing database connection...');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('   ❌ Missing environment variables');
    console.error('      EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('      EXPO_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    const { data, error } = await supabase.from('questions').select('count').limit(1);
    
    if (error) {
      console.error('   ❌ Connection failed:', error.message);
      return false;
    }

    console.log('   ✅ Connection successful');
    return true;
  } catch (err: any) {
    console.error('   ❌ Connection error:', err.message);
    return false;
  }
}

async function testTableExists() {
  console.log('\n📋 Checking if questions table exists...');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

  try {
    const { data, error } = await supabase.from('questions').select('id').limit(1);
    
    if (error) {
      console.error('   ❌ Table not found or not accessible');
      console.error('      Error:', error.message);
      console.error('\n   💡 Solution: Run migration 002_question_bank.sql in Supabase');
      return false;
    }

    console.log('   ✅ Table exists and is accessible');
    return true;
  } catch (err: any) {
    console.error('   ❌ Error:', err.message);
    return false;
  }
}

async function testRPCFunctions() {
  console.log('\n🔧 Testing RPC functions...');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

  // Test get_session_questions
  try {
    const { data, error } = await supabase.rpc('get_session_questions', {
      p_question_types: ['MCQ'],
      p_count: 1,
    });

    if (error) {
      console.error('   ❌ get_session_questions failed:', error.message);
      return false;
    }

    console.log('   ✅ get_session_questions works');
  } catch (err: any) {
    console.error('   ❌ get_session_questions error:', err.message);
    return false;
  }

  // Test get_mixed_session_questions
  try {
    const { data, error } = await supabase.rpc('get_mixed_session_questions', {
      p_type_counts: { MCQ: 1 },
    });

    if (error) {
      console.error('   ❌ get_mixed_session_questions failed:', error.message);
      return false;
    }

    console.log('   ✅ get_mixed_session_questions works');
  } catch (err: any) {
    console.error('   ❌ get_mixed_session_questions error:', err.message);
    return false;
  }

  return true;
}

async function testCurrentContent() {
  console.log('\n📊 Checking existing content...');

  const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('question_type')
      .eq('active', true);

    if (error) {
      console.error('   ❌ Query failed:', error.message);
      return false;
    }

    if (!data || data.length === 0) {
      console.log('   ℹ️  No questions in database yet');
      console.log('      This is normal if you haven\'t imported content');
      return true;
    }

    // Count by type
    const byType: Record<string, number> = {};
    data.forEach((row: any) => {
      byType[row.question_type] = (byType[row.question_type] || 0) + 1;
    });

    console.log('   ✅ Current content:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`      ${type.padEnd(20)} ${count}`);
    });

    return true;
  } catch (err: any) {
    console.error('   ❌ Error:', err.message);
    return false;
  }
}

async function testImportScript() {
  console.log('\n🧪 Testing import script with template...');

  const templatePath = path.join(__dirname, 'questions-template.csv');
  
  if (!fs.existsSync(templatePath)) {
    console.error('   ❌ Template file not found:', templatePath);
    return false;
  }

  console.log('   ✓ Template file exists');

  // Try to import the template
  console.log('   ⏳ Running import...');
  
  const { execSync } = require('child_process');
  
  try {
    const output = execSync(
      `npx ts-node ${path.join(__dirname, 'enhanced-import.ts')} ${templatePath}`,
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    );
    
    console.log('   ✅ Import successful');
    console.log('\n' + output);
    return true;
  } catch (err: any) {
    console.error('   ❌ Import failed');
    console.error(err.stdout || err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 THE FORGE — Import System Test');
  console.log('═'.repeat(70) + '\n');

  const tests = [
    { name: 'Database Connection', fn: testConnection },
    { name: 'Questions Table', fn: testTableExists },
    { name: 'RPC Functions', fn: testRPCFunctions },
    { name: 'Current Content', fn: testCurrentContent },
  ];

  let allPassed = true;

  for (const test of tests) {
    const passed = await test.fn();
    if (!passed) {
      allPassed = false;
      break; // Stop on first failure
    }
  }

  if (!allPassed) {
    console.log('\n' + '═'.repeat(70));
    console.log('❌ Tests failed. Fix the issues above before importing content.');
    console.log('═'.repeat(70) + '\n');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✅ All tests passed!');
  console.log('═'.repeat(70));

  // Ask if user wants to test import
  console.log('\n💡 Next Step: Test import with template');
  console.log('   Run: npx ts-node scripts/enhanced-import.ts scripts/questions-template.csv');
  console.log('\n   Or place your CSV files in content/ and run:');
  console.log('   npx ts-node scripts/enhanced-import.ts content/*.csv\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
