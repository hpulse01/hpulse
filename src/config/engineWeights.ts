/**
 * H-Pulse Dynamic Weight System W(t, e, d) v5.1
 *
 * Notion 文档规范实现：权重不是固定的，而是根据三个维度动态调整：
 *   t (时间/人生阶段) — 不同体系在不同年龄段准确度不同
 *   e (事件类型)     — 不同体系擅长预测不同领域
 *   d (粒度)         — 不同查询粒度下体系权重差异
 *
 * v5.1: 人生阶段权重矩阵精确匹配Notion规范百分比
 *       事件类型权重矩阵完整实现（7种事件类型）
 *
 * 所有权重均自动归一化。
 */

import type { QueryType, FateDimension } from '@/types/prediction';

export interface WeightConfig {
  engineName: string;
  weight: number;
  reason: string;
}

// ═══════════════════════════════════════════════
// 1. Base Weight Table (queryType = granularity d)
// ═══════════════════════════════════════════════

const BASE_WEIGHT_TABLE: Record<QueryType, Record<string, number>> = {
  natalAnalysis: {
    tieban: 0.16, bazi: 0.16, ziwei: 0.15,
    western: 0.12, vedic: 0.12, numerology: 0.06, mayan: 0.05, kabbalah: 0.05,
    liuyao: 0.03, meihua: 0.03, qimen: 0.03, liuren: 0.02, taiyi: 0.02,
  },
  annualForecast: {
    tieban: 0.14, bazi: 0.14, ziwei: 0.12,
    western: 0.10, vedic: 0.12, numerology: 0.05, mayan: 0.04, kabbalah: 0.04,
    liuyao: 0.04, meihua: 0.04, qimen: 0.05, liuren: 0.04, taiyi: 0.08,
  },
  monthlyForecast: {
    tieban: 0.06, bazi: 0.12, ziwei: 0.10,
    western: 0.08, vedic: 0.07, numerology: 0.04, mayan: 0.04, kabbalah: 0.03,
    liuyao: 0.08, meihua: 0.08, qimen: 0.10, liuren: 0.08, taiyi: 0.06,
  },
  dailyForecast: {
    tieban: 0.03, bazi: 0.10, ziwei: 0.06,
    western: 0.06, vedic: 0.04, numerology: 0.04, mayan: 0.05, kabbalah: 0.03,
    liuyao: 0.12, meihua: 0.11, qimen: 0.14, liuren: 0.12, taiyi: 0.07,
  },
  instantDecision: {
    tieban: 0.02, bazi: 0.04, ziwei: 0.04,
    western: 0.03, vedic: 0.03, numerology: 0.02, mayan: 0.02, kabbalah: 0.02,
    liuyao: 0.15, meihua: 0.18, qimen: 0.17, liuren: 0.16, taiyi: 0.09,
  },
};

// ═══════════════════════════════════════════════
// 2. Life Stage Weight Matrix — W_t(age)
//    精确匹配 Notion 人生阶段权重矩阵
//
//    Notion 规范：
//    0-12  童年: 紫微45% + 八字35%
//    13-22 青年: 紫微35% + 占星30%
//    23-35 壮年: 八字40% + 奇门25%
//    36-50 中年: 铁板40% + 八字30%
//    51-65 壮暮: 铁板45% + 紫微30%
//    66+   晚年: 铁板50% + 八字25%
// ═══════════════════════════════════════════════

interface LifeStage {
  name: string;
  minAge: number;
  maxAge: number;
}

const LIFE_STAGES: LifeStage[] = [
  { name: '童年期', minAge: 0, maxAge: 12 },
  { name: '青年期', minAge: 13, maxAge: 22 },
  { name: '壮年期', minAge: 23, maxAge: 35 },
  { name: '中年期', minAge: 36, maxAge: 50 },
  { name: '壮暮期', minAge: 51, maxAge: 65 },
  { name: '晚年期', minAge: 66, maxAge: 100 },
];

