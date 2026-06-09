/**
 * P4.7 — QimenChart → EngineOutput adapter (deterministic).
 */
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { QimenChart, GateName, StarName } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

const AUSPICIOUS_GATES: GateName[] = ['开门','休门','生门'];
const INAUSPICIOUS_GATES: GateName[] = ['死门','惊门','伤门'];
const NEUTRAL_GATES: GateName[] = ['杜门','景门'];

const AUSPICIOUS_STARS: StarName[] = ['天心','天辅','天任','天禽'];
const INAUSPICIOUS_STARS: StarName[] = ['天蓬','天芮','天柱'];

function buildFateVector(chart: QimenChart): { vector: FateVector; trace: string[] } {
  const trace: string[] = [];
  const ys = chart.yongShen;
  const cell = ys.primaryPalace ? chart.palaces[ys.primaryPalace - 1] : null;

  let base = 50;
  if (cell?.gate && AUSPICIOUS_GATES.includes(cell.gate)) base += 15;
  if (cell?.gate && INAUSPICIOUS_GATES.includes(cell.gate)) base -= 15;
  if (cell?.gate && NEUTRAL_GATES.includes(cell.gate)) base += 0;
  if (cell?.star && AUSPICIOUS_STARS.includes(cell.star)) base += 8;
  if (cell?.star && INAUSPICIOUS_STARS.includes(cell.star)) base -= 8;
  if (cell?.deity === '值符' || cell?.deity === '太阴' || cell?.deity === '六合' || cell?.deity === '九天') base += 5;
  if (cell?.deity === '腾蛇' || cell?.deity === '白虎' || cell?.deity === '玄武') base -= 5;

  trace.push(`base = ${base} (用神宫=${ys.primaryPalace ?? '不现'} 门=${cell?.gate ?? '-'} 星=${cell?.star ?? '-'} 神=${cell?.deity ?? '-'})`);

  const dim = (label: string, value: number) => {
    const v = clamp(value);
    trace.push(`${label} = ${v}`);
    return v;
  };

  // Aggregate auspicious / inauspicious counts on whole board for global indices
  const auspGates = chart.palaces.filter((p) => p.gate && AUSPICIOUS_GATES.includes(p.gate as GateName)).length;
  const inauspGates = chart.palaces.filter((p) => p.gate && INAUSPICIOUS_GATES.includes(p.gate as GateName)).length;
  const globalLuck = clamp(50 + (auspGates - inauspGates) * 6);

  return {
    vector: {
      life:          dim('life',          (base + globalLuck) / 2),
      wealth:        dim('wealth',        cell?.gate === '生门' ? base + 10 : base),
      relation:      dim('relation',      cell?.gate === '休门' ? base + 10 : base),
      health:        dim('health',        cell?.star === '天心' ? base + 10 : base),
      wisdom:        dim('wisdom',        cell?.star === '天辅' ? base + 10 : base),
      spirit:        dim('spirit',        cell?.deity === '太阴' ? base + 10 : base),
      socialStatus:  dim('socialStatus',  cell?.gate === '开门' ? base + 10 : base),
      creativity:    dim('creativity',    cell?.star === '天冲' ? base + 10 : base),
      luck:          dim('luck',          globalLuck),
      homeStability: dim('homeStability', cell?.deity === '六合' ? base + 10 : base),
    },
    trace,
  };
}

