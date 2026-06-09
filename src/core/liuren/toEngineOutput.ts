/**
 * P4.8 — LiurenChart → EngineOutput.
 */
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { LiurenChart } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

const AUSPICIOUS_DEITIES = new Set(['贵人','青龙','六合','太常','太阴']);
const INAUSPICIOUS_DEITIES = new Set(['腾蛇','白虎','玄武','勾陈','天空']);

export function liurenChartToEngineOutput(chart: LiurenChart): EngineOutput {
  const tt = chart.threeTransmissions;
  const chuCell = chart.plates.find((p) => p.earthBranch === tt.chu);

  const trace: string[] = [];
  let base = 50;
  if (tt.method === '贼克') base += 10;
  if (tt.method === 'fallback') base -= 10;
  if (chuCell?.deity && AUSPICIOUS_DEITIES.has(chuCell.deity)) base += 8;
  if (chuCell?.deity && INAUSPICIOUS_DEITIES.has(chuCell.deity)) base -= 8;
  trace.push(`base = ${base} (method=${tt.method}, 初传神=${chuCell?.deity ?? '-'})`);

  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };
  const fateVector: FateVector = {
    life:          dim('life',          base),
    wealth:        dim('wealth',        chuCell?.deity === '青龙' ? base + 10 : base),
    relation:      dim('relation',      chuCell?.deity === '六合' ? base + 10 : base),
    health:        dim('health',        chuCell?.deity === '白虎' ? base - 10 : base),
    wisdom:        dim('wisdom',        chuCell?.deity === '太常' ? base + 8 : base),
    spirit:        dim('spirit',        chuCell?.deity === '太阴' ? base + 8 : base),
    socialStatus:  dim('socialStatus',  chuCell?.deity === '贵人' ? base + 10 : base),
    creativity:    dim('creativity',    chuCell?.deity === '朱雀' ? base + 8 : base),
    luck:          dim('luck',          base),
    homeStability: dim('homeStability', chuCell?.deity === '天后' ? base + 8 : base),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `month_general=${chart.monthGeneral}`,
      `hour_branch=${chart.hourBranch}`,
      `noble_person=${chart.noblePerson}`,
      `three_trans_method=${tt.method}`,
      `ke_ti=${chart.keTi}`,
    ],
    failed: tt.method === 'fallback' ? ['three_trans_fallback_used'] : [],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const eventCandidates = [
    `月将:${chart.monthGeneral}(${chart.monthGeneralBranch}) 占时:${chart.hourBranch}`,
    `贵人:${chart.noblePerson} (${chart.isNight ? '夜' : '昼'}贵)`,
    `四课: 1=${chart.fourClasses.ke1.heaven}/${chart.fourClasses.ke1.earth} 2=${chart.fourClasses.ke2.heaven}/${chart.fourClasses.ke2.earth} 3=${chart.fourClasses.ke3.heaven}/${chart.fourClasses.ke3.earth} 4=${chart.fourClasses.ke4.heaven}/${chart.fourClasses.ke4.earth}`,
    `三传: ${tt.chu} → ${tt.zhong} → ${tt.mo} (${tt.method})`,
    `课体: ${chart.keTi}`,
  ];
  for (const c of chart.plates) {
    eventCandidates.push(`地${c.earthBranch}|天${c.heavenBranch}|神${c.deity ?? '-'}`);
  }

  return {
    engineName: 'liuren',
    engineNameCN: '大六壬',
    engineVersion: 'P4.8-core',
    sourceUrls: ['classical: 大六壬指南 / 大六壬探源'],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '月将加时 + 四课 + 九宗门课体识别（贼克/比用/涉害/遥克/昴星/别责/八专/伏吟/反吟）',
    confidence: chart.confidence,
    computationTimeMs: 0,
    rawInputSnapshot: {
      queryTimeUtc: chart.input.queryTimeUtc,
      timezoneIana: chart.input.timezoneIana,
      geoLatitude: chart.input.geoLatitude,
      geoLongitude: chart.input.geoLongitude,
      questionText: chart.input.questionText,
      nightDivination: chart.input.nightDivination,
    },
    fateVector,
    normalizedOutput: {
      monthGeneral: chart.monthGeneral,
      monthGeneralBranch: chart.monthGeneralBranch,
      hourBranch: chart.hourBranch,
      noblePerson: chart.noblePerson,
      isNight: String(chart.isNight),
      threeTransChu: tt.chu, threeTransZhong: tt.zhong, threeTransMo: tt.mo,
      threeTransMethod: tt.method,
      keTi: chart.keTi,
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      '已实现：月将加时、十二天将、四课、九宗门完整三传发用与课体识别。',
      '未覆盖：年命、毕法赋七百诀、空亡/遁干细化解读。',
    ],
    timingBasis: 'query',
    explanationTrace: [
      ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[liuren.fateVector] ${t}`),
    ],
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      threeTransMethodScore: tt.method === '贼克' ? 80 : tt.method === '比用' ? 70 : tt.method === '涉害' ? 65 : tt.method === '遥克' ? 55 : tt.method === 'fallback' ? 30 : 50,
      nobleAuspicious: chuCell?.deity && AUSPICIOUS_DEITIES.has(chuCell.deity) ? 1 : 0,
    },
    eventCandidates,
  };
}
