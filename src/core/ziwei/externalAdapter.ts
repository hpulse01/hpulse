/**
 * P4.4b — Adapter: convert internal ZiweiChart → external (倪师/hpulse01) ZiweiChart shape.
 *
 * Used by `extendedPatterns.ts` so we can re-use the 100+ pattern detectors from
 * `src/core/ziwei/external/ziwei/patterns.ts` without re-implementing them.
 */

import type { ZiweiChart as InternalChart, ZiweiPalace as InternalPalace, StarBrightness } from './types';
import type {
  ZiweiChart as ExternalChart,
  Palace as ExternalPalace,
  Star as ExternalStar,
} from './external/ziwei/types';
import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from './constants';

function mapBrightness(b: StarBrightness | undefined): 'bright' | 'normal' | 'dim' {
  if (b === '庙' || b === '旺') return 'bright';
  if (b === '陷') return 'dim';
  return 'normal';
}

function mapStarType(t: ExternalStar['type'] | string): ExternalStar['type'] {
  if (t === 'major' || t === 'minor' || t === 'lucky' || t === 'sha') return t;
  // internal 'auxiliary' → external 'lucky'
  return 'lucky';
}

function branchToIndex(branchChar: string): number {
  // external uses 0=子..11=亥
  return Math.max(0, (EARTHLY_BRANCHES as readonly string[]).indexOf(branchChar));
}

function adaptPalace(p: InternalPalace): ExternalPalace {
  const stars: ExternalStar[] = p.stars.map((s) => ({
    name: s.name,
    type: mapStarType(s.type),
    siHua: s.sihua,
    brightness: mapBrightness(s.brightness),
  }));
  return {
    branch: branchToIndex(p.branch),
    stem: p.stem ? HEAVENLY_STEMS.indexOf(p.stem) : 0,
    name: p.name,
    stars,
    isMingGong: p.isMing,
    isShenGong: p.isShen,
    oppositeBranch: p.oppositeBranch ? branchToIndex(p.oppositeBranch) : (branchToIndex(p.branch) + 6) % 12,
    isEmpty: p.isEmpty,
    borrowedFromBranch: p.borrowedFromBranch ? branchToIndex(p.borrowedFromBranch) : undefined,
    borrowedFromName: p.borrowedFromName,
    borrowedStars: p.borrowedStars,
  };
}

export function adaptToExternal(chart: InternalChart): ExternalChart {
  const palaces = chart.palaces.map(adaptPalace);
  return {
    birthInfo: {
      year: chart.solarDate.year,
      month: chart.solarDate.month,
      day: chart.solarDate.day,
      hour: chart.hourBranchIndex,
      gender: 'male', // gender not needed for pattern detection
    },
    lunarInfo: {
      lunarYear: chart.lunarYear,
      lunarMonth: chart.lunarMonth,
      lunarDay: chart.lunarDay,
      yearStem: HEAVENLY_STEMS.indexOf(chart.yearGan),
      yearBranch: EARTHLY_BRANCHES.indexOf(chart.yearZhi),
      isLeapMonth: chart.isLeapMonth,
    },
    mingGongBranch: branchToIndex(chart.mingGongBranch),
    shenGongBranch: branchToIndex(chart.shenGongBranch),
    wuxingJu: chart.wuxingJu.number,
    wuxingJuName: chart.wuxingJu.name,
    ziweiPos: chart.ziweiPosition,
    palaces,
    daXians: chart.daxian.map((dx) => ({
      startAge: dx.startAge,
      endAge: dx.endAge,
      palaceBranch: branchToIndex(dx.branch),
      palaceName: dx.palaceName,
    })),
    currentAge: 0,
    currentDaXianIndex: -1,
  };
}