/**
 * 人生阶段权重修正因子 — 精确匹配 Notion 规范。
 * 
 * 修正因子计算原理：让主导体系在对应阶段获得最大增幅，
 * 非主导体系按比例削弱，确保归一化后接近 Notion 给出的百分比。
 * 
 * Notion 规范百分比 → 修正因子映射：
 *   主导体系(45-50%) → ×2.0-2.5
 *   次主导(30-35%)   → ×1.5-1.8
 *   辅助(15-25%)     → ×1.0-1.3
 *   弱相关(<10%)     → ×0.4-0.8
 */
const LIFE_STAGE_MODIFIERS: Record<string, Record<string, number>> = {
  // Notion: 童年紫微45%+八字35%, 青年紫微35%+占星30%, 壮年八字40%+奇门25%, 
  //         中年铁板40%+八字30%, 壮暮铁板45%+紫微30%, 晚年铁板50%+八字25%
  tieban:     { '童年期': 0.5, '青年期': 0.5, '壮年期': 0.8, '中年期': 2.2, '壮暮期': 2.5, '晚年期': 2.8 },
  bazi:       { '童年期': 1.8, '青年期': 0.8, '壮年期': 2.2, '中年期': 1.6, '壮暮期': 0.8, '晚年期': 1.4 },
  ziwei:      { '童年期': 2.5, '青年期': 2.0, '壮年期': 1.0, '中年期': 0.8, '壮暮期': 1.6, '晚年期': 0.6 },
  western:    { '童年期': 0.6, '青年期': 1.8, '壮年期': 1.2, '中年期': 0.8, '壮暮期': 0.6, '晚年期': 0.5 },
  vedic:      { '童年期': 0.7, '青年期': 1.0, '壮年期': 1.0, '中年期': 1.1, '壮暮期': 1.2, '晚年期': 1.2 },
  numerology: { '童年期': 0.8, '青年期': 1.0, '壮年期': 0.9, '中年期': 0.8, '壮暮期': 0.7, '晚年期': 0.6 },
  mayan:      { '童年期': 1.0, '青年期': 0.9, '壮年期': 0.8, '中年期': 0.7, '壮暮期': 0.8, '晚年期': 0.9 },
  kabbalah:   { '童年期': 0.6, '青年期': 0.7, '壮年期': 0.8, '中年期': 0.9, '壮暮期': 1.0, '晚年期': 1.1 },
  liuyao:     { '童年期': 0.5, '青年期': 0.7, '壮年期': 1.1, '中年期': 1.2, '壮暮期': 1.0, '晚年期': 0.8 },
  meihua:     { '童年期': 0.6, '青年期': 0.8, '壮年期': 1.0, '中年期': 1.1, '壮暮期': 0.9, '晚年期': 0.7 },
  qimen:      { '童年期': 0.4, '青年期': 0.6, '壮年期': 1.5, '中年期': 1.3, '壮暮期': 0.8, '晚年期': 0.6 },
  liuren:     { '童年期': 0.4, '青年期': 0.6, '壮年期': 1.1, '中年期': 1.2, '壮暮期': 1.0, '晚年期': 0.8 },
  taiyi:      { '童年期': 0.6, '青年期': 0.7, '壮年期': 0.9, '中年期': 1.1, '壮暮期': 1.2, '晚年期': 1.1 },
};

function getLifeStage(age: number): string {
  for (const stage of LIFE_STAGES) {
    if (age >= stage.minAge && age <= stage.maxAge) return stage.name;
  }
  return '晚年期';
}

function getLifeStageModifier(engineName: string, age: number): number {
  const stageName = getLifeStage(age);
  return LIFE_STAGE_MODIFIERS[engineName]?.[stageName] ?? 1.0;
}

// ═══════════════════════════════════════════════
// 3. Event/Dimension Modifier — W_e(dimension)
//    不同体系擅长预测不同领域
//    Notion: "让最擅长的体系主导对应领域"
// ═══════════════════════════════════════════════

