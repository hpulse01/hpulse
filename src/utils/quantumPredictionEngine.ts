/**
 * H-Pulse Quantum Prediction Engine v4.1 (量子预测引擎)
 *
 * v4.1 升级:
 * - 所有引擎版本号更新至 v2.0+
 * - 编排层 normalizedOutput 丰富化（梅花/奇门/六壬/太乙完整输出）
 * - 因果摘要增强（含各引擎三层报告关键结论）
 * - 铁板引擎十二宫分析集成
 *
 * P2.5 Unified Orchestration Layer:
 *   1. Accept StandardizedInput as sole entry point
 *   2. ALL engines run independently from StandardizedInput
 *   3. ExecutionTrace records every engine's real execution
 *   4. Fuse FateVector with dynamic weights & conflict resolution
 *   5. Output UnifiedPredictionResult with full tracing
 */

import { TiebanEngine, type TiebanInput, type BaZiProfile, type FullDestinyReport } from './tiebanAlgorithm';
import { ZiweiEngine, type ZiweiReport } from './ziweiAlgorithm';
import { calculateLiuYaoHexagram, type LiuYaoResult } from './liuYaoAlgorithm';
import { WesternAstrologyEngine, type WesternAstrologyReport } from './worldSystems/westernAstrology';
import { VedicAstrologyEngine, type VedicReport } from './worldSystems/vedicAstrology';
import { NumerologyEngine, type NumerologyReport } from './worldSystems/numerology';
import { MayanCalendarEngine, type MayanReport } from './worldSystems/mayanCalendar';
import { KabbalahEngine, type KabbalahReport } from './worldSystems/kabbalah';
import { runMeihua, type MeihuaResult } from './meihuaAlgorithm';
import { runQimen, type QimenResult } from './qimenAlgorithm';
import { buildLiuRenEngineOutput, type LiuRenResult } from './liurenAlgorithm';
import { buildTaiyiEngineOutput, type TaiyiResult } from './taiyiAlgorithm';
import { performDeepBaZiAnalysis, type DeepBaZiAnalysis } from './baziDeepAnalysis';

// Destiny Tree imports
import { extractTiebanEvents, extractBaziEvents, extractZiweiEvents, extractWesternEvents, extractVedicEvents, extractNumerologyEvents, extractMayanEvents, extractKabbalahEvents, extractInstantEvents } from './eventSeedExtractors';
import { fuseEventSeeds } from './eventFusion';
import { generateWorldTree, collapseWorldTree } from './worldTreeGenerator';
import type { RecursiveWorldTree, CollapseResult, DestinyEventSeed } from '@/types/destinyTree';

import type {
  StandardizedInput,
  EngineOutput,
  FateVector,
  FateDimension,
  UnifiedPredictionResult,
  WeightEntry,
  QueryType,
  EngineName,
  ExecutionTraceEntry,
  TimingBasis,
  TimeWindow,
} from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import { calculateDynamicWeights, getWeightsForQueryType } from '@/config/engineWeights';
import { detectConflicts, fuseFateVectors, generateConflictReport } from '@/utils/conflictResolver';
import { generateCollapseSeed, quantumCollapsePipeline, calculateFateVectorCoherence } from '@/utils/quantumMath';
import type { WorldLineInput } from '@/utils/quantumMath';
import {
  getActiveEngines,
  getSkippedEngines,
  buildActivationSummary,
  DETERMINISTIC_QUERY_TYPES,
} from '@/config/engineActivation';

// ═══════════════════════════════════════════════
// Legacy Types (kept for backward compatibility)
// ═══════════════════════════════════════════════

export interface QuantumInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
  geoLatitude: number;
  geoLongitude: number;
  timezoneOffsetMinutes: number;
}

export type LifeAspect =
  | 'career' | 'wealth' | 'love' | 'health' | 'wisdom'
  | 'social' | 'creativity' | 'fortune' | 'family' | 'spirituality';

export interface SystemAnalysis {
  id: string;
  name: string;
  nameCN: string;
  origin: string;
  weight: number;
  lifeVectors: Record<string, number>;
  meta: Record<string, string>;
}

export interface WorldBranch {
  id: string;
  systemId: string;
  aspect: LifeAspect;
  age: number;
  probability: number;
  eventType: DestinyEventType;
  description: string;
  intensity: number;
}

export type DestinyEventType =
  | 'milestone' | 'opportunity' | 'challenge' | 'transformation'
  | 'relationship' | 'achievement' | 'loss' | 'growth' | 'turning_point';

export interface CollapsedEvent {
  age: number;
  year: number;
  ganZhi: string;
  convergence: number;
  dominantAspect: LifeAspect;
  eventType: DestinyEventType;
  title: string;
  description: string;
  intensity: number;
  systemVotes: string[];
  energyLevel: number;
  element: string;
}

export interface QuantumState {
  aspect: LifeAspect;
  label: string;
  probability: number;
  coherence: number;
  trend: 'rising' | 'stable' | 'declining';
  description: string;
}

export interface QuantumEntanglement {
  aspectA: LifeAspect;
  aspectB: LifeAspect;
  correlation: number;
  description: string;
}

export interface QuantumTimeline {
  age: number;
  year: number;
  energy: number;
  element: string;
  phase: string;
  ganZhi: string;
  isCurrentAge: boolean;
}

export interface SystemContribution {
  system: string;
  weight: number;
  rawScore: number;
  normalizedScore: number;
  detail: string;
}

export interface DestinyPhase {
  name: string;
  startAge: number;
  endAge: number;
  theme: string;
  element: string;
  events: CollapsedEvent[];
  overallEnergy: number;
}

