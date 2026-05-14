/**
 * P4.8 — TaiyiChart → EngineOutput.
 */
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { TaiyiChart } from './types';
import { PALACE_META } from './constants';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

export function taiyiChartToEngineOutput(chart: TaiyiChart): EngineOutput {
  const trace: string[] = [];
  const base = chart.zhuKeJudgment === '主胜' ? 65 : chart.zhuKeJudgment === '客胜' ? 35 : 50;
  trace.push(`base = ${base} (主客=${chart.zhuKeJudgment})`);
  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };

  const fateVector: FateVector = {
    life:          dim('life',          base),
    wealth:        dim('wealth',        base),
    relation:      dim('relation',      base),
    health:        dim('health',        base),
    wisdom:        dim('wisdom',        base + 5),
    spirit:        dim('spirit',        base),
    socialStatus:  dim('socialStatus',  base),
    creativity:    dim('creativity',    base),
    luck:          dim('luck',          base),
    homeStability: dim('homeStability', base),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `dun=${chart.dunDirection}`,
      `ju=${chart.juNumber}`,
      `taiyi_palace=${chart.taiyiPalace}`,
      `wenchang_palace=${chart.wenChangPalace}`,
      `shiji_palace=${chart.shiJiPalace}`,
    ],
    failed: ['advanced_rules_partial'],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const eventCandidates = [
    `太乙积年=${chart.jiNian} (元位${chart.yuanIndex})`,
    `${chart.dunDirection === 'yang' ? '阳遁' : '阴遁'} ${chart.juNumber}局`,
    `太乙宫:${chart.taiyiPalace}(${PALACE_META[chart.taiyiPalace].trigram}/${PALACE_META[chart.taiyiPalace].direction})`,
    `文昌宫:${chart.wenChangPalace}(${PALACE_META[chart.wenChangPalace].trigram})`,
    `始击宫:${chart.shiJiPalace}(${PALACE_META[chart.shiJiPalace].trigram})`,
    `主算=${chart.zhuSuan} 客算=${chart.keSuan} → ${chart.zhuKeJudgment}`,
  ];

  return {
    engineName: 'taiyi',
    engineNameCN: '太乙神数',
    engineVersion: 'P4.8-core',
    sourceUrls: ['classical: 太乙金镜式经 / 太乙统宗大全'],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '年家太乙基础 (积年→局→太乙宫/文昌/始击/主客算简化映射)',
    confidence: chart.confidence,
    computationTimeMs: 0,
    rawInputSnapshot: {
      queryTimeUtc: chart.input.queryTimeUtc,
      timezoneIana: chart.input.timezoneIana,
      scale: chart.scale,
      epochYear: chart.input.epochYear,
      questionText: chart.input.questionText,
    },
    fateVector,
    normalizedOutput: {
      jiNian: String(chart.jiNian),
      yuanIndex: String(chart.yuanIndex),
      juNumber: String(chart.juNumber),
      dun: chart.dunDirection,
      taiyiPalace: String(chart.taiyiPalace),
      wenChangPalace: String(chart.wenChangPalace),
      shiJiPalace: String(chart.shiJiPalace),
      zhuSuan: String(chart.zhuSuan),
      keSuan: String(chart.keSuan),
      zhuKeJudgment: chart.zhuKeJudgment,
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      '太乙神数全本含 阳九/百六/三纪/五元/计神/大游/小游/君基臣基民基 等众多子项，本版仅实现核心主干。',
      '主算/客算的最终吉凶需结合「四神」「九宫数差」综合判断；本版仅给出基础数值。',
    ],
    timingBasis: 'query',
    explanationTrace: [
      ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[taiyi.fateVector] ${t}`),
    ],
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      juNumber: chart.juNumber,
      taiyiPalace: chart.taiyiPalace,
      wenChangPalace: chart.wenChangPalace,
      shiJiPalace: chart.shiJiPalace,
    },
    eventCandidates,
  };
}
