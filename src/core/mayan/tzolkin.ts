/**
 * P4.10 — Tzolkin computation.
 *
 * Calibration check: at JD = 584283 (Long Count 0.0.0.0.0):
 *   tone = ((584283 + 5) mod 13) + 1 = (588 mod 13) + 1 → check
 *   sign = (584283 + 16) mod 20 = (...) mod 20
 * Both must yield 4 Ahau (tone 4, signIndex 19).
 */
import { DAY_SIGNS } from './constants';
import type { TzolkinDay } from './types';

const SIGN_OFFSET = 16; // chosen so JD 584283 → Ahau (index 19)
const TONE_OFFSET = 5;  // chosen so JD 584283 → tone 4

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function tzolkinFromJulianDay(jd: number): TzolkinDay {
  const jdInt = Math.floor(jd);
  const signIndex = mod(jdInt + SIGN_OFFSET, 20);
  const tone = mod(jdInt + TONE_OFFSET, 13) + 1;
  // 260-day cycle position (1..260) — combine tone + sign via CRT.
  // The classical formula: position = ((tone-1) * 40 + signIndex * 221) mod 260 + 1
  // simplified: find smallest positive p such that
  //   (p-1) mod 13 = tone-1 and (p-1) mod 20 = signIndex.
  // Direct formula via CRT (gcd(13,20)=1):
  //   p-1 ≡ 40*(tone-1) + 221*signIndex  (mod 260)
  const position = mod(40 * (tone - 1) + 221 * signIndex, 260) + 1;
  return { tone, sign: DAY_SIGNS[signIndex], signIndex, position };
}