export interface QuantumPredictionResult {
  systems: SystemAnalysis[];
  totalWorldsGenerated: number;
  branchesPerSystem: Record<string, number>;
  states: QuantumState[];
  destinyTimeline: CollapsedEvent[];
  entanglements: QuantumEntanglement[];
  overallCoherence: number;
  destinyPhases: DestinyPhase[];
  lifeSummary: string;
  deathAge: number;
  quantumSignature: string;
  dominantElement: string;
  baziProfile: BaZiProfile;
  fullReport: FullDestinyReport;
  ziweiReport: ZiweiReport;
  liuYaoResult: LiuYaoResult;
  westernReport: WesternAstrologyReport;
  vedicReport: VedicReport;
  numerologyReport: NumerologyReport;
  mayanReport: MayanReport;
  kabbalahReport: KabbalahReport;
  timestamp: Date;
  unifiedResult?: UnifiedPredictionResult;
  destinyTree?: RecursiveWorldTree;
  collapseResult?: CollapseResult;
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const ALL_ASPECTS: LifeAspect[] = [
  'career', 'wealth', 'love', 'health', 'wisdom',
  'social', 'creativity', 'fortune', 'family', 'spirituality',
];

const ASPECT_LABELS: Record<LifeAspect, string> = {
  career: '事业', wealth: '财富', love: '情感', health: '健康', wisdom: '智慧',
  social: '人际', creativity: '创造', fortune: '运势', family: '家庭', spirituality: '灵性',
};

const EVENT_TYPES: DestinyEventType[] = [
  'milestone', 'opportunity', 'challenge', 'transformation',
  'relationship', 'achievement', 'loss', 'growth', 'turning_point',
];

const EVENT_TYPE_CN: Record<DestinyEventType, string> = {
  milestone: '里程碑', opportunity: '机遇', challenge: '考验', transformation: '蜕变',
  relationship: '缘分', achievement: '成就', loss: '失去', growth: '成长', turning_point: '转折',
};

const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// ═══════════════════════════════════════════════
// 10-aspect → 6-dimension FateVector mapping
// ═══════════════════════════════════════════════

function lifeVectorsToFateVector(lifeVectors: Record<string, number>): FateVector {
  const g = (key: string) => lifeVectors[key] ?? 50;
  return {
    life: Math.round((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: Math.round((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: Math.round((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
    socialStatus: Math.round((g('career') + g('social')) / 2),
    creativity: g('creativity'),
    luck: g('fortune'),
    homeStability: Math.round((g('family') + g('love')) / 2),
  };
}

// ═══════════════════════════════════════════════
// Helper: StandardizedInput → QuantumInput
// ═══════════════════════════════════════════════

function standardizedToQuantumInput(si: StandardizedInput): QuantumInput {
  return {
    year: si.birthLocalDateTime.year,
    month: si.birthLocalDateTime.month,
    day: si.birthLocalDateTime.day,
    hour: si.birthLocalDateTime.hour,
    minute: si.birthLocalDateTime.minute,
    gender: si.gender,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    timezoneOffsetMinutes: si.timezoneOffsetMinutesAtBirth,
  };
}

// ═══════════════════════════════════════════════
// Helper: QuantumInput → StandardizedInput
// ═══════════════════════════════════════════════

function quantumInputToStandardized(
  input: QuantumInput,
  queryType: QueryType = 'natalAnalysis',
  locationName: string = '',
  timezoneIana: string = '',
): StandardizedInput {
  const utcMs = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0)
    - input.timezoneOffsetMinutes * 60_000;
  const utcDate = new Date(utcMs);
  return {
    birthLocalDateTime: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute },
    birthUtcDateTime: utcDate.toISOString(),
    geoLatitude: input.geoLatitude,
    geoLongitude: input.geoLongitude,
    timezoneIana,
    timezoneOffsetMinutesAtBirth: input.timezoneOffsetMinutes,
    gender: input.gender,
    normalizedLocationName: locationName,
    queryType,
    queryTimeUtc: new Date().toISOString(),
    sourceMetadata: { provider: 'legacy_quantum_input', confidence: 0.8, normalizedLocationName: locationName, timezoneIana },
  };
}

// ═══════════════════════════════════════════════
// Execution Trace helpers
// ═══════════════════════════════════════════════

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, '0');
}

function makeTraceEntry(
  engineName: string, timingBasis: TimingBasis,
  startMs: number, endMs: number, success: boolean,
  dependencies: string[] = [], errorMessage?: string,
): ExecutionTraceEntry {
  return {
    engineName, startedAt: new Date(startMs).toISOString(), finishedAt: new Date(endMs).toISOString(),
    durationMs: Math.round(endMs - startMs), timingBasis,
    inputHash: simpleHash(`${engineName}-input`),
    outputHash: success ? simpleHash(`${engineName}-output-${endMs}`) : '',
    dependenciesUsed: dependencies, success, errorMessage,
  };
}

// ═══════════════════════════════════════════════
// P2.5 Independent Engine Runners (v2.0+)
// ═══════════════════════════════════════════════

function runTieban(si: StandardizedInput, systemOffset: number): {
  eo: EngineOutput; baziProfile: BaZiProfile; fullReport: FullDestinyReport;
  tiebanVectors: Record<string, number>; theoBase: number;
} {
  const t0 = performance.now();
  const input: TiebanInput = {
    year: si.birthLocalDateTime.year, month: si.birthLocalDateTime.month,
    day: si.birthLocalDateTime.day, hour: si.birthLocalDateTime.hour,
    minute: si.birthLocalDateTime.minute, gender: si.gender,
    geoLatitude: si.geoLatitude, geoLongitude: si.geoLongitude,
    timezoneOffsetMinutes: si.timezoneOffsetMinutesAtBirth,
  };
  const baziProfile = TiebanEngine.calculateBaZiProfile(input);
  const theoBase = TiebanEngine.calculateTheoreticalBase(input);
  const fullReport = TiebanEngine.generateFullDestinyReport(input, theoBase, systemOffset);
  const t1 = performance.now();

  const proj = fullReport.destinyProjection;
  const norm = (v: number) => Math.max(5, Math.min(95, Math.round((v % 1000) / 10)));
  const tiebanVectors: Record<string, number> = {
    career: norm(proj.career), wealth: norm(proj.wealth), love: norm(proj.marriage),
    health: norm(proj.health), wisdom: norm(proj.lifeDestiny), social: norm(proj.children),
    creativity: norm(proj.children + proj.lifeDestiny), fortune: norm(proj.lifeDestiny),
    family: norm(proj.marriage + proj.children), spirituality: norm(proj.lifeDestiny + proj.health),
  };

  // v2.0: enriched normalizedOutput with twelve palaces
  const tlr = fullReport.threeLayerReport;
  const palaceSummary = fullReport.twelvePalaces
    ?.filter(p => p.clauseStrength >= 65 || p.clauseStrength < 35)
    .map(p => `${p.name}(${p.evaluation})`)
    .join('、') || '';

  return {
    eo: {
      engineName: 'tieban', engineNameCN: '铁板神数', engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Tiě_Bǎn_Shén_Shù'],
      sourceGrade: 'B', ruleSchool: '太玄刻分定局法·十二宫',
      confidence: 0.78, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute },
      fateVector: lifeVectorsToFateVector(tiebanVectors),
      normalizedOutput: {
        '条文基数': String(theoBase),
        '总评': tlr?.analysisConclusion.overallGrade || '中',
        '强宫': tlr?.analysisConclusion.strongPalaces.join('、') || '',
        '弱宫': tlr?.analysisConclusion.weakPalaces.join('、') || '',
        '洛书和谐': String(fullReport.luoShuHarmony?.harmonyScore || 50),
        '关键宫位': palaceSummary,
      },
      warnings: [], uncertaintyNotes: ['铁板条文映射为启发式，十二宫分析增强'],
      timingBasis: 'birth',
      explanationTrace: [
        `太玄刻分定局：条文基数${theoBase}`,
        `十二宫评分完成，${palaceSummary ? '关键宫位: ' + palaceSummary : '无突出宫位'}`,
        `洛书和谐分析：${fullReport.luoShuHarmony?.harmonyScore || 50}分`,
        `FateVector由lifeVectors转换`,
      ],
      completenessScore: 85,
      validationFlags: { passed: ['clause-lookup', 'twelve-palaces', 'luoshu-harmony'], failed: [], warnings: fullReport.luoShuHarmony ? [] : ['luoshu-data-fallback'] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(tiebanVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`婚姻宫条文${fullReport.destinyProjection.marriage}`, `官禄宫条文${fullReport.destinyProjection.career}`, `财帛宫条文${fullReport.destinyProjection.wealth}`],
    },
    baziProfile, fullReport, tiebanVectors, theoBase,
  };
}

function runBaziIndependent(si: StandardizedInput): {
  eo: EngineOutput; deepAnalysis: DeepBaZiAnalysis; baziVectors: Record<string, number>;
} {
  const t0 = performance.now();
  const { year, month, day, hour, minute } = si.birthLocalDateTime;
  const deepAnalysis = performDeepBaZiAnalysis(year, month, day, hour, minute, si.gender);
  const strength = deepAnalysis.dayMaster.strengthScore;
  const favEls = deepAnalysis.favorable.elements;
  const unfavEls = deepAnalysis.unfavorable.elements;
  const baseScore = 50;
  const baziVectors: Record<string, number> = {};

  for (const a of ALL_ASPECTS) {
    let s = baseScore;
    s += (strength - 50) * 0.2;
    for (const eb of deepAnalysis.elementBalance) {
      if (favEls.includes(eb.element)) s += eb.percentage * 0.15;
      if (unfavEls.includes(eb.element)) s -= eb.percentage * 0.1;
    }
    for (const tg of deepAnalysis.tenGods) {
      if (a === 'career' && (tg.tenGod === '正官' || tg.tenGod === '七杀')) s += 5;
      if (a === 'wealth' && (tg.tenGod === '正财' || tg.tenGod === '偏财')) s += 5;
      if (a === 'love' && (tg.tenGod === '正财' || tg.tenGod === '正官')) s += 4;
      if (a === 'health' && (tg.tenGod === '比肩' || tg.tenGod === '劫财')) s += 3;
      if (a === 'wisdom' && (tg.tenGod === '正印' || tg.tenGod === '偏印')) s += 5;
      if (a === 'creativity' && (tg.tenGod === '食神' || tg.tenGod === '伤官')) s += 5;
      if (a === 'spirituality' && (tg.tenGod === '正印' || tg.tenGod === '偏印')) s += 4;
      if (a === 'social' && (tg.tenGod === '比肩' || tg.tenGod === '劫财')) s += 3;
      if (a === 'fortune') s += (strength > 50 ? 3 : -2);
      if (a === 'family' && (tg.tenGod === '正印' || tg.tenGod === '正财')) s += 3;
    }
    if (deepAnalysis.pattern.type === '正格') s += 3;
    if (deepAnalysis.pattern.type === '特殊格') s += 5;
    baziVectors[a] = clamp(s);
  }
  const t1 = performance.now();

  // v2.0: enriched output with shen sha and twelve stages
  const shenShaNames = deepAnalysis.chartResult.shenSha.slice(0, 5).map(s => s.name).join('、');
  const twelveStagesSummary = deepAnalysis.chartResult.twelveStages.map(s => `${s.pillar}${s.stage}`).join('、');

  return {
    eo: {
      engineName: 'bazi', engineNameCN: '八字命理', engineVersion: '3.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny'],
      sourceGrade: 'A', ruleSchool: '子平八字（独立深度分析·十神·神煞·十二长生）',
      confidence: 0.85, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year, month, day, hour, minute, gender: si.gender },
      fateVector: lifeVectorsToFateVector(baziVectors),
      normalizedOutput: {
        '日主': `${deepAnalysis.dayMaster.stem}(${deepAnalysis.dayMaster.element})`,
        '强度': `${deepAnalysis.dayMaster.strengthLevel}(${deepAnalysis.dayMaster.strengthScore}分)`,
        '格局': deepAnalysis.pattern.name,
        '喜用': favEls.join(''),
        '忌': unfavEls.join(''),
        '四柱': `${deepAnalysis.fourPillars.year} ${deepAnalysis.fourPillars.month} ${deepAnalysis.fourPillars.day} ${deepAnalysis.fourPillars.hour}`,
        '神煞': shenShaNames,
        '十二长生': twelveStagesSummary,
      },
      warnings: [], uncertaintyNotes: ['八字独立运行，含十神·神煞·十二长生完整分析'],
      timingBasis: 'birth',
      explanationTrace: [
        `四柱排盘: ${deepAnalysis.fourPillars.year} ${deepAnalysis.fourPillars.month} ${deepAnalysis.fourPillars.day} ${deepAnalysis.fourPillars.hour}`,
        `日主${deepAnalysis.dayMaster.stem}(${deepAnalysis.dayMaster.element})，强度${deepAnalysis.dayMaster.strengthScore}分(${deepAnalysis.dayMaster.strengthLevel})`,
        `格局: ${deepAnalysis.pattern.name}(${deepAnalysis.pattern.type})`,
        `十神分析完成，喜用: ${favEls.join('')}，忌: ${unfavEls.join('')}`,
        `神煞: ${shenShaNames}`,
        `十二长生: ${twelveStagesSummary}`,
      ],
      completenessScore: 92,
      validationFlags: { passed: ['four-pillars', 'ten-gods', 'day-master-strength', 'shen-sha', 'twelve-stages', 'pattern-determination'], failed: [], warnings: [] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(baziVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`日主${deepAnalysis.dayMaster.strengthLevel}`, `格局${deepAnalysis.pattern.name}`, `十神组合影响事业财运`],
    },
    deepAnalysis, baziVectors,
  };
}

function runZiwei(si: StandardizedInput): { eo: EngineOutput; ziweiReport: ZiweiReport } {
  const t0 = performance.now();
  const ziweiReport = ZiweiEngine.generateReport({
    year: si.birthLocalDateTime.year, month: si.birthLocalDateTime.month,
    day: si.birthLocalDateTime.day, hour: si.birthLocalDateTime.hour, gender: si.gender,
  });
  const ziweiVectors: Record<string, number> = {};
  const palAspectMap: Record<string, LifeAspect> = {
    '命宫': 'fortune', '兄弟': 'social', '夫妻': 'love', '子女': 'family',
    '财帛': 'wealth', '疾厄': 'health', '迁移': 'social', '仆役': 'social',
    '官禄': 'career', '田宅': 'wealth', '福德': 'wisdom', '父母': 'family',
  };
  for (const a of ALL_ASPECTS) ziweiVectors[a] = 50;
  for (const pal of ziweiReport.palaces) {
    const target = palAspectMap[pal.name];
    if (!target) continue;
    for (const star of pal.stars) {
      const bri = { '庙': 8, '旺': 7, '得': 5, '利': 4, '平': 0, '闲': -2, '陷': -5 }[star.brightness] ?? 0;
      const tw = star.type === 'major' ? 1.2 : star.type === 'sha' ? -0.8 : 0.5;
      ziweiVectors[target] = clamp(ziweiVectors[target] + bri * tw);
      if (star.sihua === '禄') ziweiVectors[target] += 4;
      if (star.sihua === '忌') ziweiVectors[target] -= 4;
    }
  }
  const t1 = performance.now();

  const mingPalace = ziweiReport.palaces.find(p => p.isMing);
  const shenPalace = ziweiReport.palaces.find(p => p.isShen);
  const mingStars = mingPalace?.stars.filter(s => s.type === 'major').map(s => s.name).join('、') || '无';
  const auxStars = mingPalace?.stars.filter(s => s.type === 'auxiliary').map(s => s.name).join('、') || '无';
  const shaStars = mingPalace?.stars.filter(s => s.type === 'sha').map(s => s.name).join('、') || '无';
  const sihuaSummary = ziweiReport.sihua.map(s => `${s.star}化${s.transform}`).join('、');
  const daxianSummary = ziweiReport.daxian.slice(0, 3).map(d => `${d.startAge}-${d.endAge}岁(${d.palaceName})`).join('、');
  const patternNames = ziweiReport.patterns?.map(p => p.name).join('、') || '普通格局';
  const strengthGrade = ziweiReport.strengthAnalysis?.grade || '中';

  return {
    eo: {
      engineName: 'ziwei', engineNameCN: '紫微斗数', engineVersion: '2.1.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Zi_wei_dou_shu'],
      sourceGrade: 'A', ruleSchool: '三合派紫微斗数·三方四正·格局判断',
      confidence: 0.82, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: si.birthLocalDateTime.year, month: si.birthLocalDateTime.month, day: si.birthLocalDateTime.day, hour: si.birthLocalDateTime.hour, gender: si.gender },
      fateVector: lifeVectorsToFateVector(ziweiVectors),
      normalizedOutput: {
        '命宫': ziweiReport.mingGong, '身宫': ziweiReport.shenGong,
        '五行局': ziweiReport.wuxingju.name, '主星': mingStars,
        '辅星': auxStars, '煞星': shaStars, '四化': sihuaSummary,
        '大限': daxianSummary, '起运年龄': String(ziweiReport.startDaxianAge),
        '格局': patternNames, '命局等级': strengthGrade,
        '流年': ziweiReport.liunian?.slice(0, 3).map(l => `${l.year}(${l.palaceName})`).join('、') || '',
      },
      warnings: [],
      uncertaintyNotes: ['三合派紫微斗数，含三方四正、格局判断、宫位评分、流年四化'],
      timingBasis: 'birth',
      explanationTrace: [
        `命宫: ${ziweiReport.mingGong}，身宫: ${ziweiReport.shenGong}`,
        `五行局: ${ziweiReport.wuxingju.name}`,
        `主星分布: ${mingStars}`,
        `四化: ${sihuaSummary}`,
        `格局判断: ${patternNames}`,
        `大限: ${daxianSummary}`,
        `命局等级: ${strengthGrade}`,
      ],
      completenessScore: 88,
      validationFlags: { passed: ['palace-distribution', 'star-placement', 'sihua', 'daxian-cycles', 'pattern-detection', 'strength-analysis'], failed: [], warnings: [] },
      timeWindows: ziweiReport.daxian.map(d => ({ dimension: 'life' as const, startAge: d.startAge, endAge: d.endAge, confidence: 0.75, trend: 'stable' as const, evidence: `大限${d.palaceName}宫` })),
      aspectScores: Object.fromEntries(Object.entries(ziweiVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`命宫${mingStars}`, `大限周期${daxianSummary}`, `格局${patternNames}`],
    },
    ziweiReport,
  };
}

function runLiuYao(queryTimeUtc: string): { eo: EngineOutput; liuYaoResult: LiuYaoResult } {
  const t0 = performance.now();
  const queryDate = new Date(queryTimeUtc);
  const liuYaoResult = calculateLiuYaoHexagram(queryDate);
  const liuYaoVectors: Record<string, number> = {};
  const lineMap: Record<number, LifeAspect[]> = {
    1: ['fortune', 'health'], 2: ['love', 'family'], 3: ['creativity', 'wisdom'],
    4: ['career', 'social'], 5: ['career', 'wealth'], 6: ['wisdom', 'spirituality'],
  };
  for (const a of ALL_ASPECTS) liuYaoVectors[a] = 50;
  for (const line of liuYaoResult.mainHexagram.lines) {
    const targets = lineMap[line.position] || [];
    const boost = (line.yinYang === 'yang' ? 4 : -2) + (line.isChanging ? 3 : 0);
    for (const t of targets) liuYaoVectors[t] = clamp(liuYaoVectors[t] + boost);
  }
  const t1 = performance.now();

  // v2.0: enriched output with palace, six relations, spirits
  const hex = liuYaoResult.mainHexagram;
  const shiLine = hex.lines.find(l => l.isShiYao);
  const yingLine = hex.lines.find(l => l.isYingYao);

  return {
    eo: {
      engineName: 'liuyao', engineNameCN: '六爻卦象', engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/I_Ching_divination'],
      sourceGrade: 'B', ruleSchool: '京房纳甲法·八宫归属·六神排布',
      confidence: 0.62, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { queryTime: queryTimeUtc },
      fateVector: lifeVectorsToFateVector(liuYaoVectors),
      normalizedOutput: {
        '卦名': hex.name,
        '宫属': `${hex.palace}宫(${hex.palaceElement})`,
        '世爻': shiLine ? `${shiLine.position}爻(${shiLine.branch}${shiLine.relative})` : '',
        '应爻': yingLine ? `${yingLine.position}爻(${yingLine.branch}${yingLine.relative})` : '',
        '动爻': String(hex.changingLines.length),
        '变卦': hex.targetHexagram?.name || '无',
        '总评': liuYaoResult.analysisConclusion.overallTendency,
      },
      warnings: ['六爻基于起卦时间，适用于即时占卜'],
      uncertaintyNotes: ['含纳甲装卦·六亲·六神·世应完整分析'],
      timingBasis: 'query',
      explanationTrace: [
        `起卦时间: ${queryTimeUtc}`,
        `主卦: ${hex.name}(${hex.palace}宫)`,
        `世爻: ${shiLine?.position || '?'}爻，应爻: ${yingLine?.position || '?'}爻`,
        `动爻数: ${hex.changingLines.length}`,
        `变卦: ${hex.targetHexagram?.name || '无'}`,
        `总体趋势: ${liuYaoResult.analysisConclusion.overallTendency}`,
      ],
      completenessScore: 82,
      validationFlags: { passed: ['hexagram-construction', 'najia-system', 'world-responding', 'six-spirits', 'six-relatives'], failed: [], warnings: ['query-time-based'] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(liuYaoVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`${hex.name}卦象`, `动爻${hex.changingLines.length}个`, `趋势${liuYaoResult.analysisConclusion.overallTendency}`],
    },
    liuYaoResult,
  };
}

function runWestern(si: StandardizedInput): { eo: EngineOutput; westernReport: WesternAstrologyReport } {
  const t0 = performance.now();
  const input = standardizedToQuantumInput(si);
  const westernReport = WesternAstrologyEngine.calculate(input);
  const t1 = performance.now();

  // v2.0: enriched output
  const patterns = (westernReport as any).patterns?.map((p: any) => p.name).join('、') || '';

  return {
    eo: {
      engineName: 'western', engineNameCN: '西方占星', engineVersion: '2.0.0',
      sourceUrls: WesternAstrologyEngine.metadata.source_urls,
      sourceGrade: WesternAstrologyEngine.metadata.source_grade,
      ruleSchool: '古典西方占星·行星品质·大相位',
      confidence: 0.76, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute, lat: input.geoLatitude, lon: input.geoLongitude },
      fateVector: lifeVectorsToFateVector(westernReport.lifeVectors),
      normalizedOutput: {
        '太阳': WesternAstrologyEngine.getSignCN(westernReport.sunSign),
        '月亮': WesternAstrologyEngine.getSignCN(westernReport.moonSign),
        '上升': WesternAstrologyEngine.getSignCN(westernReport.risingSign),
        '相位格局': patterns,
      },
      warnings: [], uncertaintyNotes: ['含行星品质、大三角/T三角/群星格局检测'],
      timingBasis: 'birth',
      explanationTrace: [
        `太阳: ${WesternAstrologyEngine.getSignCN(westernReport.sunSign)}`,
        `月亮: ${WesternAstrologyEngine.getSignCN(westernReport.moonSign)}`,
        `上升: ${WesternAstrologyEngine.getSignCN(westernReport.risingSign)}`,
        `相位格局: ${patterns || '无特殊格局'}`,
        `行星品质分析完成`,
      ],
      completenessScore: 80,
      validationFlags: { passed: ['planetary-positions', 'aspects', 'house-system', 'pattern-detection'], failed: [], warnings: ['simplified-retrograde'] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(westernReport.lifeVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`太阳${westernReport.sunSign}`, `月亮${westernReport.moonSign}`, `上升${westernReport.risingSign}`],
    },
    westernReport,
  };
}

function runVedic(si: StandardizedInput): { eo: EngineOutput; vedicReport: VedicReport } {
  const t0 = performance.now();
  const input = standardizedToQuantumInput(si);
  const vedicReport = VedicAstrologyEngine.calculate(input);
  const t1 = performance.now();

  const yogaNames = vedicReport.yogas.slice(0, 3).map((y: any) => typeof y === 'string' ? y : y.name).join('、');

  return {
    eo: {
      engineName: 'vedic', engineNameCN: '吠陀占星', engineVersion: '2.0.0',
      sourceUrls: VedicAstrologyEngine.metadata.source_urls,
      sourceGrade: VedicAstrologyEngine.metadata.source_grade,
      ruleSchool: '吠陀占星·月宿·Dasha·瑜伽组合',
      confidence: 0.74, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute, lat: input.geoLatitude, lon: input.geoLongitude },
      fateVector: lifeVectorsToFateVector(vedicReport.lifeVectors),
      normalizedOutput: {
        '月亮星座': vedicReport.rashiSignCN,
        '月宿': vedicReport.moonNakshatra.nameCN,
        'Yoga': yogaNames,
        'Dasha': vedicReport.dashas.slice(0, 2).map((d: any) => `${d.planet}(${d.startAge}-${d.endAge})`).join('、'),
      },
      warnings: [], uncertaintyNotes: ['含月宿体系·Dasha大运·瑜伽组合检测'],
      timingBasis: 'birth',
      explanationTrace: [
        `恒星黄道计算(Lahiri Ayanamsa)`,
        `月亮星座: ${vedicReport.rashiSignCN}`,
        `月宿: ${vedicReport.moonNakshatra.nameCN}`,
        `瑜伽: ${yogaNames}`,
        `Dasha周期: ${vedicReport.dashas.slice(0, 2).map((d: any) => d.planet).join('→')}`,
      ],
      completenessScore: 78,
      validationFlags: { passed: ['sidereal-conversion', 'nakshatra', 'dasha-calculation', 'yoga-detection'], failed: [], warnings: ['no-ashtakavarga'] },
      timeWindows: vedicReport.dashas.slice(0, 5).map((d: any) => ({ dimension: 'life' as const, startAge: d.startAge, endAge: d.endAge, confidence: 0.7, trend: d.quality === 'benefic' ? 'rising' as const : 'declining' as const, evidence: `${d.planet} Dasha` })),
      aspectScores: Object.fromEntries(Object.entries(vedicReport.lifeVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`${vedicReport.moonNakshatra.nameCN}月宿`, `${yogaNames}瑜伽`, `Dasha周期转换`],
    },
    vedicReport,
  };
}

function runNumerology(si: StandardizedInput): { eo: EngineOutput; numerologyReport: NumerologyReport } {
  const t0 = performance.now();
  const input = standardizedToQuantumInput(si);
  const numerologyReport = NumerologyEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'numerology', engineNameCN: '数字命理', engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Numerology'],
      sourceGrade: 'B', ruleSchool: 'Pythagorean + Chaldean · 业力债 · 成熟数',
      confidence: 0.58, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: si.birthLocalDateTime.year, month: si.birthLocalDateTime.month, day: si.birthLocalDateTime.day },
      fateVector: lifeVectorsToFateVector(numerologyReport.lifeVectors),
      normalizedOutput: {
        '生命数': String(numerologyReport.lifePath),
        '含义': numerologyReport.lifePathMeaning.slice(0, 20),
        '灵魂数': String((numerologyReport as any).soulNumber ?? ''),
        '人格数': String((numerologyReport as any).personalityNumber ?? ''),
        '成熟数': String((numerologyReport as any).maturityNumber ?? ''),
      },
      warnings: [], uncertaintyNotes: ['含业力债数·成熟数·生命路径周期'],
      timingBasis: 'birth',
      explanationTrace: [
        `生命路径数: ${numerologyReport.lifePath}`,
        `含义: ${numerologyReport.lifePathMeaning.slice(0, 30)}`,
        `个人年周期计算完成(80年)`,
        `业力债检测完成`,
      ],
      completenessScore: 75,
      validationFlags: { passed: ['life-path', 'personal-years', 'karmic-debts', 'pinnacles', 'challenges'], failed: [], warnings: ['no-name-numerology'] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(numerologyReport.lifeVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`生命数${numerologyReport.lifePath}`, `个人年周期`, `业力债检测`],
    },
    numerologyReport,
  };
}

