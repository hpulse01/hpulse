/**
 * Western Astrology Engine (西方占星术)
 *
 * P0 strict version:
 * - Input is local birth time + timezone offset + geographic coordinates.
 * - Converted to UTC before calling shared celestial layer.
 */

import {
  getCelestialSnapshot,
  CELESTIAL_LAYER_METADATA,
  type CelestialPosition,
} from '../astronomy/celestialPositions';

export interface WesternAstrologyInput {
  year: number;
  month: number;
  day: number;
  hour: number; // local birth hour
  minute: number; // local birth minute
  timezoneOffsetMinutes: number; // e.g. +480 for UTC+8
  geoLatitude: number;
  geoLongitude: number;
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  signIndex: number;
  degree: number;
  degreeInSign: number;
  house: number;
  element: WesternElement;
  modality: 'cardinal' | 'fixed' | 'mutable';
}

export interface AspectInfo {
  planetA: string;
  planetB: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  orb: number;
  harmony: number;
}

export type WesternElement = 'fire' | 'earth' | 'air' | 'water';

export interface WesternAstrologyReport {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  planets: PlanetPosition[];
  aspects: AspectInfo[];
  elementBalance: Record<WesternElement, number>;
  dominantElement: WesternElement;
  lifeVectors: Record<string, number>;
}

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SIGN_CN: Record<string, string> = {
  Aries: '白羊', Taurus: '金牛', Gemini: '双子', Cancer: '巨蟹',
  Leo: '狮子', Virgo: '处女', Libra: '天秤', Scorpio: '天蝎',
  Sagittarius: '射手', Capricorn: '摩羯', Aquarius: '水瓶', Pisces: '双鱼',
};

const SIGN_ELEMENTS: WesternElement[] = [
  'fire', 'earth', 'air', 'water', 'fire', 'earth',
  'air', 'water', 'fire', 'earth', 'air', 'water',
];

const SIGN_MODALITIES: ('cardinal' | 'fixed' | 'mutable')[] = [
  'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable',
  'cardinal', 'fixed', 'mutable', 'cardinal', 'fixed', 'mutable',
];

const ASPECT_DEFS: { type: AspectInfo['type']; angle: number; orb: number; harmony: number }[] = [
  { type: 'conjunction', angle: 0, orb: 8, harmony: 0.5 },
  { type: 'sextile', angle: 60, orb: 6, harmony: 0.7 },
  { type: 'square', angle: 90, orb: 7, harmony: -0.6 },
  { type: 'trine', angle: 120, orb: 8, harmony: 0.9 },
  { type: 'opposition', angle: 180, orb: 8, harmony: -0.4 },
];

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

function toUtcParts(input: WesternAstrologyInput): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const utcMs = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0)
    - input.timezoneOffsetMinutes * 60_000;
  const d = new Date(utcMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

function assignWholeSignHouse(planetSignIndex: number, ascendantSignIndex: number): number {
  return ((planetSignIndex - ascendantSignIndex + 12) % 12) + 1;
}

function toPlanetPosition(cp: CelestialPosition, ascSignIdx: number): PlanetPosition {
  return {
    planet: cp.body,
    sign: SIGNS[cp.signIndex],
    signIndex: cp.signIndex,
    degree: Math.round(cp.longitude * 10000) / 10000,
    degreeInSign: Math.round(cp.degreeInSign * 100) / 100,
    house: assignWholeSignHouse(cp.signIndex, ascSignIdx),
    element: SIGN_ELEMENTS[cp.signIndex],
    modality: SIGN_MODALITIES[cp.signIndex],
  };
}

function calculateAspects(planets: PlanetPosition[]): AspectInfo[] {
  const results: AspectInfo[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = Math.abs(planets[i].degree - planets[j].degree);
      const angle = Math.min(diff, 360 - diff);
      for (const def of ASPECT_DEFS) {
        const orbActual = Math.abs(angle - def.angle);
        if (orbActual <= def.orb) {
          results.push({
            planetA: planets[i].planet,
            planetB: planets[j].planet,
            type: def.type,
            orb: Math.round(orbActual * 100) / 100,
            harmony: Math.round(def.harmony * (1 - orbActual / def.orb) * 1000) / 1000,
          });
          break;
        }
      }
    }
  }
  return results;
}

export const WesternAstrologyEngine = {
  calculate(input: WesternAstrologyInput): WesternAstrologyReport {
    const utc = toUtcParts(input);
    const snapshot = getCelestialSnapshot(
      utc.year,
      utc.month,
      utc.day,
      utc.hour,
      utc.minute,
      input.geoLatitude,
      input.geoLongitude,
    );

    const ascSignIdx = Math.floor(snapshot.ascendantLongitude / 30) % 12;
    const risingSign = SIGNS[ascSignIdx];

    const planets = snapshot.all.map((cp) => toPlanetPosition(cp, ascSignIdx));
    const sunSign = planets.find((p) => p.planet === 'Sun')!.sign;
    const moonSign = planets.find((p) => p.planet === 'Moon')!.sign;
    const aspects = calculateAspects(planets);

    const elementBalance: Record<WesternElement, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    planets.forEach((p) => {
      const weight = p.planet === 'Sun' ? 3 : p.planet === 'Moon' ? 2 : 1;
      elementBalance[p.element] += weight;
    });

    const dominantElement = (Object.entries(elementBalance) as [WesternElement, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    const harmonySum = aspects.reduce((s, a) => s + a.harmony, 0);
    const baseScore = 50 + harmonySum * 5;

    const lifeVectors: Record<string, number> = {
      career: clamp(baseScore + elementBalance.fire * 3 + elementBalance.earth * 2),
      wealth: clamp(baseScore + elementBalance.earth * 4 + elementBalance.water),
      love: clamp(baseScore + elementBalance.water * 3 + elementBalance.air * 2),
      health: clamp(baseScore + elementBalance.earth * 3 - aspects.filter((a) => a.harmony < 0).length * 3),
      wisdom: clamp(baseScore + elementBalance.air * 4 + elementBalance.water * 2),
      social: clamp(baseScore + elementBalance.air * 3 + elementBalance.fire * 2),
      creativity: clamp(baseScore + elementBalance.fire * 3 + elementBalance.water * 3),
      fortune: clamp(baseScore + harmonySum * 3),
      family: clamp(baseScore + elementBalance.water * 3 + elementBalance.earth * 2),
      spirituality: clamp(baseScore + elementBalance.water * 4 + elementBalance.fire),
    };

    return { sunSign, moonSign, risingSign, planets, aspects, elementBalance, dominantElement, lifeVectors };
  },

  getSignCN(sign: string): string {
    return SIGN_CN[sign] || sign;
  },

  metadata: {
    source_urls: [
      ...CELESTIAL_LAYER_METADATA.source_urls,
      'https://en.wikipedia.org/wiki/Astrological_aspect',
      'https://en.wikipedia.org/wiki/Domicile_(astrology)',
    ],
    source_grade: 'A' as const,
    algorithm_version: '2.2.0',
    rule_school: 'Tropical Zodiac, Whole Sign Houses',
    uncertainty_notes: [
      ...CELESTIAL_LAYER_METADATA.uncertainty_notes,
      'Input local birth time is converted to UTC via timezoneOffsetMinutes before astronomy calculation',
      'Aspect orbs follow common convention (8° major, 6° sextile)',
      'Life vector scoring is heuristic',
    ],
  },
};
