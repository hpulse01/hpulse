/**
 * P4.7 — 三奇六仪 placement on 9 palaces (地盘).
 *
 * 阳遁: 戊己庚辛壬癸丁丙乙 顺布，从 ju 宫起.
 * 阴遁: 戊己庚辛壬癸丁丙乙 逆布，从 ju 宫起.
 *
 * 宫位顺序使用洛书自然数 1..9。
 */
import type { DunDirection, PalaceNumber, SanQiLiuYi, ExplanationStep } from './types';
import { SAN_QI_LIU_YI_ORDER } from './constants';

export function placeSanQiLiuYi(
  juNumber: number,
  dun: DunDirection,
  trace: ExplanationStep[],
): Record<PalaceNumber, SanQiLiuYi> {
  const out: Partial<Record<PalaceNumber, SanQiLiuYi>> = {};
  const step = dun === 'yang' ? 1 : -1;
  let palace = juNumber;
  for (const stem of SAN_QI_LIU_YI_ORDER) {
    out[palace as PalaceNumber] = stem;
    palace = ((palace - 1 + step + 9) % 9) + 1;
  }
  trace.push({
    rule: 'qimen.sanqiliuyi',
    detail: `三奇六仪${dun === 'yang' ? '顺布' : '逆布'}，起宫=${juNumber}：${
      Object.entries(out).map(([p, s]) => `${p}宫=${s}`).join('，')
    }。`,
    data: { ju: juNumber, dun, layout: out },
  });
  return out as Record<PalaceNumber, SanQiLiuYi>;
}
