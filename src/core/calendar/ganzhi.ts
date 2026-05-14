/**
 * 天干 / 地支 / 六十甲子 / 五行 / 阴阳 / 地支藏干 / 十二生肖.
 *
 * Pure tables and helpers. No randomness, no I/O.
 */

export type Stem =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export type Branch =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type Element = '木' | '火' | '土' | '金' | '水';
export type YinYang = '阳' | '阴';

export const STEMS: readonly Stem[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
];

export const BRANCHES: readonly Branch[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
];

export const ZODIAC: Record<Branch, string> = {
  子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
  午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪',
};

export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

export const STEM_YINYANG: Record<Stem, YinYang> = {
  甲: '阳', 乙: '阴',
  丙: '阳', 丁: '阴',
  戊: '阳', 己: '阴',
  庚: '阳', 辛: '阴',
  壬: '阳', 癸: '阴',
};

export const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export const BRANCH_YINYANG: Record<Branch, YinYang> = {
  子: '阳', 丑: '阴', 寅: '阳', 卯: '阴',
  辰: '阳', 巳: '阴', 午: '阳', 未: '阴',
  申: '阳', 酉: '阴', 戌: '阳', 亥: '阴',
};

/**
 * 地支藏干 (canonical primary→secondary→tertiary order).
 * Source: standard 子平 reference. Hidden stems matter for 十神 / 通根.
 */
export const HIDDEN_STEMS: Record<Branch, Stem[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

export interface Pillar {
  stem: Stem;
  branch: Branch;
  /** "甲子" etc. */
  ganzhi: string;
}

export function makePillar(stem: Stem, branch: Branch): Pillar {
  return { stem, branch, ganzhi: `${stem}${branch}` };
}

/** Parse a 2-char "甲子" into a Pillar; throws on invalid input. */
export function parseGanzhi(gz: string): Pillar {
  if (gz.length !== 2) throw new Error(`Invalid ganzhi: ${gz}`);
  const stem = gz[0] as Stem;
  const branch = gz[1] as Branch;
  if (!STEMS.includes(stem)) throw new Error(`Invalid stem: ${stem}`);
  if (!BRANCHES.includes(branch)) throw new Error(`Invalid branch: ${branch}`);
  return makePillar(stem, branch);
}

/**
 * The sixty jiazi cycle: stem index advances by 1, branch index by 1, both
 * wrapping. Pairs only exist where parity matches (yang-stem × yang-branch
 * or yin-stem × yin-branch). Returned in canonical order starting at 甲子.
 */
export function sixtyJiazi(): Pillar[] {
  const out: Pillar[] = [];
  for (let i = 0; i < 60; i++) {
    const stem = STEMS[i % 10];
    const branch = BRANCHES[i % 12];
    out.push(makePillar(stem, branch));
  }
  return out;
}

/** Index of a ganzhi within the 60-jiazi cycle (0..59). */
export function jiaziIndex(p: Pillar | string): number {
  const pillar = typeof p === 'string' ? parseGanzhi(p) : p;
  const list = sixtyJiazi();
  return list.findIndex((x) => x.ganzhi === pillar.ganzhi);
}

/**
 * 旬空 (xun kong / void) — for a given pillar, return the two branches that
 * are "empty" within its 10-day xun (period of 10 starting at the nearest
 * preceding 甲).
 */
export function voidBranches(p: Pillar | string): [Branch, Branch] {
  const idx = jiaziIndex(p);
  if (idx < 0) throw new Error('Pillar not in jiazi cycle');
  const xunStart = Math.floor(idx / 10) * 10; // 0,10,...,50
  const stemBranchOffsetAtStart = xunStart % 12; // branch at the 甲 of this xun
  const v1 = BRANCHES[(stemBranchOffsetAtStart + 10) % 12];
  const v2 = BRANCHES[(stemBranchOffsetAtStart + 11) % 12];
  return [v1, v2];
}
