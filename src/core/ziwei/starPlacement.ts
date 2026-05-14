/**
 * P4.4 — 14 主星 placement (紫微 + 天府 系).
 */

import type { ExplanationStep } from '../astro-time/types';
import type { Branch, ZiweiStar, SihuaTransform } from './types';
import {
  PALACE_BRANCH_ORDER,
  STAR_BRIGHTNESS,
  ZIWEI_GROUP_OFFSETS,
  TIANFU_GROUP_OFFSETS,
} from './constants';

/** 紫微定位：求 (lunarDay 与 五行局 步数) 的经典口诀. */
export function calculateZiweiPosition(lunarDay: number, bureauNumber: number): number {
  if (bureauNumber < 2 || lunarDay < 1) return 0;
  const quotient = Math.ceil(lunarDay / bureauNumber);
  const remainder = (bureauNumber - (lunarDay % bureauNumber)) % bureauNumber;
  return remainder % 2 === 0
    ? ((quotient + remainder - 1) % 12 + 12) % 12
    : ((quotient - remainder - 1) % 12 + 12) % 12;
}

/** 天府位置：紫微的镜像，(12 - ziwei) mod 12. */
export function calculateTianfuPosition(ziweiPosition: number): number {
  return (12 - ziweiPosition) % 12;
}

export interface PlacedStarsResult {
  /** Map index 0..11 of PALACE_BRANCH_ORDER → list of stars placed there. */
  byBranchIndex: Record<number, ZiweiStar[]>;
  explanationTrace: ExplanationStep[];
}

function brightnessOf(starName: string, branch: Branch) {
  return STAR_BRIGHTNESS[starName]?.[branch] ?? '平';
}

/** Place the 紫微 group (6 stars, anchor=ziweiPosition, offsets逆行). */
export function placeZiweiGroup(
  ziweiPosition: number,
  sihuaMap: Partial<Record<string, SihuaTransform>>,
): PlacedStarsResult {
  const byBranchIndex: Record<number, ZiweiStar[]> = {};
  const trace: ExplanationStep[] = [];
  for (const [name, offset] of Object.entries(ZIWEI_GROUP_OFFSETS)) {
    const pos = ((ziweiPosition + offset) % 12 + 12) % 12;
    const branch = PALACE_BRANCH_ORDER[pos];
    const star: ZiweiStar = {
      name,
      type: 'major',
      group: 'ziwei',
      brightness: brightnessOf(name, branch),
      sihua: sihuaMap[name],
      placementRule: `ziwei.major.ziweiGroup.${name}`,
      explanationTrace: [{
        rule: 'ziwei.star.place.ziweiGroup',
        detail: `${name}: 紫微位 ${ziweiPosition} + 偏移 ${offset} → ${branch} (亮度 ${brightnessOf(name, branch)})`,
        data: { name, offset, ziweiPosition, position: pos, branch },
      }],
    };
    (byBranchIndex[pos] ??= []).push(star);
  }
  trace.push({
    rule: 'ziwei.star.place.ziweiGroup.summary',
    detail: `紫微星系 6 颗主星已落宫 (锚点紫微@${PALACE_BRANCH_ORDER[ziweiPosition]})`,
    data: { ziweiPosition },
  });
  return { byBranchIndex, explanationTrace: trace };
}

/** Place the 天府 group (8 stars). */
export function placeTianfuGroup(
  tianfuPosition: number,
  sihuaMap: Partial<Record<string, SihuaTransform>>,
): PlacedStarsResult {
  const byBranchIndex: Record<number, ZiweiStar[]> = {};
  const trace: ExplanationStep[] = [];
  for (const [name, offset] of Object.entries(TIANFU_GROUP_OFFSETS)) {
    const pos = ((tianfuPosition + offset) % 12 + 12) % 12;
    const branch = PALACE_BRANCH_ORDER[pos];
    const star: ZiweiStar = {
      name,
      type: 'major',
      group: 'tianfu',
      brightness: brightnessOf(name, branch),
      sihua: sihuaMap[name],
      placementRule: `ziwei.major.tianfuGroup.${name}`,
      explanationTrace: [{
        rule: 'ziwei.star.place.tianfuGroup',
        detail: `${name}: 天府位 ${tianfuPosition} + 偏移 ${offset} → ${branch} (亮度 ${brightnessOf(name, branch)})`,
        data: { name, offset, tianfuPosition, position: pos, branch },
      }],
    };
    (byBranchIndex[pos] ??= []).push(star);
  }
  trace.push({
    rule: 'ziwei.star.place.tianfuGroup.summary',
    detail: `天府星系 8 颗主星已落宫 (锚点天府@${PALACE_BRANCH_ORDER[tianfuPosition]})`,
    data: { tianfuPosition },
  });
  return { byBranchIndex, explanationTrace: trace };
}

/** Convenience：合并两组主星. */
export function placeMajorStars(
  ziweiPosition: number,
  tianfuPosition: number,
  sihuaMap: Partial<Record<string, SihuaTransform>>,
): PlacedStarsResult {
  const ziwei = placeZiweiGroup(ziweiPosition, sihuaMap);
  const tianfu = placeTianfuGroup(tianfuPosition, sihuaMap);
  const merged: Record<number, ZiweiStar[]> = {};
  for (const src of [ziwei.byBranchIndex, tianfu.byBranchIndex]) {
    for (const [k, v] of Object.entries(src)) {
      const i = Number(k);
      (merged[i] ??= []).push(...v);
    }
  }
  return {
    byBranchIndex: merged,
    explanationTrace: [...ziwei.explanationTrace, ...tianfu.explanationTrace],
  };
}
