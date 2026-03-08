/**
 * H-Pulse Engine Event Seed Extractors v3.0
 *
 * Converts raw engine outputs into DestinyEventSeed[] for world tree generation.
 * Each engine extracts destiny-relevant events from its domain-specific calculations.
 *
 * v3.0 Changes:
 * - All seeds now include sourceFieldPath, sourceEvidence, reasoning, confidence, conflictTags
 * - Western/Vedic/Numerology/Mayan/Kabbalah fully upgraded with 6+ event categories each
 * - No generic/fallback extractors remain
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

/** Default seed fields for traceability */
function baseSeed(engine: string, version: string, timing: 'birth' | 'query'): Pick<DestinyEventSeed, 'engineName' | 'engineVersion' | 'timingBasis'> {
  return { engineName: engine, engineVersion: version, timingBasis: timing };
}

// ═══════════════════════════════════════════════
// 1. Tieban Event Extraction (铁板神数 → 事件引擎)
// ═══════════════════════════════════════════════

const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

export function extractTiebanEvents(
  fullReport: FullDestinyReport,
  baziProfile: BaZiProfile,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const proj = fullReport.destinyProjection;
  const fav = baziProfile.favorableElements;
  const unfav = baziProfile.unfavorableElements;
  const B = baseSeed('tieban', '3.0.0', 'birth');

  // ── 1A. Marriage palace ──
  const marriageStrength = proj.marriage % 1000;
  const marriagePhase = marriageStrength < 300 ? 'early' : marriageStrength < 600 ? 'mid' : 'late';
  const marriageAge = marriagePhase === 'early' ? 23 : marriagePhase === 'mid' ? 28 : 33;
  seeds.push({
    ...B, id: seedId('tieban', 'relationship', marriageAge, 'marriage-palace'),
    category: 'relationship', subcategory: '婚姻宫定局',
    description: `铁板婚姻宫条文${proj.marriage}号：命主${marriageAge}岁前后婚姻缘分应期`,
    earliestAge: marriageAge - 3, latestAge: marriageAge + 4,
    probability: 0.7, intensity: 'major',
    causalFactors: [`婚姻宫条文${proj.marriage}`, `婚姻数值${marriageStrength}`],
    triggerConditions: ['流年逢桃花'], deathRelated: false,
    mergeKey: `age-${marriageAge}-relationship`,
    fateImpact: { relation: 15 },
    sourceDetail: `铁板婚姻宫条文${proj.marriage}`,
    sourceFieldPath: 'destinyProjection.marriage',
    sourceEvidence: `条文号${proj.marriage}，数值${marriageStrength}`,
    reasoning: `婚姻宫数值${marriageStrength}映射为${marriagePhase}期婚姻，推算${marriageAge}岁应期`,
    confidence: 0.7, conflictTags: ['marriage-timing'],
  });

  // ── 1B. Career palace ──
  const careerStrength = proj.career % 1000;
  const careerPeak = careerStrength < 400 ? 30 : careerStrength < 700 ? 38 : 45;
  seeds.push({
    ...B, id: seedId('tieban', 'career', careerPeak, 'career-palace'),
    category: 'career', subcategory: '官禄宫定局',
    description: `铁板官禄宫条文${proj.career}号：${careerPeak}岁前后事业关键转折`,
    earliestAge: careerPeak - 3, latestAge: careerPeak + 5,
    probability: 0.65, intensity: 'major',
    causalFactors: [`官禄宫条文${proj.career}`, `事业数值${careerStrength}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${careerPeak}-career`,
    fateImpact: { life: 10, wealth: 5 },
    sourceDetail: `铁板官禄宫条文${proj.career}`,
    sourceFieldPath: 'destinyProjection.career',
    sourceEvidence: `条文号${proj.career}，数值${careerStrength}`,
    reasoning: `官禄宫数值${careerStrength}推算事业峰值在${careerPeak}岁`,
    confidence: 0.65, conflictTags: ['career-peak'],
  });

  // ── 1C. Wealth palace ──
  const wealthStrength = proj.wealth % 1000;
  const wealthPeak = wealthStrength < 300 ? 28 : wealthStrength < 600 ? 38 : 48;
  seeds.push({
    ...B, id: seedId('tieban', 'wealth', wealthPeak, 'wealth-palace'),
    category: 'wealth', subcategory: '财帛宫定局',
    description: `铁板财帛宫条文${proj.wealth}号：${wealthPeak}岁前后财运高峰`,
    earliestAge: wealthPeak - 4, latestAge: wealthPeak + 5,
    probability: 0.6, intensity: 'moderate',
    causalFactors: [`财帛宫条文${proj.wealth}`, `财运数值${wealthStrength}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${wealthPeak}-wealth`,
    fateImpact: { wealth: 12 },
    sourceDetail: `铁板财帛宫条文${proj.wealth}`,
    sourceFieldPath: 'destinyProjection.wealth',
    sourceEvidence: `条文号${proj.wealth}，数值${wealthStrength}`,
    reasoning: `财帛宫数值${wealthStrength}推算财运峰值在${wealthPeak}岁`,
    confidence: 0.6, conflictTags: ['wealth-peak'],
  });

  // ── 1D. Health palace ──
  const healthStrength = proj.health % 1000;
  if (healthStrength < 400) {
    const riskAge = healthStrength < 200 ? 55 : 65;
    seeds.push({
      ...B, id: seedId('tieban', 'health', riskAge, 'health-palace-risk'),
      category: 'health', subcategory: '疾厄宫凶象',
      description: `铁板疾厄宫条文${proj.health}号：健康数值偏低(${healthStrength})，${riskAge}岁前后需防重疾`,
      earliestAge: riskAge - 5, latestAge: riskAge + 10,
      probability: 0.4, intensity: 'critical',
      causalFactors: [`疾厄宫条文${proj.health}`, `健康数值${healthStrength}`],
      triggerConditions: ['大运逢忌', '流年天克'], deathRelated: true,
      mergeKey: 'death-illness-late',
      fateImpact: { health: -20 },
      sourceDetail: `铁板疾厄宫条文${proj.health}(健康值${healthStrength})`,
      sourceFieldPath: 'destinyProjection.health',
      sourceEvidence: `疾厄宫条文${proj.health}，健康值${healthStrength}(<400)`,
      reasoning: `健康数值${healthStrength}低于400阈值，推算${riskAge}岁前后有重疾风险`,
      confidence: 0.4, conflictTags: ['health-risk', 'death-illness'],
    });
  }

  // ── 1E. Children palace ──
  const childrenStrength = proj.children % 1000;
  const childAge = childrenStrength < 400 ? 30 : 28;
  seeds.push({
    ...B, id: seedId('tieban', 'family', childAge, 'children-palace'),
    category: 'family', subcategory: '子女宫',
    description: `铁板子女宫条文${proj.children}号：${childAge}岁前后子女缘分应期`,
    earliestAge: childAge - 3, latestAge: childAge + 5,
    probability: 0.55, intensity: 'moderate',
    causalFactors: [`子女宫条文${proj.children}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${childAge}-family`,
    fateImpact: { relation: 8 },
    sourceDetail: `铁板子女宫条文${proj.children}`,
    sourceFieldPath: 'destinyProjection.children',
    sourceEvidence: `子女宫条文${proj.children}，数值${childrenStrength}`,
    reasoning: `子女宫数值${childrenStrength}推算子女缘分在${childAge}岁`,
    confidence: 0.55, conflictTags: ['children-timing'],
  });

  // ── 1F. Da Yun transition events ──
  for (const dy of fullReport.lifeCycles) {
    const dyGanEl = STEM_ELEMENTS[dy.ganZhi.charAt(0)] || '土';
    const isFavDy = fav.includes(dyGanEl);
    const isUnfavDy = unfav.includes(dyGanEl);
    
    seeds.push({
      ...B, id: seedId('tieban', 'turning_point', dy.startAge, `dayun-${dy.ganZhi}`),
      category: 'turning_point', subcategory: `大运${dy.ganZhi}`,
      description: `${dy.startAge}-${dy.endAge}岁大运${dy.ganZhi}(${dy.element})：${isFavDy ? '喜用大运，运势上行' : isUnfavDy ? '忌神大运，需防波折' : '平运'}`,
      earliestAge: dy.startAge, latestAge: dy.startAge + 2,
      probability: 0.85, intensity: isFavDy || isUnfavDy ? 'major' : 'moderate',
      causalFactors: [`大运${dy.ganZhi}`, `五行${dy.element}`, isFavDy ? '喜用神' : isUnfavDy ? '忌神' : '中性'],
      triggerConditions: [], deathRelated: false,
      mergeKey: `dayun-${dy.startAge}`,
      fateImpact: { life: isFavDy ? 8 : isUnfavDy ? -8 : 0 },
      sourceDetail: `铁板大运${dy.ganZhi}(${dy.element})`,
      sourceFieldPath: `lifeCycles[startAge=${dy.startAge}]`,
      sourceEvidence: `大运${dy.ganZhi}，五行${dy.element}，喜用${fav.join('')}`,
      reasoning: `大运天干${dy.ganZhi.charAt(0)}属${dyGanEl}，${isFavDy ? '为喜用神' : isUnfavDy ? '为忌神' : '中性'}`,
      confidence: 0.8, conflictTags: [`dayun-${dy.startAge}`],
    });
  }

  // ── 1G. Flow year milestone events ──
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
      cat = 'education'; desc = `铁板流年${fy.ganZhi}(${fy.age}岁)：${isFavorable ? '学业顺遂' : isUnfavorable ? '学途多阻' : '学业平稳'}，条文${fy.clauseNumber}号`;
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
      ...B, id: seedId('tieban', cat, fy.age, `flow-${fy.ganZhi}`),
      category: cat, subcategory: `流年${fy.ganZhi}`,
      description: desc,
      earliestAge: fy.age, latestAge: fy.age,
      earliestYear: fy.year, latestYear: fy.year,
      probability: isFavorable ? 0.7 : isUnfavorable ? 0.45 : 0.55,
      intensity: intensityFromScore(isFavorable ? 70 : isUnfavorable ? 40 : 55),
      causalFactors: [`条文${fy.clauseNumber}`, `年干${ganChar}(${stemEl})`, isFavorable ? '喜用年' : isUnfavorable ? '忌年' : '平年'],
      triggerConditions: [], deathRelated: fy.age >= 70 && isUnfavorable,
      mergeKey: `age-${fy.age}-${cat}`,
      fateImpact: { life: isFavorable ? 8 : isUnfavorable ? -8 : 0 },
      sourceDetail: `铁板条文${fy.clauseNumber}(流年${fy.ganZhi})`,
      sourceFieldPath: `flowYears[age=${fy.age}]`,
      sourceEvidence: `条文${fy.clauseNumber}，流年${fy.ganZhi}，年干${ganChar}属${stemEl}`,
      reasoning: `流年天干${ganChar}属${stemEl}，${isFavorable ? '为喜用' : isUnfavorable ? '为忌神' : '中性'}，结合条文${fy.clauseNumber}推断`,
      confidence: isFavorable ? 0.7 : 0.5, conflictTags: [`flow-${fy.age}`],
    });
  }

  // ── 1H. Death/longevity signal ──
  const lifeDestinyStrength = proj.lifeDestiny % 1000;
  const estimatedDeathAge = lifeDestinyStrength < 200 ? 60 : lifeDestinyStrength < 400 ? 68 : lifeDestinyStrength < 600 ? 75 : lifeDestinyStrength < 800 ? 82 : 88;
  seeds.push({
    ...B, id: seedId('tieban', 'death', estimatedDeathAge, 'longevity'),
    category: 'death', subcategory: '寿限推断',
    description: `铁板命宫条文${proj.lifeDestiny}号推算寿限约${estimatedDeathAge}岁`,
    earliestAge: estimatedDeathAge - 5, latestAge: estimatedDeathAge + 5,
    probability: 0.5, intensity: 'life_defining',
    causalFactors: [`命宫条文${proj.lifeDestiny}`, `命局数值${lifeDestinyStrength}`],
    triggerConditions: ['大运逢死墓绝'], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -30 },
    sourceDetail: `铁板命宫条文${proj.lifeDestiny}(寿限推算)`,
    sourceFieldPath: 'destinyProjection.lifeDestiny',
    sourceEvidence: `命宫条文${proj.lifeDestiny}，命局数值${lifeDestinyStrength}`,
    reasoning: `命宫数值${lifeDestinyStrength}按阈值映射推算寿限约${estimatedDeathAge}岁`,
    confidence: 0.5, conflictTags: ['death-natural', 'longevity'],
  });

  // ── 1I. Migration event ──
  const propertyStrength = proj.lifeDestiny % 500;
  if (propertyStrength < 200) {
    seeds.push({
      ...B, id: seedId('tieban', 'migration', 25, 'migration-early'),
      category: 'migration', subcategory: '迁移变动',
      description: '铁板推算命主青年期有远行或迁居之象',
      earliestAge: 20, latestAge: 30,
      probability: 0.5, intensity: 'moderate',
      causalFactors: ['命局偏动'],
      triggerConditions: [], deathRelated: false,
      mergeKey: 'age-25-migration',
      fateImpact: { life: 3 },
      sourceDetail: '铁板迁移推算',
      sourceFieldPath: 'destinyProjection.lifeDestiny(sub)',
      sourceEvidence: `命局子数值${propertyStrength}(<200)`,
      reasoning: '命局子数值偏低表示命主有动象，推算青年期迁移',
      confidence: 0.45, conflictTags: ['migration-early'],
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
  const B = baseSeed('bazi', '3.0.0', 'birth');

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
      ...B, id: seedId('bazi', pe.cat, pe.age, pattern.name),
      category: pe.cat, subcategory: pattern.name,
      description: pe.desc,
      earliestAge: pe.age - 2, latestAge: pe.age + 3,
      probability: 0.7, intensity: 'major',
      causalFactors: [`格局${pattern.name}`, `日主${dayMaster.stem}${dayMaster.element}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${pe.age}-${pe.cat}`,
      fateImpact: pe.cat === 'career' ? { life: 10, wealth: 5 } : pe.cat === 'wealth' ? { wealth: 15 } : { wisdom: 10 },
      sourceDetail: `八字${pattern.name}${pattern.description}`,
      sourceFieldPath: `pattern.name=${pattern.name}`,
      sourceEvidence: `格局${pattern.name}，日主${dayMaster.stem}(${dayMaster.element})`,
      reasoning: `${pattern.name}格局推算${pe.age}岁${pe.cat}事件`,
      confidence: 0.7, conflictTags: [`${pe.cat}-${pe.age}`],
    });
  }

  // Ten God career events
  const officialGod = tenGods.find(t => t.tenGod === '正官' || t.tenGod === '七杀');
  if (officialGod) {
    seeds.push({
      ...B, id: seedId('bazi', 'career', 32, officialGod.tenGod),
      category: 'career', subcategory: '官星事业',
      description: `${officialGod.tenGod}透出，主30-35岁事业地位变动`,
      earliestAge: 30, latestAge: 36,
      probability: 0.65, intensity: 'major',
      causalFactors: [`${officialGod.tenGod}在${officialGod.position}`],
      triggerConditions: ['大运逢官杀年'], deathRelated: false,
      mergeKey: 'age-32-career',
      fateImpact: { life: 8 },
      sourceDetail: `${officialGod.tenGod}(${officialGod.position})`,
      sourceFieldPath: `tenGods[${officialGod.tenGod}]`,
      sourceEvidence: `${officialGod.tenGod}在${officialGod.position}位`,
      reasoning: `${officialGod.tenGod}透出表示事业变动，30-35岁为应期`,
      confidence: 0.65, conflictTags: ['career-official'],
    });
  }

  // Wealth events
  const wealthGod = tenGods.find(t => t.tenGod === '正财' || t.tenGod === '偏财');
  if (wealthGod) {
    seeds.push({
      ...B, id: seedId('bazi', 'wealth', 35, wealthGod.tenGod),
      category: 'wealth', subcategory: '财星财运',
      description: `${wealthGod.tenGod}透出，35-45岁财运活跃期`,
      earliestAge: 33, latestAge: 46,
      probability: 0.6, intensity: 'moderate',
      causalFactors: [`${wealthGod.tenGod}在${wealthGod.position}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: 'age-38-wealth',
      fateImpact: { wealth: 12 },
      sourceDetail: `${wealthGod.tenGod}(${wealthGod.position})`,
      sourceFieldPath: `tenGods[${wealthGod.tenGod}]`,
      sourceEvidence: `${wealthGod.tenGod}在${wealthGod.position}位`,
      reasoning: `${wealthGod.tenGod}透出表示财运活跃`,
      confidence: 0.6, conflictTags: ['wealth-star'],
    });
  }

  // Marriage events
  const marriageGod = tenGods.find(t => t.tenGod === '正财' || t.tenGod === '正官');
  seeds.push({
    ...B, id: seedId('bazi', 'relationship', 27, 'marriage'),
    category: 'relationship', subcategory: '婚姻大事',
    description: `命主${marriageGod ? marriageGod.tenGod + '现，' : ''}25-30岁婚姻缘分期`,
    earliestAge: 25, latestAge: 32,
    probability: 0.6, intensity: 'major',
    causalFactors: marriageGod ? [`${marriageGod.tenGod}婚姻星`] : ['流年桃花'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-27-relationship',
    fateImpact: { relation: 15 },
    sourceDetail: '八字婚姻分析',
    sourceFieldPath: 'tenGods(marriage-star)',
    sourceEvidence: marriageGod ? `${marriageGod.tenGod}在${marriageGod.position}` : '无明显婚姻星',
    reasoning: '八字婚姻星或桃花推算婚姻缘分期',
    confidence: 0.6, conflictTags: ['marriage-timing'],
  });

  // Seal god → education
  const sealGod = tenGods.find(t => t.tenGod === '正印' || t.tenGod === '偏印');
  if (sealGod) {
    seeds.push({
      ...B, id: seedId('bazi', 'education', 20, sealGod.tenGod),
      category: 'education', subcategory: '印星学业',
      description: `${sealGod.tenGod}透出，18-22岁学业/考试关键期`,
      earliestAge: 18, latestAge: 23,
      probability: 0.6, intensity: 'moderate',
      causalFactors: [`${sealGod.tenGod}在${sealGod.position}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: 'age-20-education',
      fateImpact: { wisdom: 10 },
      sourceDetail: `${sealGod.tenGod}(${sealGod.position})`,
      sourceFieldPath: `tenGods[${sealGod.tenGod}]`,
      sourceEvidence: `${sealGod.tenGod}在${sealGod.position}`,
      reasoning: '印星透出主学业，18-22岁为应期',
      confidence: 0.6, conflictTags: ['education-timing'],
    });
  }

  // Day master strength → health
  if (dayMaster.strengthLevel === '极弱') {
    seeds.push({
      ...B, id: seedId('bazi', 'health', 50, 'weak-daymaster'),
      category: 'health', subcategory: '日主极弱健康风险',
      description: '日主极弱，中老年健康需格外注意，逢忌年易生大病',
      earliestAge: 45, latestAge: 70,
      probability: 0.4, intensity: 'critical',
      causalFactors: ['日主极弱', `${unfavorable.elements.join('')}克泄过重`],
      triggerConditions: ['大运逢忌', '流年天克'], deathRelated: true,
      mergeKey: 'death-illness-mid',
      fateImpact: { health: -15 },
      sourceDetail: `日主${dayMaster.stem}极弱`,
      sourceFieldPath: 'dayMaster.strengthLevel',
      sourceEvidence: `日主${dayMaster.stem}(${dayMaster.element})，强度${dayMaster.strengthLevel}`,
      reasoning: '日主极弱表示体质薄弱，中老年逢忌运易生大病',
      confidence: 0.4, conflictTags: ['health-risk', 'death-illness'],
    });
  }

  // Element imbalance → accident
  const fireCount = elementBalance.find(e => e.element === '火')?.percentage || 0;
  const waterCount = elementBalance.find(e => e.element === '水')?.percentage || 0;
  if (fireCount >= 35) {
    seeds.push({
      ...B, id: seedId('bazi', 'accident', 40, 'fire-excess'),
      category: 'accident', subcategory: '火旺灾厄',
      description: '八字火旺，中年需防火灾、心血管疾病或急性事件',
      earliestAge: 35, latestAge: 55,
      probability: 0.3, intensity: 'major',
      causalFactors: [`火占${fireCount}%`],
      triggerConditions: ['流年逢火'], deathRelated: false,
      mergeKey: 'age-40-accident',
      fateImpact: { health: -8 },
      sourceDetail: `八字火占${fireCount}%`,
      sourceFieldPath: 'elementBalance.fire',
      sourceEvidence: `火占${fireCount}%(>=35%)`,
      reasoning: '火旺过度表示心血管或急性事件风险',
      confidence: 0.3, conflictTags: ['accident-fire'],
    });
  }
  if (waterCount >= 35) {
    seeds.push({
      ...B, id: seedId('bazi', 'accident', 42, 'water-excess'),
      category: 'accident', subcategory: '水旺灾厄',
      description: '八字水旺，中年需防水灾、肾病或出行意外',
      earliestAge: 35, latestAge: 55,
      probability: 0.25, intensity: 'moderate',
      causalFactors: [`水占${waterCount}%`],
      triggerConditions: ['流年逢水'], deathRelated: false,
      mergeKey: 'age-42-accident',
      fateImpact: { health: -6 },
      sourceDetail: `八字水占${waterCount}%`,
      sourceFieldPath: 'elementBalance.water',
      sourceEvidence: `水占${waterCount}%(>=35%)`,
      reasoning: '水旺过度表示肾病或水灾风险',
      confidence: 0.25, conflictTags: ['accident-water'],
    });
  }

  // Death signal
  seeds.push({
    ...B, id: seedId('bazi', 'death', 70, 'aging'),
    category: 'death', subcategory: '寿限推断',
    description: `八字推断${dayMaster.strengthLevel === '偏旺' || dayMaster.strengthLevel === '极旺' ? '体质较强，预期寿命偏长' : '需注意养生，预期寿命中等'}`,
    earliestAge: 65, latestAge: 85,
    probability: 0.5, intensity: 'life_defining',
    causalFactors: [`日主${dayMaster.strengthLevel}`, `喜用${favorable.elements.join('')}`],
    triggerConditions: ['大运逢死墓绝'], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -30 },
    sourceDetail: '八字寿限推算',
    sourceFieldPath: 'dayMaster.strengthLevel',
    sourceEvidence: `日主${dayMaster.stem}(${dayMaster.element})强度${dayMaster.strengthLevel}`,
    reasoning: `日主${dayMaster.strengthLevel}推算寿限`,
    confidence: 0.5, conflictTags: ['death-natural', 'longevity'],
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
  const B = baseSeed('ziwei', '3.0.0', 'birth');

  // ── 3A. Per-palace structured events ──
  for (const palace of report.palaces) {
    const cat = PALACE_CAT_MAP[palace.name] || 'turning_point';
    const fateDim = PALACE_FATE_DIM[palace.name] || 'life';
    const majorStars = palace.stars.filter(s => s.type === 'major');
    const shaStars = palace.stars.filter(s => s.type === 'sha');
    const hasJi = palace.stars.some(s => s.sihua === '忌');
    const hasLu = palace.stars.some(s => s.sihua === '禄');
    const hasQuan = palace.stars.some(s => s.sihua === '权');

    if (majorStars.length === 0) continue;

    const starNames = majorStars.map(s => s.name).join('、');
    const brightStars = majorStars.filter(s => ['庙', '旺'].includes(s.brightness));
    const dimStars = majorStars.filter(s => s.brightness === '陷');
    const baseAge = 20 + palace.index * 3;

    if (hasJi) {
      seeds.push({
        ...B, id: seedId('ziwei', cat, baseAge, `${palace.name}-ji`),
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
        sourceFieldPath: `palaces[${palace.name}].sihua=忌`,
        sourceEvidence: `${starNames}入${palace.name}宫，化忌`,
        reasoning: `化忌入${palace.name}宫表示该宫方面受阻`,
        confidence: 0.6, conflictTags: [`ziwei-${palace.name}-ji`],
      });
    }

    if (hasLu) {
      seeds.push({
        ...B, id: seedId('ziwei', cat, baseAge, `${palace.name}-lu`),
        category: cat, subcategory: `${palace.name}化禄`,
        description: `${palace.name}有${starNames}，化禄入宫，${baseAge}岁前后${palace.name}方面顺遂`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.65, intensity: 'major',
        causalFactors: [`${starNames}入${palace.name}`, '化禄'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}`,
        fateImpact: { [fateDim]: 10 },
        sourceDetail: `紫微${palace.name}化禄(${starNames})`,
        sourceFieldPath: `palaces[${palace.name}].sihua=禄`,
        sourceEvidence: `${starNames}入${palace.name}宫，化禄`,
        reasoning: `化禄入${palace.name}宫表示该宫方面顺遂`,
        confidence: 0.65, conflictTags: [`ziwei-${palace.name}-lu`],
      });
    }

    if (hasQuan) {
      seeds.push({
        ...B, id: seedId('ziwei', cat, baseAge, `${palace.name}-quan`),
        category: cat, subcategory: `${palace.name}化权`,
        description: `${palace.name}有${starNames}，化权入宫，${baseAge}岁前后掌控力增强`,
        earliestAge: baseAge - 2, latestAge: baseAge + 4,
        probability: 0.6, intensity: 'moderate',
        causalFactors: [`${starNames}入${palace.name}`, '化权'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}-quan`,
        fateImpact: { [fateDim]: 7 },
        sourceDetail: `紫微${palace.name}化权(${starNames})`,
        sourceFieldPath: `palaces[${palace.name}].sihua=权`,
        sourceEvidence: `${starNames}入${palace.name}宫，化权`,
        reasoning: `化权入${palace.name}宫表示掌控力增强`,
        confidence: 0.6, conflictTags: [`ziwei-${palace.name}-quan`],
      });
    }

    if (shaStars.length >= 2) {
      seeds.push({
        ...B, id: seedId('ziwei', cat, baseAge, `${palace.name}-sha`),
        category: cat === 'health' ? 'health' : 'accident',
        subcategory: `${palace.name}煞聚`,
        description: `${palace.name}煞星${shaStars.map(s => s.name).join('、')}聚合，${baseAge}岁前后需防突发事件`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.4, intensity: 'major',
        causalFactors: shaStars.map(s => `${s.name}(${s.brightness})`),
        triggerConditions: ['大限逢煞', '流年再叠煞'],
        deathRelated: palace.name === '疾厄' || palace.name === '命宫',
        mergeKey: `age-${baseAge}-${cat === 'health' ? 'health' : 'accident'}`,
        fateImpact: { [fateDim]: -12 },
        sourceDetail: `紫微${palace.name}煞聚`,
        sourceFieldPath: `palaces[${palace.name}].stars(sha)`,
        sourceEvidence: shaStars.map(s => `${s.name}(${s.brightness})`).join('、'),
        reasoning: `${palace.name}宫多煞聚合表示该方面有突发风险`,
        confidence: 0.4, conflictTags: [`ziwei-${palace.name}-sha`],
      });
    }

    if (brightStars.length > 0 && !hasJi) {
      seeds.push({
        ...B, id: seedId('ziwei', cat, baseAge, `${palace.name}-bright`),
        category: cat, subcategory: `${palace.name}主星明亮`,
        description: `${palace.name}主星${brightStars.map(s => `${s.name}(${s.brightness})`).join('、')}明亮，先天条件优越`,
        earliestAge: baseAge - 5, latestAge: baseAge + 8,
        probability: 0.55, intensity: 'moderate',
        causalFactors: brightStars.map(s => `${s.name}(${s.brightness})`),
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}-bright`,
        fateImpact: { [fateDim]: 6 },
        sourceDetail: `紫微${palace.name}主星明亮`,
        sourceFieldPath: `palaces[${palace.name}].stars(major,bright)`,
        sourceEvidence: brightStars.map(s => `${s.name}(${s.brightness})`).join('、'),
        reasoning: '主星庙旺表示先天条件优越',
        confidence: 0.55, conflictTags: [`ziwei-${palace.name}-bright`],
      });
    }

    if (dimStars.length > 0) {
      seeds.push({
        ...B, id: seedId('ziwei', cat, baseAge, `${palace.name}-dim`),
        category: cat, subcategory: `${palace.name}主星陷落`,
        description: `${palace.name}主星${dimStars.map(s => s.name).join('、')}陷落，需加倍努力`,
        earliestAge: baseAge - 3, latestAge: baseAge + 5,
        probability: 0.5, intensity: 'moderate',
        causalFactors: dimStars.map(s => `${s.name}陷落`),
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${baseAge}-${cat}-dim`,
        fateImpact: { [fateDim]: -6 },
        sourceDetail: `紫微${palace.name}主星陷落`,
        sourceFieldPath: `palaces[${palace.name}].stars(major,dim)`,
        sourceEvidence: dimStars.map(s => `${s.name}(陷)`).join('、'),
        reasoning: '主星陷落表示该方面需额外努力',
        confidence: 0.5, conflictTags: [`ziwei-${palace.name}-dim`],
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
      ...B, id: seedId('ziwei', 'turning_point', dx.startAge, `daxian-${dx.palaceName}`),
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
      sourceFieldPath: `daxian[startAge=${dx.startAge}]`,
      sourceEvidence: `大限${dx.palaceName}宫，主星${dxMajors || '空'}，${hasJi ? '化忌' : ''}${hasSha ? '有煞' : ''}`,
      reasoning: `大限行至${dx.palaceName}宫，${hasJi && hasSha ? '忌煞交加' : hasLu ? '化禄助运' : '平运'}`,
      confidence: 0.75, conflictTags: [`daxian-${dx.startAge}`],
    });

    if (dx.palaceName === '疾厄' && hasSha) {
      seeds.push({
        ...B, id: seedId('ziwei', 'health', dx.startAge + 5, `daxian-${dx.palaceName}-health`),
        category: 'health', subcategory: '大限逢疾厄',
        description: `大限行至疾厄宫且有煞星，${dx.startAge}-${dx.endAge}岁健康需高度关注`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.45, intensity: 'critical',
        causalFactors: [`大限疾厄宫`, ...dx.stars.filter(s => s.type === 'sha').map(s => s.name)],
        triggerConditions: ['流年再逢煞'], deathRelated: true,
        mergeKey: `death-illness-daxian-${dx.startAge}`,
        fateImpact: { health: -15 },
        sourceDetail: `紫微大限疾厄宫`,
        sourceFieldPath: `daxian[startAge=${dx.startAge}].palaceName=疾厄`,
        sourceEvidence: `大限疾厄宫，煞星${dx.stars.filter(s => s.type === 'sha').map(s => s.name).join('、')}`,
        reasoning: '大限行至疾厄宫且有煞星，为健康高危期',
        confidence: 0.45, conflictTags: ['health-risk', 'death-illness'],
      });
    }

    if (dx.palaceName === '夫妻') {
      seeds.push({
        ...B, id: seedId('ziwei', 'relationship', dx.startAge + 3, `daxian-marriage`),
        category: 'relationship', subcategory: '大限逢夫妻',
        description: `大限行至夫妻宫，${dx.startAge}-${dx.endAge}岁婚姻感情为主题`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.7, intensity: 'major',
        causalFactors: ['大限夫妻宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-relationship`,
        fateImpact: { relation: hasJi ? -8 : 10 },
        sourceDetail: `紫微大限夫妻宫`,
        sourceFieldPath: `daxian[palaceName=夫妻]`,
        sourceEvidence: `大限夫妻宫，${hasJi ? '化忌' : '无忌'}`,
        reasoning: '大限行至夫妻宫，婚姻感情为该十年主题',
        confidence: 0.7, conflictTags: ['marriage-timing'],
      });
    }

    if (dx.palaceName === '官禄') {
      seeds.push({
        ...B, id: seedId('ziwei', 'career', dx.startAge + 3, `daxian-career`),
        category: 'career', subcategory: '大限逢官禄',
        description: `大限行至官禄宫，${dx.startAge}-${dx.endAge}岁事业为主题`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.7, intensity: 'major',
        causalFactors: ['大限官禄宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-career`,
        fateImpact: { life: hasJi ? -8 : 10 },
        sourceDetail: `紫微大限官禄宫`,
        sourceFieldPath: `daxian[palaceName=官禄]`,
        sourceEvidence: `大限官禄宫，${hasJi ? '化忌' : '无忌'}`,
        reasoning: '大限行至官禄宫，事业为该十年主题',
        confidence: 0.7, conflictTags: ['career-peak'],
      });
    }

    if (dx.palaceName === '财帛') {
      seeds.push({
        ...B, id: seedId('ziwei', 'wealth', dx.startAge + 3, `daxian-wealth`),
        category: 'wealth', subcategory: '大限逢财帛',
        description: `大限行至财帛宫，${dx.startAge}-${dx.endAge}岁财运为主题`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.65, intensity: 'major',
        causalFactors: ['大限财帛宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-wealth`,
        fateImpact: { wealth: hasJi ? -8 : 10 },
        sourceDetail: `紫微大限财帛宫`,
        sourceFieldPath: `daxian[palaceName=财帛]`,
        sourceEvidence: `大限财帛宫`,
        reasoning: '大限行至财帛宫，财运为该十年主题',
        confidence: 0.65, conflictTags: ['wealth-peak'],
      });
    }

    if (dx.palaceName === '迁移') {
      seeds.push({
        ...B, id: seedId('ziwei', 'migration', dx.startAge + 3, `daxian-migration`),
        category: 'migration', subcategory: '大限逢迁移',
        description: `大限行至迁移宫，${dx.startAge}-${dx.endAge}岁有迁居或外出发展之象`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.6, intensity: 'moderate',
        causalFactors: ['大限迁移宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-migration`,
        fateImpact: { life: 3 },
        sourceDetail: `紫微大限迁移宫`,
        sourceFieldPath: `daxian[palaceName=迁移]`,
        sourceEvidence: '大限迁移宫',
        reasoning: '大限行至迁移宫，有迁居或外出之象',
        confidence: 0.6, conflictTags: ['migration'],
      });
    }

    if (dx.palaceName === '福德') {
      seeds.push({
        ...B, id: seedId('ziwei', 'spiritual', dx.startAge + 3, `daxian-fude`),
        category: 'spiritual', subcategory: '大限逢福德',
        description: `大限行至福德宫，${dx.startAge}-${dx.endAge}岁精神生活为主题`,
        earliestAge: dx.startAge, latestAge: dx.endAge,
        probability: 0.5, intensity: 'moderate',
        causalFactors: ['大限福德宫'],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dx.startAge + 3}-spiritual`,
        fateImpact: { spirit: hasJi ? -5 : 8 },
        sourceDetail: `紫微大限福德宫`,
        sourceFieldPath: `daxian[palaceName=福德]`,
        sourceEvidence: '大限福德宫',
        reasoning: '大限行至福德宫，精神层面为主题',
        confidence: 0.5, conflictTags: ['spiritual'],
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
      ...B, id: seedId('ziwei', 'turning_point', ln.age, `liunian-${ln.year}`),
      category: hasJi ? 'health' : 'career',
      subcategory: `流年${ln.year}`,
      description: `${ln.year}年(${ln.age}岁)流年${ln.palaceName}宫，${hasJi ? `${jiStars.join('')}化忌需防` : `${luStars.join('')}化禄有利`}`,
      earliestAge: ln.age, latestAge: ln.age,
      probability: hasJi ? 0.5 : 0.6, intensity: 'moderate',
      causalFactors: ln.sihua.map(s => `${s.star}化${s.transform}`),
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${ln.age}-${hasJi ? 'health' : 'career'}`,
      fateImpact: hasJi ? { health: -5 } : { life: 5 },
      sourceDetail: `紫微流年${ln.year}`,
      sourceFieldPath: `liunian[year=${ln.year}]`,
      sourceEvidence: `流年${ln.palaceName}宫，${ln.sihua.map(s => `${s.star}化${s.transform}`).join('、')}`,
      reasoning: `流年四化推断${ln.year}年运势`,
      confidence: hasJi ? 0.5 : 0.6, conflictTags: [`flow-${ln.age}`],
    });
  }

  // ── 3D. Liuyue (流月) basic ──
  for (const ln of report.liunian.slice(0, 2)) {
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const monthPalaceIdx = monthOffset % 12;
      const monthPalace = report.palaces[monthPalaceIdx];
      if (!monthPalace) continue;
      const hasMonthSha = monthPalace.stars.some(s => s.type === 'sha');
      const hasMonthJi = monthPalace.stars.some(s => s.sihua === '忌');
      if (!hasMonthSha && !hasMonthJi) continue;

      seeds.push({
        ...B, id: seedId('ziwei', 'turning_point', ln.age, `liuyue-${ln.year}-m${monthOffset + 1}`),
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
        sourceFieldPath: `liunian[${ln.year}].month[${monthOffset + 1}]`,
        sourceEvidence: `流月过${monthPalace.name}宫`,
        reasoning: `流月过${monthPalace.name}宫，${hasMonthJi ? '化忌' : '煞星'}`,
        confidence: 0.35, conflictTags: [`flow-month-${ln.age}-${monthOffset}`],
      });
    }
  }

  // ── 3E. Death/longevity from illness palace ──
  const illPalace = report.palaces.find(p => p.name === '疾厄');
  if (illPalace) {
    const shaCount = illPalace.stars.filter(s => s.type === 'sha').length;
    const hasJi = illPalace.stars.some(s => s.sihua === '忌');
    const brightHealth = illPalace.stars.filter(s => s.type === 'major' && ['庙', '旺'].includes(s.brightness));

    if (shaCount >= 2 || hasJi) {
      seeds.push({
        ...B, id: seedId('ziwei', 'death', 60, 'illness-palace'),
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
        sourceFieldPath: 'palaces[疾厄]',
        sourceEvidence: `疾厄宫：${hasJi ? '化忌' : ''}${shaCount >= 2 ? `煞星${shaCount}颗` : ''}`,
        reasoning: '疾厄宫化忌或多煞表示健康高危',
        confidence: shaCount >= 2 && hasJi ? 0.5 : 0.3,
        conflictTags: ['death-illness', 'health-risk'],
      });
    }

    if (brightHealth.length > 0 && shaCount === 0 && !hasJi) {
      seeds.push({
        ...B, id: seedId('ziwei', 'health', 75, 'longevity-good'),
        category: 'death', subcategory: '疾厄宫吉象',
        description: `疾厄宫主星${brightHealth.map(s => s.name).join('、')}明亮无煞，体质较佳`,
        earliestAge: 75, latestAge: 92,
        probability: 0.5, intensity: 'life_defining',
        causalFactors: brightHealth.map(s => `${s.name}(${s.brightness})`),
        triggerConditions: [], deathRelated: true,
        mergeKey: 'death-natural-late',
        fateImpact: { health: 10 },
        sourceDetail: '紫微疾厄宫吉象',
        sourceFieldPath: 'palaces[疾厄].stars(major,bright)',
        sourceEvidence: brightHealth.map(s => `${s.name}(${s.brightness})`).join('、'),
        reasoning: '疾厄宫主星明亮无煞表示体质佳，寿命偏长',
        confidence: 0.5, conflictTags: ['death-natural', 'longevity'],
      });
    }
  }

  // ── 3F. Migration palace ──
  const migPalace = report.palaces.find(p => p.name === '迁移');
  if (migPalace) {
    const hasTianma = migPalace.stars.some(s => s.name === '天马');
    const hasLucun = migPalace.stars.some(s => s.name === '禄存');
    if (hasTianma || hasLucun) {
      seeds.push({
        ...B, id: seedId('ziwei', 'migration', 28, 'migration-tianma'),
        category: 'migration', subcategory: '迁移宫动象',
        description: `迁移宫有${hasTianma ? '天马' : ''}${hasLucun ? '禄存' : ''}，命主有外出发展之象`,
        earliestAge: 22, latestAge: 35,
        probability: 0.55, intensity: 'moderate',
        causalFactors: [hasTianma ? '天马入迁移' : '', hasLucun ? '禄存入迁移' : ''].filter(Boolean),
        triggerConditions: [], deathRelated: false,
        mergeKey: 'age-28-migration',
        fateImpact: { life: 5 },
        sourceDetail: '紫微迁移宫分析',
        sourceFieldPath: 'palaces[迁移].stars',
        sourceEvidence: `迁移宫：${hasTianma ? '天马' : ''}${hasLucun ? '禄存' : ''}`,
        reasoning: '天马或禄存入迁移宫表示外出发展之象',
        confidence: 0.55, conflictTags: ['migration'],
      });
    }
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 4. Western Astrology Event Extraction (upgraded: 8+ event types)
// ═══════════════════════════════════════════════

export function extractWesternEvents(
  report: WesternAstrologyReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const B = baseSeed('western', '2.0.0', 'birth');

  // Saturn Return 1 (~29)
  seeds.push({
    ...B, id: seedId('western', 'turning_point', 29, 'saturn-return-1'),
    category: 'turning_point', subcategory: '土星回归',
    description: '第一次土星回归(约29岁)：人生重大转折期，事业与身份重新定义',
    earliestAge: 28, latestAge: 31,
    probability: 0.8, intensity: 'critical',
    causalFactors: ['Saturn Return', `太阳${report.sunSign}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-29-turning_point',
    fateImpact: { life: 5 },
    sourceDetail: '西方占星土星回归',
    sourceFieldPath: 'planetary_cycles.saturn_return_1',
    sourceEvidence: `太阳${report.sunSign}，土星29年公转周期`,
    reasoning: '土星29年公转周期产生第一次土星回归',
    confidence: 0.8, conflictTags: ['turning-point-29'],
  });

  // Saturn Return 2 (~58)
  seeds.push({
    ...B, id: seedId('western', 'turning_point', 58, 'saturn-return-2'),
    category: 'turning_point', subcategory: '第二次土星回归',
    description: '第二次土星回归(约58岁)：退休/遗产阶段',
    earliestAge: 57, latestAge: 60,
    probability: 0.75, intensity: 'major',
    causalFactors: ['Second Saturn Return'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-58-turning_point',
    fateImpact: { life: -3, wisdom: 5 },
    sourceDetail: '西方占星第二次土星回归',
    sourceFieldPath: 'planetary_cycles.saturn_return_2',
    sourceEvidence: '土星58年第二次回归',
    reasoning: '土星第二次回归推动人生角色转变',
    confidence: 0.75, conflictTags: ['turning-point-58'],
  });

  // Uranus Opposition (~42)
  seeds.push({
    ...B, id: seedId('western', 'turning_point', 42, 'uranus-opposition'),
    category: 'turning_point', subcategory: '天王星冲',
    description: '天王星对冲(约42岁)：中年危机期，可能有突发变化',
    earliestAge: 40, latestAge: 44,
    probability: 0.7, intensity: 'major',
    causalFactors: ['Uranus Opposition'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-42-turning_point',
    fateImpact: { spirit: 8, life: -3 },
    sourceDetail: '西方占星天王星对冲',
    sourceFieldPath: 'planetary_cycles.uranus_opposition',
    sourceEvidence: '天王星84年公转周期的中点(42岁)',
    reasoning: '天王星对冲产生中年突变期',
    confidence: 0.7, conflictTags: ['turning-point-42'],
  });

  // Jupiter Returns (~24, 36, 48)
  for (const jupAge of [24, 36, 48]) {
    seeds.push({
      ...B, id: seedId('western', 'wealth', jupAge, `jupiter-return-${jupAge}`),
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
      sourceFieldPath: `planetary_cycles.jupiter_return_${jupAge}`,
      sourceEvidence: `木星12年公转周期第${jupAge / 12}次回归`,
      reasoning: '木星回归带来扩展机遇',
      confidence: 0.6, conflictTags: [`expansion-${jupAge}`],
    });
  }

  // Sun sign → relationship tendency
  const venusSign = report.planets?.find(p => p.planet === 'Venus');
  const relAge = 25;
  seeds.push({
    ...B, id: seedId('western', 'relationship', relAge, 'venus-pattern'),
    category: 'relationship', subcategory: '金星模式',
    description: `金星${venusSign?.sign || report.sunSign}：${relAge}岁前后情感模式显现，${venusSign?.sign === report.sunSign ? '感情表达直接' : '感情需求与外在表现不同'}`,
    earliestAge: relAge - 3, latestAge: relAge + 5,
    probability: 0.55, intensity: 'moderate',
    causalFactors: [`Venus in ${venusSign?.sign || report.sunSign}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${relAge}-relationship`,
    fateImpact: { relation: 5 },
    sourceDetail: `金星${venusSign?.sign || report.sunSign}`,
    sourceFieldPath: 'planets.Venus',
    sourceEvidence: `金星位于${venusSign?.sign || report.sunSign}`,
    reasoning: '金星星座决定情感模式',
    confidence: 0.55, conflictTags: ['relationship-pattern'],
  });

  // Element health tendency
  const elementMap: Record<string, string> = {
    fire: '火象：心血管系统', earth: '土象：消化系统',
    air: '风象：神经/呼吸系统', water: '水象：泌尿/淋巴系统',
  };
  const sunElement = report.planets?.find(p => p.planet === 'Sun')?.element || 'fire';
  seeds.push({
    ...B, id: seedId('western', 'health', 55, 'element-health'),
    category: 'health', subcategory: '元素体质',
    description: `${elementMap[sunElement] || '综合体质'}，中老年需关注相关健康问题`,
    earliestAge: 50, latestAge: 70,
    probability: 0.4, intensity: 'moderate',
    causalFactors: [`太阳${report.sunSign}`, `元素${sunElement}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-55-health',
    fateImpact: { health: -3 },
    sourceDetail: '西方占星元素健康',
    sourceFieldPath: 'planets.Sun.element',
    sourceEvidence: `太阳${report.sunSign}，元素${sunElement}`,
    reasoning: '太阳元素决定体质倾向',
    confidence: 0.4, conflictTags: ['health-element'],
  });

  // Mars → career drive
  const marsSign = report.planets?.find(p => p.planet === 'Mars');
  seeds.push({
    ...B, id: seedId('western', 'career', 32, 'mars-drive'),
    category: 'career', subcategory: '火星驱动',
    description: `火星${marsSign?.sign || 'Aries'}：32岁前后事业冲劲达到高峰`,
    earliestAge: 28, latestAge: 36,
    probability: 0.55, intensity: 'moderate',
    causalFactors: [`Mars in ${marsSign?.sign || 'Aries'}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-32-career',
    fateImpact: { life: 5 },
    sourceDetail: `火星${marsSign?.sign || 'Aries'}`,
    sourceFieldPath: 'planets.Mars',
    sourceEvidence: `火星位于${marsSign?.sign || 'Aries'}`,
    reasoning: '火星星座决定事业冲劲模式',
    confidence: 0.55, conflictTags: ['career-drive'],
  });

  // Chiron Return (~50) - healing crisis
  seeds.push({
    ...B, id: seedId('western', 'spiritual', 50, 'chiron-return'),
    category: 'spiritual', subcategory: '凯龙回归',
    description: '凯龙星回归(约50岁)：内在创伤疗愈期，灵性成长关键阶段',
    earliestAge: 49, latestAge: 52,
    probability: 0.5, intensity: 'major',
    causalFactors: ['Chiron Return'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-50-spiritual',
    fateImpact: { spirit: 10, wisdom: 5 },
    sourceDetail: '西方占星凯龙回归',
    sourceFieldPath: 'planetary_cycles.chiron_return',
    sourceEvidence: '凯龙星50年公转周期回归',
    reasoning: '凯龙回归推动内在疗愈与灵性成长',
    confidence: 0.5, conflictTags: ['spiritual-50'],
  });

  // Neptune square (~42) - disillusion
  seeds.push({
    ...B, id: seedId('western', 'education', 21, 'neptune-square-1'),
    category: 'education', subcategory: '海王星四分',
    description: '海王星第一次四分相(约21岁)：理想与现实碰撞，人生方向探索',
    earliestAge: 20, latestAge: 23,
    probability: 0.5, intensity: 'moderate',
    causalFactors: ['Neptune Square'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-21-education',
    fateImpact: { wisdom: 5 },
    sourceDetail: '西方占星海王星四分',
    sourceFieldPath: 'planetary_cycles.neptune_square_1',
    sourceEvidence: '海王星164年周期的1/4(约41年)的第一次分相',
    reasoning: '海王星四分推动理想与现实碰撞',
    confidence: 0.5, conflictTags: ['education-21'],
  });

  // Death signal from Saturn/Pluto
  seeds.push({
    ...B, id: seedId('western', 'death', 78, 'saturn-pluto-death'),
    category: 'death', subcategory: '土冥死亡信号',
    description: '土星-冥王星周期推算：78岁前后为生命终点候选期',
    earliestAge: 72, latestAge: 85,
    probability: 0.3, intensity: 'life_defining',
    causalFactors: ['Saturn-Pluto cycle'],
    triggerConditions: [], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -15 },
    sourceDetail: '西方占星寿限推算',
    sourceFieldPath: 'planetary_cycles.saturn_pluto',
    sourceEvidence: '土星-冥王星周期约33年，第2-3次重叠',
    reasoning: '土冥周期重叠推算生命终点',
    confidence: 0.3, conflictTags: ['death-natural', 'longevity'],
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 5. Vedic Astrology Event Extraction (upgraded: 8+ event types)
// ═══════════════════════════════════════════════

export function extractVedicEvents(
  report: VedicReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const B = baseSeed('vedic', '2.0.0', 'birth');

  // Dasha period transitions
  for (const dasha of report.dashas) {
    if (dasha.startAge < 1 || dasha.startAge > 90) continue;

    const cat: EventCategory = dasha.quality === 'benefic' ? 'career' :
      dasha.quality === 'malefic' ? 'health' : 'turning_point';

    seeds.push({
      ...B, id: seedId('vedic', cat, dasha.startAge, `dasha-${dasha.planet}`),
      category: cat, subcategory: `${dasha.planet}大周期`,
      description: `吠陀${dasha.planet}大周期(${dasha.startAge}-${dasha.endAge}岁)：${dasha.quality === 'benefic' ? '吉利期' : dasha.quality === 'malefic' ? '考验期' : '过渡期'}`,
      earliestAge: dasha.startAge, latestAge: dasha.startAge + 2,
      probability: 0.65, intensity: dasha.years >= 10 ? 'major' : 'moderate',
      causalFactors: [`${dasha.planet} Dasha`, dasha.quality],
      triggerConditions: [], deathRelated: dasha.quality === 'malefic' && dasha.startAge >= 60,
      mergeKey: `dayun-${dasha.startAge}`,
      fateImpact: dasha.quality === 'benefic' ? { life: 8 } : dasha.quality === 'malefic' ? { life: -8 } : {},
      sourceDetail: `吠陀${dasha.planet}大周期`,
      sourceFieldPath: `dashas[planet=${dasha.planet}]`,
      sourceEvidence: `${dasha.planet} Dasha, ${dasha.startAge}-${dasha.endAge}岁, ${dasha.quality}`,
      reasoning: `${dasha.planet} Dasha ${dasha.quality}性质推断运势`,
      confidence: 0.65, conflictTags: [`dasha-${dasha.startAge}`],
    });

    // Benefic dasha → wealth event
    if (dasha.quality === 'benefic' && dasha.startAge >= 25 && dasha.startAge <= 55) {
      seeds.push({
        ...B, id: seedId('vedic', 'wealth', dasha.startAge + 3, `dasha-wealth-${dasha.planet}`),
        category: 'wealth', subcategory: `${dasha.planet}财运`,
        description: `吠陀${dasha.planet}吉利大周期带来财运机遇`,
        earliestAge: dasha.startAge, latestAge: dasha.endAge,
        probability: 0.5, intensity: 'moderate',
        causalFactors: [`${dasha.planet} Dasha benefic`],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-${dasha.startAge + 3}-wealth`,
        fateImpact: { wealth: 8 },
        sourceDetail: `吠陀${dasha.planet}吉利期财运`,
        sourceFieldPath: `dashas[${dasha.planet}].quality=benefic`,
        sourceEvidence: `${dasha.planet}吉利Dasha`,
        reasoning: '吉利Dasha期间财运上升',
        confidence: 0.5, conflictTags: ['wealth-dasha'],
      });
    }

    // Malefic dasha → accident risk
    if (dasha.quality === 'malefic' && dasha.startAge >= 30) {
      seeds.push({
        ...B, id: seedId('vedic', 'accident', dasha.startAge + 2, `dasha-risk-${dasha.planet}`),
        category: 'accident', subcategory: `${dasha.planet}凶险`,
        description: `吠陀${dasha.planet}凶险大周期，需防意外`,
        earliestAge: dasha.startAge, latestAge: dasha.endAge,
        probability: 0.3, intensity: 'major',
        causalFactors: [`${dasha.planet} Dasha malefic`],
        triggerConditions: [], deathRelated: dasha.startAge >= 60,
        mergeKey: `age-${dasha.startAge + 2}-accident`,
        fateImpact: { health: -5 },
        sourceDetail: `吠陀${dasha.planet}凶险期`,
        sourceFieldPath: `dashas[${dasha.planet}].quality=malefic`,
        sourceEvidence: `${dasha.planet}凶险Dasha`,
        reasoning: '凶险Dasha期间有意外风险',
        confidence: 0.3, conflictTags: ['accident-dasha'],
      });
    }
  }

  // Yoga-based events
  for (const yoga of report.yogas.slice(0, 3)) {
    const isWealthYoga = yoga.toLowerCase().includes('dhana') || yoga.toLowerCase().includes('lakshmi');
    const isCareerYoga = yoga.toLowerCase().includes('raja') || yoga.toLowerCase().includes('pancha');
    seeds.push({
      ...B, id: seedId('vedic', isWealthYoga ? 'wealth' : isCareerYoga ? 'career' : 'spiritual', 35, `yoga-${yoga.slice(0, 8)}`),
      category: isWealthYoga ? 'wealth' : isCareerYoga ? 'career' : 'spiritual',
      subcategory: `Yoga:${yoga}`,
      description: `吠陀Yoga「${yoga}」：命主具有${isWealthYoga ? '财富' : isCareerYoga ? '权力' : '灵性'}天赋`,
      earliestAge: 20, latestAge: 50,
      probability: 0.5, intensity: 'moderate',
      causalFactors: [yoga],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-35-${isWealthYoga ? 'wealth' : isCareerYoga ? 'career' : 'spiritual'}`,
      fateImpact: isWealthYoga ? { wealth: 8 } : isCareerYoga ? { life: 8 } : { spirit: 5, wisdom: 3 },
      sourceDetail: `吠陀${yoga}`,
      sourceFieldPath: `yogas[${yoga}]`,
      sourceEvidence: `Yoga: ${yoga}`,
      reasoning: `${yoga}表示${isWealthYoga ? '财富' : isCareerYoga ? '权力' : '灵性'}天赋`,
      confidence: 0.5, conflictTags: ['yoga-talent'],
    });
  }

  // Nakshatra → relationship
  seeds.push({
    ...B, id: seedId('vedic', 'relationship', 26, 'nakshatra-marriage'),
    category: 'relationship', subcategory: `月宿${report.moonNakshatra.nameCN}`,
    description: `月宿${report.moonNakshatra.nameCN}(${report.moonNakshatra.deity})：26岁前后情感缘分显现`,
    earliestAge: 23, latestAge: 30,
    probability: 0.5, intensity: 'moderate',
    causalFactors: [`Nakshatra ${report.moonNakshatra.nameCN}`, report.moonNakshatra.deity],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-26-relationship',
    fateImpact: { relation: 8 },
    sourceDetail: `月宿${report.moonNakshatra.nameCN}`,
    sourceFieldPath: 'moonNakshatra',
    sourceEvidence: `月宿${report.moonNakshatra.nameCN}，守护神${report.moonNakshatra.deity}`,
    reasoning: '月宿性质推断情感模式',
    confidence: 0.5, conflictTags: ['marriage-timing'],
  });

  // Migration from rashi
  seeds.push({
    ...B, id: seedId('vedic', 'migration', 30, 'rashi-migration'),
    category: 'migration', subcategory: `月亮${report.rashiSignCN}`,
    description: `月亮${report.rashiSignCN}：30岁前后有迁移或远行之象`,
    earliestAge: 25, latestAge: 35,
    probability: 0.4, intensity: 'minor',
    causalFactors: [`月亮${report.rashiSignCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-30-migration',
    fateImpact: { life: 3 },
    sourceDetail: `月亮${report.rashiSignCN}`,
    sourceFieldPath: 'rashiSignCN',
    sourceEvidence: `月亮星座${report.rashiSignCN}`,
    reasoning: '月亮星座推断迁移倾向',
    confidence: 0.4, conflictTags: ['migration'],
  });

  // Death signal from malefic dasha
  const lateMaleficDasha = report.dashas.find(d => d.quality === 'malefic' && d.startAge >= 60);
  if (lateMaleficDasha) {
    seeds.push({
      ...B, id: seedId('vedic', 'death', lateMaleficDasha.startAge + 5, 'malefic-death'),
      category: 'death', subcategory: `${lateMaleficDasha.planet}凶险寿限`,
      description: `吠陀${lateMaleficDasha.planet}凶险大周期在晚年(${lateMaleficDasha.startAge}岁起)，为寿限候选`,
      earliestAge: lateMaleficDasha.startAge, latestAge: lateMaleficDasha.endAge,
      probability: 0.35, intensity: 'critical',
      causalFactors: [`${lateMaleficDasha.planet} Dasha malefic late-life`],
      triggerConditions: [], deathRelated: true,
      mergeKey: 'death-illness-late',
      fateImpact: { health: -15 },
      sourceDetail: `吠陀晚年凶险Dasha`,
      sourceFieldPath: `dashas[${lateMaleficDasha.planet}]`,
      sourceEvidence: `${lateMaleficDasha.planet}凶险Dasha ${lateMaleficDasha.startAge}-${lateMaleficDasha.endAge}岁`,
      reasoning: '晚年凶险Dasha为寿限候选',
      confidence: 0.35, conflictTags: ['death-illness', 'longevity'],
    });
  }

  // Education from Mercury dasha
  const mercuryDasha = report.dashas.find(d => d.planet === 'Mercury' && d.startAge <= 25);
  if (mercuryDasha) {
    seeds.push({
      ...B, id: seedId('vedic', 'education', mercuryDasha.startAge + 2, 'mercury-education'),
      category: 'education', subcategory: '水星学业',
      description: `水星大周期(${mercuryDasha.startAge}-${mercuryDasha.endAge}岁)：学业与智力发展活跃期`,
      earliestAge: mercuryDasha.startAge, latestAge: Math.min(mercuryDasha.endAge, 25),
      probability: 0.55, intensity: 'moderate',
      causalFactors: ['Mercury Dasha'],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${mercuryDasha.startAge + 2}-education`,
      fateImpact: { wisdom: 8 },
      sourceDetail: '吠陀水星大周期学业',
      sourceFieldPath: `dashas[Mercury]`,
      sourceEvidence: `Mercury Dasha ${mercuryDasha.startAge}-${mercuryDasha.endAge}`,
      reasoning: '水星大周期主学业智力',
      confidence: 0.55, conflictTags: ['education-timing'],
    });
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 6. Numerology Event Extraction (upgraded: 6+ event types)
// ═══════════════════════════════════════════════

export function extractNumerologyEvents(
  report: NumerologyReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const B = baseSeed('numerology', '2.0.0', 'birth');

  const lpThemes: Record<number, { theme: string; cat: EventCategory }> = {
    1: { theme: '领导/开拓', cat: 'career' }, 2: { theme: '合作/外交', cat: 'relationship' },
    3: { theme: '创意/表达', cat: 'education' }, 4: { theme: '建设/稳定', cat: 'career' },
    5: { theme: '自由/变化', cat: 'migration' }, 6: { theme: '家庭/责任', cat: 'family' },
    7: { theme: '内省/灵性', cat: 'spiritual' }, 8: { theme: '权力/财富', cat: 'wealth' },
    9: { theme: '博爱/完成', cat: 'spiritual' },
  };
  const lp = lpThemes[report.lifePath] || { theme: '综合', cat: 'turning_point' as EventCategory };

  // Life path core event
  seeds.push({
    ...B, id: seedId('numerology', lp.cat, 33, `lp-${report.lifePath}`),
    category: lp.cat, subcategory: `生命数${report.lifePath}`,
    description: `数字命理生命数${report.lifePath}(${lp.theme})：33岁前后进入人生主题核心期`,
    earliestAge: 30, latestAge: 38,
    probability: 0.55, intensity: 'moderate',
    causalFactors: [`生命路径数${report.lifePath}`, lp.theme],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-33-${lp.cat}`,
    fateImpact: { life: 5 },
    sourceDetail: `数字命理生命数${report.lifePath}`,
    sourceFieldPath: 'lifePath',
    sourceEvidence: `生命数${report.lifePath}，含义${report.lifePathMeaning.slice(0, 30)}`,
    reasoning: `生命数${report.lifePath}推算33岁进入核心主题期`,
    confidence: 0.55, conflictTags: ['lifepath-theme'],
  });

  // Pinnacle cycles (based on life path)
  const pinnacleAges = [0, 36 - report.lifePath, 36 - report.lifePath + 9, 36 - report.lifePath + 18];
  for (let i = 1; i < pinnacleAges.length; i++) {
    const pa = Math.max(18, Math.min(70, pinnacleAges[i]));
    seeds.push({
      ...B, id: seedId('numerology', 'turning_point', pa, `pinnacle-${i}`),
      category: 'turning_point', subcategory: `巅峰期${i}`,
      description: `数字命理第${i}巅峰期(约${pa}岁)：人生阶段性转折`,
      earliestAge: pa - 2, latestAge: pa + 2,
      probability: 0.5, intensity: 'major',
      causalFactors: [`Pinnacle ${i}`, `生命数${report.lifePath}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${pa}-turning_point`,
      fateImpact: { life: 5 },
      sourceDetail: `数字命理巅峰期${i}`,
      sourceFieldPath: `pinnacles[${i}]`,
      sourceEvidence: `巅峰期${i}，基于生命数${report.lifePath}推算`,
      reasoning: `36-生命数=${36 - report.lifePath}为第一巅峰期，后续每9年`,
      confidence: 0.5, conflictTags: [`pinnacle-${pa}`],
    });
  }

  // Challenge numbers → health/difficulty events
  const challengeAge = 40;
  seeds.push({
    ...B, id: seedId('numerology', 'health', challengeAge, 'challenge'),
    category: 'health', subcategory: '挑战数',
    description: `数字命理挑战期(约${challengeAge}岁)：人生最大考验阶段`,
    earliestAge: challengeAge - 5, latestAge: challengeAge + 5,
    probability: 0.4, intensity: 'major',
    causalFactors: [`生命数${report.lifePath}挑战期`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${challengeAge}-health`,
    fateImpact: { health: -5, life: -3 },
    sourceDetail: '数字命理挑战期',
    sourceFieldPath: 'challenges',
    sourceEvidence: `生命数${report.lifePath}挑战期推算`,
    reasoning: '数字命理挑战数推算人生最大考验期',
    confidence: 0.4, conflictTags: ['challenge-period'],
  });

  // Marriage number (expression + soul)
  const marriageAge = 20 + (report.lifePath % 5) * 2;
  seeds.push({
    ...B, id: seedId('numerology', 'relationship', marriageAge, 'marriage-number'),
    category: 'relationship', subcategory: '婚姻数字',
    description: `数字命理推算${marriageAge}岁前后为情感关键期`,
    earliestAge: marriageAge - 2, latestAge: marriageAge + 4,
    probability: 0.45, intensity: 'moderate',
    causalFactors: [`生命数${report.lifePath}婚姻推算`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${marriageAge}-relationship`,
    fateImpact: { relation: 8 },
    sourceDetail: '数字命理婚姻推算',
    sourceFieldPath: 'lifePath(marriage-derived)',
    sourceEvidence: `基于生命数${report.lifePath}推算婚姻期`,
    reasoning: `20 + (生命数 % 5) * 2 = ${marriageAge}`,
    confidence: 0.45, conflictTags: ['marriage-timing'],
  });

  // Career peak from life path
  const careerPeakAge = 28 + report.lifePath * 2;
  seeds.push({
    ...B, id: seedId('numerology', 'career', Math.min(careerPeakAge, 50), 'career-peak'),
    category: 'career', subcategory: '事业峰值',
    description: `数字命理推算${Math.min(careerPeakAge, 50)}岁前后事业达到阶段性高点`,
    earliestAge: Math.min(careerPeakAge, 50) - 3, latestAge: Math.min(careerPeakAge, 50) + 3,
    probability: 0.5, intensity: 'moderate',
    causalFactors: [`生命数${report.lifePath}事业推算`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${Math.min(careerPeakAge, 50)}-career`,
    fateImpact: { life: 5 },
    sourceDetail: '数字命理事业推算',
    sourceFieldPath: 'lifePath(career-derived)',
    sourceEvidence: `28 + 生命数*2 = ${careerPeakAge}`,
    reasoning: '生命数推算事业峰值年龄',
    confidence: 0.5, conflictTags: ['career-peak'],
  });

  // Personal year cycles
  for (const py of report.personalYears) {
    if (py.age < 20 || py.age > 70) continue;
    if (py.energy < 30 || py.energy > 75) {
      seeds.push({
        ...B, id: seedId('numerology', 'turning_point', py.age, `py-${py.year}`),
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
        sourceFieldPath: `personalYears[year=${py.year}]`,
        sourceEvidence: `个人年${py.number}，能量${py.energy}`,
        reasoning: `个人年数${py.number}能量${py.energy}${py.energy > 60 ? '充沛' : '偏低'}`,
        confidence: 0.4, conflictTags: [`flow-${py.age}`],
      });
    }
  }

  // Death from life path
  const deathAge = 65 + report.lifePath * 2;
  seeds.push({
    ...B, id: seedId('numerology', 'death', deathAge, 'lifepath-death'),
    category: 'death', subcategory: '生命数寿限',
    description: `数字命理生命数${report.lifePath}推算寿限约${deathAge}岁`,
    earliestAge: deathAge - 5, latestAge: deathAge + 8,
    probability: 0.25, intensity: 'life_defining',
    causalFactors: [`生命数${report.lifePath}`],
    triggerConditions: [], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -10 },
    sourceDetail: '数字命理寿限推算',
    sourceFieldPath: 'lifePath(death-derived)',
    sourceEvidence: `65 + 生命数*2 = ${deathAge}`,
    reasoning: '生命数推算基础寿限',
    confidence: 0.25, conflictTags: ['death-natural', 'longevity'],
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 7. Mayan Calendar Event Extraction (upgraded: 6+ event types)
// ═══════════════════════════════════════════════

export function extractMayanEvents(
  report: MayanReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const B = baseSeed('mayan', '2.0.0', 'birth');

  // Galactic tone → spiritual
  const toneAge = 20 + report.galacticTone * 3;
  seeds.push({
    ...B, id: seedId('mayan', 'spiritual', toneAge, `tone-${report.galacticTone}`),
    category: 'spiritual', subcategory: `银河音${report.galacticTone}`,
    description: `玛雅银河音${report.galacticTone}：${toneAge}岁前后灵性觉醒`,
    earliestAge: toneAge - 3, latestAge: toneAge + 5,
    probability: 0.45, intensity: 'moderate',
    causalFactors: [`Kin${report.kin}`, `银河音${report.galacticTone}`, report.daySignCN],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${toneAge}-spiritual`,
    fateImpact: { spirit: 8 },
    sourceDetail: `玛雅Kin${report.kin}(${report.daySignCN})`,
    sourceFieldPath: 'galacticTone',
    sourceEvidence: `银河音${report.galacticTone}，Kin${report.kin}`,
    reasoning: `银河音${report.galacticTone}推算灵性觉醒期`,
    confidence: 0.45, conflictTags: ['spiritual-mayan'],
  });

  // 52-year calendar round
  seeds.push({
    ...B, id: seedId('mayan', 'turning_point', 52, 'calendar-round'),
    category: 'turning_point', subcategory: '玛雅历法轮回',
    description: '玛雅52年历法轮回：52岁人生重新开始',
    earliestAge: 51, latestAge: 53,
    probability: 0.5, intensity: 'major',
    causalFactors: ['Calendar Round 52年'],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-52-turning_point',
    fateImpact: { spirit: 10, life: 3 },
    sourceDetail: '玛雅52年历法轮回',
    sourceFieldPath: 'calendar_round',
    sourceEvidence: '52年Calendar Round',
    reasoning: '52年历法轮回推动人生新循环',
    confidence: 0.5, conflictTags: ['turning-point-52'],
  });

  // Wavespell (13-day cycle) → career rhythm
  const wsAge = 26 + (report.kin % 13);
  seeds.push({
    ...B, id: seedId('mayan', 'career', wsAge, 'wavespell-career'),
    category: 'career', subcategory: `波符${report.daySignCN}`,
    description: `玛雅波符${report.daySignCN}：${wsAge}岁前后事业方向确立`,
    earliestAge: wsAge - 2, latestAge: wsAge + 3,
    probability: 0.4, intensity: 'moderate',
    causalFactors: [`波符${report.daySignCN}`, `Kin${report.kin}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${wsAge}-career`,
    fateImpact: { life: 5 },
    sourceDetail: `玛雅波符${report.daySignCN}`,
    sourceFieldPath: 'daySign(wavespell)',
    sourceEvidence: `日符${report.daySignCN}，Kin${report.kin}`,
    reasoning: `Kin${report.kin}的波符推算事业方向期`,
    confidence: 0.4, conflictTags: ['career-mayan'],
  });

  // Kin → relationship
  const kinRelAge = 22 + (report.kin % 8);
  seeds.push({
    ...B, id: seedId('mayan', 'relationship', kinRelAge, 'kin-relationship'),
    category: 'relationship', subcategory: `Kin${report.kin}情感`,
    description: `玛雅Kin${report.kin}(${report.daySignCN})：${kinRelAge}岁前后情感缘分期`,
    earliestAge: kinRelAge - 2, latestAge: kinRelAge + 4,
    probability: 0.4, intensity: 'moderate',
    causalFactors: [`Kin${report.kin}`, report.daySignCN],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${kinRelAge}-relationship`,
    fateImpact: { relation: 5 },
    sourceDetail: `玛雅Kin${report.kin}情感推算`,
    sourceFieldPath: 'kin(relationship-derived)',
    sourceEvidence: `Kin${report.kin}，日符${report.daySignCN}`,
    reasoning: `22 + Kin%8 = ${kinRelAge}`,
    confidence: 0.4, conflictTags: ['relationship-mayan'],
  });

  // Health from galactic tone
  const healthAge = 45 + report.galacticTone * 2;
  seeds.push({
    ...B, id: seedId('mayan', 'health', healthAge, 'tone-health'),
    category: 'health', subcategory: `银河音${report.galacticTone}健康`,
    description: `玛雅银河音${report.galacticTone}推算${healthAge}岁前后需关注健康`,
    earliestAge: healthAge - 3, latestAge: healthAge + 5,
    probability: 0.35, intensity: 'moderate',
    causalFactors: [`银河音${report.galacticTone}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${healthAge}-health`,
    fateImpact: { health: -3 },
    sourceDetail: `玛雅银河音健康推算`,
    sourceFieldPath: 'galacticTone(health-derived)',
    sourceEvidence: `银河音${report.galacticTone}`,
    reasoning: `45 + 银河音*2 = ${healthAge}`,
    confidence: 0.35, conflictTags: ['health-mayan'],
  });

  // Wealth from kin
  const wealthAge = 30 + (report.kin % 10);
  seeds.push({
    ...B, id: seedId('mayan', 'wealth', wealthAge, 'kin-wealth'),
    category: 'wealth', subcategory: `Kin${report.kin}财运`,
    description: `玛雅Kin${report.kin}推算${wealthAge}岁前后财运变化`,
    earliestAge: wealthAge - 2, latestAge: wealthAge + 3,
    probability: 0.35, intensity: 'minor',
    causalFactors: [`Kin${report.kin}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${wealthAge}-wealth`,
    fateImpact: { wealth: 5 },
    sourceDetail: `玛雅Kin${report.kin}财运推算`,
    sourceFieldPath: 'kin(wealth-derived)',
    sourceEvidence: `Kin${report.kin}`,
    reasoning: `30 + Kin%10 = ${wealthAge}`,
    confidence: 0.35, conflictTags: ['wealth-mayan'],
  });

  // Death from calendar round
  const mayanDeathAge = 52 + report.galacticTone * 2 + (report.kin % 5);
  seeds.push({
    ...B, id: seedId('mayan', 'death', mayanDeathAge, 'mayan-death'),
    category: 'death', subcategory: '玛雅寿限',
    description: `玛雅历法推算寿限约${mayanDeathAge}岁(基于Kin${report.kin}与银河音${report.galacticTone})`,
    earliestAge: mayanDeathAge - 5, latestAge: mayanDeathAge + 8,
    probability: 0.2, intensity: 'life_defining',
    causalFactors: [`Kin${report.kin}`, `银河音${report.galacticTone}`],
    triggerConditions: [], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -8 },
    sourceDetail: '玛雅寿限推算',
    sourceFieldPath: 'kin+galacticTone(death-derived)',
    sourceEvidence: `52 + 银河音*2 + Kin%5 = ${mayanDeathAge}`,
    reasoning: '玛雅历法轮回推算寿限',
    confidence: 0.2, conflictTags: ['death-natural', 'longevity'],
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 8. Kabbalah Event Extraction (upgraded: 6+ event types)
// ═══════════════════════════════════════════════

export function extractKabbalahEvents(
  report: KabbalahReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const B = baseSeed('kabbalah', '2.0.0', 'birth');

  // Soul Sephirah → spiritual
  seeds.push({
    ...B, id: seedId('kabbalah', 'spiritual', 40, `soul-${report.soulSephirah.nameCN}`),
    category: 'spiritual', subcategory: `灵魂质点${report.soulSephirah.nameCN}`,
    description: `卡巴拉灵魂质点「${report.soulSephirah.nameCN}」：40岁前后灵性突破`,
    earliestAge: 35, latestAge: 48,
    probability: 0.45, intensity: 'moderate',
    causalFactors: [`灵魂质点${report.soulSephirah.nameCN}`, `人格质点${report.personalitySephirah.nameCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-40-spiritual',
    fateImpact: { spirit: 10 },
    sourceDetail: `卡巴拉灵魂质点${report.soulSephirah.nameCN}`,
    sourceFieldPath: 'soulSephirah',
    sourceEvidence: `灵魂质点${report.soulSephirah.nameCN}(${report.soulSephirah.name})`,
    reasoning: '灵魂质点推算灵性突破期',
    confidence: 0.45, conflictTags: ['spiritual-kabbalah'],
  });

  // Personality Sephirah → career
  seeds.push({
    ...B, id: seedId('kabbalah', 'career', 30, `personality-${report.personalitySephirah.nameCN}`),
    category: 'career', subcategory: `人格质点${report.personalitySephirah.nameCN}`,
    description: `卡巴拉人格质点「${report.personalitySephirah.nameCN}」：30岁前后人格力量在事业中显现`,
    earliestAge: 27, latestAge: 35,
    probability: 0.4, intensity: 'moderate',
    causalFactors: [`人格质点${report.personalitySephirah.nameCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: 'age-30-career',
    fateImpact: { life: 5 },
    sourceDetail: `卡巴拉人格质点${report.personalitySephirah.nameCN}`,
    sourceFieldPath: 'personalitySephirah',
    sourceEvidence: `人格质点${report.personalitySephirah.nameCN}`,
    reasoning: '人格质点推算事业显现期',
    confidence: 0.4, conflictTags: ['career-kabbalah'],
  });

  // Tree of Life journey milestones (10 Sephiroth × life stages)
  const sephirothAges = [10, 18, 25, 32, 40, 48, 55, 62, 70, 78]; // Malkuth → Kether
  const sephirothNames = ['王国', '基础', '荣耀', '胜利', '美', '严厉', '仁慈', '理解', '智慧', '王冠'];
  const milestoneIdx = Math.min(report.soulSephirah.index - 1, 9);
  const msAge = sephirothAges[milestoneIdx] || 40;
  seeds.push({
    ...B, id: seedId('kabbalah', 'turning_point', msAge, `tol-milestone-${milestoneIdx}`),
    category: 'turning_point', subcategory: `生命树${sephirothNames[milestoneIdx]}`,
    description: `卡巴拉生命树第${milestoneIdx + 1}阶「${sephirothNames[milestoneIdx]}」：${msAge}岁前后人生阶段性转折`,
    earliestAge: msAge - 3, latestAge: msAge + 5,
    probability: 0.4, intensity: 'major',
    causalFactors: [`生命树第${milestoneIdx + 1}阶`, report.soulSephirah.nameCN],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${msAge}-turning_point`,
    fateImpact: { life: 5, spirit: 3 },
    sourceDetail: `卡巴拉生命树阶段${milestoneIdx + 1}`,
    sourceFieldPath: `soulSephirah.index=${report.soulSephirah.index}`,
    sourceEvidence: `灵魂质点${report.soulSephirah.index}映射生命树第${milestoneIdx + 1}阶`,
    reasoning: '灵魂质点号映射到生命树阶段',
    confidence: 0.4, conflictTags: [`turning-point-${msAge}`],
  });

  // Relationship from personality/soul combination
  const relAge = 24 + (report.soulSephirah.index + report.personalitySephirah.index) % 8;
  seeds.push({
    ...B, id: seedId('kabbalah', 'relationship', relAge, 'sephirah-relationship'),
    category: 'relationship', subcategory: '质点情感',
    description: `卡巴拉灵魂+人格质点组合推算${relAge}岁前后情感缘分期`,
    earliestAge: relAge - 3, latestAge: relAge + 4,
    probability: 0.4, intensity: 'moderate',
    causalFactors: [`灵魂${report.soulSephirah.nameCN}`, `人格${report.personalitySephirah.nameCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${relAge}-relationship`,
    fateImpact: { relation: 5 },
    sourceDetail: '卡巴拉质点情感推算',
    sourceFieldPath: 'soulSephirah+personalitySephirah',
    sourceEvidence: `灵魂${report.soulSephirah.index}+人格${report.personalitySephirah.index}`,
    reasoning: `24 + (灵魂+人格)%8 = ${relAge}`,
    confidence: 0.4, conflictTags: ['relationship-kabbalah'],
  });

  // Wealth from sephirah
  const wealthAge = 35 + report.personalitySephirah.index;
  seeds.push({
    ...B, id: seedId('kabbalah', 'wealth', wealthAge, 'sephirah-wealth'),
    category: 'wealth', subcategory: '质点财运',
    description: `卡巴拉人格质点推算${wealthAge}岁前后财运变化`,
    earliestAge: wealthAge - 3, latestAge: wealthAge + 4,
    probability: 0.35, intensity: 'minor',
    causalFactors: [`人格质点${report.personalitySephirah.nameCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${wealthAge}-wealth`,
    fateImpact: { wealth: 5 },
    sourceDetail: '卡巴拉质点财运推算',
    sourceFieldPath: 'personalitySephirah(wealth-derived)',
    sourceEvidence: `人格质点${report.personalitySephirah.index}`,
    reasoning: `35 + 人格质点号 = ${wealthAge}`,
    confidence: 0.35, conflictTags: ['wealth-kabbalah'],
  });

  // Health from combined sephiroth
  const healthAge = 50 + report.soulSephirah.index;
  seeds.push({
    ...B, id: seedId('kabbalah', 'health', healthAge, 'sephirah-health'),
    category: 'health', subcategory: '质点健康',
    description: `卡巴拉推算${healthAge}岁前后需关注健康`,
    earliestAge: healthAge - 3, latestAge: healthAge + 5,
    probability: 0.3, intensity: 'moderate',
    causalFactors: [`灵魂质点${report.soulSephirah.nameCN}`],
    triggerConditions: [], deathRelated: false,
    mergeKey: `age-${healthAge}-health`,
    fateImpact: { health: -5 },
    sourceDetail: '卡巴拉质点健康推算',
    sourceFieldPath: 'soulSephirah(health-derived)',
    sourceEvidence: `灵魂质点${report.soulSephirah.number}`,
    reasoning: `50 + 灵魂质点号 = ${healthAge}`,
    confidence: 0.3, conflictTags: ['health-kabbalah'],
  });

  // Death from tree of life
  const kDeathAge = 70 + report.soulSephirah.number + report.personalitySephirah.number % 5;
  seeds.push({
    ...B, id: seedId('kabbalah', 'death', kDeathAge, 'kabbalah-death'),
    category: 'death', subcategory: '生命树寿限',
    description: `卡巴拉生命树推算寿限约${kDeathAge}岁`,
    earliestAge: kDeathAge - 5, latestAge: kDeathAge + 8,
    probability: 0.2, intensity: 'life_defining',
    causalFactors: [`灵魂${report.soulSephirah.nameCN}`, `人格${report.personalitySephirah.nameCN}`],
    triggerConditions: [], deathRelated: true,
    mergeKey: 'death-natural-late',
    fateImpact: { health: -8 },
    sourceDetail: '卡巴拉生命树寿限推算',
    sourceFieldPath: 'soulSephirah+personalitySephirah(death)',
    sourceEvidence: `70 + 灵魂${report.soulSephirah.number} + 人格%5 = ${kDeathAge}`,
    reasoning: '生命树推算寿限',
    confidence: 0.2, conflictTags: ['death-natural', 'longevity'],
  });

  return seeds;
}

// ═══════════════════════════════════════════════
// 9. Instant Engine Event Extraction
// (LiuYao, Meihua, Qimen, LiuRen, Taiyi)
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
  const B = baseSeed(eo.engineName, eo.engineVersion, 'query');

  const auspiciousness = no['吉凶'] || no['auspiciousness'] || '';
  const isAuspicious = auspiciousness === '大吉' || auspiciousness === '吉';
  const isInauspicious = auspiciousness === '大凶' || auspiciousness === '凶';

  let cat: EventCategory;
  let desc: string;
  let intensity: EventIntensity = 'moderate';
  let fieldPath: string;
  let evidence: string;

  if (eo.engineName === 'liuyao') {
    const guaName = no['卦名'] || '';
    const changingLines = parseInt(no['动爻'] || '0');
    cat = isInauspicious ? 'accident' : isAuspicious ? 'career' : 'turning_point';
    desc = `六爻于${queryTimeUtc.slice(0, 10)}起卦得「${guaName}」(动爻${changingLines})：${isAuspicious ? '卦象吉利' : isInauspicious ? '卦象不利' : '卦象中平'}`;
    intensity = changingLines >= 3 ? 'major' : 'moderate';
    fieldPath = 'liuyao.mainHexagram';
    evidence = `卦名${guaName}，动爻${changingLines}，吉凶${auspiciousness}`;
  } else if (eo.engineName === 'meihua') {
    const benGua = no['本卦'] || no['benGua'] || '';
    const bianGua = no['变卦'] || no['bianGua'] || '';
    const tiYong = no['体用'] || no['tiYong'] || '';
    cat = isInauspicious ? 'accident' : 'turning_point';
    desc = `梅花易数于${queryTimeUtc.slice(0, 10)}起卦：本卦${benGua}→变卦${bianGua}(${tiYong})`;
    fieldPath = 'meihua.benGua+bianGua';
    evidence = `本卦${benGua}，变卦${bianGua}，体用${tiYong}，吉凶${auspiciousness}`;
  } else if (eo.engineName === 'qimen') {
    const dunType = no['遁局'] || '';
    const zhiFu = no['值符'] || '';
    const zhiShi = no['值使'] || '';
    cat = isInauspicious ? 'accident' : 'career';
    desc = `奇门遁甲于${queryTimeUtc.slice(0, 10)}起局：${dunType}，值符${zhiFu}值使${zhiShi}`;
    fieldPath = 'qimen.chart';
    evidence = `遁局${dunType}，值符${zhiFu}，值使${zhiShi}，吉凶${auspiciousness}`;
  } else if (eo.engineName === 'liuren') {
    const keType = no['课体'] || '';
    const sanChuan = no['三传'] || '';
    cat = isInauspicious ? 'health' : 'turning_point';
    desc = `大六壬于${queryTimeUtc.slice(0, 10)}起课：${keType}课，三传${sanChuan}`;
    fieldPath = 'liuren.keType+sanChuan';
    evidence = `课体${keType}，三传${sanChuan}，吉凶${auspiciousness}`;
  } else if (eo.engineName === 'taiyi') {
    const juNumber = no['局式'] || '';
    const geju = no['格局'] || '';
    cat = isInauspicious ? 'health' : 'career';
    desc = `太乙神数于${queryTimeUtc.slice(0, 10)}起局：${juNumber}，格局${geju}`;
    fieldPath = 'taiyi.chart';
    evidence = `局式${juNumber}，格局${geju}，吉凶${auspiciousness}`;
  } else {
    cat = 'turning_point';
    desc = `${eo.engineNameCN}即时判断：${isAuspicious ? '吉' : isInauspicious ? '凶' : '中平'}`;
    fieldPath = `${eo.engineName}.normalizedOutput`;
    evidence = `吉凶${auspiciousness}`;
  }

  seeds.push({
    ...B, id: seedId(eo.engineName, cat, currentAge > 0 ? currentAge : 30, 'instant-trigger'),
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
    sourceFieldPath: fieldPath,
    sourceEvidence: evidence,
    reasoning: `${eo.engineNameCN}于${queryTimeUtc}起局判断吉凶`,
    confidence: isAuspicious ? 0.6 : isInauspicious ? 0.5 : 0.4,
    conflictTags: [`instant-${eo.engineName}`],
  });

  if (isInauspicious && currentAge > 0) {
    seeds.push({
      ...B, id: seedId(eo.engineName, 'health', currentAge + 1, 'instant-warning'),
      category: 'health', subcategory: `${eo.engineNameCN}凶兆`,
      description: `${eo.engineNameCN}判断近期运势不利，${currentAge + 1}岁需注意健康与安全`,
      earliestAge: currentAge, latestAge: currentAge + 2,
      probability: 0.35, intensity: 'moderate',
      causalFactors: [`${eo.engineNameCN}凶象`],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${currentAge + 1}-health`,
      fateImpact: { health: -5 },
      sourceDetail: `${eo.engineNameCN}凶兆`,
      sourceFieldPath: `${fieldPath}(warning)`,
      sourceEvidence: `${eo.engineNameCN}凶象`,
      reasoning: '即时引擎凶象推断近期健康风险',
      confidence: 0.35, conflictTags: ['health-instant'],
    });
  }

  return seeds;
}
