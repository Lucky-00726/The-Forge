require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('Reading CSV...');
  const csv = fs.readFileSync('scripts/questions-template.csv', 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  console.log('Parsing questions...');
  const questions = records.map((r) => ({
    id: r.id,
    category: r.category,
    subcategory: r.subcategory || null,
    difficulty: r.difficulty,
    question_type: r.question_type,
    question: r.question,
    prompt: r.prompt || null,
    answer_data: JSON.parse(r.answer_data),
    xp_reward: parseInt(r.xp_reward) || 10,
    time_limit: r.time_limit ? parseInt(r.time_limit) : null,
    tags: JSON.parse(r.tags || '[]'),
    source: r.source || null,
    active: r.active !== 'false',
  }));

  console.log(`Parsed ${questions.length} questions`);

  console.log('Importing to Supabase...');
  const { error } = await supabase.from('questions').upsert(questions, { onConflict: 'id' });

  if (error) {
    console.error('Import error:', error.message);
    process.exit(1);
  }

  console.log('Import successful!');

  console.log('\nVerifying import...');
  const { data, count } = await supabase
    .from('questions')
    .select('question_type', { count: 'exact' })
    .eq('active', true);

  console.log(`Total active questions: ${count}`);

  const types = {};
  data.forEach((d) => {
    types[d.question_type] = (types[d.question_type] || 0) + 1;
  });

  console.log('\nBreakdown by type:');
  Object.entries(types).forEach(([type, cnt]) => {
    console.log(`  ${type}: ${cnt}`);
  });

  console.log('\n✅ Done!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
