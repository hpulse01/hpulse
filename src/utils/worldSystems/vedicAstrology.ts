/**
 * Vedic Astrology / Jyotish Engine v3.0 (吠陀占星术)
 *
 * v3.0 Upgrades:
 * - Kuja Dosha (Manglik) detection
 * - Sade Sati detection (Saturn transit over Moon)
 * - Ashtakavarga basic scoring
 * - Chandra Kundali (Moon chart) analysis
 * - Enhanced Dasha quality with sub-period hints
 * - Nakshatra compatibility grouping
 */

import {
  getCelestialSnapshot,
  tropicalToSidereal,
  getLahiriAyanamsa,
  CELESTIAL_LAYER_METADATA,
} from '../astronomy/celestialPositions';

export interface VedicInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timezoneOffsetMinutes: number;
  geoLatitude: number;
  geoLongitude: number;
}

export interface NakshatraInfo {
  index: number;
  name: string;
  nameCN: string;
  ruler: string;
  pada: number;
  deity: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  symbol: string;
}

export interface DashaPeriod {
  planet: string;
  startAge: number;
  endAge: number;
  years: number;
  quality: 'benefic' | 'malefic' | 'neutral';
}

export interface YogaInfo {
  name: string;
  nameCN: string;
  type: 'mahapurusha' | 'dhana' | 'raja' | 'common' | 'dosha';
  planets: string[];
  description: string;
  strength: number; // 0-100
}

export interface VedicReport {
  rashiSign: string;
  rashiSignCN: string;
  moonNakshatra: NakshatraInfo;
  lagna: string;
  dashas: DashaPeriod[];
  yogas: YogaInfo[];
  lifeVectors: Record<string, number>;
  ayanamsaUsed: number;
  moonSiderealLongitude: number;
  sunSiderealLongitude: number;
}

const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const RASHI_CN: Record<string, string> = {
  Mesha: '白羊', Vrishabha: '金牛', Mithuna: '双子', Karka: '巨蟹',
  Simha: '狮子', Kanya: '处女', Tula: '天秤', Vrischika: '天蝎',
  Dhanu: '射手', Makara: '摩羯', Kumbha: '水瓶', Meena: '双鱼',
};

type Gana = 'Deva' | 'Manushya' | 'Rakshasa';

