/**
 * H-Pulse Internationalization (i18n) System v1.0
 * 
 * Provides Chinese/English bilingual support with React context.
 * All engine names, life stages, dimensions, event types, and UI labels.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'zh' | 'en';

// ═══════════════════════════════════════════════
// Translation Dictionary
// ═══════════════════════════════════════════════

const translations = {
  // ── Engine Names (13 engines) ──
  'engine.tieban':     { zh: '铁板神数', en: 'Iron Plate' },
  'engine.bazi':       { zh: '八字命理', en: 'BaZi (Four Pillars)' },
  'engine.ziwei':      { zh: '紫微斗数', en: 'Ziwei Doushu' },
  'engine.liuyao':     { zh: '六爻卦象', en: 'Liu Yao (Six Lines)' },
  'engine.western':    { zh: '西方占星', en: 'Western Astrology' },
  'engine.vedic':      { zh: '吠陀占星', en: 'Vedic Astrology' },
  'engine.numerology': { zh: '数字命理', en: 'Numerology' },
  'engine.mayan':      { zh: '玛雅历法', en: 'Mayan Calendar' },
  'engine.kabbalah':   { zh: '卡巴拉', en: 'Kabbalah' },
  'engine.meihua':     { zh: '梅花易数', en: 'Meihua Yishu' },
  'engine.qimen':      { zh: '奇门遁甲', en: 'Qimen Dunjia' },
  'engine.liuren':     { zh: '大六壬', en: 'Da Liu Ren' },
  'engine.taiyi':      { zh: '太乙神数', en: 'Taiyi Shenshu' },

  // ── Life Stages ──
  'stage.childhood':   { zh: '童年期', en: 'Childhood' },
  'stage.youth':       { zh: '青年期', en: 'Youth' },
  'stage.prime':       { zh: '壮年期', en: 'Prime' },
  'stage.midlife':     { zh: '中年期', en: 'Midlife' },
  'stage.mature':      { zh: '壮暮期', en: 'Mature' },
  'stage.elderly':     { zh: '晚年期', en: 'Elderly' },

  // ── Fate Dimensions (6D) ──
  'dim.life':          { zh: '命运·事业', en: 'Life & Career' },
  'dim.wealth':        { zh: '财富', en: 'Wealth' },
  'dim.relation':      { zh: '人际·情感', en: 'Relationships' },
  'dim.health':        { zh: '健康', en: 'Health' },
  'dim.wisdom':        { zh: '智慧·创造', en: 'Wisdom & Creativity' },
  'dim.spirit':        { zh: '灵性', en: 'Spirituality' },

  // ── Event Types ──
  'event.romance':     { zh: '感情婚姻', en: 'Romance & Marriage' },
  'event.career':      { zh: '事业财运', en: 'Career & Finance' },
  'event.health':      { zh: '健康医疗', en: 'Health & Medical' },
  'event.migration':   { zh: '出行迁移', en: 'Travel & Migration' },
  'event.education':   { zh: '学业考试', en: 'Education & Exams' },
  'event.social':      { zh: '人际关系', en: 'Social Relations' },
  'event.crisis':      { zh: '危机意外', en: 'Crisis & Accident' },
  'event.decision':    { zh: '重大决策', en: 'Major Decision' },

  // ── Query Types ──
  'query.natalAnalysis':    { zh: '本命分析', en: 'Natal Analysis' },
  'query.annualForecast':   { zh: '流年预测', en: 'Annual Forecast' },
  'query.monthlyForecast':  { zh: '流月预测', en: 'Monthly Forecast' },
  'query.dailyForecast':    { zh: '流日预测', en: 'Daily Forecast' },
  'query.instantDecision':  { zh: '即时决策', en: 'Instant Decision' },

  // ── Weight Reasons ──
  'weight.enhance':    { zh: '增强', en: 'Enhanced' },
  'weight.weaken':     { zh: '削弱', en: 'Weakened' },
  'weight.expert':     { zh: '专长', en: 'Expert' },
  'weight.non_expert': { zh: '非专长', en: 'Non-expert' },
  'weight.dominant':   { zh: '主导', en: 'Dominant' },
  'weight.support':    { zh: '辅助', en: 'Supporting' },
  'weight.base':       { zh: '基准权重', en: 'Base Weight' },

  // ── UI Labels ──
  'ui.title':                  { zh: 'H-Pulse', en: 'H-Pulse' },
  'ui.subtitle':               { zh: '量子命运预测', en: 'QUANTUM DESTINY PREDICTION' },
  'ui.clauses':                { zh: '条文', en: 'clauses' },
  'ui.engines':                { zh: '引擎', en: 'engines' },
  'ui.initializing':           { zh: '十三大体系初始化中', en: 'Initializing 13-Engine Analysis' },
  'ui.initializing_sub':       { zh: '十三大引擎分析启动', en: 'Initializing 13-Engine Analysis' },
  'ui.collapsing':             { zh: '量子坍缩 · 收敛唯一命运', en: 'Quantum Collapse → One True Destiny' },
  'ui.collapsing_sub':         { zh: '∞ 世界 → 唯一命运', en: '∞ worlds → 1 true destiny' },
  'ui.destiny_resolved':       { zh: '命运已全知', en: 'Destiny Resolved' },
  'ui.destiny_resolved_badge': { zh: '命运已解', en: 'DESTINY RESOLVED' },
  'ui.coherence':              { zh: '共振度', en: 'Coherence' },
  'ui.worlds':                 { zh: '世界总数', en: 'Worlds' },
  'ui.element':                { zh: '主导五行', en: 'Element' },
  'ui.lifespan':               { zh: '寿数', en: 'Lifespan' },
  'ui.years_old':              { zh: '岁', en: ' yrs' },
  'ui.reset':                  { zh: '重新推算', en: 'Recalculate' },
  'ui.prediction_complete':    { zh: '推算完成', en: 'Prediction Complete' },
  'ui.prediction_complete_desc': { zh: '十三大体系量子坍缩完毕', en: '13-Engine Quantum Collapse Complete' },
  'ui.calc_error':             { zh: '推算出错', en: 'Calculation Error' },
  'ui.calc_error_desc':        { zh: '请检查输入数据后重试', en: 'Please check input and retry' },
  'ui.proj_error':             { zh: '推演出错', en: 'Projection Error' },
  'ui.proj_error_desc':        { zh: '请重新开始', en: 'Please restart' },

  // ── Tab Labels ──
  'tab.overview':       { zh: '预测总览', en: 'Overview' },
  'tab.engines':        { zh: '引擎贡献', en: 'Engine Contributions' },
  'tab.tree':           { zh: '命运树', en: 'Destiny Tree' },
  'tab.path':           { zh: '唯一路径', en: 'Unique Path' },
  'tab.destiny':        { zh: '铁板命盘', en: 'Iron Plate Chart' },
  'tab.quantum':        { zh: '量子全知', en: 'Quantum Omniscience' },
  'tab.orchestration':  { zh: '统一编排', en: 'Orchestration' },

  // ── Disclaimer ──
  'disclaimer.title':   { zh: '免责声明', en: 'Disclaimer' },
  'disclaimer.text':    { zh: '所有推算结果均基于传统命理数学模型，仅供文化研究与个人兴趣参考，不构成任何科学预测、医疗建议、投资建议或人生指导。请以理性科学态度看待结果，重大决策请咨询专业人士。',
                          en: 'All predictions are based on traditional metaphysical mathematical models, for cultural research and personal interest only. They do not constitute scientific predictions, medical advice, investment advice, or life guidance. Please approach results rationally and consult professionals for major decisions.' },

  // ── Clause Library ──
  'admin.clause_empty': { zh: '⚠ 条文库为空', en: '⚠ Clause library empty' },
  'admin.import':       { zh: '导入', en: 'Import' },
  'admin.super_admin':  { zh: 'Super Admin · 统一编排诊断面板', en: 'Super Admin · Orchestration Diagnostics' },

  // ── Holographic Fate Map ──
  'map.macro':          { zh: '宏观命格层', en: 'Macro Fate Layer' },
  'map.meso':           { zh: '中观事件层', en: 'Meso Event Layer' },
  'map.micro':          { zh: '微观日常层', en: 'Micro Daily Layer' },
  'map.grade':          { zh: '命格评级', en: 'Fate Grade' },
  'map.turning_point':  { zh: '转折点', en: 'Turning Point' },
  'map.peak':           { zh: '运势高峰', en: 'Peak' },
  'map.valley':         { zh: '运势低谷', en: 'Valley' },

  // ── Language ──
  'lang.zh':            { zh: '中文', en: '中文' },
  'lang.en':            { zh: 'English', en: 'English' },
  'lang.switch':        { zh: '切换语言', en: 'Switch Language' },

  // ── Footer ──
  'footer.powered_by':  { zh: '由 H-Pulse 量子引擎驱动', en: 'Powered by H-Pulse Quantum Engine' },

  // ── Trends ──
  'trend.ascending':    { zh: '上升', en: 'Ascending' },
  'trend.peak':         { zh: '巅峰', en: 'Peak' },
  'trend.stable':       { zh: '稳定', en: 'Stable' },
  'trend.declining':    { zh: '下降', en: 'Declining' },
  'trend.turbulent':    { zh: '动荡', en: 'Turbulent' },

  // ── Death Causes ──
  'death.natural_aging':   { zh: '善终', en: 'Natural' },
  'death.illness':         { zh: '疾病', en: 'Illness' },
  'death.accident':        { zh: '意外', en: 'Accident' },
  'death.violence':        { zh: '暴力', en: 'Violence' },
  'death.sudden':          { zh: '猝死', en: 'Sudden' },
  'death.lifespan_limit':  { zh: '寿限', en: 'Lifespan Limit' },
} as const;

export type TranslationKey = keyof typeof translations;

// ═══════════════════════════════════════════════
// Helper Maps (for engine/config code)
// ═══════════════════════════════════════════════

export const ENGINE_LABELS: Record<string, { zh: string; en: string }> = {
  tieban: { zh: '铁板神数', en: 'Iron Plate' },
  bazi: { zh: '八字命理', en: 'BaZi' },
  ziwei: { zh: '紫微斗数', en: 'Ziwei Doushu' },
  liuyao: { zh: '六爻卦象', en: 'Liu Yao' },
  western: { zh: '西方占星', en: 'Western Astrology' },
  vedic: { zh: '吠陀占星', en: 'Vedic Astrology' },
  numerology: { zh: '数字命理', en: 'Numerology' },
  mayan: { zh: '玛雅历法', en: 'Mayan Calendar' },
  kabbalah: { zh: '卡巴拉', en: 'Kabbalah' },
  meihua: { zh: '梅花易数', en: 'Meihua Yishu' },
  qimen: { zh: '奇门遁甲', en: 'Qimen Dunjia' },
  liuren: { zh: '大六壬', en: 'Da Liu Ren' },
  taiyi: { zh: '太乙神数', en: 'Taiyi Shenshu' },
};

export const LIFE_STAGE_LABELS: Record<string, { zh: string; en: string }> = {
  '童年期': { zh: '童年期 (0-12)', en: 'Childhood (0-12)' },
  '青年期': { zh: '青年期 (13-22)', en: 'Youth (13-22)' },
  '壮年期': { zh: '壮年期 (23-35)', en: 'Prime (23-35)' },
  '中年期': { zh: '中年期 (36-50)', en: 'Midlife (36-50)' },
  '壮暮期': { zh: '壮暮期 (51-65)', en: 'Mature (51-65)' },
  '晚年期': { zh: '晚年期 (66+)', en: 'Elderly (66+)' },
};

export const DIMENSION_LABELS: Record<string, { zh: string; en: string }> = {
  life: { zh: '命运·事业', en: 'Life & Career' },
  wealth: { zh: '财富', en: 'Wealth' },
  relation: { zh: '人际·情感', en: 'Relationships' },
  health: { zh: '健康', en: 'Health' },
  wisdom: { zh: '智慧·创造', en: 'Wisdom' },
  spirit: { zh: '灵性', en: 'Spirituality' },
};

export const EVENT_TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  romance: { zh: '感情婚姻', en: 'Romance' },
  career: { zh: '事业财运', en: 'Career' },
  health: { zh: '健康医疗', en: 'Health' },
  migration: { zh: '出行迁移', en: 'Travel' },
  education: { zh: '学业考试', en: 'Education' },
  social: { zh: '人际关系', en: 'Social' },
  crisis: { zh: '危机意外', en: 'Crisis' },
  decision: { zh: '重大决策', en: 'Decision' },
};

// ═══════════════════════════════════════════════
// React Context
// ═══════════════════════════════════════════════

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  /** Get engine label by engine name */
  engineLabel: (engineName: string) => string;
  /** Get dimension label */
  dimLabel: (dim: string) => string;
  /** Get life stage label */
  stageLabel: (stage: string) => string;
  /** Get event type label */
  eventLabel: (eventType: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'hpulse-lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'zh') return stored;
    } catch { /* SSR safe */ }
    return 'zh';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch { /* SSR safe */ }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'zh' ? 'en' : 'zh');
  }, [lang, setLang]);

  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.zh ?? key;
  }, [lang]);

  const engineLabel = useCallback((engineName: string): string => {
    return ENGINE_LABELS[engineName]?.[lang] ?? engineName;
  }, [lang]);

  const dimLabel = useCallback((dim: string): string => {
    return DIMENSION_LABELS[dim]?.[lang] ?? dim;
  }, [lang]);

  const stageLabel = useCallback((stage: string): string => {
    return LIFE_STAGE_LABELS[stage]?.[lang] ?? stage;
  }, [lang]);

  const eventLabel = useCallback((eventType: string): string => {
    return EVENT_TYPE_LABELS[eventType]?.[lang] ?? eventType;
  }, [lang]);

  const value: I18nContextValue = {
    lang, setLang, toggleLang, t,
    engineLabel, dimLabel, stageLabel, eventLabel,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/**
 * Non-hook helper for use in non-React code (config files, utils).
 * Returns label for given language.
 */
export function getLabel(map: Record<string, { zh: string; en: string }>, key: string, lang: Language): string {
  return map[key]?.[lang] ?? key;
}
