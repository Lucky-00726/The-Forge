require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await sb.from('questions').select('*').eq('active', true).order('id');
  if (error) { console.error(error.message); process.exit(1); }

  // 1. Count exact duplicates
  const seen = new Map();
  const exactDups = [];
  for (const q of data) {
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) exactDups.push({ keep: seen.get(key).id, drop: q.id, src_keep: seen.get(key).source, src_drop: q.source });
    else seen.set(key, q);
  }
  console.log(`=== EXACT DUPLICATES: ${exactDups.length} ===`);
  console.log('Pattern: OBJ0069-0143 duplicated as OBJ0212-0286 (import ran twice)');

  // 2. Near-dups in detail
  const seen60 = new Map();
  const nearDups = [];
  for (const q of data) {
    const key = q.question.trim().toLowerCase().substring(0,60);
    if (seen60.has(key)) {
      nearDups.push({ a: seen60.get(key).id, b: q.id, aQ: seen60.get(key).question.substring(0,100), bQ: q.question.substring(0,100) });
    } else seen60.set(key, q);
  }
  console.log(`\n=== NEAR-DUPLICATES: ${nearDups.length} ===`);
  for (const d of nearDups) {
    console.log(`\n  A [${d.a}]: ${d.aQ}`);
    console.log(`  B [${d.b}]: ${d.bQ}`);
  }

  // 3. Check MCQ0002 vs MCQ0003 vs MCQ0070 (near-dup)
  const checkIds = ['MCQ0002','MCQ0003','MCQ0070'];
  console.log('\n=== NEAR-DUP DETAIL: MCQ0002/MCQ0003/MCQ0070 ===');
  for (const id of checkIds) {
    const q = data.find(x => x.id === id);
    if (q) console.log(`[${q.id}] ${q.question}\n  Answer: ${q.answer_data?.options?.[q.answer_data.correctIndex]}`);
  }

  // 4. Sources of OBJ0144-0286 (stub explanations)
  const stubExp = data.filter(q => q.answer_data?.explanation?.startsWith('Correct:'));
  console.log(`\n=== STUB EXPLANATIONS (Correct: prefix): ${stubExp.length} ===`);
  // Group by ID range
  const ids = stubExp.map(q => q.id).sort();
  console.log(`  Range: ${ids[0]} to ${ids[ids.length-1]}`);
  // Sample 5
  stubExp.slice(0,5).forEach(q => {
    console.log(`  [${q.id}] Q: "${q.question.substring(0,60)}" → Exp: "${q.answer_data.explanation}"`);
  });

  // 5. Outdated questions check
  console.log('\n=== OUTDATED / TIME-SENSITIVE CONTENT ===');
  const outdated = [];
  const timeKeywords = ['rafale deal', 'virat', 'ins vikrant', 'rafale', 'current', '2019', '2020', '2021', '2022', '2023'];
  for (const q of data) {
    const text = (q.question + JSON.stringify(q.answer_data)).toLowerCase();
    for (const kw of timeKeywords) {
      if (text.includes(kw)) {
        outdated.push({ id: q.id, type: q.question_type, snippet: q.question.substring(0,80), kw });
        break;
      }
    }
  }
  console.log(`Time-sensitive questions: ${outdated.length}`);
  outdated.forEach(x => console.log(`  [${x.id}/${x.type}] "${x.snippet}" (kw: ${x.kw})`));

  // 6. MCQ with only 2 meaningful distractors (one distractor is clearly wrong/filler)
  console.log('\n=== MCQ DISTRACTOR QUALITY CHECK ===');
  let weakCount = 0;
  for (const q of data) {
    if (q.question_type !== 'MCQ') continue;
    const opts = q.answer_data?.options || [];
    if (opts.length < 4) { weakCount++; console.log(`  [${q.id}] Only ${opts.length} options: ${JSON.stringify(opts)}`); }
  }
  console.log(`MCQ with fewer than 4 options: ${weakCount}`);

  // 7. Session play-day summary
  const byType = {};
  for (const q of data) byType[q.question_type] = (byType[q.question_type]||0)+1;

  const dupCount = exactDups.length;
  const effectiveMCQ = (byType['MCQ']||0) - dupCount; // removing dups
  console.log('\n=== PLAY-DAY ESTIMATES ===');
  console.log(`Total active: ${data.length}`);
  console.log(`Exact duplicates: ${dupCount} — effective MCQ after dedup: ${effectiveMCQ}`);
  console.log(`\nSession 1 (10 MCQ/session):`);
  console.log(`  Current: ~${Math.floor((byType['MCQ']||0)/10)} days`);
  console.log(`  After dedup: ~${Math.floor(effectiveMCQ/10)} days`);
  console.log(`\nSession 2 quotas (MCQ=6,SW=3,Num=2,TF=2,RR=2):`);
  const q2 = {MCQ:6,SingleWord:3,Numeric:2,TrueFalse:2,RapidResponse:2};
  let s2min = Infinity;
  for (const [t,quota] of Object.entries(q2)) {
    const avail = byType[t]||0;
    const days = Math.floor(avail/quota);
    if (days < s2min) s2min = days;
    console.log(`  ${t}: ${avail} avail / quota ${quota} = ${days} days`);
  }
  console.log(`  Bottleneck: RapidResponse (${byType['RapidResponse']||0} questions) → ${s2min} unique days`);
  console.log(`\nSession 3 (10 subjective/session):`);
  for (const t of ['SRT','WAT','Interview']) {
    const avail = byType[t]||0;
    console.log(`  ${t}: ${avail} => ${Math.floor(avail/10)} days`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