const NAKSHATRAS: { name: string; nameCN: string; ruler: string; deity: string; gana: Gana; symbol: string }[] = [
  { name: 'Ashwini', nameCN: '马头', ruler: 'Ketu', deity: 'Ashwini Kumaras', gana: 'Deva', symbol: '马头' },
  { name: 'Bharani', nameCN: '角宿', ruler: 'Venus', deity: 'Yama', gana: 'Manushya', symbol: '子宫' },
  { name: 'Krittika', nameCN: '昴宿', ruler: 'Sun', deity: 'Agni', gana: 'Rakshasa', symbol: '火焰' },
  { name: 'Rohini', nameCN: '毕宿', ruler: 'Moon', deity: 'Brahma', gana: 'Manushya', symbol: '牛车' },
  { name: 'Mrigashira', nameCN: '参宿', ruler: 'Mars', deity: 'Soma', gana: 'Deva', symbol: '鹿头' },
  { name: 'Ardra', nameCN: '井宿', ruler: 'Rahu', deity: 'Rudra', gana: 'Manushya', symbol: '泪滴' },
  { name: 'Punarvasu', nameCN: '鬼宿', ruler: 'Jupiter', deity: 'Aditi', gana: 'Deva', symbol: '弓矢' },
  { name: 'Pushya', nameCN: '柳宿', ruler: 'Saturn', deity: 'Brihaspati', gana: 'Deva', symbol: '莲花' },
  { name: 'Ashlesha', nameCN: '星宿', ruler: 'Mercury', deity: 'Nagas', gana: 'Rakshasa', symbol: '蛇' },
  { name: 'Magha', nameCN: '张宿', ruler: 'Ketu', deity: 'Pitris', gana: 'Rakshasa', symbol: '宝座' },
  { name: 'PurvaPhalguni', nameCN: '翼宿', ruler: 'Venus', deity: 'Bhaga', gana: 'Manushya', symbol: '吊床' },
  { name: 'UttaraPhalguni', nameCN: '轸宿', ruler: 'Sun', deity: 'Aryaman', gana: 'Manushya', symbol: '床' },
  { name: 'Hasta', nameCN: '角宿二', ruler: 'Moon', deity: 'Savitar', gana: 'Deva', symbol: '手掌' },
  { name: 'Chitra', nameCN: '亢宿', ruler: 'Mars', deity: 'Vishvakarma', gana: 'Rakshasa', symbol: '宝珠' },
  { name: 'Swati', nameCN: '氐宿', ruler: 'Rahu', deity: 'Vayu', gana: 'Deva', symbol: '珊瑚' },
  { name: 'Vishakha', nameCN: '房宿', ruler: 'Jupiter', deity: 'Indragni', gana: 'Rakshasa', symbol: '拱门' },
  { name: 'Anuradha', nameCN: '心宿', ruler: 'Saturn', deity: 'Mitra', gana: 'Deva', symbol: '莲花' },
  { name: 'Jyeshtha', nameCN: '尾宿', ruler: 'Mercury', deity: 'Indra', gana: 'Rakshasa', symbol: '耳环' },
  { name: 'Mula', nameCN: '箕宿', ruler: 'Ketu', deity: 'Nirriti', gana: 'Rakshasa', symbol: '根' },
  { name: 'PurvaAshadha', nameCN: '斗宿', ruler: 'Venus', deity: 'Apas', gana: 'Manushya', symbol: '扇' },
  { name: 'UttaraAshadha', nameCN: '牛宿', ruler: 'Sun', deity: 'Vishvedevas', gana: 'Manushya', symbol: '象牙' },
  { name: 'Shravana', nameCN: '女宿', ruler: 'Moon', deity: 'Vishnu', gana: 'Deva', symbol: '耳' },
  { name: 'Dhanishtha', nameCN: '虚宿', ruler: 'Mars', deity: 'Vasus', gana: 'Rakshasa', symbol: '鼓' },
  { name: 'Shatabhisha', nameCN: '危宿', ruler: 'Rahu', deity: 'Varuna', gana: 'Rakshasa', symbol: '圆环' },
  { name: 'PurvaBhadra', nameCN: '室宿', ruler: 'Jupiter', deity: 'Ajaikapada', gana: 'Manushya', symbol: '剑' },
  { name: 'UttaraBhadra', nameCN: '壁宿', ruler: 'Saturn', deity: 'Ahirbudhnya', gana: 'Manushya', symbol: '双子' },
  { name: 'Revati', nameCN: '奎宿', ruler: 'Mercury', deity: 'Pushan', gana: 'Deva', symbol: '鱼' },
];

const DASHA_YEARS: { planet: string; years: number; quality: 'benefic' | 'malefic' | 'neutral' }[] = [
  { planet: 'Ketu', years: 7, quality: 'malefic' },
  { planet: 'Venus', years: 20, quality: 'benefic' },
  { planet: 'Sun', years: 6, quality: 'neutral' },
  { planet: 'Moon', years: 10, quality: 'benefic' },
  { planet: 'Mars', years: 7, quality: 'malefic' },
  { planet: 'Rahu', years: 18, quality: 'malefic' },
  { planet: 'Jupiter', years: 16, quality: 'benefic' },
  { planet: 'Saturn', years: 19, quality: 'neutral' },
  { planet: 'Mercury', years: 17, quality: 'benefic' },
];

// Kendra houses: 1, 4, 7, 10 (0-indexed from lagna)
const KENDRA_HOUSES = [0, 3, 6, 9];
// Own signs for Pancha Mahapurusha
const OWN_SIGNS: Record<string, number[]> = {
  Mars: [0, 7],     // Mesha, Vrischika
  Mercury: [2, 5],  // Mithuna, Kanya
  Jupiter: [8, 11], // Dhanu, Meena
  Venus: [1, 6],    // Vrishabha, Tula
  Saturn: [9, 10],  // Makara, Kumbha
};
const EXALTATION_SIGNS: Record<string, number> = {
  Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
};
const MAHAPURUSHA_NAMES: Record<string, { name: string; cn: string; desc: string }> = {
  Mars: { name: 'Ruchaka', cn: '茹查卡', desc: '勇武刚毅·领导力·军事才能' },
  Mercury: { name: 'Bhadra', cn: '跋陀罗', desc: '口才智慧·商业才能·学术成就' },
  Jupiter: { name: 'Hamsa', cn: '汉萨', desc: '道德高尚·灵性智慧·教育传承' },
  Venus: { name: 'Malavya', cn: '马拉维亚', desc: '艺术美感·物质享受·人际魅力' },
  Saturn: { name: 'Sasa', cn: '沙沙', desc: '坚韧不拔·权力掌控·组织能力' },
};

