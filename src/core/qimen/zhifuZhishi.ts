/**
 * P4.7 — 值符 + 值使 helpers (resolve from hour ganzhi).
 */
import type { ExplanationStep, SanQiLiuYi } from './types';
import { XUN_SHOU_YI, STEMS, BRANCHES } from './constants';
import { jiaziIndex, parseGanzhi } from '../calendar/ganzhi';

export interface XunShouResolution {
  hourGanzhi: string;
  xunShou: string;          // 甲子/甲戌/...
  xunShouYi: SanQiLiuYi;
  hourStem: string;         // raw stem char
  hourBranch: string;       // raw branch char
  /** Effective stem used for 值符星 placement: 甲 → 旬首之 仪. */
  effectiveStemForRotation: SanQiLiuYi;
}

const XUN_HEADS = ['甲子','甲戌','甲申','甲午','甲辰','甲寅'];

export function resolveXunShou(hourGanzhi: string, trace: ExplanationStep[]): XunShouResolution {
  const idx = jiaziIndex(hourGanzhi);
  const headIdx = Math.floor(idx / 10);
  const head = XUN_HEADS[headIdx];
  const yi = XUN_SHOU_YI[head];

  const hp = parseGanzhi(hourGanzhi);
  const isJia = hp.stem === '甲';
  const effective: SanQiLiuYi = isJia
    ? yi
    : (hp.stem as SanQiLiuYi); // for non-甲, 时干 itself sits in some palace

  trace.push({
    rule: 'qimen.xunShou',
    detail: `时柱=${hourGanzhi} → 旬首=${head}，遁仪=${yi}；${
      isJia ? '甲遁于仪' : '时干非甲，按本干寻宫'
    }；用于转盘的有效干=${effective}。`,
    data: { hourGanzhi, xunShou: head, xunShouYi: yi, hourStem: hp.stem, hourBranch: hp.branch, effective },
  });

  return {
    hourGanzhi,
    xunShou: head,
    xunShouYi: yi,
    hourStem: hp.stem,
    hourBranch: hp.branch,
    effectiveStemForRotation: effective,
  };
}

// re-export for convenience
export { STEMS, BRANCHES };
