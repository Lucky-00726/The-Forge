// Quick local validation — no DB connection needed
// Run: node scripts/validate-nlm-csvs.js
const fs = require('fs');
const path = require('path');

const VALID_CATEGORIES = new Set([
  'SSB Fundamentals','OLQs','Psychological Tests','GTO Tasks',
  'Interview Prep','Leadership','Decision Making','Communication','General Knowledge',
]);
const VALID_DIFFICULTIES = new Set(['Easy','Medium','Hard']);
const VALID_TYPES = new Set(['MCQ','SingleWord','Numeric','RapidResponse','TrueFalse','SRT','WAT','Interview']);

const FILES = [
  'session2_singleword.csv',
  'session2_numeric.csv',
  'session2_truefalse.csv',
  'session2_rapidresponse.csv',
  'session2_mcq.csv',
];

function parseCSVLine(line) {
  const result = []; let cur = ''; let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

let grandTotal = 0, grandErrors = 0;
const allIds = new Set();
const duplicates = [];

FILES.forEach(file => {
  const filePath = path.join('scripts', file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  let rowErrors = 0;
  const rowCount = lines.length - 1;

  for (let i = 1; i <= rowCount; i++) {
    const vals = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] || '').trim(); });

    const errs = [];

    // Duplicate ID check
    if (allIds.has(row.id)) duplicates.push(row.id);
    else allIds.add(row.id);

    // Required fields
    if (!row.id) errs.push('missing id');
    if (!row.question) errs.push('missing question');
    if (!VALID_CATEGORIES.has(row.category)) errs.push(`bad category: "${row.category}"`);
    if (!VALID_DIFFICULTIES.has(row.difficulty)) errs.push(`bad difficulty: "${row.difficulty}"`);
    if (!VALID_TYPES.has(row.question_type)) errs.push(`bad type: "${row.question_type}"`);

    // JSON parse
    let ad = {};
    try { ad = JSON.parse(row.answer_data); }
    catch (e) { errs.push(`JSON error: ${e.message}`); }

    // answer_data shape
    if (errs.length === 0) {
      const t = row.question_type;
      if (t === 'MCQ' || t === 'RapidResponse') {
        if (!Array.isArray(ad.options)) errs.push('missing options array');
        if (typeof ad.correctIndex !== 'number') errs.push('missing correctIndex');
      } else if (t === 'SingleWord') {
        if (!ad.correctAnswer) errs.push('missing correctAnswer');
      } else if (t === 'Numeric') {
        if (typeof ad.correctAnswer !== 'number') errs.push('correctAnswer must be number');
      } else if (t === 'TrueFalse') {
        if (typeof ad.correctAnswer !== 'boolean') errs.push('correctAnswer must be boolean');
      }
    }

    if (errs.length > 0) {
      console.log(`  ❌ ${file} row ${i + 1} [${row.id || 'no-id'}]: ${errs.join(' | ')}`);
      rowErrors++;
    }
  }

  const icon = rowErrors === 0 ? '✅' : '❌';
  console.log(`${icon} ${file}: ${rowCount} rows, ${rowErrors} errors`);
  grandTotal += rowCount;
  grandErrors += rowErrors;
});

console.log(`\nTotal: ${grandTotal} rows | ${grandErrors} errors | ${duplicates.length} duplicate IDs`);
if (duplicates.length) console.log('Duplicate IDs:', duplicates);
console.log(grandErrors === 0 ? '\n✅ All CSVs are valid — ready to import' : '\n❌ Fix errors before importing');
