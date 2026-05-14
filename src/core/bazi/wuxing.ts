/**
 * P4.2 — Wuxing balance / yinyang balance / support-drain counter.
 *
 * Aggregates over four pillars including weighted hidden stems. Month branch
 * gets an extra weight (月令权重).
 */

import {
  STEM_ELEMENT, STEM_YINYANG, BRANCH_YINYANG, HIDDEN_STEMS,
  type Stem, type Branch, type Element,
} from '../calendar/ganzhi';
import { relation } from '../calendar/wuxing';
import type { Pillar } from '../calendar/ganzhi';
import type { ElementWeight, YinYangBalance, SupportDrainCounter } from './types';

const ELEMENTS: readonly Element[] = ['木', '火', '土', '金', '水'];
const HIDDEN_WEIGHTS = [1.0, 0.5, 0.3];
const MONTH_BRANCH_BONUS = 1.5;
const STEM_WEIGHT = 1.0;

type FP = { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };

export function calculateWuxingBalance(fp: FP): ElementWeight[] {
  const tally: Record<Element, { weight: number; count: number }> = {
    木: { weight: 0, count: 0 }, 火: { weight: 0, count: 0 }, 土: { weight: 0, count: 0 },
    金: { weight: 0, count: 0 }, 水: { weight: 0, count: 0 },
  };
  const all: { p: Pillar; isMonth: boolean }[] = [
    { p: fp.year, isMonth: false }, { p: fp.month, isMonth: true },
    { p: fp.day, isMonth: false }, { p: fp.hour, isMonth: false },
  ];
  for (const { p, isMonth } of all) {
    const se = STEM_ELEMENT[p.stem];
    tally[se].weight += STEM_WEIGHT;
    tally[se].count += 1;
    const hidden = HIDDEN_STEMS[p.branch];
    hidden.forEach((s, i) => {
      const e = STEM_ELEMENT[s];
      let w = HIDDEN_WEIGHTS[i] ?? 0.2;
      if (isMonth) w *= MONTH_BRANCH_BONUS;
      tally[e].weight += w;
      tally[e].count += 1;
    });
  }
  const total = ELEMENTS.reduce((s, el) => s + tally[el].weight, 0) || 1;
  return ELEMENTS.map((el) => ({
    element: el,
    weight: Math.round(tally[el].weight * 100) / 100,
    count: tally[el].count,
    score: Math.round((tally[el].weight / total) * 100),
  }));
}

export function calculateYinYangBalance(fp: FP): YinYangBalance {
  let yang = 0, yin = 0;
  const list = [fp.year, fp.month, fp.day, fp.hour];
  for (const p of list) {
    if (STEM_YINYANG[p.stem] === '阳') yang++; else yin++;
    if (BRANCH_YINYANG[p.branch] === '阳') yang++; else yin++;
  }
  const total = yang + yin || 1;
  return { yang, yin, yangRatio: Math.round((yang / total) * 100) / 100 };
}

export function calculateSupportDrainCounter(fp: FP, dayStem: Stem): SupportDrainCounter {
  const dme = STEM_ELEMENT[dayStem];
  const balance = calculateWuxingBalance(fp);
  let support = 0, drain = 0;
  for (const e of balance) {
    if (e.element === dme) support += e.weight;
    else {
      const r = relation(e.element, dme);
      if (r === 'generates') support += e.weight;       // 生 DM (印)
      else drain += e.weight;
    }
  }
  const ratio = support / Math.max(0.001, support + drain);
  return {
    support: Math.round(support * 100) / 100,
    drain: Math.round(drain * 100) / 100,
    ratio: Math.round(ratio * 1000) / 1000,
  };
}

export function rootStrengthScore(fp: FP, dayStem: Stem): number {
  const dme = STEM_ELEMENT[dayStem];
  const branches: Branch[] = [fp.year.branch, fp.month.branch, fp.day.branch, fp.hour.branch];
  let raw = 0;
  branches.forEach((b, idx) => {
    HIDDEN_STEMS[b].forEach((s, i) => {
      if (STEM_ELEMENT[s] === dme) {
        const w = HIDDEN_WEIGHTS[i] ?? 0.2;
        const positionBonus = idx === 1 ? 1.5 : idx === 2 ? 1.2 : 1.0;
        raw += w * positionBonus;
      }
    });
  });
  return Math.min(100, Math.round(raw * 25));
}
