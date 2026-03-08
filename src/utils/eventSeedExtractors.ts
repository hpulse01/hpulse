/**
 * H-Pulse Engine Event Seed Extractors
 *
 * Converts raw engine outputs into DestinyEventSeed[] for world tree generation.
 * Each engine extracts destiny-relevant events from its domain-specific calculations.
 */

import type { DestinyEventSeed, EventCategory, EventIntensity } from '@/types/destinyTree';
import type { EngineOutput, FateDimension, StandardizedInput } from '@/types/prediction';
import type { FullDestinyReport, BaZiProfile } from './tiebanAlgorithm';
import type { DeepBaZiAnalysis } from './baziDeepAnalysis';
import type { ZiweiReport } from './ziweiAlgorithm';
import type { LiuYaoResult } from './liuYaoAlgorithm';

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
// 1. Tieban Event Extraction
// ═══════════════════════════════════════════════

export function extractTiebanEvents(
  fullReport: FullDestinyReport,
  baziProfile: BaZiProfile,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const proj = fullReport.destinyProjection;

  // Life milestone events from destiny projection
  const projMap: Array<{ key: string; cat: EventCategory; sub: string; val: number }> = [
    { key: 'lifeDestiny', cat: 'turning_point', sub: '命运总局', val: proj.lifeDestiny },
    { key: 'marriage', cat: 'relationship', sub: '婚姻大运', val: proj.marriage },
    { key: 'wealth', cat: 'wealth', sub: '财运格局', val: proj.wealth },
    { key: 'career', cat: 'career', sub: '事业运势', val: proj.career },
    { key: 'health', cat: 'health', sub: '健康状况', val: proj.health },
    { key: 'children', cat: 'family', sub: '子女缘分', val: proj.children },
  ];

  // Extract life-phase events from flow years
  for (const fy of fullReport.flowYears) {
    const ganChar = fy.ganZhi.charAt(0);
    const fav = baziProfile.favorableElements;
    const unfav = baziProfile.unfavorableElements;
    const stemEl = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' }[ganChar] || '土';
    const isFavorable = fav.includes(stemEl);
    const isUnfavorable = unfav.includes(stemEl);

    // Only generate events at significant years (every 5-10 years or transition years)
    const isSignificant = fy.age % 10 === 0 || fy.age === 18 || fy.age === 30 || fy.age === 40 || fy.age === 50 || fy.age === 60;
    if (!isSignificant && fy.age > 5) continue;

    const probability = isFavorable ? 0.7 : isUnfavorable ? 0.4 : 0.55;
    const cat: EventCategory = isFavorable ? 'turning_point' : isUnfavorable ? 'health' : 'career';

    seeds.push({
      id: seedId('tieban', 'flow', fy.age, fy.ganZhi),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: cat, subcategory: `流年${fy.ganZhi}`,
      description: `铁板流年${fy.ganZhi}（${fy.age}岁）：条文${fy.clauseNumber}号，${isFavorable ? '顺遂之年' : isUnfavorable ? '需谨慎之年' : '平稳之年'}`,
      earliestAge: fy.age, latestAge: fy.age, earliestYear: fy.year, latestYear: fy.year,
      probability, intensity: intensityFromScore(probability * 100),
      causalFactors: [`条文${fy.clauseNumber}`, `年干${ganChar}(${stemEl})`, isFavorable ? '喜用年' : isUnfavorable ? '忌年' : '平年'],
      triggerConditions: [], deathRelated: false,
      mergeKey: `age-${fy.age}-${cat}`,
      fateImpact: { life: isFavorable ? 10 : isUnfavorable ? -10 : 0 },
      sourceDetail: `铁板条文${fy.clauseNumber}`,
    });
  }

  // Da Yun transition events
  for (const dy of fullReport.lifeCycles) {
    seeds.push({
      id: seedId('tieban', 'dayun', dy.startAge, dy.ganZhi),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: 'turning_point', subcategory: `大运${dy.ganZhi}`,
      description: `${dy.startAge}-${dy.endAge}岁大运${dy.ganZhi}(${dy.element})：十年运势转换期`,
      earliestAge: dy.startAge, latestAge: dy.startAge + 2,
      probability: 0.85, intensity: 'major',
      causalFactors: [`大运${dy.ganZhi}`, `五行${dy.element}`],
      triggerConditions: [], deathRelated: false,
      mergeKey: `dayun-${dy.startAge}`,
      fateImpact: { life: 5 },
      sourceDetail: `铁板大运${dy.ganZhi}`,
    });
  }

  // Health/death signals from projection
  if (proj.health < 4000) {
    seeds.push({
      id: seedId('tieban', 'death', 65, 'health-risk'),
      engineName: 'tieban', engineVersion: '2.0.0', timingBasis: 'birth',
      category: 'death', subcategory: '健康风险',
      description: '铁板推算健康宫位偏弱，晚年需注意重大疾病',
      earliestAge: 55, latestAge: 75,
      probability: 0.3, intensity: 'critical',
      causalFactors: ['疾厄宫数值偏低', `健康值${proj.health}`],
      triggerConditions: ['大运逢忌', '流年冲克'],
      deathRelated: true, mergeKey: 'death-illness-late',
      fateImpact: { health: -20 },
      sourceDetail: `铁板健康值${proj.health}`,
    });
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 2. BaZi Event Extraction
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

  // Universal late-life health event
  seeds.push({
    id: seedId('bazi', 'health', 70, 'aging'),
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
// 3. Ziwei Doushu Event Extraction
// ═══════════════════════════════════════════════

export function extractZiweiEvents(
  report: ZiweiReport,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];

  // Palace-based events
  const palaceCatMap: Record<string, EventCategory> = {
    '命宫': 'turning_point', '夫妻': 'relationship', '财帛': 'wealth',
    '官禄': 'career', '疾厄': 'health', '迁移': 'migration',
    '子女': 'family', '福德': 'spiritual', '田宅': 'wealth',
    '兄弟': 'family', '仆役': 'career', '父母': 'family',
  };

  for (const palace of report.palaces) {
    const cat = palaceCatMap[palace.name] || 'turning_point';
    const majorStars = palace.stars.filter(s => s.type === 'major');
    const shaStars = palace.stars.filter(s => s.type === 'sha');
    const hasJi = palace.stars.some(s => s.sihua === '忌');
    const hasLu = palace.stars.some(s => s.sihua === '禄');

    // Major star configurations generate events
    if (majorStars.length > 0) {
      const starNames = majorStars.map(s => s.name).join('、');
      const avgBrightness = majorStars.reduce((s, st) => {
        const bMap: Record<string, number> = { '庙': 90, '旺': 80, '得': 65, '利': 55, '平': 45, '闲': 30, '陷': 15 };
        return s + (bMap[st.brightness] || 45);
      }, 0) / majorStars.length;

      // Map to life phase based on palace position
      const baseAge = 20 + palace.index * 3;

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
          fateImpact: { [cat === 'career' ? 'life' : cat === 'wealth' ? 'wealth' : cat === 'relationship' ? 'relation' : cat === 'health' ? 'health' : 'spirit' as FateDimension]: -10 },
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
          fateImpact: { [cat === 'career' ? 'life' : cat === 'wealth' ? 'wealth' : 'relation' as FateDimension]: 10 },
          sourceDetail: `紫微${palace.name}化禄(${starNames})`,
        });
      }
    }
  }

  // Da Xian (大限) transition events
  for (const dx of report.daxian) {
    const dxPalace = report.palaces.find(p => p.name === dx.palaceName);
    const dxMajors = dx.stars.filter(s => s.type === 'major').map(s => s.name).join('、');
    const hasSha = dx.stars.some(s => s.type === 'sha');

    seeds.push({
      id: seedId('ziwei', 'turning_point', dx.startAge, `daxian-${dx.palaceName}`),
      engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
      category: 'turning_point', subcategory: `大限${dx.palaceName}`,
      description: `${dx.startAge}-${dx.endAge}岁大限行至${dx.palaceName}宫(${dxMajors || '无主星'})，${hasSha ? '煞星同宫需注意' : '运势平稳'}`,
      earliestAge: dx.startAge, latestAge: dx.startAge + 2,
      probability: 0.8, intensity: 'major',
      causalFactors: [`大限${dx.palaceName}`, dxMajors ? `主星${dxMajors}` : '空宫'],
      triggerConditions: hasSha ? ['煞星同宫'] : [],
      deathRelated: dx.palaceName === '疾厄' && hasSha,
      mergeKey: `dayun-${dx.startAge}`,
      fateImpact: { life: hasSha ? -5 : 5 },
      sourceDetail: `紫微大限${dx.palaceName}`,
    });
  }

  // Liu Nian events
  for (const ln of report.liunian) {
    const hasJi = ln.sihua.some(s => s.transform === '忌');
    const hasLu = ln.sihua.some(s => s.transform === '禄');
    if (!hasJi && !hasLu) continue;

    seeds.push({
      id: seedId('ziwei', 'turning_point', ln.age, `liunian-${ln.year}`),
      engineName: 'ziwei', engineVersion: '2.1.0', timingBasis: 'birth',
      category: hasJi ? 'health' : 'career',
      subcategory: `流年${ln.year}`,
      description: `${ln.year}年(${ln.age}岁)流年${ln.palaceName}宫，${hasJi ? '化忌需防' : '化禄有利'}`,
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

  // Illness palace death signal
  const illPalace = report.palaces.find(p => p.name === '疾厄');
  if (illPalace) {
    const shaCount = illPalace.stars.filter(s => s.type === 'sha').length;
    const hasJi = illPalace.stars.some(s => s.sihua === '忌');
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
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 4. Generic FateVector-based Event Extraction
// (for Western, Vedic, Numerology, Mayan, Kabbalah)
// ═══════════════════════════════════════════════

export function extractGenericEvents(
  eo: EngineOutput,
  birthYear: number,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const fv = eo.fateVector;

  // Extract events from dimensions that are notably high or low
  const dimCatMap: Record<FateDimension, EventCategory> = {
    life: 'turning_point', wealth: 'wealth', relation: 'relationship',
    health: 'health', wisdom: 'education', spirit: 'spiritual',
  };

  for (const [dim, val] of Object.entries(fv) as [FateDimension, number][]) {
    if (val >= 70) {
      // Strong dimension → positive life event
      seeds.push({
        id: seedId(eo.engineName, dimCatMap[dim], 35, `${dim}-high`),
        engineName: eo.engineName, engineVersion: eo.engineVersion, timingBasis: eo.timingBasis,
        category: dimCatMap[dim], subcategory: `${eo.engineNameCN}${dim}强`,
        description: `${eo.engineNameCN}推算${dim}维度偏强(${val})，中年有利事件`,
        earliestAge: 28, latestAge: 50,
        probability: val / 100 * 0.7, intensity: 'moderate',
        causalFactors: [`${eo.engineNameCN}${dim}=${val}`],
        triggerConditions: [], deathRelated: false,
        mergeKey: `age-35-${dimCatMap[dim]}`,
        fateImpact: { [dim]: Math.round((val - 50) * 0.3) },
        sourceDetail: `${eo.engineNameCN}`,
      });
    }
    if (val <= 30) {
      // Weak dimension → risk event
      seeds.push({
        id: seedId(eo.engineName, dimCatMap[dim], 45, `${dim}-low`),
        engineName: eo.engineName, engineVersion: eo.engineVersion, timingBasis: eo.timingBasis,
        category: dim === 'health' ? 'health' : dimCatMap[dim],
        subcategory: `${eo.engineNameCN}${dim}弱`,
        description: `${eo.engineNameCN}推算${dim}维度偏弱(${val})，中年需注意`,
        earliestAge: 35, latestAge: 60,
        probability: (100 - val) / 100 * 0.5, intensity: dim === 'health' ? 'critical' : 'moderate',
        causalFactors: [`${eo.engineNameCN}${dim}=${val}`],
        triggerConditions: [], deathRelated: dim === 'health' && val <= 20,
        mergeKey: dim === 'health' && val <= 20 ? 'death-illness-mid' : `age-45-${dimCatMap[dim]}`,
        fateImpact: { [dim]: Math.round((val - 50) * 0.3) },
        sourceDetail: `${eo.engineNameCN}`,
      });
    }
  }

  return seeds;
}

// ═══════════════════════════════════════════════
// 5. Instant Engine Event Extraction
// (LiuYao, Meihua, Qimen, LiuRen, Taiyi)
// These produce "trigger" events that create acute branches
// ═══════════════════════════════════════════════

export function extractInstantEvents(
  eo: EngineOutput,
  queryTimeUtc: string,
): DestinyEventSeed[] {
  const seeds: DestinyEventSeed[] = [];
  const no = eo.normalizedOutput;
  const queryDate = new Date(queryTimeUtc);
  const queryYear = queryDate.getFullYear();

  // Check auspiciousness if available
  const auspiciousness = no['吉凶'] || no['auspiciousness'] || '';
  const isAuspicious = auspiciousness === '大吉' || auspiciousness === '吉';
  const isInauspicious = auspiciousness === '大凶' || auspiciousness === '凶';

  // Instant engine → short-term trigger event (within 1-3 years of query)
  seeds.push({
    id: seedId(eo.engineName, 'turning_point', 0, 'instant-trigger'),
    engineName: eo.engineName, engineVersion: eo.engineVersion, timingBasis: 'query',
    category: isInauspicious ? 'accident' : isAuspicious ? 'career' : 'turning_point',
    subcategory: `${eo.engineNameCN}即时`,
    description: `${eo.engineNameCN}于${queryTimeUtc.slice(0, 10)}起局：${isAuspicious ? '吉象明显' : isInauspicious ? '需防不利' : '中平之象'}`,
    earliestAge: 0, latestAge: 0, // will be resolved relative to query time
    earliestYear: queryYear, latestYear: queryYear + 2,
    probability: isAuspicious ? 0.65 : isInauspicious ? 0.55 : 0.45,
    intensity: isInauspicious ? 'major' : 'moderate',
    causalFactors: Object.entries(no).slice(0, 3).map(([k, v]) => `${k}:${v}`),
    triggerConditions: [`起局时间${queryTimeUtc}`],
    deathRelated: false,
    mergeKey: `instant-${queryYear}`,
    fateImpact: isAuspicious ? { life: 5, wealth: 5 } : isInauspicious ? { life: -5, health: -3 } : {},
    sourceDetail: `${eo.engineNameCN}即时判断`,
  });

  return seeds;
}
