// Deactivates known duplicate MCQ questions in the S1 pool.
// Keeps the lower-numbered ID (original), deactivates the higher (duplicate).
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{autoRefreshToken:false,persistSession:false}});

// Each pair: keep the first ID, deactivate the second.
// Identified by identical question text in the SSB Fundamentals MCQ pool.
const TO_DEACTIVATE = [
  // MCQ duplicate pairs (higher = deactivate)
  'MCQ0071',  // duplicate of MCQ0004 (INS Arihant)
  'MCQ0073',  // duplicate of MCQ0006 (Nirbhay missile)
  'MCQ0074',  // duplicate of MCQ0007 (INS Vibhuti)
  'MCQ0082',  // duplicate of MCQ0015 (HAL Tejas)
  'MCQ0083',  // duplicate of MCQ0016 (AWACS on IL-76)
  'MCQ0089',  // duplicate of MCQ0022 (Astra Air-to-Air)
  'MCQ0091',  // duplicate of MCQ0024 (ITBP paramilitary)
  'MCQ0092',  // duplicate of MCQ0025 (Hand in Hand exercise)
  'MCQ0093',  // duplicate of MCQ0026 (INS Prahar - same question, keep MCQ0026)
  'MCQ0117',  // duplicate of MCQ0050 (BSF border)
  'MCQ0118',  // duplicate of MCQ0051 (SLINEX exercise)
  // OBJ duplicate pairs
  'OBJ0204',  // duplicate of OBJ0061 (Ashok Chakra)
  'OBJ0205',  // duplicate of OBJ0062 (Param Vir Chakra)
];

async function main() {
  console.log(`Deactivating ${TO_DEACTIVATE.length} duplicate questions...`);

  const { error, count } = await sb
    .from('questions')
    .update({ active: false })
    .in('id', TO_DEACTIVATE);

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`Done. Verifying...`);

  const { data: check } = await sb
    .from('questions')
    .select('id, active')
    .in('id', TO_DEACTIVATE);

  check?.forEach(q => console.log(`  ${q.id}: active=${q.active}`));

  // Final S1 pool count
  const { count: remaining } = await sb
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('question_type', 'MCQ')
    .eq('category', 'SSB Fundamentals')
    .eq('active', true);

  console.log(`\nS1 MCQ pool after deduplication: ${remaining} active questions`);
  console.log('Deactivated IDs:', TO_DEACTIVATE.join(', '));
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