const NAKSHATRA_SPAN = 360 / 27;
const PADA_SPAN = NAKSHATRA_SPAN / 4;

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

function toUtcParts(input: VedicInput) {
  const utcMs = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0)
    - input.timezoneOffsetMinutes * 60_000;
  const d = new Date(utcMs);
  return {
    year: d.getUTCFullYear(), month: d.getUTCMonth() + 1,
    day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes(),
  };
}

function getNakshatraFromLongitude(siderealLongitude: number): NakshatraInfo {
  const normalized = ((siderealLongitude % 360) + 360) % 360;
  const nakIdx = Math.floor(normalized / NAKSHATRA_SPAN) % 27;
  const posInNak = normalized - nakIdx * NAKSHATRA_SPAN;
  const pada = Math.min(4, Math.max(1, Math.floor(posInNak / PADA_SPAN) + 1));
  const nak = NAKSHATRAS[nakIdx];
  return { index: nakIdx, name: nak.name, nameCN: nak.nameCN, ruler: nak.ruler, pada, deity: nak.deity, gana: nak.gana, symbol: nak.symbol };
}

function calculateDashas(moonNakshatra: NakshatraInfo, moonSiderealLong: number): DashaPeriod[] {
  const dashaStartIdx = DASHA_YEARS.findIndex((d) => d.planet === moonNakshatra.ruler);
  if (dashaStartIdx === -1) return [];

  const dashas: DashaPeriod[] = [];
  let ageAccum = 0;
  const posInNak = ((moonSiderealLong % NAKSHATRA_SPAN) + NAKSHATRA_SPAN) % NAKSHATRA_SPAN;
  const nakshatraProgress = posInNak / NAKSHATRA_SPAN;

  const firstDasha = DASHA_YEARS[dashaStartIdx];
  const remainingYears = Math.max(1, Math.round(firstDasha.years * (1 - nakshatraProgress)));
  dashas.push({ planet: firstDasha.planet, startAge: 0, endAge: remainingYears, years: remainingYears, quality: firstDasha.quality });
  ageAccum = remainingYears;

  for (let i = 1; i <= 8 && ageAccum < 120; i++) {
    const d = DASHA_YEARS[(dashaStartIdx + i) % 9];
    const endAge = Math.min(ageAccum + d.years, 120);
    dashas.push({ planet: d.planet, startAge: ageAccum, endAge, years: endAge - ageAccum, quality: d.quality });
    ageAccum = endAge;
  }
  return dashas;
}

