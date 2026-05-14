/**
 * P4.4 — 四化 (year-stem driven 禄/权/科/忌).
 */

import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import type { SihuaInfo, SihuaTransform, Stem } from './types';
import { SIHUA_TABLE, SIHUA_MEANINGS, HEAVENLY_STEMS } from './constants';

export function calculateSihua(yearGan: Stem): {
  sihua: SihuaInfo[];
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
} {
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];

  if (!HEAVENLY_STEMS.includes(yearGan)) {
    warnings.push({
      code: 'ZIWEI_SIHUA_INVALID_STEM',
      message: `非法年干 ${yearGan}, 四化无法生成`,
      severity: 'error',
    });
    return { sihua: [], warnings, explanationTrace: trace };
  }

  const config = SIHUA_TABLE[yearGan];
  const sihua: SihuaInfo[] = (['禄', '权', '科', '忌'] as SihuaTransform[]).map((transform) => {
    const star = config[transform];
    const info: SihuaInfo = {
      yearStem: yearGan,
      star,
      transform,
      meaning: SIHUA_MEANINGS[transform],
      explanationTrace: [{
        rule: 'ziwei.sihua.assign',
        detail: `年干 ${yearGan} → ${transform} 化 ${star} (${SIHUA_MEANINGS[transform]})`,
        data: { yearGan, transform, star },
      }],
    };
    return info;
  });

  trace.push({
    rule: 'ziwei.sihua.summary',
    detail: `四化: ${sihua.map(s => `${s.star}化${s.transform}`).join('、')}`,
    data: { yearGan },
  });
  return { sihua, warnings, explanationTrace: trace };
}

/** Convert sihua list → quick map for star→transform lookup. */
export function buildSihuaMap(sihua: SihuaInfo[]): Record<string, SihuaTransform> {
  const m: Record<string, SihuaTransform> = {};
  for (const s of sihua) m[s.star] = s.transform;
  return m;
}
