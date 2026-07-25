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

async function buildSession1Questions(userId: string): Promise<Question[]> {
  const pool = await fetchQuestionPoolForSession('Session1');
  if (pool.length === 0) return [];

  const grouped = new Map<string, Question[]>();
  for (const question of pool) {
    const key = (question.category ?? 'General Knowledge').trim() || 'General Knowledge';
    const existing = grouped.get(key) ?? [];
    existing.push(question);
    grouped.set(key, existing);
  }

  const categories = shuffleArray(Array.from(grouped.keys()));
  const selected: Question[] = [];

  for (const category of categories) {
    const items = grouped.get(category) ?? [];
    if (items.length === 0) continue;

    items.sort((a, b) => {
      const diff = (a.sequence_order ?? 0) - (b.sequence_order ?? 0);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

    const position = await readProgress(userId, 'session1', category);
    const index = position % items.length;
    selected.push(items[index]);
    await writeProgress(userId, 'session1', category, position + 1);
  }

  return selected;
}

async function buildSession2Questions(userId: string): Promise<Question[]> {
  const pool = await fetchQuestionPoolForSession('Session2');
  if (pool.length === 0) return [];

  const mcqs = pool.filter(q => q.module === 'MCQ');
  const singleWords = pool.filter(q => q.module === 'SingleWord');
  const trueFalses = pool.filter(q => q.module === 'TrueFalse');
  const rapids = pool.filter(q => q.module === 'RapidResponse');
  const numerics = pool.filter(q => q.module === 'Numeric');

  const selected: Question[] = [];

  const selectForModule = async (modulePool: Question[], moduleKey: string, count: number) => {
    if (modulePool.length === 0) return;
    const position = await readProgress(userId, 'session2', moduleKey);
    for (let offset = 0; offset < count; offset++) {
      const index = (position + offset) % modulePool.length;
      selected.push(modulePool[index]);
    }
    await writeProgress(userId, 'session2', moduleKey, position + count);
  };

  await selectForModule(mcqs, 'MCQ', 3);
  await selectForModule(singleWords, 'SingleWord', 3);
  await selectForModule(trueFalses, 'TrueFalse', 2);
  await selectForModule(rapids, 'RapidResponse', 2);
  await selectForModule(numerics, 'Numeric', 2);

  return shuffleArray(selected);
}

async function buildSession3Questions(userId: string): Promise<Question[]> {
  const pool = await fetchQuestionPoolForSession('Session3');
  if (pool.length === 0) return [];

  const srts = pool.filter(q => q.module === 'SRT');
  const wats = pool.filter(q => q.module === 'WAT');
  const interviews = pool.filter(q => q.module === 'Interview' || q.module === 'PersonalInterview' || q.module === 'Lecturette' || q.module === 'GroupDiscussion' || q.module === 'SelfDescription');

  const selected: Question[] = [];

  if (srts.length > 0) {
    const position = await readProgress(userId, 'session3', 'SRT');
    for (let offset = 0; offset < 4; offset++) {
      const index = (position + offset) % srts.length;
      selected.push(srts[index]);
    }
    await writeProgress(userId, 'session3', 'SRT', position + 4);
  }

  if (wats.length > 0) {
    const position = await readProgress(userId, 'session3', 'WAT');
    for (let offset = 0; offset < 3; offset++) {
      const index = (position + offset) % wats.length;
      selected.push(wats[index]);
    }
    await writeProgress(userId, 'session3', 'WAT', position + 3);
  }

  if (interviews.length > 0) {
    const position = await readProgress(userId, 'session3', 'Interview');
    for (let offset = 0; offset < 3; offset++) {
      const index = (position + offset) % interviews.length;
      selected.push(interviews[index]);
    }
    await writeProgress(userId, 'session3', 'Interview', position + 3);
  }

  return selected;
}

export async function buildDailySessionQuestions(userId: string, sessionNumber: 1 | 2 | 3): Promise<Question[]> {
  switch (sessionNumber) {
    case 1:
      return buildSession1Questions(userId);
    case 2:
      return buildSession2Questions(userId);
    case 3:
      return buildSession3Questions(userId);
    default:
      return [];
  }
}

export async function buildPreviewSessionQuestions(sessionNumber: 1 | 2 | 3): Promise<Question[]> {
  const previewUser = 'preview';
  const questions = await buildDailySessionQuestions(previewUser, sessionNumber);
  return questions;
}
