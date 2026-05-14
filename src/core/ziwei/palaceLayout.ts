/**
 * P4.4 — 12 palace layout, 命宫/身宫 location, 三方四正.
 */

import type { ExplanationStep } from '../astro-time/types';
import type { Branch, PalaceName } from './types';
import { PALACE_ORDER, PALACE_BRANCH_ORDER } from './constants';

export interface MingShenResult {
  mingIndex: number; // 0..11 in PALACE_BRANCH_ORDER ring
  shenIndex: number;
  mingGongBranch: Branch;
  shenGongBranch: Branch;
  explanationTrace: ExplanationStep[];
}

/**
 * 命宫 = (寅起正月，逆数至生月，再起子时顺数至生时所止)
 * 实现 (lunarMonth + hourIndex - 1) mod 12，与旧实现保持一致。
 * hourBranchIndex 0=子 .. 11=亥；hourIndex = hourBranchIndex + 1.
 */
export function calculateMingShenGong(
  lunarMonth: number,
  hourBranchIndex: number,
): MingShenResult {
  const trace: ExplanationStep[] = [];
  const hourIndex = hourBranchIndex + 1;
  const mingIndex = ((lunarMonth + hourIndex - 1) % 12 + 12) % 12;
  const shenIndex = ((mingIndex + hourIndex - 1) % 12 + 12) % 12;
  const mingGongBranch = PALACE_BRANCH_ORDER[mingIndex];
  const shenGongBranch = PALACE_BRANCH_ORDER[shenIndex];

  trace.push({
    rule: 'ziwei.palace.mingGong',
    detail: `命宫: 寅起正月，逆数至农历 ${lunarMonth} 月，再顺数至时辰 index ${hourBranchIndex}; 命宫地支=${mingGongBranch}`,
    data: { lunarMonth, hourBranchIndex, mingIndex, mingGongBranch },
  });
  trace.push({
    rule: 'ziwei.palace.shenGong',
    detail: `身宫: 由命宫顺数至生时位置; 身宫地支=${shenGongBranch}`,
    data: { mingIndex, hourIndex, shenIndex, shenGongBranch },
  });

  return { mingIndex, shenIndex, mingGongBranch, shenGongBranch, explanationTrace: trace };
}

export interface PalaceLayoutEntry {
  name: PalaceName;
  index: number;        // 0..11 in PALACE_BRANCH_ORDER ring
  branch: Branch;
  isMing: boolean;
  isShen: boolean;
  sanFang: PalaceName[];
  duiGong: PalaceName;
}

/**
 * 12 palace layout. Names are placed counter-clockwise starting from 命宫:
 * 命宫 → 兄弟 → 夫妻 → ... 父母 (按地支逆向)
 *
 * 三方四正：本宫的对宫 (+6) + 三合 (+4, +8) — 命宫的三方为官禄/财帛.
 */
export function buildPalaceLayout(
  mingIndex: number,
  shenIndex: number,
): { palaces: PalaceLayoutEntry[]; explanationTrace: ExplanationStep[] } {
  const trace: ExplanationStep[] = [];
  const palaces: PalaceLayoutEntry[] = [];

  for (let i = 0; i < 12; i++) {
    const branchIndex = ((mingIndex - i) % 12 + 12) % 12;
    const branch = PALACE_BRANCH_ORDER[branchIndex];
    const name = PALACE_ORDER[i] as PalaceName;

    // Compute san-fang & dui-gong by palace-name offsets (which are stable).
    const duiGongName = PALACE_ORDER[(i + 6) % 12] as PalaceName;
    const sanFangNames: PalaceName[] = [
      PALACE_ORDER[(i + 4) % 12] as PalaceName,
      PALACE_ORDER[(i + 8) % 12] as PalaceName,
    ];

    palaces.push({
      name,
      index: branchIndex,
      branch,
      isMing: branchIndex === mingIndex,
      isShen: branchIndex === shenIndex,
      sanFang: sanFangNames,
      duiGong: duiGongName,
    });
  }

  trace.push({
    rule: 'ziwei.palace.layout',
    detail: `12宫从命宫(${PALACE_BRANCH_ORDER[mingIndex]})逆数排布完成`,
    data: { mingIndex, palaceCount: 12 },
  });

  return { palaces, explanationTrace: trace };
}
