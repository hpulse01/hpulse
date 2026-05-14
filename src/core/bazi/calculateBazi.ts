/**
 * P4.2 — BaZi (八字) chart calculation.
 *
 * Pure layer that consumes a `NormalizedAstroTime` (from P4.1) and returns
 * a structured `BaziChart` containing four pillars, day master, ten gods,
 * hidden stems, nayin, void branches, element balance, and a complete
 * explanation trace.
 *
 * No randomness. Same input ⇒ identical output.
 */

import type { NormalizedAstroTime, ExplanationStep, AstroWarning, SourceGrade } from '../astro-time/types';
import { fourPillarsFromAstro, type FourPillars } from '../calendar/fourPillars';
import {
  HIDDEN_STEMS,
  STEM_ELEMENT,
  STEM_YINYANG,
  BRANCH_ELEMENT,
  BRANCH_YINYANG,
  ZODIAC,
  voidBranches,
  type Stem,
  type Branch,
  type Element,
  type Pillar,
} from '../calendar/ganzhi';
import { tenGodOf, type TenGod } from '../calendar/tenGods';
import { nayinOf } from '../calendar/nayin';

export type PillarPosition = 'year' | 'month' | 'day' | 'hour';

export interface PillarAnalysis {
  position: PillarPosition;
  pillar: Pillar;
  stemElement: Element;
  branchElement: Element;
  /** Ten god of the STEM relative to day master. Day pillar's stem = 日主 itself. */
  stemTenGod: TenGod | '日主';
  hiddenStems: Stem[];
  /** Ten gods of every hidden stem of the branch, in canonical order. */
  hiddenTenGods: TenGod[];
  nayin: string;
}

export interface ElementCount {
  element: Element;
  /** Sum of weights from stems and branches (stems weight=1, primary hidden=1, secondary=0.5, tertiary=0.3). */
  weight: number;
  /** Raw count of occurrences (useful for debugging). */
  count: number;
}

export interface DayMaster {
  stem: Stem;
  element: Element;
  yinYang: '阳' | '阴';
}

export interface BaziChart {
  fourPillars: FourPillars;
  dayMaster: DayMaster;
  pillarAnalyses: PillarAnalysis[];
  elementBalance: ElementCount[];
  voidBranches: [Branch, Branch];
  zodiac: string;
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
  sourceGrade: SourceGrade;
}

const HIDDEN_WEIGHTS = [1.0, 0.5, 0.3];

function buildPillarAnalysis(
  position: PillarPosition,
  pillar: Pillar,
  dayMaster: Stem,
): PillarAnalysis {
  const stemElement = STEM_ELEMENT[pillar.stem];
  const branchElement = BRANCH_ELEMENT[pillar.branch];
  const hidden = HIDDEN_STEMS[pillar.branch];
  return {
    position,
    pillar,
    stemElement,
    branchElement,
    stemTenGod: position === 'day' ? '日主' : tenGodOf(dayMaster, pillar.stem),
    hiddenStems: hidden,
    hiddenTenGods: hidden.map((s) => tenGodOf(dayMaster, s)),
    nayin: nayinOf(pillar),
  };
}

function buildElementBalance(pillars: FourPillars): ElementCount[] {
  const tally: Record<Element, { weight: number; count: number }> = {
    木: { weight: 0, count: 0 }, 火: { weight: 0, count: 0 }, 土: { weight: 0, count: 0 },
    金: { weight: 0, count: 0 }, 水: { weight: 0, count: 0 },
  };
  const list: Pillar[] = [pillars.year, pillars.month, pillars.day, pillars.hour];
  for (const p of list) {
    const se = STEM_ELEMENT[p.stem];
    tally[se].weight += 1;
    tally[se].count += 1;
    const hidden = HIDDEN_STEMS[p.branch];
    hidden.forEach((s, i) => {
      const e = STEM_ELEMENT[s];
      tally[e].weight += HIDDEN_WEIGHTS[i] ?? 0.2;
      tally[e].count += 1;
    });
  }
  return (['木', '火', '土', '金', '水'] as Element[]).map((el) => ({
    element: el,
    weight: Math.round(tally[el].weight * 100) / 100,
    count: tally[el].count,
  }));
}

export function calculateBazi(astro: NormalizedAstroTime): BaziChart {
  const fp = fourPillarsFromAstro(astro);
  const dayMasterStem = fp.day.stem;
  const dayMaster: DayMaster = {
    stem: dayMasterStem,
    element: STEM_ELEMENT[dayMasterStem],
    yinYang: STEM_YINYANG[dayMasterStem],
  };

  const trace: ExplanationStep[] = [
    ...astro.explanationTrace,
    ...fp.explanationTrace,
    {
      rule: 'bazi.dayMaster',
      detail: '取日柱天干为日主，确定五行与阴阳。',
      data: { stem: dayMaster.stem, element: dayMaster.element, yinYang: dayMaster.yinYang },
    },
  ];

  const pillarAnalyses: PillarAnalysis[] = [
    buildPillarAnalysis('year', fp.year, dayMasterStem),
    buildPillarAnalysis('month', fp.month, dayMasterStem),
    buildPillarAnalysis('day', fp.day, dayMasterStem),
    buildPillarAnalysis('hour', fp.hour, dayMasterStem),
  ];

  const elementBalance = buildElementBalance(fp);
  const voids = voidBranches(fp.day);

  trace.push({
    rule: 'bazi.elementBalance',
    detail: '五行权重 = 天干1.0 + 藏干 [primary 1.0, secondary 0.5, tertiary 0.3]。',
    data: { balance: elementBalance.map((e) => ({ element: e.element, weight: e.weight, count: e.count })) },
  });
  trace.push({
    rule: 'bazi.voidBranches',
    detail: '依日柱所在旬定空亡。',
    data: { day: fp.day.ganzhi, voids },
  });

  const branchYy = BRANCH_YINYANG[fp.day.branch];

  const warnings = [...astro.warnings];
  if (astro.warnings.some((w) => w.code === 'TRUE_SOLAR_FALLBACK')) {
    warnings.push({
      code: 'BAZI_NO_TRUE_SOLAR',
      message: '未使用真太阳时（缺少经纬度），时柱接近边界时可能错位。',
      severity: 'warning',
    });
  }

  const sourceGrade: SourceGrade =
    astro.sourceGrade === 'A' ? 'A' :
    astro.sourceGrade === 'B' ? 'B' :
    astro.sourceGrade === 'C' ? 'C' : 'D';

  return {
    fourPillars: fp,
    dayMaster,
    pillarAnalyses,
    elementBalance,
    voidBranches: voids,
    zodiac: ZODIAC[fp.year.branch],
    warnings,
    explanationTrace: trace,
    sourceGrade,
  };
  void branchYy; // referenced for completeness; reserved for future strength refinement
}
