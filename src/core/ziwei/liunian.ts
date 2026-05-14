/**
 * P4.4 — 流年 (annual fortune walks).
 *
 * Deterministic: NO `new Date()`, NO `Date.now()`. Year is taken from
 * `targetYear` (preferred), else parsed from `queryTimeUtc` (UTC year).
 */

import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import type { Branch, Stem, ZiweiPalace, LiunianStep } from './types';
import { PALACE_BRANCH_ORDER, HEAVENLY_STEMS, EARTHLY_BRANCHES, SIHUA_TABLE, SIHUA_MEANINGS } from './constants';

export function resolveTargetYear(input: {
  targetYear?: number;
  queryTimeUtc?: string;
}): { year: number | null; source: 'targetYear' | 'queryTimeUtc' | 'none'; warning?: AstroWarning } {
  if (typeof input.targetYear === 'number' && Number.isFinite(input.targetYear)) {
    return { year: Math.trunc(input.targetYear), source: 'targetYear' };
  }
  if (input.queryTimeUtc) {
    const d = new Date(input.queryTimeUtc);
    if (!Number.isNaN(d.getTime())) {
      return { year: d.getUTCFullYear(), source: 'queryTimeUtc' };
    }
  }
  return {
    year: null,
    source: 'none',
    warning: {
      code: 'ZIWEI_LIUNIAN_NO_TARGET_YEAR',
      message: '未提供 targetYear 或 queryTimeUtc，流年序列已留空。',
      severity: 'warning',
    },
  };
}

function yearToGanZhi(year: number): { gan: Stem; zhi: Branch } {
  const ganIdx = ((year - 4) % 10 + 10) % 10;
  const zhiIdx = ((year - 4) % 12 + 12) % 12;
  return { gan: HEAVENLY_STEMS[ganIdx], zhi: EARTHLY_BRANCHES[zhiIdx] };
}

export function calculateLiunian(opts: {
  targetYear: number | null;
  birthYear: number;
  palaces: ZiweiPalace[];
  rangeBefore?: number;
  rangeAfter?: number;
}): { steps: LiunianStep[]; explanationTrace: ExplanationStep[]; warnings: AstroWarning[] } {
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];
  const before = opts.rangeBefore ?? 2;
  const after = opts.rangeAfter ?? 10;

  if (opts.targetYear == null) {
    return { steps: [], explanationTrace: trace, warnings };
  }

  const steps: LiunianStep[] = [];
  for (let off = -before; off <= after; off++) {
    const year = opts.targetYear + off;
    const age = year - opts.birthYear;
    if (age < 1 || age > 120) continue;
    const { gan, zhi } = yearToGanZhi(year);
    const palace = opts.palaces.find(p => p.branch === zhi);
    const sihuaConfig = SIHUA_TABLE[gan];
    const sihua = sihuaConfig
      ? (['禄', '权', '科', '忌'] as const).map(t => ({
          yearStem: gan,
          star: sihuaConfig[t],
          transform: t,
          meaning: SIHUA_MEANINGS[t],
          explanationTrace: [{
            rule: 'ziwei.liunian.sihua',
            detail: `流年 ${year} 年干 ${gan} → ${t} 化 ${sihuaConfig[t]}`,
            data: { year, gan, transform: t, star: sihuaConfig[t] },
          }],
        }))
      : [];

    steps.push({
      year,
      age,
      yearStem: gan,
      yearBranch: zhi,
      palaceName: palace?.name ?? '命宫',
      branch: zhi,
      stars: palace?.stars ?? [],
      sihua,
      explanationTrace: [{
        rule: 'ziwei.liunian.step',
        detail: `${year}年 (${age}岁) 流年宫=${palace?.name ?? '命宫'}@${zhi}, 干支=${gan}${zhi}`,
        data: { year, age, gan, zhi, palaceName: palace?.name },
      }],
    });
  }

  trace.push({
    rule: 'ziwei.liunian.summary',
    detail: `生成流年序列 ${steps.length} 项 (target=${opts.targetYear}, range=[-${before},+${after}])`,
    data: { targetYear: opts.targetYear, count: steps.length },
  });

  // Reference PALACE_BRANCH_ORDER so unused-import lint stays happy if we ever toggle.
  void PALACE_BRANCH_ORDER;

  return { steps, explanationTrace: trace, warnings };
}