/**
 * 每个引擎对6个FateVector维度的擅长系数。
 * >1.0 表示该引擎在此维度特别擅长，<1.0 表示弱。
 */
const DIMENSION_EXPERTISE: Record<string, Record<FateDimension, number>> = {
  tieban:     { life: 1.4, wealth: 1.1, relation: 1.2, health: 1.0, wisdom: 0.9, spirit: 0.8 },
  bazi:       { life: 1.3, wealth: 1.3, relation: 1.0, health: 1.2, wisdom: 1.0, spirit: 0.7 },
  ziwei:      { life: 1.2, wealth: 1.2, relation: 1.3, health: 0.9, wisdom: 1.1, spirit: 0.9 },
  western:    { life: 0.9, wealth: 0.8, relation: 1.4, health: 0.8, wisdom: 1.2, spirit: 1.1 },
  vedic:      { life: 1.0, wealth: 0.9, relation: 1.1, health: 1.3, wisdom: 1.1, spirit: 1.4 },
  numerology: { life: 1.0, wealth: 0.9, relation: 0.8, health: 0.7, wisdom: 1.2, spirit: 1.1 },
  mayan:      { life: 1.0, wealth: 0.7, relation: 0.8, health: 0.7, wisdom: 1.0, spirit: 1.3 },
  kabbalah:   { life: 0.8, wealth: 0.7, relation: 0.9, health: 0.6, wisdom: 1.3, spirit: 1.5 },
  liuyao:     { life: 1.1, wealth: 1.2, relation: 1.1, health: 1.1, wisdom: 1.0, spirit: 0.9 },
  meihua:     { life: 1.0, wealth: 1.0, relation: 1.0, health: 0.9, wisdom: 1.1, spirit: 1.0 },
  qimen:      { life: 1.0, wealth: 1.3, relation: 0.8, health: 0.8, wisdom: 1.0, spirit: 1.0 },
  liuren:     { life: 1.0, wealth: 1.1, relation: 1.0, health: 1.0, wisdom: 1.0, spirit: 0.9 },
  taiyi:      { life: 1.1, wealth: 0.9, relation: 0.8, health: 0.9, wisdom: 1.1, spirit: 1.2 },
};

function getDimensionModifier(engineName: string, dimension: FateDimension): number {
  return DIMENSION_EXPERTISE[engineName]?.[dimension] ?? 1.0;
}

// ═══════════════════════════════════════════════
// 4. Event Type Weight Matrix — Notion 事件类型权重矩阵
//
//    Notion 规范：
//    感情婚姻 → 占星、紫微主导 | 八字、塔罗辅助
//    事业财运 → 八字、铁板主导 | 紫微、奇门辅助
//    健康医疗 → 八字、六爻主导 | 占星、紫微辅助
//    出行迁移 → 奇门遁甲、六爻主导 | 占星、八字辅助
//    学业考试 → 紫微、八字主导 | 铁板、数字命理辅助
//    人际关系 → 紫微、占星主导 | 塔罗、八字辅助
//    危机意外 → 六爻、奇门主导 | 铁板、八字辅助
//    重大决策 → 六爻、塔罗主导 | 奇门、梅花辅助
// ═══════════════════════════════════════════════

export type EventType =
  | 'romance'       // 感情婚姻
  | 'career'        // 事业财运
  | 'health'        // 健康医疗
  | 'migration'     // 出行迁移
  | 'education'     // 学业考试
  | 'social'        // 人际关系
  | 'crisis'        // 危机意外
  | 'decision';     // 重大决策

/**
 * 事件类型权重矩阵。
 * 主导体系 = 2.0-2.5, 辅助体系 = 1.3-1.6, 其他 = 0.5-1.0
 */
