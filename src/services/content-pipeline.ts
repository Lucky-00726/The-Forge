import { buildDailySessionQuestions } from './content-session-engine';
import { getOrAssignSession } from './daily-session.service';
import { supabase } from './supabase';
import type { Question } from '../types/questions';

export async function getDailySessionQuestions(userId: string, sessionNumber: 1 | 2 | 3): Promise<Question[]> {
  const ids = await getOrAssignSession(userId, sessionNumber, async () => {
    const questions = await buildDailySessionQuestions(userId, sessionNumber);
    return questions.map((question) => question.id);
  });

  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase.rpc('get_questions_by_ids', { p_ids: ids });
  if (error || !data) return [];
  return (data as any[]).map((row) => ({ ...row, answer_data: row.answer_data } as Question));
}
