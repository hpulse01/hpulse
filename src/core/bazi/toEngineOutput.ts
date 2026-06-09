/**
 * P4.2 — Adapters from BaziChart to legacy/EngineOutput shapes.
 *
 * Exports:
 *   - `toAdapterOutput` (kept as legacy adapter for the smaller `BaziCoreChart`)
 *   - `baziChartToEngineOutput` (new: full BaziChart → EngineOutput)
 */

import type { BaziChart as BaziCoreChart } from './calculateBazi';
import type { StrengthAnalysis } from './analyzeStrength';
import type { BaziChart, BaziCoreInput } from './types';
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';

export interface BaziAdapterOutput {
  fourPillars: { year: string; month: string; day: string; hour: string };
  dayMaster: {
    stem: string; element: string; yinYang: string;
    strengthScore: number; strengthLevel: string;
    description: string; seasonalStrength: string;
  };
  tenGods: { position: string; stem: string; god: string }[];
  hiddenStems: { branch: string; stems: string[]; gods: string[] }[];
  naYinAnalysis: { position: string; pillar: string; nayin: string }[];
  elementBalance: { element: string; weight: number; count: number }[];
  voidBranches: string[];
  zodiac: string;
  summary: string;
  meta: {
    sourceGrade: string;
    warnings: { code: string; message: string; severity: string }[];
    explanationTraceLength: number;
  };
}

export function toAdapterOutput(chart: BaziCoreChart, strength: StrengthAnalysis): BaziAdapterOutput {
  const fp = chart.fourPillars;
  return {
    fourPillars: { year: fp.year.ganzhi, month: fp.month.ganzhi, day: fp.day.ganzhi, hour: fp.hour.ganzhi },
    dayMaster: {
      stem: chart.dayMaster.stem, element: chart.dayMaster.element, yinYang: chart.dayMaster.yinYang,
      strengthScore: strength.score, strengthLevel: strength.level,
      description: `日主 ${chart.dayMaster.stem}(${chart.dayMaster.element}) — ${strength.level} (${strength.score}/100)`,
      seasonalStrength: strength.components.seasonScore >= 25 ? '得令' :
        strength.components.seasonScore >= 15 ? '不令不失' : '失令',
    },
    tenGods: chart.pillarAnalyses.map((p) => ({ position: p.position, stem: p.pillar.stem, god: p.stemTenGod })),
    hiddenStems: chart.pillarAnalyses.map((p) => ({ branch: p.pillar.branch, stems: p.hiddenStems, gods: p.hiddenTenGods })),
    naYinAnalysis: chart.pillarAnalyses.map((p) => ({ position: p.position, pillar: p.pillar.ganzhi, nayin: p.nayin })),
    elementBalance: chart.elementBalance.map((e) => ({ element: e.element, weight: e.weight, count: e.count })),
    voidBranches: chart.voidBranches,
    zodiac: chart.zodiac,
    summary: `${fp.year.ganzhi} ${fp.month.ganzhi} ${fp.day.ganzhi} ${fp.hour.ganzhi}｜日主 ${chart.dayMaster.stem}(${chart.dayMaster.element})｜${strength.level}`,
    meta: {
      sourceGrade: chart.sourceGrade,
      warnings: [...chart.warnings, ...strength.warnings].map((w) => ({ code: w.code, message: w.message, severity: w.severity })),
      explanationTraceLength: chart.explanationTrace.length,
    },
  };
}

