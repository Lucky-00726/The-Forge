// ─────────────────────────────────────────────────────────────
// THE FORGE — CSV Preparation Script
// Helps prepare and validate CSV files for import
// Usage: npx ts-node scripts/prepare-csv.ts <input.csv> <output.csv>
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  'interview': 'Interview Prep',
  'srt': 'Psychological Tests',
  'wat': 'Psychological Tests',
  'tat': 'Psychological Tests',
  'oir': 'SSB Fundamentals',
  'gto': 'GTO Tasks',
  'gd': 'GTO Tasks',
  'lecturette': 'Communication',
  'self description': 'Communication',
  'current affairs': 'General Knowledge',
  'geopolitics': 'General Knowledge',
  'leadership': 'Leadership',
  'decision': 'Decision Making',
};

const SUBCATEGORY_MAP: Record<string, string> = {
  'interview': 'Personal Interview',
  'srt': 'SRT',
  'wat': 'WAT',
  'tat': 'TAT',
  'oir': 'OIR',
  'gto': 'Group Tasks',
  'gd': 'Group Discussion',
  'lecturette': 'Speaking',
  'self description': 'Speaking',
};

const TYPE_MAP: Record<string, string> = {
  'mcq': 'MCQ',
  'multiple choice': 'MCQ',
  'single word': 'SingleWord',
  'one word': 'SingleWord',
  'numeric': 'Numeric',
  'number': 'Numeric',
  'rapid': 'RapidResponse',
  'rapid response': 'RapidResponse',
  'true/false': 'TrueFalse',
  'true false': 'TrueFalse',
  'srt': 'SRT',
  'situation': 'SRT',
  'wat': 'WAT',
  'word association': 'WAT',
  'interview': 'Interview',
  'personal interview': 'Interview',
};

// ─────────────────────────────────────────────────────────────
// Smart Field Detection
// ─────────────────────────────────────────────────────────────

function detectQuestionType(record: any): string {
  // Check explicit type field
  if (record.type || record.question_type) {
    const typeValue = (record.type || record.question_type).toLowerCase();
    for (const [key, value] of Object.entries(TYPE_MAP)) {
      if (typeValue.includes(key)) {
        return value;
      }
    }
  }

  // Infer from content
  if (record.options || record.choices) {
    return 'MCQ';
  }

  if (record.correct_answer === 'true' || record.correct_answer === 'false') {
    return 'TrueFalse';
  }

  if (record.min_words || record.minWords) {
    if (record.category?.toLowerCase().includes('srt')) return 'SRT';
    if (record.category?.toLowerCase().includes('wat')) return 'WAT';
    return 'Interview';
  }

  // Default
  return 'Interview';
}

function detectCategory(record: any, filename: string): string {
  // From explicit field
  if (record.category) {
    const catLower = record.category.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (catLower.includes(key)) {
        return value;
      }
    }
    return record.category;
  }

  // From filename
  const filenameLower = filename.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (filenameLower.includes(key)) {
      return value;
    }
  }

  return 'General Knowledge';
}

function detectSubcategory(record: any, category: string, filename: string): string | undefined {
  // From explicit field
  if (record.subcategory) {
    return record.subcategory;
  }

  // From filename or category
  const searchText = `${filename} ${category}`.toLowerCase();
  for (const [key, value] of Object.entries(SUBCATEGORY_MAP)) {
    if (searchText.includes(key)) {
      return value;
    }
  }

  return undefined;
}

function detectDifficulty(record: any): string {
  if (record.difficulty) {
    const diff = record.difficulty.toLowerCase();
    if (diff.includes('easy')) return 'Easy';
    if (diff.includes('medium')) return 'Medium';
    if (diff.includes('hard')) return 'Hard';
  }

  if (record.level) {
    const level = record.level.toLowerCase();
    if (level === '1' || level.includes('easy')) return 'Easy';
    if (level === '2' || level.includes('medium')) return 'Medium';
    if (level === '3' || level.includes('hard')) return 'Hard';
  }

  // Default to Medium
  return 'Medium';
}

// ─────────────────────────────────────────────────────────────
// Answer Data Builder
// ─────────────────────────────────────────────────────────────

