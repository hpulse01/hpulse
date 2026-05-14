/**
 * P4.4 — 命宫天干 (五虎遁) + 五行局.
 */

import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import type { Branch, Stem, WuxingJu } from './types';
import { HEAVENLY_STEMS, WUXING_JU_TABLE, WUXING_JU_ELEMENT } from './constants';

/**
 * 五虎遁年起月：寅月起天干公式
 * 甲己之年丙作首, 乙庚之年戊为头, 丙辛之年由庚起,
 * 丁壬壬寅顺水流, 戊癸甲寅何方求.
 *
 * 命宫天干: 由寅宫天干 + (mingIndex - 0) 顺数推得，因 PALACE_BRANCH_ORDER[0] = 寅.
 */
export function calculateMingGongStem(yearGan: Stem, mingIndex: number): {
  stem: Stem;
  explanationTrace: ExplanationStep[];
} {
  const trace: ExplanationStep[] = [];
  const yearGanIndex = HEAVENLY_STEMS.indexOf(yearGan);
  if (yearGanIndex < 0) {
    return {
      stem: '甲',
      explanationTrace: [{
        rule: 'ziwei.wuxing.invalidYearGan',
        detail: `非法年干 ${yearGan}, fallback 甲`,
        data: { yearGan },
      }],
    };
  }
  // 寅月天干: (yearGan*2 + 2) mod 10.
  const yinStemIndex = (yearGanIndex * 2 + 2) % 10;
  const stemIndex = (yinStemIndex + mingIndex) % 10;
  const stem = HEAVENLY_STEMS[stemIndex];

  trace.push({
    rule: 'ziwei.wuxing.mingGongStem',
    detail: `五虎遁: 年干 ${yearGan} → 寅干 ${HEAVENLY_STEMS[yinStemIndex]}, 顺数到命宫得天干 ${stem}`,
    data: { yearGan, yinStemIndex, mingIndex, mingGongStem: stem },
  });
  return { stem, explanationTrace: trace };
}

export function calculateWuxingJu(mingGongStem: Stem, mingGongBranch: Branch): WuxingJu {
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];
  const tableRow = WUXING_JU_TABLE[mingGongStem];
  const entry = tableRow?.[mingGongBranch];
  let fallbackUsed = false;
  let resolved = entry;

  if (!resolved) {
    fallbackUsed = true;
    resolved = { name: '水二局', number: 2 };
    warnings.push({
      code: 'ZIWEI_WUXINGJU_TABLE_MISS',
      message: `五行局查表缺失 (${mingGongStem}+${mingGongBranch}); fallback 水二局, confidence 已降级`,
      severity: 'warning',
    });
  }

  trace.push({
    rule: 'ziwei.wuxing.lookup',
    detail: `命宫天干+地支 ${mingGongStem}${mingGongBranch} → 五行局 ${resolved.name} (步数=${resolved.number})${fallbackUsed ? ' [FALLBACK]' : ''}`,
    data: { mingGongStem, mingGongBranch, name: resolved.name, number: resolved.number, fallbackUsed },
  });

  return {
    name: resolved.name as WuxingJu['name'],
    number: resolved.number,
    element: WUXING_JU_ELEMENT[resolved.name] ?? '水',
    ruleKey: `${mingGongStem}${mingGongBranch}`,
    fallbackUsed,
    explanationTrace: trace,
    warnings,
  };
}
