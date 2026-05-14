/**
 * P4.2 — analyzePattern (格局).
 *
 * Classical 子平 pattern detection based on:
 *   1. The dominant ten-god of the month branch's primary 藏干 (月令本气).
 *   2. Whether that ten-god is also visible in the stems (透干).
 *   3. Special structural patterns: 建禄 (DM same as 月令本气 of yang stem),
 *      羊刃 (DM yang-stem on 帝旺 of itself in month branch), 从强/从弱.
 *
 * Output is a ranked list of candidates with confidence + evidence.
 * Patterns we cannot confidently determine are reported as `partial`.
 */

import type { BaziChart, PatternCandidate } from './types';
import type { TenGod } from '../calendar/tenGods';
import { STEM_ELEMENT, STEM_YINYANG, HIDDEN_STEMS } from '../calendar/ganzhi';
import { tenGodOf } from '../calendar/tenGods';

const GOD_TO_PATTERN: Record<TenGod, PatternCandidate['type']> = {
  正官: '正官格', 七杀: '七杀格',
  正印: '正印格', 偏印: '偏印格',
  正财: '正财格', 偏财: '偏财格',
  食神: '食神格', 伤官: '伤官格',
  比肩: '建禄格', 劫财: '羊刃格',
};

export function analyzePattern(chart: Pick<BaziChart, 'fourPillars' | 'dayMaster' | 'dayMasterStrength'>): {
  candidates: PatternCandidate[];
  selected: PatternCandidate | null;
} {
  const candidates: PatternCandidate[] = [];
  const dayStem = chart.dayMaster;
  const monthBranch = chart.fourPillars.month.branch;
  const monthHidden = HIDDEN_STEMS[monthBranch];
  const primaryHidden = monthHidden[0];
  const primaryGod = tenGodOf(dayStem, primaryHidden);

  const stems = [
    chart.fourPillars.year.stem,
    chart.fourPillars.month.stem,
    chart.fourPillars.hour.stem,
  ];

  // 主格 from 月令本气
  {
    const ev: string[] = [`月令本气=${primaryHidden}(${STEM_ELEMENT[primaryHidden]}) → 十神=${primaryGod}`];
    const transparent = stems.some((s) => tenGodOf(dayStem, s) === primaryGod);
    if (transparent) ev.push('透干于年/月/时干 → 格局成立');
    candidates.push({
      name: GOD_TO_PATTERN[primaryGod],
      type: GOD_TO_PATTERN[primaryGod],
      confidence: transparent ? 75 : 55,
      evidence: ev,
      warnings: transparent ? [] : ['月令本气未透干，格局力度减弱'],
    });
  }

  // 中气 / 余气 patterns (lower confidence)
  for (let i = 1; i < monthHidden.length; i++) {
    const h = monthHidden[i];
    const g = tenGodOf(dayStem, h);
    candidates.push({
      name: GOD_TO_PATTERN[g],
      type: GOD_TO_PATTERN[g],
      confidence: i === 1 ? 35 : 20,
      evidence: [`月令${i === 1 ? '中气' : '余气'}=${h} → ${g}`],
      warnings: ['偏气格局，需结合透干与喜忌验证'],
    });
  }

  // 从强 / 从弱 special structural detection (very rough heuristic).
  if (chart.dayMasterStrength === 'veryStrong') {
    candidates.push({
      name: '从强格(候选)',
      type: '从强格',
      confidence: 30,
      evidence: ['日主极旺，无明显克泄耗'],
      warnings: ['从格判断未涵盖刑冲合化与化神，需人工复核'],
    });
  } else if (chart.dayMasterStrength === 'veryWeak') {
    candidates.push({
      name: '从弱格(候选)',
      type: '从弱格',
      confidence: 30,
      evidence: ['日主极弱，无生扶之神'],
      warnings: ['从格判断未涵盖刑冲合化与化神，需人工复核'],
    });
  }

  // 建禄 / 羊刃 explicit checks (override or boost)
  const dme = STEM_ELEMENT[dayStem];
  const monthEl = STEM_ELEMENT[primaryHidden];
  if (monthEl === dme) {
    const boost = STEM_YINYANG[dayStem] === '阳' ? '建禄格' : '羊刃格';
    const found = candidates.find((c) => c.type === boost);
    if (found) found.confidence = Math.min(95, found.confidence + 15);
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const selected = candidates[0]?.confidence >= 50 ? candidates[0] : null;
  return { candidates, selected };
}