function buildAnswerData(record: any, questionType: string): any {
  const data: any = {};

  switch (questionType) {
    case 'MCQ':
    case 'RapidResponse':
      // Parse options
      let options: string[] = [];
      if (record.options) {
        try {
          options = JSON.parse(record.options);
        } catch {
          options = record.options.split('|').map((o: string) => o.trim());
        }
      } else if (record.choices) {
        try {
          options = JSON.parse(record.choices);
        } catch {
          options = record.choices.split('|').map((o: string) => o.trim());
        }
      } else {
        // Try option_a, option_b, etc.
        ['a', 'b', 'c', 'd', 'e'].forEach(letter => {
          const key = `option_${letter}`;
          if (record[key]) options.push(record[key]);
        });
      }

      data.options = options;

      // Parse correct index
      let correctIndex = 0;
      if (record.correct_index !== undefined) {
        correctIndex = parseInt(record.correct_index, 10);
      } else if (record.correctIndex !== undefined) {
        correctIndex = parseInt(record.correctIndex, 10);
      } else if (record.correct_answer) {
        // Try to match answer to option
        const answer = record.correct_answer.toLowerCase();
        correctIndex = options.findIndex((opt: string) => opt.toLowerCase() === answer);
        if (correctIndex === -1) correctIndex = 0;
      }

      data.correctIndex = correctIndex;
      data.explanation = record.explanation || record.reason || '';
      break;

    case 'SingleWord':
      data.correctAnswer = record.correct_answer || record.answer || '';
      data.acceptableAnswers = [data.correctAnswer.toLowerCase()];
      if (record.acceptable_answers) {
        try {
          data.acceptableAnswers = JSON.parse(record.acceptable_answers);
        } catch {
          data.acceptableAnswers = record.acceptable_answers.split('|').map((a: string) => a.trim().toLowerCase());
        }
      }
      data.explanation = record.explanation || '';
      break;

    case 'Numeric':
      data.correctAnswer = parseFloat(record.correct_answer || record.answer || '0');
      data.tolerance = parseFloat(record.tolerance || '0');
      data.unit = record.unit || '';
      data.explanation = record.explanation || '';
      break;

    case 'TrueFalse':
      const answer = (record.correct_answer || record.answer || 'false').toLowerCase();
      data.correctAnswer = answer === 'true' || answer === '1';
      data.explanation = record.explanation || '';
      break;

    case 'SRT':
    case 'WAT':
    case 'Interview':
      data.minWords = parseInt(record.min_words || record.minWords || '15', 10);
      
      let criteria: string[] = [];
      if (record.evaluation_criteria) {
        try {
          criteria = JSON.parse(record.evaluation_criteria);
        } catch {
          criteria = record.evaluation_criteria.split('|').map((c: string) => c.trim());
        }
      } else if (record.evaluationCriteria) {
        try {
          criteria = JSON.parse(record.evaluationCriteria);
        } catch {
          criteria = [record.evaluationCriteria];
        }
      } else {
        // Default criteria based on type
        if (questionType === 'SRT') {
          criteria = ['Initiative', 'Decision Making', 'Leadership'];
        } else if (questionType === 'WAT') {
          criteria = ['Positive Thinking', 'Initiative'];
        } else {
          criteria = ['Communication', 'Responsibility', 'Initiative'];
        }
      }

      data.evaluationCriteria = criteria;
      break;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// Transform Record
// ─────────────────────────────────────────────────────────────

function transformRecord(record: any, index: number, filename: string): any {
  const questionType = detectQuestionType(record);
  const category = detectCategory(record, filename);
  const subcategory = detectSubcategory(record, category, filename);
  const difficulty = detectDifficulty(record);

  // Generate ID if missing
  let id = record.id || record.ID;
  if (!id) {
    const prefix = questionType.substring(0, 3).toUpperCase();
    const num = String(index + 1).padStart(3, '0');
    id = `${prefix}-${num}`;
  }

  // Get question text
  const question = record.question || record.Question || record.text || '';

  // Build answer data
  const answerData = buildAnswerData(record, questionType);

  // Parse tags
  let tags: string[] = [];
  if (record.tags) {
    try {
      tags = JSON.parse(record.tags);
    } catch {
      tags = record.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
  } else {
    // Auto-generate tags
    tags = [questionType.toLowerCase()];
    if (subcategory) tags.push(subcategory.toLowerCase());
    if (difficulty === 'Hard') tags.push('challenging');
  }

  // XP reward
  let xpReward = parseInt(record.xp_reward || record.points || '0', 10);
  if (xpReward === 0) {
    // Default XP based on type and difficulty
    const baseXP = {
      'MCQ': 10,
      'SingleWord': 10,
      'Numeric': 10,
      'RapidResponse': 15,
      'TrueFalse': 10,
      'SRT': 20,
      'WAT': 15,
      'Interview': 25,
    }[questionType] || 10;

    const difficultyMultiplier = {
      'Easy': 1.0,
      'Medium': 1.2,
      'Hard': 1.5,
    }[difficulty] || 1.0;

    xpReward = Math.round(baseXP * difficultyMultiplier);
  }

  // Time limit
  const timeLimit = record.time_limit ? parseInt(record.time_limit, 10) : 
                    (questionType === 'RapidResponse' ? 20 : null);

  return {
    id,
    category,
    subcategory: subcategory || '',
    difficulty,
    question_type: questionType,
    question,
    prompt: record.prompt || '',
    answer_data: JSON.stringify(answerData),
    xp_reward: xpReward,
    time_limit: timeLimit || '',
    tags: JSON.stringify(tags),
    source: record.source || path.basename(filename, '.csv'),
    active: record.active !== 'false',
  };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx ts-node scripts/prepare-csv.ts <input.csv> <output.csv>');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`\n📂 Reading ${inputPath}...`);

  // Read input CSV
  const fileContent = fs.readFileSync(inputPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  console.log(`   ✅ ${records.length} records\n`);

  // Transform records
  console.log('🔄 Transforming records...\n');
  const transformed = records.map((record: any, index: number) => 
    transformRecord(record, index, path.basename(inputPath))
  );

  // Write output CSV
  const output = stringify(transformed, {
    header: true,
    columns: [
      'id',
      'category',
      'subcategory',
      'difficulty',
      'question_type',
      'question',
      'prompt',
      'answer_data',
      'xp_reward',
      'time_limit',
      'tags',
      'source',
      'active',
    ],
  });

  fs.writeFileSync(outputPath, output);

  console.log(`✅ Output saved: ${outputPath}`);
  console.log(`   ${transformed.length} records transformed\n`);

  // Show summary
  const byType = transformed.reduce((acc: any, r: any) => {
    acc[r.question_type] = (acc[r.question_type] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 By Type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type.padEnd(20)} ${count}`);
  });

  console.log('\n✨ Ready for import!\n');
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
