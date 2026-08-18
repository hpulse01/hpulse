/**
 * P4.10 — Kabbalah constants.
 *
 * Hebrew letter values. Mispar Hechrachi keeps final forms (sofit) at the
 * corresponding base-letter value. The explicitly named Mispar Gadol
 * variant below continues the five final forms through 500..900.
 */
import type { SephirahMapping, SephirahName } from './types';

/** 22 Hebrew letters, value table. */
export const HEBREW_GEMATRIA: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5,
  'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10,
  'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40,
  'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80,
  'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
};

/** Mispar Gadol final-letter values (the 500..900 sofit variant). */
export const HEBREW_FINAL_GADOL: Record<string, number> = {
  'ך': 500,
  'ם': 600,
  'ן': 700,
  'ף': 800,
  'ץ': 900,
};

/** Full value table for the 500..900 final-letter Mispar Gadol variant. */
export const HEBREW_GEMATRIA_GADOL: Record<string, number> = {
  ...HEBREW_GEMATRIA,
  ...HEBREW_FINAL_GADOL,
};

/** The 22 Hebrew letters in alphabetical order (no final forms). */
export const HEBREW_ALPHABET: string[] = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ',
  'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת',
];

/**
 * Approximate Latin → Hebrew transliteration for gematria (used only when
 * the input contains no Hebrew). This is intentionally a coarse phonetic
 * map; we mark the gematria result as `transliterated` and emit a warning.
 */
export const LATIN_TO_HEBREW: Record<string, string> = {
  A: 'א', B: 'ב', C: 'כ', D: 'ד', E: 'ה', F: 'פ', G: 'ג',
  H: 'ה', I: 'י', J: 'י', K: 'כ', L: 'ל', M: 'מ', N: 'נ',
  O: 'ע', P: 'פ', Q: 'ק', R: 'ר', S: 'ס', T: 'ת', U: 'ו',
  V: 'ו', W: 'ו', X: 'כ', Y: 'י', Z: 'ז',
};

/** 10 Sephirot of the Tree of Life. */
export const SEPHIROT: SephirahMapping[] = [
  { number: 1,  name: 'Keter',    attribute: 'Crown — divine will' },
  { number: 2,  name: 'Chokhmah', attribute: 'Wisdom — flash of insight' },
  { number: 3,  name: 'Binah',    attribute: 'Understanding — structure' },
  { number: 4,  name: 'Chesed',   attribute: 'Mercy — loving-kindness' },
  { number: 5,  name: 'Gevurah',  attribute: 'Strength — judgement' },
  { number: 6,  name: 'Tiferet',  attribute: 'Beauty — harmony' },
  { number: 7,  name: 'Netzach',  attribute: 'Victory — endurance' },
  { number: 8,  name: 'Hod',      attribute: 'Splendor — intellect' },
  { number: 9,  name: 'Yesod',    attribute: 'Foundation — connection' },
  { number: 10, name: 'Malkuth',  attribute: 'Kingdom — manifestation' },
];

export const SEPHIRAH_NAMES: SephirahName[] = SEPHIROT.map((s) => s.name);
