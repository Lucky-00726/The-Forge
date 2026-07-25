require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await sb
    .from('questions')
    .select('*')
    .eq('active', true)
    .order('id');

  if (error) { console.error(error.message); process.exit(1); }

  // Summary by type/source/category
  const byType = {}, bySource = {}, byCat = {};
  for (const q of data) {
    byType[q.question_type] = (byType[q.question_type] || 0) + 1;
    bySource[q.source || 'null'] = (bySource[q.source || 'null'] || 0) + 1;
    byCat[q.category] = (byCat[q.category] || 0) + 1;
  }

  console.log('=== TOTAL ACTIVE:', data.length, '===');
  console.log('\n--- BY TYPE ---');
  for (const [k,v] of Object.entries(byType).sort()) console.log(` ${k}: ${v}`);
  console.log('\n--- BY SOURCE ---');
  for (const [k,v] of Object.entries(bySource).sort()) console.log(` ${k}: ${v}`);
  console.log('\n--- BY CATEGORY ---');
  for (const [k,v] of Object.entries(byCat).sort()) console.log(` ${k}: ${v}`);

  // Session 2 playdays
  const S2_QUOTA = { MCQ:6, SingleWord:3, Numeric:2, TrueFalse:2, RapidResponse:2 };
  console.log('\n--- SESSION 2 POOL ---');
  for (const [type, quota] of Object.entries(S2_QUOTA)) {
    const count = byType[type] || 0;
    console.log(` ${type}: ${count} available / quota ${quota} => ~${Math.floor(count/quota)} unique days`);
  }

  // Session 1 (MCQ only, all categories)
  const s1pool = data.filter(q => q.question_type === 'MCQ').length;
  console.log(`\n--- SESSION 1 POOL ---`);
  console.log(` MCQ total: ${s1pool} => ~${Math.floor(s1pool/10)} unique days (10/session)`);

  // Session 3
  const s3types = ['SRT','WAT','Interview'];
  console.log(`\n--- SESSION 3 POOL ---`);
  let s3min = Infinity;
  for (const t of s3types) {
    const count = byType[t] || 0;
    const days = Math.floor(count/10);
    console.log(` ${t}: ${count} => ~${days} unique days (10/session)`);
    if (days < s3min) s3min = days;
  }
  console.log(` Bottleneck type limits S3 to ~${s3min} days`);

  // Duplicate detection: exact question text
  console.log('\n\n=== DUPLICATE ANALYSIS ===');
  const seen = new Map();
  const exactDups = [];
  for (const q of data) {
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) {
      exactDups.push({ a: seen.get(key), b: q.id, question: q.question.substring(0,80) });
    } else {
      seen.set(key, q.id);
    }
  }
  console.log(`Exact duplicates: ${exactDups.length}`);
  for (const d of exactDups) console.log(` DUP: ${d.a} vs ${d.b} — "${d.question}"`);

  // Near-duplicate: first 60 chars
  const seen60 = new Map();
  const nearDups = [];
  for (const q of data) {
    const key = q.question.trim().toLowerCase().substring(0,60);
    if (seen60.has(key)) {
      const prev = seen60.get(key);
      if (!exactDups.find(d => (d.a===prev.id && d.b===q.id)||(d.a===q.id && d.b===prev.id))) {
        nearDups.push({ a: prev.id, b: q.id, snippet: key });
      }
    } else {
      seen60.set(key, q);
    }
  }
  console.log(`Near-duplicates (first 60 chars match): ${nearDups.length}`);
  for (const d of nearDups) console.log(` NEAR: ${d.a} vs ${d.b} — "${d.snippet}"`);

  // OIR rows (mistyped as Interview)
  console.log('\n=== OIR/TAT/STUB ISSUES ===');
  const oirRows = data.filter(q => q.id.startsWith('OIR'));
  const tatStubs = data.filter(q => q.id.startsWith('TAT') && q.question.startsWith('TAT Picture Theme'));
  const tatSample = data.filter(q => q.id.startsWith('TAT') && q.question.startsWith('Sample Story'));
  console.log(`OIR rows (Interview-typed reasoning Qs, ungraded): ${oirRows.length}`);
  oirRows.forEach(q => console.log(`  ${q.id}: "${q.question.substring(0,70)}"`));
  console.log(`TAT stub rows (unusable): ${tatStubs.length + tatSample.length}`);
  [...tatStubs,...tatSample].forEach(q => console.log(`  ${q.id}: "${q.question}"`));

  // MCQ answer_data integrity — check correctIndex in bounds
  console.log('\n=== MCQ ANSWER INTEGRITY ===');
  const mcqBroken = [];
  for (const q of data) {
    if ((q.question_type === 'MCQ' || q.question_type === 'RapidResponse') && q.answer_data) {
      const ad = q.answer_data;
      if (!Array.isArray(ad.options) || typeof ad.correctIndex !== 'number') {
        mcqBroken.push({ id: q.id, reason: 'missing options or correctIndex' });
      } else if (ad.correctIndex < 0 || ad.correctIndex >= ad.options.length) {
        mcqBroken.push({ id: q.id, reason: `correctIndex ${ad.correctIndex} out of range (${ad.options.length} options)` });
      } else if (!ad.options[ad.correctIndex] || ad.options[ad.correctIndex].trim() === '') {
        mcqBroken.push({ id: q.id, reason: 'correct answer option is empty' });
      }
    }
    if (q.question_type === 'TrueFalse' && q.answer_data) {
      if (typeof q.answer_data.correctAnswer !== 'boolean') {
        mcqBroken.push({ id: q.id, reason: `TrueFalse correctAnswer is ${typeof q.answer_data.correctAnswer}` });
      }
    }
    if (q.question_type === 'Numeric' && q.answer_data) {
      if (typeof q.answer_data.correctAnswer !== 'number') {
        mcqBroken.push({ id: q.id, reason: `Numeric correctAnswer is ${typeof q.answer_data.correctAnswer}` });
      }
    }
    if (q.question_type === 'SingleWord' && q.answer_data) {
      if (!q.answer_data.correctAnswer) {
        mcqBroken.push({ id: q.id, reason: 'SingleWord missing correctAnswer' });
      }
    }
  }
  console.log(`Answer data integrity failures: ${mcqBroken.length}`);
  mcqBroken.forEach(x => console.log(`  ${x.id}: ${x.reason}`));

  // MCQ with weak distractors (duplicate options)
  console.log('\n=== WEAK DISTRACTOR CHECK ===');
  const weakDist = [];
  for (const q of data) {
    if ((q.question_type === 'MCQ' || q.question_type === 'RapidResponse') && q.answer_data?.options) {
      const opts = q.answer_data.options.map(o => o.trim().toLowerCase());
      const unique = new Set(opts);
      if (unique.size < opts.length) {
        weakDist.push({ id: q.id, options: q.answer_data.options });
      }
      // Check for empty options
      if (opts.some(o => o === '')) {
        weakDist.push({ id: q.id, options: q.answer_data.options, reason: 'empty option' });
      }
    }
  }
  console.log(`MCQ with duplicate/empty options: ${weakDist.length}`);
  weakDist.forEach(x => console.log(`  ${x.id}: ${JSON.stringify(x.options)}`));

  // Category mismatch — MCQ0001-MCQ0023 in SSB Fundamentals but non-SSB content
  console.log('\n=== CATEGORY MISMATCH SAMPLES ===');
  const catMismatch = [];
  for (const q of data) {
    if (q.question_type === 'MCQ' && q.category === 'SSB Fundamentals') {
      const text = q.question.toLowerCase();
      if (text.includes('panipat') || text.includes('haldighati') || text.includes('mughal') ||
          text.includes('akbar') || text.includes('babur') || text.includes('1526') ||
          text.includes('khilafat') || text.includes('1857') || text.includes('ain-i-akbari')) {
        catMismatch.push({ id: q.id, question: q.question.substring(0,70), category: q.category });
      }
    }
  }
  console.log(`MCQ in SSB Fundamentals with clear historical/non-SSB content: ${catMismatch.length}`);
  catMismatch.forEach(x => console.log(`  ${x.id}: "${x.question}"`));

  // Questions with no explanation
  console.log('\n=== MISSING EXPLANATIONS ===');
  const noExp = data.filter(q =>
    (q.question_type === 'MCQ' || q.question_type === 'TrueFalse' || q.question_type === 'SingleWord' || q.question_type === 'Numeric') &&
    (!q.answer_data?.explanation || q.answer_data.explanation.trim() === '' || q.answer_data.explanation.startsWith('Correct:'))
  );
  console.log(`Questions with missing/stub explanation: ${noExp.length}`);
  noExp.slice(0,20).forEach(q => console.log(`  ${q.id} [${q.question_type}]: "${(q.answer_data?.explanation||'').substring(0,50)}"`));
  if (noExp.length > 20) console.log(`  ... and ${noExp.length-20} more`);

  // Full data dump for manual review
  console.log('\n\n=== FULL MCQ DUMP FOR MANUAL REVIEW ===');
  const mcqs = data.filter(q => q.question_type === 'MCQ').slice(0,30);
  for (const q of mcqs) {
    console.log(`\n[${q.id}] ${q.question}`);
    if (q.answer_data?.options) {
      q.answer_data.options.forEach((o,i) => {
        console.log(`  ${i===q.answer_data.correctIndex?'✓':' '} ${i}: ${o}`);
      });
    }
    console.log(`  Explanation: ${(q.answer_data?.explanation||'').substring(0,100)}`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
