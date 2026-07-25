require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});
async function main() {
  const { data, error } = await sb.from('missions').select('id,title,category,mission_type,week_number,unlock_day,xp_reward').order('week_number').order('unlock_day').order('category');
  if (error) { console.error(error.message); process.exit(1); }
  console.log('Total missions:', data?.length || 0);
  data?.forEach(m => console.log(`  W${m.week_number}D${m.unlock_day} | ${m.id} | ${m.category} | ${m.mission_type} | ${m.xp_reward}XP | ${m.title?.substring(0,50)}`));
  // Also check duplicate MCQ IDs in S1 pool
  const { data: dups, error: e2 } = await sb.from('questions').select('id,question').eq('question_type','MCQ').eq('category','SSB Fundamentals').eq('active',true).order('id');
  console.log('\nS1 MCQ pool size:', dups?.length || 0);
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
