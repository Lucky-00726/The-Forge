const path = require('path');

// Add the workspace node_modules to resolve dependencies
module.paths.push('c:/Users/sharm/Downloads/The Forge/forge/node_modules');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables using dotenv from workspace
require('c:/Users/sharm/Downloads/The Forge/forge/node_modules/dotenv').config({
  path: 'c:/Users/sharm/Downloads/The Forge/forge/.env'
});

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in process.env!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const SRT_OVERRIDES = {
  'SRT0110': {
    question: "While walking back to the academy, he spots his sister being harassed and followed closely by two aggressive local goons.",
    correct_answer: "Intervened immediately, neutralized the threat, ensured her safety, and reported the incident to the local patrol."
  },
  'SRT0111': {
    question: "While rushing an injured colleague to the military hospital on a motorbike, he is stopped by a traffic cop for not wearing a helmet.",
    correct_answer: "Explained the medical emergency calmly, showed the patient, coordinate with the officer to reach the hospital quickly, and paid any fine later."
  },
  'SRT0115': {
    question: "His family home is hit by sudden flood damage and urgently needs repair funds, but his monthly salary has been delayed.",
    correct_answer: "Applied for an emergency army welfare loan, secured temporary accommodation for his family, and restored the house promptly."
  },
  'SRT0116': {
    question: "He is leading a critical joint-service briefing and his transport breaks down 5 km from the headquarters with only 15 minutes left.",
    correct_answer: "Informed the organizers of the delay, hitchhiked or took an alternative local ride, and delivered the briefing on time."
  },
  'SRT0117': {
    question: "He is assigned a cabin partner in the training academy who is extremely uncooperative, aloof, and regularly disturbs his study hours.",
    correct_answer: "Initiated a friendly conversation, understood his concerns, established shared study-hour guidelines, and developed mutual respect."
  },
  'SRT0119': {
    question: "During a crucial service promotional exam, he catches his close teammate and friend using unauthorized reference notes.",
    correct_answer: "Warned him quietly to stop immediately, helped him prepare thoroughly for the subsequent papers, and maintained integrity."
  },
  'SRT0121': {
    question: "He faces severe difficulty grasping advanced tactical navigation math during officer cadet training, falling behind class averages.",
    correct_answer: "Sought guidance from instructors, did extra practice sessions after hours with peers, and successfully cleared the assessments."
  },
  'SRT0124': {
    question: "While walking down a secluded road in the evening with a female friend, two miscreants block their path and make inappropriate advances.",
    correct_answer: "Kept his composure, stood firmly between them, defused the situation verbally while escorting his friend to a populated area, and alerted patrol."
  },
  'SRT0135': {
    question: "During tactical planning exercises, his well-reasoned team recommendations are frequently ignored or talked over by louder members.",
    correct_answer: "Waited for a pause, presented his points clearly with logical facts, won the team's consensus, and contributed to mission success."
  },
  'SRT0137': {
    question: "He finds that his current junior officer salary is insufficient to support his retired father's mounting specialized medical bills.",
    correct_answer: "Applied for authorized military medical benefits, managed household expenses prudently, and ensured his father received top treatment."
  }
};

function parseMCQAnswer(record) {
  const options = [
    record.option_a || '',
    record.option_b || '',
    record.option_c || '',
    record.option_d || ''
  ].map(o => o.trim()).filter(Boolean);

  let correctIndex = 0;
  const ans = (record.correct_answer || '').trim().toUpperCase();
  if (ans === 'A' || ans === '0') correctIndex = 0;
  else if (ans === 'B' || ans === '1') correctIndex = 1;
  else if (ans === 'C' || ans === '2') correctIndex = 2;
  else if (ans === 'D' || ans === '3') correctIndex = 3;

  return {
    options,
    correctIndex,
    explanation: record.explanation || ''
  };
}

