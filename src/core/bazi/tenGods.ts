/**
 * P4.2 — Ten gods (十神) wrappers.
 *
 * Re-exports `tenGodOf` from calendar; adds branch-level convenience.
 */

import { tenGodOf, type TenGod } from '../calendar/tenGods';
import { HIDDEN_STEMS, type Stem, type Branch, type Pillar } from '../calendar/ganzhi';

export { tenGodOf };
export type { TenGod };

export function calculateTenGod(dayStem: Stem, target: Stem): TenGod {
  return tenGodOf(dayStem, target);
}

export function calculateBranchTenGods(dayStem: Stem, branch: Branch): TenGod[] {
  return HIDDEN_STEMS[branch].map((s) => tenGodOf(dayStem, s));
}

export function calculatePillarTenGods(dayStem: Stem, pillar: Pillar): {
  stemGod: TenGod;
  branchGods: TenGod[];
} {
  return {
    stemGod: tenGodOf(dayStem, pillar.stem),
    branchGods: calculateBranchTenGods(dayStem, pillar.branch),
  };
}
