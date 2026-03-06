/**
 * Vedic Astrology / Jyotish Engine (吠陀占星术)
 *
 * Sidereal zodiac (Lahiri ayanamsa), Nakshatras (27 lunar mansions),
 * Vimshottari Dasha periods, and Yoga combinations.
 */

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
}

const AYANAMSA_J2000 = 23.85; // Lahiri ayanamsa at J2000
const AYANAMSA_RATE = 0.01396; // degrees per year

const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrischika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const RASHI_CN: Record<string, string> = {
  Mesha: '白羊', Vrishabha: '金牛', Mithuna: '双子', Karka: '巨蟹',
  Simha: '狮子', Kanya: '处女', Tula: '天秤', Vrischika: '天蝎',
  Dhanu: '射手', Makara: '摩羯', Kumbha: '水瓶', Meena: '双鱼',
};

const NAKSHATRAS: { name: string; nameCN: string; ruler: string; deity: string }[] = [
  { name: 'Ashwini', nameCN: '马头', ruler: 'Ketu', deity: 'Ashwini Kumaras' },
  { name: 'Bharani', nameCN: '角宿', ruler: 'Venus', deity: 'Yama' },
  { name: 'Krittika', nameCN: '昴宿', ruler: 'Sun', deity: 'Agni' },
  { name: 'Rohini', nameCN: '毕宿', ruler: 'Moon', deity: 'Brahma' },
  { name: 'Mrigashira', nameCN: '参宿', ruler: 'Mars', deity: 'Soma' },
  { name: 'Ardra', nameCN: '井宿', ruler: 'Rahu', deity: 'Rudra' },
  { name: 'Punarvasu', nameCN: '鬼宿', ruler: 'Jupiter', deity: 'Aditi' },
  { name: 'Pushya', nameCN: '柳宿', ruler: 'Saturn', deity: 'Brihaspati' },
  { name: 'Ashlesha', nameCN: '星宿', ruler: 'Mercury', deity: 'Nagas' },
  { name: 'Magha', nameCN: '张宿', ruler: 'Ketu', deity: 'Pitris' },
  { name: 'PurvaPhalguni', nameCN: '翼宿', ruler: 'Venus', deity: 'Bhaga' },
  { name: 'UttaraPhalguni', nameCN: '轸宿', ruler: 'Sun', deity: 'Aryaman' },
  { name: 'Hasta', nameCN: '角宿二', ruler: 'Moon', deity: 'Savitar' },
  { name: 'Chitra', nameCN: '亢宿', ruler: 'Mars', deity: 'Vishvakarma' },
  { name: 'Swati', nameCN: '氐宿', ruler: 'Rahu', deity: 'Vayu' },
  { name: 'Vishakha', nameCN: '房宿', ruler: 'Jupiter', deity: 'Indragni' },
  { name: 'Anuradha', nameCN: '心宿', ruler: 'Saturn', deity: 'Mitra' },
  { name: 'Jyeshtha', nameCN: '尾宿', ruler: 'Mercury', deity: 'Indra' },
  { name: 'Mula', nameCN: '箕宿', ruler: 'Ketu', deity: 'Nirriti' },
  { name: 'PurvaAshadha', nameCN: '斗宿', ruler: 'Venus', deity: 'Apas' },
  { name: 'UttaraAshadha', nameCN: '牛宿', ruler: 'Sun', deity: 'Vishvedevas' },
  { name: 'Shravana', nameCN: '女宿', ruler: 'Moon', deity: 'Vishnu' },
  { name: 'Dhanishtha', nameCN: '虚宿', ruler: 'Mars', deity: 'Vasus' },
  { name: 'Shatabhisha', nameCN: '危宿', ruler: 'Rahu', deity: 'Varuna' },
  { name: 'PurvaBhadra', nameCN: '室宿', ruler: 'Jupiter', deity: 'Ajaikapada' },
  { name: 'UttaraBhadra', nameCN: '壁宿', ruler: 'Saturn', deity: 'Ahirbudhnya' },
  { name: 'Revati', nameCN: '奎宿', ruler: 'Mercury', deity: 'Pushan' },
];

// Vimshottari Dasha: planet -> total years
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

function siderealMoonLongitude(year: number, month: number, day: number, hour: number, minute: number): number {
  const daysFromJ2000 = (year - 2000) * 365.25 + (month - 1) * 30.44 + day + (hour + minute / 60) / 24 - 0.5;
  const tropicalMoon = (218.32 + 13.176 * daysFromJ2000) % 360;
  const ayanamsa = AYANAMSA_J2000 + AYANAMSA_RATE * (year - 2000);
  return ((tropicalMoon - ayanamsa) % 360 + 360) % 360;
}

function siderealSunLongitude(year: number, month: number, day: number): number {
  const daysFromJ2000 = (year - 2000) * 365.25 + (month - 1) * 30.44 + day - 0.5;
  const tropicalSun = (280.46 + 0.9856 * daysFromJ2000) % 360;
  const ayanamsa = AYANAMSA_J2000 + AYANAMSA_RATE * (year - 2000);
  return ((tropicalSun - ayanamsa) % 360 + 360) % 360;
}

