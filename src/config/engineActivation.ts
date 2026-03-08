/**
 * P2.5 Engine Activation Strategy
 * 
 * ALL engines default to active for ALL queryTypes.
 * Instant engines (liuyao, meihua, qimen, liuren, taiyi) use queryTimeUtc.
 * Natal engines use birth data.
 * Weights control relative influence per queryType.
 */

import type { QueryType, EngineName, EngineActivationRule } from '@/types/prediction';

const ACTIVATION_TABLE: Record<QueryType, Record<EngineName, { active: boolean; reason: string }>> = {
  natalAnalysis: {
    tieban:     { active: true,  reason: '铁板神数为本命推算核心' },
    bazi:       { active: true,  reason: '八字命理为本命分析主体系' },
    ziwei:      { active: true,  reason: '紫微斗数宫位与本命高度相关' },
    liuyao:     { active: true,  reason: '六爻以queryTimeUtc起卦，提供即时感应参考' },
    western:    { active: true,  reason: '西方占星提供本命星盘分析' },
    vedic:      { active: true,  reason: '吠陀占星Dasha体系对终身运势有参考价值' },
    numerology: { active: true,  reason: '数字命理提供补充维度' },
    mayan:      { active: true,  reason: '玛雅历法提供时间周期视角' },
    kabbalah:   { active: true,  reason: '卡巴拉提供灵性维度补充' },
    meihua:     { active: true,  reason: '梅花易数以queryTimeUtc起卦，低权重即时参考' },
    qimen:      { active: true,  reason: '奇门遁甲以queryTimeUtc起局，低权重即时参考' },
    liuren:     { active: true,  reason: '大六壬以queryTimeUtc起课，低权重即时参考' },
    taiyi:      { active: true,  reason: '太乙神数以queryTimeUtc起局，低权重趋势参考' },
  },
  annualForecast: {
    tieban:     { active: true,  reason: '铁板流年条文为年度预测核心' },
    bazi:       { active: true,  reason: '八字大运流年为年度分析主体系' },
    ziwei:      { active: true,  reason: '紫微流年盘提供宫位年度变化' },
    liuyao:     { active: true,  reason: '六爻年度参考' },
    western:    { active: true,  reason: '西方占星行星过运与年度预测相关' },
    vedic:      { active: true,  reason: '吠陀Dasha分期在年度预测中权重较高' },
    numerology: { active: true,  reason: '个人年数字对年度预测有参考' },
    mayan:      { active: true,  reason: '玛雅周期参考' },
    kabbalah:   { active: true,  reason: '卡巴拉灵性参考' },
    meihua:     { active: true,  reason: '梅花易数年度感应' },
    qimen:      { active: true,  reason: '奇门遁甲年度时态' },
    liuren:     { active: true,  reason: '大六壬年度问事' },
    taiyi:      { active: true,  reason: '太乙神数可提供年度趋势与应期参考' },
  },
  monthlyForecast: {
    tieban:     { active: true,  reason: '铁板流月条文可用但精度有限' },
    bazi:       { active: true,  reason: '八字流月天干地支分析为月度核心' },
    ziwei:      { active: true,  reason: '紫微流月盘对月度运势分析较强' },
    liuyao:     { active: true,  reason: '六爻月度占卜有一定参考价值' },
    western:    { active: true,  reason: '西方占星月亮周期与月度高度相关' },
    vedic:      { active: true,  reason: '吠陀月宿与月度分析相关' },
    numerology: { active: true,  reason: '数字月度参考' },
    mayan:      { active: true,  reason: '玛雅Uinal周期' },
    kabbalah:   { active: true,  reason: '卡巴拉月度参考' },
    meihua:     { active: true,  reason: '梅花易数月度感应占断' },
    qimen:      { active: true,  reason: '奇门遁甲月度时态分析' },
    liuren:     { active: true,  reason: '大六壬月度问事占断' },
    taiyi:      { active: true,  reason: '太乙神数月度趋势参考' },
  },
  dailyForecast: {
    tieban:     { active: true,  reason: '铁板日度参考有限但仍可提供条文' },
    bazi:       { active: true,  reason: '八字日柱与流日天干关系为日度核心' },
    ziwei:      { active: true,  reason: '紫微流日参考' },
    liuyao:     { active: true,  reason: '六爻日占为即时预测强项' },
    western:    { active: true,  reason: '西方占星每日行星相位' },
    vedic:      { active: true,  reason: '吠陀日宿参考' },
    numerology: { active: true,  reason: '数字日度参考' },
    mayan:      { active: true,  reason: '玛雅Kin日签高度相关' },
    kabbalah:   { active: true,  reason: '卡巴拉日度参考' },
    meihua:     { active: true,  reason: '梅花易数日度感应占断' },
    qimen:      { active: true,  reason: '奇门遁甲时家盘与日度决策高度相关' },
    liuren:     { active: true,  reason: '大六壬日课占断与日度分析相关' },
    taiyi:      { active: true,  reason: '太乙神数日度趋势参考' },
  },
  instantDecision: {
    tieban:     { active: true,  reason: '铁板提供基底本命参考' },
    bazi:       { active: true,  reason: '八字提供基底参考' },
    ziwei:      { active: true,  reason: '紫微提供基底参考' },
    liuyao:     { active: true,  reason: '六爻为即时占卜首选体系' },
    western:    { active: true,  reason: '西方占星卜卦盘' },
    vedic:      { active: true,  reason: '吠陀Prashna占星术' },
    numerology: { active: true,  reason: '数字即时参考' },
    mayan:      { active: true,  reason: '玛雅当日能量' },
    kabbalah:   { active: true,  reason: '卡巴拉即时参考' },
    meihua:     { active: true,  reason: '梅花易数为即时感应占断核心体系' },
    qimen:      { active: true,  reason: '奇门遁甲时家盘为即时决策核心体系' },
    liuren:     { active: true,  reason: '大六壬为即时问事占断核心体系' },
    taiyi:      { active: true,  reason: '太乙神数提供时态趋势与应期补充' },
  },
};

export const DETERMINISTIC_QUERY_TYPES: Set<QueryType> = new Set([
  'natalAnalysis',
  'annualForecast',
]);

export function getEngineActivation(queryType: QueryType): EngineActivationRule[] {
  const table = ACTIVATION_TABLE[queryType] ?? ACTIVATION_TABLE.natalAnalysis;
  return Object.entries(table).map(([engine, rule]) => ({
    engine: engine as EngineName,
    active: rule.active,
    reason: rule.reason,
  }));
}

export function getActiveEngines(queryType: QueryType): EngineName[] {
  return getEngineActivation(queryType).filter(r => r.active).map(r => r.engine);
}

export function getSkippedEngines(queryType: QueryType): Array<{ engineName: string; reason: string }> {
  return getEngineActivation(queryType).filter(r => !r.active).map(r => ({ engineName: r.engine, reason: r.reason }));
}

export function buildActivationSummary(queryType: QueryType): string {
  const active = getActiveEngines(queryType);
  const skipped = getSkippedEngines(queryType);
  const isDeterministic = DETERMINISTIC_QUERY_TYPES.has(queryType);
  let summary = `查询类型「${queryType}」激活${active.length}个引擎`;
  if (skipped.length > 0) {
    summary += `，跳过${skipped.length}个（${skipped.map(s => s.engineName).join('、')}）`;
  }
  if (isDeterministic) {
    summary += '。此查询为确定性类型，相同输入将产生相同结果。';
  }
  return summary;
}
