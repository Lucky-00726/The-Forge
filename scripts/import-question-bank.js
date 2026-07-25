// ─────────────────────────────────────────────────────────────
// THE FORGE — Question Bank Import Script
// Imports forge-mcq.csv (65 MCQ rows with pre-built options)
// and forge-objective.csv (155 Q&A rows → MCQ with real distractors)
//
// Run: node scripts/import-question-bank.js
// Safe: idempotent upsert on conflict (id). Re-runnable.
// Rollback: DELETE FROM questions WHERE source IN ('MCQ Bank v2', 'Objective Bank v2')
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,  // service role bypasses RLS
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Category normalisation ─────────────────────────────────────
// DB CHECK constraint allows only these 9 values.
// CSV uses freeform categories — map them to allowed values.
const CATEGORY_MAP = {
  'Indian Armed Forces':    'SSB Fundamentals',
  'Defence Technology':     'SSB Fundamentals',
  'Military Awareness':     'SSB Fundamentals',
  'Defence Organizations':  'SSB Fundamentals',
  'Defence Operations':     'SSB Fundamentals',
  'Defence Awareness':      'SSB Fundamentals',
  'Military History':       'General Knowledge',
  'Geography':              'General Knowledge',
  'Science':                'General Knowledge',
  'General Awareness':      'General Knowledge',
  'International Relations':'General Knowledge',
  'Current Affairs':        'General Knowledge',
  'Indian Constitution':    'General Knowledge',
  // Fallback for anything unmapped
};

function mapCategory(csvCategory) {
  return CATEGORY_MAP[csvCategory] || 'General Knowledge';
}

function mapDifficulty(d) {
  if (!d) return 'Medium';
  const v = d.trim();
  if (v === 'Easy') return 'Easy';
  if (v === 'Hard') return 'Hard';
  return 'Medium';
}

function mapXP(difficulty) {
  if (difficulty === 'Easy') return 5;
  if (difficulty === 'Hard') return 20;
  return 10;
}

// ── Parse a quoted CSV line correctly ─────────────────────────
// Handles commas inside quoted fields and escaped quotes ("")
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
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

// ── Simple deterministic shuffle (seeded by position) ─────────
function deterministicShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ══════════════════════════════════════════════════════════════
// IMPORT 1: forge-mcq.csv
// Pre-built MCQ questions with 4 options already in CSV.
// Uses ID prefix MCQ (numbered from MCQ0001 continuing past
// existing MCQ0114 in DB to avoid collision).
// ══════════════════════════════════════════════════════════════
async function importMCQ() {
  console.log('\n── IMPORT 1: forge-mcq.csv ──────────────────────────────');
  const raw  = fs.readFileSync(path.join('scripts', 'forge-mcq.csv'), 'utf8');
  const { rows } = parseCSV(raw);

  // Remove the accidental duplicate header row (row 2 is a copy of row 1)
  const dataRows = rows.filter(r => r['Question'] !== 'Question');
  console.log(`Parsed ${dataRows.length} data rows`);

  // Get highest existing MCQ ID number to avoid collision
  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .like('id', 'MCQ%')
    .order('id', { ascending: false })
    .limit(1);
  const lastNum = existing?.[0]?.id
    ? parseInt(existing[0].id.replace('MCQ', ''), 10)
    : 0;
  console.log(`Last MCQ ID in DB: MCQ${String(lastNum).padStart(4,'0')}`);

  const questions = [];
  const skipped   = [];

  dataRows.forEach((r, idx) => {
    const q   = r['Question']?.trim();
    const a   = r['Option A']?.trim();
    const b   = r['Option B']?.trim();
    const c   = r['Option C']?.trim();
    const d   = r['Option D']?.trim();
    const ans = r['Correct Answer']?.trim();
    const exp = r['Explanation']?.trim();
    const dif = mapDifficulty(r['Difficulty']);
    const cat = mapCategory(r['Category']?.trim());

    if (!q || !a || !b || !c || !d || !ans) {
      skipped.push({ row: idx + 2, reason: 'missing required field' });
      return;
    }

    const options = [a, b, c, d];
    const correctIndex = options.indexOf(ans);
    if (correctIndex === -1) {
      skipped.push({ row: idx + 2, reason: `correct answer "${ans}" not in options` });
      return;
    }

    const num = lastNum + idx + 1;
    questions.push({
      id:            `MCQ${String(num).padStart(4, '0')}`,
      category:      cat,
      subcategory:   r['Category']?.trim() || null,
      difficulty:    dif,
      question_type: 'MCQ',
      question:      q,
      prompt:        null,
      answer_data:   { options, correctIndex, explanation: exp || `Correct: ${ans}` },
      xp_reward:     mapXP(dif),
      time_limit:    null,
      tags:          [r['Category']?.trim()].filter(Boolean),
      source:        'MCQ Bank v2',
      active:        true,
    });
  });

  console.log(`Ready to import: ${questions.length} | Skipped: ${skipped.length}`);
  if (skipped.length) skipped.forEach(s => console.log(`  SKIP row ${s.row}: ${s.reason}`));

  return upsertBatch(questions, 'MCQ Bank v2');
}

