// Checks Supabase email confirmation setting by creating + immediately
// reading back a test user. If email_confirmed_at is auto-populated,
// confirmation is DISABLED (good for beta). If null, it is ENABLED.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !svc) { console.error('Missing env vars'); process.exit(1); }

const sb = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const testEmail = 'tmp-envcheck-' + Date.now() + '@noreply.invalid';

  // Create with email_confirm:false so we control it
  const { data, error } = await sb.auth.admin.createUser({
    email: testEmail,
    password: 'TempPass123!',
    email_confirm: false,
  });

  if (error) {
    console.error('Admin createUser failed:', error.message);
    process.exit(1);
  }

  const user = data.user;
  console.log('\n=== SUPABASE EMAIL CONFIRMATION CHECK ===');
  console.log('Test user email_confirmed_at:', user.email_confirmed_at || 'null (not confirmed)');

  // Now try to sign in WITHOUT confirming — if it succeeds, confirmation is off
  const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({
    email: testEmail,
    password: 'TempPass123!',
  });

  if (signInErr) {
    if (signInErr.message.toLowerCase().includes('email not confirmed')) {
      console.log('Sign-in result: FAILED — "Email not confirmed"');
      console.log('\n► Email confirmation is: ENABLED');
      console.log('► Impact: New users CANNOT log in after signup until they verify email.');
      console.log('► Required fix: Go to Supabase Dashboard → Authentication → Providers → Email');
      console.log('  → Disable "Confirm email" toggle, OR add router.push("/(auth)/check-email")');
      console.log('  in signup.tsx after register() returns true.');
    } else {
      console.log('Sign-in result: FAILED —', signInErr.message);
    }
  } else {
    console.log('Sign-in result: SUCCESS (session returned immediately)');
    console.log('\n► Email confirmation is: DISABLED');
    console.log('► Impact: Users can log in immediately after signup. No action needed.');
    // Clean up the auto-created session
    await sb.auth.signOut();
  }

  // Delete test user
  if (user.id) {
    await sb.auth.admin.deleteUser(user.id);
    console.log('\n(test user deleted)');
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
