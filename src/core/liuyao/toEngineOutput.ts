/**
 * P4.5 — LiuyaoChart → EngineOutput adapter. Deterministic.
 */

import { normalizeConfidence01 } from '@/core/shared/confidence';
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { LiuyaoChart } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function buildFateVector(chart: LiuyaoChart): { vector: FateVector; trace: string[] } {
  const trace: string[] = [];
  const ys = chart.yongShen;
  const baseConf = chart.confidence;
  const calBoost = chart.calendar ? 0 : -10;

  const strengthScore =
    ys.strength === '旺相' ? 85 :
    ys.strength === '发动' ? 70 :
    ys.strength === '休囚' ? 45 :
    ys.strength === '受克' ? 30 :
    ys.strength === '空亡' ? 20 :
    ys.strength === '不现' ? 25 : 50;
  trace.push(`strengthScore = ${strengthScore} (用神=${ys.yongShen}/${ys.strength})`);

  const dim = (label: string, value: number) => {
    const v = clamp(value);
    trace.push(`${label} = ${v}`);
    return v;
  };

  const has = (rel: string) => chart.mainHexagram.lines.some((l) => l.relative === rel);
  const hasChange = (rel: string) =>
    chart.mainHexagram.lines.some((l) => l.isChanging && l.relative === rel);

  const wealth = dim('wealth', has('妻财') ? (hasChange('妻财') ? strengthScore + 10 : strengthScore) : 35);
  const career = dim('socialStatus', has('官鬼') ? (hasChange('官鬼') ? strengthScore + 5 : strengthScore - 5) : 35);
  const relation = dim('relation', has('妻财') || has('官鬼') ? strengthScore : 40);
  const health = dim('health', has('官鬼') && hasChange('官鬼') ? strengthScore - 15 : strengthScore + 5);
  const children = dim('homeStability', has('子孙') ? strengthScore : 40);
  const wisdom = dim('wisdom', has('父母') ? strengthScore : 45);
  const spirit = dim('spirit', baseConf + (chart.clashCombine.some((c) => c.type === '合卦') ? 10 : 0));
  const creativity = dim('creativity', has('子孙') ? strengthScore : 45);
  const luck = dim('luck', baseConf + calBoost
    + (chart.clashCombine.some((c) => c.type === '冲卦') ? -10 : 0)
    + (chart.clashCombine.some((c) => c.type === '合卦') ? 8 : 0));
  const life = dim('life', (strengthScore + baseConf) / 2 + calBoost);

  return {
    vector: { life, wealth, relation, health, wisdom, spirit, socialStatus: career, creativity, luck, homeStability: children },
    trace,
  };
}

export function liuyaoChartToEngineOutput(chart: LiuyaoChart): EngineOutput {
  const fr = buildFateVector(chart);
  const main = chart.mainHexagram;

  const aspectScores: Record<string, number> = {
    yongShenStrength:
      chart.yongShen.strength === '旺相' ? 85 :
      chart.yongShen.strength === '发动' ? 70 :
      chart.yongShen.strength === '休囚' ? 45 :
      chart.yongShen.strength === '受克' ? 30 :
      chart.yongShen.strength === '空亡' ? 20 :
      chart.yongShen.strength === '不现' ? 25 : 50,
    changingLineCount: main.changingLines.length,
    clashCombineCount: chart.clashCombine.length,
    jinTuiCount: chart.jinTuiShen.length,
    fanFuYinAdjustment: chart.fanFuYin.scoreAdjustment,
    yingQiCount: chart.yingQi.length,
  };

  const eventCandidates: string[] = [];
  eventCandidates.push(`本卦:${main.name}(${main.palace}宫)`);
  if (chart.changedHexagram) eventCandidates.push(`变卦:${chart.changedHexagram.name}`);
  for (const p of main.changingLines) {
    const ln = main.lines[p - 1];
    eventCandidates.push(`动爻:第${p}爻${ln.relative}${ln.branch}→${ln.changedRelative ?? '?'}${ln.changedBranch ?? '?'}`);
  }
  for (const c of chart.clashCombine) eventCandidates.push(`${c.type}:${c.description}`);
  eventCandidates.push(`用神:${chart.yongShen.yongShen}(${chart.yongShen.strength})`);
  if (chart.fuShen) eventCandidates.push(`伏神:${chart.fuShen.branch}伏第${chart.fuShen.position}爻${chart.fuShen.flyingBranch}下(${chart.fuShen.relation})`);
  for (const jt of chart.jinTuiShen) eventCandidates.push(`${jt.type}:第${jt.position}爻${jt.from}化${jt.to}`);
  for (const n of chart.fanFuYin.notes) eventCandidates.push(`伏反吟:${n}`);
  for (const y of chart.yingQi) eventCandidates.push(`应期:${y.branch}日(${y.basis})`);

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `casting_mode=${chart.castingMode}`,
      `casting_source=${chart.castingSource}`,
      `najia_assigned`,
      `palace_determined=${main.palace}`,
      `shi_ying=${main.shiYao}/${main.yingYao}`,
    ],
    failed: chart.yongShen.hidden && !chart.fuShen ? ['yongshen_not_present_fushen_not_found'] : [],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const explanationTrace: string[] = [
    ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...fr.trace.map((t) => `[liuyao.fateVector] ${t}`),
  ];

  return {
    engineName: 'liuyao',
    engineNameCN: '六爻',
    engineVersion: 'P4.5-core',
    sourceUrls: ['classical: 京房纳甲 / 卜筮正宗 / 增删卜易'],
    sourceGrade: chart.sourceGrade,
    ruleSchool: '京房纳甲法 (梅花时间起卦 + 装卦 + 用神)',
    confidence: normalizeConfidence01(chart.confidence),
    computationTimeMs: 0,
    rawInputSnapshot: {
      mode: chart.castingMode,
      questionText: chart.input.questionText,
      yongShenCategory: chart.input.yongShenCategory,
      queryTimeUtc: chart.input.queryTimeUtc,
      timezoneIana: chart.input.timezoneIana,
      seed: chart.input.seed,
      manualLines: chart.input.manualLines,
    },
    fateVector: fr.vector,
    normalizedOutput: {
      mainHexagram: main.name,
      changedHexagram: chart.changedHexagram?.name ?? '',
      palace: main.palace,
      shiYao: String(main.shiYao),
      yingYao: String(main.yingYao),
      changingLines: main.changingLines.join(','),
      yongShen: chart.yongShen.yongShen,
      yongShenStrength: chart.yongShen.strength,
      fuShen: chart.fuShen ? `${chart.fuShen.branch}伏第${chart.fuShen.position}爻(${chart.fuShen.relation})` : '',
      jinTuiShen: chart.jinTuiShen.map((j) => `第${j.position}爻${j.from}化${j.to}${j.type}`).join('；'),
      fanFuYin: chart.fanFuYin.notes.join('；'),
      yingQi: chart.yingQi.map((y) => `${y.branch}(${y.basis})`).join('；'),
      castingSource: chart.castingSource,
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      '六爻判断需结合具体问题背景，本输出仅为算法层结构化结果，不构成行动建议。',
      ...(chart.yongShen.hidden
        ? [chart.fuShen ? `用神不现，已从本宫首卦寻得伏神 ${chart.fuShen.branch}。` : '用神不现且未寻得伏神，建议重断。']
        : []),
      ...(chart.calendar ? [] : ['未提供 queryTimeUtc + timezoneIana，月建/日辰/旬空降级。']),
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
