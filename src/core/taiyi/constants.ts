/**
 * P4.8 — Taiyi constants.
 *
 * 太乙九宫 (含中5宫)：1坎(水) 2坤(土) 3震(木) 4巽(木) 5中(土) 6乾(金) 7兑(金) 8艮(土) 9离(火).
 * 太乙运行有 8 个非中宫，按 1→8→3→4→9→2→7→6 顺序 (与奇门相同 LOOP_ORDER).
 *
 * 文昌起例 (简): 太乙宫 + 4 (顺 mod 8 in LOOP_ORDER, partial校验).
 * 始击起例 (简): 文昌宫 对宫 (palace + 4 along LOOP_ORDER, partial).
 *
 * 太乙积年 epoch 默认采用 「上元甲子」公历前 10153917 年 (近似传统数字)。
 * 项目允许 epochYear 覆盖。
 */
import type { PalaceNumber, FiveElement } from './types';

export const PALACE_META: Record<PalaceNumber, { trigram: string; direction: string; element: FiveElement }> = {
  1: { trigram:'坎', direction:'北',   element:'水' },
  2: { trigram:'坤', direction:'西南', element:'土' },
  3: { trigram:'震', direction:'东',   element:'木' },
  4: { trigram:'巽', direction:'东南', element:'木' },
  5: { trigram:'中', direction:'中宫', element:'土' },
  6: { trigram:'乾', direction:'西北', element:'金' },
  7: { trigram:'兑', direction:'西',   element:'金' },
  8: { trigram:'艮', direction:'东北', element:'土' },
  9: { trigram:'离', direction:'南',   element:'火' },
};

/** 八宫环序 (排除中宫). */
export const LOOP_ORDER: readonly PalaceNumber[] = [1, 8, 3, 4, 9, 2, 7, 6];

/**
 * 太乙运行九宫顺序 (传统记载: 太乙下行九宫，五元一周；阳遁顺行，阴遁逆行)。
 * 此处采用简化：阳遁顺 LOOP_ORDER，阴遁逆 LOOP_ORDER。中宫由 5 寄入 2 坤宫。
 */

/**
 * 默认 epoch 上元甲子 (一种通行起算法：公元前 10154193 年 / 一说 BC 10155908)。
 * 不同流派差异巨大；项目用一个固定 deterministic 值，并明确允许 epochYear 覆盖。
 */
export const DEFAULT_EPOCH_YEAR = -10153917; // BC 10153918 (negative ISO year)

/** 阳遁/阴遁切换：积年 mod 72 < 36 阳遁 else 阴遁. */
export const YANG_DUN_LIMIT = 36;
export const TOTAL_JU = 72;
