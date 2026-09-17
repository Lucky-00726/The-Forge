require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BETA_USERS = [
  '1bd44f06-f1a6-431d-aa92-6def3910aee6', // Lucky
  'b4376fb1-2a13-4632-bdad-fa4ad3742468', // Deku
  'd168deda-ef44-4861-bbd4-d50d034ee54e'  // Lucky
];

async function resetBetaUsers() {
  console.log('==================================================');
  console.log('STARTING TARGETED BETA USER RESET');
  console.log('==================================================');
  console.log(`Target users: \n  - ${BETA_USERS.join('\n  - ')}`);

  // 1. Delete user_daily_sessions rows
  console.log('\n1. Clearing session assignments for beta users...');
  const { count: sessionCount, error: sessionErr } = await sb
    .from('user_daily_sessions')
    .delete({ count: 'exact' })
    .in('user_id', BETA_USERS);

  if (sessionErr) {
    console.error('❌ Failed to clear user_daily_sessions:', sessionErr.message);
  } else {
    console.log(`   ✅ Cleared ${sessionCount} session rows.`);
  }

  // 2. Delete user_content_progress rows
  console.log('\n2. Clearing sequential progression pointers for beta users...');
  const { count: progressCount, error: progressErr } = await sb
    .from('user_content_progress')
    .delete({ count: 'exact' })
    .in('user_id', BETA_USERS);

  if (progressErr) {
    console.error('❌ Failed to clear user_content_progress:', progressErr.message);
  } else {
    console.log(`   ✅ Cleared ${progressCount} progression rows.`);
  }

  // 3. Reset users table fields
  console.log('\n3. Resetting training day and status in users table...');
  const { data: updatedUsers, error: userErr } = await sb
    .from('users')
    .update({
      current_training_day: 1,
      training_program_completed: false
    })
    .in('id', BETA_USERS)
    .select('id, current_training_day, training_program_completed');

  if (userErr) {
    console.error('❌ Failed to reset users fields:', userErr.message);
  } else {
    console.log('   ✅ Successfully reset users profile columns:');
    updatedUsers.forEach(u => {
      console.log(`      - User ${u.id}: current_training_day = ${u.current_training_day}, training_program_completed = ${u.training_program_completed}`);
    });
  }

  console.log('\n==================================================');
  console.log('RESET PROCESS COMPLETED');
  console.log('==================================================');
}

resetBetaUsers().catch(console.error);
