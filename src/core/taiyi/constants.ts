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

export const BRANCHES_CN = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;
export type BranchCN = typeof BRANCHES_CN[number];

/**
 * 计神：岁计以寅为首逆行十二辰 (子年起寅，丑年在丑，寅年在子 ……)。
 * 出处：《太乙金镜式经》「计神常以寅为正月，逆行十二辰」。
 */
export const JI_SHEN_MAP: Record<BranchCN, BranchCN> = {
  子:'寅', 丑:'丑', 寅:'子', 卯:'亥', 辰:'戌', 巳:'酉',
  午:'申', 未:'未', 申:'午', 酉:'巳', 戌:'辰', 亥:'卯',
};

/** 地支 → 后天八卦九宫 (子坎1 丑寅艮8 卯震3 辰巳巽4 午离9 未申坤2 酉兑7 戌亥乾6). */
export const BRANCH_PALACE: Record<BranchCN, PalaceNumber> = {
  子:1, 丑:8, 寅:8, 卯:3, 辰:4, 巳:4, 午:9, 未:2, 申:2, 酉:7, 戌:6, 亥:6,
};

/**
 * 十六神 (太乙式盘十六位): 子起地主，顺布十六位 (含四维卦位)。
 * 出处：《太乙统宗》十六神名次。
 */
export const SIXTEEN_GODS: readonly { name: string; position: string }[] = [
  { name:'地主', position:'子' }, { name:'阳德', position:'丑' },
  { name:'和德', position:'艮' }, { name:'吕申', position:'寅' },
  { name:'高丛', position:'卯' }, { name:'太阳', position:'辰' },
  { name:'太炅', position:'巽' }, { name:'大神', position:'巳' },
  { name:'大威', position:'午' }, { name:'天道', position:'未' },
  { name:'大武', position:'坤' }, { name:'武德', position:'申' },
  { name:'太簇', position:'酉' }, { name:'阴主', position:'戌' },
  { name:'阴德', position:'乾' }, { name:'大义', position:'亥' },
];
