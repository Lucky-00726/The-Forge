// ─────────────────────────────────────────────────────────────
// THE FORGE — Session 3 Mock Data
// Subjective questions: SRT, WAT, Interview style
// 10 questions, 12-15 minute target duration
// AI evaluation to be implemented later
// ─────────────────────────────────────────────────────────────

export type SubjectiveQuestionType = 'SRT' | 'WAT' | 'Interview';

export interface SubjectiveQuestion {
  id: string;
  type: SubjectiveQuestionType;
  question: string;
  prompt?: string; // Additional context/guidance
  minWords?: number; // Minimum word count for longer responses
  xp: number;
  evaluationCriteria: string[]; // What AI should look for
}

export const SESSION3_QUESTIONS: SubjectiveQuestion[] = [
  // SRT Style (4 questions)
  {
    id: 'S3Q01',
    type: 'SRT',
    question: 'You are leading a night patrol when your radio fails. You hear gunfire 2 km away. Your response?',
    minWords: 15,
    xp: 20,
    evaluationCriteria: [
      'Initiative',
      'Decision Making',
      'Leadership',
      'Responsibility',
      'Communication'
    ]
  },
  {
    id: 'S3Q02',
    type: 'SRT',
    question: 'Your senior asks you to report false information to higher authority. What will you do?',
    minWords: 15,
    xp: 20,
    evaluationCriteria: [
      'Responsibility',
      'Decision Making',
      'Communication',
      'Leadership'
    ]
  },
  {
    id: 'S3Q03',
    type: 'SRT',
    question: 'During training, a teammate gets injured. Medical help is 30 minutes away. Your action?',
    minWords: 15,
    xp: 20,
    evaluationCriteria: [
      'Initiative',
      'Responsibility',
      'Decision Making',
      'Leadership'
    ]
  },
  {
    id: 'S3Q04',
    type: 'SRT',
    question: 'You discover critical equipment missing before a mission. The mission starts in 10 minutes. What do you do?',
    minWords: 15,
    xp: 20,
    evaluationCriteria: [
      'Initiative',
      'Decision Making',
      'Leadership',
      'Responsibility'
    ]
  },

  // WAT Style (3 questions) - Single word responses, quick thinking
  {
    id: 'S3Q05',
    type: 'WAT',
    question: 'RESPONSIBILITY',
    prompt: 'Write the first thought that comes to mind about this word.',
    minWords: 3,
    xp: 15,
    evaluationCriteria: [
      'Responsibility',
      'Initiative'
    ]
  },
  {
    id: 'S3Q06',
    type: 'WAT',
    question: 'CHALLENGE',
    prompt: 'Write the first thought that comes to mind about this word.',
    minWords: 3,
    xp: 15,
    evaluationCriteria: [
      'Initiative',
      'Decision Making'
    ]
  },
  {
    id: 'S3Q07',
    type: 'WAT',
    question: 'TEAMWORK',
    prompt: 'Write the first thought that comes to mind about this word.',
    minWords: 3,
    xp: 15,
    evaluationCriteria: [
      'Leadership',
      'Communication'
    ]
  },

  // Interview Style (3 questions)
  {
    id: 'S3Q08',
    type: 'Interview',
    question: 'Why do you want to join the Armed Forces?',
    prompt: 'Be honest and specific. Share your genuine motivation.',
    minWords: 30,
    xp: 25,
    evaluationCriteria: [
      'Initiative',
      'Responsibility',
      'Communication',
      'Leadership'
    ]
  },
  {
    id: 'S3Q09',
    type: 'Interview',
    question: 'Describe a situation where you showed leadership in your life.',
    prompt: 'Use a real example. Explain what you did and what you learned.',
    minWords: 40,
    xp: 25,
    evaluationCriteria: [
      'Leadership',
      'Initiative',
      'Communication',
      'Decision Making'
    ]
  },
  {
    id: 'S3Q10',
    type: 'Interview',
    question: 'What is your biggest weakness and how are you working to improve it?',
    prompt: 'Show self-awareness. Explain your improvement strategy.',
    minWords: 30,
    xp: 25,
    evaluationCriteria: [
      'Responsibility',
      'Communication',
      'Initiative'
    ]
  },
];

export const SESSION3_TOTAL_QUESTIONS = SESSION3_QUESTIONS.length;
export const SESSION3_MAX_XP = SESSION3_QUESTIONS.reduce((sum, q) => sum + q.xp, 0);

// Evaluation criteria definitions (for AI evaluation system)
export const EVALUATION_CRITERIA = {
  Initiative: 'Takes action without being told; proactive approach; identifies opportunities',
  Leadership: 'Takes charge; influences others; makes decisions; inspires confidence',
  Responsibility: 'Accepts accountability; follows through; considers consequences',
  Communication: 'Clear expression; appropriate tone; effective articulation',
  DecisionMaking: 'Logical reasoning; considers options; decisive action; practical thinking',
};
