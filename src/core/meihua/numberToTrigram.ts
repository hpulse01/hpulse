/**
 * P4.6 — Number → Trigram (Shao Yong 先天数法).
 * 上卦数 mod 8（0→8 即坤），下卦数 mod 8，动爻 = (上+下+时) mod 6（0→6）。
 */
import type { Trigram } from './types';
import { TRIGRAM_BY_PREHEAVEN } from './constants';

export function trigramFromNumber(n: number): Trigram {
  const safe = Math.max(0, Math.floor(Math.abs(n)));
  const mod = safe % 8;
  const num = mod === 0 ? 8 : mod;
  return TRIGRAM_BY_PREHEAVEN[num];
}

export function movingLineFromSum(sum: number): number {
  const safe = Math.max(0, Math.floor(Math.abs(sum)));
  const mod = safe % 6;
  return mod === 0 ? 6 : mod;
}
