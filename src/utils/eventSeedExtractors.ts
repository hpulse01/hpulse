/**
 * H-Pulse Engine Event Seed Extractors v2.0
 *
 * Converts raw engine outputs into DestinyEventSeed[] for world tree generation.
 * Each engine extracts destiny-relevant events from its domain-specific calculations.
 *
 * v2.0 Changes:
 * - Tieban: structured clause-based events (marriage/career/wealth/health/death/migration)
 * - Ziwei: per-palace structured events, liuyue, daxian/liunian full extraction
 * - Generic engines: real algorithm-driven seeds from report data, NOT fateVector score
 * - Instant engines: structured trigger events from normalizedOutput fields
 */

import type { DestinyEventSeed, EventCategory, EventIntensity } from '@/types/destinyTree';
import type { EngineOutput, FateDimension, StandardizedInput } from '@/types/prediction';
import type { FullDestinyReport, BaZiProfile, FlowYearClause, DaYunCycle } from './tiebanAlgorithm';
import type { DeepBaZiAnalysis } from './baziDeepAnalysis';
import type { ZiweiReport, ZiweiPalace, DaxianInfo, LiunianInfo, SihuaInfo } from './ziweiAlgorithm';
import type { LiuYaoResult } from './liuYaoAlgorithm';
import type { WesternAstrologyReport } from './worldSystems/westernAstrology';
import type { VedicReport, DashaPeriod } from './worldSystems/vedicAstrology';
import type { NumerologyReport } from './worldSystems/numerology';
import type { MayanReport } from './worldSystems/mayanCalendar';
import type { KabbalahReport } from './worldSystems/kabbalah';

// ── Deterministic ID generation ──
function seedId(engine: string, cat: string, age: number, sub: string): string {
  return `${engine}-${cat}-${age}-${sub}`;
}

function intensityFromScore(score: number): EventIntensity {
  if (score >= 90) return 'life_defining';
  if (score >= 70) return 'critical';
  if (score >= 50) return 'major';
  if (score >= 30) return 'moderate';
  return 'minor';
}

// ═══════════════════════════════════════════════
// 1. Tieban Event Extraction (铁板神数 → 事件引擎)
// ═══════════════════════════════════════════════

const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

/**
 * Extract structured events from Tieban flow years and destiny projection.
 * Each clause number maps to a specific palace (marriage/career/wealth/health etc.)
 * and generates structured event seeds with clause traceability.
 */
