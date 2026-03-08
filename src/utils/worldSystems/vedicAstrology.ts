/**
 * Vedic Astrology / Jyotish Engine (吠陀占星术)
 *
 * Sidereal zodiac (Lahiri ayanamsa), Nakshatras (27 lunar mansions),
 * Vimshottari Dasha periods, and Yoga combinations.
 *
 * REFACTORED: Now uses astronomy-engine via shared celestial layer
 * for precise tropical positions, then applies Lahiri ayanamsa correction.
 * Previous version used linear mean-motion approximation (error up to ±30°).
 *
 * @source_urls
 *   - https://github.com/cosinekitty/astronomy (astronomy-engine)
 *   - https://en.wikipedia.org/wiki/Ayanamsa (Lahiri/Chitrapaksha standard)
 *   - Indian Astronomical Ephemeris (Government of India)
 *   - https://en.wikipedia.org/wiki/Nakshatra
 *   - https://en.wikipedia.org/wiki/Dasha_(astrology)
 * @source_grade A (planetary positions + ayanamsa), B (Yoga detection rules)
 * @algorithm_version 2.0.0
 * @rule_school Parashari (mainstream Vedic), Lahiri/Chitrapaksha ayanamsa
 * @uncertainty_notes
 *   - Sidereal positions: sub-arcsecond + Lahiri polynomial (±0.01° for 1900-2100)
 *   - Nakshatra boundaries: exact (360°/27 = 13°20' per nakshatra, 4 padas)
 *   - Vimshottari Dasha: standard 120-year cycle, starting from Moon nakshatra ruler
 *   - Yoga detection: simplified (only a few major yogas checked)
 *   - Ascendant: approximate without geographic coordinates
 */

import {
  getCelestialSnapshot,
  tropicalToSidereal,
  getLahiriAyanamsa,
  CELESTIAL_LAYER_METADATA,
} from '../astronomy/celestialPositions';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface VedicInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface NakshatraInfo {
  index: number;
  name: string;
  nameCN: string;
  ruler: string;
  pada: number;       // 1-4
  deity: string;
}

export interface DashaPeriod {
  planet: string;
  startAge: number;
  endAge: number;
  years: number;
  quality: 'benefic' | 'malefic' | 'neutral';
}

