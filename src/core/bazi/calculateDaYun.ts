/**
 * P4.2 — 大运 (Major Decadal Cycles) calculation.
 *
 * Direction rule (顺/逆):
 *   阳年男 / 阴年女 → 顺行 (forward)
 *   阴年男 / 阳年女 → 逆行 (backward)
 *
 * Starting age (起运):
 *   - 顺行: count days/hours from birth to the NEXT 节 (节, not 中气)
 *   - 逆行: count days/hours from birth to the PREVIOUS 节
 *   - 3 days = 1 year ⇒ years = days/3, months = (remainder*12)/3 etc.
 *
 * Each 大运 lasts 10 years. The first 大运's stem-branch comes from the
 * pillar AFTER (顺) or BEFORE (逆) the month pillar in the 60-jiazi cycle.
 */

import type { NormalizedAstroTime, ExplanationStep, AstroWarning } from '../astro-time/types';
import type { Gender } from '../../types/prediction';
import { sixtyJiazi, STEM_YINYANG, jiaziIndex, type Pillar } from '../calendar/ganzhi';
import { fourPillarsFromAstro } from '../calendar/fourPillars';
import { solarTermsForYear, type SolarTerm } from '../calendar/solarTerms';

/** The 12 节 (major terms that start a 月), in canonical order. */
const JIE_NAMES: ReadonlySet<string> = new Set([
  '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
  '立秋', '白露', '寒露', '立冬', '大雪', '小寒',
]);

export interface DaYunStep {
  index: number;            // 0-based
  pillar: Pillar;
  startAge: number;         // exact fractional age in years at entry
  startYear: number;        // calendar year at entry
}

export interface DaYunResult {
  direction: 'forward' | 'backward';
  /** Distance in days from birth to the boundary jie used for 起运. */
  jieDistanceDays: number;
  startAgeYears: number;    // fractional
  startAgeYearsInt: number; // floor (传统说法)
  steps: DaYunStep[];
  explanationTrace: ExplanationStep[];
  warnings: AstroWarning[];
}

function allJieAround(utc: Date): SolarTerm[] {
  const y = utc.getUTCFullYear();
  const list = [
    ...solarTermsForYear(y - 1),
    ...solarTermsForYear(y),
    ...solarTermsForYear(y + 1),
  ];
  return list.filter((t) => JIE_NAMES.has(t.name)).sort((a, b) => a.utc.getTime() - b.utc.getTime());
}

function previousJie(utc: Date): SolarTerm {
  const list = allJieAround(utc);
  let best: SolarTerm | undefined;
  for (const t of list) {
    if (t.utc.getTime() <= utc.getTime() && (!best || t.utc.getTime() > best.utc.getTime())) best = t;
  }
  if (!best) throw new Error('No previous 节 found');
  return best;
}

function nextJie(utc: Date): SolarTerm {
  const list = allJieAround(utc);
  let best: SolarTerm | undefined;
  for (const t of list) {
    if (t.utc.getTime() > utc.getTime() && (!best || t.utc.getTime() < best.utc.getTime())) best = t;
  }
  if (!best) throw new Error('No next 节 found');
  return best;
}

export function calculateDaYun(
  astro: NormalizedAstroTime,
  gender: Gender,
  options: { count?: number } = {},
): DaYunResult {
  const count = options.count ?? 9;
  const fp = fourPillarsFromAstro(astro);
  const yearStem = fp.year.stem;
  const yangYear = STEM_YINYANG[yearStem] === '阳';

  const direction: 'forward' | 'backward' =
    (yangYear && gender === 'male') || (!yangYear && gender === 'female') ? 'forward' : 'backward';

  const utc = new Date(astro.utcDateTime);
  const boundary = direction === 'forward' ? nextJie(utc) : previousJie(utc);
  const distanceMs = Math.abs(boundary.utc.getTime() - utc.getTime());
  const distanceDays = distanceMs / (1000 * 60 * 60 * 24);
  const startAgeYears = distanceDays / 3;

  // First DaYun pillar = month pillar shifted ±1 in the 60-jiazi cycle.
  const cycle = sixtyJiazi();
  const monthIdx = jiaziIndex(fp.month);
  const stepDir = direction === 'forward' ? 1 : -1;
  const steps: DaYunStep[] = [];
  for (let i = 0; i < count; i++) {
    const idx = ((monthIdx + stepDir * (i + 1)) % 60 + 60) % 60;
    const startAge = startAgeYears + i * 10;
    steps.push({
      index: i,
      pillar: cycle[idx],
      startAge: Math.round(startAge * 100) / 100,
      startYear: astro.localDateTime.year + Math.floor(startAge),
    });
  }

  const warnings: AstroWarning[] = [];
  if (distanceDays > 60) {
    warnings.push({
      code: 'DA_YUN_DISTANCE_LARGE',
      message: `起运距离 ${distanceDays.toFixed(1)} 天，超过常规范围，请人工复核 节气表。`,
      severity: 'warning',
    });
  }

  const trace: ExplanationStep[] = [
    {
      rule: 'daYun.direction',
      detail: `年干 ${yearStem} (${yangYear ? '阳' : '阴'}) × ${gender === 'male' ? '男' : '女'} → ${direction === 'forward' ? '顺行' : '逆行'}`,
      data: { yearStem, yangYear, gender, direction },
    },
    {
      rule: 'daYun.boundaryJie',
      detail: `起运边界节 = ${boundary.name} @ ${boundary.utc.toISOString()}; 距出生 ${distanceDays.toFixed(3)} 天`,
      data: { name: boundary.name, utc: boundary.utc.toISOString(), distanceDays },
    },
    {
      rule: 'daYun.startAge',
      detail: '起运年龄 = 距 节 天数 / 3。',
      data: { startAgeYears: Math.round(startAgeYears * 1000) / 1000 },
    },
    {
      rule: 'daYun.firstPillar',
      detail: `首步大运 = 月柱 ${fp.month.ganzhi} ${direction === 'forward' ? '+1' : '-1'} 步。`,
      data: { monthPillar: fp.month.ganzhi, firstDaYun: steps[0]?.pillar.ganzhi },
    },
  ];

  return {
    direction,
    jieDistanceDays: Math.round(distanceDays * 1000) / 1000,
    startAgeYears: Math.round(startAgeYears * 100) / 100,
    startAgeYearsInt: Math.floor(startAgeYears),
    steps,
    explanationTrace: trace,
    warnings,
  };
}
