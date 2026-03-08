/**
 * H-Pulse Holographic Fate Map Types v1.0
 * 
 * Notion 第五层：全息命运图谱
 * 三层结构：
 *   1. 宏观命格层 (Macro Fate Layer) — 整体人生格局
 *   2. 中观事件层 (Meso Event Layer) — 关键人生事件
 *   3. 微观日常层 (Micro Daily Layer) — 日常预测
 */

import type { FateVector, FateDimension } from './prediction';
import type { DeathCause, CollapsedPathNode } from './destinyTree';

// ═══════════════════════════════════════════════
// 1. FateNode Schema (Notion 详细人生节点数据结构)
// ═══════════════════════════════════════════════

export type FateNodeLayer = 'macro' | 'meso' | 'micro';

export interface FateNode {
  id: string;
  layer: FateNodeLayer;
  /** 节点时间 */
  age: number;
  year: number;
  /** 节点标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 节点类别 */
  category: string;
  /** 子类别 */
  subcategory: string;
  /** 命运向量快照 */
  fateVector: FateVector;
  /** 主导变化维度 */
  dominantDimension: FateDimension;
  /** 变化幅度 (-100 to +100) */
  changeMagnitude: number;
  /** 支撑引擎 */
  supportingEngines: string[];
  /** 引擎共识数 */
  consensusCount: number;
  /** 置信度 0-1 */
  confidence: number;
  /** 因果链 */
  causalChain: string[];
  /** 前置节点ID */
  prerequisiteNodeIds: string[];
  /** 后续影响 */
  consequences: string[];
}

// ═══════════════════════════════════════════════
// 2. Macro Fate Layer — 宏观命格层
// ═══════════════════════════════════════════════

export type LifePhase =
  | 'childhood'     // 童年
  | 'youth'         // 青年
  | 'prime'         // 壮年
  | 'midlife'       // 中年
  | 'mature'        // 壮暮
  | 'elderly';      // 晚年

export interface MacroFateLayer {
  /** 整体命格评级 */
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  /** 命格标题 (如 "文昌命格·偏财运旺") */
  fateTitle: string;
  /** 命格描述 */
  fateDescription: string;
  /** 核心命格特征 */
  coreTraits: string[];
  /** 各人生阶段运势概览 */
  phaseOverviews: MacroPhaseOverview[];
  /** 终身FateVector均值 */
  lifetimeAverageFate: FateVector;
  /** 最强维度 */
  strongestDimension: FateDimension;
  /** 最弱维度 */
  weakestDimension: FateDimension;
  /** 寿命预估 */
  estimatedLifespan: number;
  /** 死亡方式 */
  deathCause: DeathCause;
  /** 总节点数 */
  totalNodes: number;
}

export interface MacroPhaseOverview {
  phase: LifePhase;
  phaseName: string;
  ageRange: [number, number];
  /** 该阶段运势走向 */
  trend: 'ascending' | 'peak' | 'stable' | 'declining' | 'turbulent';
  /** 该阶段FateVector均值 */
  averageFate: FateVector;
  /** 该阶段核心主题 */
  coreTheme: string;
  /** 该阶段关键事件数 */
  keyEventCount: number;
  /** 主导引擎 */
  dominantEngine: string;
}

// ═══════════════════════════════════════════════
// 3. Meso Event Layer — 中观事件层
// ═══════════════════════════════════════════════

export interface MesoEventLayer {
  /** 所有关键人生事件 */
  keyEvents: MesoEvent[];
  /** 命运转折点 */
  turningPoints: MesoEvent[];
  /** 高峰与低谷 */
  peaks: MesoEvent[];
  valleys: MesoEvent[];
  /** 命运曲线数据点 */
  fateCurve: FateCurvePoint[];
}

export interface MesoEvent extends FateNode {
  /** 事件强度 */
  intensity: 'minor' | 'moderate' | 'major' | 'critical' | 'life_defining';
  /** 是否为转折点 */
  isTurningPoint: boolean;
  /** 前后FateVector变化 */
  fateVectorBefore: FateVector;
  fateVectorAfter: FateVector;
  /** 变化最大的维度 */
  maxChangeDimension: FateDimension;
  /** 变化量 */
  maxChangeAmount: number;
}

export interface FateCurvePoint {
  age: number;
  year: number;
  fateVector: FateVector;
  /** 综合运势分 (0-100) */
  overallScore: number;
  /** 该年主要事件 */
  dominantEvent: string | null;
}

// ═══════════════════════════════════════════════
// 4. Micro Daily Layer — 微观日常层
// ═══════════════════════════════════════════════

export interface MicroDailyLayer {
  /** 日常建议 */
  dailyGuidance: string;
  /** 当前运势周期 */
  currentCycle: string;
  /** 今日宜忌 */
  auspicious: string[];
  inauspicious: string[];
  /** 关注维度 */
  focusDimension: FateDimension;
  /** 该维度趋势 */
  dimensionTrend: 'up' | 'stable' | 'down';
}

// ═══════════════════════════════════════════════
// 5. Holographic Fate Map — 全息命运图谱
// ═══════════════════════════════════════════════

export interface HolographicFateMap {
  /** 图谱版本 */
  version: string;
  /** 生成时间 */
  generatedAt: string;
  /** 命主出生年 */
  birthYear: number;
  /** 性别 */
  gender: string;
  /** 宏观命格层 */
  macroLayer: MacroFateLayer;
  /** 中观事件层 */
  mesoLayer: MesoEventLayer;
  /** 微观日常层 */
  microLayer: MicroDailyLayer;
  /** 量子坍缩信息 */
  collapseInfo: {
    totalPathsConsidered: number;
    collapseConfidence: number;
    selectedReason: string;
    dominantEngines: string[];
  };
}
