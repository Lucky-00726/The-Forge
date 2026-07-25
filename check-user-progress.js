require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const userId = '1bd44f06-f1a6-431d-aa92-6def3910aee6';
  const { data, error } = await sb.from('user_content_progress').select('*').eq('user_id', userId);
  if (error) {
    console.error(error.message);
    return;
  }
  console.log(`Progress rows for user ${userId}:`);
  data.forEach(r => {
    console.log(`  Session: ${r.session_key}, Scope: ${r.scope}, Position: ${r.position}, Updated: ${r.updated_at}`);
  });
}

main().catch(console.error);
