import { parse } from 'csv-parse/sync';
import { supabase } from './supabase';
import type { QuestionType } from '../types/questions';

export type ImportSource = 'csv' | 'google-sheets';

export interface ImportRecord {
  id: string;
  content_type: string;
  question_type: QuestionType;
  category: string;
  subcategory?: string | null;
  question: string;
  prompt?: string | null;
  answer_data: Record<string, unknown>;
  difficulty: string;
  xp_reward: number;
  time_limit?: number | null;
  tags: string[];
  source: string;
  active: boolean;
  status: string;
  question_category: string;
  sequence_order: number;
}

export interface ImportStats {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicatesRemoved: number;
  imported: number;
  failed: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export interface ImportPreview {
  source: ImportSource;
  fileName?: string;
  records: ImportRecord[];
  stats: ImportStats;
}

export interface ImportJobResult {
  success: boolean;
  stats: ImportStats;
  errors: string[];
  importedCount: number;
}

const VALID_TYPES: QuestionType[] = ['MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse', 'SRT', 'WAT', 'Interview'];
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseTags(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') {
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parseTags(parsed) : [];
      } catch {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseAnswerData(record: Record<string, unknown>): Record<string, unknown> {
  const raw = record.answer_data ?? record.answer ?? {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return { value: raw };
    }
  }
  if (raw && typeof raw === 'object') {
    return raw as Record<string, unknown>;
  }
  return {};
}

function inferQuestionType(record: Record<string, unknown>): QuestionType {
  const rawType = normalizeText(record.question_type ?? record.content_type ?? record.type).toLowerCase();
  const map: Record<string, QuestionType> = {
    mcq: 'MCQ',
    singleword: 'SingleWord',
    single_word: 'SingleWord',
    numeric: 'Numeric',
    rapidresponse: 'RapidResponse',
    rapid_response: 'RapidResponse',
    truefalse: 'TrueFalse',
    true_false: 'TrueFalse',
    srt: 'SRT',
    wat: 'WAT',
    interview: 'Interview',
    personalinterview: 'Interview',
  };
  return map[rawType] ?? 'MCQ';
}

function inferQuestionCategory(record: Record<string, unknown>): string {
  const raw = normalizeText(record.question_category ?? record.category ?? record.section).toUpperCase();
  if (raw === 'OIR') return 'OIR';
  if (raw === 'SRT') return 'SRT';
  if (raw === 'WAT') return 'WAT';
  if (raw === 'INTERVIEW' || raw === 'PERSONAL INTERVIEW') return 'Interview';
  if (raw === 'TAT') return 'TAT';
  if (raw === 'LECTURETTE') return 'Lecturette';
  if (raw === 'GROUPDISCUSSION' || raw === 'GD') return 'GroupDiscussion';
  if (raw === 'SELFDESCRIPTION' || raw === 'SD') return 'SelfDescription';
  return 'OIR';
}

function buildRecord(record: Record<string, unknown>, sourceName: string): ImportRecord | null {
  const questionText = normalizeText(record.question ?? record.prompt ?? record.title ?? record.description);
  const contentType = normalizeText(record.content_type ?? record.question_type ?? record.type);
  const questionType = inferQuestionType(record);
  const category = normalizeText(record.category ?? record.section ?? 'General Knowledge');
  const difficulty = normalizeText(record.difficulty ?? 'Medium');
  const questionCategory = inferQuestionCategory(record);
  const id = normalizeText(record.id || record.forge_id || `${questionType}-${Math.random().toString(36).slice(2, 8)}`);

  if (!questionText || !contentType || !VALID_TYPES.includes(questionType) || !VALID_DIFFICULTIES.includes(difficulty)) {
    return null;
  }

  return {
    id,
    content_type: contentType,
    question_type: questionType,
    category,
    subcategory: normalizeText(record.subcategory || record.topic) || null,
    question: questionText,
    prompt: normalizeText(record.prompt || record.description) || null,
    answer_data: parseAnswerData(record),
    difficulty: difficulty || 'Medium',
    xp_reward: Number(record.xp_reward ?? record.xp ?? 10) || 10,
    time_limit: Number(record.time_limit ?? 0) || null,
    tags: parseTags(record.tags ?? record.keywords),
    source: sourceName,
    active: String(record.active ?? 'true') !== 'false',
    status: normalizeText(record.status || 'approved') || 'approved',
    question_category: questionCategory,
    sequence_order: Number(record.sequence_order ?? 0) || 0,
  };
}

function buildUpsertRow(record: ImportRecord): Record<string, unknown> {
  return {
    id: record.id,
    question: record.question,
    category: record.category,
    subcategory: record.subcategory ?? null,
    difficulty: record.difficulty,
    question_type: record.question_type,
    prompt: record.prompt ?? null,
    answer_data: record.answer_data,
    xp_reward: record.xp_reward,
    time_limit: record.time_limit ?? null,
    tags: record.tags,
    source: record.source,
    active: record.active,
    status: record.status,
    question_category: record.question_category,
    sequence_order: record.sequence_order,
  };
}

function createHash(record: ImportRecord): string {
  let hash = 0;
  const value = `${record.question_type}|${record.category}|${record.question}`;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function dedupeRecords(records: ImportRecord[]): { unique: ImportRecord[]; duplicates: ImportRecord[] } {
  const seen = new Map<string, ImportRecord>();
  const duplicates: ImportRecord[] = [];
  for (const record of records) {
    const hash = createHash(record);
    if (seen.has(hash)) {
      duplicates.push(record);
    } else {
      seen.set(hash, record);
    }
  }
  return { unique: Array.from(seen.values()), duplicates };
}

async function parseCsvText(content: string, sourceName: string): Promise<{ rows: Record<string, unknown>[]; records: ImportRecord[] }> {
  const rows = parse(content, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true }) as Record<string, unknown>[];
  const records = rows.map((row) => buildRecord(row, sourceName)).filter((row): row is ImportRecord => Boolean(row));
  return { rows, records };
}

export async function previewImportFromCsv(file: File | { name: string; text: string } | string): Promise<ImportPreview> {
  const text = typeof file === 'string' ? file : typeof file.text === 'function' ? await file.text() : (file.text || '');
  const fileName = typeof file === 'string' ? 'csv-upload' : file.name || 'csv-upload';
  const { rows, records } = await parseCsvText(text, fileName);

  const stats: ImportStats = {
    totalRecords: rows.length,
    validRecords: records.length,
    invalidRecords: rows.length - records.length,
    duplicatesRemoved: 0,
    imported: 0,
    failed: 0,
    byCategory: {},
    byType: {},
    byDifficulty: {},
  };

  for (const record of records) {
    stats.byCategory[record.category] = (stats.byCategory[record.category] ?? 0) + 1;
    stats.byType[record.question_type] = (stats.byType[record.question_type] ?? 0) + 1;
    stats.byDifficulty[record.difficulty] = (stats.byDifficulty[record.difficulty] ?? 0) + 1;
  }

  return { source: 'csv', fileName, records, stats };
}

export async function importContentFromCsv(file: File | { name: string; text: string } | string): Promise<ImportJobResult> {
  const preview = await previewImportFromCsv(file);
  const { unique, duplicates } = dedupeRecords(preview.records);
  const stats = { ...preview.stats, duplicatesRemoved: duplicates.length, validRecords: unique.length };

  const sourceName = 'csv-import';
  const rows = unique.map(buildUpsertRow);

  // 1. Clean up existing pending staging records for this source
  await supabase.from('import_staging_questions').delete().eq('source_name', sourceName).eq('import_status', 'pending');

  // 2. Insert validated new questions to staging table (cast elements as any to prevent strict type mismatch)
  const { error } = await supabase.from('import_staging_questions').upsert(rows.map((row) => ({ ...row, source_name: sourceName, import_status: 'pending' } as any)), { onConflict: 'id' });

  if (error) {
    return { success: false, stats, errors: [error.message], importedCount: 0 };
  }

  // 3. Atomically replace the question bank (validates admin status in SQL)
  const { error: publishError } = await supabase.rpc('replace_question_bank', { p_source_name: sourceName });
  if (publishError) {
    return { success: false, stats, errors: [publishError.message], importedCount: 0 };
  }

  stats.imported = rows.length;
  return { success: true, stats, errors: [], importedCount: rows.length };
}

export async function importContentFromGoogleSheets(url: string): Promise<ImportJobResult> {
  const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!sheetId) {
    return { success: false, stats: emptyStats(), errors: ['Unable to parse Google Sheets URL'], importedCount: 0 };
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  const response = await fetch(csvUrl);
  if (!response.ok) {
    return { success: false, stats: emptyStats(), errors: ['Unable to download Google Sheets export'], importedCount: 0 };
  }
  const content = await response.text();
  const { rows, records } = await parseCsvText(content, 'google-sheets');
  const { unique, duplicates } = dedupeRecords(records);
  const stats = { ...emptyStats(), totalRecords: rows.length, validRecords: unique.length, invalidRecords: rows.length - records.length, duplicatesRemoved: duplicates.length };
  const sourceName = 'google-sheets';
  const upserts = unique.map(buildUpsertRow);

  // 1. Clean up existing pending staging records for this source
  await supabase.from('import_staging_questions').delete().eq('source_name', sourceName).eq('import_status', 'pending');

  // 2. Insert validated new questions to staging table (cast elements as any to prevent strict type mismatch)
  const { error } = await supabase.from('import_staging_questions').upsert(upserts.map((row) => ({ ...row, source_name: sourceName, import_status: 'pending' } as any)), { onConflict: 'id' });
  if (error) {
    return { success: false, stats, errors: [error.message], importedCount: 0 };
  }

  // 3. Atomically replace the question bank (validates admin status in SQL)
  const { error: publishError } = await supabase.rpc('replace_question_bank', { p_source_name: sourceName });
  if (publishError) {
    return { success: false, stats, errors: [publishError.message], importedCount: 0 };
  }
  stats.imported = upserts.length;
  return { success: true, stats, errors: [], importedCount: upserts.length };
}

function emptyStats(): ImportStats {
  return {
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    duplicatesRemoved: 0,
    imported: 0,
    failed: 0,
    byCategory: {},
    byType: {},
    byDifficulty: {},
  };
}