// ══════════════════════════════════════════════════════════════
// IMPORT 2: forge-objective.csv
// Q&A format (question + text answer). We build MCQ options
// using real answers from other rows as distractors — same
// approach as the original import-master-content.js but with
// correct ID sequencing starting after existing OBJ0143.
// ══════════════════════════════════════════════════════════════
async function importObjective() {
  console.log('\n── IMPORT 2: forge-objective.csv ────────────────────────');
  const raw  = fs.readFileSync(path.join('scripts', 'forge-objective.csv'), 'utf8');
  const { rows } = parseCSV(raw);
  const dataRows = rows.filter(r => r['question'] && r['question'] !== 'question');
  console.log(`Parsed ${dataRows.length} data rows`);

  // Get highest existing OBJ ID to avoid collision
  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .like('id', 'OBJ%')
    .order('id', { ascending: false })
    .limit(1);
  const lastNum = existing?.[0]?.id
    ? parseInt(existing[0].id.replace('OBJ', ''), 10)
    : 0;
  console.log(`Last OBJ ID in DB: OBJ${String(lastNum).padStart(4,'0')}`);

  const questions = [];
  const skipped   = [];

  dataRows.forEach((r, idx) => {
    const q      = r['question']?.trim();
    const ans    = r['correct_answer']?.trim();
    const dif    = mapDifficulty(r['difficulty']);
    const catCsv = r['category']?.trim();
    const cat    = mapCategory(catCsv);

    if (!q || !ans) {
      skipped.push({ row: idx + 2, reason: 'missing question or answer' });
      return;
    }

    // Build distractor pool from same category first, then global
    const sameCat = dataRows
      .filter((x, i) => i !== idx && x['category']?.trim() === catCsv)
      .map(x => x['correct_answer']?.trim())
      .filter(x => x && x !== ans);
    const anyCat  = dataRows
      .filter((_, i) => i !== idx)
      .map(x => x['correct_answer']?.trim())
      .filter(x => x && x !== ans);
    const pool    = [...new Set([...sameCat, ...anyCat])];

    if (pool.length < 3) {
      skipped.push({ row: idx + 2, reason: `only ${pool.length} distractors` });
      return;
    }

    // Deterministic shuffle — same run always produces same question IDs
    const shuffled     = deterministicShuffle(pool, idx * 31337);
    const distractors  = shuffled.slice(0, 3);
    const allOptions   = deterministicShuffle([ans, ...distractors], idx * 99991);
    const correctIndex = allOptions.indexOf(ans);

    const num = lastNum + idx + 1;
    questions.push({
      id:            `OBJ${String(num).padStart(4, '0')}`,
      category:      cat,
      subcategory:   catCsv || null,
      difficulty:    dif,
      question_type: 'MCQ',
      question:      q,
      prompt:        null,
      answer_data:   { options: allOptions, correctIndex, explanation: `Correct: ${ans}` },
      xp_reward:     mapXP(dif),
      time_limit:    null,
      tags:          [catCsv].filter(Boolean),
      source:        'Objective Bank v2',
      active:        true,
    });
  });

  console.log(`Ready to import: ${questions.length} | Skipped: ${skipped.length}`);
  if (skipped.length) skipped.forEach(s => console.log(`  SKIP row ${s.row}: ${s.reason}`));

  return upsertBatch(questions, 'Objective Bank v2');
}

