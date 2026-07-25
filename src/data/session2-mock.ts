// ─────────────────────────────────────────────────────────────
// THE FORGE — Session 2 Mock Data
// Mixed question types: MCQ, Single Word, Numeric, Rapid Response
// 18 questions, 8-10 minute target duration
// ─────────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'SingleWord' | 'Numeric' | 'RapidResponse' | 'TrueFalse';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  xp: number;
}

export interface MCQQuestion extends BaseQuestion {
  type: 'MCQ';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SingleWordQuestion extends BaseQuestion {
  type: 'SingleWord';
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[]; // Case-insensitive alternatives
  explanation: string;
}

export interface NumericQuestion extends BaseQuestion {
  type: 'Numeric';
  question: string;
  correctAnswer: number;
  tolerance?: number; // Allow +/- tolerance
  unit?: string; // e.g., "days", "hours", "minutes"
  explanation: string;
}

export interface RapidResponseQuestion extends BaseQuestion {
  type: 'RapidResponse';
  question: string;
  correctAnswer?: string;
  acceptableAnswers?: string[];
  options?: string[];
  correctIndex?: number;
  timeLimit: number; // seconds
  explanation: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'TrueFalse';
  question: string;
  correctAnswer: boolean;
  explanation: string;
}

export type Session2Question =
  | MCQQuestion
  | SingleWordQuestion
  | NumericQuestion
  | RapidResponseQuestion
  | TrueFalseQuestion;

const SESSION2_QUESTIONS_BASE: Session2Question[] = [
  // MCQ Questions (6)
  {
    id: 'S2Q01',
    type: 'MCQ',
    question: 'Which test at SSB assesses your subconscious thoughts through word associations?',
    options: [
      'TAT (Thematic Apperception Test)',
      'WAT (Word Association Test)',
      'SRT (Situation Reaction Test)',
      'SD (Self Description)'
    ],
    correctIndex: 1,
    explanation: 'WAT (Word Association Test) shows 60 words for 15 seconds each. Your immediate responses reveal subconscious personality traits and thought patterns.',
    xp: 10
  },
  {
    id: 'S2Q02',
    type: 'MCQ',
    question: 'In the GTO tasks, what does "GTO" stand for?',
    options: [
      'Ground Training Officer',
      'Group Testing Officer',
      'General Tactics Operations',
      'Group Tactical Officer'
    ],
    correctIndex: 1,
    explanation: 'GTO stands for Group Testing Officer, who conducts outdoor group tasks to assess leadership, cooperation, and practical intelligence.',
    xp: 10
  },
  {
    id: 'S2Q03',
    type: 'MCQ',
    question: 'Which of these is NOT one of the 15 Officer Like Qualities (OLQs)?',
    options: [
      'Physical strength',
      'Effective intelligence',
      'Power of expression',
      'Sense of responsibility'
    ],
    correctIndex: 0,
    explanation: 'Physical strength is not an OLQ. OLQs focus on mental attributes like intelligence, reasoning, organizing power, and leadership qualities rather than physical prowess.',
    xp: 10
  },
  {
    id: 'S2Q04',
    type: 'MCQ',
    question: 'What is the primary purpose of the Progressive Group Task (PGT)?',
    options: [
      'Test physical endurance',
      'Assess leadership in increasing difficulty',
      'Evaluate writing speed',
      'Check mathematical ability'
    ],
    correctIndex: 1,
    explanation: 'PGT presents obstacles of increasing difficulty to assess how candidates handle progressive challenges and demonstrate leadership under pressure.',
    xp: 10
  },
  {
    id: 'S2Q05',
    type: 'MCQ',
    question: 'During the Personal Interview, which quality matters most to assessors?',
    options: [
      'Memorized facts',
      'Authentic self-awareness',
      'Formal language',
      'Technical jargon'
    ],
    correctIndex: 1,
    explanation: 'Assessors value genuine self-awareness and authenticity. They want to see the real you—your motivations, thought process, and understanding of your strengths and weaknesses.',
    xp: 10
  },
  {
    id: 'S2Q06',
    type: 'MCQ',
    question: 'What does the Half Group Task (HGT) primarily assess?',
    options: [
      'Cooperation in smaller groups',
      'Speed of completion',
      'Individual strength',
      'Academic knowledge'
    ],
    correctIndex: 0,
    explanation: 'HGT divides the group in half to observe cooperation, idea contribution, and leadership dynamics in a smaller team setting.',
    xp: 10
  },

  // Single Word Questions (4)
  {
    id: 'S2Q07',
    type: 'SingleWord',
    question: 'What is the full form of NDA?',
    correctAnswer: 'National Defence Academy',
    acceptableAnswers: ['national defence academy', 'nda'],
    explanation: 'NDA (National Defence Academy) in Khadakwasla, Pune, is the joint services academy for training cadets for the Indian Army, Navy, and Air Force.',
    xp: 10
  },
  {
    id: 'S2Q08',
    type: 'SingleWord',
    question: 'Which city in India hosts the primary SSB center for the Indian Army?',
    correctAnswer: 'Allahabad',
    acceptableAnswers: ['allahabad', 'prayagraj'],
    explanation: 'Allahabad (now Prayagraj) hosts one of the main Army SSB centers. There are multiple SSB centers across India including Bhopal, Bangalore, and Kapurthala.',
    xp: 10
  },
  {
    id: 'S2Q09',
    type: 'SingleWord',
    question: 'What quality does "OLQ" stand for at SSB?',
    correctAnswer: 'Officer Like Quality',
    acceptableAnswers: ['officer like quality', 'officer like qualities', 'olq'],
    explanation: 'OLQ stands for Officer Like Qualities—the 15 core attributes assessed throughout the SSB process to determine suitability for military leadership.',
    xp: 10
  },
  {
    id: 'S2Q10',
    type: 'SingleWord',
    question: 'Name the psychological test where you write stories based on pictures.',
    correctAnswer: 'TAT',
    acceptableAnswers: ['tat', 'thematic apperception test'],
    explanation: 'TAT (Thematic Apperception Test) shows ambiguous pictures. Your stories reveal personality, character, and thought patterns.',
    xp: 10
  },

  // Numeric Questions (4)
  {
    id: 'S2Q11',
    type: 'Numeric',
    question: 'How many words are shown in the Word Association Test (WAT)?',
    correctAnswer: 60,
    tolerance: 0,
    unit: 'words',
    explanation: 'WAT consists of exactly 60 words, each shown for 15 seconds. You must write the first thought that comes to mind.',
    xp: 10
  },
  {
    id: 'S2Q12',
    type: 'Numeric',
    question: 'How many seconds is each word displayed during WAT?',
    correctAnswer: 15,
    tolerance: 0,
    unit: 'seconds',
    explanation: 'Each word in WAT is displayed for exactly 15 seconds, requiring quick thinking and immediate response.',
    xp: 10
  },
  {
    id: 'S2Q13',
    type: 'Numeric',
    question: 'How many Officer Like Qualities (OLQs) are assessed at SSB?',
    correctAnswer: 15,
    tolerance: 0,
    unit: 'qualities',
    explanation: 'There are exactly 15 OLQs including effective intelligence, reasoning ability, organizing power, power of expression, and 11 others.',
    xp: 10
  },
  {
    id: 'S2Q14',
    type: 'Numeric',
    question: 'How many pictures are typically shown in TAT?',
    correctAnswer: 12,
    tolerance: 1,
    unit: 'pictures',
    explanation: 'TAT typically shows 11-12 pictures (this can vary slightly). You have 30 seconds to view and 4 minutes to write each story.',
    xp: 10
  },

  // Rapid Response Questions (4) - Time pressure component
  {
    id: 'S2Q15',
    type: 'RapidResponse',
    question: 'Quick decision: Your subordinate makes a mistake during a critical operation. What do you do?',
    options: [
      'Reprimand immediately in front of others',
      'Correct calmly and continue the mission',
      'Ignore it to maintain morale',
      'Report to higher authority first'
    ],
    correctIndex: 1,
    timeLimit: 20,
    explanation: 'A good leader corrects mistakes calmly without public humiliation, prioritizes mission continuity, and addresses issues constructively.',
    xp: 15
  },
  {
    id: 'S2Q16',
    type: 'RapidResponse',
    question: 'Rapid choice: You discover a security breach. Time is critical. First action?',
    options: [
      'Investigate alone to confirm',
      'Alert higher authority immediately',
      'Inform teammates to gather evidence',
      'Wait to see if it happens again'
    ],
    correctIndex: 1,
    timeLimit: 20,
    explanation: 'Security breaches require immediate reporting to higher authority. Speed is critical—investigation comes after alerting the chain of command.',
    xp: 15
  },
  {
    id: 'S2Q17',
    type: 'RapidResponse',
    question: 'Fast decision: Two team members are arguing during a mission. What now?',
    options: [
      'Let them resolve it themselves',
      'Side with the senior person',
      'Intervene immediately and refocus on mission',
      'Separate them and continue later'
    ],
    correctIndex: 2,
    timeLimit: 20,
    explanation: 'Leaders intervene immediately to stop conflict, refocus the team on mission objectives, and address the issue properly later.',
    xp: 15
  },
  {
    id: 'S2Q18',
    type: 'RapidResponse',
    question: 'Quick call: You see a teammate struggling with their task during a GTO exercise. Do you?',
    options: [
      'Complete your task first, help later',
      'Immediately assist while managing your task',
      'Point it out to the assessor',
      'Tell another teammate to help'
    ],
    correctIndex: 1,
    timeLimit: 20,
    explanation: 'Officers help teammates while managing their own responsibilities. Initiative and team support are key OLQs demonstrated in such moments.',
    xp: 15
  },

  // True/False Questions (2)
  {
    id: 'S2Q19',
    type: 'TrueFalse',
    question: 'At SSB, physical fitness test scores are more important than psychological test results.',
    correctAnswer: false,
    explanation: 'False. While physical fitness is important, SSB primarily assesses Officer Like Qualities through psychological tests, interviews, and group tasks. Mental attributes matter more than physical prowess.',
    xp: 10
  },
  {
    id: 'S2Q20',
    type: 'TrueFalse',
    question: 'In the Personal Interview, it is better to give honest answers even if they reveal weaknesses, rather than present a perfect image.',
    correctAnswer: true,
    explanation: 'True. Assessors value genuine self-awareness and honesty over rehearsed perfection. Acknowledging weaknesses and showing how you work on them demonstrates maturity and responsibility.',
    xp: 10
  },
];

// Shuffle questions to mix types
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const SESSION2_QUESTIONS = shuffleArray(SESSION2_QUESTIONS_BASE);

export const SESSION2_TOTAL_QUESTIONS = SESSION2_QUESTIONS.length;
export const SESSION2_MAX_XP = SESSION2_QUESTIONS.reduce((sum, q) => sum + q.xp, 0);
