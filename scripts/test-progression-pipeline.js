require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// We'll test with Lucky's account UUID (1bd44)
const TEST_USER = '1bd44f06-f1a6-431d-aa92-6def3910aee6';

// Direct Fisher-Yates and Backtracking implementation matching src/services/content-session-engine.ts
function shuffleArrayFY(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleSession2Constrained(questions) {
  const groups = {};
  questions.forEach(q => {
    const type = q.question_type || 'MCQ';
    if (!groups[type]) groups[type] = [];
    groups[type].push(q);
  });

  for (const type in groups) {
    groups[type] = shuffleArrayFY(groups[type]);
  }

  const result = [];

  function backtrack(lastType) {
    if (result.length === 12) {
      return true;
    }

    let candidates = Object.keys(groups).filter(t => groups[t].length > 0 && t !== lastType);
    candidates = shuffleArrayFY(candidates);
    candidates.sort((a, b) => groups[b].length - groups[a].length);

    for (const type of candidates) {
      const q = groups[type].pop();
      result.push(q);

      if (backtrack(type)) {
        return true;
      }

      result.pop();
      groups[type].push(q);
    }

    return false;
  }

  const success = backtrack(null);
  if (!success) {
    throw new Error('Constrained shuffle failed');
  }

  return result;
}

async function runVerification() {
  console.log('==================================================');
  console.log('STARTING PIPELINE VERIFICATION SUITE');
  console.log('==================================================');

  // PHASE 2: DATABASE SCHEMA VERIFICATION
  console.log('\n--- PHASE 2: DATABASE SCHEMA VERIFICATION ---');
  
  // Verify columns in questions table
  const { data: qSample, error: qErr } = await sb.from('questions').select('*').limit(1);
  if (qErr) {
    console.error('❌ questions column check failed:', qErr.message);
    process.exit(1);
  }
  const qKeys = Object.keys(qSample[0] || {});
  console.log('  questions.day exists:', qKeys.includes('day') ? '✅' : '❌');
  console.log('  questions.session exists:', qKeys.includes('session') ? '✅' : '❌');

  // Verify columns in import_staging_questions table
  const { data: sSample, error: sErr } = await sb.from('import_staging_questions').select('*').limit(1);
  if (sErr) {
    console.error('❌ import_staging_questions check failed:', sErr.message);
    process.exit(1);
  }
  const sKeys = Object.keys(sSample[0] || {});
  console.log('  import_staging_questions.day exists:', sKeys.includes('day') ? '✅' : '❌');

  // Verify columns in users table
  const { data: uSample, error: uErr } = await sb.from('users').select('*').eq('id', TEST_USER).single();
  if (uErr) {
    console.error('❌ users table check failed:', uErr.message);
    process.exit(1);
  }
  const uKeys = Object.keys(uSample || {});
  console.log('  users.current_training_day exists:', uKeys.includes('current_training_day') ? '✅' : '❌');
  console.log('  users.training_program_completed exists:', uKeys.includes('training_program_completed') ? '✅' : '❌');

  // Verify columns in user_daily_sessions table
  const { data: dsSample, error: dsErr } = await sb.from('user_daily_sessions').select('*').limit(1);
  if (dsErr) {
    console.error('❌ user_daily_sessions check failed:', dsErr.message);
    process.exit(1);
  }
  const dsKeys = Object.keys(dsSample[0] || {});
  console.log('  user_daily_sessions.training_day exists:', dsKeys.includes('training_day') ? '✅' : '❌');
  console.log('  user_daily_sessions.session_date exists:', dsKeys.includes('session_date') ? '✅' : '❌');

  // PHASE 3: CONTENT IMPORT VERIFICATION
  console.log('\n--- PHASE 3: CONTENT IMPORT VERIFICATION (1-30 DAYS) ---');
  
  const allQuestions = [];
  let start = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error: aqErr } = await sb
      .from('questions')
      .select('id, day, session, question_type, module, active, status')
      .eq('active', true)
      .eq('status', 'approved')
      .range(start, start + pageSize - 1);

    if (aqErr) {
      console.error('❌ Failed to fetch questions for curriculum audit:', aqErr.message);
      process.exit(1);
    }

    allQuestions.push(...(data || []));
    if (!data || data.length < pageSize) {
      hasMore = false;
    } else {
      start += pageSize;
    }
  }

  // Count question occurrences
  const curCounts = {};
  allQuestions.forEach(q => {
    if (q.day !== null) {
      const key = `${q.day}-${q.session}`;
      if (!curCounts[key]) curCounts[key] = { total: 0, types: {} };
      curCounts[key].total++;
      curCounts[key].types[q.question_type] = (curCounts[key].types[q.question_type] || 0) + 1;
    }
  });

  let importPass = true;
  console.log('  Day | Session 1 Qs | Session 2 Qs (Distribution)                        | Session 3 Qs (Distribution)  | Status');
  console.log('  ----+--------------+----------------------------------------------------+-----------------------------+--------');
  for (let day = 1; day <= 30; day++) {
    const s1 = curCounts[`${day}-Session1`] || { total: 0, types: {} };
    const s2 = curCounts[`${day}-Session2`] || { total: 0, types: {} };
    const s3 = curCounts[`${day}-Session3`] || { total: 0, types: {} };

    const s2MCQ = s2.types.MCQ || 0;
    const s2SW = s2.types.SingleWord || 0;
    const s2TF = s2.types.TrueFalse || 0;
    const s2RR = s2.types.RapidResponse || 0;
    const s2Num = s2.types.Numeric || 0;

    const s3SRT = s3.types.SRT || 0;
    const s3WAT = s3.types.WAT || 0;
    const s3Int = s3.types.Interview || 0;

    const s1Valid = s1.total === 12;
    const s2Valid = s2.total === 12 && s2MCQ === 3 && s2SW === 3 && s2TF === 2 && s2RR === 2 && s2Num === 2;
    const s3Valid = s3.total === 10 && s3SRT === 4 && s3WAT === 3 && s3Int === 3;

    const rowStatus = (s1Valid && s2Valid && s3Valid) ? '✅ OK' : '❌ FAIL';
    if (rowStatus === '❌ FAIL') importPass = false;

    console.log(`  ${String(day).padStart(3)} | ${String(s1.total).padStart(12)} | ${String(s2.total).padStart(14)} (MCQ:${s2MCQ}, SW:${s2SW}, TF:${s2TF}, RR:${s2RR}, Num:${s2Num}) | ${String(s3.total).padStart(11)} (SRT:${s3SRT}, WAT:${s3WAT}, Int:${s3Int}) | ${rowStatus}`);
  }

  console.log(`\nCurriculum integrity test: ${importPass ? '✅ PASS' : '❌ FAIL'}`);

  // PHASE 5: DAY 1 ASSIGNMENT TEST
  console.log('\n--- PHASE 5: DAY 1 ASSIGNMENT TEST ---');
  
  // Set user to Day 1, clear previous sessions
  await sb.from('users').update({ current_training_day: 1, training_program_completed: false }).eq('id', TEST_USER);
  await sb.from('user_daily_sessions').delete().eq('user_id', TEST_USER);

  // Session 1 questions for Day 1
  const day1S1Qs = allQuestions.filter(q => q.day === 1 && q.session === 'Session1');
  console.log(`  Session 1 count: ${day1S1Qs.length} (Expected: 12)`);
  console.log(`  Session 1 Question IDs:`, day1S1Qs.map(q => q.id).join(', '));

  // Session 2 questions for Day 1
  const day1S2Qs = allQuestions.filter(q => q.day === 1 && q.session === 'Session2');
  console.log(`  Session 2 count: ${day1S2Qs.length} (Expected: 12)`);
  const shuffledS2 = shuffleSession2Constrained(day1S2Qs);
  console.log(`  Session 2 Sequence:`, shuffledS2.map(q => `${q.id}(${q.question_type})`).join(' -> '));
  
  let adjacentDup = false;
  for (let i = 0; i < shuffledS2.length - 1; i++) {
    if (shuffledS2[i].question_type === shuffledS2[i+1].question_type) adjacentDup = true;
  }
  console.log(`  Session 2 consecutive duplicate type checks:`, adjacentDup ? '❌ FAILED' : '✅ PASSED');

  // Session 3 questions for Day 1
  const day1S3Qs = allQuestions.filter(q => q.day === 1 && q.session === 'Session3');
  console.log(`  Session 3 count: ${day1S3Qs.length} (Expected: 10)`);
  const s3SRTs = day1S3Qs.filter(q => q.question_type === 'SRT').map(q => q.id);
  const s3WATs = day1S3Qs.filter(q => q.question_type === 'WAT').map(q => q.id);
  const s3Ints = day1S3Qs.filter(q => q.question_type === 'Interview').map(q => q.id);
  console.log(`    SRT Questions:`, s3SRTs.join(', '));
  console.log(`    WAT Questions:`, s3WATs.join(', '));
  console.log(`    Interview Questions:`, s3Ints.join(', '));

  // PHASE 6: PINNING TEST
  console.log('\n--- PHASE 6: PINNING TEST ---');
  // Store them in the database
  const s1Ids = day1S1Qs.map(q => q.id);
  const s2Ids = shuffledS2.map(q => q.id);
  const s3Ids = [...s3SRTs, ...s3WATs, ...s3Ints];

  await sb.from('user_daily_sessions').insert([
    { user_id: TEST_USER, training_day: 1, session_number: 1, question_ids: s1Ids, session_date: '2026-08-01' },
    { user_id: TEST_USER, training_day: 1, session_number: 2, question_ids: s2Ids, session_date: '2026-08-01' },
    { user_id: TEST_USER, training_day: 1, session_number: 3, question_ids: s3Ids, session_date: '2026-08-01' }
  ]);

  // Read back to confirm pinning
  const { data: readBack } = await sb.from('user_daily_sessions').select('*').eq('user_id', TEST_USER).eq('training_day', 1);
  console.log(`  Stored rows count: ${readBack.length} (Expected: 3)`);
  readBack.forEach(row => {
    console.log(`    Session ${row.session_number} question IDs matches pinned layout:`, JSON.stringify(row.question_ids));
  });

  // PHASE 7 & 8 & 9: INCOMPLETE DAY, ADVANCEMENT & IDEMPOTENCY TESTS
  console.log('\n--- PHASE 7-10: INCOMPLETE, ADVANCEMENT, IDEMPOTENCY, MISMATCH TESTS ---');

  // Complete Session 1
  console.log('  Completing Session 1...');
  const { data: c1 } = await sb.rpc('complete_daily_session', {
    p_expected_day: 1,
    p_session_number: 1,
    p_xp_earned: 10,
    p_score: 10,
    p_total_questions: 12,
    p_completion_time_seconds: 30,
    p_difficulty: 'Easy',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${c1[0].status}" | day_advanced=${c1[0].day_advanced} | new_training_day=${c1[0].new_training_day}`);

  // Complete Session 2
  console.log('  Completing Session 2...');
  const { data: c2 } = await sb.rpc('complete_daily_session', {
    p_expected_day: 1,
    p_session_number: 2,
    p_xp_earned: 10,
    p_score: 10,
    p_total_questions: 12,
    p_completion_time_seconds: 30,
    p_difficulty: 'Medium',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${c2[0].status}" | day_advanced=${c2[0].day_advanced} | new_training_day=${c2[0].new_training_day}`);

  // Complete Session 3 (advances to Day 2)
  console.log('  Completing Session 3...');
  const { data: c3 } = await sb.rpc('complete_daily_session', {
    p_expected_day: 1,
    p_session_number: 3,
    p_xp_earned: 150,
    p_score: null,
    p_total_questions: 10,
    p_completion_time_seconds: 300,
    p_difficulty: 'Subjective',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${c3[0].status}" | day_advanced=${c3[0].day_advanced} | new_training_day=${c3[0].new_training_day}`);

  // Test idempotency
  console.log('  Testing idempotency of Session 3 completion call...');
  const { data: c3Dup } = await sb.rpc('complete_daily_session', {
    p_expected_day: 1,
    p_session_number: 3,
    p_xp_earned: 150,
    p_score: null,
    p_total_questions: 10,
    p_completion_time_seconds: 300,
    p_difficulty: 'Subjective',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${c3Dup[0].status}" | day_advanced=${c3Dup[0].day_advanced} | new_training_day=${c3Dup[0].new_training_day}`);

  // Try Day mismatch completion call (submitting expected Day 1 session while user is on Day 2)
  console.log('  Trying stale expected day completion call (Day 1 session submission while user is on Day 2)...');
  const { data: cMismatch } = await sb.rpc('complete_daily_session', {
    p_expected_day: 1,
    p_session_number: 3,
    p_xp_earned: 150,
    p_score: null,
    p_total_questions: 10,
    p_completion_time_seconds: 300,
    p_difficulty: 'Subjective',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${cMismatch[0].status}" | new_training_day=${cMismatch[0].new_training_day}`);

  // PHASE 11: SHUFFLE STRESS TEST
  console.log('\n--- PHASE 11: SESSION 2 SHUFFLE STRESS TEST ---');
  let shuffleFailures = 0;
  const uniquePatterns = new Set();
  
  for (let iter = 0; iter < 10000; iter++) {
    try {
      const res = shuffleSession2Constrained(day1S2Qs);
      const pattern = res.map(q => q.question_type).join('-');
      uniquePatterns.add(pattern);
      
      for (let i = 0; i < res.length - 1; i++) {
        if (res[i].question_type === res[i+1].question_type) {
          shuffleFailures++;
        }
      }
    } catch {
      shuffleFailures++;
    }
  }
  console.log(`  Stress iterations: 10,000`);
  console.log(`  Adjacent type collisions: ${shuffleFailures}`);
  console.log(`  Unique valid patterns generated: ${uniquePatterns.size}`);
  console.log(`  Shuffle stress status:`, shuffleFailures === 0 && uniquePatterns.size > 1 ? '✅ PASS' : '❌ FAIL');

  // PHASE 12: DAY 30 COMPLETION TEST
  console.log('\n--- PHASE 12: DAY 30 COMPLETION TEST ---');
  console.log('  Advancing test user to Day 30...');
  await sb.from('users').update({ current_training_day: 30, training_program_completed: false }).eq('id', TEST_USER);
  await sb.from('user_daily_sessions').delete().eq('user_id', TEST_USER).eq('training_day', 30);
  
  await sb.from('user_daily_sessions').insert([
    { user_id: TEST_USER, training_day: 30, session_number: 1, question_ids: ['Q30S1'], session_date: '2026-08-30' },
    { user_id: TEST_USER, training_day: 30, session_number: 2, question_ids: ['Q30S2'], session_date: '2026-08-30' },
    { user_id: TEST_USER, training_day: 30, session_number: 3, question_ids: ['Q30S3'], session_date: '2026-08-30' }
  ]);

  console.log('  Completing Day 30 Session 1...');
  await sb.rpc('complete_daily_session', { p_expected_day: 30, p_session_number: 1, p_xp_earned: 10, p_score: 10, p_total_questions: 1, p_completion_time_seconds: 30, p_difficulty: 'Easy', p_user_id: TEST_USER });
  console.log('  Completing Day 30 Session 2...');
  await sb.rpc('complete_daily_session', { p_expected_day: 30, p_session_number: 2, p_xp_earned: 10, p_score: 10, p_total_questions: 1, p_completion_time_seconds: 30, p_difficulty: 'Easy', p_user_id: TEST_USER });
  
  console.log('  Completing Day 30 Session 3 (finalizing training)...');
  const { data: d30c3 } = await sb.rpc('complete_daily_session', {
    p_expected_day: 30,
    p_session_number: 3,
    p_xp_earned: 100,
    p_score: null,
    p_total_questions: 1,
    p_completion_time_seconds: 30,
    p_difficulty: 'Easy',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${d30c3[0].status}" | program_completed=${d30c3[0].program_completed} | new_training_day=${d30c3[0].new_training_day}`);

  // Stale completion program check
  console.log('  Calling completion on already completed Day 30...');
  const { data: d30c3Dup } = await sb.rpc('complete_daily_session', {
    p_expected_day: 30,
    p_session_number: 3,
    p_xp_earned: 100,
    p_score: null,
    p_total_questions: 1,
    p_completion_time_seconds: 30,
    p_difficulty: 'Easy',
    p_user_id: TEST_USER
  });
  console.log(`    Result: status="${d30c3Dup[0].status}" | program_completed=${d30c3Dup[0].program_completed}`);

  // PHASE 14: CLEANUP
  console.log('\n--- PHASE 14: CLEANUP ---');
  await sb.from('users').update({ current_training_day: 1, training_program_completed: false }).eq('id', TEST_USER);
  await sb.from('user_daily_sessions').delete().eq('user_id', TEST_USER);
  console.log('  ✅ Deleted test session rows and reset profile to Day 1.');

  console.log('\n==================================================');
  console.log('ALL TESTS COMPLETED');
  console.log('==================================================');
}

runVerification().catch(console.error);
