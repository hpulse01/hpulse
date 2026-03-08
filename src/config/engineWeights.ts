/**
 * H-Pulse Dynamic Weight System W(t, e, d) v5.0
 *
 * Notion 文档规范实现：权重不是固定的，而是根据三个维度动态调整：
 *   t (时间/人生阶段) — 不同体系在不同年龄段准确度不同
 *   e (事件类型)     — 不同体系擅长预测不同领域
 *   d (粒度)         — 不同查询粒度下体系权重差异
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
// 2. Life Stage Modifier — W_t(age)
//    不同体系在不同年龄段准确度不同
// ═══════════════════════════════════════════════

interface LifeStage {
  name: string;
  minAge: number;
  maxAge: number;
}

const LIFE_STAGES: LifeStage[] = [
  { name: '童年期', minAge: 0, maxAge: 12 },
  { name: '青少年期', minAge: 13, maxAge: 22 },
  { name: '开拓期', minAge: 23, maxAge: 35 },
  { name: '建设期', minAge: 36, maxAge: 48 },
  { name: '成熟期', minAge: 49, maxAge: 60 },
  { name: '智慧期', minAge: 61, maxAge: 72 },
  { name: '圆融期', minAge: 73, maxAge: 100 },
];

/**
 * 人生阶段权重修正因子。
 * >1.0 = 该阶段增强此引擎权重，<1.0 = 该阶段削弱。
 * 
 * 原理（Notion）：
 * - 紫微擅长格局（早中年），八字擅长大运（中晚年），铁板擅长细节
 * - 占星擅长感情（青年），六爻擅长决策（壮年），奇门擅长时机
 */
const LIFE_STAGE_MODIFIERS: Record<string, Record<string, number>> = {
  // engine → { stageName: modifier }
  tieban:     { '童年期': 0.8, '青少年期': 0.9, '开拓期': 1.1, '建设期': 1.2, '成熟期': 1.3, '智慧期': 1.1, '圆融期': 1.0 },
  bazi:       { '童年期': 0.7, '青少年期': 0.9, '开拓期': 1.0, '建设期': 1.2, '成熟期': 1.3, '智慧期': 1.2, '圆融期': 1.1 },
  ziwei:      { '童年期': 1.0, '青少年期': 1.1, '开拓期': 1.2, '建设期': 1.1, '成熟期': 1.0, '智慧期': 0.9, '圆融期': 0.8 },
  western:    { '童年期': 0.9, '青少年期': 1.2, '开拓期': 1.2, '建设期': 1.0, '成熟期': 0.9, '智慧期': 0.8, '圆融期': 0.7 },
  vedic:      { '童年期': 0.8, '青少年期': 1.0, '开拓期': 1.0, '建设期': 1.1, '成熟期': 1.2, '智慧期': 1.3, '圆融期': 1.2 },
  numerology: { '童年期': 1.0, '青少年期': 1.0, '开拓期': 1.0, '建设期': 1.0, '成熟期': 1.0, '智慧期': 1.0, '圆融期': 1.0 },
  mayan:      { '童年期': 1.1, '青少年期': 1.0, '开拓期': 1.0, '建设期': 1.0, '成熟期': 1.0, '智慧期': 1.1, '圆融期': 1.2 },
  kabbalah:   { '童年期': 0.8, '青少年期': 0.9, '开拓期': 1.0, '建设期': 1.0, '成熟期': 1.1, '智慧期': 1.2, '圆融期': 1.3 },
  liuyao:     { '童年期': 0.7, '青少年期': 0.8, '开拓期': 1.1, '建设期': 1.2, '成熟期': 1.1, '智慧期': 1.0, '圆融期': 0.9 },
  meihua:     { '童年期': 0.8, '青少年期': 0.9, '开拓期': 1.1, '建设期': 1.1, '成熟期': 1.0, '智慧期': 1.0, '圆融期': 0.9 },
  qimen:      { '童年期': 0.6, '青少年期': 0.8, '开拓期': 1.2, '建设期': 1.3, '成熟期': 1.1, '智慧期': 0.9, '圆融期': 0.8 },
  liuren:     { '童年期': 0.6, '青少年期': 0.8, '开拓期': 1.1, '建设期': 1.2, '成熟期': 1.1, '智慧期': 1.0, '圆融期': 0.9 },
  taiyi:      { '童年期': 0.8, '青少年期': 0.9, '开拓期': 1.0, '建设期': 1.1, '成熟期': 1.2, '智慧期': 1.2, '圆融期': 1.1 },
};

function getLifeStage(age: number): string {
  for (const stage of LIFE_STAGES) {
    if (age >= stage.minAge && age <= stage.maxAge) return stage.name;
  }
  return '圆融期';
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
// 4. Dynamic Weight Calculator W(t, e, d)
// ═══════════════════════════════════════════════

export interface DynamicWeightContext {
  queryType: QueryType;         // d: granularity
  age?: number;                 // t: life stage age
  dimension?: FateDimension;    // e: fate dimension being evaluated
  activeEngines?: string[];     // filter to active engines only
}

export interface DynamicWeightResult {
  weights: WeightConfig[];
  context: {
    queryType: QueryType;
    lifeStage: string;
    dimension: FateDimension | 'all';
    normalizedTotal: number;
  };
}

/**
 * Core dynamic weight function: W(t, e, d)
 * 
 * W_final(engine) = W_base(d) × W_t(age) × W_e(dim) / Z
 *   where Z is the normalization constant
 */
export function calculateDynamicWeights(ctx: DynamicWeightContext): DynamicWeightResult {
  const { queryType, age = 35, dimension, activeEngines } = ctx;
  const baseWeights = BASE_WEIGHT_TABLE[queryType] || BASE_WEIGHT_TABLE.natalAnalysis;
  const stageName = getLifeStage(age);

  const rawWeights: WeightConfig[] = [];
  for (const [engineName, baseW] of Object.entries(baseWeights)) {
    if (activeEngines && !activeEngines.includes(engineName)) continue;

    const tMod = getLifeStageModifier(engineName, age);
    const eMod = dimension ? getDimensionModifier(engineName, dimension) : 1.0;
    const raw = baseW * tMod * eMod;

    rawWeights.push({
      engineName,
      weight: raw,
      reason: buildWeightReason(engineName, queryType, stageName, dimension, tMod, eMod),
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
      normalizedTotal: 1.0,
    },
  };
}

function buildWeightReason(
  engine: string, queryType: QueryType, stage: string,
  dimension: FateDimension | undefined, tMod: number, eMod: number,
): string {
  const parts: string[] = [];
  if (tMod !== 1.0) parts.push(`${stage}阶段${tMod > 1 ? '增强' : '削弱'}(×${tMod.toFixed(1)})`);
  if (dimension && eMod !== 1.0) parts.push(`${dimension}维度${eMod > 1 ? '专长' : '非专长'}(×${eMod.toFixed(1)})`);
  return parts.length > 0 ? parts.join('；') : `${queryType}基准权重`;
}

// ═══════════════════════════════════════════════
// 5. Per-Dimension Weight Calculator
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
// 6. Legacy API compatibility
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
export { LIFE_STAGES, DIMENSION_EXPERTISE, LIFE_STAGE_MODIFIERS, getLifeStage };
