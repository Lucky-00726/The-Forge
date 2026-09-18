import { supabase } from './supabase';
import type { Question, QuestionType } from '../types/questions';

export type SessionKey = 'session1' | 'session2' | 'session3';

interface ContentProgressRow {
  user_id: string;
  session_key: SessionKey;
  scope: string;
  position: number;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeQuestionRow(row: any): Question {
  return {
    id: row.id,
    category: row.category ?? 'General Knowledge',
    subcategory: row.subcategory ?? null,
    difficulty: row.difficulty ?? 'Medium',
    question_type: row.question_type ?? row.content_type ?? 'MCQ',
    question: row.question ?? row.prompt ?? '',
    prompt: row.prompt ?? null,
    xp_reward: row.xp_reward ?? 10,
    time_limit: row.time_limit ?? null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    source: row.source ?? null,
    active: row.active ?? true,
    sequence_order: row.sequence_order ?? 0,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    answer_data: row.answer_data ?? {},
    session: row.session ?? '',
    module: row.module ?? '',
    option_a: row.option_a ?? '',
    option_b: row.option_b ?? '',
    option_c: row.option_c ?? '',
    option_d: row.option_d ?? '',
    correct_answer: row.correct_answer ?? '',
    answer_type: row.answer_type ?? '',
    word_limit: row.word_limit ?? null,
    time_limit_seconds: row.time_limit_seconds ?? null,
    xp: row.xp ?? null,
  } as Question;
}

async function readProgress(userId: string, sessionKey: SessionKey, scope: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_content_progress')
    .select('position')
    .eq('user_id', userId)
    .eq('session_key', sessionKey)
    .eq('scope', scope)
    .maybeSingle();

  if (error) {
    console.error('[Content Engine] Progress lookup failed', error.message);
    return 0;
  }

  return data?.position ?? 0;
}

async function writeProgress(userId: string, sessionKey: SessionKey, scope: string, position: number): Promise<void> {
  const { error } = await supabase.from('user_content_progress').upsert({
    user_id: userId,
    session_key: sessionKey,
    scope,
    position,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,session_key,scope' });

  if (error) {
    console.error('[Content Engine] Progress update failed', error.message);
  }
}

async function fetchQuestionPoolForSession(sessionKey: string): Promise<Question[]> {
  const { data, error } = await (supabase.from('questions') as any)
    .select('*')
    .eq('active', true)
    .eq('status', 'approved')
    .eq('session', sessionKey)
    .order('sequence_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error(`[Content Engine] Failed to load question pool for session: ${sessionKey}`, error.message);
    return [];
  }

  return (data ?? []).map(normalizeQuestionRow);
}

async function fetchQuestionsByDayAndSession(day: number, sessionKey: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('day', day)
    .eq('session', sessionKey)
    .eq('active', true)
    .eq('status', 'approved')
    .order('sequence_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error(`[Content Engine] Failed to fetch day ${day} ${sessionKey} questions:`, error.message);
    throw new Error(`Failed to load curriculum questions: ${error.message}`);
  }

  return (data ?? []).map(normalizeQuestionRow);
}

function shuffleArrayFY<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleSession2Constrained(questions: Question[]): Question[] {
  const groups: Record<string, Question[]> = {};
  questions.forEach(q => {
    const type = q.question_type || 'MCQ';
    if (!groups[type]) groups[type] = [];
    groups[type].push(q);
  });

  // Randomize items within each type group using Fisher-Yates
  for (const type in groups) {
    groups[type] = shuffleArrayFY(groups[type]);
  }

  const result: Question[] = [];

  function backtrack(lastType: string | null): boolean {
    if (result.length === questions.length) {
      return true;
    }

    // Get candidate types that have remaining elements and don't match the last type
    let candidates = Object.keys(groups).filter(t => groups[t].length > 0 && t !== lastType);
    
    // Pre-shuffle candidates to randomize order when counts are equal
    candidates = shuffleArrayFY(candidates);
    
    // Sort candidates: try the type with the most remaining elements first (safety heuristic)
    candidates.sort((a, b) => groups[b].length - groups[a].length);

    for (const type of candidates) {
      const q = groups[type].pop()!;
      result.push(q);

      if (backtrack(type)) {
        return true;
      }

      // Backtrack
      result.pop();
      groups[type].push(q);
    }

    return false;
  }

  const success = backtrack(null);
  if (!success) {
    throw new Error('Constrained shuffle: Failed to find an arrangement without consecutive types.');
  }

  return result;
}

async function buildSession1Questions(userId: string, trainingDay: number): Promise<Question[]> {
  const questions = await fetchQuestionsByDayAndSession(trainingDay, 'Session1');
  const expected = 12;
  const threshold = Math.ceil(expected * 0.6);

  if (questions.length === expected) {
    return questions;
  }

  if (questions.length >= threshold && questions.length >= 5) {
    console.warn(`[ContentIntegrity] Day ${trainingDay} Session 1: expected ${expected} questions, found ${questions.length} — proceeding`);
    return questions;
  }

  throw new Error(`Curriculum integrity error: Day ${trainingDay} Session 1 contains ${questions.length} active questions (expected at least ${threshold}, got ${questions.length}).`);
}

async function buildSession2Questions(userId: string, trainingDay: number): Promise<Question[]> {
  const questions = await fetchQuestionsByDayAndSession(trainingDay, 'Session2');
  const expected = 12;
  const threshold = Math.ceil(expected * 0.6);

  if (questions.length !== expected) {
    if (questions.length >= threshold && questions.length >= 5) {
      console.warn(`[ContentIntegrity] Day ${trainingDay} Session 2: expected ${expected} questions, found ${questions.length} — proceeding`);
    } else {
      throw new Error(`Curriculum integrity error: Day ${trainingDay} Session 2 contains ${questions.length} active questions (expected at least ${threshold}).`);
    }
  }

  // Validate expected type distribution: 3 MCQ, 3 SingleWord, 2 TrueFalse, 2 RapidResponse, 2 Numeric
  const counts: Record<string, number> = { MCQ: 0, SingleWord: 0, TrueFalse: 0, RapidResponse: 0, Numeric: 0 };
  questions.forEach(q => {
    const t = q.question_type || 'MCQ';
    counts[t] = (counts[t] || 0) + 1;
  });

  if (counts.MCQ !== 3 || counts.SingleWord !== 3 || counts.TrueFalse !== 2 || counts.RapidResponse !== 2 || counts.Numeric !== 2) {
    console.warn(`[ContentIntegrity] Day ${trainingDay} Session 2: distribution MCQ:${counts.MCQ} SW:${counts.SingleWord} TF:${counts.TrueFalse} RR:${counts.RapidResponse} NUM:${counts.Numeric} — expected 3/3/2/2/2`);
  }

  // Attempt constrained shuffle; fall back to Fisher-Yates if it fails
  try {
    return shuffleSession2Constrained(questions);
  } catch (err) {
    console.warn(`[ContentIntegrity] Day ${trainingDay} Session 2: constrained shuffle failed, using plain shuffle`);
    return shuffleArrayFY(questions);
  }
}

async function buildSession3Questions(userId: string, trainingDay: number): Promise<Question[]> {
  const questions = await fetchQuestionsByDayAndSession(trainingDay, 'Session3');
  const expected = 10;
  const threshold = Math.ceil(expected * 0.6);

  if (questions.length !== expected) {
    if (questions.length >= threshold && questions.length >= 5) {
      console.warn(`[ContentIntegrity] Day ${trainingDay} Session 3: expected ${expected} questions, found ${questions.length} — proceeding`);
    } else {
      throw new Error(`Curriculum integrity error: Day ${trainingDay} Session 3 contains ${questions.length} active questions (expected at least ${threshold}).`);
    }
  }

  const srts = questions.filter(q => q.module === 'SRT');
  const wats = questions.filter(q => q.module === 'WAT');
  const interviews = questions.filter(q => q.module === 'Interview' || q.module === 'PersonalInterview' || q.module === 'Lecturette' || q.module === 'GroupDiscussion' || q.module === 'SelfDescription');

  if (srts.length !== 4 || wats.length !== 3 || interviews.length !== 3) {
    console.warn(`[ContentIntegrity] Day ${trainingDay} Session 3: distribution SRT:${srts.length} WAT:${wats.length} INT:${interviews.length} — expected 4/3/3`);
  }

  // Return preserving intended SRT -> WAT -> Interview order
  return [...srts, ...wats, ...interviews];
}

export async function buildDailySessionQuestions(userId: string, sessionNumber: 1 | 2 | 3, trainingDay: number): Promise<Question[]> {
  switch (sessionNumber) {
    case 1:
      return buildSession1Questions(userId, trainingDay);
    case 2:
      return buildSession2Questions(userId, trainingDay);
    case 3:
      return buildSession3Questions(userId, trainingDay);
    default:
      return [];
  }
}

export async function buildPreviewSessionQuestions(sessionNumber: 1 | 2 | 3, trainingDay: number = 1): Promise<Question[]> {
  const previewUser = 'preview';
  return buildDailySessionQuestions(previewUser, sessionNumber, trainingDay);
}
