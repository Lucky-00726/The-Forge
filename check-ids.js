require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const ids = ["SRT-lutbt4","SRT-osd1ho","SRT-r96olz","SRT-bq6d4v","WAT0001","WAT0002","WAT0003","SD001","SD002","SD003"];
  console.log('Querying IDs:', ids);
  
  const { data, error } = await sb.from('questions').select('*').in('id', ids);
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log(`Found ${data.length} out of ${ids.length} questions.`);
  data.forEach(q => {
    console.log(`ID: ${q.id}, active: ${q.active}, status: ${q.status}, session: ${q.session}, module: ${q.module}, question_type: ${q.question_type}`);
  });
}

main().catch(console.error);