export function qimenChartToEngineOutput(chart: QimenChart): EngineOutput {
  const fr = buildFateVector(chart);

  const aspectScores: Record<string, number> = {
    juNumber: chart.juNumber,
    yongShenPalace: chart.yongShen.primaryPalace ?? 0,
    auspiciousPatternCount: chart.patterns.filter((p) => p.type === '吉格').length,
    inauspiciousPatternCount: chart.patterns.filter((p) => p.type === '凶格').length,
    fuYinFanYinAdjustment: chart.fuYinFanYin.scoreAdjustment,
    auspiciousGateCount: chart.palaces.filter((p) => p.gate && AUSPICIOUS_GATES.includes(p.gate as GateName)).length,
    inauspiciousGateCount: chart.palaces.filter((p) => p.gate && INAUSPICIOUS_GATES.includes(p.gate as GateName)).length,
  };

  const eventCandidates: string[] = [
    `${chart.dunDirection === 'yang' ? '阳遁' : '阴遁'}${chart.juNumber}局(${chart.solarTerm}/${chart.threeYuan})`,
    `值符星:${chart.zhiFuStar}`,
    `值使门:${chart.zhiShiGate}`,
    `时柱:${chart.hourGanzhi} 旬首:${chart.hourXunShou}`,
    `用神:${chart.yongShen.primarySymbol}@${chart.yongShen.primaryPalace ?? '不现'}宫`,
  ];
  for (const pt of chart.patterns) {
    eventCandidates.push(`格局:${pt.name}(${pt.type})@${pt.palace}宫 — ${pt.evidence}`);
  }
  if (chart.fuYinFanYin.fuYin || chart.fuYinFanYin.fanYin) {
    eventCandidates.push(chart.fuYinFanYin.description);
  }
  for (const p of chart.palaces) {
    eventCandidates.push(`${p.palace}宫(${p.trigram}/${p.direction}): 天${p.heavenStem ?? '-'} 地${p.earthStem ?? '-'} 星${p.star ?? '-'} 门${p.gate ?? '-'} 神${p.deity ?? '-'}`);
  }

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `dun=${chart.dunDirection}`,
      `ju=${chart.juNumber}`,
      `solar_term=${chart.solarTerm}`,
      `three_yuan=${chart.threeYuan}`,
      `zhifu_star=${chart.zhiFuStar}`,
      `zhishi_gate=${chart.zhiShiGate}`,
      'heaven_stem_rotated',
      `patterns_detected=${chart.patterns.length}`,
    ],
    failed: chart.yongShen.primaryPalace ? [] : ['yong_shen_not_present'],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const explanationTrace: string[] = [
    ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...fr.trace.map((t) => `[qimen.fateVector] ${t}`),
  ];

  return {
    engineName: 'qimen',
    engineNameCN: '奇门遁甲',
    engineVersion: 'P4.7-core',
    sourceUrls: ['classical: 烟波钓叟歌 / 奇门遁甲秘籍大全'],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '时家奇门 / 转盘式 (基础排盘)',
    confidence: chart.confidence,
    computationTimeMs: 0,
    rawInputSnapshot: {
      queryTimeUtc: chart.input.queryTimeUtc,
      timezoneIana: chart.input.timezoneIana,
      geoLatitude: chart.input.geoLatitude,
      geoLongitude: chart.input.geoLongitude,
      yongShenCategory: chart.input.yongShenCategory,
      questionText: chart.input.questionText,
    },
    fateVector: fr.vector,
    normalizedOutput: {
      dun: chart.dunDirection,
      ju: String(chart.juNumber),
      solarTerm: chart.solarTerm,
      threeYuan: chart.threeYuan,
      fuTouDay: chart.fuTouDay,
      hourGanzhi: chart.hourGanzhi,
      hourXunShou: chart.hourXunShou,
      zhiFuStar: chart.zhiFuStar,
      zhiShiGate: chart.zhiShiGate,
      yongShenSymbol: chart.yongShen.primarySymbol,
      yongShenPalace: String(chart.yongShen.primaryPalace ?? ''),
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      '时家奇门转盘式：地盘三奇六仪 + 天盘干转换 + 转盘九星/八门 + 八神 + 用神宫 + 十干克应/三诈五假/击刑入墓格局 + 伏吟反吟；',
      '未覆盖：飞盘法、拐干、全部九遁及更多门派变体格局。',
    ],
    timingBasis: 'query',
    explanationTrace,
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores,
    eventCandidates,
  };
}
