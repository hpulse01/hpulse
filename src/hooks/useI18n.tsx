/**
 * H-Pulse Internationalization (i18n) System v2.0
 * 
 * Full Chinese/English bilingual support for all UI components.
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'zh' | 'en';

// ═══════════════════════════════════════════════
// Translation Dictionary
// ═══════════════════════════════════════════════

const translations: Record<string, { zh: string; en: string }> = {
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

  // ── Fate Dimensions (10D) ──
  'dim.life':          { zh: '命运·事业', en: 'Life & Career' },
  'dim.wealth':        { zh: '财富', en: 'Wealth' },
  'dim.relation':      { zh: '人际·情感', en: 'Relationships' },
  'dim.health':        { zh: '健康', en: 'Health' },
  'dim.wisdom':        { zh: '智慧·创造', en: 'Wisdom & Creativity' },
  'dim.spirit':        { zh: '灵性', en: 'Spirituality' },
  'dim.socialStatus':  { zh: '社会地位', en: 'Social Status' },
  'dim.creativity':    { zh: '创造力', en: 'Creativity' },
  'dim.luck':          { zh: '运势', en: 'Fortune & Luck' },
  'dim.homeStability': { zh: '家庭和谐', en: 'Home Stability' },

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
  'ui.initializing_sub':       { zh: '十三大引擎分析启动', en: 'Multi-Engine Analysis Starting' },
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
  'tab.engines':        { zh: '引擎贡献', en: 'Engines' },
  'tab.tree':           { zh: '命运树', en: 'Destiny Tree' },
  'tab.path':           { zh: '唯一路径', en: 'Unique Path' },
  'tab.destiny':        { zh: '铁板命盘', en: 'Iron Plate' },
  'tab.quantum':        { zh: '量子全知', en: 'Quantum' },
  'tab.orchestration':  { zh: '统一编排', en: 'Orchestration' },

  // ── Disclaimer ──
  'disclaimer.title':   { zh: '免责声明', en: 'Disclaimer' },
  'disclaimer.text':    { zh: '所有推算结果均基于传统命理数学模型，仅供文化研究与个人兴趣参考，不构成任何科学预测、医疗建议、投资建议或人生指导。请以理性科学态度看待结果，重大决策请咨询专业人士。',
                          en: 'All predictions are based on traditional metaphysical mathematical models, for cultural research and personal interest only. They do not constitute scientific predictions, medical advice, investment advice, or life guidance.' },

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
  'footer.desc':        { zh: '十三大命理体系量子预测', en: '13-Engine Quantum Destiny Prediction' },

  // ── Trends ──
  'trend.ascending':    { zh: '上升', en: 'Ascending' },
  'trend.peak':         { zh: '巅峰', en: 'Peak' },
  'trend.stable':       { zh: '稳定', en: 'Stable' },
  'trend.declining':    { zh: '下降', en: 'Declining' },
  'trend.turbulent':    { zh: '动荡', en: 'Turbulent' },
  'trend.rising':       { zh: '上升', en: 'Rising' },

  // ── Death Causes ──
  'death.natural_aging':   { zh: '善终', en: 'Natural' },
  'death.illness':         { zh: '疾病', en: 'Illness' },
  'death.accident':        { zh: '意外', en: 'Accident' },
  'death.violence':        { zh: '暴力', en: 'Violence' },
  'death.sudden':          { zh: '猝死', en: 'Sudden' },
  'death.lifespan_limit':  { zh: '寿限', en: 'Lifespan Limit' },

  // ── PredictionOverview ──
  'overview.confidence':      { zh: '置信度', en: 'Confidence' },
  'overview.active_engines':  { zh: '活跃引擎', en: 'Active' },
  'overview.natal':           { zh: '本命', en: 'Natal' },
  'overview.instant':         { zh: '即时', en: 'Instant' },
  'overview.conflicts':       { zh: '冲突', en: 'Conflicts' },
  'overview.failed':          { zh: '失败', en: 'Failed' },
  'overview.fused_vector':    { zh: '融合命运向量', en: 'Fused Fate Vector' },
  'overview.natal_engines':   { zh: '本命引擎', en: 'Natal Engines' },
  'overview.natal_desc':      { zh: '基于出生', en: 'Birth-based' },
  'overview.instant_engines': { zh: '即时引擎', en: 'Instant Engines' },
  'overview.instant_desc':    { zh: '基于测算时间', en: 'Query-time based' },

  // ── EngineContributionPanel ──
  'engine_panel.title':       { zh: '引擎贡献层', en: 'Engine Contribution Layer' },
  'engine_panel.natal_label': { zh: '本命', en: 'Natal' },
  'engine_panel.instant_label': { zh: '即时', en: 'Instant' },
  'engine_panel.mixed_label': { zh: '混合', en: 'Mixed' },
  'engine_panel.fate_vector': { zh: '命运向量', en: 'Fate Vector' },
  'engine_panel.key_outputs': { zh: '关键输出', en: 'Key Outputs' },

  // ── DestinyTreeLayer ──
  'tree.recursive_tree':     { zh: '递归命运树', en: 'Recursive Destiny Tree' },
  'tree.nodes':              { zh: '节点', en: 'Nodes' },
  'tree.paths':              { zh: '路径', en: 'Paths' },
  'tree.depth':              { zh: '深度', en: 'Depth' },
  'tree.turning_points':     { zh: '转折', en: 'Turns' },
  'tree.lifespan':           { zh: '寿命', en: 'Lifespan' },
  'tree.main_path':          { zh: '主路径', en: 'Main Path' },
  'tree.rejected':           { zh: '被拒支线', en: 'Rejected' },
  'tree.terminus':           { zh: '终局', en: 'Terminus' },
  'tree.audit':              { zh: '审计', en: 'Audit' },
  'tree.collapse_path':      { zh: '坍缩路径', en: 'Collapsed Path' },
  'tree.no_rejected':        { zh: '命运路径高度确定，无显著被拒支线', en: 'Destiny path highly determined, no significant rejected branches' },
  'tree.fork_at':            { zh: '岁分叉', en: ' fork' },
  'tree.terminus_title':     { zh: '终局判定', en: 'Terminus Determination' },
  'tree.death_cause':        { zh: '死因', en: 'Cause' },
  'tree.death_fusion':       { zh: '死亡候选融合', en: 'Death Candidate Fusion' },
  'tree.strong_candidates':  { zh: '强候选', en: 'Strong Candidates' },
  'tree.weak_candidates':    { zh: '弱候选', en: 'Weak Candidates' },
  'tree.dominant_engines':   { zh: '主导引擎', en: 'Dominant Engines' },
  'tree.selection_reason':   { zh: '选择理由', en: 'Selection Reason' },
  'tree.conflict_resolution': { zh: '冲突解决', en: 'Conflict Resolution' },
  'tree.collapse_reasoning': { zh: '坍缩推理', en: 'Collapse Reasoning' },
  'tree.final_summary':      { zh: '命运总评', en: 'Destiny Summary' },
  'tree.collapse_desc':      { zh: '由 {paths} 条命运路径坍缩为唯一确定态，终止于 {age} 岁（{cause}），置信度 {confidence}%。',
                               en: 'Collapsed from {paths} destiny paths to one determined state, ending at age {age} ({cause}), confidence {confidence}%.' },

  // ── UniquePathLayer ──
  'path.unique_path':        { zh: '唯一命运路径', en: 'Unique Destiny Path' },
  'path.nodes':              { zh: '节点', en: 'Nodes' },
  'path.turning_points':     { zh: '转折', en: 'Turns' },
  'path.terminus':           { zh: '终局', en: 'Terminus' },
  'path.considered':         { zh: '路径', en: 'Paths' },
  'path.key_turns':          { zh: '关键转折', en: 'Key Turning Points' },
  'path.full_timeline':      { zh: '完整时间线', en: 'Full Timeline' },
  'path.life_summary':       { zh: '命运总评', en: 'Destiny Summary' },

  // ── UnifiedQuantumPanel ──
  'quantum.omniscience':     { zh: '命运全知', en: 'Destiny Omniscience' },
  'quantum.states':          { zh: '量子态', en: 'Quantum States' },
  'quantum.waveform':        { zh: '能量波形', en: 'Energy Waveform' },
  'quantum.entangle':        { zh: '纠缠', en: 'Entanglement' },
  'quantum.ten_dim_field':   { zh: '十维量子态势场', en: '10-Dim Quantum Field' },
  'quantum.ten_dim_states':  { zh: '十维量子态', en: '10-Dim Quantum States' },
  'quantum.lifetime_wave':   { zh: '一生能量波形', en: 'Lifetime Energy Waveform' },
  'quantum.wave_desc':       { zh: '九大体系量子坍缩后的确定性能量曲线', en: 'Deterministic energy curve after 9-system quantum collapse' },
  'quantum.phase_energy':    { zh: '生命阶段能量', en: 'Life Phase Energy' },
  'quantum.entangle_map':    { zh: '量子纠缠图', en: 'Quantum Entanglement Map' },
  'quantum.dim_correlation': { zh: '维度关联', en: 'Dimensional Correlations' },
  'quantum.resonance':       { zh: '系共振', en: ' resonance' },
  'quantum.expand_all':      { zh: '展开全部', en: 'Expand all' },
  'quantum.events':          { zh: '个事件', en: ' events' },

  // ── BirthDataForm ──
  'form.title':              { zh: '输入生辰', en: 'Birth Data' },
  'form.desc':               { zh: '搜索出生地自动解析经纬度与时区', en: 'Search birthplace to auto-resolve coordinates & timezone' },
  'form.birth_date':         { zh: '出生日期', en: 'Birth Date' },
  'form.birth_time':         { zh: '出生时间', en: 'Birth Time' },
  'form.year':               { zh: '年', en: 'Year' },
  'form.month':              { zh: '月', en: 'Month' },
  'form.day':                { zh: '日', en: 'Day' },
  'form.hour':               { zh: '时', en: 'Hour' },
  'form.minute':             { zh: '分', en: 'Min' },
  'form.chinese_hour':       { zh: '时辰', en: 'Chinese Hour' },
  'form.gender':             { zh: '性别', en: 'Gender' },
  'form.male':               { zh: '乾命 (男)', en: 'Male (乾)' },
  'form.female':             { zh: '坤命 (女)', en: 'Female (坤)' },
  'form.submit':             { zh: '起 盘 考 刻', en: 'Begin Analysis' },
  'form.loading':            { zh: '推算中...', en: 'Calculating...' },
  'form.lat':                { zh: '纬', en: 'Lat' },
  'form.lng':                { zh: '经', en: 'Lng' },
  'form.manual_coords':      { zh: '手动修正坐标与时区', en: 'Manual coordinate & timezone correction' },
  'form.latitude':           { zh: '纬度', en: 'Latitude' },
  'form.longitude':          { zh: '经度', en: 'Longitude' },
  'form.tz_offset':          { zh: '时区偏移(分)', en: 'TZ Offset (min)' },
  'form.lat_error':          { zh: '纬度必须在 -90 到 90 之间', en: 'Latitude must be between -90 and 90' },
  'form.lng_error':          { zh: '经度必须在 -180 到 180 之间', en: 'Longitude must be between -180 and 180' },
  'form.tz_error':           { zh: '时区偏移必须在 -720 到 840 分钟之间', en: 'Timezone offset must be between -720 and 840 minutes' },

  // ── SixRelationsVerification ──
  'verify.title':            { zh: '六亲考刻', en: 'Family Verification' },
  'verify.subtitle':         { zh: '父母兄弟实况', en: 'Parents & Siblings Data' },
  'verify.instruction':      { zh: '铁板神数以六亲校验定时辰刻分。请如实填写父母生肖及现况，系统将从古籍数据库中检索最详尽的命批条文。',
                               en: 'The Iron Plate system uses family data to calibrate exact birth quarter. Please truthfully enter parents\' zodiacs and status.' },
  'verify.father_zodiac':    { zh: '父亲生肖', en: 'Father\'s Zodiac' },
  'verify.mother_zodiac':    { zh: '母亲生肖', en: 'Mother\'s Zodiac' },
  'verify.parents_status':   { zh: '父母现况', en: 'Parents\' Status' },
  'verify.siblings':         { zh: '同气连枝', en: 'Siblings Count' },
  'verify.calibrate':        { zh: '考刻校验', en: 'Calibrate' },
  'verify.calibrating':      { zh: '检索中...', en: 'Searching...' },
  'verify.select_father':    { zh: '请选择父亲生肖...', en: 'Select father\'s zodiac...' },
  'verify.select_mother':    { zh: '请选择母亲生肖...', en: 'Select mother\'s zodiac...' },
  'verify.both_alive':       { zh: '乾坤并在', en: 'Both Alive' },
  'verify.father_deceased':  { zh: '乾宫先损', en: 'Father Passed' },
  'verify.mother_deceased':  { zh: '坤宫先损', en: 'Mother Passed' },
  'verify.both_deceased':    { zh: '双亲已故', en: 'Both Passed' },
  'verify.confirm':          { zh: '确认定刻', en: 'Confirm Selection' },
  'verify.manual_search':    { zh: '手动检索', en: 'Manual Search' },
  'verify.manual_hint':      { zh: '智能检索：输入任意家庭信息', en: 'Smart search: enter any family information' },
  'verify.search':           { zh: '搜索', en: 'Search' },
  'verify.anchor':           { zh: '以此定局', en: 'Anchor' },
  'verify.match_results':    { zh: '匹配结果', en: 'Match Results' },
  'verify.candidate':        { zh: '候选', en: 'Candidate' },
  'verify.perfect_match':    { zh: '双亲全匹', en: 'Full Match' },
  'verify.siblings_match':   { zh: '兄弟匹配', en: 'Siblings Match' },
  'verify.critical_years':   { zh: '关键流年', en: 'Critical Years' },
  'verify.clause_num':       { zh: '条文号', en: 'Clause #' },

  // ── Intensity labels ──
  'intensity.minor':         { zh: '轻微', en: 'Minor' },
  'intensity.moderate':      { zh: '中等', en: 'Moderate' },
  'intensity.major':         { zh: '重大', en: 'Major' },
  'intensity.critical':      { zh: '关键', en: 'Critical' },
  'intensity.life_defining': { zh: '命定', en: 'Life-defining' },

  // ── Common ──
  'common.age':              { zh: '岁', en: ' yrs' },
  'common.year':             { zh: '年', en: '' },
  'common.loading':          { zh: '加载中...', en: 'Loading...' },
  'common.confidence':       { zh: '置信度', en: 'Confidence' },
};

export type TranslationKey = string;

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
  socialStatus: { zh: '社会地位', en: 'Social Status' },
  creativity: { zh: '创造力', en: 'Creativity' },
  luck: { zh: '运势', en: 'Fortune & Luck' },
  homeStability: { zh: '家庭和谐', en: 'Home Stability' },
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
  t: (key: string) => string;
  /** Template translation with {key} replacement */
  tt: (key: string, vars: Record<string, string | number>) => string;
  engineLabel: (engineName: string) => string;
  dimLabel: (dim: string) => string;
  stageLabel: (stage: string) => string;
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

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] ?? entry.zh ?? key;
  }, [lang]);

  const tt = useCallback((key: string, vars: Record<string, string | number>): string => {
    let text = t(key);
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return text;
  }, [t]);

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
    lang, setLang, toggleLang, t, tt,
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
 */
export function getLabel(map: Record<string, { zh: string; en: string }>, key: string, lang: Language): string {
  return map[key]?.[lang] ?? key;
}
