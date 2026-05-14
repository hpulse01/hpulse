/**
 * P4.5 — Liu Yao hexagram & palace tables.
 * 八宫纳甲、六十四卦命名、世应位置 — pure data.
 */

import type { FiveElement, Trigram } from './types';

/** 八经卦 (Trigrams), bits = [bottom, middle, top]. */
export const TRIGRAMS: Trigram[] = [
  { index: 0, name: '乾', element: '金', bits: [1, 1, 1] },
  { index: 1, name: '兑', element: '金', bits: [1, 1, 0] },
  { index: 2, name: '离', element: '火', bits: [1, 0, 1] },
  { index: 3, name: '震', element: '木', bits: [1, 0, 0] },
  { index: 4, name: '巽', element: '木', bits: [0, 1, 1] },
  { index: 5, name: '坎', element: '水', bits: [0, 1, 0] },
  { index: 6, name: '艮', element: '土', bits: [0, 0, 1] },
  { index: 7, name: '坤', element: '土', bits: [0, 0, 0] },
];

export function trigramFromBits(bits: [0|1, 0|1, 0|1]): Trigram {
  for (const t of TRIGRAMS) {
    if (t.bits[0] === bits[0] && t.bits[1] === bits[1] && t.bits[2] === bits[2]) return t;
  }
  return TRIGRAMS[7];
}

/** 八宫首卦 — 八纯卦 (six lines, bottom→top). */
export const EIGHT_PALACES: { name: string; element: FiveElement; lines: (0|1)[] }[] = [
  { name: '乾', element: '金', lines: [1, 1, 1, 1, 1, 1] },
  { name: '兑', element: '金', lines: [1, 1, 0, 1, 1, 0] },
  { name: '离', element: '火', lines: [1, 0, 1, 1, 0, 1] },
  { name: '震', element: '木', lines: [1, 0, 0, 1, 0, 0] },
  { name: '巽', element: '木', lines: [0, 1, 1, 0, 1, 1] },
  { name: '坎', element: '水', lines: [0, 1, 0, 0, 1, 0] },
  { name: '艮', element: '土', lines: [0, 0, 1, 0, 0, 1] },
  { name: '坤', element: '土', lines: [0, 0, 0, 0, 0, 0] },
];

/** 京房八宫世应位置：八纯→一世→二世→三世→四世→五世→游魂→归魂。 */
export const SHI_YING_TABLE: [number, number][] = [
  [6, 3], // 八纯卦
  [1, 4], // 一世卦
  [2, 5], // 二世卦
  [3, 6], // 三世卦
  [4, 1], // 四世卦
  [5, 2], // 五世卦
  [4, 1], // 游魂卦
  [3, 6], // 归魂卦
];

/** 纳甲表：八经卦的天干 + 三爻地支（内卦下三爻 / 外卦上三爻）。 */
export interface NaJiaEntry {
  innerStem: string;
  outerStem: string;
  innerBranches: [string, string, string]; // bottom→top of lower trigram
  outerBranches: [string, string, string]; // bottom→top of upper trigram
}

