require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data: sessions, error: uErr } = await sb.from('user_daily_sessions').select('*');
  if (uErr) {
    console.error('Error fetching daily sessions:', uErr.message);
    return;
  }

  console.log(`\n=== TOTAL USER DAILY SESSIONS: ${sessions.length} ===`);
  for (const session of sessions) {
    console.log(`ID: ${session.id}`);
    console.log(`  User: ${session.user_id}`);
    console.log(`  Date: ${session.session_date}`);
    console.log(`  Session Number: ${session.session_number}`);
    console.log(`  Question IDs (${session.question_ids ? session.question_ids.length : 0}): ${JSON.stringify(session.question_ids)}`);
    console.log(`  Completed At: ${session.completed_at}`);
    
    if (session.question_ids && session.question_ids.length > 0) {
      const { data: qs } = await sb.from('questions').select('id,module,question_type').in('id', session.question_ids);
      if (qs) {
        const counts = {};
        qs.forEach(q => {
          counts[q.module] = (counts[q.module] || 0) + 1;
        });
        console.log(`  Actual question modules in DB for this session:`, JSON.stringify(counts));
      }
    }
    console.log('------------------------------------------------');
  }
}

main().catch(console.error);
