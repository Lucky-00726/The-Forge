// ─────────────────────────────────────────────────────────────
// THE FORGE — Day 0 Mock Data
// TEMPORARY FILE FOR VALIDATION SLICE
// 10 hardcoded MCQ questions for UX testing
// DELETE AFTER VALIDATION COMPLETE
// ─────────────────────────────────────────────────────────────

export interface MockQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xp: number;
}

export const DAY0_QUESTIONS: MockQuestion[] = [
  {
    id: 'D0Q01',
    question: 'What does SSB stand for in the context of Indian Armed Forces?',
    options: [
      'Services Selection Board',
      'Special Service Bureau',
      'Strategic Services Branch',
      'Staff Selection Board'
    ],
    correctIndex: 0,
    explanation: 'SSB stands for Services Selection Board, the organization responsible for selecting officers for the Indian Army, Navy, and Air Force through a rigorous 5-day assessment process.',
    xp: 10
  },
  {
    id: 'D0Q02',
    question: 'How many days does the SSB interview process typically last?',
    options: [
      '3 days',
      '5 days',
      '7 days',
      '10 days'
    ],
    correctIndex: 1,
    explanation: 'The SSB interview is conducted over 5 days, consisting of Stage I (screening), Stage II (psychological tests, group testing, and personal interview), and final conference.',
    xp: 10
  },
  {
    id: 'D0Q03',
    question: 'Which of the following is NOT part of the SSB assessment process?',
    options: [
      'Group Discussion',
      'Physical Fitness Test',
      'Written Examination',
      'Personal Interview'
    ],
    correctIndex: 2,
    explanation: 'Written examinations are part of the entry exam (NDA/CDS/AFCAT), not the SSB assessment. SSB focuses on psychological tests, group activities, and interviews to assess OLQs (Officer Like Qualities).',
    xp: 10
  },
  {
    id: 'D0Q04',
    question: 'What are the 15 core attributes assessed at SSB collectively called?',
    options: [
      'Leadership Qualities',
      'Officer Like Qualities (OLQs)',
      'Military Competencies',
      'Service Selection Criteria'
    ],
    correctIndex: 1,
    explanation: 'OLQs (Officer Like Qualities) are the 15 core attributes including effective intelligence, reasoning ability, organizing power, power of expression, social adjustment, cooperation, sense of responsibility, initiative, self-confidence, speed of decision, ability to influence the group, liveliness, determination, courage, and stamina.',
    xp: 10
  },
  {
    id: 'D0Q05',
    question: 'During the SSB interview, which test involves narrating stories based on ambiguous pictures?',
    options: [
      'Word Association Test (WAT)',
      'Situation Reaction Test (SRT)',
      'Thematic Apperception Test (TAT)',
      'Self-Description Test (SD)'
    ],
    correctIndex: 2,
    explanation: 'TAT (Thematic Apperception Test) involves viewing ambiguous pictures and narrating stories about them. This psychological test reveals your character, personality, and thought process through the stories you create.',
    xp: 10
  },
  {
    id: 'D0Q06',
    question: 'What is the primary purpose of the Group Planning Exercise (GPE) at SSB?',
    options: [
      'Test physical strength',
      'Assess planning and decision-making ability',
      'Evaluate writing skills',
      'Check mathematical aptitude'
    ],
    correctIndex: 1,
    explanation: 'GPE assesses your ability to analyze a problem, plan effectively, make decisions under time constraints, and communicate your ideas clearly. It tests practical intelligence and organizational ability.',
    xp: 10
  },
  {
    id: 'D0Q07',
    question: 'Which of these is a key trait assessors look for during the Personal Interview?',
    options: [
      'Memorized answers',
      'Genuine self-awareness',
      'Technical knowledge only',
      'Formal language usage'
    ],
    correctIndex: 1,
    explanation: 'Assessors value genuine self-awareness, honesty, and clarity of thought over memorized responses. They want to understand who you really are, your motivations, your understanding of your strengths and weaknesses, and your suitability for a military career.',
    xp: 10
  },
  {
    id: 'D0Q08',
    question: 'What is the recommended mindset for tackling Group Discussion at SSB?',
    options: [
      'Dominate the conversation',
      'Speak only when others are silent',
      'Contribute meaningfully and respect others',
      'Agree with the majority'
    ],
    correctIndex: 2,
    explanation: 'The ideal approach is to contribute meaningful ideas, listen actively, respect others\' viewpoints, and help the group reach a constructive conclusion. SSB values quality over quantity and teamwork over dominance.',
    xp: 10
  },
  {
    id: 'D0Q09',
    question: 'In the Word Association Test (WAT), how many words are typically shown?',
    options: [
      '30 words',
      '60 words',
      '90 words',
      '120 words'
    ],
    correctIndex: 1,
    explanation: 'WAT consists of 60 words shown for 15 seconds each. You must write the first thought that comes to mind. This test reveals your personality, thought process, and subconscious associations.',
    xp: 10
  },
  {
    id: 'D0Q10',
    question: 'Which quality is considered most important for an officer in the Indian Armed Forces?',
    options: [
      'Physical strength',
      'Academic excellence',
      'Character and integrity',
      'Technical expertise'
    ],
    correctIndex: 2,
    explanation: 'While all qualities matter, character and integrity are paramount. Officers lead soldiers who trust them with their lives. Honesty, moral courage, and ethical behavior form the foundation of military leadership.',
    xp: 10
  },
];

export const TOTAL_QUESTIONS = DAY0_QUESTIONS.length;
export const MAX_XP = DAY0_QUESTIONS.reduce((sum, q) => sum + q.xp, 0);
