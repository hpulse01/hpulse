/**
 * P4.4 — 大限 (10-year palace progressions).
 *
 * Rule:
 *   - startDaxianAge = 五行局数 (e.g. 水二局 → 2)
 *   - 阳男阴女顺行, 阴男阳女逆行
 *   - 每十年一宫, 共 12 宫
 */

import type { ExplanationStep } from '../astro-time/types';
import type { Gender } from '../../types/prediction';
import type { Stem, ZiweiPalace, DaXianStep } from './types';
import { PALACE_BRANCH_ORDER, HEAVENLY_STEMS } from './constants';

export function calculateDaxian(opts: {
  palaces: ZiweiPalace[];
  mingIndex: number;
  wuxingJuNumber: number;
  gender: Gender;
  yearGan: Stem;
}): {
  steps: DaXianStep[];
  startAge: number;
  direction: 'clockwise' | 'counterclockwise';
  explanationTrace: ExplanationStep[];
} {
  const { palaces, mingIndex, wuxingJuNumber, gender, yearGan } = opts;
  const trace: ExplanationStep[] = [];

  const yearGanIdx = HEAVENLY_STEMS.indexOf(yearGan);
  const isYangYear = yearGanIdx % 2 === 0;
  const isMale = gender === 'male';
  const clockwise = (isYangYear && isMale) || (!isYangYear && !isMale);
  const direction: 'clockwise' | 'counterclockwise' = clockwise ? 'clockwise' : 'counterclockwise';

  trace.push({
    rule: 'ziwei.daxian.direction',
    detail: `${isYangYear ? '阳' : '阴'}年 + ${isMale ? '男' : '女'} → ${clockwise ? '顺行' : '逆行'}`,
    data: { yearGan, isYangYear, gender, clockwise },
  });
  trace.push({
    rule: 'ziwei.daxian.startAge',
    detail: `起运岁 = 五行局数 ${wuxingJuNumber}`,
    data: { wuxingJuNumber },
  });

  const steps: DaXianStep[] = [];
  for (let i = 0; i < 12; i++) {
    const startAge = wuxingJuNumber + i * 10;
    const endAge = startAge + 9;
    const offset = clockwise ? i : -i;
    const branchIndex = ((mingIndex + offset) % 12 + 12) % 12;
    const branch = PALACE_BRANCH_ORDER[branchIndex];
    const palace = palaces.find(p => p.index === branchIndex);
    steps.push({
      index: i,
      startAge,
      endAge,
      branchIndex,
      branch,
      palaceName: palace?.name ?? '命宫',
      stars: palace?.stars ?? [],
      direction,
      explanationTrace: [{
        rule: 'ziwei.daxian.step',
        detail: `第${i + 1}步: ${startAge}-${endAge}岁 → 宫支 ${branch} (${palace?.name ?? 'unknown'})`,
        data: { i, startAge, endAge, branch, palaceName: palace?.name },
      }],
    });
  }

  return { steps, startAge: wuxingJuNumber, direction, explanationTrace: trace };
}
