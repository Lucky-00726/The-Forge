// ─────────────────────────────────────────────────────────────
// THE FORGE — Progression Constants
// Single source of truth for:
//   - Rank definitions and thresholds
//   - XP values per question type and difficulty
//   - Session 3 effort-based XP tiers
//   - Rank computation helpers
//
// Sprint 1 note: existing rank names (Cadet / Officer / Commander)
// and thresholds (0 / 400 / 1200) are preserved exactly as they exist
// in production. Rank title and threshold redesign is scheduled for
// Sprint 2 after the XP economy is rebalanced and session limits are
// in place. Item 1 is an architectural refactor only.
// ─────────────────────────────────────────────────────────────

// ── Rank definitions ─────────────────────────────────────────
// Ordered ascending by minXP. The last entry has no ceiling.
// Values match production exactly (previously hardcoded in
// index.tsx as RANK_THRESHOLDS and in profile.tsx as RANKS).
export const RANKS: ReadonlyArray<{ name: string; minXP: number }> = [
  { name: 'Cadet',     minXP: 0    },
  { name: 'Officer',   minXP: 400  },
  { name: 'Commander', minXP: 1200 },
] as const;

// ── XP per MCQ question by difficulty ────────────────────────
export const MCQ_XP: Readonly<Record<'Easy' | 'Medium' | 'Hard', number>> = {
  Easy:   5,
  Medium: 10,
  Hard:   20,
} as const;

// ── XP for RapidResponse questions ───────────────────────────
// Higher than MCQ to reward time-pressure performance.
export const RAPID_RESPONSE_XP = 25;

// ── Session 3 base XP per question type ──────────────────────
// Applied before the effort multiplier (see EFFORT_TIERS below).
export const SESSION3_BASE_XP: Readonly<Record<'SRT' | 'WAT' | 'Interview', number>> = {
  SRT:       10,
  WAT:       10,
  Interview: 10,
} as const;

// ── Session 3 effort multiplier tiers ────────────────────────
// Ordered ascending by minWords. First matching tier is applied.
export const EFFORT_TIERS: ReadonlyArray<{
  minWords:   number;
  maxWords:   number;
  multiplier: number;
}> = [
  { minWords:   0, maxWords:   9, multiplier: 0    },
  { minWords:  10, maxWords:  29, multiplier: 0.75 },
  { minWords:  30, maxWords:  59, multiplier: 1.0  },
  { minWords:  60, maxWords:  99, multiplier: 1.25 },
  { minWords: 100, maxWords: Infinity, multiplier: 1.5  },
] as const;

// ── Bonus XP for completing all 3 sessions in one day ────────
// Awarded once per day by daily-session.service when all 3 sessions
// are marked complete. (Implemented in Sprint 1 Item 8.)
export const DAILY_COMPLETE_BONUS_XP = 30;

// ─────────────────────────────────────────────────────────────
// HELPER: computeRank
// Returns the rank name for a given total XP value.
// Always returns a valid rank name — defaults to the first rank.
// ─────────────────────────────────────────────────────────────
export function computeRank(totalXP: number): string {
  let rank = RANKS[0].name;
  for (const r of RANKS) {
    if (totalXP >= r.minXP) {
      rank = r.name;
    } else {
      break;
    }
  }
  return rank;
}

// ─────────────────────────────────────────────────────────────
// HELPER: computeRankProgress
// Returns all data needed to render a rank progress bar.
//
// Returns:
//   current   — the rank the user is currently in
//   next      — the next rank, or null if at max rank
//   pct       — progress % toward the next rank (0–100)
//   xpToNext  — XP remaining to reach the next rank
// ─────────────────────────────────────────────────────────────
export interface RankProgress {
  current:  { name: string; minXP: number };
  next:     { name: string; minXP: number } | null;
  pct:      number;
  xpToNext: number;
}

export function computeRankProgress(totalXP: number): RankProgress {
  let currentIndex = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (totalXP >= RANKS[i].minXP) {
      currentIndex = i;
      break;
    }
  }

  const current = RANKS[currentIndex];
  const next    = RANKS[currentIndex + 1] ?? null;

  if (!next) {
    return { current, next: null, pct: 100, xpToNext: 0 };
  }

  const band     = next.minXP - current.minXP;
  const into     = totalXP - current.minXP;
  const pct      = Math.min(Math.round((into / band) * 100), 100);
  const xpToNext = next.minXP - totalXP;

  return { current, next, pct, xpToNext };
}

// ─────────────────────────────────────────────────────────────
// HELPER: computeSession3XP
// Returns XP earned for one Session 3 response based on word count.
// Uses SESSION3_BASE_XP and EFFORT_TIERS.
// Result is floored to an integer.
// ─────────────────────────────────────────────────────────────
export function computeSession3XP(
  type:      'SRT' | 'WAT' | 'Interview',
  wordCount: number,
): number {
  const base       = SESSION3_BASE_XP[type];
  const tier       = EFFORT_TIERS.find(
    (t) => wordCount >= t.minWords && wordCount <= t.maxWords,
  );
  const multiplier = tier?.multiplier ?? 0;
  return Math.floor(base * multiplier);
}
