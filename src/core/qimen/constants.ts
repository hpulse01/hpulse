/**
 * P4.7 — Qi Men constants: 九宫, 三奇六仪, 九星, 八门, 八神, 五行, 节气表.
 */
import type {
  PalaceNumber, FiveElement, SanQiLiuYi, StarName, GateName, DeityName, BranchCN, StemCN, DunDirection,
} from './types';

export const STEMS: readonly StemCN[] = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const BRANCHES: readonly BranchCN[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/** 洛书九宫: 编号 → 卦 / 方位 / 五行. */
export const PALACE_META: Record<PalaceNumber, { trigram: string; direction: string; element: FiveElement }> = {
  1: { trigram: '坎', direction: '北',   element: '水' },
  2: { trigram: '坤', direction: '西南', element: '土' },
  3: { trigram: '震', direction: '东',   element: '木' },
  4: { trigram: '巽', direction: '东南', element: '木' },
  5: { trigram: '中', direction: '中宫', element: '土' },
  6: { trigram: '乾', direction: '西北', element: '金' },
  7: { trigram: '兑', direction: '西',   element: '金' },
  8: { trigram: '艮', direction: '东北', element: '土' },
  9: { trigram: '离', direction: '南',   element: '火' },
};

/** 默认 九星 → 宫. */
export const STAR_AT_PALACE: Record<PalaceNumber, StarName> = {
  1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽',
  6: '天心', 7: '天柱', 8: '天任', 9: '天英',
};

/** 默认 八门 → 宫；中宫无门，寄于坤2(死门). */
export const GATE_AT_PALACE: Record<PalaceNumber, GateName | null> = {
  1: '休门', 2: '死门', 3: '伤门', 4: '杜门', 5: null,
  6: '开门', 7: '惊门', 8: '生门', 9: '景门',
};

/** 三奇六仪 placement order (always this fixed sequence): 戊己庚辛壬癸丁丙乙. */
export const SAN_QI_LIU_YI_ORDER: readonly SanQiLiuYi[] = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];

/** 旬首 (六甲) → 隐遁的仪. */
export const XUN_SHOU_YI: Record<string, SanQiLiuYi> = {
  '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸',
};

/** 八神顺序 (阳遁顺布 / 阴遁逆布). */
export const DEITY_ORDER: readonly DeityName[] = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];

/**
 * 八宫空间环序 (excluding 中宫 5)：用于 转盘 与 八神 排布的相邻关系。
 * 顺时针: 坎1 → 艮8 → 震3 → 巽4 → 离9 → 坤2 → 兑7 → 乾6.
 */
export const LOOP_ORDER: readonly PalaceNumber[] = [1, 8, 3, 4, 9, 2, 7, 6];

/** 节气 → 阴阳遁. */
export const YANG_DUN_TERMS = new Set([
  '冬至','小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种',
]);
export const YIN_DUN_TERMS = new Set([
  '夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪',
]);

export function dunDirectionForTerm(term: string): DunDirection | null {
  if (YANG_DUN_TERMS.has(term)) return 'yang';
  if (YIN_DUN_TERMS.has(term)) return 'yin';
  return null;
}

/** 24 节气 × 三元 → 局数 (standard 时家奇门 table). */
export const JU_TABLE: Record<string, [number, number, number]> = {
  // 阳遁
  '冬至': [1, 7, 4], '小寒': [2, 8, 5], '大寒': [3, 9, 6],
  '立春': [8, 5, 2], '雨水': [9, 6, 3], '惊蛰': [1, 7, 4],
  '春分': [3, 9, 6], '清明': [4, 1, 7], '谷雨': [5, 2, 8],
  '立夏': [4, 1, 7], '小满': [5, 2, 8], '芒种': [6, 3, 9],
  // 阴遁
  '夏至': [9, 3, 6], '小暑': [8, 2, 5], '大暑': [7, 1, 4],
  '立秋': [2, 5, 8], '处暑': [1, 4, 7], '白露': [9, 3, 6],
  '秋分': [7, 1, 4], '寒露': [6, 9, 3], '霜降': [5, 8, 2],
  '立冬': [6, 9, 3], '小雪': [5, 8, 2], '大雪': [4, 7, 1],
};

/** 符头分元: 上元 子午卯酉, 中元 寅申巳亥, 下元 辰戌丑未. */
export const FU_TOU_GROUP: Record<BranchCN, '子午卯酉' | '寅申巳亥' | '辰戌丑未'> = {
  '子': '子午卯酉', '午': '子午卯酉', '卯': '子午卯酉', '酉': '子午卯酉',
  '寅': '寅申巳亥', '申': '寅申巳亥', '巳': '寅申巳亥', '亥': '寅申巳亥',
  '辰': '辰戌丑未', '戌': '辰戌丑未', '丑': '辰戌丑未', '未': '辰戌丑未',
};

/** 时支 → 宫位 (用于八门转盘). */
export const HOUR_BRANCH_PALACE: Record<BranchCN, PalaceNumber> = {
  '子': 1, '丑': 8, '寅': 8, '卯': 3, '辰': 4, '巳': 4,
  '午': 9, '未': 2, '申': 2, '酉': 7, '戌': 6, '亥': 6,
};

/** 用神 keyword → (target type, symbol). */
export const YONG_SHEN_MAP: Record<string, { target: 'gate' | 'star' | 'deity' | 'stem'; symbol: string }> = {
  '事业': { target: 'gate', symbol: '开门' },
  '财运': { target: 'gate', symbol: '生门' },
  '求财': { target: 'gate', symbol: '生门' },
  '婚姻': { target: 'gate', symbol: '休门' },
  '官司': { target: 'gate', symbol: '景门' },
  '健康': { target: 'star', symbol: '天心' },
  '出行': { target: 'gate', symbol: '开门' },
  '考试': { target: 'gate', symbol: '景门' },
  '寻人': { target: 'gate', symbol: '生门' },
  '决策': { target: 'star', symbol: '天辅' },
  '其他': { target: 'star', symbol: '天辅' },
};
