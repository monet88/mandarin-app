import type { RawWord } from "../parse-hsk-data";
import { hsk1Words } from "./hsk1-words";
import { hsk2Words } from "./hsk2-words";
import { hsk3Words } from "./hsk3-words";
import { hsk4Words } from "./hsk4-words";
import { hsk5Words } from "./hsk5-words";
import { hsk6Words } from "./hsk6-words";

/** Keyed by HSK level 1–6 */
export const HSK_VOCAB: Record<number, RawWord[]> = {
  1: hsk1Words,
  2: hsk2Words,
  3: hsk3Words,
  4: hsk4Words,
  5: hsk5Words,
  6: hsk6Words,
};
