/**
 * P4.3 — Structured wrapper around the legacy theoretical-base formula.
 *
 * Records each constituent (pillar sums, yao value, quarter, gender shift)
 * as an explanation step. Pure function — no I/O.
 */

import type { NormalizedAstroTime, ExplanationStep } from '../astro-time/types';
import type { Gender } from '../../types/prediction';
import { fourPillarsFromAstro } from '../calendar/fourPillars';
import { TiebanEngine } from '../../utils/tiebanAlgorithm';
import type { TheoreticalBaseResult } from './types';

const BASE_MODULO = 12000;

export function calculateTiebanBase(
  astro: NormalizedAstroTime,
  gender: Gender,
): TheoreticalBaseResult & { pillars: { year: string; month: string; day: string; hour: string } } {
  const fp = fourPillarsFromAstro(astro);
  const pillars = {
    year: fp.year.ganzhi, month: fp.month.ganzhi, day: fp.day.ganzhi, hour: fp.hour.ganzhi,
  };

  const yearV = TiebanEngine.getPillarValue(pillars.year);
  const monthV = TiebanEngine.getPillarValue(pillars.month);
  const dayV = TiebanEngine.getPillarValue(pillars.day);
  const hourV = TiebanEngine.getPillarValue(pillars.hour);
  const pillarSum = yearV + monthV + dayV + hourV;

  const hourBranch = pillars.hour.charAt(1);
  const yaoValue = TiebanEngine.getBranchYaoValue(hourBranch);

  const localHour = astro.localDateTime.hour;
  const localMinute = astro.localDateTime.minute;
  const minuteInShichen = (localHour % 2) * 60 + localMinute;
  const rawQuarterIndex = Math.floor(minuteInShichen / 15);
  const minuteOffset = minuteInShichen % 15;
  const genderShift: 0 | 500 = gender === 'female' ? 500 : 0;

  const raw = pillarSum * 100 + yaoValue + rawQuarterIndex * 30 + minuteOffset * 2 + genderShift;
  const theoreticalBase = ((raw - 1) % BASE_MODULO + BASE_MODULO) % BASE_MODULO + 1;

  // For backward compatibility expose the older `baseNumber` formula too.
  const legacyBaseNumber =
    (yearV + monthV + dayV + hourV) * 100 + rawQuarterIndex * 25 + minuteOffset + genderShift;

  const trace: ExplanationStep[] = [
    {
      rule: 'tieban.base.pillarValues',
      detail: '四柱太玄数 = year + month + day + hour 之和。',
      data: { yearV, monthV, dayV, hourV, pillarSum },
    },
    {
      rule: 'tieban.base.yaoValue',
      detail: `时支 ${hourBranch} 的爻数 = ${yaoValue}`,
      data: { hourBranch, yaoValue },
    },
    {
      rule: 'tieban.base.quarter',
      detail: `本时辰内 ${minuteInShichen} 分 → 第 ${rawQuarterIndex} 刻 (余 ${minuteOffset} 分)`,
      data: { localHour, localMinute, minuteInShichen, rawQuarterIndex, minuteOffset },
    },
    {
      rule: 'tieban.base.gender',
      detail: `${gender === 'female' ? '女命 +500' : '男命 +0'}`,
      data: { gender, genderShift },
    },
    {
      rule: 'tieban.base.formula',
      detail: 'theoreticalBase = ((pillarSum*100 + yaoValue + quarter*30 + minuteOffset*2 + genderShift − 1) mod 12000) + 1',
      data: { raw, theoreticalBase, BASE_MODULO },
    },
  ];

  return {
    pillars,
    theoreticalBase,
    legacyBaseNumber,
    pillarSum,
    yaoValue,
    rawQuarterIndex,
    minuteOffset,
    genderShift,
    explanationTrace: trace,
  };
}
