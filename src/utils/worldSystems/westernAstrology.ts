/**
 * Western Astrology Engine (西方占星术)
 *
 * Tropical zodiac system: Sun sign, Moon sign, Rising sign,
 * planetary house placements, and major aspects.
 *
 * REFACTORED v2.1: Uses real GAST-based Ascendant/MC from shared celestial layer.
 * Requires UTC datetime + geographic coordinates for accurate Rising sign.
 *
 * @source_urls
 *   - https://github.com/cosinekitty/astronomy (astronomy-engine, NASA JPL)
 *   - Meeus, "Astronomical Algorithms", 2nd ed. (Ascendant/MC formulas)
 *   - https://en.wikipedia.org/wiki/Astrological_aspect
 *   - https://en.wikipedia.org/wiki/Domicile_(astrology)
 * @source_grade A (astronomical calculations), B (aspect interpretation rules)
 * @algorithm_version 2.1.0
 * @rule_school Tropical zodiac, Whole Sign houses
 * @uncertainty_notes
 *   - Planetary longitudes: sub-arcsecond (astronomy-engine + JPL DE405)
 *   - Ascendant: ~0.5° with correct UTC time + geographic coordinates
 *   - Without geo coords, defaults to 0°N 0°E (Rising sign WILL be wrong)
 *   - House system: Whole Sign (simplest, no interpolation needed)
 *   - Aspect orbs follow common Western astrology convention (varies by school)
 *   - Life vector scoring is heuristic modeling, not a traditional astrological method
 */

import {
  getCelestialSnapshot,
  CELESTIAL_LAYER_METADATA,
  type CelestialPosition,
} from '../astronomy/celestialPositions';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface WesternAstrologyInput {
  year: number;
  month: number;
  day: number;
  hour: number;       // UTC hour (0-23)
  minute: number;     // UTC minute (0-59)
  geoLatitude?: number;   // degrees, north positive
  geoLongitude?: number;  // degrees, east positive
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  signIndex: number;
  degree: number;        // 0-360 ecliptic longitude
  degreeInSign: number;  // 0-30
  house: number;         // 1-12 (Whole Sign)
  element: WesternElement;
  modality: 'cardinal' | 'fixed' | 'mutable';
}

export interface AspectInfo {
  planetA: string;
  planetB: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  orb: number;
  harmony: number; // -1 to 1
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

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

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

// ═══════════════════════════════════════════════
// Aspect calculation
// ═══════════════════════════════════════════════

const ASPECT_DEFS: { type: AspectInfo['type']; angle: number; orb: number; harmony: number }[] = [
  { type: 'conjunction', angle: 0, orb: 8, harmony: 0.5 },
  { type: 'sextile', angle: 60, orb: 6, harmony: 0.7 },
  { type: 'square', angle: 90, orb: 7, harmony: -0.6 },
  { type: 'trine', angle: 120, orb: 8, harmony: 0.9 },
  { type: 'opposition', angle: 180, orb: 8, harmony: -0.4 },
];

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

// ═══════════════════════════════════════════════
// Whole Sign house assignment
// ═══════════════════════════════════════════════

/**
 * Whole Sign houses: the sign containing the Ascendant is House 1,
 * the next sign is House 2, etc.
 */
function assignWholeSignHouse(planetSignIndex: number, ascendantSignIndex: number): number {
  return ((planetSignIndex - ascendantSignIndex + 12) % 12) + 1;
}

// ═══════════════════════════════════════════════
// Convert CelestialPosition → PlanetPosition
// ═══════════════════════════════════════════════

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

// ═══════════════════════════════════════════════
// Main engine
// ═══════════════════════════════════════════════

export const WesternAstrologyEngine = {
  calculate(input: WesternAstrologyInput): WesternAstrologyReport {
    // Get precise planetary positions from shared astronomy layer
    // Passes geographic coordinates for real Ascendant/MC calculation
    const snapshot = getCelestialSnapshot(
      input.year, input.month, input.day,
      input.hour, input.minute,
      input.geoLatitude ?? 0,
      input.geoLongitude ?? 0,
    );

    // Ascendant sign (computed from real GAST + geographic coordinates)
    const ascSignIdx = Math.floor(snapshot.ascendantLongitude / 30) % 12;
    const risingSign = SIGNS[ascSignIdx];

    // Convert all positions to PlanetPosition with Whole Sign houses
    const planets: PlanetPosition[] = snapshot.all.map(cp => toPlanetPosition(cp, ascSignIdx));

    const sunSign = planets.find(p => p.planet === 'Sun')!.sign;
    const moonSign = planets.find(p => p.planet === 'Moon')!.sign;

    // Aspects
    const aspects = calculateAspects(planets);

    // Element balance (weighted: Sun=3, Moon=2, others=1)
    const elementBalance: Record<WesternElement, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    planets.forEach(p => {
      const weight = p.planet === 'Sun' ? 3 : p.planet === 'Moon' ? 2 : 1;
      elementBalance[p.element] += weight;
    });
    const dominantElement = (Object.entries(elementBalance) as [WesternElement, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    // Life vectors (heuristic scoring)
    const harmonySum = aspects.reduce((s, a) => s + a.harmony, 0);
    const baseScore = 50 + harmonySum * 5;

    const lifeVectors: Record<string, number> = {
      career: clamp(baseScore + elementBalance.fire * 3 + elementBalance.earth * 2),
      wealth: clamp(baseScore + elementBalance.earth * 4 + elementBalance.water * 1),
      love: clamp(baseScore + elementBalance.water * 3 + elementBalance.air * 2),
      health: clamp(baseScore + elementBalance.earth * 3 - aspects.filter(a => a.harmony < 0).length * 3),
      wisdom: clamp(baseScore + elementBalance.air * 4 + elementBalance.water * 2),
      social: clamp(baseScore + elementBalance.air * 3 + elementBalance.fire * 2),
      creativity: clamp(baseScore + elementBalance.fire * 3 + elementBalance.water * 3),
      fortune: clamp(baseScore + harmonySum * 3),
      family: clamp(baseScore + elementBalance.water * 3 + elementBalance.earth * 2),
      spirituality: clamp(baseScore + elementBalance.water * 4 + elementBalance.fire * 1),
    };

    return {
      sunSign, moonSign, risingSign,
      planets, aspects, elementBalance, dominantElement, lifeVectors,
    };
  },

  getSignCN(sign: string): string {
    return SIGN_CN[sign] || sign;
  },

  /** Source metadata for audit trail */
  metadata: {
    source_urls: [
      ...CELESTIAL_LAYER_METADATA.source_urls,
      'https://en.wikipedia.org/wiki/Astrological_aspect',
      'https://en.wikipedia.org/wiki/Domicile_(astrology)',
    ],
    source_grade: 'A' as const,
    algorithm_version: '2.1.0',
    rule_school: 'Tropical Zodiac, Whole Sign Houses',
    uncertainty_notes: [
      ...CELESTIAL_LAYER_METADATA.uncertainty_notes,
      'Aspect orbs follow common convention (8° for major, 6° for sextile)',
      'Life vector scoring is heuristic, not traditional Western astrology',
    ],
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
