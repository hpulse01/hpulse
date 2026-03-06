/**
 * Western Astrology Engine (西方占星术)
 *
 * Tropical zodiac system: Sun sign, Moon sign (approx), Rising sign (approx),
 * planetary house placements, and major aspects.
 * Each produces life-event probability vectors used by the multiverse generator.
 */

export interface WesternAstrologyInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface PlanetPosition {
  planet: string;
  sign: string;
  signIndex: number;
  degree: number;
  house: number;
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
  lifeVectors: Record<string, number>; // life aspect -> 0-100
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

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

// Approximate mean daily motion (degrees) for simplified ephemeris
const PLANET_SPEEDS: Record<string, number> = {
  Sun: 0.9856, Moon: 13.176, Mercury: 1.383, Venus: 1.2,
  Mars: 0.524, Jupiter: 0.0831, Saturn: 0.0335,
};

// J2000 epoch mean longitudes (simplified)
const PLANET_J2000: Record<string, number> = {
  Sun: 280.46, Moon: 218.32, Mercury: 252.25, Venus: 181.98,
  Mars: 355.43, Jupiter: 34.35, Saturn: 49.94,
};

function julianDay(y: number, m: number, d: number, h: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + h / 24 + B - 1524.5;
}

function approxPlanetLongitude(planet: string, jd: number): number {
  const daysSinceJ2000 = jd - 2451545.0;
  const base = PLANET_J2000[planet] || 0;
  const speed = PLANET_SPEEDS[planet] || 1;
  return ((base + speed * daysSinceJ2000) % 360 + 360) % 360;
}

function getSignIndex(longitude: number): number {
  return Math.floor(longitude / 30) % 12;
}

function getDegreeInSign(longitude: number): number {
  return longitude % 30;
}

function calculateAspects(planets: PlanetPosition[]): AspectInfo[] {
  const aspectDefs: { type: AspectInfo['type']; angle: number; orb: number; harmony: number }[] = [
    { type: 'conjunction', angle: 0, orb: 8, harmony: 0.5 },
    { type: 'sextile', angle: 60, orb: 6, harmony: 0.7 },
    { type: 'square', angle: 90, orb: 7, harmony: -0.6 },
    { type: 'trine', angle: 120, orb: 8, harmony: 0.9 },
    { type: 'opposition', angle: 180, orb: 8, harmony: -0.4 },
  ];

  const results: AspectInfo[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = Math.abs(planets[i].degree - planets[j].degree);
      const angle = Math.min(diff, 360 - diff);
      for (const def of aspectDefs) {
        const orbActual = Math.abs(angle - def.angle);
        if (orbActual <= def.orb) {
          results.push({
            planetA: planets[i].planet,
            planetB: planets[j].planet,
            type: def.type,
            orb: orbActual,
            harmony: def.harmony * (1 - orbActual / def.orb),
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
    const jd = julianDay(input.year, input.month, input.day, input.hour + input.minute / 60);

    const planets: PlanetPosition[] = PLANETS.map(planet => {
      const longitude = approxPlanetLongitude(planet, jd);
      const signIdx = getSignIndex(longitude);
      return {
        planet,
        sign: SIGNS[signIdx],
        signIndex: signIdx,
        degree: longitude,
        house: (signIdx + Math.floor(input.hour / 2)) % 12 + 1,
        element: SIGN_ELEMENTS[signIdx],
        modality: SIGN_MODALITIES[signIdx],
      };
    });

    const sunSign = planets.find(p => p.planet === 'Sun')!.sign;
    const moonSign = planets.find(p => p.planet === 'Moon')!.sign;

    // Rising sign approximation based on hour
    const risingIdx = (getSignIndex(approxPlanetLongitude('Sun', jd)) + Math.floor((input.hour + 6) % 24 / 2)) % 12;
    const risingSign = SIGNS[risingIdx];

    const aspects = calculateAspects(planets);

    const elementBalance: Record<WesternElement, number> = { fire: 0, earth: 0, air: 0, water: 0 };
    planets.forEach(p => { elementBalance[p.element] += p.planet === 'Sun' ? 3 : p.planet === 'Moon' ? 2 : 1; });
    const dominantElement = (Object.entries(elementBalance) as [WesternElement, number][])
      .sort((a, b) => b[1] - a[1])[0][0];

    const harmonySum = aspects.reduce((s, a) => s + a.harmony, 0);
    const baseScore = 50 + harmonySum * 5;

    const lifeVectors: Record<string, number> = {
      career: clamp(baseScore + (elementBalance.fire * 3) + (elementBalance.earth * 2)),
      wealth: clamp(baseScore + (elementBalance.earth * 4) + (elementBalance.water * 1)),
      love: clamp(baseScore + (elementBalance.water * 3) + (elementBalance.air * 2)),
      health: clamp(baseScore + (elementBalance.earth * 3) - (aspects.filter(a => a.harmony < 0).length * 3)),
      wisdom: clamp(baseScore + (elementBalance.air * 4) + (elementBalance.water * 2)),
      social: clamp(baseScore + (elementBalance.air * 3) + (elementBalance.fire * 2)),
      creativity: clamp(baseScore + (elementBalance.fire * 3) + (elementBalance.water * 3)),
      fortune: clamp(baseScore + harmonySum * 3),
      family: clamp(baseScore + (elementBalance.water * 3) + (elementBalance.earth * 2)),
      spirituality: clamp(baseScore + (elementBalance.water * 4) + (elementBalance.fire * 1)),
    };

    return { sunSign, moonSign, risingSign, planets, aspects, elementBalance, dominantElement, lifeVectors };
  },

  getSignCN(sign: string): string {
    return SIGN_CN[sign] || sign;
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
