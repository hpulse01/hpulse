/**
 * P4.7 — 九星 转盘 (rotation around the 8-palace loop, excluding 中宫).
 *
 * 规则简化版：
 *   - 旬首之 仪 所在宫的 default 九星 = 值符星.
 *   - 时干 所在宫 (在地盘 三奇六仪 layout 中) = 值符星新位置.
 *   - 八宫环序 LOOP_ORDER = [1,8,3,4,9,2,7,6]; 阳遁顺移, 阴遁逆移.
 *   - 中宫 5 上的 天禽 寄宫到 2坤 (随 值符 移动时仍归 5 宫记录).
 */
import type { DunDirection, PalaceNumber, SanQiLiuYi, StarName, ExplanationStep } from './types';
import { LOOP_ORDER, STAR_AT_PALACE } from './constants';

export interface StarRotationResult {
  /** Map palace → star (after rotation). */
  starAtPalace: Record<PalaceNumber, StarName | null>;
  zhiFuStar: StarName;
  zhiFuOriginPalace: PalaceNumber;
  hourStemPalace: PalaceNumber;
  /** 环序移位步数 (0..7)，天盘干与九星同步使用。 */
  shift: number;
}

function loopIndex(p: PalaceNumber): number {
  return LOOP_ORDER.indexOf(p);
}

export function rotateStars(
  layout: Record<PalaceNumber, SanQiLiuYi>,
  xunShouYi: SanQiLiuYi,
  hourStem: SanQiLiuYi, // for 旬首之甲, hourStem === xunShouYi
  dun: DunDirection,
  trace: ExplanationStep[],
): StarRotationResult {
  // 1. find palace where xunShouYi sits → 值符 origin
  let zhiFuOrigin: PalaceNumber = 1;
  for (const p of [1,2,3,4,5,6,7,8,9] as PalaceNumber[]) {
    if (layout[p] === xunShouYi) { zhiFuOrigin = p; break; }
  }
  const zhiFuStar = STAR_AT_PALACE[zhiFuOrigin];

  // 2. find palace of hourStem
  let hourStemPalace: PalaceNumber = zhiFuOrigin;
  for (const p of [1,2,3,4,5,6,7,8,9] as PalaceNumber[]) {
    if (layout[p] === hourStem) { hourStemPalace = p; break; }
  }

  // If 值符 origin in palace 5, 寄 to 2坤 for rotation purposes.
  const rotOrigin: PalaceNumber = zhiFuOrigin === 5 ? 2 : zhiFuOrigin;
  const rotTarget: PalaceNumber = hourStemPalace === 5 ? 2 : hourStemPalace;

  const starAt: Partial<Record<PalaceNumber, StarName | null>> = {};
  // palace 5: 天禽 stays at 5 (kept stationary in this simplified rotation)
  starAt[5] = STAR_AT_PALACE[5];

  const fromIdx = loopIndex(rotOrigin);
  const toIdx = loopIndex(rotTarget);
  const dir = dun === 'yang' ? 1 : -1;
  // signed shift: toIdx - fromIdx (mod 8) along dir
  const rawShift = ((toIdx - fromIdx) * dir + 800) % 8; // ensure positive

  for (let i = 0; i < 8; i++) {
    const srcPalace = LOOP_ORDER[i];
    const star = STAR_AT_PALACE[srcPalace];
    const newIdx = (i + dir * rawShift + 800) % 8;
    const dstPalace = LOOP_ORDER[newIdx];
    starAt[dstPalace] = star;
  }

  trace.push({
    rule: 'qimen.starRotation',
    detail: `值符星=${zhiFuStar}（原${zhiFuOrigin}宫），随时干${hourStem}移至${hourStemPalace}宫；环序${dun === 'yang' ? '顺' : '逆'}移 ${rawShift} 步；中宫天禽寄留。`,
    data: {
      zhiFuStar, zhiFuOriginPalace: zhiFuOrigin, hourStemPalace,
      dunDirection: dun, shift: rawShift, starAtPalace: starAt,
    },
  });

  return {
    starAtPalace: starAt as Record<PalaceNumber, StarName | null>,
    zhiFuStar,
    zhiFuOriginPalace: zhiFuOrigin,
    hourStemPalace,
    shift: rawShift,
  };
}
