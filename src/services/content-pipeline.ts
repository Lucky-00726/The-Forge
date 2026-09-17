import { buildDailySessionQuestions } from './content-session-engine';
import { getOrAssignSession } from './daily-session.service';
import { supabase } from './supabase';
import type { Question } from '../types/questions';

export async function getDailySessionQuestions(userId: string, sessionNumber: 1 | 2 | 3): Promise<Question[]> {
  // 1. Fetch user's current training day from the DB
  const { data: userProfile } = await supabase
    .from('users')
    .select('current_training_day')
    .eq('id', userId)
    .single();

  const trainingDay = userProfile?.current_training_day ?? 1;

  const ids = await getOrAssignSession(userId, sessionNumber, trainingDay, async () => {
    const questions = await buildDailySessionQuestions(userId, sessionNumber, trainingDay);
    return questions.map((question) => question.id);
  });

  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase.rpc('get_questions_by_ids', { p_ids: ids });
  if (error || !data) return [];
  
  // Maintain the exact ordering of the pinned question IDs
  const questionMap = new Map<string, Question>();
  (data as any[]).forEach((row) => {
    questionMap.set(row.id, { ...row, answer_data: row.answer_data } as Question);
  });

  return ids
    .map((id) => questionMap.get(id))
    .filter((q): q is Question => q !== undefined);
}