// ── Batch upsert helper ────────────────────────────────────────
async function upsertBatch(questions, source) {
  const BATCH = 50;
  let imported = 0, failed = 0;
  for (let i = 0; i < questions.length; i += BATCH) {
    const batch = questions.slice(i, i + BATCH);
    const { error } = await supabase
      .from('questions')
      .upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i/BATCH)+1} failed: ${error.message}`);
      failed += batch.length;
    } else {
      imported += batch.length;
      process.stdout.write(`  ✅ ${imported}/${questions.length} imported\r`);
    }
  }
  console.log(`\n  ${source}: ${imported} imported, ${failed} failed`);
  return { imported, failed };
}

// ── Post-import verification ───────────────────────────────────
async function verify() {
  console.log('\n── VERIFICATION ─────────────────────────────────────────');
  const { data } = await supabase
    .from('questions')
    .select('question_type, source, difficulty')
    .eq('active', true);

  const byType = {}, bySource = {}, byDiff = {};
  (data || []).forEach(q => {
    byType[q.question_type]   = (byType[q.question_type] || 0) + 1;
    bySource[q.source || '?'] = (bySource[q.source || '?'] || 0) + 1;
    byDiff[q.difficulty]      = (byDiff[q.difficulty] || 0) + 1;
  });

  console.log('\nBy question_type:');
  Object.entries(byType).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('\nBy source:');
  Object.entries(bySource).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('\nBy difficulty:');
  Object.entries(byDiff).sort().forEach(([k,v]) => console.log(`  ${k}: ${v}`));
  console.log('\nTotal active:', data?.length);

  // Verify Session 1 pool
  const { data: s1 } = await supabase.rpc('get_session_questions', {
    p_question_types: ['MCQ'],
    p_count: 10,
    p_category: 'SSB Fundamentals',
  });
  console.log(`\nSession 1 pull (10 MCQ / SSB Fundamentals): ${s1?.length} returned`);
  if ((s1?.length || 0) < 10) console.log('  ⚠️  Fewer than 10 questions — Session 1 may not load correctly');

  // Verify Session 2 types
  for (const type of ['MCQ', 'SingleWord', 'Numeric', 'TrueFalse', 'RapidResponse']) {
    const { data: pool } = await supabase.rpc('get_session_questions', {
      p_question_types: [type], p_count: 10,
    });
    console.log(`  Session 2 pool (${type}): ${pool?.length} available`);
  }
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('THE FORGE — Question Bank Import');
  console.log('═══════════════════════════════════════════════════');

  const r1 = await importMCQ();
  const r2 = await importObjective();

  const total = (r1?.imported || 0) + (r2?.imported || 0);
  const totalFailed = (r1?.failed || 0) + (r2?.failed || 0);
  console.log(`\n══ TOTAL: ${total} imported, ${totalFailed} failed ══`);

  await verify();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('EXPECTED COUNTS AFTER IMPORT:');
  console.log('  forge-mcq.csv:       ~65 new MCQ rows');
  console.log('  forge-objective.csv: ~155 new MCQ rows (some may skip)');
  console.log('  Pre-existing MCQ:    114');
  console.log('  Expected MCQ total:  ~334');
  console.log('  Session 1 pool:      ~334 MCQ / SSB Fundamentals = ~180 usable');
  console.log('  Session 2 pool:      same MCQ pool + existing SW/NUM/TF/RR');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
