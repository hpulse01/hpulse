/**
 * P1 Engine Weight Configuration
 *
 * Defines per-queryType, per-engine weights.
 * Weights are normalized to sum=1 at runtime.
 * Each entry also declares a reason for auditability.
 */

import type { QueryType } from '@/types/prediction';

export interface WeightConfig {
  engineName: string;
  weight: number;
  reason: string;
}

/**
 * Raw weight table. Keys are queryType, values are per-engine configs.
 * Weights don't need to sum to 1 here — they are normalized at runtime.
 */
const WEIGHT_TABLE: Record<QueryType, WeightConfig[]> = {
  natalAnalysis: [
    { engineName: 'tieban', weight: 0.16, reason: '铁板神数为本命推算核心体系' },
    { engineName: 'bazi', weight: 0.16, reason: '八字命理为中国传统本命分析主体系' },
    { engineName: 'ziwei', weight: 0.14, reason: '紫微斗数宫位体系与本命高度相关' },
    { engineName: 'liuyao', weight: 0.08, reason: '六爻偏重即时占卜，本命权重偏低' },
    { engineName: 'western', weight: 0.12, reason: '西方占星提供独立视角的本命分析' },
    { engineName: 'vedic', weight: 0.12, reason: '吠陀占星Dasha体系对终身运势有参考价值' },
    { engineName: 'numerology', weight: 0.08, reason: '数字命理提供补充维度' },
    { engineName: 'mayan', weight: 0.07, reason: '玛雅历法提供独特时间周期视角' },
    { engineName: 'kabbalah', weight: 0.07, reason: '卡巴拉提供灵性维度补充' },
  ],
  annualForecast: [
    { engineName: 'tieban', weight: 0.18, reason: '铁板流年条文为年度预测核心' },
    { engineName: 'bazi', weight: 0.18, reason: '八字大运流年为年度分析主体系' },
    { engineName: 'ziwei', weight: 0.14, reason: '紫微流年盘提供宫位年度变化' },
    { engineName: 'liuyao', weight: 0.06, reason: '六爻对年度预测参考价值有限' },
    { engineName: 'western', weight: 0.12, reason: '西方占星行星过运与年度预测相关' },
    { engineName: 'vedic', weight: 0.14, reason: '吠陀Dasha分期在年度预测中权重较高' },
    { engineName: 'numerology', weight: 0.08, reason: '个人年数字对年度预测有参考' },
    { engineName: 'mayan', weight: 0.05, reason: '玛雅周期参考' },
    { engineName: 'kabbalah', weight: 0.05, reason: '卡巴拉灵性参考' },
  ],
  monthlyForecast: [
    { engineName: 'tieban', weight: 0.12, reason: '铁板流月条文可用但精度有限' },
    { engineName: 'bazi', weight: 0.20, reason: '八字流月天干地支分析为月度核心' },
    { engineName: 'ziwei', weight: 0.16, reason: '紫微流月盘对月度运势分析较强' },
    { engineName: 'liuyao', weight: 0.10, reason: '六爻月度占卜有一定参考价值' },
    { engineName: 'western', weight: 0.14, reason: '西方占星月亮周期与月度高度相关' },
    { engineName: 'vedic', weight: 0.12, reason: '吠陀月宿与月度分析相关' },
    { engineName: 'numerology', weight: 0.06, reason: '数字月度参考' },
    { engineName: 'mayan', weight: 0.05, reason: '玛雅Uinal周期' },
    { engineName: 'kabbalah', weight: 0.05, reason: '卡巴拉月度参考' },
  ],
  dailyForecast: [
    { engineName: 'tieban', weight: 0.06, reason: '铁板不具备日度精度' },
    { engineName: 'bazi', weight: 0.18, reason: '八字日柱与流日天干关系为日度核心' },
    { engineName: 'ziwei', weight: 0.12, reason: '紫微流日参考' },
    { engineName: 'liuyao', weight: 0.18, reason: '六爻日占为即时预测强项' },
    { engineName: 'western', weight: 0.16, reason: '西方占星每日行星相位' },
    { engineName: 'vedic', weight: 0.10, reason: '吠陀日宿参考' },
    { engineName: 'numerology', weight: 0.08, reason: '数字日度参考' },
    { engineName: 'mayan', weight: 0.08, reason: '玛雅Kin日签高度相关' },
    { engineName: 'kabbalah', weight: 0.04, reason: '卡巴拉日度参考有限' },
  ],
  instantDecision: [
    { engineName: 'tieban', weight: 0.04, reason: '铁板不适用即时决策' },
    { engineName: 'bazi', weight: 0.10, reason: '八字提供基底参考' },
    { engineName: 'ziwei', weight: 0.08, reason: '紫微提供基底参考' },
    { engineName: 'liuyao', weight: 0.35, reason: '六爻为即时占卜首选体系' },
    { engineName: 'western', weight: 0.12, reason: '西方占星卜卦盘' },
    { engineName: 'vedic', weight: 0.10, reason: '吠陀Prashna占星术' },
    { engineName: 'numerology', weight: 0.08, reason: '数字即时参考' },
    { engineName: 'mayan', weight: 0.08, reason: '玛雅当日能量' },
    { engineName: 'kabbalah', weight: 0.05, reason: '卡巴拉即时参考' },
  ],
};

/** Conflict detection threshold: if two engines differ by more than this on a dimension, flag it */
export const CONFLICT_THRESHOLD = 25;

/**
 * Get normalized weights for a given queryType.
 * Returns weights that sum to exactly 1.0.
 */
export function getWeightsForQueryType(queryType: QueryType): WeightConfig[] {
  const raw = WEIGHT_TABLE[queryType] || WEIGHT_TABLE.natalAnalysis;
  const total = raw.reduce((s, w) => s + w.weight, 0);
  if (total === 0) return raw;
  return raw.map(w => ({
    ...w,
    weight: w.weight / total,
  }));
}

/**
 * Get weight for a specific engine under a given queryType.
 */
export function getEngineWeight(queryType: QueryType, engineName: string): number {
  const weights = getWeightsForQueryType(queryType);
  return weights.find(w => w.engineName === engineName)?.weight ?? 0;
}
