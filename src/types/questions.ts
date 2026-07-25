// ─────────────────────────────────────────────────────────────
// THE FORGE — Question Types
// Database-driven content system types
// ─────────────────────────────────────────────────────────────

export type QuestionType =
  | 'MCQ'
  | 'SingleWord'
  | 'Numeric'
  | 'RapidResponse'
  | 'TrueFalse'
  | 'SRT'
  | 'WAT'
  | 'Interview';

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuestionCategory =
  | 'SSB Fundamentals'
  | 'OLQs'
  | 'Psychological Tests'
  | 'GTO Tasks'
  | 'Interview Prep'
  | 'Leadership'
  | 'Decision Making'
  | 'Communication'
  | 'General Knowledge';

// ─────────────────────────────────────────────────────────────
// Base Question Interface
// ─────────────────────────────────────────────────────────────

export interface BaseQuestion {
  id: string;
  category: QuestionCategory;
  subcategory: string | null;
  difficulty: QuestionDifficulty;
  question_type: QuestionType;
  question: string;
  prompt: string | null;
  xp_reward: number;
  time_limit: number | null;
  tags: string[];
  source: string | null;
  active: boolean;
  sequence_order: number;
  created_at: string;
  updated_at: string;
  session?: string;
  module?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  answer_type?: string;
  word_limit?: number | null;
  time_limit_seconds?: number | null;
  xp?: number | null;
}

// ─────────────────────────────────────────────────────────────
// Answer Data Structures (varies by question type)
// ─────────────────────────────────────────────────────────────

export interface MCQAnswerData {
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SingleWordAnswerData {
  correctAnswer: string;
  acceptableAnswers: string[];
  explanation: string;
}

export interface NumericAnswerData {
  correctAnswer: number;
  tolerance?: number;
  unit?: string;
  explanation: string;
}

export interface RapidResponseAnswerData {
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrueFalseAnswerData {
  correctAnswer: boolean;
  explanation: string;
}

export interface SubjectiveAnswerData {
  minWords?: number;
  evaluationCriteria: string[];
}

// ─────────────────────────────────────────────────────────────
// Typed Question Interfaces
// ─────────────────────────────────────────────────────────────

export interface MCQQuestion extends BaseQuestion {
  question_type: 'MCQ';
  answer_data: MCQAnswerData;
}

export interface SingleWordQuestion extends BaseQuestion {
  question_type: 'SingleWord';
  answer_data: SingleWordAnswerData;
}

export interface NumericQuestion extends BaseQuestion {
  question_type: 'Numeric';
  answer_data: NumericAnswerData;
}

export interface RapidResponseQuestion extends BaseQuestion {
  question_type: 'RapidResponse';
  answer_data: RapidResponseAnswerData;
  time_limit: number; // Required for RapidResponse
}

export interface TrueFalseQuestion extends BaseQuestion {
  question_type: 'TrueFalse';
  answer_data: TrueFalseAnswerData;
}

export interface SRTQuestion extends BaseQuestion {
  question_type: 'SRT';
  answer_data: SubjectiveAnswerData;
}

export interface WATQuestion extends BaseQuestion {
  question_type: 'WAT';
  answer_data: SubjectiveAnswerData;
}

export interface InterviewQuestion extends BaseQuestion {
  question_type: 'Interview';
  answer_data: SubjectiveAnswerData;
}

// ─────────────────────────────────────────────────────────────
// Union Type
// ─────────────────────────────────────────────────────────────

export type Question =
  | MCQQuestion
  | SingleWordQuestion
  | NumericQuestion
  | RapidResponseQuestion
  | TrueFalseQuestion
  | SRTQuestion
  | WATQuestion
  | InterviewQuestion;

// ─────────────────────────────────────────────────────────────
// Database Row (before type parsing)
// ─────────────────────────────────────────────────────────────

export interface QuestionRow extends Omit<BaseQuestion, 'answer_data'> {
  answer_data: 
    | MCQAnswerData 
    | SingleWordAnswerData 
    | NumericAnswerData 
    | RapidResponseAnswerData 
    | TrueFalseAnswerData 
    | SubjectiveAnswerData;
}

// ─────────────────────────────────────────────────────────────
// Session Query Parameters
// ─────────────────────────────────────────────────────────────

export interface SessionQueryParams {
  questionTypes: QuestionType[];
  count: number;
  difficulty?: QuestionDifficulty;
  category?: QuestionCategory;
  excludeIds?: string[];
}

export interface MixedSessionQueryParams {
  typeCounts: Record<QuestionType, number>;
  difficulty?: QuestionDifficulty;
  excludeIds?: string[];
}
