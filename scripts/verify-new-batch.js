require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});
async function main() {
  // Count by type with no row limit using count aggregate
  const types = ['MCQ','SingleWord','Numeric','TrueFalse','RapidResponse','SRT','WAT','Interview'];
  console.log('=== ACCURATE ACTIVE COUNTS (no row limit) ===');
  let total = 0;
  for (const t of types) {
    const { count } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('active',true).eq('question_type',t);
    console.log(`  ${t}: ${count}`);
    total += count;
  }
  // OIR and OBJ dup counts
  const { count: oirCount } = await sb.from('questions').select('*',{count:'exact',head:true}).like('id','OIR%').eq('active',true);
  const { count: dupObjCount } = await sb.from('questions').select('*',{count:'exact',head:true}).gte('id','OBJ0212').lte('id','OBJ0286').eq('active',true);
  const { count: mcq70 } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('id','MCQ0070').eq('active',true);
  console.log(`  TOTAL: ${total}`);
  console.log(`\n=== CLEANUP SQL STATUS ===`);
  console.log(`  OIR rows still active: ${oirCount} (should be 0 after CRITICAL-2)`);
  console.log(`  OBJ0212-0286 still active: ${dupObjCount} (should be 0 after CRITICAL-1)`);
  console.log(`  MCQ0070 still active: ${mcq70} (should be 0 after CRITICAL-3)`);
  // NLM-301+ confirm
  const { count: newBatch } = await sb.from('questions').select('*',{count:'exact',head:true}).gte('id','NLM-301').eq('active',true);
  console.log(`\n  NLM-301+ rows active: ${newBatch} (should be 53)`);
  // S2 play days after cleanup would be
  console.log('\n=== S2 PLAY-DAYS AFTER APPLYING CRITICAL SQL ===');
  const quotas = {MCQ:6,SingleWord:3,Numeric:2,TrueFalse:2,RapidResponse:2};
  const { count: mcqC } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('active',true).eq('question_type','MCQ');
  const { count: swC } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('active',true).eq('question_type','SingleWord');
  const { count: numC } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('active',true).eq('question_type','Numeric');
  const { count: tfC } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('active',true).eq('question_type','TrueFalse');
  const { count: rrC } = await sb.from('questions').select('*',{count:'exact',head:true}).eq('active',true).eq('question_type','RapidResponse');
  // Subtract dups that will be removed
  const effMCQ = mcqC - (mcq70||0);
  console.log(`  MCQ: ${effMCQ} → ${Math.floor(effMCQ/6)} days`);
  console.log(`  SingleWord: ${swC} → ${Math.floor(swC/3)} days`);
  console.log(`  Numeric: ${numC} → ${Math.floor(numC/2)} days`);
  console.log(`  TrueFalse: ${tfC} → ${Math.floor(tfC/2)} days`);
  console.log(`  RapidResponse: ${rrC} → ${Math.floor(rrC/2)} days`);
  process.exit(0);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
