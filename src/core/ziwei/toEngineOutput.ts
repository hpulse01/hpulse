/**
 * P4.4 — Adapter from new ZiweiChart → legacy EngineOutput.
 */

import type {
  EngineOutput,
  FateVector,
  ValidationFlags as PredValidationFlags,
} from '../../types/prediction';
import type { ZiweiChart, ZiweiCoreInput, ZiweiPalace } from './types';

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function palaceScore(palaces: ZiweiPalace[], name: string): number {
  return palaces.find(p => p.name === name)?.strengthScore ?? 50;
}

/** Average a set of palace scores then clamp to 0-100. */
function avg(palaces: ZiweiPalace[], names: string[]): number {
  const xs = names.map(n => palaceScore(palaces, n));
  return clamp(xs.reduce((s, v) => s + v, 0) / xs.length);
}

function bonusFor(chart: ZiweiChart, predicate: (s: { name: string; brightness: string }) => boolean): number {
  let bonus = 0;
  for (const p of chart.palaces) for (const s of p.stars) if (predicate(s)) bonus += 2;
  return Math.min(15, bonus);
}

export function buildZiweiFateVector(chart: ZiweiChart): { vector: FateVector; trace: string[] } {
  const palaces = chart.palaces;
  const trace: string[] = [];

  const life = avg(palaces, ['命宫', '官禄', '迁移']);
  trace.push(`life = avg(命宫, 官禄, 迁移) = ${life}`);

  const wealth = avg(palaces, ['财帛', '田宅']);
  trace.push(`wealth = avg(财帛, 田宅) = ${wealth}`);

  const relation = avg(palaces, ['夫妻', '仆役', '兄弟']);
  trace.push(`relation = avg(夫妻, 仆役, 兄弟) = ${relation}`);

  const health = clamp(palaceScore(palaces, '疾厄'));
  trace.push(`health = score(疾厄) = ${health}`);

  const wisdomBase = avg(palaces, ['福德']);
  const wisdom = clamp(wisdomBase + bonusFor(chart, s => s.name === '文昌' || s.name === '文曲'));
  trace.push(`wisdom = score(福德) + 文昌/文曲 加成 = ${wisdom}`);

  const spirit = avg(palaces, ['福德', '命宫']);
  trace.push(`spirit = avg(福德, 命宫) = ${spirit}`);

  const socialBase = avg(palaces, ['官禄', '迁移']);
  const socialStatus = clamp(socialBase + bonusFor(chart, s => ['天魁', '天钺', '左辅', '右弼'].includes(s.name)));
  trace.push(`socialStatus = avg(官禄, 迁移) + 魁钺/辅弼 加成 = ${socialStatus}`);

  const creativity = clamp(
    bonusFor(chart, s => ['文昌', '文曲', '天机', '贪狼'].includes(s.name)) * 3 + 40,
  );
  trace.push(`creativity = 文昌/文曲/天机/贪狼 加成 + 40 = ${creativity}`);

  const patternImpact = chart.patterns.reduce((s, p) => s + p.impact, 0);
  const sihuaImpact = chart.sihua.reduce((s, sh) => s + (sh.transform === '禄' ? 5 : sh.transform === '科' ? 4 : sh.transform === '权' ? 4 : 0), 0);
  const luck = clamp(50 + patternImpact * 2 + sihuaImpact);
  trace.push(`luck = 50 + 格局*2 + 禄/科/权 = ${luck}`);

  const homeStability = avg(palaces, ['田宅', '父母', '夫妻']);
  trace.push(`homeStability = avg(田宅, 父母, 夫妻) = ${homeStability}`);

  return {
    vector: { life, wealth, relation, health, wisdom, spirit, socialStatus, creativity, luck, homeStability },
    trace,
  };
}

