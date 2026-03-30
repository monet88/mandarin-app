/**
 * parse-hsk-data.ts
 * Generates HSK 1-6 vocabulary JSON bundles and HSK 7-9 summary metadata.
 * Run: npx ts-node --skip-project scripts/parse-hsk-data.ts
 * Output: assets/data/hsk/
 *
 * Source contract: vocabulary data is embedded below. To refresh from
 * external sources (Anki exports, TSV files), replace the RAW_HSK_DATA
 * entries and re-run this script.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { HSK_VOCAB } from "./hsk-vocab-source/index";

// ── Types ──────────────────────────────────────────────────────────────────

export interface RawWord {
  hanzi: string;
  pinyin: string;
  english: string;
  pos?: string;
  frequency?: number;
}

export interface HskWord {
  word_id: string;
  hanzi: string;
  pinyin: string;
  english: string;
  pos: string;
  frequency: number;
  level: number;
}

export interface HskLevelBundle {
  level: number;
  level_name: string;
  word_count: number;
  words: HskWord[];
}

interface ManifestLevel {
  level: number;
  level_name: string;
  word_count: number;
  file: string;
  available: boolean;
  status: "available" | "coming_soon";
}

interface Hsk79Summary {
  level_name: string;
  level_range: [number, number];
  word_count_estimate: number;
  status: "coming_soon";
  description: string;
}

export interface HskManifest {
  version: string;
  generated_at: string;
  levels: ManifestLevel[];
  hsk_7_9: Hsk79Summary;
}

// ── Utilities ─────────────────────────────────────────────────────────────

/** Strip HTML tags and decode common HTML entities to plain text */
function sanitizeText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** Deterministic UUID v4-format ID from hanzi+pinyin+level (SHA-256 based) */
export function generateWordId(
  hanzi: string,
  pinyin: string,
  level: number
): string {
  const key = `${hanzi}::${pinyin}::${level}`;
  const hash = crypto.createHash("sha256").update(key, "utf8").digest("hex");
  // UUID v4 layout with forced version=4 and variant bits
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

function processWord(raw: RawWord, level: number): HskWord {
  const hanzi = sanitizeText(raw.hanzi);
  const pinyin = sanitizeText(raw.pinyin);
  return {
    word_id: generateWordId(hanzi, pinyin, level),
    hanzi,
    pinyin,
    english: sanitizeText(raw.english),
    pos: sanitizeText(raw.pos ?? ""),
    frequency: raw.frequency ?? 0,
    level,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  const outDir = path.resolve(__dirname, "../assets/data/hsk");
  fs.mkdirSync(outDir, { recursive: true });

  const manifestLevels: ManifestLevel[] = [];
  let totalSkipped = 0;

  for (let level = 1; level <= 6; level++) {
    const rawWords: RawWord[] = HSK_VOCAB[level] ?? [];
    const words: HskWord[] = [];
    const skipped: string[] = [];

    for (const raw of rawWords) {
      if (!raw.hanzi?.trim() || !raw.pinyin?.trim() || !raw.english?.trim()) {
        skipped.push(JSON.stringify(raw));
        continue;
      }
      words.push(processWord(raw, level));
    }

    if (skipped.length > 0) {
      console.warn(
        `[HSK ${level}] Skipped ${skipped.length} invalid rows:`,
        skipped.slice(0, 3)
      );
      totalSkipped += skipped.length;
    }

    const bundle: HskLevelBundle = {
      level,
      level_name: `HSK ${level}`,
      word_count: words.length,
      words,
    };

    const outFile = path.join(outDir, `hsk_level_${level}.json`);
    fs.writeFileSync(outFile, JSON.stringify(bundle, null, 2), "utf8");
    console.log(`[HSK ${level}] ${words.length} words → ${path.basename(outFile)}`);

    manifestLevels.push({
      level,
      level_name: `HSK ${level}`,
      word_count: words.length,
      file: `hsk_level_${level}.json`,
      available: true,
      status: "available",
    });
  }

  // HSK 7-9: summary metadata only (no full vocab in v1)
  const hsk79Summary: Hsk79Summary = {
    level_name: "HSK 7-9",
    level_range: [7, 9],
    word_count_estimate: 11092,
    status: "coming_soon",
    description:
      "Advanced HSK levels 7–9 covering ~11,092 words. Full content bundled in a future release.",
  };

  fs.writeFileSync(
    path.join(outDir, "hsk_level_7_9_summary.json"),
    JSON.stringify(hsk79Summary, null, 2),
    "utf8"
  );
  console.log("[HSK 7-9] Summary metadata → hsk_level_7_9_summary.json");

  // Manifest
  const manifest: HskManifest = {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    levels: manifestLevels,
    hsk_7_9: hsk79Summary,
  };

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  console.log("Manifest → manifest.json");

  if (totalSkipped > 0) {
    console.warn(`Total skipped rows across all levels: ${totalSkipped}`);
  }

  const totalWords = manifestLevels.reduce((s, l) => s + l.word_count, 0);
  console.log(`\nDone. Total words: ${totalWords}`);
}

main();