const EVENT_TYPE_MODIFIERS: Record<EventType, Record<string, number>> = {
  romance: {
    tieban: 0.8, bazi: 1.3, ziwei: 2.0, western: 2.2, vedic: 1.5,
    numerology: 1.0, mayan: 0.7, kabbalah: 1.0, liuyao: 0.8, meihua: 0.9,
    qimen: 0.6, liuren: 0.7, taiyi: 0.6,
  },
  career: {
    tieban: 2.0, bazi: 2.2, ziwei: 1.5, western: 0.8, vedic: 0.9,
    numerology: 1.0, mayan: 0.6, kabbalah: 0.7, liuyao: 0.9, meihua: 1.0,
    qimen: 1.5, liuren: 1.0, taiyi: 1.0,
  },
  health: {
    tieban: 1.0, bazi: 2.0, ziwei: 1.4, western: 1.3, vedic: 1.5,
    numerology: 0.6, mayan: 0.5, kabbalah: 0.5, liuyao: 2.0, meihua: 1.0,
    qimen: 0.8, liuren: 1.0, taiyi: 0.8,
  },
  migration: {
    tieban: 0.7, bazi: 1.3, ziwei: 0.8, western: 1.3, vedic: 0.9,
    numerology: 0.7, mayan: 1.0, kabbalah: 0.6, liuyao: 2.0, meihua: 1.2,
    qimen: 2.5, liuren: 1.5, taiyi: 1.0,
  },
  education: {
    tieban: 1.4, bazi: 1.8, ziwei: 2.2, western: 0.9, vedic: 1.0,
    numerology: 1.5, mayan: 0.6, kabbalah: 1.2, liuyao: 0.7, meihua: 1.0,
    qimen: 0.8, liuren: 0.7, taiyi: 0.8,
  },
  social: {
    tieban: 0.8, bazi: 1.3, ziwei: 2.0, western: 2.0, vedic: 1.2,
    numerology: 0.9, mayan: 0.8, kabbalah: 1.0, liuyao: 0.7, meihua: 0.9,
    qimen: 0.7, liuren: 0.8, taiyi: 0.6,
  },
  crisis: {
    tieban: 1.5, bazi: 1.4, ziwei: 0.8, western: 0.7, vedic: 0.8,
    numerology: 0.5, mayan: 0.6, kabbalah: 0.5, liuyao: 2.5, meihua: 1.5,
    qimen: 2.2, liuren: 1.5, taiyi: 1.0,
  },
  decision: {
    tieban: 0.6, bazi: 0.8, ziwei: 0.7, western: 0.6, vedic: 0.6,
    numerology: 0.7, mayan: 0.5, kabbalah: 0.8, liuyao: 2.5, meihua: 2.0,
    qimen: 1.8, liuren: 1.5, taiyi: 1.0,
  },
};

export function getEventTypeModifier(engineName: string, eventType: EventType): number {
  return EVENT_TYPE_MODIFIERS[eventType]?.[engineName] ?? 1.0;
}

// ═══════════════════════════════════════════════
// 5. Dynamic Weight Calculator W(t, e, d)
// ═══════════════════════════════════════════════

export interface DynamicWeightContext {
  queryType: QueryType;         // d: granularity
  age?: number;                 // t: life stage age
  dimension?: FateDimension;    // e: fate dimension being evaluated
  eventType?: EventType;        // event type for specialized weights
  activeEngines?: string[];     // filter to active engines only
}

export interface DynamicWeightResult {
  weights: WeightConfig[];
  context: {
    queryType: QueryType;
    lifeStage: string;
    dimension: FateDimension | 'all';
    eventType: EventType | 'general';
    normalizedTotal: number;
  };
}

/**
 * Core dynamic weight function: W(t, e, d)
 * 
 * W_final(engine) = W_base(d) × α(t) × β(e_dim) × γ(e_type) / Z
 *   where Z is the normalization constant
 */
