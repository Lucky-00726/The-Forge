// ─────────────────────────────────────────────────────────────
// THE FORGE — AI Evaluation Test Cases
// 30 test responses (10 strong, 10 average, 10 weak)
// ─────────────────────────────────────────────────────────────

import type { EvaluationRequest } from './types';

/**
 * Test case with expected quality level
 */
export interface TestCase {
  id: string;
  expectedQuality: 'strong' | 'average' | 'weak';
  expectedScore: number; // Expected score range
  request: EvaluationRequest;
}

/**
 * Strong answers (Expected score: 4-5)
 */
export const STRONG_ANSWERS: TestCase[] = [
  {
    id: 'STRONG_SRT_01',
    expectedQuality: 'strong',
    expectedScore: 4.5,
    request: {
      question: {
        questionId: 'S3Q01',
        questionType: 'SRT',
        questionText:
          'You are leading a night patrol when your radio fails. You hear gunfire 2 km away. Your response?',
        evaluationCriteria: ['Initiative', 'Decision Making', 'Leadership', 'Responsibility'],
        minWords: 15,
      },
      response: {
        answer:
          'I would immediately assess my team\'s readiness and security. Using hand signals, I\'d direct two men to establish perimeter security while I send a runner to the nearest checkpoint to report the situation and gunfire. I\'d move the patrol to a defensive position and wait for instructions, keeping the team alert and ready to respond if needed.',
        wordCount: 59,
      },
    },
  },
  {
    id: 'STRONG_SRT_02',
    expectedQuality: 'strong',
    expectedScore: 5,
    request: {
      question: {
        questionId: 'S3Q02',
        questionType: 'SRT',
        questionText:
          'Your senior asks you to report false information to higher authority. What will you do?',
        evaluationCriteria: ['Responsibility', 'Decision Making', 'Communication', 'Leadership'],
        minWords: 15,
      },
      response: {
        answer:
          'I would respectfully decline and explain to my senior that I cannot report false information as it violates military ethics and my oath. I would request to understand why this is being asked and suggest providing accurate information instead. If pressured, I would escalate the matter through proper channels to protect the integrity of the reporting system.',
        wordCount: 58,
      },
    },
  },
  {
    id: 'STRONG_INTERVIEW_01',
    expectedQuality: 'strong',
    expectedScore: 5,
    request: {
      question: {
        questionId: 'S3Q08',
        questionType: 'Interview',
        questionText: 'Why do you want to join the Armed Forces?',
        prompt: 'Be honest and specific. Share your genuine motivation.',
        evaluationCriteria: ['Initiative', 'Responsibility', 'Communication', 'Leadership'],
        minWords: 30,
      },
      response: {
        answer:
          'I want to join the Armed Forces because I believe in serving something greater than myself. Growing up, I witnessed my father, a retired Army officer, demonstrate discipline, integrity, and selfless service. His dedication inspired me to pursue this path. I want to lead soldiers, protect my nation, and develop myself into the best version I can be through the challenges and responsibilities of military service.',
        wordCount: 67,
      },
    },
  },
  {
    id: 'STRONG_INTERVIEW_02',
    expectedQuality: 'strong',
    expectedScore: 4.5,
    request: {
      question: {
        questionId: 'S3Q09',
        questionType: 'Interview',
        questionText: 'Describe a situation where you showed leadership in your life.',
        prompt: 'Use a real example. Explain what you did and what you learned.',
        evaluationCriteria: ['Leadership', 'Initiative', 'Communication', 'Decision Making'],
        minWords: 40,
      },
      response: {
        answer:
          'During my college fest, our event coordinator fell sick two days before the event. As the deputy, I took charge immediately. I reorganized the 15-member team, delegated tasks based on each person\'s strengths, and maintained constant communication. When we faced a sponsorship issue, I personally met potential sponsors and secured funding. The event was successful with 500+ attendees. I learned that leadership is about taking responsibility, staying calm under pressure, and bringing out the best in your team.',
        wordCount: 79,
      },
    },
  },
  {
    id: 'STRONG_WAT_01',
    expectedQuality: 'strong',
    expectedScore: 5,
    request: {
      question: {
        questionId: 'S3Q05',
        questionType: 'WAT',
        questionText: 'RESPONSIBILITY',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Responsibility', 'Initiative'],
        minWords: 3,
      },
      response: {
        answer: 'Duty toward nation and team. Accountability for actions.',
        wordCount: 9,
      },
    },
  },
  {
    id: 'STRONG_WAT_02',
    expectedQuality: 'strong',
    expectedScore: 5,
    request: {
      question: {
        questionId: 'S3Q06',
        questionType: 'WAT',
        questionText: 'CHALLENGE',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Initiative', 'Decision Making'],
        minWords: 3,
      },
      response: {
        answer: 'Opportunity to grow and prove myself.',
        wordCount: 7,
      },
    },
  },
  {
    id: 'STRONG_SRT_03',
    expectedQuality: 'strong',
    expectedScore: 4.5,
    request: {
      question: {
        questionId: 'S3Q03',
        questionType: 'SRT',
        questionText: 'During training, a teammate gets injured. Medical help is 30 minutes away. Your action?',
        evaluationCriteria: ['Initiative', 'Responsibility', 'Decision Making', 'Leadership'],
        minWords: 15,
      },
      response: {
        answer:
          'I would immediately stop training and assess the injury severity. If life-threatening, I\'d apply first aid while someone calls for emergency evacuation. I\'d keep the injured person calm and stable, monitor vital signs, and ensure the training area is secured. I\'d also brief the instructor and document what happened for proper medical handover.',
        wordCount: 52,
      },
    },
  },
  {
    id: 'STRONG_SRT_04',
    expectedQuality: 'strong',
    expectedScore: 4,
    request: {
      question: {
        questionId: 'S3Q04',
        questionType: 'SRT',
        questionText:
          'You discover critical equipment missing before a mission. The mission starts in 10 minutes. What do you do?',
        evaluationCriteria: ['Initiative', 'Decision Making', 'Leadership', 'Responsibility'],
        minWords: 15,
      },
      response: {
        answer:
          'I would immediately inform my commander about the missing equipment and its criticality. If the mission can proceed without it, I\'d suggest improvisation or alternative methods. If the equipment is essential, I would recommend delaying the mission until it\'s located or replaced. Safety and mission success require proper preparation, not rushing into danger unprepared.',
        wordCount: 54,
      },
    },
  },
  {
    id: 'STRONG_INTERVIEW_03',
    expectedQuality: 'strong',
    expectedScore: 5,
    request: {
      question: {
        questionId: 'S3Q10',
        questionType: 'Interview',
        questionText: 'What is your biggest weakness and how are you working to improve it?',
        prompt: 'Show self-awareness. Explain your improvement strategy.',
        evaluationCriteria: ['Responsibility', 'Communication', 'Initiative'],
        minWords: 30,
      },
      response: {
        answer:
          'My biggest weakness is impatience when I see things not moving fast enough. I tend to take on too much myself rather than trusting the process. I\'m working on this by consciously delegating tasks, understanding that leadership is about enabling others, not doing everything alone. I\'ve started practicing patience by focusing on long-term goals rather than immediate results. This has helped me become a better team player.',
        wordCount: 66,
      },
    },
  },
  {
    id: 'STRONG_WAT_03',
    expectedQuality: 'strong',
    expectedScore: 4.5,
    request: {
      question: {
        questionId: 'S3Q07',
        questionType: 'WAT',
        questionText: 'TEAMWORK',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Leadership', 'Communication'],
        minWords: 3,
      },
      response: {
        answer: 'Together we achieve more. Strength in unity.',
        wordCount: 8,
      },
    },
  },
];

