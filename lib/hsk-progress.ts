/**
 * hsk-progress.ts
 * Local AsyncStorage persistence for per-word HSK review states.
 * Keyed by level so each level's data is independent and compact.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { newReviewState, WordReviewState } from "./hsk-review";

// ── Storage schema ────────────────────────────────────────────────────────

type LevelProgressMap = Record<string, WordReviewState>; // word_id → state

function storageKey(level: number): string {
  return `hsk_progress_v1_level_${level}`;
}

// ── Read / Write ──────────────────────────────────────────────────────────

async function readLevel(level: number): Promise<LevelProgressMap> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(level));
    if (!raw) return {};
    return JSON.parse(raw) as LevelProgressMap;
  } catch {
    return {};
  }
}

async function writeLevel(level: number, map: LevelProgressMap): Promise<void> {
  await AsyncStorage.setItem(storageKey(level), JSON.stringify(map));
}

// ── Public API ────────────────────────────────────────────────────────────

/** Returns all review states for a level (empty map if never studied). */
export async function getLevelProgress(
  level: number,
): Promise<LevelProgressMap> {
  return readLevel(level);
}

/**
 * Returns the review state for one word.
 * Creates a new default state if none exists yet.
 */
export async function getWordState(
  level: number,
  word_id: string,
): Promise<WordReviewState> {
  const map = await readLevel(level);
  return map[word_id] ?? newReviewState(word_id);
}

/** Persists an updated review state for one word. */
export async function saveWordState(
  level: number,
  state: WordReviewState,
): Promise<void> {
  const map = await readLevel(level);
  map[state.word_id] = state;
  await writeLevel(level, map);
}

/** Persists multiple updated states in one write (batch after review session). */
export async function saveWordStates(
  level: number,
  states: WordReviewState[],
): Promise<void> {
  const map = await readLevel(level);
  for (const s of states) {
    map[s.word_id] = s;
  }
  await writeLevel(level, map);
}

/**
 * Returns aggregate stats derived from local state only.
 * A word is "learned" if reviewed at least once; "mastered" if interval >= 21 days.
 */
export async function getLocalLevelStats(
  level: number,
): Promise<{ learned: number; mastered: number }> {
  const map = await readLevel(level);
  const states = Object.values(map);
  const learned = states.filter((s) => s.repetitions > 0).length;
  const mastered = states.filter((s) => s.interval >= 21).length;
  return { learned, mastered };
}
