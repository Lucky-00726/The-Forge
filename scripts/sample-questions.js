require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Fetch 200, shuffle in JS, take 50 — gives a true random sample
  const { data, error } = await sb
    .from('questions')
    .select('id,question,question_type,difficulty,answer_data,category')
    .eq('active', true)
    .limit(200);

  if (error) { console.error(error.message); process.exit(1); }

  // Fisher-Yates shuffle
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }

  const sample = data.slice(0, 50);
  console.log(JSON.stringify(sample, null, 2));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
