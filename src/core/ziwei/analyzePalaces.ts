/**
 * P4.4 — 12 宫语义化解释.
 */

import type { ZiweiPalace } from './types';
import { PALACE_ASPECT_LABELS } from './constants';

export function analyzePalaces(palaces: ZiweiPalace[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of palaces) {
    const aspect = PALACE_ASPECT_LABELS[p.name] ?? p.name;
    out[p.name] = `${aspect}方面：${p.evaluation}`;
  }
  return out;
}