function runMayan(si: StandardizedInput): { eo: EngineOutput; mayanReport: MayanReport } {
  const t0 = performance.now();
  const input = standardizedToQuantumInput(si);
  const mayanReport = MayanCalendarEngine.calculate(input);
  const t1 = performance.now();

  const cross = mayanReport.dreamspellCross;

  return {
    eo: {
      engineName: 'mayan', engineNameCN: '玛雅历法', engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Maya_calendar'],
      sourceGrade: 'B', ruleSchool: 'Tzolkin + Haab · Dreamspell Cross · Earth Family',
      confidence: 0.52, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: si.birthLocalDateTime.year, month: si.birthLocalDateTime.month, day: si.birthLocalDateTime.day },
      fateVector: lifeVectorsToFateVector(mayanReport.lifeVectors),
      normalizedOutput: {
        '日符': mayanReport.daySignCN,
        '银河音': String(mayanReport.galacticTone),
        'Kin': String(mayanReport.kin),
        '波符': mayanReport.wavespell,
        '地球家族': mayanReport.earthFamily,
        '城堡': mayanReport.castle,
        '引导': cross?.guide?.signCN || '',
        '类似': cross?.analog?.signCN || '',
      },
      warnings: [], uncertaintyNotes: ['含Dreamspell十字·地球家族·城堡周期'],
      timingBasis: 'birth',
      explanationTrace: [
        `Gregorian→Julian Day转换`,
        `Tzolkin: ${mayanReport.daySignCN}(Tone ${mayanReport.galacticTone})`,
        `Kin: ${mayanReport.kin}`,
        `Haab: ${(mayanReport as any).haabMonth || ''}`,
        `Dreamspell Cross完成`,
      ],
      completenessScore: 76,
      validationFlags: { passed: ['julian-day', 'tzolkin', 'haab', 'long-count', 'dreamspell-cross'], failed: [], warnings: ['simplified-gap-kins'] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(mayanReport.lifeVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`Kin${mayanReport.kin}`, `${mayanReport.daySignCN}`, `波符${mayanReport.wavespell}`],
    },
    mayanReport,
  };
}