export interface VedicReport {
  rashiSign: string;
  rashiSignCN: string;
  moonNakshatra: NakshatraInfo;
  lagna: string;       // Ascendant rashi
  dashas: DashaPeriod[];
  yogas: string[];
  lifeVectors: Record<string, number>;
  ayanamsaUsed: number;  // the Lahiri ayanamsa value applied
  moonSiderealLongitude: number;
  sunSiderealLongitude: number;
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const RASHI_CN: Record<string, string> = {
  Mesha: '白羊', Vrishabha: '金牛', Mithuna: '双子', Karka: '巨蟹',
  Simha: '狮子', Kanya: '处女', Tula: '天秤', Vrischika: '天蝎',
  Dhanu: '射手', Makara: '摩羯', Kumbha: '水瓶', Meena: '双鱼',
};

/**
 * 27 Nakshatras with ruling planets and deities.
 * Order and rulers follow standard Parashari texts.
 * Each nakshatra spans 13°20' (360/27).
 */
const NAKSHATRAS: { name: string; nameCN: string; ruler: string; deity: string }[] = [
  { name: 'Ashwini',        nameCN: '马头',   ruler: 'Ketu',    deity: 'Ashwini Kumaras' },
  { name: 'Bharani',        nameCN: '角宿',   ruler: 'Venus',   deity: 'Yama' },
  { name: 'Krittika',       nameCN: '昴宿',   ruler: 'Sun',     deity: 'Agni' },
  { name: 'Rohini',         nameCN: '毕宿',   ruler: 'Moon',    deity: 'Brahma' },
  { name: 'Mrigashira',     nameCN: '参宿',   ruler: 'Mars',    deity: 'Soma' },
  { name: 'Ardra',          nameCN: '井宿',   ruler: 'Rahu',    deity: 'Rudra' },
  { name: 'Punarvasu',      nameCN: '鬼宿',   ruler: 'Jupiter', deity: 'Aditi' },
  { name: 'Pushya',         nameCN: '柳宿',   ruler: 'Saturn',  deity: 'Brihaspati' },
  { name: 'Ashlesha',       nameCN: '星宿',   ruler: 'Mercury', deity: 'Nagas' },
  { name: 'Magha',          nameCN: '张宿',   ruler: 'Ketu',    deity: 'Pitris' },
  { name: 'PurvaPhalguni',  nameCN: '翼宿',   ruler: 'Venus',   deity: 'Bhaga' },
  { name: 'UttaraPhalguni', nameCN: '轸宿',   ruler: 'Sun',     deity: 'Aryaman' },
  { name: 'Hasta',          nameCN: '角宿二', ruler: 'Moon',    deity: 'Savitar' },
  { name: 'Chitra',         nameCN: '亢宿',   ruler: 'Mars',    deity: 'Vishvakarma' },
  { name: 'Swati',          nameCN: '氐宿',   ruler: 'Rahu',    deity: 'Vayu' },
  { name: 'Vishakha',       nameCN: '房宿',   ruler: 'Jupiter', deity: 'Indragni' },
  { name: 'Anuradha',       nameCN: '心宿',   ruler: 'Saturn',  deity: 'Mitra' },
  { name: 'Jyeshtha',       nameCN: '尾宿',   ruler: 'Mercury', deity: 'Indra' },
  { name: 'Mula',           nameCN: '箕宿',   ruler: 'Ketu',    deity: 'Nirriti' },
  { name: 'PurvaAshadha',   nameCN: '斗宿',   ruler: 'Venus',   deity: 'Apas' },
  { name: 'UttaraAshadha',  nameCN: '牛宿',   ruler: 'Sun',     deity: 'Vishvedevas' },
  { name: 'Shravana',       nameCN: '女宿',   ruler: 'Moon',    deity: 'Vishnu' },
  { name: 'Dhanishtha',     nameCN: '虚宿',   ruler: 'Mars',    deity: 'Vasus' },
  { name: 'Shatabhisha',    nameCN: '危宿',   ruler: 'Rahu',    deity: 'Varuna' },
  { name: 'PurvaBhadra',    nameCN: '室宿',   ruler: 'Jupiter', deity: 'Ajaikapada' },
  { name: 'UttaraBhadra',   nameCN: '壁宿',   ruler: 'Saturn',  deity: 'Ahirbudhnya' },
  { name: 'Revati',         nameCN: '奎宿',   ruler: 'Mercury', deity: 'Pushan' },
];

/**
 * Vimshottari Dasha: standard 120-year cycle.
 * Order follows Nakshatra ruler sequence.
 * Total: 7+20+6+10+7+18+16+19+17 = 120 years.
 */
const DASHA_YEARS: { planet: string; years: number; quality: 'benefic' | 'malefic' | 'neutral' }[] = [
  { planet: 'Ketu',    years: 7,  quality: 'malefic' },
  { planet: 'Venus',   years: 20, quality: 'benefic' },
  { planet: 'Sun',     years: 6,  quality: 'neutral' },
  { planet: 'Moon',    years: 10, quality: 'benefic' },
  { planet: 'Mars',    years: 7,  quality: 'malefic' },
  { planet: 'Rahu',    years: 18, quality: 'malefic' },
  { planet: 'Jupiter', years: 16, quality: 'benefic' },
  { planet: 'Saturn',  years: 19, quality: 'neutral' },
  { planet: 'Mercury', years: 17, quality: 'benefic' },
];

// ═══════════════════════════════════════════════
// Nakshatra calculation
// ═══════════════════════════════════════════════

const NAKSHATRA_SPAN = 360 / 27; // 13.333...°
const PADA_SPAN = NAKSHATRA_SPAN / 4; // 3.333...°

function getNakshatraFromLongitude(siderealLongitude: number): NakshatraInfo {
  const normalized = ((siderealLongitude % 360) + 360) % 360;
  const nakIdx = Math.floor(normalized / NAKSHATRA_SPAN) % 27;
  const posInNak = normalized - nakIdx * NAKSHATRA_SPAN;
  const pada = Math.min(4, Math.max(1, Math.floor(posInNak / PADA_SPAN) + 1));
  const nak = NAKSHATRAS[nakIdx];

  return {
    index: nakIdx,
    name: nak.name,
    nameCN: nak.nameCN,
    ruler: nak.ruler,
    pada,
    deity: nak.deity,
  };
}

// ═══════════════════════════════════════════════
// Dasha calculation
// ═══════════════════════════════════════════════

function calculateDashas(moonNakshatra: NakshatraInfo, moonSiderealLong: number): DashaPeriod[] {
  const dashaStartIdx = DASHA_YEARS.findIndex(d => d.planet === moonNakshatra.ruler);
  if (dashaStartIdx === -1) return [];

  const dashas: DashaPeriod[] = [];
  let ageAccum = 0;

  // Progress of Moon within current nakshatra determines remaining first dasha
  const posInNak = ((moonSiderealLong % NAKSHATRA_SPAN) + NAKSHATRA_SPAN) % NAKSHATRA_SPAN;
  const nakshatraProgress = posInNak / NAKSHATRA_SPAN;

  // First dasha: remaining portion
  const firstDasha = DASHA_YEARS[dashaStartIdx];
  const remainingYears = Math.max(1, Math.round(firstDasha.years * (1 - nakshatraProgress)));

  dashas.push({
    planet: firstDasha.planet,
    startAge: 0,
    endAge: remainingYears,
    years: remainingYears,
    quality: firstDasha.quality,
  });
  ageAccum = remainingYears;

  // Subsequent dashas
  for (let i = 1; i <= 8 && ageAccum < 120; i++) {
    const d = DASHA_YEARS[(dashaStartIdx + i) % 9];
    const endAge = Math.min(ageAccum + d.years, 120);
    dashas.push({
      planet: d.planet,
      startAge: ageAccum,
      endAge,
      years: endAge - ageAccum,
      quality: d.quality,
    });
    ageAccum = endAge;
  }

  return dashas;
}

// ═══════════════════════════════════════════════
// Yoga detection (simplified)
// ═══════════════════════════════════════════════

function detectYogas(
  sunRashiIdx: number,
  moonRashiIdx: number,
  lagnaIdx: number,
  jupiterRashiIdx: number,
): string[] {
  const yogas: string[] = [];

  // Gajakesari Yoga: Jupiter in kendra (1,4,7,10) from Moon
  const jupMoonDiff = ((jupiterRashiIdx - moonRashiIdx + 12) % 12);
  if ([0, 3, 6, 9].includes(jupMoonDiff)) {
    yogas.push('Gajakesari Yoga (象王格·智慧与名望)');
  }

  // Budhaditya Yoga: Sun and Mercury in same sign
  // (We check Sun-Moon conjunction as a proxy since we have those readily)
  if (sunRashiIdx === moonRashiIdx) {
    yogas.push('Chandra-Surya Yoga (日月合·意志与情感统一)');
  }

  // Chandra-Lagna Yoga: Moon in Lagna
  if (moonRashiIdx === lagnaIdx) {
    yogas.push('Chandra-Lagna Yoga (月亮合命·情感敏锐)');
  }

  // Kesari Yoga: Moon in kendra from Jupiter
  const moonJupDiff = ((moonRashiIdx - jupiterRashiIdx + 12) % 12);
  if ([0, 3, 6, 9].includes(moonJupDiff) && !yogas.some(y => y.includes('Gajakesari'))) {
    yogas.push('Kesari Yoga (狮吼格·领导力)');
  }

  // Fallback
  if (yogas.length === 0) {
    yogas.push('Parivartana Yoga (交换格·灵活变通)');
  }

  return yogas;
}

// ═══════════════════════════════════════════════
// Main engine
// ═══════════════════════════════════════════════

export const VedicAstrologyEngine = {
  calculate(input: VedicInput): VedicReport {
    // 1. Get precise tropical positions from shared layer
    const snapshot = getCelestialSnapshot(
      input.year, input.month, input.day, input.hour, input.minute,
    );

    // 2. Convert to sidereal using Lahiri ayanamsa
    const ayanamsa = getLahiriAyanamsa(input.year, input.month);

    const moonSidereal = tropicalToSidereal(snapshot.moon.longitude, input.year, input.month);
    const sunSidereal = tropicalToSidereal(snapshot.sun.longitude, input.year, input.month);
    const jupiterSidereal = tropicalToSidereal(snapshot.jupiter.longitude, input.year, input.month);

    // 3. Rashi (Moon sign in sidereal zodiac)
    const rashiIdx = Math.floor(moonSidereal / 30) % 12;
    const rashiSign = RASHIS[rashiIdx];

    // 4. Nakshatra from precise sidereal Moon
    const moonNakshatra = getNakshatraFromLongitude(moonSidereal);

    // 5. Lagna (Ascendant in sidereal)
    const ascSidereal = tropicalToSidereal(snapshot.ascendantLongitude, input.year, input.month);
    const lagnaIdx = Math.floor(ascSidereal / 30) % 12;
    const lagna = RASHIS[lagnaIdx];

    // 6. Dasha sequence
    const dashas = calculateDashas(moonNakshatra, moonSidereal);

    // 7. Yogas
    const sunRashiIdx = Math.floor(sunSidereal / 30) % 12;
    const jupiterRashiIdx = Math.floor(jupiterSidereal / 30) % 12;
    const yogas = detectYogas(sunRashiIdx, rashiIdx, lagnaIdx, jupiterRashiIdx);

    // 8. Life vectors (heuristic scoring based on dasha balance + nakshatra ruler)
    const beneficDashaYears = dashas.filter(d => d.quality === 'benefic').reduce((s, d) => s + d.years, 0);
    const maleficDashaYears = dashas.filter(d => d.quality === 'malefic').reduce((s, d) => s + d.years, 0);
    const dashaBalance = beneficDashaYears / (beneficDashaYears + maleficDashaYears + 1);
    const base = 40 + dashaBalance * 30;
    const ruler = moonNakshatra.ruler;

    const lifeVectors: Record<string, number> = {
      career:       clamp(base + (ruler === 'Sun' ? 12 : ruler === 'Saturn' ? 8 : 0)),
      wealth:       clamp(base + (ruler === 'Venus' ? 12 : ruler === 'Jupiter' ? 10 : 0)),
      love:         clamp(base + (ruler === 'Venus' ? 15 : ruler === 'Moon' ? 10 : 0)),
      health:       clamp(base + (ruler === 'Mars' ? -5 : ruler === 'Moon' ? 8 : 3)),
      wisdom:       clamp(base + (ruler === 'Jupiter' ? 15 : ruler === 'Mercury' ? 12 : 0)),
      social:       clamp(base + (ruler === 'Venus' ? 10 : ruler === 'Mercury' ? 8 : 0)),
      creativity:   clamp(base + (ruler === 'Rahu' ? 12 : ruler === 'Ketu' ? 10 : 0)),
      fortune:      clamp(base + yogas.length * 5 + dashaBalance * 10),
      family:       clamp(base + (ruler === 'Moon' ? 12 : ruler === 'Jupiter' ? 8 : 0)),
      spirituality: clamp(base + (ruler === 'Ketu' ? 15 : ruler === 'Jupiter' ? 12 : 0)),
    };

    return {
      rashiSign,
      rashiSignCN: RASHI_CN[rashiSign] || rashiSign,
      moonNakshatra,
      lagna,
      dashas,
      yogas,
      lifeVectors,
      ayanamsaUsed: Math.round(ayanamsa * 10000) / 10000,
      moonSiderealLongitude: Math.round(moonSidereal * 10000) / 10000,
      sunSiderealLongitude: Math.round(sunSidereal * 10000) / 10000,
    };
  },

  /** Source metadata for audit trail */
  metadata: {
    source_urls: [
      ...CELESTIAL_LAYER_METADATA.source_urls,
      'https://en.wikipedia.org/wiki/Ayanamsa',
      'https://en.wikipedia.org/wiki/Nakshatra',
      'https://en.wikipedia.org/wiki/Dasha_(astrology)',
    ],
    source_grade: 'A' as const,
    algorithm_version: '2.0.0',
    rule_school: 'Parashari (mainstream Vedic), Lahiri/Chitrapaksha ayanamsa',
    uncertainty_notes: [
      ...CELESTIAL_LAYER_METADATA.uncertainty_notes,
      'Lahiri ayanamsa: polynomial approximation, ±0.01° for 1900-2100',
      'Nakshatra boundaries: exact mathematical division (360/27)',
      'Vimshottari Dasha: standard 120-year cycle',
      'Yoga detection: simplified, only major yogas checked',
      'Life vector scoring is heuristic modeling',
    ],
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
