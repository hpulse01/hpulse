/**
 * P4.4 / P4.4b — 四化 (year-stem driven 禄/权/科/忌)
 *               + 宫干自化 + 来因宫追溯 + 大限/流年/流月四化.
 *
 * 倪师《天纪》体系兼容：本命四化静态，飞星派工具仅在显式调用时使用。
 */

import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import type {
  SihuaInfo, SihuaTransform, Stem, Branch, ZiweiPalace, ZiweiChart, SelfSihuaMark,
} from './types';
import { SIHUA_TABLE, SIHUA_MEANINGS, HEAVENLY_STEMS, EARTHLY_BRANCHES } from './constants';

export function calculateSihua(yearGan: Stem): {
  sihua: SihuaInfo[];
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
} {
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];

  if (!HEAVENLY_STEMS.includes(yearGan)) {
    warnings.push({
      code: 'ZIWEI_SIHUA_INVALID_STEM',
      message: `非法年干 ${yearGan}, 四化无法生成`,
      severity: 'error',
    });
    return { sihua: [], warnings, explanationTrace: trace };
  }

  const config = SIHUA_TABLE[yearGan];
  const sihua: SihuaInfo[] = (['禄', '权', '科', '忌'] as SihuaTransform[]).map((transform) => {
    const star = config[transform];
    return {
      yearStem: yearGan,
      star,
      transform,
      meaning: SIHUA_MEANINGS[transform],
      explanationTrace: [{
        rule: 'ziwei.sihua.assign',
        detail: `年干 ${yearGan} → ${transform} 化 ${star} (${SIHUA_MEANINGS[transform]})`,
        data: { yearGan, transform, star },
      }],
    };
  });

  trace.push({
    rule: 'ziwei.sihua.summary',
    detail: `四化: ${sihua.map(s => `${s.star}化${s.transform}`).join('、')}`,
    data: { yearGan },
  });
  return { sihua, warnings, explanationTrace: trace };
}

/** Convert sihua list → quick map for star→transform lookup. */
export function buildSihuaMap(sihua: SihuaInfo[]): Record<string, SihuaTransform> {
  const m: Record<string, SihuaTransform> = {};
  for (const s of sihua) m[s.star] = s.transform;
  return m;
}

// ─── 1) 单天干 → 四化星表 ─────────────────────────────────────
export function getSihuaByStem(stem: Stem): Record<SihuaTransform, string> {
  return SIHUA_TABLE[stem] ?? { '禄': '', '权': '', '科': '', '忌': '' };
}

// ─── 2) 宫干自化检测 ────────────────────────────────────────────
/** Detects 自化：宫干引发的四化，被化星恰在本宫。 */
export function detectSelfSihua(palace: ZiweiPalace): SelfSihuaMark[] {
  if (!palace.stem) return [];
  const transforms = getSihuaByStem(palace.stem);
  const palaceStarNames = new Set(palace.stars.map(s => s.name));
  const out: SelfSihuaMark[] = [];
  (['禄', '权', '科', '忌'] as SihuaTransform[]).forEach((t) => {
    const starName = transforms[t];
    if (starName && palaceStarNames.has(starName)) {
      out.push({ transform: t, star: starName });
    }
  });
  return out;
}

/** Batch — { branch → SelfSihuaMark[] } for the whole chart. */
export function buildAllSelfSihua(palaces: ZiweiPalace[]): Record<string, SelfSihuaMark[]> {
  const out: Record<string, SelfSihuaMark[]> = {};
  for (const p of palaces) {
    const list = detectSelfSihua(p);
    if (list.length > 0) out[p.branch] = list;
  }
  return out;
}

// ─── 3) 来因宫追溯 ─────────────────────────────────────────────
/** Find palaces whose stem飞 a particular sihua into the named star. */
export function findIncomingPalaces(
  palaces: ZiweiPalace[],
  starName: string,
  transform: SihuaTransform,
): ZiweiPalace[] {
  const out: ZiweiPalace[] = [];
  for (const p of palaces) {
    if (!p.stem) continue;
    const t = getSihuaByStem(p.stem);
    if (t[transform] === starName) out.push(p);
  }
  return out;
}

// ─── 4) 大限宫干四化 ───────────────────────────────────────────
export function getDaXianSihua(
  chart: ZiweiChart,
  daxianIndex: number,
): { stem: Stem; transforms: Record<SihuaTransform, string> } | null {
  const dx = chart.daxian[daxianIndex];
  if (!dx) return null;
  const palace = chart.palaces.find(p => p.branch === dx.branch);
  if (!palace?.stem) return null;
  return { stem: palace.stem, transforms: getSihuaByStem(palace.stem) };
}

// ─── 5) 流年 / 流月四化 ────────────────────────────────────────
export function getYearStemIndex(year: number): number {
  return ((year - 4) % 10 + 10) % 10;
}
export function getYearBranchIndex(year: number): number {
  return ((year - 4) % 12 + 12) % 12;
}

export function getLiuNianSihua(year: number): {
  stem: Stem; transforms: Record<SihuaTransform, string>;
} {
  const stem = HEAVENLY_STEMS[getYearStemIndex(year)] as Stem;
  return { stem, transforms: getSihuaByStem(stem) };
}

/** 五虎遁：given year-stem-index → stem-index of 寅(正月). */
const YIN_STEM_BY_YEAR_IDX: Record<number, number> = {
  0: 2, 5: 2,   // 甲己 → 丙
  1: 4, 6: 4,   // 乙庚 → 戊
  2: 6, 7: 6,   // 丙辛 → 庚
  3: 8, 8: 8,   // 丁壬 → 壬
  4: 0, 9: 0,   // 戊癸 → 甲
};
export function getLiuYueStemIndex(yearStemIdx: number, lunarMonth: number): number {
  const yinStem = YIN_STEM_BY_YEAR_IDX[yearStemIdx] ?? 0;
  return (yinStem + ((lunarMonth - 1) % 12) + 10) % 10;
}
export function getLiuYueSihua(yearStemIdx: number, lunarMonth: number): {
  stem: Stem; transforms: Record<SihuaTransform, string>;
} {
  const stem = HEAVENLY_STEMS[getLiuYueStemIndex(yearStemIdx, lunarMonth)] as Stem;
  return { stem, transforms: getSihuaByStem(stem) };
}

// ─── 6) Overlay (多层四化叠加视图) ────────────────────────────
export interface SihuaOverlay {
  native?: SihuaTransform;
  daxian?: SihuaTransform;
  liunian?: SihuaTransform;
  liuyue?: SihuaTransform;
}
export function buildOverlayForStar(
  starName: string,
  native?: Record<string, SihuaTransform>,
  daxian?: Record<string, SihuaTransform>,
  liunian?: Record<string, SihuaTransform>,
  liuyue?: Record<string, SihuaTransform>,
): SihuaOverlay {
  return {
    native: native?.[starName],
    daxian: daxian?.[starName],
    liunian: liunian?.[starName],
    liuyue: liuyue?.[starName],
  };
}

// expose constants for callers
export { HEAVENLY_STEMS, EARTHLY_BRANCHES };
export type { Branch };