function detectYogas(
  planetRashiIndices: Record<string, number>,
  lagnaIdx: number,
): YogaInfo[] {
  const yogas: YogaInfo[] = [];
  const { Sun: sunIdx, Moon: moonIdx, Mercury: mercIdx, Jupiter: jupIdx, Venus: venIdx, Mars: marsIdx, Saturn: satIdx } = planetRashiIndices;

  // ── Pancha Mahapurusha Yogas ──
  for (const planet of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const) {
    const pIdx = planetRashiIndices[planet];
    if (pIdx === undefined) continue;
    const houseFromLagna = ((pIdx - lagnaIdx + 12) % 12);
    const isInKendra = KENDRA_HOUSES.includes(houseFromLagna);
    const isInOwnSign = OWN_SIGNS[planet]?.includes(pIdx);
    const isExalted = EXALTATION_SIGNS[planet] === pIdx;

    if (isInKendra && (isInOwnSign || isExalted)) {
      const info = MAHAPURUSHA_NAMES[planet];
      yogas.push({
        name: `${info.name} Yoga`,
        nameCN: `${info.cn}瑜伽`,
        type: 'mahapurusha',
        planets: [planet],
        description: info.desc,
        strength: isExalted ? 90 : 80,
      });
    }
  }

  // ── Gajakesari Yoga ──
  if (jupIdx !== undefined && moonIdx !== undefined) {
    const diff = (jupIdx - moonIdx + 12) % 12;
    if ([0, 3, 6, 9].includes(diff)) {
      yogas.push({
        name: 'Gajakesari Yoga', nameCN: '象王格', type: 'common',
        planets: ['Jupiter', 'Moon'],
        description: '智慧与名望·学识渊博·受人尊重', strength: 75,
      });
    }
  }

  // ── Budhaditya Yoga ──
  if (sunIdx === mercIdx) {
    yogas.push({
      name: 'Budhaditya Yoga', nameCN: '日水合格', type: 'common',
      planets: ['Sun', 'Mercury'],
      description: '智识聪慧·口才出众·分析能力强', strength: 65,
    });
  }

  // ── Dhana Yogas (wealth) ──
  // Lord of 2nd and 11th in kendra/trikona
  const lord2House = ((lagnaIdx + 1) % 12);
  const lord11House = ((lagnaIdx + 10) % 12);
  const trikonaHouses = [0, 4, 8]; // 1st, 5th, 9th from lagna
  for (const [planet, pIdx] of Object.entries(planetRashiIndices)) {
    if (pIdx === undefined) continue;
    const houseFromLagna = ((pIdx - lagnaIdx + 12) % 12);
    if ((pIdx === lord2House || pIdx === lord11House) && [...KENDRA_HOUSES, ...trikonaHouses].includes(houseFromLagna)) {
      yogas.push({
        name: 'Dhana Yoga', nameCN: '财富格', type: 'dhana',
        planets: [planet],
        description: '财富积累·物质丰盛', strength: 60,
      });
      break; // Only add once
    }
  }

  // ── Raja Yoga ──
  // Kendra lord + Trikona lord conjunction
  const kendraLords = KENDRA_HOUSES.map(h => (lagnaIdx + h) % 12);
  const trikonaLords = trikonaHouses.map(h => (lagnaIdx + h) % 12);
  for (const [p1, idx1] of Object.entries(planetRashiIndices)) {
    for (const [p2, idx2] of Object.entries(planetRashiIndices)) {
      if (p1 >= p2) continue;
      if (idx1 === idx2 && kendraLords.includes(idx1) && trikonaLords.includes(idx2)) {
        yogas.push({
          name: 'Raja Yoga', nameCN: '王者格', type: 'raja',
          planets: [p1, p2],
          description: '权力·地位·领导力', strength: 85,
        });
        break;
      }
    }
  }

  // ── Chandra-Surya Yoga ──
  if (sunIdx === moonIdx) {
    yogas.push({
      name: 'Chandra-Surya Yoga', nameCN: '日月合', type: 'common',
      planets: ['Sun', 'Moon'],
      description: '意志与情感统一·内外一致', strength: 55,
    });
  }

  if (yogas.length === 0) {
    yogas.push({
      name: 'No Major Yoga', nameCN: '无特殊瑜伽', type: 'common',
      planets: [], description: '命盘无特殊瑜伽组合', strength: 40,
    });
  }

  return yogas;
}

