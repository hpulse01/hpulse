/**
 * P4.2 — Top-level deterministic orchestrator.
 *
 * Input: `BaziCoreInput` (fully self-describing — never reads system clock).
 * Output: `BaziChart` (rich, traceable, partial flags honest).
 *
 * Pipeline:
 *   1. normalizeBirthTime → astro
 *   2. fourPillarsFromAstro → pillars (year by 立春, month by 节, hour by 五鼠遁)
 *   3. enrich each pillar (十神 / 藏干 / 纳音 / 十二长生 / 旬空)
 *   4. wuxing balance + yinyang balance + support/drain
 *   5. analyzeStrength (existing)
 *   6. analyzeElements → favorable / unfavorable
 *   7. analyzePattern → 格局
 *   8. calculateDaYun (existing) → daYun + currentDaYun
 *   9. analyzeFlowYear / analyzeFlowMonth (only if targetYear / queryTimeUtc)
 *  10. domain analyses (relationship/career/wealth/health/family) — neutral, sensitive-flagged
 *  11. compose confidence / completeness / implementationStatus / validationFlags
 *
 * No randomness. No system time. Same input ⇒ identical output.
 */

import { normalizeBirthTime } from '../astro-time/normalizeBirthTime';
import { calculateBazi as calculateBaziCore } from './calculateBazi';
import { analyzeStrength } from './analyzeStrength';
import { calculateDaYun } from './calculateDaYun';
import { calculateHiddenStemTenGods } from './hiddenStems';
import { nayinOf } from '../calendar/nayin';
import { tenGodOf } from '../calendar/tenGods';
import { twelveStageOf } from './twelveStages';
import { kongWangBranches, isBranchKongWang } from './kongWang';
import {
  calculateWuxingBalance, calculateYinYangBalance, calculateSupportDrainCounter,
  rootStrengthScore,
} from './wuxing';
import { analyzeElements } from './analyzeElements';
import { analyzePattern } from './analyzePattern';
import { analyzeTiaohou } from './tiaohou';
import { detectHuaQiGe, detectCongGe } from './congHua';
import { analyzeFlowYear } from './analyzeFlowYear';
import { analyzeFlowMonth } from './analyzeFlowMonth';
import {
  STEM_ELEMENT, STEM_YINYANG, BRANCH_ELEMENT, BRANCH_YINYANG,
  type Stem, type Branch, type Element, type Pillar,
} from '../calendar/ganzhi';

import type {
  BaziChart, BaziCoreInput, BaziPillar, DaYunStepInfo, DomainAnalysis,
  ImplementationStatus, StrengthLevel, UsefulGodCandidate, ValidationFlagsBlock,
} from './types';
import type { ExplanationStep, AstroWarning } from '../astro-time/types';

function mapStrength(score: number): StrengthLevel {
  if (score >= 75) return 'veryStrong';
  if (score >= 60) return 'strong';
  if (score >= 40) return 'balanced';
  if (score >= 25) return 'weak';
  return 'veryWeak';
}

function buildPillar(
  position: BaziPillar['position'], pillar: Pillar, dayStem: Stem, dayPillar: Pillar,
): BaziPillar {
  return {
    position,
    stem: pillar.stem,
    branch: pillar.branch,
    ganZhi: pillar.ganzhi,
    stemElement: STEM_ELEMENT[pillar.stem],
    branchElement: BRANCH_ELEMENT[pillar.branch],
    stemYinYang: STEM_YINYANG[pillar.stem],
    branchYinYang: BRANCH_YINYANG[pillar.branch],
    hiddenStems: calculateHiddenStemTenGods(dayStem, pillar.branch),
    tenGod: position === 'day' ? '日主' : tenGodOf(dayStem, pillar.stem),
    nayin: nayinOf(pillar),
    twelveStage: twelveStageOf(dayStem, pillar.branch),
    kongWang: isBranchKongWang(pillar.branch, dayPillar),
  };
}

