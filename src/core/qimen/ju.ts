/**
 * P4.7 — 阴阳遁判定 + 局数（局 by 节气 × 三元 × 符头）.
 */
import type {
  BranchCN, DunDirection, ExplanationStep, QimenWarning, ThreeYuan,
} from './types';
import {
  dunDirectionForTerm, JU_TABLE, FU_TOU_GROUP,
} from './constants';
import { jiaziIndex, parseGanzhi, sixtyJiazi, type Pillar } from '../calendar/ganzhi';

/** 找符头日：current 日柱往前找最近的 甲 或 己 日。 */
export function findFuTou(currentDayPillar: Pillar): Pillar {
  const idx = jiaziIndex(currentDayPillar);
  const cycle = sixtyJiazi();
  for (let back = 0; back < 60; back++) {
    const i = ((idx - back) % 60 + 60) % 60;
    const p = cycle[i];
    if (p.stem === '甲' || p.stem === '己') return p;
  }
  return currentDayPillar;
}

export function determineThreeYuan(fuTou: Pillar): { yuan: ThreeYuan; group: '子午卯酉' | '寅申巳亥' | '辰戌丑未' } {
  const group = FU_TOU_GROUP[fuTou.branch as BranchCN];
  const yuanByGroup: Record<string, ThreeYuan> = {
    '子午卯酉': '上元',
    '寅申巳亥': '中元',
    '辰戌丑未': '下元',
  };
  return { yuan: yuanByGroup[group], group };
}

export interface JuResolution {
  solarTerm: string;
  dunDirection: DunDirection;
  threeYuan: ThreeYuan;
  fuTouDay: string;
  fuTouBranchGroup: '子午卯酉' | '寅申巳亥' | '辰戌丑未';
  juNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export function resolveJu(
  solarTerm: string,
  dayGanzhi: string,
  trace: ExplanationStep[],
  warnings: QimenWarning[],
): JuResolution {
  const dun = dunDirectionForTerm(solarTerm);
  if (!dun) {
    warnings.push({
      code: 'qimen.term.unknown',
      message: `节气 "${solarTerm}" 不在 24 节气表中，回退到阳遁。`,
      level: 'warn',
    });
  }
  const dunDirection: DunDirection = dun ?? 'yang';

  const dayPillar = parseGanzhi(dayGanzhi);
  const fuTou = findFuTou(dayPillar);
  const tyu = determineThreeYuan(fuTou);

  const juRow = JU_TABLE[solarTerm];
  if (!juRow) {
    warnings.push({
      code: 'qimen.ju.missing',
      message: `节气 "${solarTerm}" 无对应局数表，回退到 阳遁1局。`,
      level: 'warn',
    });
  }
  const yuanIdx = tyu.yuan === '上元' ? 0 : tyu.yuan === '中元' ? 1 : 2;
  const juNumber = (juRow ? juRow[yuanIdx] : 1) as JuResolution['juNumber'];

  trace.push({
    rule: 'qimen.ju',
    detail: `节气=${solarTerm} → ${dunDirection === 'yang' ? '阳遁' : '阴遁'}；符头=${fuTou.ganzhi}(${tyu.group}) → ${tyu.yuan}；局数=${juNumber}。`,
    data: {
      solarTerm, dunDirection, fuTou: fuTou.ganzhi,
      fuTouBranchGroup: tyu.group, threeYuan: tyu.yuan, juNumber,
    },
  });

  return {
    solarTerm,
    dunDirection,
    threeYuan: tyu.yuan,
    fuTouDay: fuTou.ganzhi,
    fuTouBranchGroup: tyu.group,
    juNumber,
  };
}