// Modular transformers mapping sheet question types/categories to answer_data schemas
const ANSWER_DATA_TRANSFORMERS = {
  MCQ: (record, expl) => parseMCQAnswer(record),
  RapidResponse: (record, expl) => {
    const correctVal = (record.correct_answer || '').trim();
    return {
      correctAnswer: correctVal,
      acceptableAnswers: [correctVal.toLowerCase().trim()],
      explanation: expl
    };
  },
  SingleWord: (record, expl) => {
    const correctVal = (record.correct_answer || '').trim();
    return {
      correctAnswer: correctVal,
      acceptableAnswers: [correctVal.toLowerCase().trim()],
      explanation: expl
    };
  },
  Numeric: (record, expl) => {
    const correctVal = (record.correct_answer || '').trim();
    return {
      correctAnswer: parseFloat(correctVal) || 0,
      explanation: expl
    };
  },
  TrueFalse: (record, expl) => {
    const correctVal = (record.correct_answer || '').trim();
    return {
      correctAnswer: correctVal.toUpperCase() === 'TRUE',
      explanation: expl
    };
  },
  SRT: (record, expl) => {
    const wordLimitVal = parseInt(record.word_limit, 10);
    return {
      explanation: expl,
      minWords: 10,
      maxWords: isNaN(wordLimitVal) ? 20 : wordLimitVal,
      evaluationCriteria: ['Logic', 'Consistency']
    };
  },
  WAT: (record, expl) => {
    const wordLimitVal = parseInt(record.word_limit, 10);
    return {
      explanation: expl,
      minWords: 1,
      maxWords: isNaN(wordLimitVal) ? 4 : wordLimitVal,
      evaluationCriteria: ['Logic', 'Consistency']
    };
  },
  Interview: (record, expl, qCat) => {
    const wordLimitVal = parseInt(record.word_limit, 10);
    let minW = 20;
    let maxW = isNaN(wordLimitVal) ? 40 : wordLimitVal;
    if (qCat === 'SelfDescription') {
      minW = 50;
      maxW = isNaN(wordLimitVal) ? 100 : wordLimitVal;
    } else if (qCat === 'Lecturette') {
      minW = 100;
      maxW = isNaN(wordLimitVal) ? 150 : wordLimitVal;
    } else if (qCat === 'GroupDiscussion') {
      minW = 30;
      maxW = isNaN(wordLimitVal) ? 50 : wordLimitVal;
    }
    return {
      explanation: expl,
      minWords: minW,
      maxWords: maxW,
      evaluationCriteria: (() => {
        if (qCat === 'SelfDescription') return ['Communication', 'Self-Awareness', 'Honesty'];
        if (qCat === 'Lecturette') return ['Communication', 'Knowledge', 'Organization'];
        if (qCat === 'GroupDiscussion') return ['Communication', 'Leadership', 'Teamwork'];
        return ['Logic', 'Consistency'];
      })()
    };
  }
};