function pickUsefulGod(favorable: Element[]): UsefulGodCandidate[] {
  return favorable.map((el, i) => ({
    element: el,
    reason: `喜用候选#${i + 1}：基于日主强弱与五行偏枯`,
    score: 80 - i * 10,
  }));
}

function buildDomainAnalyses(chart: Omit<BaziChart, 'relationshipAnalysis'|'careerAnalysis'|'wealthAnalysis'|'healthAnalysis'|'familyAnalysis'|'riskFlags'|'sensitiveFlags'|'implementationStatus'|'confidence'|'completenessScore'|'validationFlags'>) {
  // Neutral, evidence-based, NO clinical/legal advice.
  const dayBranch = chart.fourPillars.day.branch;
  const monthBranch = chart.fourPillars.month.branch;

  const wealthGods = chart.tenGods.filter(g => g.god === '正财' || g.god === '偏财').length;
  const officialGods = chart.tenGods.filter(g => g.god === '正官' || g.god === '七杀').length;
  const printGods = chart.tenGods.filter(g => g.god === '正印' || g.god === '偏印').length;
  const eatHurtGods = chart.tenGods.filter(g => g.god === '食神' || g.god === '伤官').length;

  const relationship: DomainAnalysis = {
    score: 50 + (chart.fourPillars.day.kongWang ? -10 : 0) + (officialGods >= 1 ? 10 : 0),
    signals: [
      `日支=${dayBranch}（配偶宫）`,
      chart.fourPillars.day.kongWang ? '日支临空亡，关系易聚散' : '日支无空亡',
    ],
    warnings: ['关系预测涉及双方动态，仅作参考'],
    sensitive: false,
  };

  const career: DomainAnalysis = {
    score: 50 + officialGods * 6 + (chart.selectedPattern ? 8 : 0),
    signals: [
      chart.selectedPattern ? `主格：${chart.selectedPattern.type}` : '格局未明',
      `官杀数=${officialGods}, 印星数=${printGods}`,
    ],
    warnings: officialGods === 0 ? ['原局无官杀，事业靠食伤生财或印绶'] : [],
  };

  const wealth: DomainAnalysis = {
    score: 50 + wealthGods * 8 + (chart.dayMasterStrength === 'strong' || chart.dayMasterStrength === 'veryStrong' ? 5 : -5),
    signals: [
      `财星数=${wealthGods}`,
      `日主${chart.dayMasterStrength}，担财能力相应`,
    ],
    warnings: [],
  };

  const health: DomainAnalysis = {
    score: 60 - Math.max(0, 5 - chart.wuxingBalance.filter(e => e.count > 0).length) * 8,
    signals: [
      `五行齐缺：缺=${chart.wuxingBalance.filter(e => e.count === 0).map(e => e.element).join('') || '无'}`,
      '健康趋势仅供参考，不能替代医疗建议',
    ],
    warnings: ['不构成医疗诊断或治疗建议'],
    sensitive: true,
  };

  const family: DomainAnalysis = {
    score: 50 + (printGods >= 1 ? 8 : -4) + (eatHurtGods >= 1 ? 4 : 0),
    signals: [
      `月柱=${chart.fourPillars.month.ganZhi}（父母宫）, 月支=${monthBranch}`,
      `印星数=${printGods}（与父母缘分参考）`,
    ],
    warnings: ['家庭关系受双方互动影响，结果非命定'],
  };

  return { relationship, career, wealth, health, family };
}