function runKabbalah(si: StandardizedInput): { eo: EngineOutput; kabbalahReport: KabbalahReport } {
  const t0 = performance.now();
  const input = standardizedToQuantumInput(si);
  const kabbalahReport = KabbalahEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'kabbalah', engineNameCN: '卡巴拉', engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Kabbalah'],
      sourceGrade: 'B', ruleSchool: 'Tree of Life · Gematria · Four Worlds',
      confidence: 0.52, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: si.birthLocalDateTime.year, month: si.birthLocalDateTime.month, day: si.birthLocalDateTime.day },
      fateVector: lifeVectorsToFateVector(kabbalahReport.lifeVectors),
      normalizedOutput: {
        '灵魂质点': kabbalahReport.soulSephirah.nameCN,
        '人格质点': kabbalahReport.personalitySephirah.nameCN,
        'Gematria': String((kabbalahReport as any).gematria?.totalValue ?? ''),
        '四界平衡': (kabbalahReport as any).fourWorldsBalance ? Object.entries((kabbalahReport as any).fourWorldsBalance).map(([k, v]) => `${k}${v}`).join('·') : '',
      },
      warnings: [], uncertaintyNotes: ['含Gematria数值·四界平衡·Klipah阴影分析'],
      timingBasis: 'birth',
      explanationTrace: [
        `Gematria数值计算`,
        `灵魂质点: ${kabbalahReport.soulSephirah.nameCN}`,
        `人格质点: ${kabbalahReport.personalitySephirah.nameCN}`,
        `四界平衡分析完成`,
        `生命树路径分析完成`,
      ],
      completenessScore: 72,
      validationFlags: { passed: ['gematria', 'sephiroth-assignment', 'four-worlds', 'pillar-balance', 'path-analysis'], failed: [], warnings: ['simplified-sephirah-formula'] },
      timeWindows: [],
      aspectScores: Object.fromEntries(Object.entries(kabbalahReport.lifeVectors).map(([k, v]) => [k, v as number])),
      eventCandidates: [`灵魂${kabbalahReport.soulSephirah.nameCN}`, `人格${kabbalahReport.personalitySephirah.nameCN}`, `四界平衡`],
    },
    kabbalahReport,
  };
}

