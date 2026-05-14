/**
 * P4.6 — Meihua trigram helpers.
 */
import type { Trigram, TrigramName, Hexagram } from './types';
import { TRIGRAMS, TRIGRAM_BY_NAME, HEXAGRAM_NAMES } from './constants';

export function trigramFromBits(bits: [0|1, 0|1, 0|1]): Trigram {
  for (const t of TRIGRAMS) {
    if (t.bits[0] === bits[0] && t.bits[1] === bits[1] && t.bits[2] === bits[2]) return t;
  }
  return TRIGRAM_BY_NAME['坤'];
}

export function trigramByName(name: TrigramName): Trigram {
  return TRIGRAM_BY_NAME[name];
}

export function buildHexagram(upper: Trigram, lower: Trigram): Hexagram {
  const bits: (0|1)[] = [
    lower.bits[0], lower.bits[1], lower.bits[2],
    upper.bits[0], upper.bits[1], upper.bits[2],
  ];
  const key = `${upper.name}_${lower.name}`;
  const name = HEXAGRAM_NAMES[key] ?? `${upper.attribute}${lower.attribute}`;
  return { name, upper, lower, bits };
}

/**
 * 互卦：取本卦 2,3,4 爻为下卦，3,4,5 爻为上卦（爻位 1..6 自下而上）。
 */
export function deriveHuGua(ben: Hexagram): Hexagram {
  const b = ben.bits; // [1..6] zero-indexed [0..5]
  const lower = trigramFromBits([b[1], b[2], b[3]]);
  const upper = trigramFromBits([b[2], b[3], b[4]]);
  return buildHexagram(upper, lower);
}

/**
 * 变卦：动爻阴阳互换。
 */
export function deriveBianGua(ben: Hexagram, movingLine: number): Hexagram {
  const idx = movingLine - 1;
  const b = ben.bits.slice() as (0|1)[];
  b[idx] = (b[idx] === 1 ? 0 : 1);
  const lower = trigramFromBits([b[0], b[1], b[2]]);
  const upper = trigramFromBits([b[3], b[4], b[5]]);
  return buildHexagram(upper, lower);
}
