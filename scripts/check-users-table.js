// Checks public.users table for all rows — verifies the row exists,
// shows total_xp, current_rank, current_streak, created_at.
// Run: node scripts/check-users-table.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('=== public.users rows ===');
  const { data, error } = await sb
    .from('users')
    .select('id, display_name, total_xp, current_rank, current_streak, last_active_date, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('NO ROWS FOUND in public.users');
    process.exit(0);
  }

  data.forEach((u, i) => {
    console.log(`\n[User ${i + 1}]`);
    console.log('  id              :', u.id);
    console.log('  display_name    :', u.display_name);
    console.log('  total_xp        :', u.total_xp);
    console.log('  current_rank    :', u.current_rank);
    console.log('  current_streak  :', u.current_streak);
    console.log('  last_active_date:', u.last_active_date);
    console.log('  created_at      :', u.created_at);
  });

  console.log('\n=== user_daily_sessions rows (most recent 20) ===');
  const { data: sessions, error: sErr } = await sb
    .from('user_daily_sessions')
    .select('user_id, session_date, session_number, completed_at, xp_earned, score, total_questions, started_at')
    .order('started_at', { ascending: false })
    .limit(20);

  if (sErr) {
    console.error('ERROR fetching sessions:', sErr.message);
  } else if (!sessions || sessions.length === 0) {
    console.log('NO ROWS in user_daily_sessions');
  } else {
    sessions.forEach((s, i) => {
      console.log(`\n[Session ${i + 1}]`);
      console.log('  user_id       :', s.user_id);
      console.log('  session_date  :', s.session_date);
      console.log('  session_number:', s.session_number);
      console.log('  completed_at  :', s.completed_at ?? 'NULL — not completed');
      console.log('  xp_earned     :', s.xp_earned);
      console.log('  score         :', s.score, '/', s.total_questions);
      console.log('  started_at    :', s.started_at);
    });
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
