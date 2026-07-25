// Validate NLM-301 batch CSVs before import
const fs = require('fs'), path = require('path');

const VALID_CATEGORIES = new Set(['SSB Fundamentals','OLQs','Psychological Tests','GTO Tasks','Interview Prep','Leadership','Decision Making','Communication','General Knowledge']);
const VALID_DIFFICULTIES = new Set(['Easy','Medium','Hard']);
const VALID_TYPES = new Set(['MCQ','SingleWord','Numeric','RapidResponse','TrueFalse','SRT','WAT','Interview']);

const FILES = [
  'session2_rapidresponse_2.csv',
  'session2_singleword_2.csv',
  'session2_truefalse_2.csv',
  'session2_numeric_2.csv',
];

function parseCSVLine(line) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i+1]==='"') { cur+='"'; i++; } else inQ=!inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur=''; }
    else cur += ch;
  }
  result.push(cur); return result;
}

let grandTotal=0, grandErrors=0;
const allIds = new Set();

FILES.forEach(file => {
  const raw = fs.readFileSync(path.join('scripts', file), 'utf8');
  const lines = raw.split('\n').filter(l=>l.trim());
  const headers = parseCSVLine(lines[0]).map(h=>h.trim());
  let rowErrors=0;

  for (let i=1; i<lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const row = {}; headers.forEach((h,idx)=>{ row[h]=(vals[idx]||'').trim(); });
    const errs = [];

    if (allIds.has(row.id)) errs.push('DUPLICATE ID: '+row.id);
    else allIds.add(row.id);

    if (!row.id) errs.push('missing id');
    if (!row.question) errs.push('missing question');
    if (!VALID_CATEGORIES.has(row.category)) errs.push(`bad category: "${row.category}"`);
    if (!VALID_DIFFICULTIES.has(row.difficulty)) errs.push(`bad difficulty: "${row.difficulty}"`);
    if (!VALID_TYPES.has(row.question_type)) errs.push(`bad type: "${row.question_type}"`);

    let ad = {};
    try { ad = JSON.parse(row.answer_data); }
    catch(e) { errs.push(`JSON error: ${e.message}`); }

    if (errs.length === 0) {
      const t = row.question_type;
      if (t==='MCQ'||t==='RapidResponse') {
        if (!Array.isArray(ad.options)||ad.options.length<2) errs.push('missing options');
        if (typeof ad.correctIndex!=='number') errs.push('missing correctIndex');
        if (!ad.explanation) errs.push('missing explanation');
      } else if (t==='SingleWord') {
        if (!ad.correctAnswer) errs.push('missing correctAnswer');
        if (!ad.explanation) errs.push('missing explanation');
      } else if (t==='Numeric') {
        if (typeof ad.correctAnswer!=='number') errs.push('correctAnswer must be number');
        if (typeof ad.tolerance!=='number') errs.push('missing tolerance');
        if (!ad.unit) errs.push('missing unit');
        if (!ad.explanation) errs.push('missing explanation');
      } else if (t==='TrueFalse') {
        if (typeof ad.correctAnswer!=='boolean') errs.push('correctAnswer must be boolean');
        if (!ad.explanation) errs.push('missing explanation');
      }
    }

    if (errs.length>0) {
      console.log(`  ❌ ${file} row ${i+1} [${row.id||'no-id'}]: ${errs.join(' | ')}`);
      rowErrors++;
    }
  }

  const icon = rowErrors===0 ? '✅' : '❌';
  console.log(`${icon} ${file}: ${lines.length-1} rows, ${rowErrors} errors`);
  grandTotal += lines.length-1;
  grandErrors += rowErrors;
});

console.log(`\nTotal: ${grandTotal} rows | ${grandErrors} errors | ${allIds.size} unique IDs`);
console.log(grandErrors===0 ? '\n✅ All valid — ready to import' : '\n❌ Fix errors before importing');