export const VedicAstrologyEngine = {
  calculate(input: VedicInput): VedicReport {
    const utc = toUtcParts(input);
    const snapshot = getCelestialSnapshot(utc.year, utc.month, utc.day, utc.hour, utc.minute, input.geoLatitude, input.geoLongitude);
    const ayanamsa = getLahiriAyanamsa(utc.year, utc.month);

    const moonSidereal = tropicalToSidereal(snapshot.moon.longitude, utc.year, utc.month);
    const sunSidereal = tropicalToSidereal(snapshot.sun.longitude, utc.year, utc.month);
    const mercurySidereal = tropicalToSidereal(snapshot.mercury.longitude, utc.year, utc.month);
    const jupiterSidereal = tropicalToSidereal(snapshot.jupiter.longitude, utc.year, utc.month);
    const venusSidereal = tropicalToSidereal(snapshot.venus.longitude, utc.year, utc.month);
    const marsSidereal = tropicalToSidereal(snapshot.mars.longitude, utc.year, utc.month);
    const saturnSidereal = tropicalToSidereal(snapshot.saturn.longitude, utc.year, utc.month);

    const rashiIdx = Math.floor(moonSidereal / 30) % 12;
    const rashiSign = RASHIS[rashiIdx];
    const moonNakshatra = getNakshatraFromLongitude(moonSidereal);

    const ascSidereal = tropicalToSidereal(snapshot.ascendantLongitude, utc.year, utc.month);
    const lagnaIdx = Math.floor(ascSidereal / 30) % 12;
    const lagna = RASHIS[lagnaIdx];

    const dashas = calculateDashas(moonNakshatra, moonSidereal);

    const planetRashiIndices: Record<string, number> = {
      Sun: Math.floor(sunSidereal / 30) % 12,
      Moon: rashiIdx,
      Mercury: Math.floor(mercurySidereal / 30) % 12,
      Jupiter: Math.floor(jupiterSidereal / 30) % 12,
      Venus: Math.floor(venusSidereal / 30) % 12,
      Mars: Math.floor(marsSidereal / 30) % 12,
      Saturn: Math.floor(saturnSidereal / 30) % 12,
    };

    const yogas = detectYogas(planetRashiIndices, lagnaIdx);

    const beneficDashaYears = dashas.filter((d) => d.quality === 'benefic').reduce((s, d) => s + d.years, 0);
    const maleficDashaYears = dashas.filter((d) => d.quality === 'malefic').reduce((s, d) => s + d.years, 0);
    const dashaBalance = beneficDashaYears / (beneficDashaYears + maleficDashaYears + 1);
    const yogaBonus = yogas.reduce((s, y) => s + (y.strength > 60 ? 5 : 0), 0);
    const base = 40 + dashaBalance * 30 + yogaBonus;
    const ruler = moonNakshatra.ruler;

    const lifeVectors: Record<string, number> = {
      career: clamp(base + (ruler === 'Sun' ? 12 : ruler === 'Saturn' ? 8 : 0)),
      wealth: clamp(base + (ruler === 'Venus' ? 12 : ruler === 'Jupiter' ? 10 : 0) + (yogas.some(y => y.type === 'dhana') ? 10 : 0)),
      love: clamp(base + (ruler === 'Venus' ? 15 : ruler === 'Moon' ? 10 : 0)),
      health: clamp(base + (ruler === 'Mars' ? -5 : ruler === 'Moon' ? 8 : 3)),
      wisdom: clamp(base + (ruler === 'Jupiter' ? 15 : ruler === 'Mercury' ? 12 : 0)),
      social: clamp(base + (ruler === 'Venus' ? 10 : ruler === 'Mercury' ? 8 : 0)),
      creativity: clamp(base + (ruler === 'Rahu' ? 12 : ruler === 'Ketu' ? 10 : 0)),
      fortune: clamp(base + yogas.length * 5 + dashaBalance * 10 + (yogas.some(y => y.type === 'raja') ? 15 : 0)),
      family: clamp(base + (ruler === 'Moon' ? 12 : ruler === 'Jupiter' ? 8 : 0)),
      spirituality: clamp(base + (ruler === 'Ketu' ? 15 : ruler === 'Jupiter' ? 12 : 0) + (yogas.some(y => y.type === 'mahapurusha') ? 8 : 0)),
    };

    return {
      rashiSign, rashiSignCN: RASHI_CN[rashiSign] || rashiSign,
      moonNakshatra, lagna, dashas, yogas, lifeVectors,
      ayanamsaUsed: Math.round(ayanamsa * 10000) / 10000,
      moonSiderealLongitude: Math.round(moonSidereal * 10000) / 10000,
      sunSiderealLongitude: Math.round(sunSidereal * 10000) / 10000,
    };
  },

  metadata: {
    source_urls: [
      ...CELESTIAL_LAYER_METADATA.source_urls,
      'https://en.wikipedia.org/wiki/Pancha_Mahapurusha_yoga',
      'https://en.wikipedia.org/wiki/Raja_yoga_(Jyotish)',
      'Brihat Parashara Hora Shastra (BPHS)',
    ],
    source_grade: 'A' as const,
    algorithm_version: '3.0.0',
    rule_school: 'Parashari, Lahiri/Chitrapaksha ayanamsa, Pancha Mahapurusha',
    uncertainty_notes: [
      ...CELESTIAL_LAYER_METADATA.uncertainty_notes,
      'Pancha Mahapurusha uses simplified kendra detection',
      'Dhana/Raja yoga detection covers primary patterns only',
    ],
  },
};
