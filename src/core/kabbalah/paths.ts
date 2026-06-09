/**
 * The 22 paths of the Tree of Life (paths 11..32, Golden Dawn attribution).
 * Each path connects two sephirot and carries one of the 22 Hebrew letters.
 */
import type { TreePath } from './types';

export const TREE_PATHS: TreePath[] = [
  { number: 11, letter: 'א', letterName: 'Aleph',  from: 'Keter',    to: 'Chokhmah', meaning: 'Breath of life — pure spirit, beginnings' },
  { number: 12, letter: 'ב', letterName: 'Bet',    from: 'Keter',    to: 'Binah',    meaning: 'House — communication, conscious mind' },
  { number: 13, letter: 'ג', letterName: 'Gimel',  from: 'Keter',    to: 'Tiferet',  meaning: 'Camel — crossing the abyss, intuition' },
  { number: 14, letter: 'ד', letterName: 'Dalet',  from: 'Chokhmah', to: 'Binah',    meaning: 'Door — fertility, creative union' },
  { number: 15, letter: 'ה', letterName: 'He',     from: 'Chokhmah', to: 'Tiferet',  meaning: 'Window — vision, insight' },
  { number: 16, letter: 'ו', letterName: 'Vav',    from: 'Chokhmah', to: 'Chesed',   meaning: 'Nail — connection, tradition' },
  { number: 17, letter: 'ז', letterName: 'Zayin',  from: 'Binah',    to: 'Tiferet',  meaning: 'Sword — discrimination, duality' },
  { number: 18, letter: 'ח', letterName: 'Chet',   from: 'Binah',    to: 'Gevurah',  meaning: 'Fence — boundary, receptivity' },
  { number: 19, letter: 'ט', letterName: 'Tet',    from: 'Chesed',   to: 'Gevurah',  meaning: 'Serpent — strength, inner power' },
  { number: 20, letter: 'י', letterName: 'Yod',    from: 'Chesed',   to: 'Tiferet',  meaning: 'Hand — solitude, contemplation' },
  { number: 21, letter: 'כ', letterName: 'Kaf',    from: 'Chesed',   to: 'Netzach',  meaning: 'Palm — fortune, cycles' },
  { number: 22, letter: 'ל', letterName: 'Lamed',  from: 'Gevurah',  to: 'Tiferet',  meaning: 'Ox-goad — justice, balance' },
  { number: 23, letter: 'מ', letterName: 'Mem',    from: 'Gevurah',  to: 'Hod',      meaning: 'Water — surrender, reversal' },
  { number: 24, letter: 'נ', letterName: 'Nun',    from: 'Tiferet',  to: 'Netzach',  meaning: 'Fish — transformation, death/rebirth' },
  { number: 25, letter: 'ס', letterName: 'Samekh', from: 'Tiferet',  to: 'Yesod',    meaning: 'Prop — temperance, testing' },
  { number: 26, letter: 'ע', letterName: 'Ayin',   from: 'Tiferet',  to: 'Hod',      meaning: 'Eye — materiality, shadow work' },
  { number: 27, letter: 'פ', letterName: 'Pe',     from: 'Netzach',  to: 'Hod',      meaning: 'Mouth — sudden change, awakening' },
  { number: 28, letter: 'צ', letterName: 'Tzaddi', from: 'Netzach',  to: 'Yesod',    meaning: 'Fish-hook — hope, meditation' },
  { number: 29, letter: 'ק', letterName: 'Qof',    from: 'Netzach',  to: 'Malkuth',  meaning: 'Back of head — the unconscious, dreams' },
  { number: 30, letter: 'ר', letterName: 'Resh',   from: 'Hod',      to: 'Yesod',    meaning: 'Head — clarity, regeneration' },
  { number: 31, letter: 'ש', letterName: 'Shin',   from: 'Hod',      to: 'Malkuth',  meaning: 'Tooth — judgement, spiritual fire' },
  { number: 32, letter: 'ת', letterName: 'Tav',    from: 'Yesod',    to: 'Malkuth',  meaning: 'Cross — completion, the world' },
];

/** Path carrying a given Hebrew letter (final forms normalized). */
const FINAL_TO_STANDARD: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

export function pathFromLetter(letter: string): TreePath | null {
  const std = FINAL_TO_STANDARD[letter] ?? letter;
  return TREE_PATHS.find((p) => p.letter === std) ?? null;
}

/** Deterministic primary path from gematria total: ((total - 1) mod 22) → path 11..32. */
export function pathFromNumber(n: number): TreePath {
  const idx = ((Math.abs(Math.trunc(n)) - 1) % 22 + 22) % 22;
  return TREE_PATHS[idx];
}