export function ziweiChartToEngineOutput(chart: ZiweiChart, input: ZiweiCoreInput): EngineOutput {
  const fateRes = buildZiweiFateVector(chart);

  const aspectScores: Record<string, number> = {};
  for (const p of chart.palaces) aspectScores[p.name] = p.strengthScore;
  aspectScores['命宫综合'] = chart.strengthAnalysis.mingScore;

  const eventCandidates: string[] = [];
  for (const p of chart.patterns) {
    eventCandidates.push(`格局:${p.name}(${p.type}, impact=${p.impact})`);
  }
  for (const d of chart.daxian) {
    eventCandidates.push(`大限:${d.startAge}-${d.endAge}岁→${d.palaceName}`);
  }
  for (const ln of chart.liunian) {
    const sihuaTxt = ln.sihua.map(s => `${s.star}${s.transform}`).join(',');
    eventCandidates.push(`流年:${ln.year}(${ln.age}岁)宫=${ln.palaceName}(${ln.branch})${sihuaTxt ? ' 四化:' + sihuaTxt : ''}`);
  }

  const validationFlags: PredValidationFlags = {
    passed: chart.validationFlags.passed,
    failed: chart.validationFlags.failed,
    warnings: [
      ...chart.validationFlags.warnings,
      ...chart.warnings.map(w => `${w.code}:${w.message}`),
    ],
  };

  const explanationTrace: string[] = [
    ...chart.explanationTrace.map(s => `[${s.rule}] ${s.detail}`),
    ...fateRes.trace.map(t => `[ziwei.fateVector] ${t}`),
  ];

  return {
    engineName: 'ziwei',
    engineNameCN: '紫微斗数',
    engineVersion: 'P4.4-core',
    sourceUrls: [
      'https://en.wikipedia.org/wiki/Ziwei_Doushu',
      'classical: 紫微斗数全书 (Ming dynasty)',
    ],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '北派紫微 (经典 14 主星 + 四化 + 三方四正)',
    confidence: chart.confidence,
    computationTimeMs: 0, // orchestrator should overwrite if needed
    rawInputSnapshot: {
      birthLocalDateTime: input.birthLocalDateTime,
      gender: input.gender,
      timezoneIana: input.timezoneIana,
      geoLatitude: input.geoLatitude,
      geoLongitude: input.geoLongitude,
      targetYear: input.targetYear,
      queryTimeUtc: input.queryTimeUtc,
    },
    fateVector: fateRes.vector,
    normalizedOutput: {
      // canonical scalars (string for display)
      mingGongBranch: chart.mingGongBranch,
      shenGongBranch: chart.shenGongBranch,
      mingGongStem: chart.mingGongStem,
      wuxingJu: chart.wuxingJu.name,
      yearGanZhi: chart.yearGanZhi,
      grade: chart.strengthAnalysis.grade,
      mingScore: String(chart.strengthAnalysis.mingScore),
      patternCount: String(chart.patterns.length),
      implementationStatus: chart.implementationStatus,
      // P5-FIX: structured chart payload — UI reads palaces/sihua/daxian/...
      solarDate: chart.solarDate,
      lunarDate: chart.lunarDate,
      lunarYear: chart.lunarYear,
      lunarMonth: chart.lunarMonth,
      lunarDay: chart.lunarDay,
      isLeapMonth: chart.isLeapMonth,
      yearGan: chart.yearGan,
      yearZhi: chart.yearZhi,
      monthGanZhi: chart.monthGanZhi,
      dayGanZhi: chart.dayGanZhi,
      hourBranch: chart.hourBranch,
      mingGong: chart.mingGong,
      shenGong: chart.shenGong,
      ziweiPosition: chart.ziweiPosition,
      tianfuPosition: chart.tianfuPosition,
      palaces: chart.palaces,
      sihua: chart.sihua,
      daxian: chart.daxian,
      startDaxianAge: chart.startDaxianAge,
      liunian: chart.liunian,
      patterns: chart.patterns,
      palaceAnalysis: chart.palaceAnalysis,
      strengthAnalysis: chart.strengthAnalysis,
    },
    warnings: chart.warnings.map(w => `${w.code}: ${w.message}`),
    uncertaintyNotes: chart.uncertaintyNotes,
    timingBasis: 'birth',
    explanationTrace,
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: chart.daxian.map(d => ({
      dimension: 'life' as const,
      startAge: d.startAge,
      endAge: d.endAge,
      confidence: chart.confidence,
      trend: 'stable' as const,
      evidence: `大限 ${d.palaceName}(${d.branch})`,
    })),
    aspectScores,
    eventCandidates,
  };
}
