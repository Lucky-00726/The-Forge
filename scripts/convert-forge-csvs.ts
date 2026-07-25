// ─────────────────────────────────────────────────────────────
// THE FORGE — Custom CSV Converter
// Converts Forge-specific CSV formats to standard import format
// Usage: npx ts-node scripts/convert-forge-csvs.ts <input-folder> <output-folder>
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// ─────────────────────────────────────────────────────────────
// Converter Functions
// ─────────────────────────────────────────────────────────────

function convertSelfDescription(records: any[]): any[] {
  return records.map((record, index) => {
    const id = record.forge_id || `SD-${String(index + 1).padStart(3, '0')}`;
    
    return {
      id,
      category: 'Communication',
      subcategory: 'Self Description',
      difficulty: 'Medium',
      question_type: 'Interview',
      question: record.question,
      prompt: 'Speak for 3-4 minutes about this topic. Be honest and reflective.',
      answer_data: JSON.stringify({
        minWords: 100,
        evaluationCriteria: ['Communication', 'Self-Awareness', 'Honesty']
      }),
      xp_reward: 20,
      time_limit: '',
      tags: JSON.stringify(['self-description', record.section?.toLowerCase() || 'personal']),
      source: 'Forge Self Description Dataset',
      active: record.status === 'approved'
    };
  });
}

function convertLecturette(records: any[]): any[] {
  return records.map((record, index) => {
    const id = record.forge_id || `LECT-${String(index + 1).padStart(4, '0')}`;
    
    // Map difficulty: Low/Medium/High to Easy/Medium/Hard
    let difficulty = 'Medium';
    if (record.difficulty === 'Low') difficulty = 'Easy';
    if (record.difficulty === 'High') difficulty = 'Hard';
    
    // Parse keywords
    let tags: string[] = ['lecturette'];
    if (record.keywords) {
      const keywords = record.keywords.split(',').map((k: string) => k.trim().toLowerCase());
      tags = [...tags, ...keywords];
    }
    
    return {
      id,
      category: 'Communication',
      subcategory: 'Lecturette',
      difficulty,
      question_type: 'Interview',
      question: `Give a 3-minute lecturette on: ${record.topic}`,
      prompt: 'Organize your thoughts and speak clearly for exactly 3 minutes.',
      answer_data: JSON.stringify({
        minWords: 150,
        evaluationCriteria: ['Communication', 'Knowledge', 'Organization']
      }),
      xp_reward: difficulty === 'Hard' ? 30 : difficulty === 'Medium' ? 25 : 20,
      time_limit: '',
      tags: JSON.stringify(tags),
      source: 'Forge Lecturette Dataset',
      active: record.status === 'approved'
    };
  });
}

function convertGroupDiscussion(records: any[]): any[] {
  return records.map((record, index) => {
    const id = record.forge_id || `GD-${String(index + 1).padStart(4, '0')}`;
    
    let difficulty = 'Medium';
    if (record.difficulty === 'Low') difficulty = 'Easy';
    if (record.difficulty === 'High') difficulty = 'Hard';
    
    return {
      id,
      category: 'GTO Tasks',
      subcategory: 'Group Discussion',
      difficulty,
      question_type: 'Interview',
      question: record.topic,
      prompt: 'Participate actively in group discussion. Share your views clearly.',
      answer_data: JSON.stringify({
        minWords: 50,
        evaluationCriteria: ['Communication', 'Leadership', 'Teamwork']
      }),
      xp_reward: difficulty === 'Hard' ? 25 : difficulty === 'Medium' ? 20 : 15,
      time_limit: '',
      tags: JSON.stringify(['group-discussion', record.category?.toLowerCase() || 'general']),
      source: record.source || 'Forge GD Dataset',
      active: record.status === 'approved'
    };
  });
}

function convertOIR(records: any[]): any[] {
  const converted: any[] = [];
  
  for (const record of records) {
    const id = record.forge_id || `OIR-${String(converted.length + 1).padStart(4, '0')}`;
    
    let difficulty = 'Medium';
    if (record.difficulty === 'Low') difficulty = 'Easy';
    if (record.difficulty === 'High') difficulty = 'Hard';
    
    // Determine question type based on category
    const category = record.category || record.question_type || '';
    let questionType = 'SingleWord';
    let answerData: any = {};
    
    if (category.includes('Mirror') || category.includes('Figure') || category.includes('Pattern')) {
      // Skip non-verbal reasoning for now (requires images)
      continue;
    }
    
    // Most OIR questions are single-word or short answers
    answerData = {
      correctAnswer: record.answer,
      acceptableAnswers: [record.answer?.toLowerCase()],
      explanation: ''
    };
    
    converted.push({
      id,
      category: 'SSB Fundamentals',
      subcategory: 'OIR',
      difficulty,
      question_type: questionType,
      question: record.question,
      prompt: '',
      answer_data: JSON.stringify(answerData),
      xp_reward: difficulty === 'Hard' ? 15 : difficulty === 'Medium' ? 12 : 10,
      time_limit: '',
      tags: JSON.stringify(['oir', category.toLowerCase().replace(/\s+/g, '-')]),
      source: record.source || 'Forge OIR Dataset',
      active: record.status === 'approved'
    });
  }
  
  return converted;
}

