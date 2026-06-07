/**
 * P4.4b — Palace-stem derivation via 五虎遁 (Five-Tigers shift).
 *
 * Given the year-stem, each palace branch acquires a Heavenly Stem.
 * Used for: 宫干自化, 来因宫追溯, 大限宫干四化.
 */

import type { Branch, Stem } from './types';
import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from './constants';

/**
 * 五虎遁：returns the stem of the 寅 palace for the given year-stem.
 *   甲/己 → 丙寅   乙/庚 → 戊寅   丙/辛 → 庚寅   丁/壬 → 壬寅   戊/癸 → 甲寅
 */
const YIN_STEM_BY_YEAR: Record<Stem, Stem> = {
  '甲': '丙', '己': '丙',
  '乙': '戊', '庚': '戊',
  '丙': '庚', '辛': '庚',
  '丁': '壬', '壬': '壬',
  '戊': '甲', '癸': '甲',
};

/** Returns the stem of an arbitrary branch given the year stem. */
export function getPalaceStem(yearGan: Stem, branch: Branch): Stem {
  const yinStem = YIN_STEM_BY_YEAR[yearGan];
  const yinStemIdx = HEAVENLY_STEMS.indexOf(yinStem);
  // distance from 寅 to target branch on the 12-branch ring (寅=2 in earthly order)
  const yinBranchIdx = EARTHLY_BRANCHES.indexOf('寅');
  const targetIdx = EARTHLY_BRANCHES.indexOf(branch);
  const distance = ((targetIdx - yinBranchIdx) % 12 + 12) % 12;
  // stems cycle every 10
  return HEAVENLY_STEMS[(yinStemIdx + distance) % 10] as Stem;
}

/** Build a map { branch → stem } for all 12 palaces. */
export function buildPalaceStemMap(yearGan: Stem): Record<Branch, Stem> {
  const out = {} as Record<Branch, Stem>;
  for (const b of EARTHLY_BRANCHES) out[b] = getPalaceStem(yearGan, b);
  return out;
}
