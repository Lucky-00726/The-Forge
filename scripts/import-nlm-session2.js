// ─────────────────────────────────────────────────────────────
// THE FORGE — NLM Session 2 Import Script
// Imports session2_*.csv files (NLM-222 to NLM-300)
// Source: NotebookLM Import — SSB/NDA/CDS preparation content
//
// Run:    node scripts/import-nlm-session2.js
// Safe:   idempotent upsert on conflict (id). Re-runnable.
// Rollback: DELETE FROM questions WHERE source = 'NotebookLM Import'
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Valid DB constraint values ─────────────────────────────────
const VALID_CATEGORIES = new Set([
  'SSB Fundamentals', 'OLQs', 'Psychological Tests', 'GTO Tasks',
  'Interview Prep', 'Leadership', 'Decision Making', 'Communication',
  'General Knowledge',
]);
const VALID_DIFFICULTIES = new Set(['Easy', 'Medium', 'Hard']);
const VALID_TYPES = new Set([
  'MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse',
  'SRT', 'WAT', 'Interview',
]);

// ── CSV files to import (in order) ────────────────────────────
const CSV_FILES = [
  { file: 'session2_singleword.csv',      label: 'SingleWord batch 1' },
  { file: 'session2_numeric.csv',         label: 'Numeric batch 1' },
  { file: 'session2_truefalse.csv',       label: 'TrueFalse batch 1' },
  { file: 'session2_rapidresponse.csv',   label: 'RapidResponse batch 1' },
  { file: 'session2_mcq.csv',             label: 'MCQ batch 1' },
  { file: 'session2_rapidresponse_2.csv', label: 'RapidResponse batch 2' },
  { file: 'session2_singleword_2.csv',    label: 'SingleWord batch 2' },
  { file: 'session2_truefalse_2.csv',     label: 'TrueFalse batch 2' },
  { file: 'session2_numeric_2.csv',       label: 'Numeric batch 2' },
];

// ── Parse a quoted CSV line ────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

// ── Convert a CSV row to a DB record ──────────────────────────
function rowToRecord(row, fileLabel) {
  const errors = [];

  const id            = row.id?.trim();
  const category      = row.category?.trim();
  const subcategory   = row.subcategory?.trim() || null;
  const difficulty    = row.difficulty?.trim();
  const question_type = row.question_type?.trim();
  const question      = row.question?.trim();
  const prompt_val    = row.prompt?.trim() || null;
  const xp_reward     = parseInt(row.xp_reward, 10) || 10;
  const time_limit    = row.time_limit ? parseInt(row.time_limit, 10) : null;
  const source        = row.source?.trim() || 'NotebookLM Import';
  const active        = row.active?.trim() !== 'false';

  // Validate required fields
  if (!id)            errors.push('missing id');
  if (!question)      errors.push('missing question');
  if (!VALID_CATEGORIES.has(category))   errors.push(`invalid category: "${category}"`);
  if (!VALID_DIFFICULTIES.has(difficulty)) errors.push(`invalid difficulty: "${difficulty}"`);
  if (!VALID_TYPES.has(question_type))   errors.push(`invalid question_type: "${question_type}"`);

  // Parse answer_data JSON
  let answer_data = {};
  try {
    answer_data = JSON.parse(row.answer_data || '{}');
  } catch (e) {
    errors.push(`invalid answer_data JSON: ${e.message}`);
  }

  // Validate answer_data shape per type
  if (errors.length === 0) {
    if (question_type === 'MCQ' || question_type === 'RapidResponse') {
      if (!Array.isArray(answer_data.options) || answer_data.options.length < 2)
        errors.push('MCQ/RapidResponse answer_data must have options array');
      if (typeof answer_data.correctIndex !== 'number')
        errors.push('MCQ/RapidResponse answer_data must have correctIndex');
    } else if (question_type === 'SingleWord') {
      if (!answer_data.correctAnswer)
        errors.push('SingleWord answer_data must have correctAnswer');
    } else if (question_type === 'Numeric') {
      if (typeof answer_data.correctAnswer !== 'number')
        errors.push('Numeric answer_data.correctAnswer must be a number');
    } else if (question_type === 'TrueFalse') {
      if (typeof answer_data.correctAnswer !== 'boolean')
        errors.push('TrueFalse answer_data.correctAnswer must be a boolean');
    }
  }

  // Parse tags
  let tags = [];
  try {
    tags = JSON.parse(row.tags || '[]');
  } catch (e) {
    tags = [];
  }

  if (errors.length > 0) {
    return { ok: false, id, errors };
  }

  return {
    ok: true,
    record: {
      id, category, subcategory, difficulty, question_type,
      question, prompt: prompt_val, answer_data,
      xp_reward, time_limit, tags, source, active,
    },
  };
}

