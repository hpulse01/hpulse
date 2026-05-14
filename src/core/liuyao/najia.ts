/**
 * P4.5 — Najia (纳甲装卦) — pure deterministic line→branch/stem assignment.
 */

import type { NajiaLine } from './types';
import { BRANCH_ELEMENTS } from './constants';
import { NA_JIA } from './hexagramTables';

/**
 * Apply 纳甲 to a (lowerTrigramName, upperTrigramName) pair.
 * Returns 6 lines bottom→top with branch/stem/element.
 */
export function applyNajia(lowerName: string, upperName: string): NajiaLine[] {
  const lower = NA_JIA[lowerName];
  const upper = NA_JIA[upperName];
  if (!lower || !upper) {
    throw new Error(`Najia table missing for trigrams: lower=${lowerName} upper=${upperName}`);
  }
  const out: NajiaLine[] = [];
  for (let i = 0; i < 3; i++) {
    out.push({
      position: i + 1,
      branch: lower.innerBranches[i],
      stem: lower.innerStem,
      element: BRANCH_ELEMENTS[lower.innerBranches[i]],
    });
  }
  for (let i = 0; i < 3; i++) {
    out.push({
      position: 4 + i,
      branch: upper.outerBranches[i],
      stem: upper.outerStem,
      element: BRANCH_ELEMENTS[upper.outerBranches[i]],
    });
  }
  return out;
}
