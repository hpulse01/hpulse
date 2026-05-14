/**
 * 时辰 (Chinese double-hour) and 时柱 derivation.
 *
 * Branch of 时辰: each pair of civil hours maps to one branch starting at 子
 * (23:00–00:59). The 23:00 hour is 子时, but whether it belongs to the
 * preceding day (早子时 of next day per "晚子时" tradition) or the new day
 * depends on policy. We expose `dayBoundaryPolicy`:
 *   - 'zi-shi-23'   → at 23:00 the day pillar advances (most schools, 早晚子时合并算次日)
 *   - 'midnight-00' → day pillar advances at 00:00 only
 *
 * Stem of 时辰: derived from day stem via the standard 五鼠遁 rule.
 *
 * 五鼠遁: hourStemIndex = (dayStemIndex % 5) * 2 + branchIndex, mod 10.
 * Where dayStemIndex 甲=0, 乙=1, ..., 癸=9; branchIndex 子=0, ..., 亥=11.
 *
 * Verified mapping (子时 stem):
 *   甲/己日 → 甲子时
 *   乙/庚日 → 丙子时
 *   丙/辛日 → 戊子时
 *   丁/壬日 → 庚子时
 *   戊/癸日 → 壬子时
 */

import { BRANCHES, makePillar, STEMS, type Branch, type Pillar, type Stem } from './ganzhi';
import type { DayBoundaryPolicy } from '../astro-time/types';

/** Branch of the Chinese double-hour for a given civil hour (0..23). */
export function hourBranchOf(hour: number): Branch {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`hour out of range: ${hour}`);
  }
  // 23,0 → 子(0); 1,2 → 丑(1); 3,4 → 寅(2); ...
  const idx = Math.floor(((hour + 1) % 24) / 2);
  return BRANCHES[idx];
}

/** Index of branch 0..11. */
function branchIndex(b: Branch): number {
  return BRANCHES.indexOf(b);
}

/** Index of stem 0..9. */
function stemIndex(s: Stem): number {
  return STEMS.indexOf(s);
}

/**
 * 五鼠遁 — derive hour stem from day stem and hour branch.
 */
export function hourStemOf(dayStem: Stem, hourBranch: Branch): Stem {
  const ds = stemIndex(dayStem);
  const bi = branchIndex(hourBranch);
  const hs = ((ds % 5) * 2 + bi) % 10;
  return STEMS[hs];
}

export function hourPillarOf(dayStem: Stem, hour: number): Pillar {
  const branch = hourBranchOf(hour);
  const stem = hourStemOf(dayStem, branch);
  return makePillar(stem, branch);
}

/**
 * Decide whether a 23:xx local hour should advance the day pillar to the
 * NEXT day's 子时 (true) or remain on the current day (false).
 */
export function shouldAdvanceDayAt23(policy: DayBoundaryPolicy): boolean {
  return policy === 'zi-shi-23';
}
