/**
 * P4.4 — 辅星 / 煞星 / 博士十二神 placement.
 */

import type { ExplanationStep } from '../astro-time/types';
import type { Branch, Stem, ZiweiStar, SihuaTransform } from './types';
import {
  PALACE_BRANCH_ORDER,
  STAR_BRIGHTNESS,
  HEAVENLY_STEMS,
  LUCUN_TABLE,
  QINGYANG_TABLE,
  TUOLUO_TABLE,
  TIANKUI_TABLE,
  TIANYUE_TABLE,
  TIANMA_TABLE,
  DIKONG_TABLE,
  DIJIE_TABLE,
  BOSHI_12_NAMES,
  SHA_STAR_NAMES,
} from './constants';

const SHA_SET = new Set<string>(SHA_STAR_NAMES);

function brightnessOf(starName: string, branch: Branch) {
  return STAR_BRIGHTNESS[starName]?.[branch] ?? '平';
}

function makeStar(
  name: string,
  branchIndex: number,
  rule: string,
  detail: string,
  sihuaMap: Partial<Record<string, SihuaTransform>>,
): ZiweiStar {
  const branch = PALACE_BRANCH_ORDER[branchIndex];
  const isSha = SHA_SET.has(name);
  return {
    name,
    type: isSha ? 'sha' : 'auxiliary',
    group: isSha ? 'sha' : 'auxiliary',
    brightness: brightnessOf(name, branch),
    sihua: sihuaMap[name],
    placementRule: rule,
    explanationTrace: [{ rule, detail, data: { name, branch, branchIndex } }],
  };
}

function pushAt(map: Record<number, ZiweiStar[]>, idx: number, star: ZiweiStar) {
  (map[idx] ??= []).push(star);
}

function branchToIndex(b: Branch | undefined): number {
  if (!b) return -1;
  return PALACE_BRANCH_ORDER.indexOf(b);
}