export function extractTiebanEvents(
  fullReport: FullDestinyReport,
  baziProfile: BaZiProfile,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const proj = fullReport.destinyProjection;
  const fav = baziProfile.favorableElements;
  const unfav = baziProfile.unfavorableElements;

  // ── 1A. Structured palace-based events from destiny projection ──
  // Marriage palace events
  const marriageStrength = proj.marriage % 1000;
  const marriagePhase = marriageStrength < 300 ? 'early' : marriageStrength < 600 ? 'mid' : 'late';
  const marriageAge = marriagePhase === 'early' ? 23 : marriagePhase === 'mid' ? 28 : 33;
  seeds.push({
    id: seedId('tieban', 'relationship', marriageAge, 'marriage-palace'),
    engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
    category: 'relationship', subcategory: '婚姻宫定局',
    description: `铁板婚姻宫条文${proj.marriage}号：命主${marriageAge}岁前后婚姻缘分应期`,
    earliestAge: marriageAge - 3, latestAge: marriageAge + 4,
    probability: 0.7, intensity: 'major',
    causalFactors: [`婚姻宫条文${proj.marriage}`, `婚姻数值${marriageStrength}`],
    triggerConditions: ['流年逢桃花'], deathRelated: false,
    mergeKey: `age-${marriageAge}-relationship`,
    fateImpact: { relation: 15 },
    sourceDetail: `铁板婚姻宫条文${proj.marriage}`,
  });

  // Career palace events
  const careerStrength = proj.career % 1000;
  const careerPeak = careerStrength < 400 ? 30 : careerStrength < 700 ? 38 : 45;
  seeds.push({
    id: seedId('tieban', 'career', careerPeak, 'career-palace'),
    engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
    category: 'career', subcategory: '官禄宫定局',
    description: `铁板官禄宫条文${proj.career}号：${careerPeak}岁前后事业关键转折`,
    earliestAge: careerPeak - 3, latestAge: careerPeak + 5,
    probability: 0.65, intensity: 'major',
    causalFactors: [`官禄宫条文${proj.career}`, `事业数值${careerStrength}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${careerPeak}-career`,
    fateImpact: { life: 10, wealth: 5 },
    sourceDetail: `铁板官禄宫条文${proj.career}`,
  });

  // Wealth palace events
  const wealthStrength = proj.wealth % 1000;
  const wealthPeak = wealthStrength < 300 ? 28 : wealthStrength < 600 ? 38 : 48;
  seeds.push({
    id: seedId('tieban', 'wealth', wealthPeak, 'wealth-palace'),
    engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
    category: 'wealth', subcategory: '财帛宫定局',
    description: `铁板财帛宫条文${proj.wealth}号：${wealthPeak}岁前后财运高峰`,
    earliestAge: wealthPeak - 4, latestAge: wealthPeak + 5,
    probability: 0.6, intensity: 'moderate',
    causalFactors: [`财帛宫条文${proj.wealth}`, `财运数值${wealthStrength}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${wealthPeak}-wealth`,
    fateImpact: { wealth: 12 },
    sourceDetail: `铁板财帛宫条文${proj.wealth}`,
  });

  // Health palace events (disease/death signals)
  const healthStrength = proj.health % 1000;
  if (healthStrength < 400) {
    const riskAge = healthStrength < 200 ? 55 : 65;
    seeds.push({
      id: seedId('tieban', 'health', riskAge, 'health-palace-risk'),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: 'health', subcategory: '疾厄宫凶象',
      description: `铁板疾厄宫条文${proj.health}号：健康数值偏低(${healthStrength})，${riskAge}岁前后需防重疾`,
      earliestAge: riskAge - 5, latestAge: riskAge + 10,
      probability: 0.4, intensity: 'critical',
      causalFactors: [`疾厄宫条文${proj.health}`, `健康数值${healthStrength}`],
      triggerConditions: ['大运逢忌', '流年天克'], deathRelated: true,
      mergeKey: 'death-illness-late',
      fateImpact: { health: -20 },
      sourceDetail: `铁板疾厄宫条文${proj.health}(健康值${healthStrength})`,
    });
  }

  // Children palace → family event
  const childrenStrength = proj.children % 1000;
  const childAge = childrenStrength < 400 ? 30 : 28;
  seeds.push({
    id: seedId('tieban', 'family', childAge, 'children-palace'),
    engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
    category: 'family', subcategory: '子女宫',
    description: `铁板子女宫条文${proj.children}号：${childAge}岁前后子女缘分应期`,
    earliestAge: childAge - 3, latestAge: childAge + 5,
    probability: 0.55, intensity: 'moderate',
    causalFactors: [`子女宫条文${proj.children}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${childAge}-family`,
    fateImpact: { relation: 8 },
    sourceDetail: `铁板子女宫条文${proj.children}`,
  });

  // ── 1B. Da Yun transition events ──
  for (const dy of fullReport.lifeCycles) {
    const dyGanEl = STEM_ELEMENTS[dy.ganZhi.charAt(0)] || '土';
    const isFavDy = fav.includes(dyGanEl);
    const isUnfavDy = unfav.includes(dyGanEl);
    
    seeds.push({
      id: seedId('tieban', 'turning_point', dy.startAge, `dayun-${dy.ganZhi}`),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: 'turning_point', subcategory: `大运${dy.ganZhi}`,
      description: `${dy.startAge}-${dy.endAge}岁大运${dy.ganZhi}(${dy.element})：${isFavDy ? '喜用大运，运势上行' : isUnfavDy ? '忌神大运，需防波折' : '平运'}`,
      earliestAge: dy.startAge, latestAge: dy.startAge + 2,
      probability: 0.85, intensity: isFavDy || isUnfavDy ? 'major' : 'moderate',
      causalFactors: [`大运${dy.ganZhi}`, `五行${dy.element}`, isFavDy ? '喜用神' : isUnfavDy ? '忌神' : '中性'],
      triggerConditions: [], deathRelated: false,
      mergeKey: `dayun-${dy.startAge}`,
      fateImpact: { life: isFavDy ? 8 : isUnfavDy ? -8 : 0 },
      sourceDetail: `铁板大运${dy.ganZhi}(${dy.element})`,
    });
  }

  // ── 1C. Flow year milestone events ──
  // Only significant years get seeds, not all 80
  const significantAges = [1, 6, 12, 18, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
  for (const fy of fullReport.flowYears) {
    if (!significantAges.includes(fy.age)) continue;
    
    const ganChar = fy.ganZhi.charAt(0);
    const stemEl = STEM_ELEMENTS[ganChar] || '土';
    const isFavorable = fav.includes(stemEl);
    const isUnfavorable = unfav.includes(stemEl);

    let cat: EventCategory;
    let desc: string;
    if (fy.age <= 18) {
      cat = 'education';
      desc = `铁板流年${fy.ganZhi}(${fy.age}岁)：${isFavorable ? '学业顺遂' : isUnfavorable ? '学途多阻' : '学业平稳'}，条文${fy.clauseNumber}号`;
    } else if (fy.age <= 35) {
      cat = isFavorable ? 'career' : isUnfavorable ? 'health' : 'turning_point';
      desc = `铁板流年${fy.ganZhi}(${fy.age}岁)：${isFavorable ? '事业有成' : isUnfavorable ? '谨慎行事' : '运势平稳'}，条文${fy.clauseNumber}号`;
    } else if (fy.age <= 60) {
      cat = isFavorable ? 'wealth' : isUnfavorable ? 'health' : 'career';
      desc = `铁板流年${fy.ganZhi}(${fy.age}岁)：${isFavorable ? '财运亨通' : isUnfavorable ? '破财防灾' : '财运平稳'}，条文${fy.clauseNumber}号`;
    } else {
      cat = 'health';
      desc = `铁板流年${fy.ganZhi}(${fy.age}岁)：${isFavorable ? '老当益壮' : isUnfavorable ? '注意养生' : '健康尚可'}，条文${fy.clauseNumber}号`;
    }

    seeds.push({
      id: seedId('tieban', cat, fy.age, `flow-${fy.ganZhi}`),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: cat, subcategory: `流年${fy.ganZhi}`,
      description: desc,
      earliestAge: fy.age, latestAge: fy.age,
      earliestYear: fy.year, latestYear: fy.year,
      probability: isFavorable ? 0.7 : isUnfavorable ? 0.45 : 0.55,
      intensity: intensityFromScore((isFavorable ? 70 : isUnfavorable ? 40 : 55)),
      causalFactors: [`条文${fy.clauseNumber}`, `年干${ganChar}(${stemEl})`, isFavorable ? '喜用年' : isUnfavorable ? '忌年' : '平年'],
      triggerConditions: [], deathRelated: fy.age >= 70 && isUnfavorable,
      mergeKey: `age-${fy.age}-${cat}`,
      fateImpact: { life: isFavorable ? 8 : isUnfavorable ? -8 : 0 },
      sourceDetail: `铁板条文${fy.clauseNumber}(流年${fy.ganZhi})`,
    });
  }

  // ── 1D. Death/longevity signal from overall projection ──
  const lifeDestinyStrength = proj.lifeDestiny % 1000;
  const estimatedDeathAge = lifeDestinyStrength < 200 ? 60 : lifeDestinyStrength < 400 ? 68 : lifeDestinyStrength < 600 ? 75 : lifeDestinyStrength < 800 ? 82 : 88;
  seeds.push({
    id: seedId('tieban', 'death', estimatedDeathAge, 'longevity'),
    engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
    category: 'death', subcategory: '寿限推断',
    description: `铁板命宫条文${proj.lifeDestiny}号推算寿限约${estimatedDeathAge}岁`,
    earliestAge: estimatedDeathAge - 5, latestAge: estimatedDeathAge + 5,
    probability: 0.5, intensity: 'life_defining',
    causalFactors: [`命宫条文${proj.lifeDestiny}`, `命局数值${lifeDestinyStrength}`],
    triggerConditions: ['大运逢死墓绝'], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -30 },
    sourceDetail: `铁板命宫条文${proj.lifeDestiny}(寿限推算)`,
  });

  // ── 1E. Migration event from property palace ──
  const propertyStrength = proj.lifeDestiny % 500; // use lifeDestiny sub-range
  if (propertyStrength < 200) {
    seeds.push({
      id: seedId('tieban', 'migration', 25, 'migration-early'),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: 'migration', subcategory: '迁移变动',
      description: '铁板推算命主青年期有远行或迁居之象',
      earliestAge: 20, latestAge: 30,
      probability: 0.5, intensity: 'moderate',
      causalFactors: ['命局偏动'],
      triggerConditions: [], deathRelated: false,
      mergeKey: 'age-25-migration',
      fateImpact: { life: 3 },
      sourceDetail: '铁板迁移推算',
    });
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 2. BaZi Event Extraction (八字 → 事件引擎)
// ═══════════════════════════════════════════════

export function extractBaziEvents(
  deepAnalysis: DeepBaZiAnalysis,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const { dayMaster, tenGods, pattern, favorable, unfavorable, elementBalance } = deepAnalysis;

  // Pattern-based life events
  const patternEvents: Record<string, { cat: EventCategory; age: number; desc: string }[]> = {
    '正官格': [
      { cat: 'career', age: 28, desc: '正官格命主28-35岁事业稳步上升，适合体制/管理' },
      { cat: 'career', age: 45, desc: '正官格中年事业达顶峰' },
    ],
    '七杀格': [
      { cat: 'career', age: 25, desc: '七杀格命主25岁前后可能面临重大事业挑战' },
      { cat: 'turning_point', age: 35, desc: '七杀格35岁大变革期，权力或地位剧变' },
    ],
    '正财格': [
      { cat: 'wealth', age: 30, desc: '正财格30岁前后财运渐起' },
      { cat: 'wealth', age: 50, desc: '正财格50岁财富积累达峰值' },
    ],
    '食神格': [
      { cat: 'education', age: 22, desc: '食神格22岁前后学业/创作出成果' },
      { cat: 'career', age: 35, desc: '食神格35岁创造力高峰期' },
    ],
    '偏财格': [
      { cat: 'wealth', age: 28, desc: '偏财格28岁前后有偏财机遇' },
      { cat: 'wealth', age: 42, desc: '偏财格42岁商业/投资高峰' },
    ],
    '正印格': [
      { cat: 'education', age: 20, desc: '正印格20岁学业有成' },
      { cat: 'career', age: 40, desc: '正印格40岁学术/管理事业稳固' },
    ],
  };

  const patternSeeds = patternEvents[pattern.name] || [
    { cat: 'career' as EventCategory, age: 30, desc: `${pattern.name}命主30岁前后事业关键转折` },
  ];

  for (const pe of patternSeeds) {
    seeds.push({
      id: seedId('bazi', pe.cat, pe.age, pattern.name),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: pe.cat, subcategory: pattern.name,
      description: pe.desc,
      earliestAge: pe.age - 2, latestAge: pe.age + 3,
      probability: 0.7, intensity: 'major',
      causalFactors: [`格局${pattern.name}`, `日主${dayMaster.stem}${dayMaster.element}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${pe.age}-${pe.cat}`,
      fateImpact: pe.cat === 'career' ? { life: 10, wealth: 5 } : pe.cat === 'wealth' ? { wealth: 15 } : { wisdom: 10 },
      sourceDetail: `八字${pattern.name}${pattern.description}`,
    });
  }

  // Ten God career/relationship events
  const officialGod = tenGods.find(t => t.tenGod === '正官' || t.tenGod === '七杀');
  if (officialGod) {
    seeds.push({
      id: seedId('bazi', 'career', 32, officialGod.tenGod),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: 'career', subcategory: '官星事业',
      description: `${officialGod.tenGod}透出，主30-35岁事业地位变动`,
      earliestAge: 30, latestAge: 36,
      probability: 0.65, intensity: 'major',
      causalFactors: [`${officialGod.tenGod}在${officialGod.position}`],
      triggerConditions: ['大运逢官杀年'], deathRelated: false,
      mergeKey: 'age-32-career',
      fateImpact: { life: 8 },
      sourceDetail: `${officialGod.tenGod}(${officialGod.position})`,
    });
  }

  // Wealth events
  const wealthGod = tenGods.find(t => t.tenGod === '正财' || t.tenGod === '偏财');
  if (wealthGod) {
    seeds.push({
      id: seedId('bazi', 'wealth', 35, wealthGod.tenGod),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: 'wealth', subcategory: '财星财运',
      description: `${wealthGod.tenGod}透出，35-45岁财运活跃期`,
      earliestAge: 33, latestAge: 46,
      probability: 0.6, intensity: 'moderate',
      causalFactors: [`${wealthGod.tenGod}在${wealthGod.position}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: 'age-38-wealth',
      fateImpact: { wealth: 12 },
      sourceDetail: `${wealthGod.tenGod}(${wealthGod.position})`,
    });
  }

  // Marriage events
  const marriageGod = tenGods.find(t =>
    t.tenGod === '正财' || t.tenGod === '正官');
  seeds.push({
    id: seedId('bazi', 'relationship', 27, 'marriage'),
    engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
    category: 'relationship', subcategory: '婚姻大事',
    description: `命主${marriageGod ? marriageGod.tenGod + '现，' : ''}25-30岁婚姻缘分期`,
    earliestAge: 25, latestAge: 32,
    probability: 0.6, intensity: 'major',
    causalFactors: marriageGod ? [`${marriageGod.tenGod}婚姻星`] : ['流年桃花'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-27-relationship',
    fateImpact: { relation: 15 },
    sourceDetail: '八字婚姻分析',
  });

  // Yin/seal god → education events
  const sealGod = tenGods.find(t => t.tenGod === '正印' || t.tenGod === '偏印');
  if (sealGod) {
    seeds.push({
      id: seedId('bazi', 'education', 20, sealGod.tenGod),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: 'education', subcategory: '印星学业',
      description: `${sealGod.tenGod}透出，18-22岁学业/考试关键期`,
      earliestAge: 18, latestAge: 23,
      probability: 0.6, intensity: 'moderate',
      causalFactors: [`${sealGod.tenGod}在${sealGod.position}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: 'age-20-education',
      fateImpact: { wisdom: 10 },
      sourceDetail: `${sealGod.tenGod}(${sealGod.position})`,
    });
  }

  // Day master strength → health risks
  if (dayMaster.strengthLevel === '极弱') {
    seeds.push({
      id: seedId('bazi', 'health', 50, 'weak-daymaster'),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: 'health', subcategory: '日主极弱健康风险',
      description: '日主极弱，中老年健康需格外注意，逢忌年易生大病',
      earliestAge: 45, latestAge: 70,
      probability: 0.4, intensity: 'critical',
      causalFactors: ['日主极弱', `${unfavorable.elements.join('')}克泄过重`],
      triggerConditions: ['大运逢忌', '流年天克'], deathRelated: true,
      mergeKey: 'death-illness-mid',
      fateImpact: { health: -15 },
      sourceDetail: `日主${dayMaster.stem}极弱`,
    });
  }

  // Element imbalance → accident/disaster
  const fireCount = elementBalance.find(e => e.element === '火')?.percentage || 0;
  const waterCount = elementBalance.find(e => e.element === '水')?.percentage || 0;
  if (fireCount >= 35) {
    seeds.push({
      id: seedId('bazi', 'accident', 40, 'fire-excess'),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: 'accident', subcategory: '火旺灾厄',
      description: '八字火旺，中年需防火灾、心血管疾病或急性事件',
      earliestAge: 35, latestAge: 55,
      probability: 0.3, intensity: 'major',
      causalFactors: [`火占${fireCount}%`],
      triggerConditions: ['流年逢火'], deathRelated: false,
      mergeKey: 'age-40-accident',
      fateImpact: { health: -8 },
      sourceDetail: `八字火占${fireCount}%`,
    });
  }
  if (waterCount >= 35) {
    seeds.push({
      id: seedId('bazi', 'accident', 42, 'water-excess'),
      engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
      category: 'accident', subcategory: '水旺灾厄',
      description: '八字水旺，中年需防水灾、肾病或出行意外',
      earliestAge: 35, latestAge: 55,
      probability: 0.25, intensity: 'moderate',
      causalFactors: [`水占${waterCount}%`],
      triggerConditions: ['流年逢水'], deathRelated: false,
      mergeKey: 'age-42-accident',
      fateImpact: { health: -6 },
      sourceDetail: `八字水占${waterCount}%`,
    });
  }

  // Universal late-life health event
  seeds.push({
    id: seedId('bazi', 'death', 70, 'aging'),
    engineName: 'bazi', engineVersion: '3.0.0', timingBasis: 'birth',
    category: 'death', subcategory: '寿限推断',
    description: `八字推断${dayMaster.strengthLevel === '偏旺' || dayMaster.strengthLevel === '极旺' ? '体质较强，预期寿命偏长' : '需注意养生，预期寿命中等'}`,
    earliestAge: 65, latestAge: 85,
    probability: 0.5, intensity: 'life_defining',
    causalFactors: [`日主${dayMaster.strengthLevel}`, `喜用${favorable.elements.join('')}`],
    triggerConditions: ['大运逢死墓绝'], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -30 },
    sourceDetail: '八字寿限推算',
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 3. Ziwei Doushu Event Extraction (紫微斗数 → 事件引擎)
// ═══════════════════════════════════════════════

const PALACE_CAT_MAP: Record<string, EventCategory> = {
  '命宫': 'turning_point', '夫妻': 'relationship', '财帛': 'wealth',
  '官禄': 'career', '疾厄': 'health', '迁移': 'migration',
  '子女': 'family', '福德': 'spiritual', '田宅': 'wealth',
  '兄弟': 'family', '仆役': 'career', '父母': 'family',
};

const PALACE_FATE_DIM: Record<string, FateDimension> = {
  '命宫': 'life', '夫妻': 'relation', '财帛': 'wealth',
  '官禄': 'life', '疾厄': 'health', '迁移': 'life',
  '子女': 'relation', '福德': 'spirit', '田宅': 'wealth',
  '兄弟': 'relation', '仆役': 'life', '父母': 'relation',
};

export function extractZiweiEvents(
  report: ZiweiReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // ── 3A. Per-palace structured events ──
  for (const palace of report.palaces) {
    const cat = PALACE_CAT_MAP[palace.name] || 'turning_point';
    const fateDim = PALACE_FATE_DIM[palace.name] || 'life';
    const majorStars = palace.stars.filter(s => s.type === 'major');
    const shaStars = palace.stars.filter(s => s.type === 'sha');
    const auxStars = palace.stars.filter(s => s.type === 'auxiliary');
    const hasJi = palace.stars.some(s => s.sihua === '忌');
    const hasLu = palace.stars.some(s => s.sihua === '禄');
    const hasQuan = palace.stars.some(s => s.sihua === '权');
    const hasKe = palace.stars.some(s => s.sihua === '科');

    if (majorStars.length === 0) continue;

    const starNames = majorStars.map(s => s.name).join('、');
    const brightStars = majorStars.filter(s => ['庙', '旺'].includes(s.brightness));
    const dimStars = majorStars.filter(s => s.brightness === '陷');

    // Map palace index to approximate life phase age
    const baseAge = 20 + palace.index * 3;

    // Si Hua events per palace
    if (hasJi) {
      seeds.push({
        id: seedId('ziwei', cat, baseAge, `${palace.name}-ji`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: cat, subcategory: `${palace.name}化忌`,
        description: `${palace.name}有${starNames}，化忌入宫，${baseAge}岁前后${palace.name}方面可能遇阻`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.6, intensity: 'major',
        causalFactors: [`${starNames}入${palace.name}`, '化忌'],
        triggerConditions: shaStars.length > 0 ? ['煞星同宫加剧'] : [],
        deathRelated: cat === 'health',
        mergeKey: `age-${baseAge}-${cat}`,
        fateImpact: { [fateDim]: -10 },
        sourceDetail: `紫微${palace.name}化忌(${starNames})`,
      });
    }

    if (hasLu) {
      seeds.push({
        id: seedId('ziwei', cat, baseAge, `${palace.name}-lu`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: cat, subcategory: `${palace.name}化禄`,
        description: `${palace.name}有${starNames}，化禄入宫，${baseAge}岁前后${palace.name}方面顺遂`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.65, intensity: 'major',
        causalFactors: [`${starNames}入${palace.name}`, '化禄'],
        triggerConditions: [],
        deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}`,
        fateImpact: { [fateDim]: 10 },
        sourceDetail: `紫微${palace.name}化禄(${starNames})`,
      });
    }

    if (hasQuan) {
      seeds.push({
        id: seedId('ziwei', cat, baseAge, `${palace.name}-quan`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: cat, subcategory: `${palace.name}化权`,
        description: `${palace.name}有${starNames}，化权入宫，${baseAge}岁前后掌控力增强`,
        earliestAge: baseAge - 2, latestAge: baseAge + 4,
        probability: 0.6, intensity: 'moderate',
        causalFactors: [`${starNames}入${palace.name}`, '化权'],
        triggerConditions: [],
        deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}-quan`,
        fateImpact: { [fateDim]: 7 },
        sourceDetail: `紫微${palace.name}化权(${starNames})`,
      });
    }

    // Sha stars causing problems
    if (shaStars.length >= 2) {
      seeds.push({
        id: seedId('ziwei', cat, baseAge, `${palace.name}-sha`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: cat === 'health' ? 'health' : 'accident',
        subcategory: `${palace.name}煞聚`,
        description: `${palace.name}煞星${shaStars.map(s => s.name).join('、')}聚合，${baseAge}岁前后需防${palace.name}方面突发事件`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.4, intensity: 'major',
        causalFactors: shaStars.map(s => `${s.name}(${s.brightness})`),
        triggerConditions: ['大限逢煞', '流年再叠煞'],
        deathRelated: palace.name === '疾厄' || palace.name === '命宫',
        mergeKey: `age-${baseAge}-${cat === 'health' ? 'health' : 'accident'}`,
        fateImpact: { [fateDim]: -12 },
        sourceDetail: `紫微${palace.name}煞聚`,
      });
    }

    // Bright major stars → positive core event
    if (brightStars.length > 0 && !hasJi) {
      seeds.push({
        id: seedId('ziwei', cat, baseAge, `${palace.name}-bright`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: cat, subcategory: `${palace.name}主星明亮`,
        description: `${palace.name}主星${brightStars.map(s => `${s.name}(${s.brightness})`).join('、')}明亮，${palace.name}方面先天条件优越`,
        earliestAge: baseAge - 5, latestAge: baseAge + 8,
        probability: 0.55, intensity: 'moderate',
        causalFactors: brightStars.map(s => `${s.name}(${s.brightness})`),
        triggerConditions: [],
        deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}-bright`,
        fateImpact: { [fateDim]: 6 },
        sourceDetail: `紫微${palace.name}主星明亮`,
      });
    }

    // Dim major stars → negative
    if (dimStars.length > 0) {
      seeds.push({
        id: seedId('ziwei', cat, baseAge, `${palace.name}-dim`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: cat, subcategory: `${palace.name}主星陷落`,
        description: `${palace.name}主星${dimStars.map(s => s.name).join('、')}陷落，${palace.name}方面需加倍努力`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.5, intensity: 'moderate',
        causalFactors: dimStars.map(s => `${s.name}陷落`),
        triggerConditions: [],
        deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}-dim`,
        fateImpact: { [fateDim]: -6 },
        sourceDetail: `紫微${palace.name}主星陷落`,
      });
    }
  }

  // ── 3B. Daxian (大限) transition events ──
  for (const dx of report.daxian) {
    const dxMajors = dx.stars.filter(s => s.type === 'major').map(s => s.name).join('、');
    const hasSha = dx.stars.some(s => s.type === 'sha');
    const hasJi = dx.stars.some(s => s.sihua === '忌');
    const hasLu = dx.stars.some(s => s.sihua === '禄');

    let intensity: EventIntensity = 'major';
    let desc: string;
    if (hasJi && hasSha) {
      desc = `${dx.startAge}-${dx.endAge}岁大限行至${dx.palaceName}宫(${dxMajors || '空宫'})，化忌加煞，此十年运势多阻`;
      intensity = 'critical';
    } else if (hasLu) {
      desc = `${dx.startAge}-${dx.endAge}岁大限行至${dx.palaceName}宫(${dxMajors || '空宫'})，化禄助运，此十年顺遂`;
    } else if (hasSha) {
      desc = `${dx.startAge}-${dx.endAge}岁大限行至${dx.palaceName}宫(${dxMajors || '空宫'})，煞星同宫需注意`;
    } else {
      desc = `${dx.startAge}-${dx.endAge}岁大限行至${dx.palaceName}宫(${dxMajors || '空宫'})，运势平稳`;
    }

    seeds.push({
      id: seedId('ziwei', 'turning_point', dx.startAge, `daxian-${dx.palaceName}`),
      engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
      category: 'turning_point', subcategory: `大限${dx.palaceName}`,
      description: desc,
      earliestAge: dx.startAge, latestAge: dx.startAge + 2,
      probability: 0.8, intensity,
      causalFactors: [`大限${dx.palaceName}`, dxMajors ? `主星${dxMajors}` : '空宫'],
      triggerConditions: hasSha ? ['煞星同宫'] : [],
      deathRelated: dx.palaceName === '疾厄' && (hasSha || hasJi),
      mergeKey: `dayun-${dx.startAge}`,
      fateImpact: { life: (hasJi && hasSha) ? -10 : hasLu ? 8 : hasSha ? -5 : 3 },
      sourceDetail: `紫微大限${dx.palaceName}`,
    });

    // Daxian-specific palace events
    if (dx.palaceName === '疾厄' && hasSha) {
      seeds.push({
        id: seedId('ziwei', 'health', dx.startAge + 5, `daxian-${dx.palaceName}-health`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: 'health', subcategory: '大限逢疾厄',
        description: `大限行至疾厄宫且有煞星，${dx.startAge}-${dx.endAge}岁健康需高度关注`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.45, intensity: 'critical',
        causalFactors: [`大限疾厄宫`, ...dx.stars.filter(s => s.type === 'sha').map(s => s.name)],
        triggerConditions: ['流年再逢煞'], deathRelated: true,
        mergeKey: `death-illness-daxian-${dx.startAge}`,
        fateImpact: { health: -15 },
        sourceDetail: `紫微大限疾厄宫`,
      });
    }

    if (dx.palaceName === '夫妻') {
      seeds.push({
        id: seedId('ziwei', 'relationship', dx.startAge + 3, `daxian-marriage`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: 'relationship', subcategory: '大限逢夫妻',
        description: `大限行至夫妻宫，${dx.startAge}-${dx.endAge}岁婚姻感情为主题`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.7, intensity: 'major',
        causalFactors: ['大限夫妻宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-relationship`,
        fateImpact: { relation: hasJi ? -8 : 10 },
        sourceDetail: `紫微大限夫妻宫`,
      });
    }

    if (dx.palaceName === '官禄') {
      seeds.push({
        id: seedId('ziwei', 'career', dx.startAge + 3, `daxian-career`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: 'career', subcategory: '大限逢官禄',
        description: `大限行至官禄宫，${dx.startAge}-${dx.endAge}岁事业为主题`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.7, intensity: 'major',
        causalFactors: ['大限官禄宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-career`,
        fateImpact: { life: hasJi ? -8 : 10 },
        sourceDetail: `紫微大限官禄宫`,
      });
    }
  }

  // ── 3C. Liunian (流年) events ──
  for (const ln of report.liunian) {
    const hasJi = ln.sihua.some(s => s.transform === '忌');
    const hasLu = ln.sihua.some(s => s.transform === '禄');
    if (!hasJi && !hasLu) continue;

    const jiStars = ln.sihua.filter(s => s.transform === '忌').map(s => s.star);
    const luStars = ln.sihua.filter(s => s.transform === '禄').map(s => s.star);

    seeds.push({
      id: seedId('ziwei', 'turning_point', ln.age, `liunian-${ln.year}`),
      engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
      category: hasJi ? 'health' : 'career',
      subcategory: `流年${ln.year}`,
      description: `${ln.year}年(${ln.age}岁)流年${ln.palaceName}宫，${hasJi ? `${jiStars.join('')}化忌需防` : `${luStars.join('')}化禄有利`}`,
      earliestAge: ln.age, latestAge: ln.age,
      probability: hasJi ? 0.5 : 0.6,
      intensity: 'moderate',
      causalFactors: ln.sihua.map(s => `${s.star}化${s.transform}`),
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${ln.age}-${hasJi ? 'health' : 'career'}`,
      fateImpact: hasJi ? { health: -5 } : { life: 5 },
      sourceDetail: `紫微流年${ln.year}`,
    });
  }

  // ── 3D. Liuyue (流月) basic events — first 2 years from query time ──
  // Generate monthly events for the current liunian period
  for (const ln of report.liunian.slice(0, 2)) {
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      // Each month the 12 palaces rotate
      const monthPalaceIdx = (monthOffset) % 12;
      const monthPalace = report.palaces[monthPalaceIdx];
      if (!monthPalace) continue;

      const hasMonthSha = monthPalace.stars.some(s => s.type === 'sha');
      const hasMonthJi = monthPalace.stars.some(s => s.sihua === '忌');
      
      // Only generate seeds for notable months
      if (!hasMonthSha && !hasMonthJi) continue;

      seeds.push({
        id: seedId('ziwei', 'turning_point', ln.age, `liuyue-${ln.year}-m${monthOffset + 1}`),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: hasMonthJi ? 'health' : 'turning_point',
        subcategory: `流月${ln.year}年${monthOffset + 1}月`,
        description: `${ln.year}年${monthOffset + 1}月流月过${monthPalace.name}宫，${hasMonthJi ? '化忌需防' : '煞星冲动'}`,
        earliestAge: ln.age, latestAge: ln.age,
        probability: 0.35, intensity: 'minor',
        causalFactors: [`流月${monthPalace.name}`, hasMonthJi ? '化忌' : '煞星'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${ln.age}-${hasMonthJi ? 'health' : 'turning_point'}-m${monthOffset + 1}`,
        fateImpact: hasMonthJi ? { health: -2 } : {},
        sourceDetail: `紫微流月${ln.year}年${monthOffset + 1}月`,
      });
    }
  }

  // ── 3E. Death/longevity signal from illness palace ──
  const illPalace = report.palaces.find(p => p.name === '疾厄');
  if (illPalace) {
    const shaCount = illPalace.stars.filter(s => s.type === 'sha').length;
    const hasJi = illPalace.stars.some(s => s.sihua === '忌');
    const brightHealth = illPalace.stars.filter(s => s.type === 'major' && ['庙', '旺'].includes(s.brightness));

    if (shaCount >= 2 || hasJi) {
      seeds.push({
        id: seedId('ziwei', 'death', 60, 'illness-palace'),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: 'death', subcategory: '疾厄宫凶象',
        description: `疾厄宫${hasJi ? '化忌' : ''}${shaCount >= 2 ? '多煞' : ''}，晚年健康需高度关注`,
        earliestAge: 55, latestAge: 80,
        probability: shaCount >= 2 && hasJi ? 0.5 : 0.3,
        intensity: 'critical',
        causalFactors: illPalace.stars.filter(s => s.type === 'sha').map(s => s.name),
        triggerConditions: ['大限逢疾厄'], deathRelated: true,
        mergeKey: 'death-illness-late',
        fateImpact: { health: -20 },
        sourceDetail: '紫微疾厄宫分析',
      });
    }

    // Good health → longevity signal
    if (brightHealth.length > 0 && shaCount === 0 && !hasJi) {
      seeds.push({
        id: seedId('ziwei', 'health', 75, 'longevity-good'),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: 'death', subcategory: '疾厄宫吉象',
        description: `疾厄宫主星${brightHealth.map(s => s.name).join('、')}明亮无煞，体质较佳，预期寿命偏长`,
        earliestAge: 75, latestAge: 92,
        probability: 0.5, intensity: 'life_defining',
        causalFactors: brightHealth.map(s => `${s.name}(${s.brightness})`),
        triggerConditions: [], deathRelated: true,
        mergeKey: 'death-natural-late',
        fateImpact: { health: 10 },
        sourceDetail: '紫微疾厄宫吉象',
      });
    }
  }

  // ── 3F. Migration event from migration palace ──
  const migPalace = report.palaces.find(p => p.name === '迁移');
  if (migPalace) {
    const hasTianma = migPalace.stars.some(s => s.name === '天马');
    const hasLucun = migPalace.stars.some(s => s.name === '禄存');
    if (hasTianma || hasLucun) {
      seeds.push({
        id: seedId('ziwei', 'migration', 28, 'migration-tianma'),
        engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
        category: 'migration', subcategory: '迁移宫动象',
        description: `迁移宫有${hasTianma ? '天马' : ''}${hasLucun ? '禄存' : ''}，命主有外出发展或迁居之象`,
        earliestAge: 22, latestAge: 35,
        probability: 0.55, intensity: 'moderate',
        causalFactors: [hasTianma ? '天马入迁移' : '', hasLucun ? '禄存入迁移' : ''].filter(Boolean),
        triggerConditions: [], deathRelated: false,
        mergeKey: 'age-28-migration',
        fateImpact: { life: 5 },
        sourceDetail: '紫微迁移宫分析',
      });
    }
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 4. Western Astrology Event Extraction
// ═══════════════════════════════════════════════

export function extractWesternEvents(
  report: WesternAstrologyReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // Saturn Return events (~29 and ~58)
  seeds.push({
    id: seedId('western', 'turning_point', 29, 'saturn-return-1'),
    engineName: 'western', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'turning_point', subcategory: '土星回归',
    description: '第一次土星回归(约29岁)：人生重大转折期，事业与身份重新定义',
    earliestAge: 28, latestAge: 31,
    probability: 0.8, intensity: 'critical',
    causalFactors: ['Saturn Return', `太阳${report.sunSign}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-29-turning_point',
    fateImpact: { life: 5 },
    sourceDetail: '西方占星土星回归',
  });

  seeds.push({
    id: seedId('western', 'turning_point', 58, 'saturn-return-2'),
    engineName: 'western', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'turning_point', subcategory: '第二次土星回归',
    description: '第二次土星回归(约58岁)：退休/遗产阶段，人生角色再次转变',
    earliestAge: 57, latestAge: 60,
    probability: 0.75, intensity: 'major',
    causalFactors: ['Second Saturn Return'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-58-turning_point',
    fateImpact: { life: -3, wisdom: 5 },
    sourceDetail: '西方占星第二次土星回归',
  });

  // Uranus Opposition (~42) - midlife crisis
  seeds.push({
    id: seedId('western', 'turning_point', 42, 'uranus-opposition'),
    engineName: 'western', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'turning_point', subcategory: '天王星冲',
    description: '天王星对冲(约42岁)：中年危机期，可能有突发变化或觉醒',
    earliestAge: 40, latestAge: 44,
    probability: 0.7, intensity: 'major',
    causalFactors: ['Uranus Opposition'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-42-turning_point',
    fateImpact: { spirit: 8, life: -3 },
    sourceDetail: '西方占星天王星对冲',
  });

  // Jupiter Return (~12, 24, 36, 48, 60) - expansion cycles
  for (const jupAge of [24, 36, 48]) {
    seeds.push({
      id: seedId('western', 'wealth', jupAge, `jupiter-return-${jupAge}`),
      engineName: 'western', engineVersion: '1.0.0', timingBasis: 'birth',
      category: jupAge === 36 ? 'career' : 'wealth',
      subcategory: '木星回归',
      description: `木星回归(约${jupAge}岁)：扩展与机遇期`,
      earliestAge: jupAge - 1, latestAge: jupAge + 1,
      probability: 0.6, intensity: 'moderate',
      causalFactors: ['Jupiter Return'],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${jupAge}-${jupAge === 36 ? 'career' : 'wealth'}`,
      fateImpact: { wealth: 5, life: 3 },
      sourceDetail: '西方占星木星回归',
    });
  }

  // Element-based health tendency
  const elementMap: Record<string, string> = {
    fire: '火象：心血管系统', earth: '土象：消化系统',
    air: '风象：神经/呼吸系统', water: '水象：泌尿/淋巴系统',
  };
  const sunElement = report.planets?.find(p => p.planet === 'Sun')?.element || 'fire';
  const healthNote = elementMap[sunElement] || '综合体质';
  seeds.push({
    id: seedId('western', 'health', 55, 'element-health'),
    engineName: 'western', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'health', subcategory: '元素体质',
    description: `${healthNote}，中老年需关注相关健康问题`,
    earliestAge: 50, latestAge: 70,
    probability: 0.4, intensity: 'moderate',
    causalFactors: [`太阳${report.sunSign}`, `元素${sunElement}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-55-health',
    fateImpact: { health: -3 },
    sourceDetail: '西方占星元素健康',
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 5. Vedic Astrology Event Extraction
// ═══════════════════════════════════════════════

export function extractVedicEvents(
  report: VedicReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // Dasha period transitions → life events
  for (const dasha of report.dashas) {
    if (dasha.startAge < 1 || dasha.startAge > 90) continue;

    const cat: EventCategory = dasha.quality === 'benefic' ? 'career' :
      dasha.quality === 'malefic' ? 'health' : 'turning_point';

    seeds.push({
      id: seedId('vedic', cat, dasha.startAge, `dasha-${dasha.planet}`),
      engineName: 'vedic', engineVersion: '1.0.0', timingBasis: 'birth',
      category: cat, subcategory: `${dasha.planet}大周期`,
      description: `吠陀${dasha.planet}大周期(${dasha.startAge}-${dasha.endAge}岁)：${dasha.quality === 'benefic' ? '吉利期' : dasha.quality === 'malefic' ? '考验期' : '过渡期'}`,
      earliestAge: dasha.startAge, latestAge: dasha.startAge + 2,
      probability: 0.65, intensity: dasha.years >= 10 ? 'major' : 'moderate',
      causalFactors: [`${dasha.planet} Dasha`, `${dasha.quality}`],
      triggerConditions: [], deathRelated: dasha.quality === 'malefic' && dasha.startAge >= 60,
      mergeKey: `dayun-${dasha.startAge}`,
      fateImpact: dasha.quality === 'benefic' ? { life: 8 } : dasha.quality === 'malefic' ? { life: -8 } : {},
      sourceDetail: `吠陀${dasha.planet}大周期`,
    });
  }

  // Yoga-based events
  for (const yoga of report.yogas.slice(0, 3)) {
    seeds.push({
      id: seedId('vedic', 'turning_point', 35, `yoga-${yoga.slice(0, 8)}`),
      engineName: 'vedic', engineVersion: '1.0.0', timingBasis: 'birth',
      category: 'spiritual', subcategory: `Yoga:${yoga}`,
      description: `吠陀Yoga「${yoga}」：命主具有特殊天赋或命运特质`,
      earliestAge: 20, latestAge: 50,
      probability: 0.5, intensity: 'moderate',
      causalFactors: [yoga],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-35-spiritual`,
      fateImpact: { spirit: 5, wisdom: 3 },
      sourceDetail: `吠陀${yoga}`,
    });
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 6. Numerology Event Extraction
// ═══════════════════════════════════════════════

export function extractNumerologyEvents(
  report: NumerologyReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // Life path number → core life theme
  const lpThemes: Record<number, string> = {
    1: '领导/开拓', 2: '合作/外交', 3: '创意/表达', 4: '建设/稳定',
    5: '自由/变化', 6: '家庭/责任', 7: '内省/灵性', 8: '权力/财富', 9: '博爱/完成',
  };
  const theme = lpThemes[report.lifePath] || '综合';

  seeds.push({
    id: seedId('numerology', 'turning_point', 33, `lp-${report.lifePath}`),
    engineName: 'numerology', engineVersion: '1.0.0', timingBasis: 'birth',
    category: report.lifePath === 8 ? 'wealth' : report.lifePath === 1 ? 'career' : 'turning_point',
    subcategory: `生命数${report.lifePath}`,
    description: `数字命理生命数${report.lifePath}(${theme})：33岁前后进入人生主题核心期`,
    earliestAge: 30, latestAge: 38,
    probability: 0.55, intensity: 'moderate',
    causalFactors: [`生命路径数${report.lifePath}`, theme],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-33-${report.lifePath === 8 ? 'wealth' : 'turning_point'}`,
    fateImpact: { life: 5 },
    sourceDetail: `数字命理生命数${report.lifePath}`,
  });

  // Personal year cycles → yearly events
  for (const py of report.personalYears) {
    if (py.age < 20 || py.age > 70) continue;
      if (py.energy < 30 || py.energy > 75) {
      seeds.push({
        id: seedId('numerology', 'turning_point', py.age, `py-${py.year}`),
        engineName: 'numerology', engineVersion: '1.0.0', timingBasis: 'birth',
        category: py.energy > 60 ? 'career' : 'health',
        subcategory: `个人年${py.number}`,
        description: `数字命理${py.year}年(${py.age}岁)个人年${py.number}：${py.energy > 60 ? '能量充沛' : '低能量期需休整'}`,
        earliestAge: py.age, latestAge: py.age,
        probability: 0.4, intensity: 'minor',
        causalFactors: [`个人年数${py.number}`, `能量${py.energy}`],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${py.age}-${py.energy > 60 ? 'career' : 'health'}`,
        fateImpact: py.energy > 60 ? { life: 3 } : { life: -3 },
        sourceDetail: `数字命理个人年${py.number}`,
      });
    }
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 7. Mayan Calendar Event Extraction
// ═══════════════════════════════════════════════

export function extractMayanEvents(
  report: MayanReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // Galactic tone → life rhythm
  const toneAge = 20 + report.galacticTone * 3;
  seeds.push({
    id: seedId('mayan', 'spiritual', toneAge, `tone-${report.galacticTone}`),
    engineName: 'mayan', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'spiritual', subcategory: `银河音${report.galacticTone}`,
    description: `玛雅银河音${report.galacticTone}：${toneAge}岁前后灵性觉醒或重大人生领悟`,
    earliestAge: toneAge - 3, latestAge: toneAge + 5,
    probability: 0.45, intensity: 'moderate',
    causalFactors: [`Kin${report.kin}`, `银河音${report.galacticTone}`, report.daySignCN],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${toneAge}-spiritual`,
    fateImpact: { spirit: 8 },
    sourceDetail: `玛雅Kin${report.kin}(${report.daySignCN})`,
  });

  // 52-year calendar round
  seeds.push({
    id: seedId('mayan', 'turning_point', 52, 'calendar-round'),
    engineName: 'mayan', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'turning_point', subcategory: '玛雅历法轮回',
    description: '玛雅52年历法轮回：52岁人生重新开始，新循环开启',
    earliestAge: 51, latestAge: 53,
    probability: 0.5, intensity: 'major',
    causalFactors: ['Calendar Round 52年'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-52-turning_point',
    fateImpact: { spirit: 10, life: 3 },
    sourceDetail: '玛雅52年历法轮回',
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 8. Kabbalah Event Extraction
// ═══════════════════════════════════════════════

export function extractKabbalahEvents(
  report: KabbalahReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // Soul Sephirah → spiritual milestone
  seeds.push({
    id: seedId('kabbalah', 'spiritual', 40, `soul-${report.soulSephirah.nameCN}`),
    engineName: 'kabbalah', engineVersion: '1.0.0', timingBasis: 'birth',
    category: 'spiritual', subcategory: `灵魂质点${report.soulSephirah.nameCN}`,
    description: `卡巴拉灵魂质点「${report.soulSephirah.nameCN}」：40岁前后灵性维度有重大突破`,
    earliestAge: 35, latestAge: 48,
    probability: 0.45, intensity: 'moderate',
    causalFactors: [`灵魂质点${report.soulSephirah.nameCN}`, `人格质点${report.personalitySephirah.nameCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-40-spiritual',
    fateImpact: { spirit: 10 },
    sourceDetail: `卡巴拉灵魂质点${report.soulSephirah.nameCN}`,
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 9. Instant Engine Event Extraction
// (LiuYao, Meihua, Qimen, LiuRen, Taiyi)
// These produce "trigger" events that create acute branches
// ═══════════════════════════════════════════════

export function extractInstantEvents(
  eo: EngineOutput,
  queryTimeUtc: string,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const no = eo.normalizedOutput;
  const queryDate = new Date(queryTimeUtc);
  const queryYear = queryDate.getFullYear();
  const currentAge = queryYear - birthYear;

  // Check auspiciousness from engine output
  const auspiciousness = no['吉凶'] || no['auspiciousness'] || '';
  const isAuspicious = auspiciousness === '大吉' || auspiciousness === '吉';
  const isInauspicious = auspiciousness === '大凶' || auspiciousness === '凶';

  // Build structured trigger event
  let cat: EventCategory;
  let desc: string;
  let intensity: EventIntensity = 'moderate';

  if (eo.engineName === 'liuyao') {
    const guaName = no['卦名'] || '';
    const changingLines = parseInt(no['动爻'] || '0');
    cat = isInauspicious ? 'accident' : isAuspicious ? 'career' : 'turning_point';
    desc = `六爻于${queryTimeUtc.slice(0, 10)}起卦得「${guaName}」(动爻${changingLines})：${isAuspicious ? '卦象吉利，近期行事顺遂' : isInauspicious ? '卦象不利，近1-2年需谨慎' : '卦象中平'}`;
    intensity = changingLines >= 3 ? 'major' : 'moderate';
  } else if (eo.engineName === 'meihua') {
    const benGua = no['本卦'] || no['benGua'] || '';
    const bianGua = no['变卦'] || no['bianGua'] || '';
    const tiYong = no['体用'] || no['tiYong'] || '';
    cat = isInauspicious ? 'accident' : 'turning_point';
    desc = `梅花易数于${queryTimeUtc.slice(0, 10)}起卦：本卦${benGua}→变卦${bianGua}(${tiYong})，${isAuspicious ? '体用生助，近期顺利' : isInauspicious ? '体用克害，需防变故' : '体用平衡'}`;
  } else if (eo.engineName === 'qimen') {
    const dunType = no['遁局'] || '';
    const zhiFu = no['值符'] || '';
    const zhiShi = no['值使'] || '';
    cat = isInauspicious ? 'accident' : 'career';
    desc = `奇门遁甲于${queryTimeUtc.slice(0, 10)}起局：${dunType}，值符${zhiFu}值使${zhiShi}，${isAuspicious ? '吉门吉格，可行大事' : isInauspicious ? '凶门凶格，宜静不宜动' : '格局中平'}`;
  } else if (eo.engineName === 'liuren') {
    const keType = no['课体'] || '';
    const sanChuan = no['三传'] || '';
    cat = isInauspicious ? 'health' : 'turning_point';
    desc = `大六壬于${queryTimeUtc.slice(0, 10)}起课：${keType}课，三传${sanChuan}，${isAuspicious ? '课格吉利' : isInauspicious ? '课格凶险' : '课格中平'}`;
  } else if (eo.engineName === 'taiyi') {
    const juNumber = no['局式'] || '';
    const geju = no['格局'] || '';
    cat = isInauspicious ? 'health' : 'career';
    desc = `太乙神数于${queryTimeUtc.slice(0, 10)}起局：${juNumber}，格局${geju}，${isAuspicious ? '太乙吉象' : isInauspicious ? '太乙凶象' : '太乙平象'}`;
  } else {
    cat = 'turning_point';
    desc = `${eo.engineNameCN}即时判断：${isAuspicious ? '吉' : isInauspicious ? '凶' : '中平'}`;
  }

  // Main trigger event within 1-3 years of query
  seeds.push({
    id: seedId(eo.engineName, cat, currentAge > 0 ? currentAge : 30, 'instant-trigger'),
    engineName: eo.engineName, engineVersion: eo.engineVersion, timingBasis: 'query',
    category: cat, subcategory: `${eo.engineNameCN}即时`,
    description: desc,
    earliestAge: currentAge > 0 ? currentAge : 28,
    latestAge: currentAge > 0 ? currentAge + 2 : 33,
    earliestYear: queryYear, latestYear: queryYear + 2,
    probability: isAuspicious ? 0.65 : isInauspicious ? 0.55 : 0.45,
    intensity,
    causalFactors: Object.entries(no).slice(0, 5).map(([k, v]) => `${k}:${v}`),
    triggerConditions: [`起局时间${queryTimeUtc}`],
    deathRelated: false,
    mergeKey: `instant-${queryYear}-${eo.engineName}`,
    fateImpact: isAuspicious ? { life: 5, wealth: 5 } : isInauspicious ? { life: -5, health: -3 } : {},
    sourceDetail: `${eo.engineNameCN}即时判断`,
  });

  // If inauspicious, add a secondary warning event
  if (isInauspicious && currentAge > 0) {
    seeds.push({
      id: seedId(eo.engineName, 'health', currentAge + 1, 'instant-warning'),
      engineName: eo.engineName, engineVersion: eo.engineVersion, timingBasis: 'query',
      category: 'health', subcategory: `${eo.engineNameCN}凶兆`,
      description: `${eo.engineNameCN}判断近期运势不利，${currentAge + 1}岁需注意健康与安全`,
      earliestAge: currentAge, latestAge: currentAge + 2,
      probability: 0.35, intensity: 'moderate',
      causalFactors: [`${eo.engineNameCN}凶象`],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${currentAge + 1}-health`,
      fateImpact: { health: -5 },
      sourceDetail: `${eo.engineNameCN}凶兆`,
    });
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// Legacy compatibility wrapper
// ═══════════════════════════════════════════════

/** @deprecated Use specific extractXxxEvents functions instead */
export function extractGenericEvents(
  eo: EngineOutput,
  birthYear: number,
): DestinyEventSeed[] {
  // This function is kept for backward compatibility but now returns empty
  // All engines should use their specific extractors
  return [];
}
