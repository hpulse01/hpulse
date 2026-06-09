/**
 * 调候用神 (climatic useful god) — classical table from 穷通宝鉴 / 韦千里《千里命稿》.
 *
 * Keyed by day-master stem × month branch → ordered list of recommended
 * useful-god stems (first = primary). Deterministic lookup, no heuristics.
 */

import type { Stem, Branch, Element } from '../calendar/ganzhi';
import { STEM_ELEMENT } from '../calendar/ganzhi';

type TiaohouTable = Record<Stem, Record<Branch, Stem[]>>;

const T = (s: string): Stem[] => s.split('') as Stem[];

export const TIAOHOU_TABLE: TiaohouTable = {
  甲: {
    寅: T('丙癸'), 卯: T('庚丙丁戊己'), 辰: T('庚丁壬'), 巳: T('癸庚丁'),
    午: T('癸庚丁'), 未: T('癸庚丁'), 申: T('庚丁壬'), 酉: T('庚丙丁'),
    戌: T('庚甲丁壬癸'), 亥: T('庚丁丙戊'), 子: T('丁庚丙'), 丑: T('丁庚丙'),
  },
  乙: {
    寅: T('丙癸'), 卯: T('丙癸'), 辰: T('癸丙戊'), 巳: T('癸'),
    午: T('癸丙'), 未: T('癸丙'), 申: T('丙癸己'), 酉: T('癸丙丁'),
    戌: T('癸辛'), 亥: T('丙戊'), 子: T('丙'), 丑: T('丙'),
  },
  丙: {
    寅: T('壬庚'), 卯: T('壬己'), 辰: T('壬甲'), 巳: T('壬庚癸'),
    午: T('壬庚'), 未: T('壬庚'), 申: T('壬戊'), 酉: T('壬癸'),
    戌: T('甲壬'), 亥: T('甲戊庚壬'), 子: T('壬戊己'), 丑: T('壬甲'),
  },
  丁: {
    寅: T('甲庚'), 卯: T('庚甲'), 辰: T('甲庚'), 巳: T('甲庚'),
    午: T('壬庚癸'), 未: T('甲壬庚'), 申: T('甲庚丙戊'), 酉: T('甲庚丙戊'),
    戌: T('甲庚戊'), 亥: T('甲庚'), 子: T('甲庚'), 丑: T('甲庚'),
  },
  戊: {
    寅: T('丙甲癸'), 卯: T('丙甲癸'), 辰: T('甲丙癸'), 巳: T('甲丙癸'),
    午: T('壬甲丙'), 未: T('癸丙甲'), 申: T('丙癸甲'), 酉: T('丙癸'),
    戌: T('甲丙癸'), 亥: T('甲丙'), 子: T('丙甲'), 丑: T('丙甲'),
  },
  己: {
    寅: T('丙庚甲'), 卯: T('甲癸丙'), 辰: T('丙癸甲'), 巳: T('癸丙'),
    午: T('癸丙'), 未: T('癸丙'), 申: T('丙癸'), 酉: T('丙癸'),
    戌: T('甲丙癸'), 亥: T('丙甲戊'), 子: T('丙甲戊'), 丑: T('丙甲戊'),
  },
  庚: {
    寅: T('戊甲壬丙丁'), 卯: T('丁甲庚丙'), 辰: T('甲丁壬癸'), 巳: T('壬戊丙丁'),
    午: T('壬癸'), 未: T('丁甲'), 申: T('丁甲'), 酉: T('丁甲丙'),
    戌: T('甲壬'), 亥: T('丁丙'), 子: T('丁甲丙'), 丑: T('丙丁甲'),
  },
  辛: {
    寅: T('己壬庚'), 卯: T('壬甲'), 辰: T('壬甲'), 巳: T('壬甲癸'),
    午: T('壬己癸'), 未: T('壬庚甲'), 申: T('壬甲戊'), 酉: T('壬甲'),
    戌: T('壬甲'), 亥: T('壬丙'), 子: T('丙戊壬甲'), 丑: T('丙壬戊己'),
  },
  壬: {
    寅: T('庚丙戊'), 卯: T('戊辛庚'), 辰: T('甲庚'), 巳: T('壬辛庚癸'),
    午: T('癸庚辛'), 未: T('辛甲'), 申: T('戊丁'), 酉: T('甲庚'),
    戌: T('甲丙'), 亥: T('戊丙庚'), 子: T('戊丙'), 丑: T('丙丁甲'),
  },
  癸: {
    寅: T('辛丙'), 卯: T('庚辛'), 辰: T('丙辛甲'), 巳: T('辛'),
    午: T('庚辛壬癸'), 未: T('庚辛壬癸'), 申: T('丁'), 酉: T('辛丙'),
    戌: T('辛甲壬癸'), 亥: T('庚辛戊丁'), 子: T('丙辛'), 丑: T('丙丁'),
  },
};

export interface TiaohouResult {
  /** Ordered useful-god stems (primary first). */
  stems: Stem[];
  /** Elements of those stems (deduplicated, order kept). */
  elements: Element[];
  /** Primary climatic useful god. */
  primary: Stem;
  /** Whether any 调候 stem is visible in the four stems of the chart. */
  presentInStems: boolean;
  description: string;
}

export function analyzeTiaohou(
  dayStem: Stem,
  monthBranch: Branch,
  visibleStems: Stem[],
): TiaohouResult {
  const stems = TIAOHOU_TABLE[dayStem][monthBranch];
  const elements: Element[] = [];
  for (const s of stems) {
    const el = STEM_ELEMENT[s];
    if (!elements.includes(el)) elements.push(el);
  }
  const presentInStems = stems.some((s) => visibleStems.includes(s));
  return {
    stems,
    elements,
    primary: stems[0],
    presentInStems,
    description: `${dayStem}日主生于${monthBranch}月，调候用神：${stems.join('、')}${presentInStems ? '（已透干）' : '（未透干）'}`,
  };
}
