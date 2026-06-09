/**
 * P4.10 — Pythagorean numerology constants.
 *
 * Letter → digit mapping (1..9, columns A..I, J..R, S..Z+):
 *   1: A J S
 *   2: B K T
 *   3: C L U
 *   4: D M V
 *   5: E N W
 *   6: F O X
 *   7: G P Y
 *   8: H Q Z
 *   9: I R
 */
export const PYTHAGOREAN_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
/** Y is treated as a vowel only when it functions as one — for determinism we always
 *  treat Y as a CONSONANT in Pythagorean analysis (a defensible Cheiro/Modern variant
 *  that yields stable results). Documented in uncertaintyNotes. */

export const MASTER_NUMBERS = new Set([11, 22, 33]);

/** Karmic Debt numbers — flagged when an UNREDUCED core total equals one of these. */
export const KARMIC_DEBT_NUMBERS = new Set([13, 14, 16, 19]);

/**
 * Chaldean letter → digit mapping (1..8; 9 is sacred and never assigned).
 * Sound-based ancient Babylonian system.
 */
export const CHALDEAN_MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};
