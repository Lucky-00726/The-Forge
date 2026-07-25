// ─────────────────────────────────────────────────────────────
// THE FORGE — Content Audit Script
// Analyzes CSV files before import to identify quality issues
// Usage: npx ts-node scripts/content-audit.ts <file1.csv> [file2.csv] [...]
// ─────────────────────────────────────────────────────────────

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface Question {
  id: string;
  category: string;
  subcategory?: string;
  difficulty: string;
  question_type: string;
  question: string;
  source?: string;
  file: string;
}

interface AuditReport {
  totalQuestions: number;
  uniqueQuestions: number;
  duplicateCount: number;
  duplicates: Array<{
    hash: string;
    questions: Question[];
  }>;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  byFile: Record<string, number>;
  qualityIssues: Array<{
    id: string;
    file: string;
    issue: string;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Content Hash (for duplicate detection)
// ─────────────────────────────────────────────────────────────

function generateContentHash(question: Question): string {
  // Normalize question text for comparison
  const normalized = question.question
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
  
  return crypto
    .createHash('sha256')
    .update(`${question.question_type}|${normalized}`)
    .digest('hex');
}

// ─────────────────────────────────────────────────────────────
// Parse CSV Files
// ─────────────────────────────────────────────────────────────

function parseCSV(filePath: string): Question[] {
  console.log(`📄 Reading ${path.basename(filePath)}...`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  let records: any[];
  try {
    records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch (err: any) {
    console.error(`   ❌ Parse error: ${err.message}`);
    return [];
  }

  const questions: Question[] = records.map(record => ({
    id: record.id || 'NO_ID',
    category: record.category || 'Unknown',
    subcategory: record.subcategory,
    difficulty: record.difficulty || 'Unknown',
    question_type: record.question_type || 'Unknown',
    question: record.question || '',
    source: record.source,
    file: path.basename(filePath),
  }));

  console.log(`   ✅ ${questions.length} questions\n`);
  return questions;
}

// ─────────────────────────────────────────────────────────────
// Analyze Content
// ─────────────────────────────────────────────────────────────

function analyzeContent(questions: Question[]): AuditReport {
  const report: AuditReport = {
    totalQuestions: questions.length,
    uniqueQuestions: 0,
    duplicateCount: 0,
    duplicates: [],
    byCategory: {},
    byType: {},
    byDifficulty: {},
    byFile: {},
    qualityIssues: [],
  };

  // Group by content hash to find duplicates
  const hashMap = new Map<string, Question[]>();

  for (const question of questions) {
    const hash = generateContentHash(question);
    
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash)!.push(question);

    // Count by category/type/difficulty/file
    report.byCategory[question.category] = (report.byCategory[question.category] || 0) + 1;
    report.byType[question.question_type] = (report.byType[question.question_type] || 0) + 1;
    report.byDifficulty[question.difficulty] = (report.byDifficulty[question.difficulty] || 0) + 1;
    report.byFile[question.file] = (report.byFile[question.file] || 0) + 1;

    // Quality checks
    if (!question.id || question.id === 'NO_ID') {
      report.qualityIssues.push({
        id: question.id,
        file: question.file,
        issue: 'Missing ID',
      });
    }

    if (!question.question || question.question.trim().length === 0) {
      report.qualityIssues.push({
        id: question.id,
        file: question.file,
        issue: 'Empty question text',
      });
    }

    if (question.question.length < 10) {
      report.qualityIssues.push({
        id: question.id,
        file: question.file,
        issue: 'Question text too short (<10 chars)',
      });
    }

    if (question.question.length > 500) {
      report.qualityIssues.push({
        id: question.id,
        file: question.file,
        issue: 'Question text very long (>500 chars)',
      });
    }

    if (question.category === 'Unknown' || !question.category) {
      report.qualityIssues.push({
        id: question.id,
        file: question.file,
        issue: 'Missing category',
      });
    }

    if (question.question_type === 'Unknown' || !question.question_type) {
      report.qualityIssues.push({
        id: question.id,
        file: question.file,
        issue: 'Missing question_type',
      });
    }
  }

  // Find duplicates
  for (const [hash, group] of hashMap.entries()) {
    if (group.length > 1) {
      report.duplicates.push({ hash, questions: group });
      report.duplicateCount += group.length - 1; // First occurrence is not a duplicate
    }
  }

  report.uniqueQuestions = hashMap.size;

  return report;
}

// ─────────────────────────────────────────────────────────────
// Print Report
// ─────────────────────────────────────────────────────────────

function printReport(report: AuditReport) {
  console.log('\n' + '═'.repeat(70));
  console.log('📊 CONTENT AUDIT REPORT');
  console.log('═'.repeat(70));

  // Summary
  console.log('\n📈 Summary:');
  console.log(`   Total Questions:      ${report.totalQuestions}`);
  console.log(`   Unique Questions:     ${report.uniqueQuestions}`);
  console.log(`   Duplicates:           ${report.duplicateCount}`);
  console.log(`   Quality Issues:       ${report.qualityIssues.length}`);

  const duplicatePercent = report.totalQuestions > 0
    ? ((report.duplicateCount / report.totalQuestions) * 100).toFixed(1)
    : '0.0';
  console.log(`   Duplicate Rate:       ${duplicatePercent}%`);

  // By File
  if (Object.keys(report.byFile).length > 0) {
    console.log('\n📁 By File:');
    Object.entries(report.byFile)
      .sort((a, b) => b[1] - a[1])
      .forEach(([file, count]) => {
        console.log(`   ${file.padEnd(40)} ${count.toString().padStart(4)}`);
      });
  }

  // By Type
  if (Object.keys(report.byType).length > 0) {
    console.log('\n📝 By Question Type:');
    Object.entries(report.byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type.padEnd(20)} ${count.toString().padStart(4)}`);
      });
  }

  // By Difficulty
  if (Object.keys(report.byDifficulty).length > 0) {
    console.log('\n⚡ By Difficulty:');
    Object.entries(report.byDifficulty)
      .sort((a, b) => {
        const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
      })
      .forEach(([difficulty, count]) => {
        const percent = ((count / report.totalQuestions) * 100).toFixed(1);
        console.log(`   ${difficulty.padEnd(20)} ${count.toString().padStart(4)} (${percent}%)`);
      });
  }

  // By Category
  if (Object.keys(report.byCategory).length > 0) {
    console.log('\n📚 By Category:');
    Object.entries(report.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category.padEnd(35)} ${count.toString().padStart(4)}`);
      });
  }

