require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  // Prefer a service-role key for seeding (bypasses RLS). Falls back to anon key.
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Map new CSV format to database question_type and build answer_data
function mapContentToQuestion(record) {
  const baseQuestion = {
    id: record.id,
    category: record.category || 'General Knowledge',
    subcategory: record.subcategory || null,
    difficulty: mapDifficulty(record.difficulty),
    question_type: mapQuestionType(record.question_type),
    question: record.question || '',
    prompt: null,
    xp_reward: mapXPReward(record.question_type, record.difficulty),
    time_limit: null,
    tags: [record.category, record.subcategory].filter(Boolean),
    source: 'Master Content',
    active: true,
  };

  // Build answer_data based on question type
  baseQuestion.answer_data = buildAnswerData(record);

  return baseQuestion;
}

// Schema allows only Easy/Medium/Hard. Normalize source values.
function mapDifficulty(difficulty) {
  const map = {
    'Easy': 'Easy',
    'Medium': 'Medium',
    'Hard': 'Hard',
  };
  return map[difficulty] || 'Medium';
}

function mapQuestionType(questionType) {
  // Map from CSV question_type to database question_type
  const typeMap = {
    'MCQ': 'MCQ',
    'SingleWord': 'SingleWord',
    'Numeric': 'Numeric',
    'RapidResponse': 'RapidResponse',
    'True/False': 'TrueFalse',
    'SRT': 'SRT',
    'WAT': 'WAT',
    'Interview': 'Interview',
    'Subjective': 'Interview', // Subjective maps to Interview
    'Assertion and Reason': 'MCQ',
    'Assertion and Reason': 'MCQ',
  };
  return typeMap[questionType] || 'Interview';
}

function mapXPReward(questionType, difficulty) {
  const baseXP = {
    'Easy': 10,
    'Medium': 15,
    'Hard': 20,
  };
  const difficultyXP = baseXP[difficulty] || 15;
  
  // Adjust based on question type
  const typeMultiplier = {
    'MCQ': 1,
    'SingleWord': 1.2,
    'Numeric': 1.3,
    'RapidResponse': 1.5,
    'TrueFalse': 0.8,
    'SRT': 1.5,
    'WAT': 1.5,
    'Interview': 1.8,
    'Subjective': 1.8,
  };
  
  return Math.round(difficultyXP * (typeMultiplier[questionType] || 1));
}

function buildAnswerData(record) {
  const questionType = mapQuestionType(record.question_type);

  // MCQ - has options and correct answer
  if (questionType === 'MCQ' && record.option_a) {
    const options = [
      record.option_a,
      record.option_b,
      record.option_c,
      record.option_d,
    ].filter(o => o && o.trim());

    let correctIndex = 0;
    if (record.correct_answer) {
      const idx = options.indexOf(record.correct_answer);
      correctIndex = idx >= 0 ? idx : 0;
    }

    return {
      options,
      correctIndex,
      explanation: record.explanation || '',
    };
  }

  // True/False
  if (questionType === 'TrueFalse') {
    return {
      correctAnswer: record.correct_answer === 'TRUE' || record.correct_answer === true,
      explanation: record.explanation || '',
    };
  }

  // SingleWord - correct answer is provided
  if (questionType === 'SingleWord') {
    return {
      correctAnswer: record.correct_answer || '',
      acceptableAnswers: record.correct_answer ? [record.correct_answer.toLowerCase()] : [],
      explanation: record.explanation || '',
    };
  }

  // Numeric
  if (questionType === 'Numeric') {
    return {
      correctAnswer: isNaN(record.correct_answer) ? 0 : parseInt(record.correct_answer),
      tolerance: 0,
      unit: '',
      explanation: record.explanation || '',
    };
  }

  // RapidResponse - treat like MCQ
  if (questionType === 'RapidResponse' && record.option_a) {
    const options = [
      record.option_a,
      record.option_b,
      record.option_c,
      record.option_d,
    ].filter(o => o && o.trim());

    let correctIndex = 0;
    if (record.correct_answer) {
      const idx = options.indexOf(record.correct_answer);
      correctIndex = idx >= 0 ? idx : 0;
    }

    return {
      options,
      correctIndex,
      explanation: record.explanation || '',
    };
  }

  // SRT / WAT / Interview - subjective evaluation
  if (['SRT', 'WAT', 'Interview'].includes(record.question_type)) {
    return {
      minWords: record.question_type === 'WAT' ? 3 : (record.question_type === 'SRT' ? 15 : 30),
      evaluationCriteria: ['General'],
    };
  }

  // Default for Subjective or unknown
  return {
    minWords: 20,
    evaluationCriteria: ['General'],
  };
}

async function main() {
  console.log('📖 THE FORGE — Master Content Import');
  console.log('═'.repeat(60));
  
  const csvPath = 'scripts/Forge-Master-Content.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`\n📂 Reading ${csvPath}...`);
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  console.log(`✅ Parsed ${records.length} records from CSV\n`);

  // Filter and convert
  const questions = records
    .map((r, idx) => {
      try {
        return mapContentToQuestion(r);
      } catch (e) {
        console.warn(`  ⚠️  Row ${idx + 2}: ${e.message}`);
        return null;
      }
    })
    .filter(q => q !== null);

  console.log(`✅ Converted ${questions.length} questions\n`);

  // Group by category for statistics
  const byCategory = {};
  questions.forEach(q => {
    const cat = q.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log('📊 By Category:');
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });

  console.log('\n🚀 Importing to Supabase...');
  
  const batchSize = 50;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    const { error } = await supabase
      .from('questions')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`  ❌ Batch ${batchNum} failed: ${error.message}`);
      failed += batch.length;
    } else {
      imported += batch.length;
      console.log(`  ✅ Batch ${batchNum}: ${batch.length} questions`);
    }
  }

  console.log('\n📊 Import Statistics:');
  console.log(`  Total imported: ${imported}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total records: ${questions.length}`);

  // Verify database
  console.log('\n🔍 Verifying database...');
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  if (!countError) {
    console.log(`  ✅ Total active records in database: ${count}`);
  }

  // Get breakdown by question_type
  const { data: typeData } = await supabase
    .from('questions')
    .select('question_type')
    .eq('active', true);

  if (typeData) {
    const dbTypes = {};
    typeData.forEach(d => {
      dbTypes[d.question_type] = (dbTypes[d.question_type] || 0) + 1;
    });

    console.log('\n📋 Database Records by Question Type:');
    Object.entries(dbTypes).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
  }

  console.log('\n✅ Import complete!');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
