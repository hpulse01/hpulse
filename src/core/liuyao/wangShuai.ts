/**
 * P4.5 — 旺衰 (monthly strength) + 日辰生克 + 空亡.
 */

import type { FiveElement, WangShuai } from './types';
import { MONTHLY_STRENGTH, WUXING_KE, WUXING_SHENG, XUN_KONG_TABLE } from './constants';

export function monthStrength(monthBranch: string, branchElement: FiveElement): WangShuai {
  return MONTHLY_STRENGTH[monthBranch]?.[branchElement] ?? '休';
}

export function dayRelation(dayElement: FiveElement, branchElement: FiveElement): string {
  if (dayElement === branchElement) return '日辰比和';
  if (WUXING_SHENG[dayElement] === branchElement) return '日辰生之';
  if (WUXING_KE[dayElement] === branchElement) return '日辰克之';
  if (WUXING_SHENG[branchElement] === dayElement) return '泄于日辰';
  if (WUXING_KE[branchElement] === dayElement) return '克日辰';
  return '日辰无关';
}

export function voidBranchesForDay(dayGanzhi: string): string[] {
  for (const xun of XUN_KONG_TABLE) {
    if (xun.stems.includes(dayGanzhi)) return [...xun.voids];
  }
  return [];
}

export function isVoid(branch: string, voidBranches: string[]): boolean {
  return voidBranches.includes(branch);
}