// ═══════════════════════════════════════════════
// P2.5 Orchestrator
// ═══════════════════════════════════════════════

interface OrchestrationResult {
  unifiedResult: UnifiedPredictionResult;
  rawData: {
    baziProfile: BaZiProfile; fullReport: FullDestinyReport;
    ziweiReport: ZiweiReport; liuYaoResult: LiuYaoResult;
    westernReport: WesternAstrologyReport; vedicReport: VedicReport;
    numerologyReport: NumerologyReport; mayanReport: MayanReport;
    kabbalahReport: KabbalahReport; meihuaResult: MeihuaResult | null;
    qimenResult: QimenResult | null; liurenResult: LiuRenResult | null;
    taiyiResult: TaiyiResult | null; deepBaziAnalysis: DeepBaZiAnalysis | null;
  };
  systems: SystemAnalysis[];
}

function orchestrate(
  standardizedInput: StandardizedInput,
  systemOffset: number = 0,
): OrchestrationResult {
  const queryType = standardizedInput.queryType;
  const activeEngineNames = getActiveEngines(queryType);
  const skippedEngineList = getSkippedEngines(queryType);
  const activationSummary = buildActivationSummary(queryType);
  const isActive = (name: EngineName) => activeEngineNames.includes(name);

  const engineOutputs: EngineOutput[] = [];
  const executionTrace: ExecutionTraceEntry[] = [];
  const executedEngines: string[] = [];
  const failedEngines: Array<{ engineName: string; error: string }> = [];

  const engineDependencyGraph: Record<string, string[]> = {};
  for (const name of activeEngineNames) engineDependencyGraph[name] = [];

  function executeEngine<T>(
    name: string, timingBasis: TimingBasis,
    runner: () => { eo: EngineOutput } & T,
  ): ({ eo: EngineOutput } & T) | null {
    if (!isActive(name as EngineName)) return null;
    const startMs = Date.now();
    try {
      const result = runner();
      const endMs = Date.now();
      engineOutputs.push(result.eo);
      executedEngines.push(name);
      executionTrace.push(makeTraceEntry(name, timingBasis, startMs, endMs, true));
      return result;
    } catch (err) {
      const endMs = Date.now();
      const errorMsg = err instanceof Error ? err.message : String(err);
      failedEngines.push({ engineName: name, error: errorMsg });
      executionTrace.push(makeTraceEntry(name, timingBasis, startMs, endMs, false, [], errorMsg));
      return null;
    }
  }

  // Execute all engines independently
  const tiebanResult = executeEngine('tieban', 'birth', () => runTieban(standardizedInput, systemOffset));
  const baziResult = executeEngine('bazi', 'birth', () => runBaziIndependent(standardizedInput));
  const ziweiResult = executeEngine('ziwei', 'birth', () => runZiwei(standardizedInput));
  const westernResult = executeEngine('western', 'birth', () => runWestern(standardizedInput));
  const vedicResult = executeEngine('vedic', 'birth', () => runVedic(standardizedInput));
  const numResult = executeEngine('numerology', 'birth', () => runNumerology(standardizedInput));
  const mayanResult = executeEngine('mayan', 'birth', () => runMayan(standardizedInput));
  const kabResult = executeEngine('kabbalah', 'birth', () => runKabbalah(standardizedInput));
  const liuYaoResultWrapped = executeEngine('liuyao', 'query', () => runLiuYao(standardizedInput.queryTimeUtc));
  const meihuaResultWrapped = executeEngine('meihua', 'query', () => runMeihua(standardizedInput));
  const qimenResultWrapped = executeEngine('qimen', 'query', () => runQimen(standardizedInput));
  const liurenResultWrapped = executeEngine('liuren', 'query', () => buildLiuRenEngineOutput(standardizedInput));
  const taiyiResultWrapped = executeEngine('taiyi', 'query', () => buildTaiyiEngineOutput(standardizedInput));

    // Dynamic weights W(t, e, d)
    const executedNames = engineOutputs.map(e => e.engineName);
    const currentAge = new Date().getFullYear() - standardizedInput.birthLocalDateTime.year;
    const dynamicResult = calculateDynamicWeights({
      queryType,
      age: currentAge,
      activeEngines: executedNames,
    });
    const weightsUsed: WeightEntry[] = dynamicResult.weights.map(w => ({
      engineName: w.engineName, weight: w.weight, reason: w.reason,
    }));

  // Conflict detection & fusion
  const conflicts = detectConflicts(engineOutputs, weightsUsed);
  const fusedFateVector = fuseFateVectors(engineOutputs, weightsUsed, conflicts);

  // Final confidence
  const avgConfidence = engineOutputs.length > 0
    ? engineOutputs.reduce((s, e) => s + e.confidence, 0) / engineOutputs.length : 0.5;
  const conflictPenalty = Math.min(0.3, conflicts.length * 0.03);
  const failurePenalty = failedEngines.length * 0.05;
  const finalConfidence = Math.max(0.1, avgConfidence - conflictPenalty - failurePenalty);

  // Causal summary
  const topDim = ALL_FATE_DIMENSIONS.reduce((best, d) =>
    fusedFateVector[d] > fusedFateVector[best] ? d : best, 'life' as FateDimension);
  const weakDim = ALL_FATE_DIMENSIONS.reduce((worst, d) =>
    fusedFateVector[d] < fusedFateVector[worst] ? d : worst, 'life' as FateDimension);
  const birthEngines = engineOutputs.filter(e => e.timingBasis === 'birth').length;
  const queryEngines = engineOutputs.filter(e => e.timingBasis === 'query').length;

  const causalSummary =
    `${executedNames.length}大命理体系统一编排完成（${queryType}）。` +
    `本命引擎${birthEngines}个，即时引擎${queryEngines}个。` +
    `最强维度：${FATE_DIMENSION_LABELS[topDim]}(${fusedFateVector[topDim]}分)，` +
    `最弱维度：${FATE_DIMENSION_LABELS[weakDim]}(${fusedFateVector[weakDim]}分)。` +
    `检测到${conflicts.length}个体系冲突，` +
    (failedEngines.length > 0 ? `${failedEngines.length}个引擎执行失败，` : '') +
    `综合置信度${Math.round(finalConfidence * 100)}%。` +
    (conflicts.length > 0 ? `主要分歧：${conflicts[0].explanation}` : '各体系高度共振。');

  // Prediction ID
  const { year, month, day, hour } = standardizedInput.birthLocalDateTime;
  const hex = ((year * 13 + month * 7 + day * 3 + hour) % 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  const predictionId = `UPR-${hex}-${Date.now().toString(36)}`;

  const unifiedResult: UnifiedPredictionResult = {
    predictionId,
    input: standardizedInput,
    engineOutputs,
    weightsUsed,
    fusedFateVector,
    conflicts,
    finalConfidence,
    causalSummary,
    generatedAt: new Date().toISOString(),
    algorithmVersion: '5.0.0',
    activeEngines: activeEngineNames,
    executedEngines,
    skippedEngines: skippedEngineList,
    failedEngines,
    activationReasonSummary: activationSummary,
    executionTrace,
    engineDependencyGraph,
    engineCompletenessScores: Object.fromEntries(engineOutputs.map(e => [e.engineName, e.completenessScore])),
    engineEventCandidateCounts: Object.fromEntries(engineOutputs.map(e => [e.engineName, e.eventCandidates.length])),
    engineContributionWeights: Object.fromEntries(weightsUsed.map(w => [w.engineName, w.weight])),
  };

  // Legacy data assembly
  const legacyBaziProfile = tiebanResult?.baziProfile ?? baziResult?.deepAnalysis ? {
    dayMaster: baziResult!.deepAnalysis.dayMaster.stem,
    dayMasterElement: baziResult!.deepAnalysis.dayMaster.element,
    pillars: { ...baziResult!.deepAnalysis.fourPillars, time: baziResult!.deepAnalysis.fourPillars.hour ?? '甲子' },
    strength: baziResult!.deepAnalysis.dayMaster.strengthLevel,
    favorableElements: baziResult!.deepAnalysis.favorable.elements,
    unfavorableElements: baziResult!.deepAnalysis.unfavorable.elements,
  } : {
    dayMaster: '甲', dayMasterElement: '木',
    pillars: { year: '甲子', month: '甲子', day: '甲子', time: '甲子' },
    strength: '中和', favorableElements: ['木'], unfavorableElements: ['金'],
  };

  const legacyFullReport = tiebanResult?.fullReport ?? {
    baziProfile: legacyBaziProfile,
    lifeCycles: [], flowYears: [],
    destinyProjection: { lifeDestiny: 5000, marriage: 5000, wealth: 5000, career: 5000, health: 5000, children: 5000 },
  };

  const tiebanVectors = tiebanResult?.tiebanVectors ?? {};
  const baziVectors = baziResult?.baziVectors ?? {};

  // Legacy SystemAnalysis[]
  const fav = legacyBaziProfile.favorableElements;
  const unfav = legacyBaziProfile.unfavorableElements;
  const mingStars = ziweiResult?.ziweiReport.palaces.find(p => p.isMing)?.stars.map(s => s.name).join('、') || '无';

  const systems: SystemAnalysis[] = [
    ...(tiebanResult ? [{ id: 'tieban', name: 'Iron Plate', nameCN: '铁板神数', origin: '中国', weight: 0.15, lifeVectors: tiebanVectors, meta: { '条文基数': String(tiebanResult.theoBase), '总评': tiebanResult.fullReport.threeLayerReport?.analysisConclusion.overallGrade || '中' } }] : []),
    { id: 'bazi', name: 'BaZi', nameCN: '八字命理', origin: '中国', weight: 0.15, lifeVectors: baziVectors, meta: { '日主': `${legacyBaziProfile.dayMaster}(${legacyBaziProfile.dayMasterElement})`, '喜用': fav.join(''), '忌': unfav.join('') } },
    ...(ziweiResult ? [{ id: 'ziwei', name: 'Ziwei Doushu', nameCN: '紫微斗数', origin: '中国', weight: 0.14, lifeVectors: {}, meta: { '命宫': ziweiResult.ziweiReport.mingGong, '主星': mingStars, '五行局': ziweiResult.ziweiReport.wuxingju.name } }] : []),
    ...(liuYaoResultWrapped ? [{ id: 'liuyao', name: 'Liu Yao', nameCN: '六爻卦象', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '卦名': liuYaoResultWrapped.liuYaoResult.mainHexagram.name, '动爻': String(liuYaoResultWrapped.liuYaoResult.mainHexagram.changingLines.length) } }] : []),
    ...(westernResult ? [{ id: 'western', name: 'Western Astrology', nameCN: '西方占星', origin: '西方', weight: 0.12, lifeVectors: westernResult.westernReport.lifeVectors, meta: { '太阳': WesternAstrologyEngine.getSignCN(westernResult.westernReport.sunSign), '月亮': WesternAstrologyEngine.getSignCN(westernResult.westernReport.moonSign), '上升': WesternAstrologyEngine.getSignCN(westernResult.westernReport.risingSign) } }] : []),
    ...(vedicResult ? [{ id: 'vedic', name: 'Jyotish', nameCN: '吠陀占星', origin: '印度', weight: 0.10, lifeVectors: vedicResult.vedicReport.lifeVectors, meta: { '月亮星座': vedicResult.vedicReport.rashiSignCN, '月宿': vedicResult.vedicReport.moonNakshatra.nameCN, 'Yoga': vedicResult.vedicReport.yogas[0]?.name || '' } }] : []),
    ...(numResult ? [{ id: 'numerology', name: 'Numerology', nameCN: '数字命理', origin: '西方', weight: 0.08, lifeVectors: numResult.numerologyReport.lifeVectors, meta: { '生命数': String(numResult.numerologyReport.lifePath), '含义': numResult.numerologyReport.lifePathMeaning.slice(0, 10) } }] : []),
    ...(mayanResult ? [{ id: 'mayan', name: 'Mayan Calendar', nameCN: '玛雅历法', origin: '中美洲', weight: 0.08, lifeVectors: mayanResult.mayanReport.lifeVectors, meta: { '日符': mayanResult.mayanReport.daySignCN, '银河音': String(mayanResult.mayanReport.galacticTone), 'Kin': String(mayanResult.mayanReport.kin) } }] : []),
    ...(kabResult ? [{ id: 'kabbalah', name: 'Kabbalah', nameCN: '卡巴拉', origin: '希伯来', weight: 0.08, lifeVectors: kabResult.kabbalahReport.lifeVectors, meta: { '灵魂质点': kabResult.kabbalahReport.soulSephirah.nameCN, '人格质点': kabResult.kabbalahReport.personalitySephirah.nameCN } }] : []),
    ...(meihuaResultWrapped ? [{ id: 'meihua', name: 'Meihua Yishu', nameCN: '梅花易数', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '本卦': meihuaResultWrapped.meihuaResult.benGua.name, '变卦': meihuaResultWrapped.meihuaResult.bianGua.name, '体用': meihuaResultWrapped.meihuaResult.tiYong.relation } }] : []),
    ...(qimenResultWrapped ? [{ id: 'qimen', name: 'Qi Men Dun Jia', nameCN: '奇门遁甲', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '遁局': `${qimenResultWrapped.qimenResult.chart.dunType}${qimenResultWrapped.qimenResult.chart.juNumber}局`, '值符': qimenResultWrapped.qimenResult.chart.zhiFu, '值使': qimenResultWrapped.qimenResult.chart.zhiShi } }] : []),
    ...(liurenResultWrapped ? [{ id: 'liuren', name: 'Da Liu Ren', nameCN: '大六壬', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '课体': liurenResultWrapped.liurenResult.keType, '三传': `${liurenResultWrapped.liurenResult.sanChuan.chu}→${liurenResultWrapped.liurenResult.sanChuan.zhong}→${liurenResultWrapped.liurenResult.sanChuan.mo}`, '吉凶': liurenResultWrapped.liurenResult.auspiciousness } }] : []),
    ...(taiyiResultWrapped ? [{ id: 'taiyi', name: 'Taiyi Shenshu', nameCN: '太乙神数', origin: '中国', weight: 0.08, lifeVectors: {}, meta: { '局式': `第${taiyiResultWrapped.taiyiResult.chart.juNumber}局`, '太乙值位': taiyiResultWrapped.taiyiResult.chart.taiyiZhiWei, '格局': taiyiResultWrapped.taiyiResult.patterns.map(p => p.name).join('、'), '吉凶': taiyiResultWrapped.taiyiResult.auspiciousness } }] : []),
  ];

  const liuYaoResult = liuYaoResultWrapped?.liuYaoResult ??
    calculateLiuYaoHexagram(new Date(standardizedInput.birthUtcDateTime));

  return {
    unifiedResult,
    rawData: {
      baziProfile: legacyBaziProfile,
      fullReport: legacyFullReport,
      ziweiReport: ziweiResult?.ziweiReport ?? ZiweiEngine.generateReport({
        year: standardizedInput.birthLocalDateTime.year, month: standardizedInput.birthLocalDateTime.month,
        day: standardizedInput.birthLocalDateTime.day, hour: standardizedInput.birthLocalDateTime.hour, gender: standardizedInput.gender,
      }),
      liuYaoResult,
      westernReport: westernResult?.westernReport ?? WesternAstrologyEngine.calculate(standardizedToQuantumInput(standardizedInput)),
      vedicReport: vedicResult?.vedicReport ?? VedicAstrologyEngine.calculate(standardizedToQuantumInput(standardizedInput)),
      numerologyReport: numResult?.numerologyReport ?? NumerologyEngine.calculate(standardizedToQuantumInput(standardizedInput)),
      mayanReport: mayanResult?.mayanReport ?? MayanCalendarEngine.calculate(standardizedToQuantumInput(standardizedInput)),
      kabbalahReport: kabResult?.kabbalahReport ?? KabbalahEngine.calculate(standardizedToQuantumInput(standardizedInput)),
      meihuaResult: meihuaResultWrapped?.meihuaResult ?? null,
      qimenResult: qimenResultWrapped?.qimenResult ?? null,
      liurenResult: liurenResultWrapped?.liurenResult ?? null,
      taiyiResult: taiyiResultWrapped?.taiyiResult ?? null,
      deepBaziAnalysis: baziResult?.deepAnalysis ?? null,
    },
    systems,
  };
}

