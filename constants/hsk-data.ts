/**
 * hsk-data.ts
 * TypeScript types for HSK vocabulary assets and manifest loader.
 * Bundled JSON files live in assets/data/hsk/.
 */

// ── Core word record ───────────────────────────────────────────────────────

export interface HskWord {
  /** Deterministic UUID derived from hanzi+pinyin+level (SHA-256) */
  word_id: string;
  hanzi: string;
  pinyin: string;
  english: string;
  /** Part of speech: n, v, adj, adv, prep, conj, part, pron, num, m, aux, expr, interj */
  pos: string;
  /** Relative frequency rank within the level (1 = most frequent) */
  frequency: number;
  level: number;
}

// ── Level bundle (one file per HSK 1-6) ──────────────────────────────────

export interface HskLevelBundle {
  level: number;
  level_name: string;
  word_count: number;
  words: HskWord[];
}

// ── Manifest ──────────────────────────────────────────────────────────────

export interface HskManifestLevel {
  level: number;
  level_name: string;
  word_count: number;
  /** Filename relative to assets/data/hsk/ */
  file: string;
  available: boolean;
  status: "available" | "coming_soon";
}

export interface Hsk79Summary {
  level_name: string;
  level_range: [number, number];
  word_count_estimate: number;
  status: "coming_soon";
  description: string;
}

export interface HskManifest {
  version: string;
  generated_at: string;
  levels: HskManifestLevel[];
  hsk_7_9: Hsk79Summary;
}

// ── Bundled manifest (loaded at build time) ───────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const manifestJson = require("@/assets/data/hsk/manifest.json");
export const HSK_MANIFEST: HskManifest = manifestJson as HskManifest;

// ── Convenience helpers ───────────────────────────────────────────────────

/** Returns manifest entries for levels that are fully available (HSK 1-6). */
export function getAvailableLevels(): HskManifestLevel[] {
  return HSK_MANIFEST.levels.filter((l) => l.status === "available");
}

/** Returns total bundled word count across HSK 1-6. */
export function getTotalBundledWordCount(): number {
  return getAvailableLevels().reduce((sum, l) => sum + l.word_count, 0);
}
