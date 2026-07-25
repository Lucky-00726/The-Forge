// ─────────────────────────────────────────────────────────────
// THE FORGE — Content Service
// Compatibility layer over the new CSV-driven content pipeline.
// ─────────────────────────────────────────────────────────────

import { supabase } from './supabase';
import { getDailySessionQuestions } from './content-pipeline';
import type {
  Question,
  QuestionRow,
  SessionQueryParams,
  MixedSessionQueryParams,
  QuestionType,
} from '../types/questions';

function isQuestionRow(row: any): row is QuestionRow {
  return row && typeof row.id === 'string' && typeof row.question === 'string';
}

async function fetchSession1Raw(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .eq('question_type', 'MCQ')
    .limit(10);

  if (error || !data) return [];
  return data.filter(isQuestionRow).map((row) => ({ ...row, answer_data: row.answer_data } as Question));
}

async function fetchSession2Raw(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .in('question_type', ['MCQ', 'SingleWord', 'Numeric', 'RapidResponse', 'TrueFalse'])
    .limit(40);

  if (error || !data) return [];
  return data.filter(isQuestionRow).map((row) => ({ ...row, answer_data: row.answer_data } as Question));
}

async function fetchSession3Raw(): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .in('question_type', ['SRT', 'WAT', 'Interview'])
    .limit(40);

  if (error || !data) return [];
  return data.filter(isQuestionRow).map((row) => ({ ...row, answer_data: row.answer_data } as Question));
}

async function getQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.rpc('get_questions_by_ids', { p_ids: ids });
  if (error || !data) return [];
  return (data as any[]).filter(isQuestionRow).map((row) => ({ ...row, answer_data: row.answer_data } as Question));
}

export async function getSession1Questions(): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const questions = await fetchSession1Raw();
    return questions.length > 0 ? { success: true, data: questions } : { success: false, data: [], error: 'No questions available' };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getSession2Questions(): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const questions = await fetchSession2Raw();
    return questions.length > 0 ? { success: true, data: questions } : { success: false, data: [], error: 'No questions available' };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getSession3Questions(): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const questions = await fetchSession3Raw();
    return questions.length > 0 ? { success: true, data: questions } : { success: false, data: [], error: 'No questions available' };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getPinnedSession1Questions(userId: string): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const questions = await getDailySessionQuestions(userId, 1);
    return questions.length > 0 ? { success: true, data: questions } : { success: false, data: [], error: 'No questions available' };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getPinnedSession2Questions(userId: string): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const questions = await getDailySessionQuestions(userId, 2);
    return questions.length > 0 ? { success: true, data: questions } : { success: false, data: [], error: 'No questions available' };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getPinnedSession3Questions(userId: string): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const questions = await getDailySessionQuestions(userId, 3);
    return questions.length > 0 ? { success: true, data: questions } : { success: false, data: [], error: 'No questions available' };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getQuestions(params: SessionQueryParams): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_session_questions', {
      p_question_types: params.questionTypes,
      p_count: params.count,
      p_difficulty: params.difficulty || null,
      p_category: params.category || null,
      p_exclude_ids: params.excludeIds || [],
    });

    if (error) return { success: false, data: [], error: error.message };
    const questions = (data || []).filter(isQuestionRow).map((row: any) => ({ ...row, answer_data: row.answer_data } as Question));
    return { success: true, data: questions };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getMixedQuestions(params: MixedSessionQueryParams): Promise<{ success: boolean; data: Question[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_mixed_session_questions', {
      p_type_counts: params.typeCounts,
      p_difficulty: params.difficulty || null,
      p_exclude_ids: params.excludeIds || [],
    });

    if (error) return { success: false, data: [], error: error.message };
    const questions = (data || []).filter(isQuestionRow).map((row: any) => ({ ...row, answer_data: row.answer_data } as Question));
    return { success: true, data: questions };
  } catch (err) {
    return { success: false, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function previewSessionImport(file: any): Promise<any> {
  throw new Error('Import wizard is disabled in production client');
}

export async function importSessionContent(file: any): Promise<any> {
  throw new Error('Import wizard is disabled in production client');
}

export async function importSessionContentFromGoogleSheets(url: string): Promise<any> {
  throw new Error('Import wizard is disabled in production client');
}

export async function preloadSessionQuestions(): Promise<void> {
  await Promise.all([getSession1Questions(), getSession2Questions(), getSession3Questions()]);
}
