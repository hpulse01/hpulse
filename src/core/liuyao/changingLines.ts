/**
 * P4.5 — Changing-line mutation: derives the 变卦 from 主卦 + 动爻 positions.
 */

import type { ChangedHexagram, FiveElement, Hexagram, HexagramLine, RawLine, SixRelative } from './types';
import { trigramFromBits, lookupHexagramName } from './hexagramTables';
import { applyNajia } from './najia';
import { determinePalace, assignRelatives } from './sixRelatives';
import { spiritsForDayStem } from './sixSpirits';
import { BRANCH_ELEMENTS } from './constants';
import { dayRelation, isVoid, monthStrength } from './wangShuai';

/** Flip changing lines to derive bits of the 变卦. */
export function changedBits(rawLines: RawLine[]): (0|1)[] {
  return rawLines.map((r) => {
    const bit: 0|1 = r.yinYang === 'yang' ? 1 : 0;
    if (!r.isChanging) return bit;
    return (bit === 1 ? 0 : 1) as 0|1;
  });
}

export interface ChangedHexagramContext {
  dayStem: string;
  monthBranch: string;
  dayBranch: string;
  voidBranches: string[];
}

export function buildChangedHexagram(
  rawLines: RawLine[],
  originalPalaceElement: FiveElement,
  ctx: ChangedHexagramContext,
): ChangedHexagram {
  const cb = changedBits(rawLines);
  const lowerT = trigramFromBits([cb[0], cb[1], cb[2]]);
  const upperT = trigramFromBits([cb[3], cb[4], cb[5]]);
  const najia = applyNajia(lowerT.name, upperT.name);
  const palace = determinePalace(cb);
  // 京房法：变卦六亲仍以本卦宫之五行为参照（用神追踪）。
  const relatives: SixRelative[] = assignRelatives(originalPalaceElement, najia.map((n) => n.branch));
  const spirits = spiritsForDayStem(ctx.dayStem);
  const dayElement = BRANCH_ELEMENTS[ctx.dayBranch];

  const lines: HexagramLine[] = najia.map((nj, i) => {
    const yinYang = cb[i] === 1 ? 'yang' : 'yin';
    return {
      position: nj.position,
      value: yinYang === 'yang' ? 7 : 8, // 变卦后均视为静爻
      yinYang,
      isChanging: false,
      branch: nj.branch,
      stem: nj.stem,
      element: nj.element,
      relative: relatives[i],
      spirit: spirits[i],
      isShiYao: nj.position === palace.shiYao,
      isYingYao: nj.position === palace.yingYao,
      isVoid: isVoid(nj.branch, ctx.voidBranches),
      monthStrength: monthStrength(ctx.monthBranch, nj.element),
      dayRelation: dayRelation(dayElement, nj.element),
    };
  });

  const info = lookupHexagramName(lowerT.name, upperT.name);
  return {
    name: info.name,
    description: info.description,
    upperTrigram: upperT,
    lowerTrigram: lowerT,
    palace: palace.palace,
    palaceElement: palace.palaceElement,
    lines,
  };
}

/** Annotate the main hexagram lines with their changedBranch/Element/Relative for trace. */
export function annotateChangingLineTargets(
  mainLines: HexagramLine[],
  changed: ChangedHexagram,
): void {
  for (let i = 0; i < 6; i++) {
    const m = mainLines[i];
    if (!m.isChanging) continue;
    const c = changed.lines[i];
    m.changedBranch = c.branch;
    m.changedElement = c.element;
    m.changedRelative = c.relative;
  }
}
