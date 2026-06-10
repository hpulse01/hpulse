/**
 * P4.6 — MeihuaChart → EngineOutput adapter (deterministic).
 */
import { normalizeConfidence01 } from '@/core/shared/confidence';
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { MeihuaChart } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function buildFateVector(chart: MeihuaChart): { vector: FateVector; trace: string[] } {
  const trace: string[] = [];
  const base = chart.bodyUse.trendScore;
  const conf = chart.confidence;

  // Element-driven biases (体卦视角)
  const be = chart.bodyUse.bodyElement;
  const dim = (label: string, value: number) => {
    const v = clamp(value);
    trace.push(`${label} = ${v}`);
    return v;
  };

  const elementBoost: Record<string, Partial<Record<'wealth'|'health'|'wisdom'|'spirit'|'creativity', number>>> = {
    '金': { wealth: 8, socialStatus: 5 } as never,
    '木': { creativity: 8, wisdom: 5 },
    '水': { wisdom: 8, spirit: 5 },
    '火': { spirit: 8, socialStatus: 5 } as never,
    '土': { health: 5, homeStability: 8 } as never,
  };
  const eb = elementBoost[be] ?? {};

  const trendBias = chart.bodyUse.trend === 'auspicious' ? 5 : chart.bodyUse.trend === 'inauspicious' ? -10 : -2;

  return {
    vector: {
      life:          dim('life',          (base + conf) / 2 + trendBias),
      wealth:        dim('wealth',        base + ((eb as { wealth?: number }).wealth ?? 0) + trendBias),
      relation:      dim('relation',      base + trendBias),
      health:        dim('health',        base + ((eb as { health?: number }).health ?? 0) + trendBias),
      wisdom:        dim('wisdom',        base + ((eb as { wisdom?: number }).wisdom ?? 0)),
      spirit:        dim('spirit',        base + ((eb as { spirit?: number }).spirit ?? 0)),
      socialStatus:  dim('socialStatus',  base + trendBias),
      creativity:    dim('creativity',    base + ((eb as { creativity?: number }).creativity ?? 0)),
      luck:          dim('luck',          base + trendBias * 2),
      homeStability: dim('homeStability', base + trendBias),
    },
    trace,
  };
}

export function meihuaChartToEngineOutput(chart: MeihuaChart): EngineOutput {
  const fr = buildFateVector(chart);

  const aspectScores: Record<string, number> = {
    bodyUseTrendScore: chart.bodyUse.trendScore,
    confidence: normalizeConfidence01(chart.confidence),
    movingLine: chart.movingLine,
  };

  const eventCandidates: string[] = [
    `本卦:${chart.benGua.name}`,
    `互卦:${chart.huGua.name}`,
    `变卦:${chart.bianGua.name}`,
    `动爻:第${chart.movingLine}爻`,
    `体用:${chart.bodyUse.relation}(${chart.bodyUse.trend})`,
    `体卦:${chart.bodyUse.bodyTrigram.name}(${chart.bodyUse.bodyElement})`,
    `用卦:${chart.bodyUse.useTrigram.name}(${chart.bodyUse.useElement})`,
  ];

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `casting_mode=${chart.castingMode}`,
      `casting_source=${chart.castingSource}`,
      `body_use_relation=${chart.bodyUse.relation}`,
    ],
    failed: [],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const explanationTrace: string[] = [
    ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...fr.trace.map((t) => `[meihua.fateVector] ${t}`),
  ];

  return {
    engineName: 'meihua',
    engineNameCN: '梅花易数',
    engineVersion: 'P4.6-core',
    sourceUrls: ['classical: 邵雍《梅花易数》'],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '邵雍先天数 + 体用生克',
    confidence: normalizeConfidence01(chart.confidence),
    computationTimeMs: 0,
    rawInputSnapshot: {
      mode: chart.castingMode,
      questionText: chart.input.questionText,
      queryTimeUtc: chart.input.queryTimeUtc,
      timezoneIana: chart.input.timezoneIana,
      upperNumber: chart.input.upperNumber,
      lowerNumber: chart.input.lowerNumber,
      manualUpper: chart.input.manualUpper,
      manualLower: chart.input.manualLower,
      manualMovingLine: chart.input.manualMovingLine,
    },
    fateVector: fr.vector,
    normalizedOutput: {
      benGua: chart.benGua.name,
      huGua: chart.huGua.name,
      bianGua: chart.bianGua.name,
      upperTrigram: chart.upperTrigram.name,
      lowerTrigram: chart.lowerTrigram.name,
      movingLine: String(chart.movingLine),
      bodyTrigram: chart.bodyUse.bodyTrigram.name,
      useTrigram: chart.bodyUse.useTrigram.name,
      bodyUseRelation: chart.bodyUse.relation,
      trend: chart.bodyUse.trend,
      castingSource: chart.castingSource,
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      '梅花易数以体用生克为骨干，结果仅供参考，不构成行动建议。',
      ...(chart.castingMode === 'time' ? ['时间起卦中年支序数为公历近似，建议接入农历核心以提升精度。'] : []),
    ],
    timingBasis: chart.castingMode === 'time' ? 'query' : 'hybrid',
    explanationTrace,
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores,
    eventCandidates,
  };
}