// ─── New full adapter ────────────────────────────────────────────────────

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function buildFateVector(chart: BaziChart): { vector: FateVector; trace: string[] } {
  const trace: string[] = [];
  const ten = chart.tenGods.map(t => t.god);
  const has = (g: string) => ten.includes(g as never);
  const cnt = (g: string) => chart.tenGods.filter(t => t.god === g).length;

  const officials = cnt('正官') + cnt('七杀');
  const wealthCnt = cnt('正财') + cnt('偏财');
  const printCnt = cnt('正印') + cnt('偏印');
  const eatHurt = cnt('食神') + cnt('伤官');

  const life = clamp(chart.strengthScore * 0.5 + (chart.selectedPattern ? 25 : 10) + officials * 4);
  trace.push(`life = strength*0.5 + 格局加成 + 官杀加成 = ${life}`);

  const wealth = clamp(40 + wealthCnt * 10 + (chart.dayMasterStrength === 'strong' || chart.dayMasterStrength === 'veryStrong' ? 10 : -5));
  trace.push(`wealth = 40 + 财星*10 + 担财能力 = ${wealth}`);

  const relation = clamp(chart.relationshipAnalysis.score);
  trace.push(`relation = relationshipAnalysis.score = ${relation}`);

  const health = clamp(chart.healthAnalysis.score);
  trace.push(`health = healthAnalysis.score = ${health}`);

  const wisdom = clamp(40 + printCnt * 10 + (has('食神') ? 6 : 0));
  trace.push(`wisdom = 40 + 印*10 + 食神加成 = ${wisdom}`);

  const spirit = clamp(50 + printCnt * 4 + (chart.dayMasterStrength === 'balanced' ? 10 : 0));
  trace.push(`spirit = 50 + 印*4 + 中和加成 = ${spirit}`);

  const socialStatus = clamp(40 + officials * 8 + printCnt * 4);
  trace.push(`socialStatus = 40 + 官杀*8 + 印*4 = ${socialStatus}`);

  const creativity = clamp(40 + eatHurt * 10);
  trace.push(`creativity = 40 + 食伤*10 = ${creativity}`);

  // luck — based on currentDaYun favorability vs day master
  let luckBase = 50;
  if (chart.currentDaYun) {
    if (chart.favorableElements.length && chart.favorableElements.includes(chart.currentDaYun.stem ? chart.fourPillars.year.stemElement : chart.fourPillars.year.stemElement)) {
      luckBase += 10;
    }
  }
  const luck = clamp(luckBase);
  trace.push(`luck = 50 + 大运五行喜忌 = ${luck}`);

  const homeStability = clamp(chart.familyAnalysis.score);
  trace.push(`homeStability = familyAnalysis.score = ${homeStability}`);

  return {
    vector: { life, wealth, relation, health, wisdom, spirit, socialStatus, creativity, luck, homeStability },
    trace,
  };
}

