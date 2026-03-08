/**
 * P1 Engine Weight Configuration
 */

import type { QueryType } from '@/types/prediction';

export interface WeightConfig {
  engineName: string;
  weight: number;
  reason: string;
}

const WEIGHT_TABLE: Record<QueryType, WeightConfig[]> = {
  natalAnalysis: [
    { engineName: 'tieban', weight: 0.18, reason: '铁板神数为本命推算核心体系' },
    { engineName: 'bazi', weight: 0.18, reason: '八字命理为中国传统本命分析主体系' },
    { engineName: 'ziwei', weight: 0.16, reason: '紫微斗数宫位体系与本命高度相关' },
    { engineName: 'western', weight: 0.14, reason: '西方占星提供独立视角的本命分析' },
    { engineName: 'vedic', weight: 0.14, reason: '吠陀占星Dasha体系对终身运势有参考价值' },
    { engineName: 'numerology', weight: 0.08, reason: '数字命理提供补充维度' },
    { engineName: 'mayan', weight: 0.06, reason: '玛雅历法提供独特时间周期视角' },
    { engineName: 'kabbalah', weight: 0.06, reason: '卡巴拉提供灵性维度补充' },
  ],
  annualForecast: [
    { engineName: 'tieban', weight: 0.17, reason: '铁板流年条文为年度预测核心' },
    { engineName: 'bazi', weight: 0.17, reason: '八字大运流年为年度分析主体系' },
    { engineName: 'ziwei', weight: 0.13, reason: '紫微流年盘提供宫位年度变化' },
    { engineName: 'western', weight: 0.13, reason: '西方占星行星过运与年度预测相关' },
    { engineName: 'vedic', weight: 0.15, reason: '吠陀Dasha分期在年度预测中权重较高' },
    { engineName: 'numerology', weight: 0.07, reason: '个人年数字对年度预测有参考' },
    { engineName: 'mayan', weight: 0.05, reason: '玛雅周期参考' },
    { engineName: 'kabbalah', weight: 0.05, reason: '卡巴拉灵性参考' },
    { engineName: 'taiyi', weight: 0.08, reason: '太乙神数提供年度趋势与应期参考' },
  ],
  monthlyForecast: [
    { engineName: 'tieban', weight: 0.07, reason: '铁板流月条文可用但精度有限' },
    { engineName: 'bazi', weight: 0.14, reason: '八字流月天干地支分析为月度核心' },
    { engineName: 'ziwei', weight: 0.12, reason: '紫微流月盘对月度运势分析较强' },
    { engineName: 'liuyao', weight: 0.08, reason: '六爻月度占卜有一定参考价值' },
    { engineName: 'western', weight: 0.10, reason: '西方占星月亮周期与月度高度相关' },
    { engineName: 'vedic', weight: 0.08, reason: '吠陀月宿与月度分析相关' },
    { engineName: 'numerology', weight: 0.04, reason: '数字月度参考' },
    { engineName: 'mayan', weight: 0.04, reason: '玛雅Uinal周期' },
    { engineName: 'kabbalah', weight: 0.03, reason: '卡巴拉月度参考' },
    { engineName: 'meihua', weight: 0.06, reason: '梅花易数月度感应占断' },
    { engineName: 'qimen', weight: 0.07, reason: '奇门遁甲月度时态分析' },
    { engineName: 'liuren', weight: 0.05, reason: '大六壬月度问事占断低权重参考' },
    { engineName: 'taiyi', weight: 0.04, reason: '太乙神数月度趋势参考' },
  ],
  dailyForecast: [
    { engineName: 'bazi', weight: 0.12, reason: '八字日柱与流日天干关系为日度核心' },
    { engineName: 'ziwei', weight: 0.06, reason: '紫微流日参考' },
    { engineName: 'liuyao', weight: 0.12, reason: '六爻日占为即时预测强项' },
    { engineName: 'western', weight: 0.08, reason: '西方占星每日行星相位' },
    { engineName: 'vedic', weight: 0.05, reason: '吠陀日宿参考' },
    { engineName: 'numerology', weight: 0.05, reason: '数字日度参考' },
    { engineName: 'mayan', weight: 0.05, reason: '玛雅Kin日签高度相关' },
    { engineName: 'meihua', weight: 0.11, reason: '梅花易数日度感应占断' },
    { engineName: 'qimen', weight: 0.14, reason: '奇门遁甲时家盘与日度决策高度相关' },
    { engineName: 'liuren', weight: 0.12, reason: '大六壬日课占断与日度分析高度相关' },
    { engineName: 'taiyi', weight: 0.07, reason: '太乙神数日度趋势参考' },
  ],
  instantDecision: [
    { engineName: 'bazi', weight: 0.04, reason: '八字提供基底参考' },
    { engineName: 'ziwei', weight: 0.04, reason: '紫微提供基底参考' },
    { engineName: 'liuyao', weight: 0.15, reason: '六爻为即时占卜首选体系' },
    { engineName: 'western', weight: 0.04, reason: '西方占星卜卦盘' },
    { engineName: 'vedic', weight: 0.04, reason: '吠陀Prashna占星术' },
    { engineName: 'numerology', weight: 0.03, reason: '数字即时参考' },
    { engineName: 'mayan', weight: 0.03, reason: '玛雅当日能量' },
    { engineName: 'kabbalah', weight: 0.03, reason: '卡巴拉即时参考' },
    { engineName: 'meihua', weight: 0.18, reason: '梅花易数为即时感应占断核心体系' },
    { engineName: 'qimen', weight: 0.17, reason: '奇门遁甲时家盘为即时决策核心体系' },
    { engineName: 'liuren', weight: 0.16, reason: '大六壬为即时问事占断核心体系' },
    { engineName: 'taiyi', weight: 0.09, reason: '太乙神数提供趋势与应期补充' },
  ],
};

export const CONFLICT_THRESHOLD = 25;

export function getWeightsForQueryType(queryType: QueryType, activeEngines?: string[]): WeightConfig[] {
  const raw = WEIGHT_TABLE[queryType] || WEIGHT_TABLE.natalAnalysis;
  const filtered = activeEngines
    ? raw.filter(w => activeEngines.includes(w.engineName))
    : raw;
  const total = filtered.reduce((s, w) => s + w.weight, 0);
  if (total === 0) return filtered;
  return filtered.map(w => ({
    ...w,
    weight: w.weight / total,
  }));
}

export function getEngineWeight(queryType: QueryType, engineName: string): number {
  const weights = getWeightsForQueryType(queryType);
  return weights.find(w => w.engineName === engineName)?.weight ?? 0;
}
