/**
 * P4.2 — BaZi canonical constants.
 *
 * Re-exports primary tables from `src/core/calendar/ganzhi` and adds
 * tables specific to BaZi analysis: 月干起法 (五虎遁), 时干起法 (五鼠遁),
 * 六合 / 六冲 / 三合 / 三会 / 刑害破, 十二长生, 五行生克, 纳音, etc.
 *
 * No randomness. Tables are deterministic and exhaustive.
 */

export {
  STEMS, BRANCHES, ZODIAC,
  STEM_ELEMENT, STEM_YINYANG,
  BRANCH_ELEMENT, BRANCH_YINYANG,
  HIDDEN_STEMS,
  sixtyJiazi, jiaziIndex, makePillar, parseGanzhi, voidBranches,
} from '../calendar/ganzhi';
export type { Stem, Branch, Element, YinYang, Pillar } from '../calendar/ganzhi';

export { NAYIN_TABLE, nayinOf } from '../calendar/nayin';
export { tenGodOf } from '../calendar/tenGods';
export type { TenGod } from '../calendar/tenGods';
export { ELEMENTS, generates, controls, relation } from '../calendar/wuxing';

import type { Stem, Branch } from '../calendar/ganzhi';

/** 地支六合 (Branch six-combinations). */
export const BRANCH_LIUHE: Record<Branch, Branch> = {
  子: '丑', 丑: '子',
  寅: '亥', 亥: '寅',
  卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰',
  巳: '申', 申: '巳',
  午: '未', 未: '午',
};

/** 地支六冲 (Branch six-clashes — 180° opposite). */
export const BRANCH_LIUCHONG: Record<Branch, Branch> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
};

/** 地支三合 (Branch three-harmonies, by element). */
export const BRANCH_SANHE: Record<'木' | '火' | '金' | '水', [Branch, Branch, Branch]> = {
  水: ['申', '子', '辰'],
  木: ['亥', '卯', '未'],
  火: ['寅', '午', '戌'],
  金: ['巳', '酉', '丑'],
};

/** 地支三会 (Branch three-meetings, by direction-element). */
export const BRANCH_SANHUI: Record<'木' | '火' | '金' | '水', [Branch, Branch, Branch]> = {
  木: ['寅', '卯', '辰'],
  火: ['巳', '午', '未'],
  金: ['申', '酉', '戌'],
  水: ['亥', '子', '丑'],
};

/** 地支相刑 (Branch punishments — partial canonical set). */
export const BRANCH_XING: ReadonlyArray<readonly [Branch, Branch]> = [
  ['寅', '巳'], ['巳', '申'], ['申', '寅'],   // 无恩之刑
  ['丑', '戌'], ['戌', '未'], ['未', '丑'],   // 恃势之刑
  ['子', '卯'],                                // 无礼之刑
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'], // 自刑
];

/** 地支相害 (Branch harms). */
export const BRANCH_HAI: Record<Branch, Branch> = {
  子: '未', 未: '子',
  丑: '午', 午: '丑',
  寅: '巳', 巳: '寅',
  卯: '辰', 辰: '卯',
  申: '亥', 亥: '申',
  酉: '戌', 戌: '酉',
};

/** 地支相破 (Branch breaks). */
export const BRANCH_PO: Record<Branch, Branch> = {
  子: '酉', 酉: '子',
  午: '卯', 卯: '午',
  申: '巳', 巳: '申',
  寅: '亥', 亥: '寅',
  辰: '丑', 丑: '辰',
  戌: '未', 未: '戌',
};

/**
 * 五虎遁 — month stem from year stem.
 *
 * For a given year stem, the stem of 寅月 is given by the table; subsequent
 * months advance one stem each. Index by year stem → 寅月 stem.
 *
 *   甲己年 起 丙寅
 *   乙庚年 起 戊寅
 *   丙辛年 起 庚寅
 *   丁壬年 起 壬寅
 *   戊癸年 起 甲寅
 */
export const YEAR_STEM_TO_YIN_MONTH_STEM: Record<Stem, Stem> = {
  甲: '丙', 己: '丙',
  乙: '戊', 庚: '戊',
  丙: '庚', 辛: '庚',
  丁: '壬', 壬: '壬',
  戊: '甲', 癸: '甲',
};

/**
 * 五鼠遁 — hour stem from day stem.
 *
 *   甲己日 起 甲子时
 *   乙庚日 起 丙子时
 *   丙辛日 起 戊子时
 *   丁壬日 起 庚子时
 *   戊癸日 起 壬子时
 */
export const DAY_STEM_TO_ZI_HOUR_STEM: Record<Stem, Stem> = {
  甲: '甲', 己: '甲',
  乙: '丙', 庚: '丙',
  丙: '戊', 辛: '戊',
  丁: '庚', 壬: '庚',
  戊: '壬', 癸: '壬',
};

/**
 * 十二长生 — for each stem, the branch where it enters 长生.
 *
 * 阳干 forward, 阴干 backward through the 12 branches.
 *
 *   甲长生在亥, 乙长生在午, 丙戊长生在寅, 丁己长生在酉,
 *   庚长生在巳, 辛长生在子, 壬长生在申, 癸长生在卯.
 */
export const TWELVE_STAGE_START: Record<Stem, Branch> = {
  甲: '亥', 乙: '午',
  丙: '寅', 丁: '酉',
  戊: '寅', 己: '酉',
  庚: '巳', 辛: '子',
  壬: '申', 癸: '卯',
};

export const TWELVE_STAGE_NAMES = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰',
  '病', '死', '墓', '绝', '胎', '养',
] as const;
