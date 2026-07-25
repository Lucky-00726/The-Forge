require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const { data, error } = await sb.from('questions').select('id,module,question_type,active,status').eq('session', 'Session3').eq('module', 'SRT').limit(20);
  if (error) {
    console.error(error.message);
    return;
  }
  console.log('Sample SRT questions in database:');
  data.forEach(q => {
    console.log(`  ID: ${q.id}, active: ${q.active}, status: ${q.status}, module: ${q.module}, qtype: ${q.question_type}`);
  });
}

main().catch(console.error);
