/**
 * P4.2 — 旬空 (Kong Wang) helpers per pillar.
 */

import { voidBranches, type Pillar, type Branch } from '../calendar/ganzhi';

export function kongWangBranches(dayPillar: Pillar): [Branch, Branch] {
  return voidBranches(dayPillar);
}

export function isBranchKongWang(branch: Branch, dayPillar: Pillar): boolean {
  const [a, b] = voidBranches(dayPillar);
  return branch === a || branch === b;
}
