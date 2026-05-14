/**
 * P4.2 — Day-master strength analysis (日主强弱).
 *
 * Multi-factor scoring. Honest about partial implementation.
 *
 * Components combined into a 0–100 score:
 *   1. 月令 (season): does month branch generate / equal / control / be-controlled by DM element?
 *   2. 通根 (root in branches): how many of the 4 branches contain a hidden stem of DM element.
 *   3. 透干 (visible in stems): non-day stems that share DM element / generate DM element.
 *   4. 生扶克泄耗 weighted tally from `elementBalance`.
 *
 * Limitations (declared in `warnings`):
 *   - Does not yet evaluate 调候用神 (climatic balance) nuances.
 *   - Does not yet apply 刑冲合害 corrections to root strength.
 *   - 通根 scoring uses fixed weights; advanced 子平 may weight 本气/中气/余气 differently.
 */

import type { BaziChart, ElementCount } from './calculateBazi';
import type { Element } from '../calendar/ganzhi';
import { HIDDEN_STEMS, STEM_ELEMENT, type Branch } from '../calendar/ganzhi';
import type { ExplanationStep, AstroWarning } from '../astro-time/types';

export type StrengthLevel = '极弱' | '偏弱' | '中和' | '偏旺' | '极旺';

export interface StrengthAnalysis {
  score: number;            // 0..100
  level: StrengthLevel;
  components: {
    seasonScore: number;    // 0..30
    rootScore: number;      // 0..25
    visibleScore: number;   // 0..20
    balanceScore: number;   // 0..25
  };
  hasRoot: boolean;
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
}

const RELATION_TO_DM: Record<string, number> = {
  same: 30, generates: 25, generatedBy: 15, controls: 5, controlledBy: 0,
};

function relationOf(a: Element, b: Element): keyof typeof RELATION_TO_DM {
  if (a === b) return 'same';
  const sheng: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const ke: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  if (sheng[a] === b) return 'generates';
  if (sheng[b] === a) return 'generatedBy';
  if (ke[a] === b) return 'controls';
  return 'controlledBy';
}

function levelOf(score: number): StrengthLevel {
  if (score >= 75) return '极旺';
  if (score >= 60) return '偏旺';
  if (score >= 40) return '中和';
  if (score >= 25) return '偏弱';
  return '极弱';
}

export function analyzeStrength(chart: BaziChart): StrengthAnalysis {
  const dme = chart.dayMaster.element;
  const monthBranchEl = chart.fourPillars.month.branch;
  const seasonRel = relationOf(monthBranchEl as unknown as Element, dme);
  // Note: monthBranchEl is a Branch char; map to its element below.

  // Re-do with proper branch->element mapping.
  const branchElementOf = (b: Branch): Element => {
    return ({ 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' } as const)[b];
  };
  const monthEl = branchElementOf(chart.fourPillars.month.branch);
  const monthRel = relationOf(monthEl, dme);
  const seasonScore = RELATION_TO_DM[monthRel];

  // 通根 — any hidden stem in the 4 branches that matches DM element
  const branches: Branch[] = [
    chart.fourPillars.year.branch,
    chart.fourPillars.month.branch,
    chart.fourPillars.day.branch,
    chart.fourPillars.hour.branch,
  ];
  const rootHits: { branch: Branch; weight: number }[] = [];
  branches.forEach((b) => {
    const hidden = HIDDEN_STEMS[b];
    hidden.forEach((s, i) => {
      if (STEM_ELEMENT[s] === dme) {
        rootHits.push({ branch: b, weight: [1.0, 0.5, 0.3][i] ?? 0.2 });
      }
    });
  });
  const rootRaw = rootHits.reduce((sum, r) => sum + r.weight, 0);
  const rootScore = Math.min(25, Math.round(rootRaw * 12.5));

  // 透干 — non-day stems whose element == DM (比劫) or generates DM (印).
  const otherStems = [
    chart.fourPillars.year.stem,
    chart.fourPillars.month.stem,
    chart.fourPillars.hour.stem,
  ];
  let visible = 0;
  for (const s of otherStems) {
    const r = relationOf(STEM_ELEMENT[s], dme);
    if (r === 'same') visible += 8;
    else if (r === 'generates') visible += 6;
  }
  const visibleScore = Math.min(20, visible);

  // 生扶克泄耗 — from elementBalance
  const balanceMap = new Map<Element, number>();
  for (const e of chart.elementBalance as ElementCount[]) balanceMap.set(e.element, e.weight);
  const support = (balanceMap.get(dme) ?? 0) +
    Array.from(balanceMap.entries()).filter(([el]) => relationOf(el, dme) === 'generates').reduce((s, [, w]) => s + w, 0);
  const drain = Array.from(balanceMap.entries())
    .filter(([el]) => el !== dme)
    .filter(([el]) => relationOf(el, dme) === 'generatedBy' || relationOf(el, dme) === 'controls' || relationOf(el, dme) === 'controlledBy')
    .reduce((s, [, w]) => s + w, 0);
  const ratio = support / Math.max(0.001, support + drain); // 0..1
  const balanceScore = Math.round(ratio * 25);

  const total = seasonScore + rootScore + visibleScore + balanceScore;
  const score = Math.max(0, Math.min(100, total));

  const warnings: AstroWarning[] = [{
    code: 'STRENGTH_PARTIAL',
    message: '强弱评分未涵盖刑冲合化、调候用神、特殊格局；为基础版评分。',
    severity: 'info',
  }];

  const trace: ExplanationStep[] = [
    {
      rule: 'strength.season',
      detail: `月令 ${chart.fourPillars.month.branch}(${monthEl}) vs 日主 ${dme} → ${monthRel} = ${seasonScore}/30`,
      data: { monthBranch: chart.fourPillars.month.branch, monthEl, dme, monthRel, seasonScore },
    },
    {
      rule: 'strength.root',
      detail: `通根命中 ${rootHits.length} 处，加权 ${rootRaw.toFixed(2)} → ${rootScore}/25`,
      data: { rootHits, rootRaw, rootScore },
    },
    {
      rule: 'strength.visible',
      detail: `年/月/时干助身（比劫=8、印=6） → ${visibleScore}/20`,
      data: { otherStems, visibleScore },
    },
    {
      rule: 'strength.balance',
      detail: `生扶/泄耗权重 ratio=${ratio.toFixed(3)} → ${balanceScore}/25`,
      data: { support, drain, ratio, balanceScore },
    },
  ];

  return {
    score,
    level: levelOf(score),
    components: { seasonScore, rootScore, visibleScore, balanceScore },
    hasRoot: rootHits.length > 0,
    warnings,
    explanationTrace: trace,
  };
  void seasonRel; // keep typed reference without unused-var warning
}
