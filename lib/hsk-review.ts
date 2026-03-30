/**
 * hsk-review.ts
 * Simplified SM-2 spaced repetition scheduler for HSK vocabulary.
 * Quality ratings: 0 = forgot, 1 = hard, 2 = good, 3 = easy.
 * Keeps all scheduling state in a plain serialisable record.
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type ReviewQuality = 0 | 1 | 2 | 3;

export interface WordReviewState {
  word_id: string;
  /** SM-2 ease factor (starts at 2.5) */
  ease_factor: number;
  /** Days until next review */
  interval: number;
  /** Consecutive correct reviews */
  repetitions: number;
  /** ISO timestamp of next due date */
  due_at: string;
  /** ISO timestamp of last review */
  last_reviewed_at: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

const MIN_EASE = 1.3;
const INITIAL_EASE = 2.5;

// ── SM-2 core ─────────────────────────────────────────────────────────────

/**
 * Returns updated review state after a single review session.
 * Does NOT mutate the input.
 */
export function applyReview(
  state: WordReviewState,
  quality: ReviewQuality,
): WordReviewState {
  let { ease_factor, interval, repetitions } = state;

  if (quality < 2) {
    // Failed — reset streak, short retry
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);

    repetitions += 1;
    ease_factor = Math.max(
      MIN_EASE,
      ease_factor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02),
    );
  }

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + interval);

  return {
    ...state,
    ease_factor,
    interval,
    repetitions,
    due_at: due.toISOString(),
    last_reviewed_at: now.toISOString(),
  };
}

/**
 * Creates a fresh review state for a word that has never been reviewed.
 * Due immediately so it appears in the first study session.
 */
export function newReviewState(word_id: string): WordReviewState {
  return {
    word_id,
    ease_factor: INITIAL_EASE,
    interval: 0,
    repetitions: 0,
    due_at: new Date().toISOString(),
    last_reviewed_at: null,
  };
}

/** Returns true if the word is due for review now. */
export function isDue(state: WordReviewState): boolean {
  return new Date(state.due_at) <= new Date();
}

/** Filters and sorts a list of states to only those due now, soonest first. */
export function getDueWords(states: WordReviewState[]): WordReviewState[] {
  return states
    .filter(isDue)
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
}