export const NA_JIA: Record<string, NaJiaEntry> = {
  '乾': { innerStem: '甲', outerStem: '壬', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'] },
  '坤': { innerStem: '乙', outerStem: '癸', innerBranches: ['未', '巳', '卯'], outerBranches: ['丑', '亥', '酉'] },
  '震': { innerStem: '庚', outerStem: '庚', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'] },
  '巽': { innerStem: '辛', outerStem: '辛', innerBranches: ['丑', '亥', '酉'], outerBranches: ['未', '巳', '卯'] },
  '坎': { innerStem: '戊', outerStem: '戊', innerBranches: ['寅', '辰', '午'], outerBranches: ['申', '戌', '子'] },
  '离': { innerStem: '己', outerStem: '己', innerBranches: ['卯', '丑', '亥'], outerBranches: ['酉', '未', '巳'] },
  '艮': { innerStem: '丙', outerStem: '丙', innerBranches: ['辰', '午', '申'], outerBranches: ['戌', '子', '寅'] },
  '兑': { innerStem: '丁', outerStem: '丁', innerBranches: ['巳', '卯', '丑'], outerBranches: ['亥', '酉', '未'] },
};

/** 64-hexagram name table indexed by `${lowerName}${upperName}` (lower 在下 / upper 在上). */
export const HEXAGRAM_64: Record<string, { name: string; description: string }> = {
  '乾乾': { name: '乾为天', description: '刚健中正，自强不息。' },
  '兑乾': { name: '天泽履', description: '履行正道，如履虎尾。' },
  '离乾': { name: '天火同人', description: '志同道合，与人和睦。' },
  '震乾': { name: '天雷无妄', description: '无妄真诚，不妄求取。' },
  '巽乾': { name: '天风姤', description: '邂逅相遇，阴生于下。' },
  '坎乾': { name: '天水讼', description: '争讼之事，戒慎谨慎。' },
  '艮乾': { name: '天山遁', description: '退避隐遁，远小人。' },
  '坤乾': { name: '天地否', description: '闭塞不通，否极泰来。' },
  '乾兑': { name: '泽天夬', description: '决断果敢，扬于王庭。' },
  '兑兑': { name: '兑为泽', description: '喜悦和谐，口舌言辞。' },
  '离兑': { name: '泽火革', description: '革故鼎新，变革更新。' },
  '震兑': { name: '泽雷随', description: '随时而动，顺从自然。' },
  '巽兑': { name: '泽风大过', description: '过度之象，矫枉过正。' },
  '坎兑': { name: '泽水困', description: '困穷窘迫，坚守正道。' },
  '艮兑': { name: '泽山咸', description: '感应相通，少男少女。' },
  '坤兑': { name: '泽地萃', description: '聚集荟萃，群贤毕至。' },
  '乾离': { name: '火天大有', description: '大有收获，丰盛富足。' },
  '兑离': { name: '火泽睽', description: '乖违悖异，睽而能合。' },
  '离离': { name: '离为火', description: '附丽光明，柔顺贞正。' },
  '震离': { name: '火雷噬嗑', description: '刑狱法制，明断是非。' },
  '巽离': { name: '火风鼎', description: '鼎立新意，稳固发展。' },
  '坎离': { name: '火水未济', description: '未济待渡，终则有始。' },
  '艮离': { name: '火山旅', description: '羁旅在外，谨慎小心。' },
  '坤离': { name: '火地晋', description: '光明上进，前途光明。' },
  '乾震': { name: '雷天大壮', description: '刚壮威严，慎勿过刚。' },
  '兑震': { name: '雷泽归妹', description: '归妹从兄，有所归依。' },
  '离震': { name: '雷火丰', description: '丰盛盈满，日中则昃。' },
  '震震': { name: '震为雷', description: '震惊百里，不丧匕鬯。' },
  '巽震': { name: '雷风恒', description: '恒久不变，持之以恒。' },
  '坎震': { name: '雷水解', description: '解除困难，缓和松懈。' },
  '艮震': { name: '雷山小过', description: '小有过越，飞鸟遗音。' },
  '坤震': { name: '雷地豫', description: '顺以动，和乐自得。' },
  '乾巽': { name: '风天小畜', description: '小有积蓄，密云不雨。' },
  '兑巽': { name: '风泽中孚', description: '诚信中正，信及豚鱼。' },
  '离巽': { name: '风火家人', description: '治家之道，正位于内。' },
  '震巽': { name: '风雷益', description: '增益补充，损上益下。' },
  '巽巽': { name: '巽为风', description: '风行地上，随风潜入。' },
  '坎巽': { name: '风水涣', description: '涣散离散，聚散有时。' },
  '艮巽': { name: '风山渐', description: '循序渐进，渐进有序。' },
  '坤巽': { name: '风地观', description: '观察审视，省察自身。' },
  '乾坎': { name: '水天需', description: '等待时机，饮食宴乐。' },
  '兑坎': { name: '水泽节', description: '节制适度，有节有度。' },
  '离坎': { name: '水火既济', description: '已济成功，守成防变。' },
  '震坎': { name: '水雷屯', description: '万物始生，艰难起步。' },
  '巽坎': { name: '水风井', description: '井养不穷，往来井井。' },
  '坎坎': { name: '坎为水', description: '坎陷重重，习坎不惧。' },
  '艮坎': { name: '水山蹇', description: '艰难险阻，知难而退。' },
  '坤坎': { name: '水地比', description: '亲附比邻，团结协作。' },
  '乾艮': { name: '山天大畜', description: '大有积蓄，厚积薄发。' },
  '兑艮': { name: '山泽损', description: '损己益人，损有益无。' },
  '离艮': { name: '山火贲', description: '文饰点缀，外美内实。' },
  '震艮': { name: '山雷颐', description: '养正之道，修身养性。' },
  '巽艮': { name: '山风蛊', description: '除旧布新，纠正弊病。' },
  '坎艮': { name: '山水蒙', description: '启蒙养正，教化育人。' },
  '艮艮': { name: '艮为山', description: '止于至善，静止安定。' },
  '坤艮': { name: '山地剥', description: '剥落消亡，谨慎守成。' },
  '乾坤': { name: '地天泰', description: '天地交泰，通达亨通。' },
  '兑坤': { name: '地泽临', description: '居临天下，惠泽万民。' },
  '离坤': { name: '地火明夷', description: '光明损伤，韬光养晦。' },
  '震坤': { name: '地雷复', description: '一阳来复，返本还原。' },
  '巽坤': { name: '地风升', description: '上升进取，积小成大。' },
  '坎坤': { name: '地水师', description: '师出以律，以正治众。' },
  '艮坤': { name: '地山谦', description: '谦虚受益，低调处世。' },
  '坤坤': { name: '坤为地', description: '厚德载物，柔顺利贞。' },
};

export function lookupHexagramName(lowerName: string, upperName: string): { name: string; description: string } {
  const key = `${lowerName}${upperName}`;
  return HEXAGRAM_64[key] ?? { name: `${upperName}${lowerName}卦`, description: '待解之卦。' };
}
