/**
 * P4.2 — analyzeFlowYear.
 *
 * Deterministic flow-year analysis. The target year MUST come from the
 * caller (input.targetYear) or from input.queryTimeUtc; never from
 * `new Date()`. Throws if neither is provided.
 *
 * Flow-year ganzhi = 60-jiazi cycle anchored at year 1984 = 甲子.
 */

import { sixtyJiazi } from '../calendar/ganzhi';
import { tenGodOf } from '../calendar/tenGods';
import {
  BRANCH_LIUCHONG, BRANCH_LIUHE,
} from './constants';
import type { ExplanationStep } from '../astro-time/types';
import type { BaziChart, FlowYearInfo } from './types';

const ANCHOR = { year: 1984, ganzhi: '甲子' }; // 甲子年

function ganzhiOfYear(year: number): { ganzhi: string; idx: number } {
  const cycle = sixtyJiazi();
  const offset = ((year - ANCHOR.year) % 60 + 60) % 60;
  return { ganzhi: cycle[offset].ganzhi, idx: offset };
}

export function analyzeFlowYear(chart: BaziChart, opts: { targetYear?: number; queryTimeUtc?: string }): FlowYearInfo {
  let target: number | undefined = opts.targetYear;
  if (target == null && opts.queryTimeUtc) {
    const d = new Date(opts.queryTimeUtc);
    if (!Number.isNaN(d.getTime())) target = d.getUTCFullYear();
  }
  if (target == null) {
    throw new Error('analyzeFlowYear requires targetYear or queryTimeUtc');
  }
  const { ganzhi } = ganzhiOfYear(target);
  const stem = ganzhi[0] as import('../calendar/ganzhi').Stem;
  const branch = ganzhi[1] as import('../calendar/ganzhi').Branch;
  const tenGod = tenGodOf(chart.dayMaster, stem);

  const natalBranches: { pos: 'year' | 'month' | 'day' | 'hour'; b: typeof branch }[] = [
    { pos: 'year', b: chart.fourPillars.year.branch },
    { pos: 'month', b: chart.fourPillars.month.branch },
    { pos: 'day', b: chart.fourPillars.day.branch },
    { pos: 'hour', b: chart.fourPillars.hour.branch },
  ];
  const clashes: string[] = [];
  const combinations: string[] = [];
  const affected: ('year' | 'month' | 'day' | 'hour')[] = [];
  for (const n of natalBranches) {
    if (BRANCH_LIUCHONG[branch] === n.b) {
      clashes.push(`${branch}冲${n.b}@${n.pos}`);
      affected.push(n.pos);
    } else if (BRANCH_LIUHE[branch] === n.b) {
      combinations.push(`${branch}合${n.b}@${n.pos}`);
      affected.push(n.pos);
    }
  }

  const relationToNatal: string[] = [
    `流年干 ${stem} 为日主 ${chart.dayMaster} 之 ${tenGod}`,
    ...clashes.map((c) => `冲：${c}`),
    ...combinations.map((c) => `合：${c}`),
  ];

  const riskFlags: string[] = [];
  const opportunityFlags: string[] = [];
  if (chart.unfavorableElements.includes(chart.fourPillars.year.stemElement) && tenGod === '七杀') {
    riskFlags.push('忌神之七杀流年，谨慎决策');
  }
  if (chart.favorableElements.length && tenGod === '正财') {
    opportunityFlags.push('财星流年，资源调度更顺');
  }

  const age = target - chart.inputSnapshot.birthLocalDateTime.year;

  const trace: ExplanationStep[] = [
    { rule: 'flowYear.target', detail: `target=${target} (来源：${opts.targetYear != null ? 'input.targetYear' : 'queryTimeUtc'})` },
    { rule: 'flowYear.ganzhi', detail: `${target}年 → ${ganzhi}（以 1984=甲子 为锚）` },
    { rule: 'flowYear.tenGod', detail: `日主 ${chart.dayMaster} vs 流年干 ${stem} = ${tenGod}` },
  ];

  return {
    year: target, age, ganZhi: ganzhi, stem, branch, tenGod,
    relationToNatal, clashes, combinations, affectedPillars: affected,
    riskFlags, opportunityFlags, explanationTrace: trace,
  };
}
