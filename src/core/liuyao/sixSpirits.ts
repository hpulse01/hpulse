/**
 * P4.5 — 六神 (Six Spirits) ordered bottom→top from day stem.
 */

import type { SixSpirit } from './types';
import { SIX_SPIRITS_BY_STEM } from './constants';

export function spiritsForDayStem(dayStem: string): SixSpirit[] {
  return SIX_SPIRITS_BY_STEM[dayStem] ?? SIX_SPIRITS_BY_STEM['甲'];
}