  // Duplicates
  if (report.duplicates.length > 0) {
    console.log('\n🔄 Duplicate Groups (showing first 20):');
    report.duplicates.slice(0, 20).forEach((dup, index) => {
      console.log(`\n   ${index + 1}. Duplicate group (${dup.questions.length} copies):`);
      dup.questions.forEach(q => {
        console.log(`      • ${q.id} [${q.file}] — ${q.question.substring(0, 60)}...`);
      });
    });

    if (report.duplicates.length > 20) {
      console.log(`\n   ... and ${report.duplicates.length - 20} more duplicate groups`);
    }
  }

  // Quality Issues
  if (report.qualityIssues.length > 0) {
    console.log('\n⚠️  Quality Issues (showing first 30):');
    report.qualityIssues.slice(0, 30).forEach(issue => {
      console.log(`   • ${issue.id.padEnd(15)} [${issue.file.padEnd(25)}] ${issue.issue}`);
    });

    if (report.qualityIssues.length > 30) {
      console.log(`\n   ... and ${report.qualityIssues.length - 30} more issues`);
    }
  }

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (report.duplicateCount > 0) {
    console.log(`   ⚠️  Remove ${report.duplicateCount} duplicate questions before import`);
  } else {
    console.log('   ✅ No duplicates found');
  }

  if (report.qualityIssues.length > 0) {
    console.log(`   ⚠️  Fix ${report.qualityIssues.length} quality issues before import`);
  } else {
    console.log('   ✅ No quality issues found');
  }

  const qualityScore = report.totalQuestions > 0
    ? (((report.totalQuestions - report.duplicateCount - report.qualityIssues.length) / report.totalQuestions) * 10).toFixed(1)
    : '0.0';

  console.log(`\n   Overall Quality Score: ${qualityScore}/10`);

  console.log('\n' + '═'.repeat(70) + '\n');
}

// ─────────────────────────────────────────────────────────────
// Save Report to File
// ─────────────────────────────────────────────────────────────

