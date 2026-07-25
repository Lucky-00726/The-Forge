require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeQuestionRow(row) {
  return {
    id: row.id,
    category: row.category ?? 'General Knowledge',
    subcategory: row.subcategory ?? null,
    difficulty: row.difficulty ?? 'Medium',
    question_type: row.question_type ?? row.content_type ?? 'MCQ',
    question: row.question ?? row.prompt ?? '',
    prompt: row.prompt ?? null,
    xp_reward: row.xp_reward ?? 10,
    time_limit: row.time_limit ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    source: row.source ?? null,
    active: row.active ?? true,
    sequence_order: row.sequence_order ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    answer_data: row.answer_data ?? {},
    session: row.session ?? '',
    module: row.module ?? '',
    option_a: row.option_a ?? '',
    option_b: row.option_b ?? '',
    option_c: row.option_c ?? '',
    option_d: row.option_d ?? '',
    correct_answer: row.correct_answer ?? '',
    answer_type: row.answer_type ?? '',
    word_limit: row.word_limit ?? null,
    time_limit_seconds: row.time_limit_seconds ?? null,
    xp: row.xp ?? null,
  };
}

async function verifySession2() {
  console.log('\n================================================');
  console.log('1. VERIFYING SESSION 2');
  console.log('================================================');

  const queryText = "SELECT * FROM questions WHERE active = true AND status = 'approved' AND session = 'Session2' ORDER BY sequence_order ASC, id ASC;";
  console.log('Exact SQL Query used to fetch Session 2 questions:\n  ' + queryText);

  const { data: rawPool, error } = await sb
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .eq('session', 'Session2')
    .order('sequence_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching Session 2 pool:', error.message);
    return;
  }

  console.log(`\nTotal questions fetched from database for Session 2: ${rawPool.length}`);

  const pool = rawPool.map(normalizeQuestionRow);

  // Group by module to see how many exist in DB for each Session 2 module
  const dbCounts = {};
  pool.forEach(q => {
    dbCounts[q.module] = (dbCounts[q.module] || 0) + 1;
  });

  console.log('\nHow many questions exist in the database for each Session 2 module:');
  console.log(JSON.stringify(dbCounts, null, 2));

  // Exact array lengths after filtering
  const mcqs = pool.filter(q => q.module === 'MCQ');
  const singleWords = pool.filter(q => q.module === 'SingleWord');
  const trueFalses = pool.filter(q => q.module === 'TrueFalse');
  const rapids = pool.filter(q => q.module === 'RapidResponse');
  const numerics = pool.filter(q => q.module === 'Numeric');

  console.log('\nExact array lengths after filtering:');
  console.log(`- MCQ (module === 'MCQ'): ${mcqs.length}`);
  console.log(`- SingleWord (module === 'SingleWord'): ${singleWords.length}`);
  console.log(`- TrueFalse (module === 'TrueFalse'): ${trueFalses.length}`);
  console.log(`- RapidResponse (module === 'RapidResponse'): ${rapids.length}`);
  console.log(`- Numeric (module === 'Numeric'): ${numerics.length}`);

  // Print if there are any that didn't match the filtering
  const others = pool.filter(q => !['MCQ', 'SingleWord', 'TrueFalse', 'RapidResponse', 'Numeric'].includes(q.module));
  if (others.length > 0) {
    console.log(`- Others (non-matching module field): ${others.length}`);
    others.forEach(q => console.log(`    ID: ${q.id}, module: "${q.module}", question_type: "${q.question_type}"`));
  }

  // Simulate selectForModule logic for user_id = 'preview' / position = 0
  const selected = [];
  const mockReadProgress = async (moduleKey) => 0; // simulating first assignment

  const selectForModule = async (modulePool, moduleKey, count) => {
    if (modulePool.length === 0) {
      console.log(`  Warning: Module pool for ${moduleKey} is empty!`);
      return;
    }
    const position = await mockReadProgress(moduleKey);
    for (let offset = 0; offset < count; offset++) {
      const index = (position + offset) % modulePool.length;
      const question = modulePool[index];
      selected.push(question);
    }
  };

  await selectForModule(mcqs, 'MCQ', 3);
  await selectForModule(singleWords, 'SingleWord', 3);
  await selectForModule(trueFalses, 'TrueFalse', 2);
  await selectForModule(rapids, 'RapidResponse', 2);
  await selectForModule(numerics, 'Numeric', 2);

  // The final array before shuffling
  console.log(`\nFinal array before shuffling (Length: ${selected.length}):`);
  selected.forEach((q, idx) => {
    console.log(`  ${idx + 1}. ID: ${q.id}, Module: "${q.module}", QType: "${q.question_type}", Question: "${q.question.substring(0, 45)}..."`);
  });

  // The final array after shuffling
  const shuffled = shuffleArray(selected);
  console.log(`\nFinal array after shuffling (Length: ${shuffled.length}):`);
  shuffled.forEach((q, idx) => {
    console.log(`  ${idx + 1}. ID: ${q.id}, Module: "${q.module}", QType: "${q.question_type}"`);
  });
}