/** 安星：辅星 + 煞星 + 博士十二神. */
export function placeAuxiliaryStars(opts: {
  yearGan: Stem;
  yearZhi: Branch;
  lunarMonth: number;
  hourBranchIndex: number;
  sihuaMap: Partial<Record<string, SihuaTransform>>;
}): {
  byBranchIndex: Record<number, ZiweiStar[]>;
  explanationTrace: ExplanationStep[];
} {
  const { yearGan, yearZhi, lunarMonth, hourBranchIndex, sihuaMap } = opts;
  const trace: ExplanationStep[] = [];
  const map: Record<number, ZiweiStar[]> = {};

  // ── 左辅 (寅起正月顺) / 右弼 (戌起正月逆) ──
  // 旧实现采用 (2 + lunarMonth -1) % 12 / (8 - lunarMonth +1+12) %12 (in 寅首ring)
  const zuofuIdx = ((2 + lunarMonth - 1) % 12 + 12) % 12;
  const youbiIdx = ((8 - lunarMonth + 1) % 12 + 12) % 12;
  pushAt(map, zuofuIdx, makeStar('左辅', zuofuIdx,
    'ziwei.aux.zuofu', `左辅: 寅起正月顺数, 农历${lunarMonth}月 → ${PALACE_BRANCH_ORDER[zuofuIdx]}`, sihuaMap));
  pushAt(map, youbiIdx, makeStar('右弼', youbiIdx,
    'ziwei.aux.youbi', `右弼: 戌起正月逆数, 农历${lunarMonth}月 → ${PALACE_BRANCH_ORDER[youbiIdx]}`, sihuaMap));

  // ── 文昌 (戌起子时逆) / 文曲 (辰起子时顺) ──
  const wenchangIdx = ((8 - hourBranchIndex) % 12 + 12) % 12;
  const wenquIdx = ((2 + hourBranchIndex) % 12 + 12) % 12;
  pushAt(map, wenchangIdx, makeStar('文昌', wenchangIdx,
    'ziwei.aux.wenchang', `文昌: 戌起子时逆数, 时辰idx=${hourBranchIndex} → ${PALACE_BRANCH_ORDER[wenchangIdx]}`, sihuaMap));
  pushAt(map, wenquIdx, makeStar('文曲', wenquIdx,
    'ziwei.aux.wenqu', `文曲: 辰起子时顺数, 时辰idx=${hourBranchIndex} → ${PALACE_BRANCH_ORDER[wenquIdx]}`, sihuaMap));

  // ── 天魁 / 天钺 / 禄存 / 擎羊 / 陀罗 (年干表) ──
  const tableEntries: { name: string; branch: Branch | undefined; rule: string }[] = [
    { name: '天魁', branch: TIANKUI_TABLE[yearGan], rule: 'ziwei.aux.tiankui' },
    { name: '天钺', branch: TIANYUE_TABLE[yearGan], rule: 'ziwei.aux.tianyue' },
    { name: '禄存', branch: LUCUN_TABLE[yearGan], rule: 'ziwei.aux.lucun' },
    { name: '擎羊', branch: QINGYANG_TABLE[yearGan], rule: 'ziwei.aux.qingyang' },
    { name: '陀罗', branch: TUOLUO_TABLE[yearGan], rule: 'ziwei.aux.tuoluo' },
  ];
  for (const e of tableEntries) {
    const idx = branchToIndex(e.branch);
    if (idx < 0) continue;
    pushAt(map, idx, makeStar(e.name, idx, e.rule,
      `${e.name}: 年干 ${yearGan} → 地支 ${e.branch}`, sihuaMap));
  }

  // ── 天马 (年支表) ──
  const tianmaBranch = TIANMA_TABLE[yearZhi];
  const tianmaIdx = branchToIndex(tianmaBranch);
  if (tianmaIdx >= 0) {
    pushAt(map, tianmaIdx, makeStar('天马', tianmaIdx, 'ziwei.aux.tianma',
      `天马: 年支 ${yearZhi} → 地支 ${tianmaBranch}`, sihuaMap));
  }

  // ── 火星 / 铃星 (年支三合 + 时辰) ──
  const huoStartIdx = (() => {
    if (['巳', '酉', '丑'].includes(yearZhi)) return 4;
    if (['亥', '卯', '未'].includes(yearZhi)) return 8;
    return 2;
  })();
  const huoIdx = (huoStartIdx + hourBranchIndex) % 12;
  pushAt(map, huoIdx, makeStar('火星', huoIdx, 'ziwei.sha.huoxing',
    `火星: 年支 ${yearZhi} 三合起始 ${huoStartIdx} + 时辰 ${hourBranchIndex} → ${PALACE_BRANCH_ORDER[huoIdx]}`, sihuaMap));

  const lingStartIdx = (['寅', '午', '戌'].includes(yearZhi) || ['申', '子', '辰'].includes(yearZhi)) ? 4 : 8;
  const lingIdx = (lingStartIdx + hourBranchIndex) % 12;
  pushAt(map, lingIdx, makeStar('铃星', lingIdx, 'ziwei.sha.lingxing',
    `铃星: 年支 ${yearZhi} 三合起始 ${lingStartIdx} + 时辰 ${hourBranchIndex} → ${PALACE_BRANCH_ORDER[lingIdx]}`, sihuaMap));

  // ── 地空 / 地劫 (年支表) ──
  const dikongBranch = DIKONG_TABLE[yearZhi];
  const dijieBranch = DIJIE_TABLE[yearZhi];
  const dikongIdx = branchToIndex(dikongBranch);
  const dijieIdx = branchToIndex(dijieBranch);
  if (dikongIdx >= 0) {
    pushAt(map, dikongIdx, makeStar('地空', dikongIdx, 'ziwei.sha.dikong',
      `地空: 年支 ${yearZhi} → ${dikongBranch}`, sihuaMap));
  }
  if (dijieIdx >= 0) {
    pushAt(map, dijieIdx, makeStar('地劫', dijieIdx, 'ziwei.sha.dijie',
      `地劫: 年支 ${yearZhi} → ${dijieBranch}`, sihuaMap));
  }

  // ── 博士十二神：以禄存所在宫为博士起点，阳年顺行，阴年逆行 ──
  const lucunIdx = branchToIndex(LUCUN_TABLE[yearGan]);
  if (lucunIdx >= 0) {
    const yearGanIdx = HEAVENLY_STEMS.indexOf(yearGan);
    const isYangYear = yearGanIdx % 2 === 0;
    for (let i = 0; i < 12; i++) {
      const pos = isYangYear ? (lucunIdx + i) % 12 : ((lucunIdx - i) % 12 + 12) % 12;
      const name = BOSHI_12_NAMES[i];
      const branch = PALACE_BRANCH_ORDER[pos];
      pushAt(map, pos, {
        name,
        type: 'minor',
        group: 'minor',
        brightness: '平',
        placementRule: 'ziwei.boshi.assign',
        explanationTrace: [{
          rule: 'ziwei.boshi.assign',
          detail: `${name}: 禄存起 ${isYangYear ? '顺' : '逆'} 第 ${i + 1} 位 → ${branch}`,
          data: { name, lucunIdx, isYangYear, step: i, branch },
        }],
      });
    }
  }

  trace.push({
    rule: 'ziwei.aux.summary',
    detail: `辅星/煞星/博士十二神安星完成 (年干=${yearGan}, 年支=${yearZhi}, 月=${lunarMonth}, 时辰idx=${hourBranchIndex})`,
    data: { yearGan, yearZhi, lunarMonth, hourBranchIndex },
  });
  return { byBranchIndex: map, explanationTrace: trace };
}
