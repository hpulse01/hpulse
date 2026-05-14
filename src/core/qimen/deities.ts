/**
 * P4.7 — 八神 placement.
 *
 * 八神顺序: 值符,腾蛇,太阴,六合,白虎,玄武,九地,九天.
 * 阳遁顺布 / 阴遁逆布 (along LOOP_ORDER, 中宫不放神).
 * 起点 = 值符星 当前所在宫 (即 hourStemPalace, 或寄宫处理后).
 */
import type { DeityName, DunDirection, PalaceNumber, ExplanationStep } from './types';
import { DEITY_ORDER, LOOP_ORDER } from './constants';

export function placeDeities(
  zhiFuCurrentPalace: PalaceNumber,
  dun: DunDirection,
  trace: ExplanationStep[],
): Record<PalaceNumber, DeityName | null> {
  const start: PalaceNumber = zhiFuCurrentPalace === 5 ? 2 : zhiFuCurrentPalace;
  const startIdx = LOOP_ORDER.indexOf(start);
  const dir = dun === 'yang' ? 1 : -1;

  const out: Partial<Record<PalaceNumber, DeityName | null>> = { 5: null };
  for (let i = 0; i < 8; i++) {
    const idx = ((startIdx + dir * i) % 8 + 8) % 8;
    out[LOOP_ORDER[idx]] = DEITY_ORDER[i];
  }

  trace.push({
    rule: 'qimen.deities',
    detail: `八神${dun === 'yang' ? '顺布' : '逆布'}：起点=${start}宫(值符)，顺序 ${DEITY_ORDER.join('→')}。`,
    data: { start, dun, deityAtPalace: out },
  });
  return out as Record<PalaceNumber, DeityName | null>;
}
