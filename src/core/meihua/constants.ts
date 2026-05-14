/**
 * P4.6 — Meihua constants. 先天八卦数 + 五行 + 64 卦命名表。
 */
import type { Trigram, FiveElement, TrigramName } from './types';

/** 先天八卦：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8 (Shao Yong)。bits = [bottom, mid, top]. */
export const TRIGRAMS: Trigram[] = [
  { index: 0, preHeavenNumber: 1, name: '乾', element: '金', bits: [1, 1, 1], attribute: '天' },
  { index: 1, preHeavenNumber: 2, name: '兑', element: '金', bits: [1, 1, 0], attribute: '泽' },
  { index: 2, preHeavenNumber: 3, name: '离', element: '火', bits: [1, 0, 1], attribute: '火' },
  { index: 3, preHeavenNumber: 4, name: '震', element: '木', bits: [1, 0, 0], attribute: '雷' },
  { index: 4, preHeavenNumber: 5, name: '巽', element: '木', bits: [0, 1, 1], attribute: '风' },
  { index: 5, preHeavenNumber: 6, name: '坎', element: '水', bits: [0, 1, 0], attribute: '水' },
  { index: 6, preHeavenNumber: 7, name: '艮', element: '土', bits: [0, 0, 1], attribute: '山' },
  { index: 7, preHeavenNumber: 8, name: '坤', element: '土', bits: [0, 0, 0], attribute: '地' },
];

export const TRIGRAM_BY_PREHEAVEN: Record<number, Trigram> = TRIGRAMS.reduce(
  (m, t) => { m[t.preHeavenNumber] = t; return m; },
  {} as Record<number, Trigram>,
);

export const TRIGRAM_BY_NAME: Record<TrigramName, Trigram> = TRIGRAMS.reduce(
  (m, t) => { m[t.name] = t; return m; },
  {} as Record<TrigramName, Trigram>,
);

/** 五行生克。 */
export const ELEMENT_GENERATES: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};
export const ELEMENT_OVERCOMES: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

/** 地支序：用于年月日时起卦中"时"的取数（子=1 ... 亥=12）。 */
export const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;

/**
 * 64 卦命名表 — key = `${upper}_${lower}`（外卦在上，内卦在下）。
 * 数据为传统《周易》卦名。
 */
export const HEXAGRAM_NAMES: Record<string, string> = {
  '乾_乾': '乾为天', '乾_兑': '天泽履', '乾_离': '天火同人', '乾_震': '天雷无妄',
  '乾_巽': '天风姤',  '乾_坎': '天水讼',  '乾_艮': '天山遁',   '乾_坤': '天地否',
  '兑_乾': '泽天夬', '兑_兑': '兑为泽', '兑_离': '泽火革',   '兑_震': '泽雷随',
  '兑_巽': '泽风大过','兑_坎': '泽水困', '兑_艮': '泽山咸',   '兑_坤': '泽地萃',
  '离_乾': '火天大有','离_兑': '火泽睽', '离_离': '离为火',   '离_震': '火雷噬嗑',
  '离_巽': '火风鼎', '离_坎': '火水未济','离_艮': '火山旅',   '离_坤': '火地晋',
  '震_乾': '雷天大壮','震_兑': '雷泽归妹','震_离': '雷火丰',  '震_震': '震为雷',
  '震_巽': '雷风恒', '震_坎': '雷水解', '震_艮': '雷山小过', '震_坤': '雷地豫',
  '巽_乾': '风天小畜','巽_兑': '风泽中孚','巽_离': '风火家人','巽_震': '风雷益',
  '巽_巽': '巽为风', '巽_坎': '风水涣', '巽_艮': '风山渐',   '巽_坤': '风地观',
  '坎_乾': '水天需', '坎_兑': '水泽节', '坎_离': '水火既济', '坎_震': '水雷屯',
  '坎_巽': '水风井', '坎_坎': '坎为水', '坎_艮': '水山蹇',   '坎_坤': '水地比',
  '艮_乾': '山天大畜','艮_兑': '山泽损', '艮_离': '山火贲',   '艮_震': '山雷颐',
  '艮_巽': '山风蛊', '艮_坎': '山水蒙', '艮_艮': '艮为山',   '艮_坤': '山地剥',
  '坤_乾': '地天泰', '坤_兑': '地泽临', '坤_离': '地火明夷', '坤_震': '地雷复',
  '坤_巽': '地风升', '坤_坎': '地水师', '坤_艮': '地山谦',   '坤_坤': '坤为地',
};
