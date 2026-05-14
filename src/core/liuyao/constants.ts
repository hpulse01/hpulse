/**
 * P4.5 — Liu Yao constants. Pure data tables.
 */

import type { FiveElement, SixRelative, SixSpirit, WangShuai, YongShenCategory } from './types';

export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export const BRANCH_ELEMENTS: Record<string, FiveElement> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

export const STEM_ELEMENTS: Record<string, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

export const WUXING_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
export const WUXING_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
};

/** 六冲：地支正对冲。 */
export const BRANCH_CHONG: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

/** 六合 (六合化局)。 */
export const BRANCH_HE: Record<string, string> = {
  '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳', '午': '未', '未': '午',
};

/** 三刑：寅巳申 / 丑戌未 / 子卯 / 辰午酉亥自刑。简化映射。 */
export const BRANCH_XING: Record<string, string[]> = {
  '寅': ['巳', '申'], '巳': ['寅', '申'], '申': ['寅', '巳'],
  '丑': ['戌', '未'], '戌': ['丑', '未'], '未': ['丑', '戌'],
  '子': ['卯'], '卯': ['子'],
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],
};

/** 相害：子未 / 丑午 / 寅巳 / 卯辰 / 申亥 / 酉戌。 */
export const BRANCH_HAI: Record<string, string> = {
  '子': '未', '未': '子', '丑': '午', '午': '丑',
  '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯',
  '申': '亥', '亥': '申', '酉': '戌', '戌': '酉',
};

/** 月建旺衰：行在各月令的旺/相/休/囚/死。 */
export const MONTHLY_STRENGTH: Record<string, Record<FiveElement, WangShuai>> = {
  '寅': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '卯': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '巳': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '午': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '辰': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '戌': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '丑': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '未': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '申': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '酉': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '亥': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
  '子': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
};

/** 旬空表：日干支 → 该旬旬空地支 (60甲子 / 6 旬)。 */
export const XUN_KONG_TABLE: { stems: string[]; voids: [string, string] }[] = [
  // 甲子旬 (甲子→癸酉) 旬空: 戌亥
  { stems: ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉'], voids: ['戌','亥'] },
  // 甲戌旬
  { stems: ['甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未'], voids: ['申','酉'] },
  // 甲申旬
  { stems: ['甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳'], voids: ['午','未'] },
  // 甲午旬
  { stems: ['甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯'], voids: ['辰','巳'] },
  // 甲辰旬
  { stems: ['甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑'], voids: ['寅','卯'] },
  // 甲寅旬
  { stems: ['甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'], voids: ['子','丑'] },
];

/** 六神排布：日干起爻 1。 */
export const SIX_SPIRITS_BY_STEM: Record<string, SixSpirit[]> = {
  '甲': ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
  '乙': ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
  '丙': ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
  '丁': ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
  '戊': ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'],
  '己': ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'],
  '庚': ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
  '辛': ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
  '壬': ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'],
  '癸': ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'],
};

/** 六亲生克映射 (五行→六亲: 同我兄弟, 我生子孙, 生我父母, 我克妻财, 克我官鬼)。 */
export function getSixRelative(palaceElement: FiveElement, branchElement: FiveElement): SixRelative {
  if (palaceElement === branchElement) return '兄弟';
  if (WUXING_SHENG[palaceElement] === branchElement) return '子孙';
  if (WUXING_SHENG[branchElement] === palaceElement) return '父母';
  if (WUXING_KE[palaceElement] === branchElement) return '妻财';
  return '官鬼'; // WUXING_KE[branchElement] === palaceElement
}

export const RELATIVE_SHENG: Record<SixRelative, SixRelative> = {
  '父母': '官鬼', '官鬼': '兄弟', '兄弟': '子孙', '子孙': '妻财', '妻财': '父母',
};
export const RELATIVE_KE: Record<SixRelative, SixRelative> = {
  '父母': '子孙', '子孙': '官鬼', '官鬼': '兄弟', '兄弟': '妻财', '妻财': '父母',
};

/** 用神选取规则。 */
export const YONGSHEN_RULES: Record<YongShenCategory, { yongShen: SixRelative; description: string }> = {
  '财运': { yongShen: '妻财', description: '测财以妻财为用神。' },
  '事业': { yongShen: '官鬼', description: '测事业官职以官鬼为用神。' },
  '学业': { yongShen: '父母', description: '测学业文书以父母为用神。' },
  '婚姻': { yongShen: '妻财', description: '男测妻以妻财为用神（女测夫则取官鬼）。' },
  '健康': { yongShen: '官鬼', description: '测疾病以官鬼为用神 (病象)。' },
  '子女': { yongShen: '子孙', description: '测子嗣以子孙为用神。' },
  '出行': { yongShen: '父母', description: '测出行以父母为用神（车船道路之象）。' },
  '诉讼': { yongShen: '官鬼', description: '测诉讼公门以官鬼为用神。' },
  '综合': { yongShen: '兄弟', description: '综合泛测以世爻六亲参考；此处默认取卦中世爻所属六亲。' },
};

/** Question-text → 用神 category keyword routing. */
export const QUESTION_KEYWORDS: { keywords: string[]; category: YongShenCategory }[] = [
  { keywords: ['财', '钱', '富', '收入', '投资', '生意'], category: '财运' },
  { keywords: ['工作', '事业', '升职', '官职', '岗位', '面试'], category: '事业' },
  { keywords: ['学', '考试', '文书', '论文', '学校'], category: '学业' },
  { keywords: ['婚', '恋', '配偶', '感情', '对象'], category: '婚姻' },
  { keywords: ['病', '健康', '医', '疾'], category: '健康' },
  { keywords: ['子', '孩子', '孕', '胎', '儿', '女'], category: '子女' },
  { keywords: ['出行', '旅', '远', '搬', '迁'], category: '出行' },
  { keywords: ['官司', '诉讼', '法', '案'], category: '诉讼' },
];