function parseStagingRecord(record, idx) {
  // Requirement 6: Use content_id if present for stable unique ID, fallback to id
  const rawId = (record.content_id || record.id || '').trim();
  const rawType = (record.question_type || '').trim();
  const rawCat = (record.category || '').trim();
  const rawSub = (record.subcategory || '').trim();

  // Determine target question_type and question_category
  let qType = 'MCQ';
  let qCat = 'OIR';

  const typeLower = rawType.toLowerCase();
  if (typeLower === 'mcq') {
    qType = 'MCQ';
    qCat = 'OIR';
  } else if (typeLower === 'singleword' || typeLower === 'single_word') {
    qType = 'SingleWord';
    qCat = 'OIR';
  } else if (typeLower === 'numeric') {
    qType = 'Numeric';
    qCat = 'OIR';
  } else if (typeLower === 'truefalse' || typeLower === 'true_false') {
    qType = 'TrueFalse';
    qCat = 'OIR';
  } else if (typeLower === 'rapidresponse' || typeLower === 'rapid_response') {
    qType = 'RapidResponse';
    qCat = 'OIR';
  } else if (typeLower === 'srt') {
    qType = 'SRT';
    qCat = 'SRT';
  } else if (typeLower === 'wat') {
    qType = 'WAT';
    qCat = 'WAT';
  } else if (typeLower === 'personal interview' || typeLower === 'personalinterview' || typeLower === 'interview') {
    qType = 'Interview';
    qCat = 'Interview';
  } else if (typeLower === 'lecturette') {
    qType = 'Interview';
    qCat = 'Lecturette';
  } else if (typeLower === 'group discussion' || typeLower === 'groupdiscussion') {
    qType = 'Interview';
    qCat = 'GroupDiscussion';
  } else if (typeLower === 'self description' || typeLower === 'selfdescription') {
    qType = 'Interview';
    qCat = 'SelfDescription';
  } else if (typeLower === 'oir') {
    qType = 'SingleWord';
    qCat = 'OIR';
  }

  // Fallbacks for session & module
  let sessionVal = (record.session || '').trim();
  if (!sessionVal) {
    if (rawId.startsWith('DEF-')) {
      sessionVal = 'Session1';
    } else if (['MCQ', 'SingleWord', 'Numeric', 'TrueFalse', 'RapidResponse'].includes(qType)) {
      sessionVal = 'Session2';
    } else {
      sessionVal = 'Session3';
    }
  }

  let moduleVal = (record.module || '').trim();
  if (!moduleVal) {
    if (rawId.startsWith('DEF-')) {
      moduleVal = 'MCQ';
    } else {
      moduleVal = qType;
      // map standard modules
      if (qCat === 'Lecturette') moduleVal = 'Lecturette';
      else if (qCat === 'GroupDiscussion') moduleVal = 'GroupDiscussion';
      else if (qCat === 'SelfDescription') moduleVal = 'SelfDescription';
    }
  }

  // SRT quality overriding/rewriting
  let finalQuestionText = record.question || '';
  let finalCorrectAnswer = record.correct_answer || '';
  if (qType === 'SRT' && SRT_OVERRIDES[rawId]) {
    finalQuestionText = SRT_OVERRIDES[rawId].question;
    finalCorrectAnswer = SRT_OVERRIDES[rawId].correct_answer;
  }

  const expl = record.explanation || '';

  // Fallbacks for timers
  let timeLimitSecs = parseInt(record.time_limit_seconds || record.time_limit, 10);
  if (isNaN(timeLimitSecs)) {
    if (sessionVal === 'Session1') {
      timeLimitSecs = 45;
    } else if (sessionVal === 'Session2') {
      timeLimitSecs = (qType === 'RapidResponse') ? 20 : 30;
    } else {
      if (moduleVal === 'WAT') timeLimitSecs = 15;
      else if (moduleVal === 'SRT') timeLimitSecs = 30;
      else if (moduleVal === 'Lecturette') timeLimitSecs = 180;
      else timeLimitSecs = 120; // default for Interview/GD/SD
    }
  }

  let xpVal = parseInt(record.xp || record.xp_reward, 10);
  if (isNaN(xpVal)) {
    xpVal = 10;
  }

  // Requirement 8: Execute modular transformer based on type
  const transformer = ANSWER_DATA_TRANSFORMERS[qType] || ANSWER_DATA_TRANSFORMERS.MCQ;
  const answerData = transformer(record, expl, qCat);

  // Requirement 5: Keep rich learning content inside answer_data dynamically
  if (record.fun_fact) answerData.fun_fact = record.fun_fact;
  if (record.memory_tip) answerData.memory_tip = record.memory_tip;
  if (record.image_url) answerData.image_url = record.image_url;
  if (record.video_url) answerData.video_url = record.video_url;
  if (record.references) answerData.references = record.references;

  // Parse tags array
  let tagsArray = [];
  if (record.tags) {
    try {
      if (record.tags.startsWith('[')) {
        tagsArray = JSON.parse(record.tags);
      } else {
        tagsArray = record.tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    } catch {
      tagsArray = record.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  if (!rawId) {
    throw new Error(`Row ${idx + 2} is missing a stable content_id or id.`);
  }

  const rawDay = (record.day || '').toString().trim();
  let dayVal = null;
  if (rawDay !== '') {
    if (!/^\d+$/.test(rawDay)) {
      throw new Error(`Row ${idx + 2} (${rawId}) has invalid day format: "${rawDay}". Must be integer 1-30 or blank.`);
    }
    dayVal = parseInt(rawDay, 10);
    if (dayVal < 1 || dayVal > 30) {
      throw new Error(`Row ${idx + 2} (${rawId}) has out-of-bounds day value: ${dayVal}. Must be between 1 and 30.`);
    }
  }

  const seq = parseInt(record.sequence_order, 10);

  // Requirement 7: Skip editor-only columns (notes, reviewed_by, etc.)
  return {
    id: rawId,
    source_name: 'beta-import',
    category: rawCat || 'General Knowledge',
    subcategory: rawSub || null,
    difficulty: (() => {
      let diff = (record.difficulty || 'Medium').trim();
      diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
      return (diff === 'Easy' || diff === 'Medium' || diff === 'Hard') ? diff : 'Medium';
    })(),
    question_type: qType,
    question: finalQuestionText,
    prompt: record.prompt || null,
    answer_data: answerData,
    xp_reward: xpVal,
    time_limit: timeLimitSecs,
    tags: tagsArray,
    source: record.source || 'Google Sheet',
    active: record.active !== 'false' && record.active !== 'FALSE',
    status: 'approved',
    question_category: qCat,
    import_status: 'pending',
    sequence_order: isNaN(seq) ? (idx + 1) : seq,

    // Session and Module database fields
    session: sessionVal,
    module: moduleVal,
    day: dayVal
  };
}

async function importData() {
  console.log('\n==================================================');
  console.log('STEP 2: Seeding Question Tables from Google Sheets');
  console.log('==================================================');

  let csvData;
  const localIdx = process.argv.indexOf('--local');
  if (localIdx !== -1 && process.argv[localIdx + 1]) {
    const localPath = process.argv[localIdx + 1];
    console.log(`Reading local CSV from: ${localPath}`);
    const fs = require('fs');
    csvData = fs.readFileSync(localPath, 'utf8');
  } else {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYJrADaXkcTrfJWYu9mQPfyQu_d2FLm5EOA0SUiE2LmRXsQYizSHTGc64SODF8DSl1ET72iIKi2M10/pub?output=csv';
    console.log(`Fetching Google Sheet content from: ${sheetUrl}`);
    try {
      const res = await fetch(sheetUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      csvData = await res.text();
      console.log(`   ✅ Fetched ${csvData.length} bytes from Google Sheet.`);
    } catch (err) {
      console.error(`❌ Failed to fetch Google Sheet:`, err.message);
      process.exit(1);
    }
  }

  const rows = parse(csvData, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
  console.log(`   ✅ Parsed ${rows.length} rows.`);

  const stagingRecords = [];
  const missingIdRows = [];
  rows.forEach((row, idx) => {
    const rawId = (row.content_id || row.id || '').trim();
    if (!rawId) {
      missingIdRows.push({
        rowNum: idx + 2,
        question: row.question || '',
        session: row.session || '',
        question_type: row.question_type || '',
      });
    } else {
      try {
        const rec = parseStagingRecord(row, idx);
        stagingRecords.push(rec);
      } catch (err) {
        missingIdRows.push({
          rowNum: idx + 2,
          question: row.question || '',
          session: row.session || '',
          question_type: row.question_type || '',
          error: err.message
        });
      }
    }
  });

  if (missingIdRows.length > 0) {
    console.error(`\n❌ ERROR: ${missingIdRows.length} rows have validation or ID errors!`);
    console.error(`Stable identifiers (content_id or id) are required. Random ID generation is disabled.`);
    console.error(`Affected rows:`);
    missingIdRows.forEach((item) => {
      console.error(`  - Row ${item.rowNum} [Session: ${item.session}, Type: ${item.question_type}]: error="${item.error || 'Missing stable ID'}"`);
    });
    console.error(`\nImport aborted. Please update the Google Sheet so all questions are valid.\n`);
    process.exit(1);
  }

  // Group and validate staging records for 30-day curriculum structure
  const countsByDaySession = {};
  const typeCountsByDaySession = {};

  stagingRecords.forEach(rec => {
    if (rec.active && rec.day !== null) {
      const day = rec.day;
      const sess = rec.session;
      const type = rec.question_type;

      if (!countsByDaySession[day]) {
        countsByDaySession[day] = { Session1: 0, Session2: 0, Session3: 0 };
        typeCountsByDaySession[day] = {
          Session1: {},
          Session2: {},
          Session3: {}
        };
      }

      countsByDaySession[day][sess] = (countsByDaySession[day][sess] || 0) + 1;
      typeCountsByDaySession[day][sess][type] = (typeCountsByDaySession[day][sess][type] || 0) + 1;
    }
  });

  const validationErrors = [];

  for (let day = 1; day <= 30; day++) {
    const counts = countsByDaySession[day] || { Session1: 0, Session2: 0, Session3: 0 };
    const types = typeCountsByDaySession[day] || { Session1: {}, Session2: {}, Session3: {} };

    // Session 1 Validation (exactly 12 questions)
    if (counts.Session1 !== 12) {
      validationErrors.push(`Day ${day}: Session 1 has ${counts.Session1} active questions (expected exactly 12).`);
    }

    // Session 2 Validation (exactly 12 questions with 3/3/2/2/2 distribution)
    if (counts.Session2 !== 12) {
      validationErrors.push(`Day ${day}: Session 2 has ${counts.Session2} active questions (expected exactly 12).`);
    } else {
      const mcq = types.Session2.MCQ || 0;
      const sw = types.Session2.SingleWord || 0;
      const tf = types.Session2.TrueFalse || 0;
      const rr = types.Session2.RapidResponse || 0;
      const num = types.Session2.Numeric || 0;

      if (mcq !== 3 || sw !== 3 || tf !== 2 || rr !== 2 || num !== 2) {
        validationErrors.push(`Day ${day}: Session 2 question type distribution is invalid. Found MCQ: ${mcq}, SingleWord: ${sw}, TrueFalse: ${tf}, RapidResponse: ${rr}, Numeric: ${num} (expected exactly 3 MCQ, 3 SingleWord, 2 TrueFalse, 2 RapidResponse, 2 Numeric).`);
      }
    }

    // Session 3 Validation (exactly 10 questions with 4/3/3 distribution)
    if (counts.Session3 !== 10) {
      validationErrors.push(`Day ${day}: Session 3 has ${counts.Session3} active questions (expected exactly 10).`);
    } else {
      const srt = types.Session3.SRT || 0;
      const wat = types.Session3.WAT || 0;
      const interview = types.Session3.Interview || 0;

      if (srt !== 4 || wat !== 3 || interview !== 3) {
        validationErrors.push(`Day ${day}: Session 3 question type distribution is invalid. Found SRT: ${srt}, WAT: ${wat}, Interview: ${interview} (expected exactly 4 SRT, 3 WAT, 3 Interview).`);
      }
    }
  }

  if (validationErrors.length > 0) {
    console.error(`\n❌ CURRICULUM VALIDATION FAILED! Import aborted before deleting database tables.`);
    console.error(`Found ${validationErrors.length} errors:`);
    validationErrors.forEach(err => console.error(`  - ${err}`));
    console.error(`\nYour production database question bank has NOT been modified.\n`);
    process.exit(1);
  }

  console.log('🎉 Curriculum validation passed! All 30 days have correct question counts and distributions.');

  // Only wipe staging and active tables AFTER curriculum validation passes
  console.log('Wiping public.questions and import_staging_questions tables...');
  await supabase.from('questions').delete().neq('id', 'WIPE_ALL_TRICK');
  await supabase.from('import_staging_questions').delete().neq('id', 'WIPE_ALL_TRICK');
  console.log('   ✅ Tables cleaned');

  console.log(`Total records prepared for staging: ${stagingRecords.length}`);

  // Insert to import_staging_questions in batches of 100
  const batchSize = 100;
  for (let i = 0; i < stagingRecords.length; i += batchSize) {
    const batch = stagingRecords.slice(i, i + batchSize);
    console.log(`   Upserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} rows)...`);
    const { error } = await supabase.from('import_staging_questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`❌ Batch upsert failed:`, error.message);
      process.exit(1);
    }
  }

  console.log('✅ Staging upload complete. Executing atomic questions replacement transaction via RPC...');

  const { error: publishError } = await supabase.rpc('replace_question_bank', { p_source_name: 'beta-import' });
  if (publishError) {
    console.error('❌ Failed to run replace_question_bank RPC:', publishError.message);
    process.exit(1);
  }

  console.log('✅ Database questions populated!');
}

async function verifyImports() {
  console.log('\n==================================================');
  console.log('STEP 3: Verifying Database and Import Gaps');
  console.log('==================================================');

  const { count: qCount, error: qError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (qError) {
    console.log('❌ Verification query failed (migrations may not be applied yet):', qError.message);
    return;
  }

  console.log(`Total questions in public.questions: ${qCount}`);

  const countsBySource = {};
  const countsByType = {};

  let start = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('questions')
      .select('question_type, source')
      .range(start, start + pageSize - 1);

    if (error) {
      console.error('❌ Error fetching verification page:', error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      data.forEach((row) => {
        countsBySource[row.source] = (countsBySource[row.source] || 0) + 1;
        countsByType[row.question_type] = (countsByType[row.question_type] || 0) + 1;
      });
      start += pageSize;
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  console.log('\nBreakdown by Source file:');
  Object.entries(countsBySource).forEach(([src, cnt]) => {
    console.log(`  - ${src}: ${cnt}`);
  });

  console.log('\nBreakdown by Question Type:');
  Object.entries(countsByType).forEach(([t, cnt]) => {
    console.log(`  - ${t}: ${cnt}`);
  });
}

async function runDeploy() {
  await importData();
  await verifyImports();
}

runDeploy().catch(err => {
  console.error("Fatal deployment error:", err);
  process.exit(1);
});
