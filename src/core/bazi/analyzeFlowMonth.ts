/**
 * P4.2 — analyzeFlowMonth.
 *
 * Month pillar of a target solar-term month, anchored on the year ganzhi
 * via 五虎遁. Determinism: target year+month must be supplied.
 */

import { tenGodOf } from '../calendar/tenGods';
import {
  STEMS, BRANCHES, type Stem, type Branch,
} from '../calendar/ganzhi';
import { YEAR_STEM_TO_YIN_MONTH_STEM } from './constants';
import type { ExplanationStep } from '../astro-time/types';
import type { BaziChart, FlowMonthInfo } from './types';
import { sixtyJiazi } from '../calendar/ganzhi';

function yearGanzhi(year: number): string {
  const offset = ((year - 1984) % 60 + 60) % 60;
  return sixtyJiazi()[offset].ganzhi;
}

/** Map calendar month 1-12 → 节气 month branch (寅=Feb...). Approximation. */
const CIVIL_MONTH_TO_BRANCH: Branch[] = [
  '丑', // Jan (after 小寒, before 立春)
  '寅', // Feb
  '卯', // Mar
  '辰', // Apr
  '巳', // May
  '午', // Jun
  '未', // Jul
  '申', // Aug
  '酉', // Sep
  '戌', // Oct
  '亥', // Nov
  '子', // Dec
];

export function analyzeFlowMonth(chart: BaziChart, opts: { targetYear: number; targetMonth: number }): FlowMonthInfo {
  const branch = CIVIL_MONTH_TO_BRANCH[(opts.targetMonth - 1) % 12];
  const yGz = yearGanzhi(opts.targetYear);
  const yStem = yGz[0] as Stem;
  const yinMonthStem = YEAR_STEM_TO_YIN_MONTH_STEM[yStem];
  const yinIdx = STEMS.indexOf(yinMonthStem);
  const branchOffsetFromYin = (BRANCHES.indexOf(branch) - BRANCHES.indexOf('寅') + 12) % 12;
  const stemIdx = (yinIdx + branchOffsetFromYin) % 10;
  const stem = STEMS[stemIdx];
  const ganZhi = `${stem}${branch}`;
  const tenGod = tenGodOf(chart.dayMaster, stem);

  const trace: ExplanationStep[] = [
    { rule: 'flowMonth.yearGZ', detail: `${opts.targetYear} → ${yGz}` },
    { rule: 'flowMonth.fiveTigers', detail: `年干 ${yStem} 五虎遁 寅月起 ${yinMonthStem}` },
    { rule: 'flowMonth.calc', detail: `${opts.targetMonth}月 → 月支 ${branch}, 月柱 ${ganZhi}` },
  ];

  return {
    year: opts.targetYear, month: opts.targetMonth,
    ganZhi, stem, branch,
    relationToNatal: [`月干 ${stem} 对日主 ${chart.dayMaster} = ${tenGod}`],
    explanationTrace: trace,
  };
}