function convertTAT(records: any[]): any[] {
  return records.map((record, index) => {
    const id = record.forge_id || `TAT-${String(index + 1).padStart(4, '0')}`;
    
    let difficulty = 'Medium';
    if (record.difficulty === 'Low') difficulty = 'Easy';
    if (record.difficulty === 'High') difficulty = 'Hard';
    
    // Build question text from title and description
    let questionText = record.title || '';
    if (record.description) {
      questionText += ` - ${record.description}`;
    }
    if (record.theme) {
      questionText = `${record.theme}: ${questionText}`;
    }
    
    return {
      id,
      category: 'Psychological Tests',
      subcategory: 'TAT',
      difficulty,
      question_type: 'SRT',  // TAT stories are similar to SRT format
      question: questionText,
      prompt: 'Write a meaningful story based on this theme. Show positive qualities.',
      answer_data: JSON.stringify({
        minWords: 30,
        evaluationCriteria: ['Initiative', 'Creativity', 'Positive Thinking']
      }),
      xp_reward: difficulty === 'Hard' ? 25 : difficulty === 'Medium' ? 20 : 15,
      time_limit: '',
      tags: JSON.stringify(['tat', record.category?.toLowerCase() || 'theme']),
      source: record.source || 'Forge TAT Dataset',
      active: record.status === 'approved'
    };
  });
}

// ─────────────────────────────────────────────────────────────
// File Processing
// ─────────────────────────────────────────────────────────────

function processFile(inputPath: string, outputPath: string): number {
  const filename = path.basename(inputPath);
  console.log(`\n📄 Processing ${filename}...`);
  
  // Read CSV
  const fileContent = fs.readFileSync(inputPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log(`   Found ${records.length} records`);
  
  // Convert based on file type
  let converted: any[] = [];
  
  if (filename.includes('Self-Description')) {
    converted = convertSelfDescription(records);
  } else if (filename.includes('Lecturette')) {
    converted = convertLecturette(records);
  } else if (filename.includes('GD')) {
    converted = convertGroupDiscussion(records);
  } else if (filename.includes('OIR')) {
    converted = convertOIR(records);
  } else if (filename.includes('TAT')) {
    converted = convertTAT(records);
  } else {
    console.log(`   ⚠️  Unknown file type, skipping`);
    return 0;
  }
  
  if (converted.length === 0) {
    console.log(`   ⚠️  No records converted`);
    return 0;
  }
  
  // Write output CSV
  const output = stringify(converted, {
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
  console.log(`   ✅ Converted ${converted.length} records`);
  console.log(`   💾 Saved to ${path.basename(outputPath)}`);
  
  return converted.length;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔄 THE FORGE — CSV Converter');
  console.log('═'.repeat(70));
  
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('\n❌ Usage: npx ts-node scripts/convert-forge-csvs.ts <input-folder> <output-folder>');
    console.error('\nExample:');
    console.error('  npx ts-node scripts/convert-forge-csvs.ts raw-data content');
    process.exit(1);
  }
  
  const inputFolder = args[0];
  const outputFolder = args[1];
  
  if (!fs.existsSync(inputFolder)) {
    console.error(`\n❌ Input folder not found: ${inputFolder}`);
    process.exit(1);
  }
  
  // Create output folder if it doesn't exist
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
    console.log(`\n📁 Created output folder: ${outputFolder}`);
  }
  
  // Find all CSV files in input folder
  const files = fs.readdirSync(inputFolder)
    .filter(f => f.endsWith('.csv'))
    .map(f => path.join(inputFolder, f));
  
  if (files.length === 0) {
    console.error(`\n❌ No CSV files found in ${inputFolder}`);
    process.exit(1);
  }
  
  console.log(`\n📂 Found ${files.length} CSV file(s)`);
  
  // Process each file
  let totalConverted = 0;
  
  for (const inputPath of files) {
    const filename = path.basename(inputPath);
    const outputPath = path.join(outputFolder, filename.replace('Forge-', '').replace('-Dataset', ''));
    
    try {
      const count = processFile(inputPath, outputPath);
      totalConverted += count;
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`✅ Conversion complete!`);
  console.log(`   Total records converted: ${totalConverted}`);
  console.log(`   Output folder: ${outputFolder}`);
  console.log('═'.repeat(70));
  
  console.log('\n💡 Next steps:');
  console.log(`   1. Review converted files in ${outputFolder}/`);
  console.log(`   2. Run audit: npx ts-node scripts/content-audit.ts ${outputFolder}/*.csv`);
  console.log(`   3. Import: npx ts-node scripts/enhanced-import.ts ${outputFolder}/*.csv\n`);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