async function verifySession3() {
  console.log('\n================================================');
  console.log('2. VERIFYING SESSION 3');
  console.log('================================================');

  const queryText = "SELECT * FROM questions WHERE active = true AND status = 'approved' AND session = 'Session3' ORDER BY sequence_order ASC, id ASC;";
  console.log('Exact SQL Query used to fetch Session 3 questions:\n  ' + queryText);

  const { data: rawPool, error } = await sb
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .eq('session', 'Session3')
    .order('sequence_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching Session 3 pool:', error.message);
    return;
  }

  console.log(`\nTotal questions fetched from database for Session 3: ${rawPool.length}`);

  const pool = rawPool.map(normalizeQuestionRow);

  // Group by module to see how many exist in DB for each Session 3 module
  const dbCounts = {};
  pool.forEach(q => {
    dbCounts[q.module] = (dbCounts[q.module] || 0) + 1;
  });

  console.log('\nHow many questions exist in the database for each Session 3 module:');
  console.log(JSON.stringify(dbCounts, null, 2));

  // Let's also check database counts for question_type and tags
  const typeCounts = {};
  const tagCounts = {};
  pool.forEach(q => {
    typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
    if (Array.isArray(q.tags)) {
      q.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    }
  });
  console.log('\nCounts by question_type:');
  console.log(JSON.stringify(typeCounts, null, 2));
  console.log('Counts by tags:');
  console.log(JSON.stringify(tagCounts, null, 2));

  // Exact array lengths after filtering
  const srts = pool.filter(q => q.module === 'SRT');
  const wats = pool.filter(q => q.module === 'WAT');
  const interviews = pool.filter(q => q.module === 'Interview' || q.module === 'PersonalInterview' || q.module === 'Lecturette' || q.module === 'GroupDiscussion' || q.module === 'SelfDescription');

  console.log('\nExact array lengths after filtering:');
  console.log(`- SRT (module === 'SRT'): ${srts.length}`);
  console.log(`- WAT (module === 'WAT'): ${wats.length}`);
  console.log(`- Interview (module === 'Interview' || 'PersonalInterview' || ...): ${interviews.length}`);

  // Let's see if there are other modules
  const others = pool.filter(q => !['SRT', 'WAT', 'Interview', 'PersonalInterview', 'Lecturette', 'GroupDiscussion', 'SelfDescription'].includes(q.module));
  if (others.length > 0) {
    console.log(`- Non-matching Session 3 modules: ${others.length}`);
    others.forEach(q => console.log(`    ID: ${q.id}, module: "${q.module}", question_type: "${q.question_type}"`));
  }

  // Run S3 build logic
  const selected = [];
  const mockReadProgress = async (moduleKey) => 0;

  if (srts.length > 0) {
    const position = await mockReadProgress('SRT');
    for (let offset = 0; offset < 4; offset++) {
      const index = (position + offset) % srts.length;
      selected.push(srts[index]);
    }
  } else {
    console.log('  Warning: SRT pool is empty!');
  }

  if (wats.length > 0) {
    const position = await mockReadProgress('WAT');
    for (let offset = 0; offset < 3; offset++) {
      const index = (position + offset) % wats.length;
      selected.push(wats[index]);
    }
  } else {
    console.log('  Warning: WAT pool is empty!');
  }

  if (interviews.length > 0) {
    const position = await mockReadProgress('Interview');
    for (let offset = 0; offset < 3; offset++) {
      const index = (position + offset) % interviews.length;
      selected.push(interviews[index]);
    }
  } else {
    console.log('  Warning: Interview pool is empty!');
  }

  console.log(`\nFinal generated Session 3 question array (Length: ${selected.length}):`);
  selected.forEach((q, idx) => {
    console.log(`  ${idx + 1}. ID: ${q.id}, Module: "${q.module}", QType: "${q.question_type}", TimeLimitSeconds: ${q.time_limit_seconds}, TimeLimit: ${q.time_limit}, WordLimit: ${q.word_limit}, Text: "${q.question.substring(0, 45)}..."`);
  });
}

async function run() {
  await verifySession2();
  await verifySession3();
}

run().catch(console.error);
