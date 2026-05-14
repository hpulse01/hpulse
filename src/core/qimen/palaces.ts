/**
 * P4.7 — 九宫位置 helper (palace meta + element relations).
 */
import type { PalaceNumber } from './types';
import { PALACE_META } from './constants';

export function palaceTrigram(p: PalaceNumber): string {
  return PALACE_META[p].trigram;
}
export function palaceDirection(p: PalaceNumber): string {
  return PALACE_META[p].direction;
}
export function palaceElement(p: PalaceNumber): string {
  return PALACE_META[p].element;
}
