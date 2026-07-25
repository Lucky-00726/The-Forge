require('dotenv').config();
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// Map CSV question types to database question types
function mapQuestionType(questionType) {
  const typeMap = {
    'MCQ': 'MCQ',
    'SingleWord': 'SingleWord',
    'Numeric': 'Numeric',
    'RapidResponse': 'RapidResponse',
    'True/False': 'TrueFalse',
    'SRT': 'SRT',
    'WAT': 'WAT',
    'Interview': 'Interview',
    'Subjective': 'Interview',
    'Assertion and Reason': 'MCQ',
  };
  return typeMap[questionType] || 'Interview';
}

function mapDifficulty(difficulty) {
  const map = {
    'Easy': 'Easy',
    'Medium': 'Medium',
    'Hard': 'Hard',
  };
  return map[difficulty] || 'Medium';
}

function mapXPReward(questionType, difficulty) {
  const baseXP = {
    'Easy': 10,
    'Medium': 15,
    'Hard': 20,
  };
  const difficultyXP = baseXP[difficulty] || 15;
  
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

    return JSON.stringify({
      options,
      correctIndex,
      explanation: record.explanation || '',
    });
  }

  // True/False
  if (questionType === 'TrueFalse') {
    return JSON.stringify({
      correctAnswer: record.correct_answer === 'TRUE' || record.correct_answer === true,
      explanation: record.explanation || '',
    });
  }

  // SingleWord
  if (questionType === 'SingleWord') {
    return JSON.stringify({
      correctAnswer: record.correct_answer || '',
      acceptableAnswers: record.correct_answer ? [record.correct_answer.toLowerCase()] : [],
      explanation: record.explanation || '',
    });
  }

  // Numeric
  if (questionType === 'Numeric') {
    return JSON.stringify({
      correctAnswer: isNaN(record.correct_answer) ? 0 : parseInt(record.correct_answer),
      tolerance: 0,
      unit: '',
      explanation: record.explanation || '',
    });
  }

  // RapidResponse
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

    return JSON.stringify({
      options,
      correctIndex,
      explanation: record.explanation || '',
    });
  }

  // SRT / WAT / Interview
  if (['SRT', 'WAT', 'Interview'].includes(record.question_type)) {
    return JSON.stringify({
      minWords: record.question_type === 'WAT' ? 3 : (record.question_type === 'SRT' ? 15 : 30),
      evaluationCriteria: ['General'],
    });
  }

  // Default
  return JSON.stringify({
    minWords: 20,
    evaluationCriteria: ['General'],
  });
}

function escapeSqlString(str) {
  if (!str) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function main() {
  console.log('📖 THE FORGE — SQL Generation from Master Content CSV');
  console.log('═'.repeat(70));
  
  const csvPath = 'scripts/Forge-Master-Content.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`\n📂 Reading ${csvPath}...`);
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csv, { columns: true, skip_empty_lines: true });

  console.log(`✅ Parsed ${records.length} records from CSV\n`);

  // Generate SQL
  let sql = `-- THE FORGE — Master Content Import
-- Generated: ${new Date().toISOString()}
-- Total records: ${records.length}
-- 
-- This script will insert or update all questions in the questions table.
-- Run this in Supabase Dashboard → SQL Editor
-- 
-- WARNING: If you want to remove old master content first, run:
-- DELETE FROM public.questions WHERE source = 'Master Content';

BEGIN;

`;

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  records.forEach((record, idx) => {
    try {
      const id = record.id ? record.id.trim() : null;
      if (!id) {
        errors.push(`Row ${idx + 2}: Missing id`);
        errorCount++;
        return;
      }

      const category = record.category ? record.category.trim() : 'General Knowledge';
      const subcategory = record.subcategory ? record.subcategory.trim() : null;
      const difficulty = mapDifficulty(record.difficulty || 'Medium');
      const questionType = mapQuestionType(record.question_type || 'Interview');
      const question = record.question ? record.question.trim() : '';
      const answerData = buildAnswerData(record);
      const xpReward = mapXPReward(record.question_type, record.difficulty);
      const tags = JSON.stringify([category, subcategory].filter(Boolean));

      const insertSql = `INSERT INTO public.questions (
  id,
  category,
  subcategory,
  difficulty,
  question_type,
  question,
  prompt,
  answer_data,
  xp_reward,
  time_limit,
  tags,
  source,
  active,
  created_at,
  updated_at
) VALUES (
  ${escapeSqlString(id)},
  ${escapeSqlString(category)},
  ${escapeSqlString(subcategory)},
  ${escapeSqlString(difficulty)},
  ${escapeSqlString(questionType)},
  ${escapeSqlString(question)},
  NULL,
  '${answerData.replace(/'/g, "''")}'::jsonb,
  ${xpReward},
  NULL,
  '${tags.replace(/'/g, "''")}'::jsonb,
  'Master Content',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  difficulty = EXCLUDED.difficulty,
  question_type = EXCLUDED.question_type,
  question = EXCLUDED.question,
  answer_data = EXCLUDED.answer_data,
  xp_reward = EXCLUDED.xp_reward,
  tags = EXCLUDED.tags,
  updated_at = NOW();

`;

      sql += insertSql;
      successCount++;
    } catch (e) {
      errors.push(`Row ${idx + 2}: ${e.message}`);
      errorCount++;
    }
  });

  sql += `COMMIT;

-- Statistics:
-- Inserted/Updated: ${successCount}
-- Errors: ${errorCount}
-- Total: ${records.length}
`;

  if (errors.length > 0) {
    sql += `\n-- ERRORS:\n`;
    errors.forEach(e => {
      sql += `-- ${e}\n`;
    });
  }

  // Save to file
  const outputPath = `scripts/master-content-import-${new Date().toISOString().split('T')[0]}.sql`;
  fs.writeFileSync(outputPath, sql, 'utf-8');

  console.log(`✅ SQL generated successfully!`);
  console.log(`\n📊 Summary:`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${records.length}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  Errors found:`);
    errors.forEach(e => console.log(`  ${e}`));
  }

  console.log(`\n💾 SQL file saved: ${outputPath}`);
  console.log(`\n📋 Next steps:`);
  console.log(`  1. Open: ${outputPath}`);
  console.log(`  2. Copy all the SQL`);
  console.log(`  3. Go to: Supabase Dashboard → SQL Editor`);
  console.log(`  4. Paste and run`);
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
