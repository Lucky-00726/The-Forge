require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const ids = [
    'MCQ0003','MCQ0070',          // near-dup
    'OBJ0098','OBJ0241',          // aircraft carrier question
    'OBJ0115','OBJ0258',          // rafale deal (dup + outdated)
    'MCQ0026',                    // INS Prahar fastest missile ship
    'OBJ0145',                    // motto of Indian Army
    'NLM-265',                    // women/NDA 2021 note
    'OBJ0069','OBJ0212',          // sample dup pair
    'MCQ0067',                    // Khilafat near-dup of MCQ0017
  ];
  const { data } = await sb.from('questions').select('*').in('id', ids);
  for (const q of (data||[])) {
    console.log(`\n=== [${q.id}] ${q.question_type} / ${q.category} ===`);
    console.log(`Q: ${q.question}`);
    if (q.answer_data?.options) {
      q.answer_data.options.forEach((o,i) => console.log(`  ${i===q.answer_data.correctIndex?'✓':' '} ${o}`));
    }
    if (q.answer_data?.correctAnswer !== undefined) console.log(`  Answer: ${q.answer_data.correctAnswer}`);
    console.log(`  Exp: ${JSON.stringify(q.answer_data?.explanation||'').substring(0,150)}`);
    console.log(`  Source: ${q.source}`);
  }

  // Also get WAT count explicitly
  const { count: watCount } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('question_type','WAT').eq('active',true);
  console.log(`\nWAT count: ${watCount}`);

  // Get all OIR IDs for SQL
  const { data: oirData } = await sb.from('questions').select('id').like('id','OIR%').eq('active',true);
  const oirIds = (oirData||[]).map(x => x.id);
  console.log(`\nOIR IDs (${oirIds.length}): ${oirIds.join(', ')}`);

  // Get duplicate OBJ IDs to deactivate (OBJ0212-0286)
  const { data: dupObjs } = await sb.from('questions').select('id').gte('id','OBJ0212').lte('id','OBJ0286').eq('active',true);
  console.log(`\nDuplicate OBJ range OBJ0212-0286 active count: ${(dupObjs||[]).length}`);

  // Verify Indian Army motto
  const { data: motto } = await sb.from('questions').select('id,question,answer_data').eq('id','OBJ0145');
  if (motto?.[0]) console.log(`\nMotto Q: ${motto[0].question}\nExp: ${JSON.stringify(motto[0].answer_data)}`);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