/**
 * Average answers (Expected score: 2.5-3.5)
 */
export const AVERAGE_ANSWERS: TestCase[] = [
  {
    id: 'AVERAGE_SRT_01',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q01',
        questionType: 'SRT',
        questionText:
          'You are leading a night patrol when your radio fails. You hear gunfire 2 km away. Your response?',
        evaluationCriteria: ['Initiative', 'Decision Making', 'Leadership', 'Responsibility'],
        minWords: 15,
      },
      response: {
        answer:
          'I would try to fix the radio first. If that doesn\'t work, I would move toward the gunfire to investigate what is happening and see if anyone needs help from our team.',
        wordCount: 33,
      },
    },
  },
  {
    id: 'AVERAGE_SRT_02',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q02',
        questionType: 'SRT',
        questionText:
          'Your senior asks you to report false information to higher authority. What will you do?',
        evaluationCriteria: ['Responsibility', 'Decision Making', 'Communication', 'Leadership'],
        minWords: 15,
      },
      response: {
        answer:
          'I would tell my senior that I cannot do this because it is wrong. I would try to convince them to report the correct information instead.',
        wordCount: 28,
      },
    },
  },
  {
    id: 'AVERAGE_INTERVIEW_01',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q08',
        questionType: 'Interview',
        questionText: 'Why do you want to join the Armed Forces?',
        prompt: 'Be honest and specific. Share your genuine motivation.',
        evaluationCriteria: ['Initiative', 'Responsibility', 'Communication', 'Leadership'],
        minWords: 30,
      },
      response: {
        answer:
          'I want to join the Armed Forces because it is a prestigious career and provides job security. I also want to serve the nation and wear the uniform with pride.',
        wordCount: 32,
      },
    },
  },
  {
    id: 'AVERAGE_INTERVIEW_02',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q09',
        questionType: 'Interview',
        questionText: 'Describe a situation where you showed leadership in your life.',
        prompt: 'Use a real example. Explain what you did and what you learned.',
        evaluationCriteria: ['Leadership', 'Initiative', 'Communication', 'Decision Making'],
        minWords: 40,
      },
      response: {
        answer:
          'I was the captain of my school cricket team. I led the team in matches and made sure everyone practiced regularly. We won several matches and I learned that leadership requires dedication and hard work.',
        wordCount: 38,
      },
    },
  },
  {
    id: 'AVERAGE_WAT_01',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q05',
        questionType: 'WAT',
        questionText: 'RESPONSIBILITY',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Responsibility', 'Initiative'],
        minWords: 3,
      },
      response: {
        answer: 'Being responsible for my work.',
        wordCount: 6,
      },
    },
  },
  {
    id: 'AVERAGE_WAT_02',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q06',
        questionType: 'WAT',
        questionText: 'CHALLENGE',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Initiative', 'Decision Making'],
        minWords: 3,
      },
      response: {
        answer: 'Something difficult to overcome.',
        wordCount: 5,
      },
    },
  },
  {
    id: 'AVERAGE_SRT_03',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q03',
        questionType: 'SRT',
        questionText: 'During training, a teammate gets injured. Medical help is 30 minutes away. Your action?',
        evaluationCriteria: ['Initiative', 'Responsibility', 'Decision Making', 'Leadership'],
        minWords: 15,
      },
      response: {
        answer:
          'I would help the injured person and call for medical assistance. I would also inform the trainer about what happened.',
        wordCount: 22,
      },
    },
  },
  {
    id: 'AVERAGE_SRT_04',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q04',
        questionType: 'SRT',
        questionText:
          'You discover critical equipment missing before a mission. The mission starts in 10 minutes. What do you do?',
        evaluationCriteria: ['Initiative', 'Decision Making', 'Leadership', 'Responsibility'],
        minWords: 15,
      },
      response: {
        answer:
          'I would quickly look for the missing equipment and inform my senior officer. If we can\'t find it, we should delay the mission.',
        wordCount: 24,
      },
    },
  },
  {
    id: 'AVERAGE_INTERVIEW_03',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q10',
        questionType: 'Interview',
        questionText: 'What is your biggest weakness and how are you working to improve it?',
        prompt: 'Show self-awareness. Explain your improvement strategy.',
        evaluationCriteria: ['Responsibility', 'Communication', 'Initiative'],
        minWords: 30,
      },
      response: {
        answer:
          'My biggest weakness is that I am too much of a perfectionist. I work on every small detail which sometimes takes more time. I am trying to improve by managing my time better.',
        wordCount: 35,
      },
    },
  },
  {
    id: 'AVERAGE_WAT_03',
    expectedQuality: 'average',
    expectedScore: 3,
    request: {
      question: {
        questionId: 'S3Q07',
        questionType: 'WAT',
        questionText: 'TEAMWORK',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Leadership', 'Communication'],
        minWords: 3,
      },
      response: {
        answer: 'Working together in a group.',
        wordCount: 6,
      },
    },
  },
];

