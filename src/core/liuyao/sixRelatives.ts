/**
 * P4.5 — 八宫归属 + 世应 + 六亲。
 *
 * 京房八宫法：
 *   八纯卦 → 一世 (变初爻) → 二世 (再变二爻) → 三世 → 四世 → 五世
 *   → 游魂 (再变四爻，回到下爻) → 归魂 (内卦三爻全变回本宫纯卦内卦)
 * 归宫判定：精确匹配 8 × 8 = 64 卦的归宫表生成 (枚举 EIGHT_PALACES 的所有变换)。
 */

import type { FiveElement, SixRelative } from './types';
import { EIGHT_PALACES, SHI_YING_TABLE } from './hexagramTables';
import { BRANCH_ELEMENTS, getSixRelative } from './constants';

export interface PalaceAssignment {
  palace: string;
  palaceElement: FiveElement;
  /** 0=八纯, 1..5=一~五世, 6=游魂, 7=归魂 */
  gongOrder: number;
  shiYao: number;
  yingYao: number;
}

/** Generate the 6-line bit pattern for a given palace + gongOrder. */
export function patternForPalaceOrder(palaceIdx: number, order: number): (0|1)[] {
  const base = [...EIGHT_PALACES[palaceIdx].lines] as (0|1)[];
  const flip = (i: number) => { base[i] = base[i] === 1 ? 0 : 1; };
  switch (order) {
    case 0: break;                                       // 八纯
    case 1: flip(0); break;                              // 一世
    case 2: flip(0); flip(1); break;                     // 二世
    case 3: flip(0); flip(1); flip(2); break;            // 三世
    case 4: flip(0); flip(1); flip(2); flip(3); break;   // 四世
    case 5: flip(0); flip(1); flip(2); flip(3); flip(4); break; // 五世
    case 6:                                              // 游魂：五世再变四爻
      flip(0); flip(1); flip(2); flip(3); flip(4); flip(3);
      break;
    case 7:                                              // 归魂：游魂再变下三爻 (回本宫内卦)
      flip(0); flip(1); flip(2); flip(3); flip(4); flip(3);
      flip(0); flip(1); flip(2);
      break;
  }
  return base;
}

/** Build the full 64-key lookup: bitPattern → (palace, order). */
const PALACE_LOOKUP = (() => {
  const m = new Map<string, { palaceIdx: number; order: number }>();
  for (let p = 0; p < 8; p++) {
    for (let o = 0; o < 8; o++) {
      const pat = patternForPalaceOrder(p, o);
      const key = pat.join('');
      if (!m.has(key)) m.set(key, { palaceIdx: p, order: o });
    }
  }
  return m;
})();

export function determinePalace(bits: (0|1)[]): PalaceAssignment {
  const key = bits.join('');
  const found = PALACE_LOOKUP.get(key);
  if (!found) {
    // Should never happen — all 64 combos enumerated above.
    return {
      palace: EIGHT_PALACES[7].name,
      palaceElement: EIGHT_PALACES[7].element,
      gongOrder: 0,
      shiYao: 6,
      yingYao: 3,
    };
  }
  const palace = EIGHT_PALACES[found.palaceIdx];
  const [shi, ying] = SHI_YING_TABLE[found.order];
  return {
    palace: palace.name,
    palaceElement: palace.element,
    gongOrder: found.order,
    shiYao: shi,
    yingYao: ying,
  };
}

/** Assign 六亲 to each najia line given the palace 五行. */
export function assignRelatives(palaceElement: FiveElement, branches: string[]): SixRelative[] {
  return branches.map((b) => getSixRelative(palaceElement, BRANCH_ELEMENTS[b]));
}