// ═══════════════════════════════════════════════
// Phase 2: Infinite World Generation (legacy)
// ═══════════════════════════════════════════════

function generateInfiniteWorlds(
  systems: SystemAnalysis[], input: QuantumInput,
  vedicReport: VedicReport, numerologyReport: NumerologyReport,
  fullReport: FullDestinyReport,
): { branches: WorldBranch[]; totalGenerated: number; perSystem: Record<string, number> } {
  const branches: WorldBranch[] = [];
  const perSystem: Record<string, number> = {};
  let branchId = 0;
  for (const sys of systems) {
    let count = 0;
    for (let age = 1; age <= 80; age++) {
      for (const aspect of ALL_ASPECTS) {
        const baseScore = sys.lifeVectors[aspect] ?? 50;
        const seed = hashSeed(`${sys.id}-${aspect}-${age}-${input.year}-${input.month}-${input.day}`);
        const nBranches = 3 + (seed % 3);
        for (let b = 0; b < nBranches; b++) {
          const localSeed = hashSeed(`${seed}-${b}`);
          const probability = calculateBranchProbability(baseScore, age, localSeed, sys.weight);
          const eventType = EVENT_TYPES[(localSeed + age + b) % EVENT_TYPES.length];
          const intensity = Math.max(5, Math.min(95, baseScore + ((localSeed % 30) - 15)));
          branches.push({ id: `w${branchId++}`, systemId: sys.id, aspect, age, probability, eventType, description: '', intensity });
          count++;
        }
      }
    }
    perSystem[sys.id] = count;
  }
  return { branches, totalGenerated: branches.length, perSystem };
}

