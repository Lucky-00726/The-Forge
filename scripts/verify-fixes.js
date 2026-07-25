require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const userId = '1bd44f06-f1a6-431d-aa92-6def3910aee6';
  
  console.log('=== VERIFYING FIX 1: SESSION 2 BALANCED GENERATION ===');
  // Fetch active approved Session2 questions
  const { data: s2Questions, error: err2 } = await sb
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .eq('session', 'Session2')
    .order('sequence_order', { ascending: true })
    .order('id', { ascending: true });
    
  if (err2) {
    console.error('Error fetching Session 2 questions:', err2.message);
    return;
  }
  
  const mcqs = s2Questions.filter(q => q.module === 'MCQ');
  const singleWords = s2Questions.filter(q => q.module === 'SingleWord');
  const trueFalses = s2Questions.filter(q => q.module === 'TrueFalse');
  const rapids = s2Questions.filter(q => q.module === 'RapidResponse');
  const numerics = s2Questions.filter(q => q.module === 'Numeric');
  
  console.log(`Database Counts for Session 2 Modules:`);
  console.log(`  - MCQ: ${mcqs.length}`);
  console.log(`  - SingleWord: ${singleWords.length}`);
  console.log(`  - TrueFalse: ${trueFalses.length}`);
  console.log(`  - RapidResponse: ${rapids.length}`);
  console.log(`  - Numeric: ${numerics.length}`);
  
  // Replicate balanced selection logic
  const selected = [];
  const addFromModule = (pool, count, label) => {
    if (pool.length === 0) {
      console.warn(`  Warning: Pool is empty for ${label}!`);
      return;
    }
    for (let i = 0; i < count; i++) {
      const idx = i % pool.length;
      selected.push(pool[idx]);
    }
  };
  
  addFromModule(mcqs, 3, 'MCQ');
  addFromModule(singleWords, 3, 'SingleWord');
  addFromModule(trueFalses, 2, 'TrueFalse');
  addFromModule(rapids, 2, 'RapidResponse');
  addFromModule(numerics, 2, 'Numeric');
  
  console.log(`\nGenerated Session 2 array before shuffling (Length: ${selected.length}):`);
  selected.forEach((q, idx) => {
    console.log(`  ${idx+1}. ID: ${q.id} | Module: ${q.module} | Question: "${q.question.substring(0, 50)}..."`);
  });
  
  // Shuffled output representation
  const shuffled = [...selected].sort(() => 0.5 - Math.random());
  console.log(`\nGenerated Session 2 array after shuffling:`);
  shuffled.forEach((q, idx) => {
    console.log(`  ${idx+1}. ID: ${q.id} | Module: ${q.module}`);
  });
  
  console.log('\n=== VERIFYING FIX 2: SESSION 3 STABLE IDs ===');
  // Fetch active approved Session3 questions
  const { data: s3Questions, error: err3 } = await sb
    .from('questions')
    .select('id, question_type, module, time_limit')
    .eq('active', true)
    .eq('status', 'approved')
    .eq('session', 'Session3')
    .order('sequence_order', { ascending: true })
    .order('id', { ascending: true });
    
  if (err3) {
    console.error('Error fetching Session 3 questions:', err3.message);
    return;
  }
  
  // Check if any ID looks randomized (contains lowercase letters or random suffixes)
  const randomLookups = s3Questions.filter(q => {
    // If ID contains random 6-character alphanumeric suffix (lowercase) e.g., SRT-a8f2z4
    return /^[A-Z0-9]+-[a-z0-9]{6}$/.test(q.id);
  });
  
  console.log(`Stable IDs Check:`);
  console.log(`  - Total Session 3 questions in DB: ${s3Questions.length}`);
  console.log(`  - Randomized-looking IDs (e.g. SRT-xxxxxx) found: ${randomLookups.length}`);
  if (randomLookups.length > 0) {
    console.log(`  - Sample random IDs:`, randomLookups.slice(0, 5).map(q => q.id));
  } else {
    console.log(`  - ✅ Success: Every imported question has a permanent stable ID!`);
  }
  
  console.log('\n=== VERIFYING FIX 3: SESSION 3 TIMERS LOADED FROM DB ===');
  const srts = s3Questions.filter(q => q.module === 'SRT');
  const wats = s3Questions.filter(q => q.module === 'WAT');
  const interviews = s3Questions.filter(q => ['Interview', 'PersonalInterview', 'Lecturette', 'GroupDiscussion', 'SelfDescription'].includes(q.module));
  
  console.log(`Session 3 Module Counts in DB:`);
  console.log(`  - SRT: ${srts.length}`);
  console.log(`  - WAT: ${wats.length}`);
  console.log(`  - Interview styles: ${interviews.length}`);
  
  const selectedS3 = [];
  const addS3FromModule = (pool, count) => {
    for (let i = 0; i < count; i++) {
      if (pool.length > 0) {
        selectedS3.push(pool[i % pool.length]);
      }
    }
  };
  
  addS3FromModule(srts, 4);
  addS3FromModule(wats, 3);
  addS3FromModule(interviews, 3);
  
  console.log(`\nGenerated Session 3 array with mapped timers:`);
  selectedS3.forEach((q, idx) => {
    console.log(`  ${idx+1}. ID: ${q.id} | Module: ${q.module} | Timer: ${q.time_limit} seconds`);
  });
}

main().catch(console.error);
