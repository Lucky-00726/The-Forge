require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Query information_schema via RPC or direct SQL if possible, or try fetching from common tables
  const tables = ['questions', 'import_staging_questions', 'user_daily_sessions', 'user_content_progress', 'profiles', 'users'];
  console.log('Checking existence of common tables:');
  
  for (const table of tables) {
    const { error } = await sb.from(table).select('count', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.log(`  Table "${table}": ❌ ERROR: ${error.message}`);
    } else {
      console.log(`  Table "${table}":  EXISTS`);
    }
  }
}

main().catch(console.error);
