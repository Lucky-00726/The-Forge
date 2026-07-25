require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
async function main() {
  const { data } = await sb.from('questions').select('id,question_type,tags').eq('active', true);
  const byType = {};
  for (const q of data) byType[q.question_type] = (byType[q.question_type]||0)+1;

  console.log('=== ACTIVE COUNTS BY TYPE ===');
  for (const [k,v] of Object.entries(byType).sort()) console.log(`  ${k}: ${v}`);
  console.log(`  TOTAL: ${data.length}`);

  // Session 3 WAT tag check — does fetchSession3Raw filter by tag?
  // It pulls WAT with p_count:3 via get_session_questions (no tag filter)
  // BUT Personal Interview uses: .contains('tags', ['Personal Interview'])
  const piTagged = data.filter(q => q.question_type==='Interview' && Array.isArray(q.tags) && q.tags.includes('Personal Interview'));
  const interviewAll = data.filter(q => q.question_type==='Interview');
  console.log(`\n=== SESSION 3 PI TAG CHECK ===`);
  console.log(`  Interview total active: ${interviewAll.length}`);
  console.log(`  Interview WITH 'Personal Interview' tag: ${piTagged.length}`);
  console.log(`  Interview WITHOUT tag (invisible to S3 loader): ${interviewAll.length - piTagged.length}`);

  // S2 play-day calculation
  const QUOTAS = {MCQ:6,SingleWord:3,Numeric:2,TrueFalse:2,RapidResponse:2};
  console.log('\n=== SESSION 2 PLAY-DAYS ===');
  let minDays = Infinity, bottleneck = '';
  for (const [t,q] of Object.entries(QUOTAS)) {
    const avail = byType[t]||0;
    const days = Math.floor(avail/q);
    if (days < minDays) { minDays=days; bottleneck=t; }
    console.log(`  ${t}: ${avail} / quota ${q} = ${days} days`);
  }
  console.log(`  Bottleneck: ${bottleneck} → ${minDays} unique days`);

  // S1 play-days
  const s1 = byType['MCQ']||0;
  console.log(`\n=== SESSION 1 PLAY-DAYS ===`);
  console.log(`  MCQ: ${s1} / 10 per session = ${Math.floor(s1/10)} days`);

  // S3 play-days
  console.log('\n=== SESSION 3 PLAY-DAYS ===');
  // Loader pulls: 4 SRT + 3 WAT + 3 PI-tagged Interview = 10
  const srt = byType['SRT']||0;
  const wat = byType['WAT']||0;
  const pi  = piTagged.length;
  const s3days = Math.min(Math.floor(srt/4), Math.floor(wat/3), Math.floor(pi/3));
  console.log(`  SRT: ${srt} / 4 per session = ${Math.floor(srt/4)} days`);
  console.log(`  WAT: ${wat} / 3 per session = ${Math.floor(wat/3)} days`);
  console.log(`  PI-tagged Interview: ${pi} / 3 per session = ${Math.floor(pi/3)} days`);
  console.log(`  S3 bottleneck: ${Math.min(Math.floor(srt/4),Math.floor(wat/3),Math.floor(pi/3))} days`);

  // Gaps to 14 days
  console.log('\n=== GAPS TO 14 UNIQUE DAYS ===');
  const need = (avail, quota, target=14) => Math.max(0, target*quota - avail);
  console.log(`  Session 1 - MCQ:          need ${need(s1,10)} more (have ${s1}, need ${14*10})`);
  console.log(`  Session 2 - RapidResponse: need ${need(byType['RapidResponse']||0,2)} more`);
  console.log(`  Session 2 - SingleWord:    need ${need(byType['SingleWord']||0,3)} more`);
  console.log(`  Session 2 - TrueFalse:     need ${need(byType['TrueFalse']||0,2)} more`);
  console.log(`  Session 2 - Numeric:       need ${need(byType['Numeric']||0,2)} more`);
  console.log(`  Session 3 - SRT:           need ${need(srt,4)} more`);
  console.log(`  Session 3 - WAT:           need ${need(wat,3)} more`);
  console.log(`  Session 3 - PI-tagged:     need ${need(pi,3)} more`);

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