export function baziChartToEngineOutput(chart: BaziChart, input: BaziCoreInput): EngineOutput {
  const fr = buildFateVector(chart);

  const aspectScores: Record<string, number> = {
    relationship: chart.relationshipAnalysis.score,
    career: chart.careerAnalysis.score,
    wealth: chart.wealthAnalysis.score,
    health: chart.healthAnalysis.score,
    family: chart.familyAnalysis.score,
    rootStrength: chart.rootStrength,
    strengthScore: chart.strengthScore,
  };

  const eventCandidates: string[] = [];
  for (const d of chart.daYun) {
    eventCandidates.push(`大运:${d.startAge.toFixed(1)}-${d.endAge.toFixed(1)}岁→${d.ganZhi}(${d.tenGod})`);
  }
  if (chart.flowYear) {
    eventCandidates.push(`流年:${chart.flowYear.year}年(${chart.flowYear.age}岁)→${chart.flowYear.ganZhi}(${chart.flowYear.tenGod})`);
    for (const c of chart.flowYear.clashes) eventCandidates.push(`冲:${c}`);
    for (const c of chart.flowYear.combinations) eventCandidates.push(`合:${c}`);
  }
  if (chart.selectedPattern) eventCandidates.push(`格局:${chart.selectedPattern.type}(conf=${chart.selectedPattern.confidence})`);

  const validationFlags: ValidationFlags = {
    passed: chart.validationFlags.passed,
    failed: chart.validationFlags.failed,
    warnings: [
      ...chart.validationFlags.warnings,
      ...chart.warnings.map(w => `${w.code}: ${w.message}`),
    ],
  };

  const explanationTrace: string[] = [
    ...chart.explanationTrace.map(s => `[${s.rule}] ${s.detail}`),
    ...fr.trace.map(t => `[bazi.fateVector] ${t}`),
  ];

  return {
    engineName: 'bazi',
    engineNameCN: '八字命理',
    engineVersion: 'P4.2-core',
    sourceUrls: [
      'https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny',
      'classical: 子平真诠 / 滴天髓 / 穷通宝鉴',
    ],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '子平 (经典四柱 + 节气月 + 立春切年 + 五鼠遁时柱)',
    confidence: chart.confidence,
    computationTimeMs: 0,
    rawInputSnapshot: {
      birthLocalDateTime: input.birthLocalDateTime,
      gender: input.gender,
      timezoneIana: input.timezoneIana,
      geoLatitude: input.geoLatitude,
      geoLongitude: input.geoLongitude,
      targetYear: input.targetYear,
      queryTimeUtc: input.queryTimeUtc,
    },
    fateVector: fr.vector,
    normalizedOutput: {
      yearGZ: chart.fourPillars.year.ganZhi,
      monthGZ: chart.fourPillars.month.ganZhi,
      dayGZ: chart.fourPillars.day.ganZhi,
      hourGZ: chart.fourPillars.hour.ganZhi,
      dayMaster: chart.dayMaster,
      dayMasterElement: chart.dayMasterElement,
      strengthLevel: chart.dayMasterStrength,
      strengthScore: String(chart.strengthScore),
      pattern: chart.selectedPattern?.type ?? '未定格',
      usefulGod: chart.selectedUsefulGod ?? '',
      implementationStatus: chart.implementationStatus,
      // ── P4.4c — rich fields exposed for UI panel ──
      kongWangPillars: chart.fourPillars
        ? ['year', 'month', 'day', 'hour']
            .filter((k) => chart.fourPillars[k as 'year'].kongWang)
            .join(',')
        : '',
      tiaohouJson: chart.tiaohou
        ? JSON.stringify({
            primary: chart.tiaohou.primary,
            stems: chart.tiaohou.stems,
            elements: chart.tiaohou.elements,
            presentInStems: chart.tiaohou.presentInStems,
            description: chart.tiaohou.description,
          })
        : '',
      flowYearJson: chart.flowYear
        ? JSON.stringify({
            year: chart.flowYear.year,
            age: chart.flowYear.age,
            ganZhi: chart.flowYear.ganZhi,
            tenGod: chart.flowYear.tenGod,
            clashes: chart.flowYear.clashes,
            combinations: chart.flowYear.combinations,
            riskFlags: chart.flowYear.riskFlags,
            opportunityFlags: chart.flowYear.opportunityFlags,
          })
        : '',
      flowMonthJson: chart.flowMonth
        ? JSON.stringify({
            year: chart.flowMonth.year,
            month: chart.flowMonth.month,
            ganZhi: chart.flowMonth.ganZhi,
            tenGod: chart.flowMonth.tenGod,
            clashes: chart.flowMonth.clashes,
            combinations: chart.flowMonth.combinations,
            riskFlags: chart.flowMonth.riskFlags,
            opportunityFlags: chart.flowMonth.opportunityFlags,
          })
        : '',
      domainScoresJson: JSON.stringify({
        career: chart.careerAnalysis.score,
        wealth: chart.wealthAnalysis.score,
        relationship: chart.relationshipAnalysis.score,
        health: chart.healthAnalysis.score,
        family: chart.familyAnalysis.score,
      }),
      domainSignalsJson: JSON.stringify({
        career: chart.careerAnalysis.signals,
        wealth: chart.wealthAnalysis.signals,
        relationship: chart.relationshipAnalysis.signals,
        health: chart.healthAnalysis.signals,
        family: chart.familyAnalysis.signals,
      }),
      usefulGodCandidatesJson: JSON.stringify(
        chart.usefulGodCandidates.map((c) => ({
          element: c.element,
          reason: c.reason,
          score: c.score,
        })),
      ),
      currentDaYunGZ: chart.currentDaYun?.ganZhi ?? '',
      currentDaYunTenGod: chart.currentDaYun ? String(chart.currentDaYun.tenGod) : '',
    },
    warnings: chart.warnings.map(w => `${w.code}: ${w.message}`),
    uncertaintyNotes: chart.uncertaintyNotes,
    timingBasis: 'birth',
    explanationTrace,
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: chart.daYun.map(d => ({
      dimension: 'life' as const,
      startAge: d.startAge,
      endAge: d.endAge,
      confidence: chart.confidence,
      trend: 'stable' as const,
      evidence: `大运 ${d.ganZhi}(${d.tenGod})`,
    })),
    aspectScores,
    eventCandidates,
  };
}
