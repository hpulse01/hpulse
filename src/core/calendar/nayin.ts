/**
 * 六十纳音 (Nayin of 60 jiazi).
 *
 * Canonical table — pairs of consecutive jiazi share a nayin.
 */

import { jiaziIndex, type Pillar } from './ganzhi';

const NAYIN_30: readonly string[] = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金', '山头火',
  '涧下水', '城头土', '白蜡金', '杨柳木', '泉中水', '屋上土',
  '霹雳火', '松柏木', '长流水', '沙中金', '山下火', '平地木',
  '壁上土', '金箔金', '覆灯火', '天河水', '大驿土', '钗钏金',
  '桑柘木', '大溪水', '沙中土', '天上火', '石榴木', '大海水',
];

export function nayinOf(p: Pillar | string): string {
  const idx = jiaziIndex(p);
  if (idx < 0) throw new Error('Invalid pillar for nayin');
  return NAYIN_30[Math.floor(idx / 2)];
}

export const NAYIN_TABLE = NAYIN_30;