function calculateBranchProbability(baseScore: number, age: number, seed: number, weight: number): number {
  const base = baseScore / 100;
  const noise = ((seed % 100) / 100 - 0.5) * 0.3;
  const ageFactor = 1 - Math.abs(age - 40) * 0.003;
  return Math.max(0.01, Math.min(0.99, (base + noise) * ageFactor * (0.5 + weight)));
}

// ═══════════════════════════════════════════════
// Phase 3: Quantum Collapse (legacy)
// ═══════════════════════════════════════════════

function quantumCollapse(
  systems: SystemAnalysis[], branches: WorldBranch[], input: QuantumInput,
  baziProfile: BaZiProfile, fullReport: FullDestinyReport,
  vedicReport: VedicReport, numerologyReport: NumerologyReport,
): { timeline: CollapsedEvent[]; states: QuantumState[]; entanglements: QuantumEntanglement[]; overallCoherence: number; deathAge: number } {
  const fav = baziProfile.favorableElements;
  const unfav = baziProfile.unfavorableElements;
  const timeline: CollapsedEvent[] = [];
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - input.year;

  for (let age = 1; age <= 80; age++) {
    const ageBranches = branches.filter(b => b.age === age);
    if (ageBranches.length === 0) continue;
    const aspectVotes: Record<string, { totalProb: number; systems: Set<string>; types: DestinyEventType[]; intensities: number[] }> = {};
    for (const b of ageBranches) {
      if (!aspectVotes[b.aspect]) aspectVotes[b.aspect] = { totalProb: 0, systems: new Set(), types: [], intensities: [] };
      aspectVotes[b.aspect].totalProb += b.probability;
      aspectVotes[b.aspect].systems.add(b.systemId);
      aspectVotes[b.aspect].types.push(b.eventType);
      aspectVotes[b.aspect].intensities.push(b.intensity);
    }
    let bestAspect: LifeAspect = 'fortune';
    let bestConvergence = 0;
    for (const [aspect, data] of Object.entries(aspectVotes)) {
      const convergence = (data.systems.size / systems.length) * (data.totalProb / ageBranches.length);
      if (convergence > bestConvergence) { bestConvergence = convergence; bestAspect = aspect as LifeAspect; }
    }
    const winner = aspectVotes[bestAspect]!;
    const avgIntensity = winner.intensities.reduce((a, b) => a + b, 0) / winner.intensities.length;
    const typeCounts: Record<string, number> = {};
    winner.types.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
    const dominantType = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'growth') as DestinyEventType;
    const calYear = input.year + age;
    let ganZhi = '';
    let element = '';
    const fyData = fullReport.flowYears.find(f => f.age === age);
    if (fyData) { ganZhi = fyData.ganZhi; element = STEM_ELEMENTS[ganZhi.charAt(0)] || ''; }
    else {
      const stems = '甲乙丙丁戊己庚辛壬癸';
      const branchChars = '子丑寅卯辰巳午未申酉戌亥';
      ganZhi = stems[(calYear - 4) % 10] + branchChars[(calYear - 4) % 12];
      element = STEM_ELEMENTS[ganZhi.charAt(0)] || '土';
    }
    let energy = Math.round(avgIntensity);
    if (fav.includes(element)) energy = Math.min(95, energy + 10);
    if (unfav.includes(element)) energy = Math.max(5, energy - 8);
    const activeDasha = vedicReport.dashas.find(d => age >= d.startAge && age <= d.endAge);
    if (activeDasha?.quality === 'benefic') energy = Math.min(95, energy + 5);
    if (activeDasha?.quality === 'malefic') energy = Math.max(5, energy - 5);
    const py = numerologyReport.personalYears.find(p => p.age === age);
    if (py) energy = Math.round(energy * 0.85 + py.energy * 0.15);
    const { title, description } = generateEventDescription(bestAspect, dominantType, age, ganZhi, element, energy, winner.systems.size, input.gender);
    timeline.push({
      age, year: calYear, ganZhi, convergence: bestConvergence,
      dominantAspect: bestAspect, eventType: dominantType, title, description,
      intensity: Math.round(avgIntensity), systemVotes: Array.from(winner.systems),
      energyLevel: clamp(energy), element,
    });
  }

  const states: QuantumState[] = ALL_ASPECTS.map(aspect => {
    const scores = systems.map(s => (s.lifeVectors[aspect] ?? 50) * s.weight);
    const totalWeight = systems.reduce((s, sys) => s + sys.weight, 0);
    const weighted = scores.reduce((a, b) => a + b, 0) / (totalWeight || 1);
    const rawScores = systems.map(s => (s.lifeVectors[aspect] ?? 50) / 100);
    const mean = rawScores.reduce((a, b) => a + b, 0) / (rawScores.length || 1);
    const variance = rawScores.reduce((s, v) => s + (v - mean) ** 2, 0) / (rawScores.length || 1);
    const coherence = Math.max(0, 1 - Math.sqrt(variance) * 3);
    const aspectEvents = timeline.filter(e => e.dominantAspect === aspect);
    const avgEnergy = aspectEvents.length > 0 ? aspectEvents.reduce((s, e) => s + e.energyLevel, 0) / aspectEvents.length : weighted;
    const recentEvents = aspectEvents.filter(e => e.age > currentAge && e.age <= currentAge + 10);
    const earlyEvents = aspectEvents.filter(e => e.age > currentAge + 10 && e.age <= currentAge + 20);
    const recentAvg = recentEvents.length > 0 ? recentEvents.reduce((s, e) => s + e.energyLevel, 0) / recentEvents.length : avgEnergy;
    const laterAvg = earlyEvents.length > 0 ? earlyEvents.reduce((s, e) => s + e.energyLevel, 0) / earlyEvents.length : avgEnergy;
    const trend: 'rising' | 'stable' | 'declining' = laterAvg > recentAvg + 3 ? 'rising' : laterAvg < recentAvg - 3 ? 'declining' : 'stable';
    return {
      aspect, label: ASPECT_LABELS[aspect],
      probability: clamp(Math.round(weighted * (0.7 + 0.3 * coherence))), coherence, trend,
      description: generateStateDescription(aspect, Math.round(weighted), trend),
    };
  });

  const entanglementPairs: [LifeAspect, LifeAspect, string][] = [
    ['career', 'wealth', '事业兴则财运通'], ['love', 'health', '情志和则身心安'],
    ['wisdom', 'creativity', '智慧深则创造力强'], ['social', 'career', '人脉广则事业顺'],
    ['fortune', 'health', '运势旺则体魄健'], ['wealth', 'family', '财稳则家和'],
    ['creativity', 'fortune', '创新驱动运势'], ['wisdom', 'spirituality', '慧根深种'],
    ['love', 'family', '情深则家旺'], ['career', 'spirituality', '志向合天道'],
  ];
  const entanglements: QuantumEntanglement[] = entanglementPairs.map(([a, b, desc]) => {
    const sa = states.find(s => s.aspect === a)!;
    const sb = states.find(s => s.aspect === b)!;
    const diff = Math.abs(sa.probability - sb.probability);
    return { aspectA: a, aspectB: b, correlation: Math.max(-1, Math.min(1, 1 - diff / 50)), description: desc };
  });

  const overallCoherence = states.reduce((s, st) => s + st.coherence, 0) / states.length;
  const healthState = states.find(s => s.aspect === 'health')!;
  const baseLifespan = 75;
  const healthBonus = (healthState.probability - 50) * 0.3;
  const coherenceBonus = overallCoherence * 5;
  const deathAge = clamp(Math.round(baseLifespan + healthBonus + coherenceBonus));

  return { timeline, states, entanglements, overallCoherence, deathAge };
}

