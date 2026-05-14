/**
 * P4.2 — Solar-term wrappers (re-exports).
 *
 * Single source of truth: `src/core/calendar/solarTerms` (lunar-typescript).
 * Adds a small helper that returns the 月支 implied by a given UTC instant.
 */

export {
  solarTermsForYear,
  previousSolarTerm,
  nextSolarTerm,
  type SolarTerm,
} from '../calendar/solarTerms';

import { previousSolarTerm } from '../calendar/solarTerms';
import type { Branch } from '../calendar/ganzhi';

const JIE_TO_BRANCH: Record<string, Branch> = {
  立春: '寅', 惊蛰: '卯', 清明: '辰', 立夏: '巳',
  芒种: '午', 小暑: '未', 立秋: '申', 白露: '酉',
  寒露: '戌', 立冬: '亥', 大雪: '子', 小寒: '丑',
};

export function monthBranchAt(utc: Date): { branch: Branch; jieName: string } | null {
  const prev = previousSolarTerm(utc);
  // walk back until we hit a 节 (not 中气).
  let p = prev;
  for (let safety = 0; safety < 25; safety++) {
    if (JIE_TO_BRANCH[p.name]) return { branch: JIE_TO_BRANCH[p.name], jieName: p.name };
    p = previousSolarTerm(new Date(p.utc.getTime() - 1000));
  }
  return null;
}