// ── Batch upsert ───────────────────────────────────────────────
async function upsertBatch(records, label) {
  const BATCH = 50;
  let imported = 0, failed = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { error } = await supabase
      .from('questions')
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i / BATCH) + 1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      imported += batch.length;
      process.stdout.write(`  ✅ ${imported}/${records.length} imported\r`);
    }
  }
  console.log(`\n  ${label}: ${imported} imported, ${failed} failed`);
  return { imported, failed };
}

// ── Import one CSV file ────────────────────────────────────────
async function importFile({ file, label }) {
  const filePath = path.join('scripts', file);
  console.log(`\n── ${label} (${file}) ────────────────────────────`);

  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath} — skipping`);
    return { imported: 0, failed: 0, skipped: 0 };
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const { rows } = parseCSV(raw);
  console.log(`  Parsed ${rows.length} rows`);

  const records = [];
  const skipped = [];

  rows.forEach((row, idx) => {
    const result = rowToRecord(row, label);
    if (result.ok) {
      records.push(result.record);
    } else {
      skipped.push({ row: idx + 2, id: result.id, errors: result.errors });
    }
  });

  if (skipped.length > 0) {
    console.log(`  Skipped ${skipped.length} invalid rows:`);
    skipped.forEach(s =>
      console.log(`    Row ${s.row} [${s.id || 'no-id'}]: ${s.errors.join(', ')}`)
    );
  }

  if (records.length === 0) {
    console.log('  No valid records to import');
    return { imported: 0, failed: 0, skipped: skipped.length };
  }

  const result = await upsertBatch(records, label);
  return { ...result, skipped: skipped.length };
}

// ── Post-import verification ───────────────────────────────────
async function verify() {
  console.log('\n── VERIFICATION ─────────────────────────────────────────');

  // Total active by type
  const { data: all } = await supabase
    .from('questions')
    .select('question_type, source, difficulty')
    .eq('active', true);

  const byType = {}, bySource = {}, byDiff = {};
  (all || []).forEach(q => {
    byType[q.question_type]   = (byType[q.question_type] || 0) + 1;
    bySource[q.source || '?'] = (bySource[q.source || '?'] || 0) + 1;
    byDiff[q.difficulty]      = (byDiff[q.difficulty] || 0) + 1;
  });

  console.log('\nAll active questions by type:');
  Object.entries(byType).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nNLM import by source:');
  Object.entries(bySource)
    .filter(([k]) => k.includes('NotebookLM'))
    .forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nAll active by difficulty:');
  Object.entries(byDiff).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  console.log('\nTotal active:', all?.length);

  // Verify Session 2 type pools
  console.log('\nSession 2 pool check (stratified quota: MCQ=6, SW=3, Num=2, TF=2, RR=2):');
  const quotas = { MCQ: 6, SingleWord: 3, Numeric: 2, TrueFalse: 2, RapidResponse: 2 };
  for (const [type, quota] of Object.entries(quotas)) {
    const { data: pool } = await supabase
      .from('questions')
      .select('id')
      .eq('question_type', type)
      .eq('active', true);
    const count = pool?.length || 0;
    const days = Math.floor(count / quota);
    const status = count >= quota ? '✅' : '❌';
    console.log(`  ${status} ${type}: ${count} available (quota ${quota} → ~${days} unique play-days)`);
  }
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('THE FORGE — NLM Session 2 Import (NLM-222 to NLM-300)');
  console.log('═══════════════════════════════════════════════════════');

  const results = { imported: 0, failed: 0, skipped: 0 };

  for (const csvFile of CSV_FILES) {
    const r = await importFile(csvFile);
    results.imported += r.imported;
    results.failed   += r.failed;
    results.skipped  += r.skipped;
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`TOTAL: ${results.imported} imported | ${results.failed} failed | ${results.skipped} skipped`);
  console.log('══════════════════════════════════════════════════════');

  await verify();

  console.log('\n══════════════════════════════════════════════════════');
  console.log('ROLLBACK COMMAND (if needed):');
  console.log("  DELETE FROM questions WHERE source = 'NotebookLM Import';");
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