export const VedicAstrologyEngine = {
  calculate(input: VedicInput): VedicReport {
    const moonLong = siderealMoonLongitude(input.year, input.month, input.day, input.hour, input.minute);
    const sunLong = siderealSunLongitude(input.year, input.month, input.day);

    // Rashi (Moon sign)
    const rashiIdx = Math.floor(moonLong / 30) % 12;
    const rashiSign = RASHIS[rashiIdx];

    // Nakshatra
    const nakIdx = Math.floor(moonLong / (360 / 27)) % 27;
    const nak = NAKSHATRAS[nakIdx];
    const pada = Math.floor((moonLong % (360 / 27)) / (360 / 108)) + 1;

    const moonNakshatra: NakshatraInfo = {
      index: nakIdx,
      name: nak.name,
      nameCN: nak.nameCN,
      ruler: nak.ruler,
      pada: Math.min(4, Math.max(1, pada)),
      deity: nak.deity,
    };

    // Lagna (Ascendant) approximation
    const lagnaIdx = (Math.floor(sunLong / 30) + Math.floor((input.hour + 6) % 24 / 2)) % 12;
    const lagna = RASHIS[lagnaIdx];

    // Vimshottari Dasha sequence starting from nakshatra ruler
    const dashaStartIdx = DASHA_YEARS.findIndex(d => d.planet === nak.ruler);
    const dashas: DashaPeriod[] = [];
    let ageAccum = 0;

    // Remaining dasha at birth (simplified)
    const nakshatraProgress = (moonLong % (360 / 27)) / (360 / 27);
    const firstDasha = DASHA_YEARS[(dashaStartIdx) % 9];
    const remainingYears = Math.round(firstDasha.years * (1 - nakshatraProgress));

    if (remainingYears > 0) {
      dashas.push({
        planet: firstDasha.planet,
        startAge: 0,
        endAge: remainingYears,
        years: remainingYears,
        quality: firstDasha.quality,
      });
      ageAccum = remainingYears;
    }

    for (let i = 1; i <= 8 && ageAccum < 100; i++) {
      const d = DASHA_YEARS[(dashaStartIdx + i) % 9];
      const endAge = Math.min(ageAccum + d.years, 100);
      dashas.push({
        planet: d.planet,
        startAge: ageAccum,
        endAge,
        years: endAge - ageAccum,
        quality: d.quality,
      });
      ageAccum = endAge;
    }

    // Yogas (simplified detection)
    const yogas: string[] = [];
    const sunRashi = Math.floor(sunLong / 30) % 12;
    if (Math.abs(sunRashi - rashiIdx) === 0) yogas.push('Budhaditya Yoga (智慧结合)');
    if (lagnaIdx === rashiIdx) yogas.push('Chandra-Lagna Yoga (月亮合命)');
    if ((rashiIdx + 7) % 12 === lagnaIdx) yogas.push('Gajakesari Yoga (象王格)');
    if (yogas.length === 0) yogas.push('Parivartana Yoga (交换格)');

    // Life vectors
    const beneficDashaYears = dashas.filter(d => d.quality === 'benefic').reduce((s, d) => s + d.years, 0);
    const maleficDashaYears = dashas.filter(d => d.quality === 'malefic').reduce((s, d) => s + d.years, 0);
    const dashaBalance = beneficDashaYears / (beneficDashaYears + maleficDashaYears + 1);
    const base = 40 + dashaBalance * 30;

    const lifeVectors: Record<string, number> = {
      career: clamp(base + (nak.ruler === 'Sun' ? 12 : nak.ruler === 'Saturn' ? 8 : 0)),
      wealth: clamp(base + (nak.ruler === 'Venus' ? 12 : nak.ruler === 'Jupiter' ? 10 : 0)),
      love: clamp(base + (nak.ruler === 'Venus' ? 15 : nak.ruler === 'Moon' ? 10 : 0)),
      health: clamp(base + (nak.ruler === 'Mars' ? -5 : nak.ruler === 'Moon' ? 8 : 3)),
      wisdom: clamp(base + (nak.ruler === 'Jupiter' ? 15 : nak.ruler === 'Mercury' ? 12 : 0)),
      social: clamp(base + (nak.ruler === 'Venus' ? 10 : nak.ruler === 'Mercury' ? 8 : 0)),
      creativity: clamp(base + (nak.ruler === 'Rahu' ? 12 : nak.ruler === 'Ketu' ? 10 : 0)),
      fortune: clamp(base + yogas.length * 5 + dashaBalance * 10),
      family: clamp(base + (nak.ruler === 'Moon' ? 12 : nak.ruler === 'Jupiter' ? 8 : 0)),
      spirituality: clamp(base + (nak.ruler === 'Ketu' ? 15 : nak.ruler === 'Jupiter' ? 12 : 0)),
    };

    return {
      rashiSign,
      rashiSignCN: RASHI_CN[rashiSign] || rashiSign,
      moonNakshatra,
      lagna,
      dashas,
      yogas,
      lifeVectors,
    };
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
