/**
 * P4.4 — 亮度 / 宫位评分 / 评价.
 */

import type { ZiweiStar, ZiweiPalace, StarBrightness, PalaceStrength } from './types';
import { STAR_BRIGHTNESS, BRIGHTNESS_SCORE } from './constants';

export function getStarBrightness(starName: string, branch: ZiweiPalace['branch']): StarBrightness {
  return STAR_BRIGHTNESS[starName]?.[branch] ?? '平';
}

export function scoreStarBrightness(star: ZiweiStar): number {
  return BRIGHTNESS_SCORE[star.brightness] ?? 0;
}

/** 主星>辅星>煞星权重；煞星庙旺反为吉. */
export function scorePalace(palace: Pick<ZiweiPalace, 'stars'>): PalaceStrength {
  let brightFactor = 0;
  let sihuaDelta = 0;
  let shaDelta = 0;

  for (const star of palace.stars) {
    const bright = scoreStarBrightness(star);
    if (star.type === 'major') brightFactor += bright * 2.5;
    else if (star.type === 'auxiliary') brightFactor += bright * 1.5;
    else if (star.type === 'sha') {
      // 煞星：庙旺为正,陷为负，且乘 1.2 反映影响力
      shaDelta += bright * 1.2;
    } else {
      brightFactor += bright * 0.5; // minor (博士神)
    }
    if (star.sihua === '禄') sihuaDelta += 8;
    else if (star.sihua === '权') sihuaDelta += 6;
    else if (star.sihua === '科') sihuaDelta += 5;
    else if (star.sihua === '忌') sihuaDelta -= 10;
  }

  const hasMajor = palace.stars.some(s => s.type === 'major');
  const empty = hasMajor ? 0 : -5;
  const score = Math.max(5, Math.min(95, Math.round(50 + brightFactor + sihuaDelta + shaDelta + empty)));

  return { score, brightFactor, sihuaDelta, shaDelta };
}

export function evaluatePalace(palace: Pick<ZiweiPalace, 'stars'>): { evaluation: string; interpretationKeys: string[] } {
  const majors = palace.stars.filter(s => s.type === 'major');
  const auxs = palace.stars.filter(s => s.type === 'auxiliary');
  const shas = palace.stars.filter(s => s.type === 'sha');
  const brightMajors = majors.filter(s => s.brightness === '庙' || s.brightness === '旺');
  const dimMajors = majors.filter(s => s.brightness === '陷');
  const hasLu = palace.stars.some(s => s.sihua === '禄');
  const hasJi = palace.stars.some(s => s.sihua === '忌');

  const parts: string[] = [];
  const keys: string[] = [];

  if (majors.length === 0) {
    parts.push('命无正曜，借对宫论之');
    keys.push('palace.empty.major');
  } else {
    parts.push(`主星${majors.map(s => `${s.name}(${s.brightness})`).join('、')}`);
    keys.push(...majors.map(s => `palace.major.${s.name}.${s.brightness}`));
    if (brightMajors.length > 0) { parts.push('星曜明亮'); keys.push('palace.bright'); }
    if (dimMajors.length > 0) { parts.push('星曜陷落'); keys.push('palace.dim'); }
  }
  if (auxs.length > 0) { parts.push(`吉星${auxs.map(s => s.name).join('、')}助力`); keys.push(...auxs.map(s => `palace.aux.${s.name}`)); }
  if (shas.length > 0) { parts.push(`煞星${shas.map(s => s.name).join('、')}冲击`); keys.push(...shas.map(s => `palace.sha.${s.name}`)); }
  if (hasLu) { parts.push('化禄加持'); keys.push('palace.sihua.lu'); }
  if (hasJi) { parts.push('化忌入宫'); keys.push('palace.sihua.ji'); }

  return { evaluation: parts.join('。'), interpretationKeys: keys };
}