function saveReport(report: AuditReport) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const reportPath = path.join(__dirname, '..', `CONTENT_AUDIT_REPORT_${timestamp}.md`);

  let markdown = '# Content Audit Report\n\n';
  markdown += `**Generated**: ${new Date().toISOString()}\n\n`;
  markdown += '---\n\n';

  markdown += '## Summary\n\n';
  markdown += `- **Total Questions**: ${report.totalQuestions}\n`;
  markdown += `- **Unique Questions**: ${report.uniqueQuestions}\n`;
  markdown += `- **Duplicates**: ${report.duplicateCount}\n`;
  markdown += `- **Quality Issues**: ${report.qualityIssues.length}\n`;
  markdown += `- **Duplicate Rate**: ${((report.duplicateCount / report.totalQuestions) * 100).toFixed(1)}%\n\n`;

  markdown += '---\n\n';
  markdown += '## By File\n\n';
  markdown += '| File | Count |\n';
  markdown += '|------|-------|\n';
  Object.entries(report.byFile)
    .sort((a, b) => b[1] - a[1])
    .forEach(([file, count]) => {
      markdown += `| ${file} | ${count} |\n`;
    });

  markdown += '\n---\n\n';
  markdown += '## By Question Type\n\n';
  markdown += '| Type | Count |\n';
  markdown += '|------|-------|\n';
  Object.entries(report.byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      markdown += `| ${type} | ${count} |\n`;
    });

  markdown += '\n---\n\n';
  markdown += '## By Difficulty\n\n';
  markdown += '| Difficulty | Count | Percentage |\n';
  markdown += '|------------|-------|------------|\n';
  Object.entries(report.byDifficulty)
    .sort((a, b) => {
      const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
      return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
    })
    .forEach(([difficulty, count]) => {
      const percent = ((count / report.totalQuestions) * 100).toFixed(1);
      markdown += `| ${difficulty} | ${count} | ${percent}% |\n`;
    });

  markdown += '\n---\n\n';
  markdown += '## By Category\n\n';
  markdown += '| Category | Count |\n';
  markdown += '|----------|-------|\n';
  Object.entries(report.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      markdown += `| ${category} | ${count} |\n`;
    });

  if (report.duplicates.length > 0) {
    markdown += '\n---\n\n';
    markdown += '## Duplicate Groups\n\n';
    report.duplicates.forEach((dup, index) => {
      markdown += `### ${index + 1}. Duplicate Group (${dup.questions.length} copies)\n\n`;
      dup.questions.forEach(q => {
        markdown += `- **${q.id}** [${q.file}]\n`;
        markdown += `  > ${q.question.substring(0, 100)}...\n\n`;
      });
    });
  }

  if (report.qualityIssues.length > 0) {
    markdown += '\n---\n\n';
    markdown += '## Quality Issues\n\n';
    markdown += '| ID | File | Issue |\n';
    markdown += '|----|------|-------|\n';
    report.qualityIssues.forEach(issue => {
      markdown += `| ${issue.id} | ${issue.file} | ${issue.issue} |\n`;
    });
  }

  markdown += '\n---\n\n';
  markdown += '## Recommendations\n\n';
  
  if (report.duplicateCount > 0) {
    markdown += `- ⚠️ **Remove ${report.duplicateCount} duplicate questions** before import\n`;
  } else {
    markdown += '- ✅ No duplicates found\n';
  }

  if (report.qualityIssues.length > 0) {
    markdown += `- ⚠️ **Fix ${report.qualityIssues.length} quality issues** before import\n`;
  } else {
    markdown += '- ✅ No quality issues found\n';
  }

  const qualityScore = report.totalQuestions > 0
    ? (((report.totalQuestions - report.duplicateCount - report.qualityIssues.length) / report.totalQuestions) * 10).toFixed(1)
    : '0.0';

  markdown += `\n**Overall Quality Score**: ${qualityScore}/10\n`;

  fs.writeFileSync(reportPath, markdown);
  console.log(`📄 Report saved: ${reportPath}\n`);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔍 THE FORGE — Content Audit');
  console.log('═'.repeat(70) + '\n');

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ No files specified\n');
    console.error('Usage:');
    console.error('  npx ts-node scripts/content-audit.ts <file1.csv> [file2.csv] [...]\n');
    console.error('Example:');
    console.error('  npx ts-node scripts/content-audit.ts data/*.csv\n');
    process.exit(1);
  }

  // Validate all files exist
  const missingFiles = args.filter(f => !fs.existsSync(f));
  if (missingFiles.length > 0) {
    console.error('❌ Files not found:');
    missingFiles.forEach(f => console.error(`   ${f}`));
    console.error('');
    process.exit(1);
  }

  console.log(`📂 Analyzing ${args.length} file(s)...\n`);

  // Parse all files
  const allQuestions: Question[] = [];
  for (const filePath of args) {
    const questions = parseCSV(filePath);
    allQuestions.push(...questions);
  }

  if (allQuestions.length === 0) {
    console.error('❌ No questions found in files\n');
    process.exit(1);
  }

  // Analyze content
  const report = analyzeContent(allQuestions);

  // Print report
  printReport(report);

  // Save report
  saveReport(report);

  console.log('✅ Audit complete\n');
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