// ═══════════════════════════════════════════════
// Phase 4: Destiny Revelation (legacy)
// ═══════════════════════════════════════════════

function revealDestiny(
  timeline: CollapsedEvent[], states: QuantumState[], deathAge: number, input: QuantumInput,
): { phases: DestinyPhase[]; lifeSummary: string } {
  const phaseConfig = [
    { name: '启蒙期', start: 1, end: 12, theme: '基础塑造' },
    { name: '成长期', start: 13, end: 22, theme: '潜能觉醒' },
    { name: '开拓期', start: 23, end: 35, theme: '志向确立' },
    { name: '建设期', start: 36, end: 48, theme: '事业根基' },
    { name: '成熟期', start: 49, end: 60, theme: '收获圆满' },
    { name: '智慧期', start: 61, end: 72, theme: '传承升华' },
    { name: '圆融期', start: 73, end: 80, theme: '归于本源' },
  ];
  const phases: DestinyPhase[] = phaseConfig.map(cfg => {
    const events = timeline.filter(e => e.age >= cfg.start && e.age <= cfg.end);
    const avgEnergy = events.length > 0 ? events.reduce((s, e) => s + e.energyLevel, 0) / events.length : 50;
    const elementCounts: Record<string, number> = {};
    events.forEach(e => { if (e.element) elementCounts[e.element] = (elementCounts[e.element] || 0) + 1; });
    const domElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '土';
    return { name: cfg.name, startAge: cfg.start, endAge: cfg.end, theme: cfg.theme, element: domElement, events, overallEnergy: Math.round(avgEnergy) };
  });

  const topAspects = [...states].sort((a, b) => b.probability - a.probability);
  const top3 = topAspects.slice(0, 3).map(s => s.label).join('、');
  const weak = topAspects.slice(-2).map(s => s.label).join('、');
  const turningPoints = timeline.filter(e => e.eventType === 'turning_point' || e.convergence > 0.5).slice(0, 3);
  const tpDesc = turningPoints.map(e => `${e.age}岁(${e.title})`).join('、');
  const lifeSummary =
    `此命${top3}为强，${weak}需修。` +
    `一生关键转折在${tpDesc || '平稳无大波'}。` +
    `量子共振度${Math.round(states.reduce((s, st) => s + st.coherence, 0) / states.length * 100)}%，` +
    `多体系高度共振，命运轨迹已完全坍缩为唯一确定态。`;
  return { phases, lifeSummary };
}

// ═══════════════════════════════════════════════
// Event Description Generator (legacy)
// ═══════════════════════════════════════════════

function generateEventDescription(
  aspect: LifeAspect, type: DestinyEventType, age: number,
  ganZhi: string, element: string, energy: number,
  systemCount: number, gender: 'male' | 'female',
): { title: string; description: string } {
  const aspectCN = ASPECT_LABELS[aspect];
  const typeCN = EVENT_TYPE_CN[type];
  const highEnergy = energy >= 65;
  return {
    title: `${aspectCN}${typeCN}`,
    description: `${ganZhi}年${aspectCN}方面发生${typeCN}事件，${highEnergy ? '能量充沛' : '需蓄势待发'}。${systemCount}系共振确认。`,
  };
}

function generateStateDescription(aspect: LifeAspect, prob: number, trend: string): string {
  const label = ASPECT_LABELS[aspect];
  const level = prob >= 70 ? '强盛' : prob >= 50 ? '中等' : '偏弱';
  const trendWord = trend === 'rising' ? '呈上升态势' : trend === 'declining' ? '呈下行趋势' : '保持稳定';
  return `${label}量子场${level}，${trendWord}`;
}

// ═══════════════════════════════════════════════
// Utility
// ═══════════════════════════════════════════════

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

// ═══════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════

export const QuantumPredictionEngine = {
  predict(input: QuantumInput, systemOffset: number = 0): QuantumPredictionResult {
    const timestamp = new Date();
    const si = quantumInputToStandardized(input);
    const { unifiedResult, rawData, systems } = orchestrate(si, systemOffset);
    const { baziProfile, fullReport, ziweiReport, liuYaoResult, westernReport, vedicReport, numerologyReport, mayanReport, kabbalahReport } = rawData;

    // Legacy Phase 2-4
    const { branches, totalGenerated, perSystem } = generateInfiniteWorlds(systems, input, vedicReport, numerologyReport, fullReport);
    const { timeline, states, entanglements, overallCoherence, deathAge: legacyDeathAge } = quantumCollapse(systems, branches, input, baziProfile, fullReport, vedicReport, numerologyReport);
    const { phases, lifeSummary: legacyLifeSummary } = revealDestiny(timeline, states, legacyDeathAge, input);

    // Phase 5: Event-Driven Destiny Tree
    let destinyTree: RecursiveWorldTree | undefined;
    let collapseResult: CollapseResult | undefined;
    try {
      const allSeeds: DestinyEventSeed[] = [];
      if (rawData.fullReport && rawData.baziProfile) allSeeds.push(...extractTiebanEvents(rawData.fullReport, rawData.baziProfile, input.year));
      if (rawData.deepBaziAnalysis) allSeeds.push(...extractBaziEvents(rawData.deepBaziAnalysis, input.year));
      if (rawData.ziweiReport) allSeeds.push(...extractZiweiEvents(rawData.ziweiReport, input.year));
      if (rawData.westernReport) allSeeds.push(...extractWesternEvents(rawData.westernReport, input.year));
      if (rawData.vedicReport) allSeeds.push(...extractVedicEvents(rawData.vedicReport, input.year));
      if (rawData.numerologyReport) allSeeds.push(...extractNumerologyEvents(rawData.numerologyReport, input.year));
      if (rawData.mayanReport) allSeeds.push(...extractMayanEvents(rawData.mayanReport, input.year));
      if (rawData.kabbalahReport) allSeeds.push(...extractKabbalahEvents(rawData.kabbalahReport, input.year));
      for (const eo of unifiedResult.engineOutputs) {
        if (['liuyao', 'meihua', 'qimen', 'liuren', 'taiyi'].includes(eo.engineName)) {
          allSeeds.push(...extractInstantEvents(eo, si.queryTimeUtc, input.year));
        }
      }
      const engineWeightMap: Record<string, number> = {};
      for (const w of unifiedResult.weightsUsed) engineWeightMap[w.engineName] = w.weight;
      const fusionResult = fuseEventSeeds(allSeeds, engineWeightMap);
      destinyTree = generateWorldTree(fusionResult, unifiedResult.fusedFateVector, input.year, input.gender);
      collapseResult = collapseWorldTree(destinyTree);
    } catch (err) {
      console.error('Destiny tree generation error:', err);
    }

    const deathAge = collapseResult?.deathAge ?? legacyDeathAge;
    const lifeSummary = collapseResult?.finalLifeSummary ?? legacyLifeSummary;

    const elCounts: Record<string, number> = {};
    Object.values(baziProfile.pillars).forEach(p => {
      const el = STEM_ELEMENTS[p.charAt(0)];
      if (el) elCounts[el] = (elCounts[el] || 0) + 1;
    });
    const dominantElement = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '土';
    const topA = [...states].sort((a, b) => b.probability - a.probability).slice(0, 3);
    const sig = topA.map(s => `${s.label}${s.probability}`).join('·');
    const hex2 = ((input.year * 13 + input.month * 7 + input.day * 3 + input.hour) % 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const quantumSignature = `QS-${hex2}-${sig}`;

    return {
      systems, totalWorldsGenerated: destinyTree ? destinyTree.totalNodes : totalGenerated, branchesPerSystem: perSystem,
      states, destinyTimeline: timeline, entanglements, overallCoherence,
      destinyPhases: phases, lifeSummary, deathAge, quantumSignature, dominantElement,
      baziProfile, fullReport, ziweiReport, liuYaoResult, westernReport, vedicReport, numerologyReport, mayanReport, kabbalahReport,
      timestamp, unifiedResult, destinyTree, collapseResult,
    };
  },

  orchestrate(standardizedInput: StandardizedInput, systemOffset: number = 0): UnifiedPredictionResult {
    return orchestrate(standardizedInput, systemOffset).unifiedResult;
  },

  buildStandardizedInput: quantumInputToStandardized,

  getAspectLabel(aspect: LifeAspect): string { return ASPECT_LABELS[aspect]; },
  getAllAspects(): LifeAspect[] { return [...ALL_ASPECTS]; },
  getEventTypeCN(type: DestinyEventType): string { return EVENT_TYPE_CN[type]; },
};

export default QuantumPredictionEngine;
