/**
 * P4.2 — Hidden stems (地支藏干) helpers.
 */

import { HIDDEN_STEMS, type Branch, type Stem } from '../calendar/ganzhi';
import { tenGodOf, type TenGod } from '../calendar/tenGods';
import type { HiddenStemInfo } from './types';

const POSITION: ('primary' | 'secondary' | 'tertiary')[] = ['primary', 'secondary', 'tertiary'];
const WEIGHTS = [1.0, 0.5, 0.3];

export function getHiddenStems(branch: Branch): Stem[] {
  return HIDDEN_STEMS[branch];
}

export function calculateHiddenStemTenGods(dayStem: Stem, branch: Branch): HiddenStemInfo[] {
  const list = HIDDEN_STEMS[branch];
  return list.map((s, i) => ({
    stem: s,
    position: POSITION[i] ?? 'tertiary',
    weight: WEIGHTS[i] ?? 0.2,
    tenGod: tenGodOf(dayStem, s),
  }));
}