/**
 * Weak answers (Expected score: 1-2.5)
 */
export const WEAK_ANSWERS: TestCase[] = [
  {
    id: 'WEAK_SRT_01',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q01',
        questionType: 'SRT',
        questionText:
          'You are leading a night patrol when your radio fails. You hear gunfire 2 km away. Your response?',
        evaluationCriteria: ['Initiative', 'Decision Making', 'Leadership', 'Responsibility'],
        minWords: 15,
      },
      response: {
        answer: 'I would run toward the gunfire to help.',
        wordCount: 9,
      },
    },
  },
  {
    id: 'WEAK_SRT_02',
    expectedQuality: 'weak',
    expectedScore: 1.5,
    request: {
      question: {
        questionId: 'S3Q02',
        questionType: 'SRT',
        questionText:
          'Your senior asks you to report false information to higher authority. What will you do?',
        evaluationCriteria: ['Responsibility', 'Decision Making', 'Communication', 'Leadership'],
        minWords: 15,
      },
      response: {
        answer: 'I would follow my senior\'s orders.',
        wordCount: 7,
      },
    },
  },
  {
    id: 'WEAK_INTERVIEW_01',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q08',
        questionType: 'Interview',
        questionText: 'Why do you want to join the Armed Forces?',
        prompt: 'Be honest and specific. Share your genuine motivation.',
        evaluationCriteria: ['Initiative', 'Responsibility', 'Communication', 'Leadership'],
        minWords: 30,
      },
      response: {
        answer: 'Because it is a good job and I like the uniform.',
        wordCount: 12,
      },
    },
  },
  {
    id: 'WEAK_INTERVIEW_02',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q09',
        questionType: 'Interview',
        questionText: 'Describe a situation where you showed leadership in your life.',
        prompt: 'Use a real example. Explain what you did and what you learned.',
        evaluationCriteria: ['Leadership', 'Initiative', 'Communication', 'Decision Making'],
        minWords: 40,
      },
      response: {
        answer: 'I have not shown leadership yet but I will in the future.',
        wordCount: 13,
      },
    },
  },
  {
    id: 'WEAK_WAT_01',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q05',
        questionType: 'WAT',
        questionText: 'RESPONSIBILITY',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Responsibility', 'Initiative'],
        minWords: 3,
      },
      response: {
        answer: 'Duty.',
        wordCount: 1,
      },
    },
  },
  {
    id: 'WEAK_WAT_02',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q06',
        questionType: 'WAT',
        questionText: 'CHALLENGE',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Initiative', 'Decision Making'],
        minWords: 3,
      },
      response: {
        answer: 'Difficult.',
        wordCount: 1,
      },
    },
  },
  {
    id: 'WEAK_SRT_03',
    expectedQuality: 'weak',
    expectedScore: 1.5,
    request: {
      question: {
        questionId: 'S3Q03',
        questionType: 'SRT',
        questionText: 'During training, a teammate gets injured. Medical help is 30 minutes away. Your action?',
        evaluationCriteria: ['Initiative', 'Responsibility', 'Decision Making', 'Leadership'],
        minWords: 15,
      },
      response: {
        answer: 'I would wait for help to arrive.',
        wordCount: 8,
      },
    },
  },
  {
    id: 'WEAK_SRT_04',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q04',
        questionType: 'SRT',
        questionText:
          'You discover critical equipment missing before a mission. The mission starts in 10 minutes. What do you do?',
        evaluationCriteria: ['Initiative', 'Decision Making', 'Leadership', 'Responsibility'],
        minWords: 15,
      },
      response: {
        answer: 'I would proceed with the mission without the equipment.',
        wordCount: 10,
      },
    },
  },
  {
    id: 'WEAK_INTERVIEW_03',
    expectedQuality: 'weak',
    expectedScore: 1.5,
    request: {
      question: {
        questionId: 'S3Q10',
        questionType: 'Interview',
        questionText: 'What is your biggest weakness and how are you working to improve it?',
        prompt: 'Show self-awareness. Explain your improvement strategy.',
        evaluationCriteria: ['Responsibility', 'Communication', 'Initiative'],
        minWords: 30,
      },
      response: {
        answer: 'I don\'t think I have any major weakness.',
        wordCount: 9,
      },
    },
  },
  {
    id: 'WEAK_WAT_03',
    expectedQuality: 'weak',
    expectedScore: 2,
    request: {
      question: {
        questionId: 'S3Q07',
        questionType: 'WAT',
        questionText: 'TEAMWORK',
        prompt: 'Write the first thought that comes to mind about this word.',
        evaluationCriteria: ['Leadership', 'Communication'],
        minWords: 3,
      },
      response: {
        answer: 'Group.',
        wordCount: 1,
      },
    },
  },
];

/**
 * All test cases combined
 */
export const ALL_TEST_CASES: TestCase[] = [...STRONG_ANSWERS, ...AVERAGE_ANSWERS, ...WEAK_ANSWERS];
