/**
 * P4.8 — Liuren constants.
 */
import type { BranchCN, StemCN, MonthGeneral, TwelveDeity, FiveElement } from './types';

export const STEMS: readonly StemCN[] = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const BRANCHES: readonly BranchCN[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

export const BRANCH_ELEMENT: Record<BranchCN, FiveElement> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
  '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水',
};

export const STEM_ELEMENT: Record<StemCN, FiveElement> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水',
};

/** 五行相克: 木克土, 土克水, 水克火, 火克金, 金克木. */
export const ELEMENT_OVERCOMES: Record<FiveElement, FiveElement> = {
  '木':'土','土':'水','水':'火','火':'金','金':'木',
};

/** 月将名 → 地支 (太阳过宫). */
export const MONTH_GENERAL_BRANCH: Record<MonthGeneral, BranchCN> = {
  '神后':'子','大吉':'丑','功曹':'寅','太冲':'卯','天罡':'辰','太乙':'巳',
  '胜光':'午','小吉':'未','传送':'申','从魁':'酉','河魁':'戌','登明':'亥',
};

export const BRANCH_TO_GENERAL: Record<BranchCN, MonthGeneral> = (() => {
  const out = {} as Record<BranchCN, MonthGeneral>;
  for (const [g, b] of Object.entries(MONTH_GENERAL_BRANCH)) out[b as BranchCN] = g as MonthGeneral;
  return out;
})();

/**
 * 月将切换以「中气」为界 (传统六壬). 中气 → 月将 branch.
 *   雨水→亥(登明), 春分→戌(河魁), 谷雨→酉, 小满→申, 夏至→未,
 *   大暑→午, 处暑→巳, 秋分→辰, 霜降→卯, 小雪→寅,
 *   冬至→丑, 大寒→子.
 */
export const MID_TERM_TO_GENERAL_BRANCH: Record<string, BranchCN> = {
  '雨水':'亥','春分':'戌','谷雨':'酉','小满':'申','夏至':'未','大暑':'午',
  '处暑':'巳','秋分':'辰','霜降':'卯','小雪':'寅','冬至':'丑','大寒':'子',
};

export const MID_TERMS_ORDERED: readonly string[] = [
  '冬至','大寒','雨水','春分','谷雨','小满','夏至','大暑','处暑','秋分','霜降','小雪',
];

/** 干 → 寄宫 (六壬通用：戊寄巳). */
export const DAY_STEM_PALACE: Record<StemCN, BranchCN> = {
  '甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳',
  '己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑',
};

/**
 * 贵人起例 (昼贵 / 夜贵)。
 * 昼贵: 甲戊庚牛羊(丑未昼=丑), 乙己鼠猴(子申昼=子), 丙丁猪鸡(亥酉昼=亥),
 *       六辛逢马虎(午寅昼=寅), 壬癸蛇与兔(巳卯昼=卯).
 * 通行歌诀（昼/夜）：
 *   甲戊兼牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎，此是贵人方。
 *   左行为昼贵，右行为夜贵。
 */
export const NOBLE_PERSON_DAY: Record<StemCN, BranchCN> = {
  '甲':'丑','戊':'丑','庚':'丑',
  '乙':'子','己':'子',
  '丙':'亥','丁':'亥',
  '辛':'寅',
  '壬':'卯','癸':'卯',
};
export const NOBLE_PERSON_NIGHT: Record<StemCN, BranchCN> = {
  '甲':'未','戊':'未','庚':'未',
  '乙':'申','己':'申',
  '丙':'酉','丁':'酉',
  '辛':'午',
  '壬':'巳','癸':'巳',
};

/**
 * 十二天将顺序（贵人起，贵人在地盘亥子丑寅卯辰为顺布；午未申酉戌为逆布）。
 */
export const DEITY_ORDER: readonly TwelveDeity[] = [
  '贵人','腾蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后',
];
