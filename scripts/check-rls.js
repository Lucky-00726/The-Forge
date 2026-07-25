require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const url  = process.env.EXPO_PUBLIC_SUPABASE_URL;
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  const admin = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });

  // 1. Pull all users rows with service role (bypasses RLS)
  const { data: allUsers, error: userErr } = await admin
    .from('users')
    .select('id, display_name, total_xp, current_rank, current_streak, created_at')
    .limit(10);

  console.log('\n=== SERVICE ROLE SELECT FROM users ===');
  if (userErr) {
    console.log('FAILED:', userErr.message);
    process.exit(1);
  }
  console.log(`Rows returned: ${allUsers?.length ?? 0}`);
  allUsers?.forEach(u => {
    console.log(`  id=${u.id} | xp=${u.total_xp} | rank=${u.current_rank} | streak=${u.current_streak} | display_name="${u.display_name}" | created_at=${u.created_at}`);
  });

  if (!allUsers?.length) {
    console.log('\nNO ROWS IN public.users — fetchProfile will always return no data.');
    process.exit(0);
  }

  const testUserId = allUsers[0].id;
  console.log('\nTest user:', testUserId);

  // 2. Test SELECT with anon key (no session = unauthenticated)
  const anonClient = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: anonData, error: anonErr } = await anonClient
    .from('users')
    .select('id, total_xp')
    .eq('id', testUserId)
    .single();

  console.log('\n=== ANON (unauthenticated) SELECT FROM users ===');
  if (anonErr) {
    console.log('BLOCKED:', anonErr.code, anonErr.message);
    console.log('→ RLS is enforced. Unauthenticated reads rejected. Expected behaviour.');
  } else {
    console.log('SUCCESS — anon can read rows without a session!');
    console.log('Data:', JSON.stringify(anonData));
    console.log('→ WARNING: RLS may be disabled or has a public SELECT policy.');
  }

  // 3. Anon key info
  console.log('\n=== ANON KEY JWT CLAIMS ===');
  try {
    const payload = JSON.parse(Buffer.from(anon.split('.')[1], 'base64').toString());
    console.log('role:', payload.role, '| ref:', payload.ref, '| iss:', payload.iss);
  } catch(e) { console.log('Could not parse anon key:', e.message); }

  // 4. Service role key info
  console.log('\n=== SERVICE ROLE KEY JWT CLAIMS ===');
  try {
    const payload = JSON.parse(Buffer.from(svc.split('.')[1], 'base64').toString());
    console.log('role:', payload.role, '| ref:', payload.ref);
  } catch(e) { console.log('Could not parse svc key:', e.message); }

  // 5. URL project ref
  const ref = url?.match(/https:\/\/([^.]+)\./)?.[1] ?? 'unknown';
  console.log('\n=== URL PROJECT REF ===');
  console.log(ref, '(expected: xpfpvfnxvoxjosnvowub)');
  console.log('Match:', ref === 'xpfpvfnxvoxjosnvowub');

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
