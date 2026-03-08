/**
 * H-Pulse Quantum Prediction Engine v3.1 (量子预测引擎)
 *
 * P1.1 Unified Orchestration Layer:
 *   1. Accept StandardizedInput as sole entry point
 *   2. Use engine activation strategy to decide which engines run
 *   3. Execute only active engines, collect EngineOutput[]
 *   4. Calculate dynamic weights (filtered to active engines)
 *   5. Fuse FateVector
 *   6. Detect & resolve conflicts
 *   7. Output UnifiedPredictionResult with activeEngines/skippedEngines
 *
 * Deterministic guarantee: for deterministic queryTypes (natalAnalysis, annualForecast),
 * same StandardizedInput always produces same UnifiedPredictionResult.
 *
 * Legacy backward compatibility: `predict()` still returns old QuantumPredictionResult.
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

import type {
  StandardizedInput,
  EngineOutput,
  FateVector,
  FateDimension,
  UnifiedPredictionResult,
  WeightEntry,
  QueryType,
  EngineName,
} from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import { getWeightsForQueryType } from '@/config/engineWeights';
import { detectConflicts, fuseFateVectors } from '@/utils/conflictResolver';
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
  };
}

// ═══════════════════════════════════════════════
// Helper: StandardizedInput → QuantumInput (for legacy engine APIs)
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
// Helper: QuantumInput → StandardizedInput (for legacy predict() path)
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
    birthLocalDateTime: {
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
    },
    birthUtcDateTime: utcDate.toISOString(),
    geoLatitude: input.geoLatitude,
    geoLongitude: input.geoLongitude,
    timezoneIana,
    timezoneOffsetMinutesAtBirth: input.timezoneOffsetMinutes,
    gender: input.gender,
    normalizedLocationName: locationName,
    queryType,
    queryTimeUtc: new Date().toISOString(),
    sourceMetadata: {
      provider: 'legacy_quantum_input',
      confidence: 0.8,
      normalizedLocationName: locationName,
      timezoneIana,
    },
  };
}

// ═══════════════════════════════════════════════
// P1.1 Engine Runners (individual, called only if active)
// ═══════════════════════════════════════════════

function runTieban(input: QuantumInput, systemOffset: number): {
  eo: EngineOutput;
  baziProfile: BaZiProfile;
  fullReport: FullDestinyReport;
  tiebanVectors: Record<string, number>;
  theoBase: number;
} {
  const t0 = performance.now();
  const tiebanInput: TiebanInput = { ...input };
  const baziProfile = TiebanEngine.calculateBaZiProfile(tiebanInput);
  const theoBase = TiebanEngine.calculateTheoreticalBase(tiebanInput);
  const fullReport = TiebanEngine.generateFullDestinyReport(tiebanInput, theoBase, systemOffset);
  const t1 = performance.now();

  const proj = fullReport.destinyProjection;
  const norm = (v: number) => Math.max(5, Math.min(95, Math.round((v % 1000) / 10)));
  const tiebanVectors: Record<string, number> = {
    career: norm(proj.career), wealth: norm(proj.wealth), love: norm(proj.marriage),
    health: norm(proj.health), wisdom: norm(proj.lifeDestiny), social: norm(proj.children),
    creativity: norm(proj.children + proj.lifeDestiny), fortune: norm(proj.lifeDestiny),
    family: norm(proj.marriage + proj.children), spirituality: norm(proj.lifeDestiny + proj.health),
  };

  return {
    eo: {
      engineName: 'tieban',
      engineNameCN: '铁板神数',
      engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Tiě_Bǎn_Shén_Shù'],
      sourceGrade: 'B',
      ruleSchool: '太玄刻分定局法',
      confidence: 0.75,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute },
      fateVector: lifeVectorsToFateVector(tiebanVectors),
      normalizedOutput: { '条文基数': String(theoBase) },
      warnings: [],
      uncertaintyNotes: ['铁板条文映射为启发式'],
    },
    baziProfile,
    fullReport,
    tiebanVectors,
    theoBase,
  };
}

function runBazi(input: QuantumInput, baziProfile: BaZiProfile, tiebanVectors: Record<string, number>): {
  eo: EngineOutput;
  baziVectors: Record<string, number>;
} {
  const t0 = performance.now();
  const fav = baziProfile.favorableElements;
  const unfav = baziProfile.unfavorableElements;
  const baziVectors: Record<string, number> = {};
  for (const a of ALL_ASPECTS) {
    let s = 50;
    Object.values(baziProfile.pillars).forEach(p => {
      const el = STEM_ELEMENTS[p.charAt(0)] || '';
      if (fav.includes(el)) s += 4;
      if (unfav.includes(el)) s -= 3;
    });
    baziVectors[a] = clamp(s + (tiebanVectors[a] - 50) * 0.3);
  }
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'bazi',
      engineNameCN: '八字命理',
      engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Four_Pillars_of_Destiny'],
      sourceGrade: 'A',
      ruleSchool: '子平八字',
      confidence: 0.80,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour },
      fateVector: lifeVectorsToFateVector(baziVectors),
      normalizedOutput: {
        '日主': `${baziProfile.dayMaster}(${baziProfile.dayMasterElement})`,
        '喜用': fav.join(''),
        '忌': unfav.join(''),
      },
      warnings: [],
      uncertaintyNotes: ['八字喜忌判断为简化启发式'],
    },
    baziVectors,
  };
}

function runZiwei(input: QuantumInput): { eo: EngineOutput; ziweiReport: ZiweiReport } {
  const t0 = performance.now();
  const ziweiReport = ZiweiEngine.generateReport({
    year: input.year, month: input.month, day: input.day, hour: input.hour, gender: input.gender,
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
  const mingStars = ziweiReport.palaces.find(p => p.isMing)?.stars.map(s => s.name).join('、') || '无';

  return {
    eo: {
      engineName: 'ziwei',
      engineNameCN: '紫微斗数',
      engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Zi_wei_dou_shu'],
      sourceGrade: 'A',
      ruleSchool: '三合派紫微斗数',
      confidence: 0.78,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, gender: input.gender },
      fateVector: lifeVectorsToFateVector(ziweiVectors),
      normalizedOutput: { '命宫': ziweiReport.mingGong, '主星': mingStars, '五行局': ziweiReport.wuxingju.name },
      warnings: [],
      uncertaintyNotes: ['宫位星曜评分为简化启发式'],
    },
    ziweiReport,
  };
}

function runLiuYao(queryTimeUtc: string): { eo: EngineOutput; liuYaoResult: LiuYaoResult } {
  const t0 = performance.now();
  // Use the query time (deterministic for a given queryTimeUtc)
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

  return {
    eo: {
      engineName: 'liuyao',
      engineNameCN: '六爻卦象',
      engineVersion: '1.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/I_Ching_divination'],
      sourceGrade: 'B',
      ruleSchool: '京房六爻',
      confidence: 0.60,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { queryTime: queryTimeUtc },
      fateVector: lifeVectorsToFateVector(liuYaoVectors),
      normalizedOutput: { '卦名': liuYaoResult.mainHexagram.name, '动爻': String(liuYaoResult.mainHexagram.changingLines.length) },
      warnings: ['六爻基于起卦时间而非出生时间，适用于即时占卜'],
      uncertaintyNotes: ['六爻结果与起卦时间强相关'],
    },
    liuYaoResult,
  };
}

function runWestern(input: QuantumInput): { eo: EngineOutput; westernReport: WesternAstrologyReport } {
  const t0 = performance.now();
  const westernReport = WesternAstrologyEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'western',
      engineNameCN: '西方占星',
      engineVersion: WesternAstrologyEngine.metadata.algorithm_version,
      sourceUrls: WesternAstrologyEngine.metadata.source_urls,
      sourceGrade: WesternAstrologyEngine.metadata.source_grade,
      ruleSchool: WesternAstrologyEngine.metadata.rule_school,
      confidence: 0.75,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute, lat: input.geoLatitude, lon: input.geoLongitude },
      fateVector: lifeVectorsToFateVector(westernReport.lifeVectors),
      normalizedOutput: {
        '太阳': WesternAstrologyEngine.getSignCN(westernReport.sunSign),
        '月亮': WesternAstrologyEngine.getSignCN(westernReport.moonSign),
        '上升': WesternAstrologyEngine.getSignCN(westernReport.risingSign),
      },
      warnings: [],
      uncertaintyNotes: WesternAstrologyEngine.metadata.uncertainty_notes,
    },
    westernReport,
  };
}

function runVedic(input: QuantumInput): { eo: EngineOutput; vedicReport: VedicReport } {
  const t0 = performance.now();
  const vedicReport = VedicAstrologyEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'vedic',
      engineNameCN: '吠陀占星',
      engineVersion: VedicAstrologyEngine.metadata.algorithm_version,
      sourceUrls: VedicAstrologyEngine.metadata.source_urls,
      sourceGrade: VedicAstrologyEngine.metadata.source_grade,
      ruleSchool: VedicAstrologyEngine.metadata.rule_school,
      confidence: 0.72,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, minute: input.minute, lat: input.geoLatitude, lon: input.geoLongitude },
      fateVector: lifeVectorsToFateVector(vedicReport.lifeVectors),
      normalizedOutput: { '月亮星座': vedicReport.rashiSignCN, '月宿': vedicReport.moonNakshatra.nameCN, 'Yoga': vedicReport.yogas[0] || '' },
      warnings: [],
      uncertaintyNotes: VedicAstrologyEngine.metadata.uncertainty_notes,
    },
    vedicReport,
  };
}

function runNumerology(input: QuantumInput): { eo: EngineOutput; numerologyReport: NumerologyReport } {
  const t0 = performance.now();
  const numerologyReport = NumerologyEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'numerology',
      engineNameCN: '数字命理',
      engineVersion: '1.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Numerology'],
      sourceGrade: 'B',
      ruleSchool: 'Pythagorean + Chaldean',
      confidence: 0.55,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day },
      fateVector: lifeVectorsToFateVector(numerologyReport.lifeVectors),
      normalizedOutput: { '生命数': String(numerologyReport.lifePath), '含义': numerologyReport.lifePathMeaning.slice(0, 10) },
      warnings: [],
      uncertaintyNotes: ['数字命理评分为启发式'],
    },
    numerologyReport,
  };
}

function runMayan(input: QuantumInput): { eo: EngineOutput; mayanReport: MayanReport } {
  const t0 = performance.now();
  const mayanReport = MayanCalendarEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'mayan',
      engineNameCN: '玛雅历法',
      engineVersion: '1.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Maya_calendar'],
      sourceGrade: 'B',
      ruleSchool: 'Tzolkin + Haab',
      confidence: 0.50,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day },
      fateVector: lifeVectorsToFateVector(mayanReport.lifeVectors),
      normalizedOutput: { '日符': mayanReport.daySignCN, '银河音': String(mayanReport.galacticTone), 'Kin': String(mayanReport.kin) },
      warnings: [],
      uncertaintyNotes: ['玛雅能量映射为启发式'],
    },
    mayanReport,
  };
}

function runKabbalah(input: QuantumInput): { eo: EngineOutput; kabbalahReport: KabbalahReport } {
  const t0 = performance.now();
  const kabbalahReport = KabbalahEngine.calculate(input);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'kabbalah',
      engineNameCN: '卡巴拉',
      engineVersion: '1.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Kabbalah'],
      sourceGrade: 'B',
      ruleSchool: 'Tree of Life / Sephiroth',
      confidence: 0.50,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day },
      fateVector: lifeVectorsToFateVector(kabbalahReport.lifeVectors),
      normalizedOutput: { '灵魂质点': kabbalahReport.soulSephirah.nameCN, '人格质点': kabbalahReport.personalitySephirah.nameCN },
      warnings: [],
      uncertaintyNotes: ['卡巴拉能量映射为启发式'],
    },
    kabbalahReport,
  };
}

// ═══════════════════════════════════════════════
// P1.1 Orchestrator: orchestrate() — StandardizedInput as sole entry
// ═══════════════════════════════════════════════

interface OrchestrationResult {
  unifiedResult: UnifiedPredictionResult;
  rawData: {
    baziProfile: BaZiProfile;
    fullReport: FullDestinyReport;
    ziweiReport: ZiweiReport;
    liuYaoResult: LiuYaoResult;
    westernReport: WesternAstrologyReport;
    vedicReport: VedicReport;
    numerologyReport: NumerologyReport;
    mayanReport: MayanReport;
    kabbalahReport: KabbalahReport;
    meihuaResult: MeihuaResult | null;
    qimenResult: QimenResult | null;
    liurenResult: LiuRenResult | null;
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

  // Convert to legacy input for engine APIs
  const qi = standardizedToQuantumInput(standardizedInput);

  const engineOutputs: EngineOutput[] = [];
  // We need all raw data for legacy paths; run all engines but only include active ones in outputs
  let tiebanVectors: Record<string, number> = {};
  for (const a of ALL_ASPECTS) tiebanVectors[a] = 50;
  let baziVectors: Record<string, number> = {};

  // ── Tieban (always run internally for BaZi dependency, but only include output if active) ──
  const tiebanResult = runTieban(qi, systemOffset);
  tiebanVectors = tiebanResult.tiebanVectors;
  if (isActive('tieban')) engineOutputs.push(tiebanResult.eo);

  // ── BaZi ──
  const baziResult = runBazi(qi, tiebanResult.baziProfile, tiebanVectors);
  baziVectors = baziResult.baziVectors;
  if (isActive('bazi')) engineOutputs.push(baziResult.eo);

  // ── Ziwei ──
  const ziweiResult = runZiwei(qi);
  if (isActive('ziwei')) engineOutputs.push(ziweiResult.eo);

  // ── LiuYao — only run if active; use queryTimeUtc for deterministic replay ──
  let liuYaoResult: LiuYaoResult;
  if (isActive('liuyao')) {
    const lyResult = runLiuYao(standardizedInput.queryTimeUtc);
    engineOutputs.push(lyResult.eo);
    liuYaoResult = lyResult.liuYaoResult;
  } else {
    // Generate a dummy result for legacy paths (not used in unified output)
    liuYaoResult = calculateLiuYaoHexagram(new Date(standardizedInput.birthUtcDateTime));
  }

  // ── Western ──
  const westernResult = runWestern(qi);
  if (isActive('western')) engineOutputs.push(westernResult.eo);

  // ── Vedic ──
  const vedicResult = runVedic(qi);
  if (isActive('vedic')) engineOutputs.push(vedicResult.eo);

  // ── Numerology ──
  const numResult = runNumerology(qi);
  if (isActive('numerology')) engineOutputs.push(numResult.eo);

  // ── Mayan ──
  const mayanResult = runMayan(qi);
  if (isActive('mayan')) engineOutputs.push(mayanResult.eo);

  // ── Kabbalah ──
  const kabResult = runKabbalah(qi);
  if (isActive('kabbalah')) engineOutputs.push(kabResult.eo);

  // ── Meihua (梅花易数) — only run if active ──
  let meihuaResult: MeihuaResult | null = null;
  if (isActive('meihua')) {
    const mhResult = runMeihua(standardizedInput);
    engineOutputs.push(mhResult.eo);
    meihuaResult = mhResult.meihuaResult;
  }

  // ── Qimen (奇门遁甲) — only run if active ──
  let qimenResult: QimenResult | null = null;
  if (isActive('qimen')) {
    const qmResult = runQimen(standardizedInput);
    engineOutputs.push(qmResult.eo);
    qimenResult = qmResult.qimenResult;
  }

  // ── Dynamic weights (filtered to active engines only) ──
  const activeNames = engineOutputs.map(e => e.engineName);
  const weightConfigs = getWeightsForQueryType(queryType, activeNames);
  const weightsUsed: WeightEntry[] = weightConfigs.map(w => ({
    engineName: w.engineName,
    weight: w.weight,
    reason: w.reason,
  }));

  // ── Conflict detection ──
  const conflicts = detectConflicts(engineOutputs, weightsUsed);

  // ── Fuse FateVectors ──
  const fusedFateVector = fuseFateVectors(engineOutputs, weightsUsed, conflicts);

  // ── Final confidence ──
  const avgConfidence = engineOutputs.reduce((s, e) => s + e.confidence, 0) / engineOutputs.length;
  const conflictPenalty = Math.min(0.3, conflicts.length * 0.03);
  const finalConfidence = Math.max(0.1, avgConfidence - conflictPenalty);

  // ── Causal summary ──
  const topDim = ALL_FATE_DIMENSIONS.reduce((best, d) =>
    fusedFateVector[d] > fusedFateVector[best] ? d : best, 'life' as FateDimension);
  const weakDim = ALL_FATE_DIMENSIONS.reduce((worst, d) =>
    fusedFateVector[d] < fusedFateVector[worst] ? d : worst, 'life' as FateDimension);

  const causalSummary =
    `${activeNames.length}大命理体系统一编排完成（${queryType}）。` +
    `最强维度：${FATE_DIMENSION_LABELS[topDim]}(${fusedFateVector[topDim]}分)，` +
    `最弱维度：${FATE_DIMENSION_LABELS[weakDim]}(${fusedFateVector[weakDim]}分)。` +
    `检测到${conflicts.length}个体系冲突，` +
    `综合置信度${Math.round(finalConfidence * 100)}%。` +
    (conflicts.length > 0 ? `主要分歧：${conflicts[0].explanation}` : '各体系高度共振。');

  // ── Prediction ID ──
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
    algorithmVersion: '3.1.0',
    activeEngines: activeNames,
    skippedEngines: skippedEngineList,
    activationReasonSummary: activationSummary,
  };

  // ── Legacy SystemAnalysis[] ──
  const fav = tiebanResult.baziProfile.favorableElements;
  const unfav = tiebanResult.baziProfile.unfavorableElements;
  const mingStars = ziweiResult.ziweiReport.palaces.find(p => p.isMing)?.stars.map(s => s.name).join('、') || '无';

  const systems: SystemAnalysis[] = [
    { id: 'tieban', name: 'Iron Plate', nameCN: '铁板神数', origin: '中国', weight: 0.15, lifeVectors: tiebanVectors, meta: { '条文基数': String(tiebanResult.theoBase) } },
    { id: 'bazi', name: 'BaZi', nameCN: '八字命理', origin: '中国', weight: 0.15, lifeVectors: baziVectors, meta: { '日主': `${tiebanResult.baziProfile.dayMaster}(${tiebanResult.baziProfile.dayMasterElement})`, '喜用': fav.join(''), '忌': unfav.join('') } },
    { id: 'ziwei', name: 'Ziwei Doushu', nameCN: '紫微斗数', origin: '中国', weight: 0.14, lifeVectors: {}, meta: { '命宫': ziweiResult.ziweiReport.mingGong, '主星': mingStars, '五行局': ziweiResult.ziweiReport.wuxingju.name } },
    { id: 'liuyao', name: 'Liu Yao', nameCN: '六爻卦象', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '卦名': liuYaoResult.mainHexagram.name, '动爻': String(liuYaoResult.mainHexagram.changingLines.length) } },
    { id: 'western', name: 'Western Astrology', nameCN: '西方占星', origin: '西方', weight: 0.12, lifeVectors: westernResult.westernReport.lifeVectors, meta: { '太阳': WesternAstrologyEngine.getSignCN(westernResult.westernReport.sunSign), '月亮': WesternAstrologyEngine.getSignCN(westernResult.westernReport.moonSign), '上升': WesternAstrologyEngine.getSignCN(westernResult.westernReport.risingSign) } },
    { id: 'vedic', name: 'Jyotish', nameCN: '吠陀占星', origin: '印度', weight: 0.10, lifeVectors: vedicResult.vedicReport.lifeVectors, meta: { '月亮星座': vedicResult.vedicReport.rashiSignCN, '月宿': vedicResult.vedicReport.moonNakshatra.nameCN, 'Yoga': vedicResult.vedicReport.yogas[0] || '' } },
    { id: 'numerology', name: 'Numerology', nameCN: '数字命理', origin: '西方', weight: 0.08, lifeVectors: numResult.numerologyReport.lifeVectors, meta: { '生命数': String(numResult.numerologyReport.lifePath), '含义': numResult.numerologyReport.lifePathMeaning.slice(0, 10) } },
    { id: 'mayan', name: 'Mayan Calendar', nameCN: '玛雅历法', origin: '中美洲', weight: 0.08, lifeVectors: mayanResult.mayanReport.lifeVectors, meta: { '日符': mayanResult.mayanReport.daySignCN, '银河音': String(mayanResult.mayanReport.galacticTone), 'Kin': String(mayanResult.mayanReport.kin) } },
    { id: 'kabbalah', name: 'Kabbalah', nameCN: '卡巴拉', origin: '希伯来', weight: 0.08, lifeVectors: kabResult.kabbalahReport.lifeVectors, meta: { '灵魂质点': kabResult.kabbalahReport.soulSephirah.nameCN, '人格质点': kabResult.kabbalahReport.personalitySephirah.nameCN } },
    ...(meihuaResult ? [{ id: 'meihua', name: 'Meihua Yishu', nameCN: '梅花易数', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '本卦': meihuaResult.benGua.name, '变卦': meihuaResult.bianGua.name, '体用': meihuaResult.tiYong.relation } }] : []),
    ...(qimenResult ? [{ id: 'qimen', name: 'Qi Men Dun Jia', nameCN: '奇门遁甲', origin: '中国', weight: 0.10, lifeVectors: {}, meta: { '遁局': `${qimenResult.chart.dunType}${qimenResult.chart.juNumber}局`, '值符': qimenResult.chart.zhiFu, '值使': qimenResult.chart.zhiShi } }] : []),
  ];

  return {
    unifiedResult,
    rawData: {
      baziProfile: tiebanResult.baziProfile,
      fullReport: tiebanResult.fullReport,
      ziweiReport: ziweiResult.ziweiReport,
      liuYaoResult,
      westernReport: westernResult.westernReport,
      vedicReport: vedicResult.vedicReport,
      numerologyReport: numResult.numerologyReport,
      mayanReport: mayanResult.mayanReport,
      kabbalahReport: kabResult.kabbalahReport,
      meihuaResult,
      qimenResult,
      liurenResult,
    },
    systems,
  };
}

// ═══════════════════════════════════════════════
// Phase 2: Infinite World Generation (legacy)
// ═══════════════════════════════════════════════

function generateInfiniteWorlds(
  systems: SystemAnalysis[],
  input: QuantumInput,
  vedicReport: VedicReport,
  numerologyReport: NumerologyReport,
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
  systems: SystemAnalysis[],
  branches: WorldBranch[],
  input: QuantumInput,
  baziProfile: BaZiProfile,
  fullReport: FullDestinyReport,
  vedicReport: VedicReport,
  numerologyReport: NumerologyReport,
): {
  timeline: CollapsedEvent[];
  states: QuantumState[];
  entanglements: QuantumEntanglement[];
  overallCoherence: number;
  deathAge: number;
} {
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
      if (convergence > bestConvergence) {
        bestConvergence = convergence;
        bestAspect = aspect as LifeAspect;
      }
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
    if (fyData) {
      ganZhi = fyData.ganZhi;
      element = STEM_ELEMENTS[ganZhi.charAt(0)] || '';
    } else {
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
    const weighted = scores.reduce((a, b) => a + b, 0) / totalWeight;
    const rawScores = systems.map(s => (s.lifeVectors[aspect] ?? 50) / 100);
    const mean = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const variance = rawScores.reduce((s, v) => s + (v - mean) ** 2, 0) / rawScores.length;
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
    `九大命理体系高度共振，命运轨迹已完全坍缩为唯一确定态。`;
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
  const genderWord = gender === 'male' ? '其人' : '此命';

  const templates: Record<LifeAspect, Record<DestinyEventType, { title: string; desc: string }[]>> = {
    career: {
      milestone: [{ title: '事业里程碑', desc: `${ganZhi}年，${genderWord}事业迎来重要节点，${element}气${highEnergy ? '旺盛助力' : '偏弱需蓄势'}，宜把握关键机会。` }],
      opportunity: [{ title: '贵人提携', desc: `此年有贵人相助，事业发展出现新通道，${highEnergy ? '可大胆进取' : '宜稳中求进'}。` }],
      challenge: [{ title: '事业考验', desc: `${ganZhi}年事业遇阻，${element}气${highEnergy ? '虽受压但根基尚稳' : '需谨慎应对'}，守正方可渡难。` }],
      transformation: [{ title: '职业转型', desc: `此年事业方向发生根本性变化，${highEnergy ? '转型顺利' : '过程艰辛但必要'}。` }],
      relationship: [{ title: '事业合作', desc: `有重要合作伙伴出现，共同事业发展可期。` }],
      achievement: [{ title: '事业成就', desc: `多年积累在此年开花结果，${highEnergy ? '成绩斐然' : '小有收获'}。` }],
      loss: [{ title: '事业受挫', desc: `此年事业面临损失，需及时止损调整方向。` }],
      growth: [{ title: '能力提升', desc: `${ganZhi}年专业能力稳步提升，${element}气养成。` }],
      turning_point: [{ title: '事业转折', desc: `${age}岁乃事业关键转折年，${systemCount}系共振确认，此年决定此后数十年走向。` }],
    },
    wealth: {
      milestone: [{ title: '财运里程碑', desc: `${ganZhi}年财运通达，${element}生财，${highEnergy ? '大进大出' : '细水长流'}。` }],
      opportunity: [{ title: '财运机遇', desc: `意外财运浮现，${highEnergy ? '可适度投资' : '宜保守理财'}。` }],
      challenge: [{ title: '财运考验', desc: `此年财务面临压力，需严控开支。` }],
      transformation: [{ title: '财务变革', desc: `收入结构发生根本变化。` }],
      relationship: [{ title: '财缘', desc: `因人际关系带来财运机遇。` }],
      achievement: [{ title: '财富积累', desc: `多年经营在此年见回报，${highEnergy ? '积蓄丰厚' : '略有盈余'}。` }],
      loss: [{ title: '破财之年', desc: `此年有较大开支或财务损失，谨防投资风险。` }],
      growth: [{ title: '财运上升', desc: `财运渐入佳境，收入稳步增长。` }],
      turning_point: [{ title: '财运转折', desc: `${age}岁财运分水岭，此后财运格局定型。` }],
    },
    love: {
      milestone: [{ title: '情感里程碑', desc: `${ganZhi}年情感生活出现重大事件，${highEnergy ? '良缘天定' : '需主动把握'}。` }],
      opportunity: [{ title: '桃花运至', desc: `此年桃花旺盛，有望遇到重要人物。` }],
      challenge: [{ title: '情感考验', desc: `感情面临考验，需要双方共同面对。` }],
      transformation: [{ title: '情感蜕变', desc: `对感情的理解发生根本性转变。` }],
      relationship: [{ title: '缘分到来', desc: `${age}岁有重要缘分降临，${systemCount}系共振确认。` }],
      achievement: [{ title: '情感圆满', desc: `感情修成正果，${highEnergy ? '和谐美满' : '平淡中见真情'}。` }],
      loss: [{ title: '感情波折', desc: `此年情感上有离别之象，需坦然面对。` }],
      growth: [{ title: '情感成长', desc: `对爱的理解更加深刻和成熟。` }],
      turning_point: [{ title: '情感转折', desc: `${age}岁乃情感命定转折，此年经历将深刻影响一生。` }],
    },
    health: {
      milestone: [{ title: '身体变化', desc: `${ganZhi}年身体状态出现重要变化，${highEnergy ? '体魄强健' : '需注意养生'}。` }],
      opportunity: [{ title: '康复良机', desc: `此年适合调养身心，恢复精力。` }],
      challenge: [{ title: '健康警示', desc: `身体出现警讯，需及时关注${element}行相关脏腑。` }],
      transformation: [{ title: '体质转变', desc: `身体机能经历调整期。` }],
      relationship: [{ title: '身心连接', desc: `人际关系对健康产生重要影响。` }],
      achievement: [{ title: '健康巅峰', desc: `精力充沛，身体状态极佳。` }],
      loss: [{ title: '元气受损', desc: `此年需格外注意身体，避免过劳。` }],
      growth: [{ title: '体能提升', desc: `身体素质稳步改善。` }],
      turning_point: [{ title: '健康转折', desc: `${age}岁身体状态转折点，此后需调整生活方式。` }],
    },
    wisdom: {
      milestone: [{ title: '智慧开启', desc: `${ganZhi}年思维认知发生飞跃，${highEnergy ? '洞见频出' : '渐悟过程'}。` }],
      opportunity: [{ title: '学习良机', desc: `此年有重要学习或深造机会。` }],
      challenge: [{ title: '认知挑战', desc: `原有认知框架受到冲击，需要突破。` }],
      transformation: [{ title: '觉悟时刻', desc: `思想发生根本性转变，看世界的角度改变。` }],
      relationship: [{ title: '师友缘', desc: `遇到生命中的导师或益友。` }],
      achievement: [{ title: '智慧结晶', desc: `多年所学凝结成独特见解。` }],
      loss: [{ title: '迷茫期', desc: `一度失去方向感，但正是重新定位的契机。` }],
      growth: [{ title: '知识积累', desc: `学识稳步增长，视野不断拓宽。` }],
      turning_point: [{ title: '认知转折', desc: `${age}岁认知体系发生根本重组。` }],
    },
    social: {
      milestone: [{ title: '社交里程碑', desc: `${ganZhi}年人际格局发生重大变化。` }],
      opportunity: [{ title: '人脉拓展', desc: `此年有望结识重要人物，拓展社交圈。` }],
      challenge: [{ title: '人际考验', desc: `人际关系中出现摩擦或误解。` }],
      transformation: [{ title: '社交转型', desc: `社交方式和圈子发生根本变化。` }],
      relationship: [{ title: '贵人相逢', desc: `命中贵人在此年出现。` }],
      achievement: [{ title: '声望提升', desc: `社会影响力和声望显著提升。` }],
      loss: [{ title: '关系断裂', desc: `与某些人的关系走向终结。` }],
      growth: [{ title: '社交成长', desc: `人际交往能力明显提升。` }],
      turning_point: [{ title: '人际转折', desc: `${age}岁社交圈发生决定性改变。` }],
    },
    creativity: {
      milestone: [{ title: '创造力爆发', desc: `${ganZhi}年灵感泉涌，创造力达到${highEnergy ? '巅峰' : '新高度'}。` }],
      opportunity: [{ title: '创作良机', desc: `适合开始重要的创造性项目。` }],
      challenge: [{ title: '创造力瓶颈', desc: `灵感枯竭期，需要新的刺激和养分。` }],
      transformation: [{ title: '创造蜕变', desc: `创作风格或方向发生根本变化。` }],
      relationship: [{ title: '灵感缘', desc: `某个人的出现激发了巨大创造力。` }],
      achievement: [{ title: '创作成就', desc: `创造性工作获得认可和成功。` }],
      loss: [{ title: '创意受挫', desc: `创作遭遇挫折，需要重新寻找灵感。` }],
      growth: [{ title: '创造力成长', desc: `创造性思维不断精进。` }],
      turning_point: [{ title: '创造力转折', desc: `${age}岁创造力方向性转变。` }],
    },
    fortune: {
      milestone: [{ title: '运势里程碑', desc: `${ganZhi}年整体运势出现重大节点，${element}气${highEnergy ? '鼎盛' : '需养蓄'}。` }],
      opportunity: [{ title: '大运开启', desc: `整体运势上扬，诸事顺遂。` }],
      challenge: [{ title: '运势低谷', desc: `此年运势偏低，凡事宜谨慎。` }],
      transformation: [{ title: '运势转换', desc: `运势格局发生根本变化。` }],
      relationship: [{ title: '因缘际会', desc: `某种缘分对整体运势产生重大影响。` }],
      achievement: [{ title: '鸿运当头', desc: `天时地利人和，诸事皆宜。` }],
      loss: [{ title: '运势下滑', desc: `此年运势走低，宜守不宜攻。` }],
      growth: [{ title: '运势回升', desc: `运势渐入佳境，信心恢复。` }],
      turning_point: [{ title: '命运转折', desc: `${age}岁乃一生之关键转折，${systemCount}系共振，命运在此分野。` }],
    },
    family: {
      milestone: [{ title: '家庭大事', desc: `${ganZhi}年家庭出现重要变化。` }],
      opportunity: [{ title: '家庭和睦', desc: `家庭关系和谐，有添丁或团聚之喜。` }],
      challenge: [{ title: '家庭考验', desc: `家庭内部出现矛盾或变故。` }],
      transformation: [{ title: '家庭变革', desc: `家庭结构或关系发生根本变化。` }],
      relationship: [{ title: '亲缘深化', desc: `与家人的关系变得更加深厚。` }],
      achievement: [{ title: '家业兴旺', desc: `家庭事业蒸蒸日上。` }],
      loss: [{ title: '亲人离别', desc: `此年有与亲人分离的可能。` }],
      growth: [{ title: '家庭成长', desc: `家庭氛围持续改善。` }],
      turning_point: [{ title: '家庭转折', desc: `${age}岁家庭格局决定性改变。` }],
    },
    spirituality: {
      milestone: [{ title: '灵性觉醒', desc: `${ganZhi}年灵性层面出现重大突破。` }],
      opportunity: [{ title: '修行良机', desc: `适合深入内在修行和灵性探索。` }],
      challenge: [{ title: '灵魂暗夜', desc: `经历深层的灵性困惑和挣扎。` }],
      transformation: [{ title: '灵性蜕变', desc: `灵性意识发生质的飞跃。` }],
      relationship: [{ title: '灵魂伴侣', desc: `遇到对灵性成长有重要影响的人。` }],
      achievement: [{ title: '悟道时刻', desc: `多年修行在此年开花。` }],
      loss: [{ title: '信仰危机', desc: `原有信仰体系受到冲击。` }],
      growth: [{ title: '灵性成长', desc: `内在平静和智慧持续增长。` }],
      turning_point: [{ title: '灵性转折', desc: `${age}岁灵性道路的关键分叉点。` }],
    },
  };

  const aspTemplates = templates[aspect]?.[type];
  if (aspTemplates && aspTemplates.length > 0) {
    const tmpl = aspTemplates[0];
    return { title: tmpl.title, description: tmpl.desc };
  }
  return { title: `${aspectCN}${typeCN}`, description: `${ganZhi}年${aspectCN}方面发生${typeCN}事件。` };
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
  /**
   * Legacy predict() — builds StandardizedInput internally, returns old QuantumPredictionResult.
   */
  predict(input: QuantumInput, systemOffset: number = 0): QuantumPredictionResult {
    const timestamp = new Date();
    const si = quantumInputToStandardized(input);

    // P1.1: Run unified orchestration with StandardizedInput
    const { unifiedResult, rawData, systems } = orchestrate(si, systemOffset);
    const { baziProfile, fullReport, ziweiReport, liuYaoResult, westernReport, vedicReport, numerologyReport, mayanReport, kabbalahReport } = rawData;

    // Legacy Phase 2-4
    const { branches, totalGenerated, perSystem } = generateInfiniteWorlds(systems, input, vedicReport, numerologyReport, fullReport);
    const { timeline, states, entanglements, overallCoherence, deathAge } = quantumCollapse(systems, branches, input, baziProfile, fullReport, vedicReport, numerologyReport);
    const { phases, lifeSummary } = revealDestiny(timeline, states, deathAge, input);

    const elCounts: Record<string, number> = {};
    Object.values(baziProfile.pillars).forEach(p => {
      const el = STEM_ELEMENTS[p.charAt(0)];
      if (el) elCounts[el] = (elCounts[el] || 0) + 1;
    });
    const dominantElement = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '土';
    const topA = [...states].sort((a, b) => b.probability - a.probability).slice(0, 3);
    const sig = topA.map(s => `${s.label}${s.probability}`).join('·');
    const hex = ((input.year * 13 + input.month * 7 + input.day * 3 + input.hour) % 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const quantumSignature = `QS-${hex}-${sig}`;

    return {
      systems, totalWorldsGenerated: totalGenerated, branchesPerSystem: perSystem,
      states, destinyTimeline: timeline, entanglements, overallCoherence,
      destinyPhases: phases, lifeSummary, deathAge, quantumSignature, dominantElement,
      baziProfile, fullReport, ziweiReport, liuYaoResult, westernReport, vedicReport, numerologyReport, mayanReport, kabbalahReport,
      timestamp,
      unifiedResult,
    };
  },

  /**
   * P1.1: New orchestrate() — accepts StandardizedInput as sole entry point.
   * Returns only the UnifiedPredictionResult.
   */
  orchestrate(standardizedInput: StandardizedInput, systemOffset: number = 0): UnifiedPredictionResult {
    return orchestrate(standardizedInput, systemOffset).unifiedResult;
  },

  /**
   * Helper to build StandardizedInput from legacy QuantumInput (for callers migrating).
   */
  buildStandardizedInput: quantumInputToStandardized,

  getAspectLabel(aspect: LifeAspect): string {
    return ASPECT_LABELS[aspect];
  },

  getAllAspects(): LifeAspect[] {
    return [...ALL_ASPECTS];
  },

  getEventTypeCN(type: DestinyEventType): string {
    return EVENT_TYPE_CN[type];
  },
};

export default QuantumPredictionEngine;