export function calculateBaziChart(input: BaziCoreInput): BaziChart {
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];
  const passed: string[] = [];
  const failed: string[] = [];
  const valWarnings: string[] = [];

  // Step 1 — normalize time
  const astro = normalizeBirthTime({
    birthLocalDateTime: input.birthLocalDateTime,
    geoLatitude: input.geoLatitude ?? 0,
    geoLongitude: input.geoLongitude ?? 0,
    timezoneIana: input.timezoneIana ?? 'UTC',
    dayBoundaryPolicy: input.dayBoundaryPolicy === 'midnight' ? 'midnight-00' : 'zi-shi-23',
  });
  trace.push(...astro.explanationTrace);
  warnings.push(...astro.warnings);

  if (input.useTrueSolarTime && (input.geoLatitude == null || input.geoLongitude == null)) {
    warnings.push({
      code: 'TRUE_SOLAR_REQUESTED_NO_GEO',
      message: 'useTrueSolarTime=true 但缺少经纬度，已退回平太阳时；时柱在边界处可能错位。',
      severity: 'warning',
    });
  }

  // Step 2 — pillars + Step 3 enrich (delegate to existing core)
  const coreChart = calculateBaziCore(astro);
  trace.push(...coreChart.explanationTrace);
  warnings.push(...coreChart.warnings);

  const fp = coreChart.fourPillars;
  const dayStem: Stem = fp.day.stem;
  const dayPillar = fp.day;

  const yearP = buildPillar('year', fp.year, dayStem, dayPillar);
  const monthP = buildPillar('month', fp.month, dayStem, dayPillar);
  const dayP = buildPillar('day', fp.day, dayStem, dayPillar);
  const hourP = buildPillar('hour', fp.hour, dayStem, dayPillar);

  const tenGodsList = [yearP, monthP, dayP, hourP].map(p => ({ position: p.position, god: p.tenGod }));
  const hiddenList = [yearP, monthP, dayP, hourP].map(p => ({ branch: p.branch as Branch, hidden: p.hiddenStems }));
  const nayinList = [yearP, monthP, dayP, hourP].map(p => ({ position: p.position, pillar: p.ganZhi, nayin: p.nayin }));

  // Step 4 — balance
  const wuxingBalance = calculateWuxingBalance(fp);
  const yinyangBalance = calculateYinYangBalance(fp);
  const supportDrain = calculateSupportDrainCounter(fp, dayStem);
  const rootStrength = rootStrengthScore(fp, dayStem);
  trace.push({ rule: 'bazi.wuxingBalance', detail: '月令权重×1.5；藏干 1/0.5/0.3。', data: { wuxingBalance } });
  trace.push({ rule: 'bazi.yinyangBalance', detail: '阴阳计数（天干+地支）。', data: { ...yinyangBalance } });

  // Step 5 — strength (re-use existing analyzer)
  const strength = analyzeStrength(coreChart);
  warnings.push(...strength.warnings);
  trace.push(...strength.explanationTrace);
  const strengthLevel = mapStrength(strength.score);

  // Step 6 — elements
  const dme: Element = STEM_ELEMENT[dayStem];
  const elementsVerdict = analyzeElements(dme, wuxingBalance, strengthLevel);
  const usefulGods = pickUsefulGod(elementsVerdict.favorable);
  const selectedUsefulGod = usefulGods[0]?.element ?? null;

  // Step 7 — pattern (needs strength-level)
  const patternResult = analyzePattern({
    fourPillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
    dayMaster: dayStem,
    dayMasterStrength: strengthLevel,
  });

  // Step 7b — 化气格 / 从格 refinement
  const huaQi = detectHuaQiGe({
    yearStem: yearP.stem, monthStem: monthP.stem, dayStem, hourStem: hourP.stem,
    monthBranch: monthP.branch,
  });
  if (huaQi.candidate) patternResult.candidates.push(huaQi.candidate);
  const congCandidates = detectCongGe({
    dayStem,
    stems: [yearP.stem, monthP.stem, hourP.stem],
    branches: [yearP.branch, monthP.branch, dayP.branch, hourP.branch],
    hasRoot: strength.hasRoot,
    strengthLevel,
  });
  // 替换原始粗略从格候选
  if (congCandidates.length > 0) {
    const refinedTypes = new Set(congCandidates.map((c) => c.type));
    for (let i = patternResult.candidates.length - 1; i >= 0; i--) {
      const c = patternResult.candidates[i];
      if ((c.type === '从强格' || c.type === '从弱格') && refinedTypes.has(c.type) && !congCandidates.includes(c)) {
        patternResult.candidates.splice(i, 1);
      }
    }
    patternResult.candidates.push(...congCandidates);
  }
  patternResult.candidates.sort((a, b) => b.confidence - a.confidence);
  patternResult.selected = patternResult.candidates[0]?.confidence >= 50 ? patternResult.candidates[0] : null;
  trace.push({
    rule: 'bazi.congHua',
    detail: `化气格检测：${huaQi.combined ? `五合成立(${huaQi.transformedElement})` : '无五合'}；从格候选 ${congCandidates.length} 个`,
    data: { huaQiCombined: huaQi.combined, transformedElement: huaQi.transformedElement, congCount: congCandidates.length },
  });

  // Step 7c — 调候用神
  const tiaohou = analyzeTiaohou(dayStem, monthP.branch, [yearP.stem, monthP.stem, dayStem, hourP.stem]);
  trace.push({ rule: 'bazi.tiaohou', detail: tiaohou.description, data: { stems: tiaohou.stems, elements: tiaohou.elements } });

  // Step 8 — daYun
  const daYunRaw = calculateDaYun(astro, input.gender, { count: 10 });
  warnings.push(...daYunRaw.warnings);
  trace.push(...daYunRaw.explanationTrace);

  const daYunSteps: DaYunStepInfo[] = daYunRaw.steps.map((s, i) => ({
    index: i,
    startAge: s.startAge,
    endAge: s.startAge + 10,
    startDate: new Date(Date.UTC(s.startYear, 0, 1)).toISOString(),
    ganZhi: s.pillar.ganzhi,
    stem: s.pillar.stem,
    branch: s.pillar.branch,
    tenGod: tenGodOf(dayStem, s.pillar.stem),
    hiddenStems: calculateHiddenStemTenGods(dayStem, s.pillar.branch),
    nayin: nayinOf(s.pillar),
    direction: daYunRaw.direction,
    explanationTrace: [],
  }));

  // currentDaYun — only resolvable when input.queryTimeUtc or input.targetYear is supplied
  let currentDaYun: DaYunStepInfo | null = null;
  let nowYear: number | null = null;
  if (input.targetYear != null) nowYear = input.targetYear;
  else if (input.queryTimeUtc) {
    const d = new Date(input.queryTimeUtc);
    if (!Number.isNaN(d.getTime())) nowYear = d.getUTCFullYear();
  }
  if (nowYear != null) {
    const age = nowYear - input.birthLocalDateTime.year;
    currentDaYun = daYunSteps.find(s => age >= s.startAge && age < s.endAge) ?? null;
  }

  // Step 9 — flow year + month (deterministic; only when caller supplies)
  const flowYear = (input.targetYear != null || input.queryTimeUtc)
    ? analyzeFlowYear({
        ...({} as BaziChart),
        inputSnapshot: input,
        dayMaster: dayStem,
        favorableElements: elementsVerdict.favorable,
        unfavorableElements: elementsVerdict.unfavorable,
        fourPillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
      } as BaziChart, { targetYear: input.targetYear, queryTimeUtc: input.queryTimeUtc })
    : null;

  const flowMonth = (input.targetYear != null && input.targetMonth != null)
    ? analyzeFlowMonth({
        ...({} as BaziChart),
        inputSnapshot: input,
        dayMaster: dayStem,
        dayMasterElement: dme,
        favorableElements: elementsVerdict.favorable,
        unfavorableElements: elementsVerdict.unfavorable,
        fourPillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
      } as BaziChart, { targetYear: input.targetYear, targetMonth: input.targetMonth })
    : null;

  if (flowYear) trace.push(...flowYear.explanationTrace);
  if (flowMonth) trace.push(...flowMonth.explanationTrace);

  // Step 10 — domain analyses
  const partial: BaziChart = {
    inputSnapshot: input,
    fourPillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
    dayMaster: dayStem,
    dayMasterElement: dme,
    dayMasterYinYang: STEM_YINYANG[dayStem],
    tenGods: tenGodsList,
    hiddenStems: hiddenList,
    nayin: nayinList,
    wuxingBalance,
    yinyangBalance,
    seasonStrength: strength.components.seasonScore >= 25 ? 'with-season' :
      strength.components.seasonScore >= 15 ? 'neutral' : 'against-season',
    rootStrength,
    supportDrainCounter: supportDrain,
    dayMasterStrength: strengthLevel,
    strengthScore: strength.score,
    favorableElements: elementsVerdict.favorable,
    unfavorableElements: elementsVerdict.unfavorable,
    usefulGodCandidates: usefulGods,
    selectedUsefulGod,
    patternCandidates: patternResult.candidates,
    selectedPattern: patternResult.selected,
    tiaohou,
    daYun: daYunSteps,
    currentDaYun,
    flowYear,
    flowMonth,
    relationshipAnalysis: { score: 0, signals: [], warnings: [] },
    careerAnalysis: { score: 0, signals: [], warnings: [] },
    wealthAnalysis: { score: 0, signals: [], warnings: [] },
    healthAnalysis: { score: 0, signals: [], warnings: [] },
    familyAnalysis: { score: 0, signals: [], warnings: [] },
    riskFlags: [],
    sensitiveFlags: ['health', 'mortality', 'relationship-breakdown'],
    implementationStatus: 'partial_rules',
    sourceGrade: coreChart.sourceGrade,
    confidence: 0,
    completenessScore: 0,
    warnings,
    uncertaintyNotes: [
      'flow year requires explicit input.targetYear or input.queryTimeUtc',
      '刑冲合化对通根的细化修正仍为部分实现',
    ],
    explanationTrace: trace,
    validationFlags: { passed, failed, warnings: valWarnings },
  };

  const domains = buildDomainAnalyses(partial);
  partial.relationshipAnalysis = domains.relationship;
  partial.careerAnalysis = domains.career;
  partial.wealthAnalysis = domains.wealth;
  partial.healthAnalysis = domains.health;
  partial.familyAnalysis = domains.family;

  // Validation flags
  if (yearP.ganZhi.length === 2) passed.push('year-pillar-formed');
  if (monthP.ganZhi.length === 2) passed.push('month-pillar-formed');
  if (dayP.ganZhi.length === 2) passed.push('day-pillar-formed');
  if (hourP.ganZhi.length === 2) passed.push('hour-pillar-formed');
  if (daYunSteps.length >= 8) passed.push('da-yun-min-steps');
  if (kongWangBranches(dayPillar).length === 2) passed.push('kong-wang-resolved');
  if (input.geoLatitude == null || input.geoLongitude == null) valWarnings.push('geo-missing');
  if (!input.timezoneIana) valWarnings.push('iana-tz-missing');
  if (input.targetYear == null && !input.queryTimeUtc) valWarnings.push('flow-year-not-requested');

  if (tiaohou) passed.push('tiaohou-resolved');

  // Confidence + completeness
  const baseConf = 74;
  const gradePenalty = coreChart.sourceGrade === 'A' ? 0 : coreChart.sourceGrade === 'B' ? 5 : coreChart.sourceGrade === 'C' ? 12 : 25;
  const partialPenalty = patternResult.selected ? 0 : 8;
  const confidence = Math.max(0, Math.min(100, baseConf - gradePenalty - partialPenalty));
  const completenessScore = Math.min(100, Math.round(
    (passed.length / 7) * 60
    + (patternResult.selected ? 18 : 5)
    + (flowYear ? 8 : 0)
    + (tiaohou ? 6 : 0)
    + 8 // base for daYun + domains
  ));

  let implementationStatus: ImplementationStatus = 'partial_rules';
  if (patternResult.selected && flowYear && coreChart.sourceGrade === 'A') {
    implementationStatus = 'complete';
  }

  partial.confidence = confidence;
  partial.completenessScore = completenessScore;
  partial.implementationStatus = implementationStatus;
  partial.validationFlags = { passed, failed, warnings: valWarnings } satisfies ValidationFlagsBlock;

  return partial;
}
