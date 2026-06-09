/**
 * 化气格 / 从格 detection (transformation & follow patterns).
 *
 * 化气格: 日干与月干或时干五合，且化神得月令（月支本气五行 = 化神），
 *         原局无强力克化之神 → 化气格成立候选。
 * 从格:   日主无根极弱 → 按命局最旺一方判从财/从杀(官)/从儿(食伤)/从势；
 *         日主极旺、满盘比劫印绶 → 从强格。
 */

import type { Stem, Branch, Element } from '../calendar/ganzhi';
import { STEM_ELEMENT, BRANCH_ELEMENT, HIDDEN_STEMS } from '../calendar/ganzhi';
import { tenGodOf, type TenGod } from '../calendar/tenGods';
import type { PatternCandidate } from './types';

const WU_HE: Record<Stem, { partner: Stem; element: Element }> = {
  甲: { partner: '己', element: '土' }, 己: { partner: '甲', element: '土' },
  乙: { partner: '庚', element: '金' }, 庚: { partner: '乙', element: '金' },
  丙: { partner: '辛', element: '水' }, 辛: { partner: '丙', element: '水' },
  丁: { partner: '壬', element: '木' }, 壬: { partner: '丁', element: '木' },
  戊: { partner: '癸', element: '火' }, 癸: { partner: '戊', element: '火' },
};

const KE: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export interface HuaQiResult {
  combined: boolean;
  partnerPosition: 'month' | 'hour' | null;
  transformedElement: Element | null;
  candidate: PatternCandidate | null;
}

/** 化气格 detection. */
export function detectHuaQiGe(pillars: {
  yearStem: Stem; monthStem: Stem; dayStem: Stem; hourStem: Stem;
  monthBranch: Branch;
}): HuaQiResult {
  const { dayStem, monthStem, hourStem, yearStem, monthBranch } = pillars;
  const he = WU_HE[dayStem];
  let partnerPosition: 'month' | 'hour' | null = null;
  if (monthStem === he.partner) partnerPosition = 'month';
  else if (hourStem === he.partner) partnerPosition = 'hour';
  if (!partnerPosition) {
    return { combined: false, partnerPosition: null, transformedElement: null, candidate: null };
  }

  const huaShen = he.element;
  const monthEl = BRANCH_ELEMENT[monthBranch];
  const deLing = monthEl === huaShen;

  // 克化之神透干 → 化不成（破化）
  const otherStems: Stem[] = partnerPosition === 'month' ? [yearStem, hourStem] : [yearStem, monthStem];
  const keHua = otherStems.some((s) => KE[STEM_ELEMENT[s]] === huaShen);

  const evidence = [
    `日干${dayStem}与${partnerPosition === 'month' ? '月' : '时'}干${he.partner}五合，化神为${huaShen}`,
    deLing ? `月令${monthBranch}(${monthEl})助化，化神得令` : `月令${monthBranch}(${monthEl})不助化`,
  ];
  const warnings: string[] = [];
  if (keHua) warnings.push('原局透出克化之神，化象受损');
  if (!deLing) warnings.push('化神不得月令，化气格不成立或为假化');

  const confidence = deLing ? (keHua ? 45 : 72) : 25;
  return {
    combined: true,
    partnerPosition,
    transformedElement: huaShen,
    candidate: {
      name: `化${huaShen}格${deLing && !keHua ? '' : '(候选)'}`,
      type: '化气格',
      confidence,
      evidence,
      warnings,
    },
  };
}

const CONG_GROUP: Record<string, TenGod[]> = {
  从财格: ['正财', '偏财'],
  从杀格: ['正官', '七杀'],
  从儿格: ['食神', '伤官'],
};

export interface CongGeInput {
  dayStem: Stem;
  stems: Stem[];          // year/month/hour stems
  branches: Branch[];     // all 4 branches
  hasRoot: boolean;
  strengthLevel: 'veryStrong' | 'strong' | 'balanced' | 'weak' | 'veryWeak';
}

/** 从格 refinement: 从财/从杀/从儿/从势/从强. */
export function detectCongGe(input: CongGeInput): PatternCandidate[] {
  const { dayStem, stems, branches, hasRoot, strengthLevel } = input;
  const out: PatternCandidate[] = [];

  // Tally ten-god groups across visible stems + branch primary hidden stems
  const tally = new Map<TenGod, number>();
  const add = (g: TenGod, w: number) => tally.set(g, (tally.get(g) ?? 0) + w);
  for (const s of stems) add(tenGodOf(dayStem, s), 1.0);
  for (const b of branches) {
    const hidden = HIDDEN_STEMS[b];
    hidden.forEach((s, i) => add(tenGodOf(dayStem, s), [1.0, 0.4, 0.2][i] ?? 0.2));
  }
  const groupWeight = (gods: TenGod[]) => gods.reduce((sum, g) => sum + (tally.get(g) ?? 0), 0);
  const biJie = groupWeight(['比肩', '劫财']);
  const yinXing = groupWeight(['正印', '偏印']);

  if (strengthLevel === 'veryWeak' && !hasRoot && biJie + yinXing < 1.0) {
    const entries = Object.entries(CONG_GROUP)
      .map(([name, gods]) => ({ name, w: groupWeight(gods) }))
      .sort((a, b) => b.w - a.w);
    const top = entries[0];
    const total = entries.reduce((s, e) => s + e.w, 0);
    if (top.w > 0 && total > 0) {
      const dominant = top.w / total >= 0.5;
      out.push({
        name: dominant ? top.name : '从势格(候选)',
        type: '从弱格',
        confidence: dominant ? 68 : 50,
        evidence: [
          `日主无根极弱，比劫印绶力量 ${(biJie + yinXing).toFixed(1)} 不足以扶身`,
          `最旺一方：${top.name.replace('格', '')}（权重 ${top.w.toFixed(1)}/${total.toFixed(1)}）`,
        ],
        warnings: dominant ? [] : ['财官食伤分布均衡，按从势格论'],
      });
    }
  }

  if (strengthLevel === 'veryStrong') {
    const keXieHao = Array.from(tally.entries())
      .filter(([g]) => !['比肩', '劫财', '正印', '偏印'].includes(g))
      .reduce((s, [, w]) => s + w, 0);
    if (keXieHao < 1.0) {
      out.push({
        name: '从强格',
        type: '从强格',
        confidence: 66,
        evidence: [
          `日主极旺，比劫 ${biJie.toFixed(1)} + 印绶 ${yinXing.toFixed(1)}，克泄耗仅 ${keXieHao.toFixed(1)}`,
        ],
        warnings: ['从强格需岁运不逆化神，逢克泄耗之运反凶'],
      });
    }
  }

  return out;
}