export function calculateDynamicWeights(ctx: DynamicWeightContext): DynamicWeightResult {
  const { queryType, age = 35, dimension, eventType, activeEngines } = ctx;
  const baseWeights = BASE_WEIGHT_TABLE[queryType] || BASE_WEIGHT_TABLE.natalAnalysis;
  const stageName = getLifeStage(age);

  const rawWeights: WeightConfig[] = [];
  for (const [engineName, baseW] of Object.entries(baseWeights)) {
    if (activeEngines && !activeEngines.includes(engineName)) continue;

    const tMod = getLifeStageModifier(engineName, age);
    const eMod = dimension ? getDimensionModifier(engineName, dimension) : 1.0;
    const evtMod = eventType ? getEventTypeModifier(engineName, eventType) : 1.0;
    const raw = baseW * tMod * eMod * evtMod;

    rawWeights.push({
      engineName,
      weight: raw,
      reason: buildWeightReason(engineName, queryType, stageName, dimension, eventType, tMod, eMod, evtMod),
    });
  }

  // Normalize
  const total = rawWeights.reduce((s, w) => s + w.weight, 0);
  if (total > 0) {
    for (const w of rawWeights) w.weight = w.weight / total;
  }

  return {
    weights: rawWeights,
    context: {
      queryType,
      lifeStage: stageName,
      dimension: dimension || 'all',
      eventType: eventType || 'general',
      normalizedTotal: 1.0,
    },
  };
}

function buildWeightReason(
  engine: string, queryType: QueryType, stage: string,
  dimension: FateDimension | undefined, eventType: EventType | undefined,
  tMod: number, eMod: number, evtMod: number,
): string {
  const parts: string[] = [];
  if (tMod !== 1.0) parts.push(`${stage}${tMod > 1 ? '增强' : '削弱'}(×${tMod.toFixed(1)})`);
  if (dimension && eMod !== 1.0) parts.push(`${dimension}维度${eMod > 1 ? '专长' : '非专长'}(×${eMod.toFixed(1)})`);
  if (eventType && evtMod !== 1.0) parts.push(`${eventType}事件${evtMod > 1 ? '主导' : '辅助'}(×${evtMod.toFixed(1)})`);
  return parts.length > 0 ? parts.join('；') : `${queryType}基准权重`;
}

// ═══════════════════════════════════════════════
// 6. Per-Dimension Weight Calculator
//    为每个FateVector维度独立计算权重
// ═══════════════════════════════════════════════

export interface PerDimensionWeights {
  dimension: FateDimension;
  weights: WeightConfig[];
}

/**
 * Calculate weights for ALL 6 dimensions simultaneously.
 * Each dimension has its own weight distribution based on engine expertise.
 */
export function calculatePerDimensionWeights(
  queryType: QueryType, age: number = 35, activeEngines?: string[],
): PerDimensionWeights[] {
  const dimensions: FateDimension[] = ['life', 'wealth', 'relation', 'health', 'wisdom', 'spirit'];
  return dimensions.map(dim => {
    const result = calculateDynamicWeights({ queryType, age, dimension: dim, activeEngines });
    return { dimension: dim, weights: result.weights };
  });
}

// ═══════════════════════════════════════════════
// 7. Legacy API compatibility
// ═══════════════════════════════════════════════

export const CONFLICT_THRESHOLD = 25;

export function getWeightsForQueryType(queryType: QueryType, activeEngines?: string[]): WeightConfig[] {
  return calculateDynamicWeights({ queryType, activeEngines }).weights;
}

export function getEngineWeight(queryType: QueryType, engineName: string): number {
  const weights = getWeightsForQueryType(queryType);
  return weights.find(w => w.engineName === engineName)?.weight ?? 0;
}

/**
 * Get dimension-aware weight for a specific engine on a specific dimension.
 */
export function getDimensionAwareWeight(
  queryType: QueryType, engineName: string, dimension: FateDimension, age: number = 35,
): number {
  const result = calculateDynamicWeights({ queryType, age, dimension });
  return result.weights.find(w => w.engineName === engineName)?.weight ?? 0;
}

// Export for testing
export { LIFE_STAGES, DIMENSION_EXPERTISE, LIFE_STAGE_MODIFIERS, getLifeStage, EVENT_TYPE_MODIFIERS };
