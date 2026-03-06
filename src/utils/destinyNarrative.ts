/**
 * Destiny Narrative Engine (命运叙事引擎)
 *
 * Transforms raw collapsed events into:
 * 1. Multi-event per year (up to 3 concurrent aspects)
 * 2. Causal chains — events reference and build upon earlier events
 * 3. Cross-system synergy markers — high-certainty destiny nodes
 * 4. Phase narratives — prose summaries for each life period
 * 5. Full life narrative — birth-to-death flowing story
 */

import type {
  CollapsedEvent, DestinyPhase, QuantumState, LifeAspect, SystemAnalysis, DestinyEventType,
} from './quantumPredictionEngine';
import type { BaZiProfile } from './tiebanAlgorithm';
import type { ZiweiReport } from './ziweiAlgorithm';
import type { LiuYaoResult } from './liuYaoAlgorithm';
import type { WesternAstrologyReport } from './worldSystems/westernAstrology';
import type { VedicReport } from './worldSystems/vedicAstrology';
import type { NumerologyReport } from './worldSystems/numerology';
import type { MayanReport } from './worldSystems/mayanCalendar';
import type { KabbalahReport } from './worldSystems/kabbalah';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface YearDestiny {
  age: number;
  year: number;
  ganZhi: string;
  element: string;
  primaryEvent: CollapsedEvent;
  secondaryEvents: CollapsedEvent[];
  isSynergyYear: boolean;
  synergyCount: number;
  causalLinks: CausalLink[];
  yearNarrative: string;
  overallEnergy: number;
}

export interface CausalLink {
  fromAge: number;
  fromAspect: LifeAspect;
  toAge: number;
  toAspect: LifeAspect;
  description: string;
}

export interface PhaseNarrative {
  phase: DestinyPhase;
  narrative: string;
  keyMilestones: string[];
  dominantThemes: LifeAspect[];
  peakAge: number;
  valleyAge: number;
}

export interface LifeNarrative {
  opening: string;
  phaseNarratives: PhaseNarrative[];
  climax: string;
  closing: string;
  fullText: string;
}

export interface ExpandedDestiny {
  yearDestinies: YearDestiny[];
  phaseNarratives: PhaseNarrative[];
  lifeNarrative: LifeNarrative;
  causalChains: CausalLink[];
  synergyYears: number[];
  turningPoints: number[];
}

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════

const ASPECT_CN: Record<LifeAspect, string> = {
  career: '事业', wealth: '财富', love: '情感', health: '健康', wisdom: '智慧',
  social: '人际', creativity: '创造', fortune: '运势', family: '家庭', spirituality: '灵性',
};

const ELEMENT_ORGAN: Record<string, string> = {
  '木': '肝胆', '火': '心脏', '土': '脾胃', '金': '肺部', '水': '肾脏',
};

const ELEMENT_SEASON: Record<string, string> = {
  '木': '春', '火': '夏', '土': '长夏', '金': '秋', '水': '冬',
};

// ═══════════════════════════════════════
// Multi-Event Year Builder
// ═══════════════════════════════════════

function buildYearDestinies(
  timeline: CollapsedEvent[],
  allBranchVotes: Map<number, Map<LifeAspect, { convergence: number; eventType: DestinyEventType; energy: number; systems: string[] }>>,
  systems: SystemAnalysis[],
  baziProfile: BaZiProfile,
  westernReport: WesternAstrologyReport,
  vedicReport: VedicReport,
  mayanReport: MayanReport,
): YearDestiny[] {
  const yearDestinies: YearDestiny[] = [];

  for (const primaryEvent of timeline) {
    const ageVotes = allBranchVotes.get(primaryEvent.age);
    const secondaryEvents: CollapsedEvent[] = [];

    if (ageVotes) {
      const sortedAspects = Array.from(ageVotes.entries())
        .filter(([asp]) => asp !== primaryEvent.dominantAspect)
        .sort((a, b) => b[1].convergence - a[1].convergence)
        .slice(0, 2);

      for (const [asp, data] of sortedAspects) {
        if (data.convergence > 0.15) {
          secondaryEvents.push({
            ...primaryEvent,
            dominantAspect: asp,
            eventType: data.eventType,
            convergence: data.convergence,
            energyLevel: data.energy,
            systemVotes: data.systems,
            title: generateSecondaryTitle(asp, data.eventType, primaryEvent.age),
            description: generateSecondaryDesc(asp, data.eventType, primaryEvent.ganZhi, primaryEvent.element, data.energy, baziProfile),
          });
        }
      }
    }

    const synergyCount = primaryEvent.systemVotes.length;
    const isSynergyYear = synergyCount >= 6;

    const yearNarrative = buildYearNarrative(
      primaryEvent, secondaryEvents, isSynergyYear, baziProfile, westernReport, vedicReport, mayanReport,
    );

    const allEnergies = [primaryEvent.energyLevel, ...secondaryEvents.map(e => e.energyLevel)];
    const overallEnergy = Math.round(allEnergies.reduce((a, b) => a + b, 0) / allEnergies.length);

    yearDestinies.push({
      age: primaryEvent.age,
      year: primaryEvent.year,
      ganZhi: primaryEvent.ganZhi,
      element: primaryEvent.element,
      primaryEvent,
      secondaryEvents,
      isSynergyYear,
      synergyCount,
      causalLinks: [],
      yearNarrative,
      overallEnergy,
    });
  }

  return yearDestinies;
}

function generateSecondaryTitle(aspect: LifeAspect, type: DestinyEventType, age: number): string {
  const a = ASPECT_CN[aspect];
  const typeWords: Record<DestinyEventType, string> = {
    milestone: '重要节点', opportunity: '潜在机遇', challenge: '暗流涌动',
    transformation: '暗中蜕变', relationship: '缘分牵引', achievement: '附带收获',
    loss: '隐忧浮现', growth: '默默成长', turning_point: '暗线转折',
  };
  return `${a}${typeWords[type] || '变动'}`;
}

function generateSecondaryDesc(
  aspect: LifeAspect, type: DestinyEventType, ganZhi: string, element: string,
  energy: number, bazi: BaZiProfile,
): string {
  const a = ASPECT_CN[aspect];
  const isFav = bazi.favorableElements.includes(element);
  const el = element || '土';

  if (type === 'opportunity' || type === 'achievement') {
    return `${a}方面暗藏机遇，${el}气${isFav ? '助力' : '需借力'}，留心把握。`;
  }
  if (type === 'challenge' || type === 'loss') {
    return `${a}领域需警惕潜在压力，${ganZhi}年${el}行${isFav ? '尚可化解' : '需格外慎重'}。`;
  }
  return `${ganZhi}年${a}领域同步发生变动，与主线事件相互影响。`;
}

// ═══════════════════════════════════════
// Year Narrative Builder
// ═══════════════════════════════════════

function buildYearNarrative(
  primary: CollapsedEvent,
  secondary: CollapsedEvent[],
  isSynergy: boolean,
  bazi: BaZiProfile,
  western: WesternAstrologyReport,
  vedic: VedicReport,
  mayan: MayanReport,
): string {
  const parts: string[] = [];
  const el = primary.element;
  const isFav = bazi.favorableElements.includes(el);

  // Opening
  parts.push(`${primary.ganZhi}年（${primary.age}岁），流年${el}气${isFav ? '与命局喜用相合' : '与命局形成张力'}。`);

  // Primary event
  parts.push(primary.description);

  // Secondary events
  if (secondary.length > 0) {
    const secDescs = secondary.map(e => `${ASPECT_CN[e.dominantAspect]}面${e.energyLevel >= 60 ? '亦有佳象' : '需留心'}`);
    parts.push(`同年${secDescs.join('，')}。`);
  }

  // Synergy marker
  if (isSynergy) {
    parts.push(`此年${primary.systemVotes.length}大命理体系高度共振，乃命定之年，所发之事确定无疑。`);
  }

  // System-specific color
  const activeDasha = vedic.dashas.find(d => primary.age >= d.startAge && primary.age <= d.endAge);
  if (activeDasha) {
    const quality = activeDasha.quality === 'benefic' ? '吉星主运' : activeDasha.quality === 'malefic' ? '凶星当令' : '中性运程';
    parts.push(`吠陀大限${activeDasha.planet}期，${quality}。`);
  }

  return parts.join('');
}

// ═══════════════════════════════════════
// Causal Chain Engine
// ═══════════════════════════════════════

function buildCausalChains(yearDestinies: YearDestiny[]): CausalLink[] {
  const chains: CausalLink[] = [];
  const aspectLastSeen: Partial<Record<LifeAspect, { age: number; type: DestinyEventType }>> = {};

  for (const yd of yearDestinies) {
    const asp = yd.primaryEvent.dominantAspect;
    const prev = aspectLastSeen[asp];

    if (prev && yd.age - prev.age >= 3 && yd.age - prev.age <= 15) {
      const link: CausalLink = {
        fromAge: prev.age,
        fromAspect: asp,
        toAge: yd.age,
        toAspect: asp,
        description: buildCausalDesc(asp, prev.age, prev.type, yd.age, yd.primaryEvent.eventType),
      };
      chains.push(link);
      yd.causalLinks.push(link);
    }

    // Cross-aspect causality
    for (const sec of yd.secondaryEvents) {
      const secPrev = aspectLastSeen[sec.dominantAspect];
      if (secPrev && yd.age - secPrev.age >= 2 && yd.age - secPrev.age <= 12) {
        const link: CausalLink = {
          fromAge: secPrev.age,
          fromAspect: secPrev.type === 'turning_point' ? asp : sec.dominantAspect,
          toAge: yd.age,
          toAspect: sec.dominantAspect,
          description: `${secPrev.age}岁${ASPECT_CN[sec.dominantAspect]}的变化在此年延续影响。`,
        };
        chains.push(link);
      }
    }

    aspectLastSeen[asp] = { age: yd.age, type: yd.primaryEvent.eventType };
    for (const sec of yd.secondaryEvents) {
      aspectLastSeen[sec.dominantAspect] = { age: yd.age, type: sec.eventType };
    }
  }

  return chains;
}

function buildCausalDesc(asp: LifeAspect, fromAge: number, fromType: DestinyEventType, toAge: number, toType: DestinyEventType): string {
  const a = ASPECT_CN[asp];
  const gap = toAge - fromAge;
  if (fromType === 'challenge' && (toType === 'achievement' || toType === 'opportunity')) {
    return `${fromAge}岁${a}所经历的考验，历经${gap}年沉淀，在此年收获回报。`;
  }
  if (fromType === 'turning_point') {
    return `${fromAge}岁${a}的关键转折决定了此年的走向。`;
  }
  if (fromType === 'loss' && toType === 'growth') {
    return `${fromAge}岁的失去成为${gap}年后成长的养分。`;
  }
  return `${fromAge}岁${a}的变化经过${gap}年发展，在此年形成新的格局。`;
}

// ═══════════════════════════════════════
// Phase Narrative Builder
// ═══════════════════════════════════════

function buildPhaseNarratives(
  phases: DestinyPhase[],
  yearDestinies: YearDestiny[],
  states: QuantumState[],
  bazi: BaZiProfile,
): PhaseNarrative[] {
  return phases.map(phase => {
    const phaseYears = yearDestinies.filter(y => y.age >= phase.startAge && y.age <= phase.endAge);
    const aspectCounts: Partial<Record<LifeAspect, number>> = {};
    for (const y of phaseYears) {
      const a = y.primaryEvent.dominantAspect;
      aspectCounts[a] = (aspectCounts[a] || 0) + 1;
    }
    const dominantThemes = (Object.entries(aspectCounts) as [LifeAspect, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a]) => a);

    const peakYear = phaseYears.reduce((best, y) => y.overallEnergy > best.overallEnergy ? y : best, phaseYears[0] || { age: phase.startAge, overallEnergy: 0 });
    const valleyYear = phaseYears.reduce((worst, y) => y.overallEnergy < worst.overallEnergy ? y : worst, phaseYears[0] || { age: phase.startAge, overallEnergy: 100 });

    const synergyYears = phaseYears.filter(y => y.isSynergyYear);
    const turningYears = phaseYears.filter(y => y.primaryEvent.eventType === 'turning_point');

    const keyMilestones = [
      ...turningYears.map(y => `${y.age}岁: ${y.primaryEvent.title}`),
      ...synergyYears.map(y => `${y.age}岁: ${y.synergyCount}系共振 — ${y.primaryEvent.title}`),
    ].slice(0, 5);

    const narrative = buildPhaseText(phase, dominantThemes, peakYear.age, valleyYear.age, keyMilestones, bazi, phaseYears.length);

    return {
      phase,
      narrative,
      keyMilestones,
      dominantThemes,
      peakAge: peakYear.age,
      valleyAge: valleyYear.age,
    };
  });
}

function buildPhaseText(
  phase: DestinyPhase, themes: LifeAspect[], peakAge: number, valleyAge: number,
  milestones: string[], bazi: BaZiProfile, eventCount: number,
): string {
  const themeCN = themes.map(t => ASPECT_CN[t]).join('、');
  const parts: string[] = [];

  parts.push(`【${phase.name}】（${phase.startAge}-${phase.endAge}岁）主题为"${phase.theme}"，${phase.element}气主导。`);
  parts.push(`此阶段核心议题在${themeCN}，共${eventCount}个命运节点。`);

  if (peakAge !== valleyAge) {
    parts.push(`能量巅峰在${peakAge}岁，低谷在${valleyAge}岁。`);
  }

  if (milestones.length > 0) {
    parts.push(`关键节点: ${milestones.join('；')}。`);
  }

  const organ = ELEMENT_ORGAN[phase.element] || '脾胃';
  parts.push(`健康方面宜关注${organ}，以${ELEMENT_SEASON[phase.element] || '四季'}为调养良机。`);

  return parts.join('');
}

// ═══════════════════════════════════════
// Full Life Narrative
// ═══════════════════════════════════════

function buildLifeNarrative(
  phaseNarratives: PhaseNarrative[],
  states: QuantumState[],
  bazi: BaZiProfile,
  western: WesternAstrologyReport,
  vedic: VedicReport,
  mayan: MayanReport,
  kabbalah: KabbalahReport,
  yearDestinies: YearDestiny[],
  synergyYears: number[],
  overallCoherence: number,
  totalWorlds: number,
): LifeNarrative {
  const topStates = [...states].sort((a, b) => b.probability - a.probability);
  const top3 = topStates.slice(0, 3).map(s => s.label).join('、');
  const weak2 = topStates.slice(-2).map(s => s.label).join('、');

  const opening = [
    `此命日主${bazi.dayMaster}(${bazi.dayMasterElement})，${bazi.strength}。`,
    `西方占星太阳${western.sunSign}、月亮${western.moonSign}、上升${western.risingSign}，${western.dominantElement}元素主导。`,
    `吠陀月宿${vedic.moonNakshatra.nameCN}(${vedic.moonNakshatra.name})，守护${vedic.moonNakshatra.deity}。`,
    `玛雅银河签名${mayan.daySignCN}·Tone ${mayan.galacticTone}，${mayan.daySignMeaning}。`,
    `卡巴拉灵魂质点${kabbalah.soulSephirah.nameCN}(${kabbalah.soulSephirah.name})，${kabbalah.soulSephirah.meaning.split('·')[0]}。`,
    ``,
    `九大命理体系经${totalWorlds.toLocaleString()}个平行世界量子坍缩，共振度${Math.round(overallCoherence * 100)}%，`,
    `确定此命一生以${top3}为根基，${weak2}为修行课题。`,
  ].join('');

  const climaxYears = yearDestinies.filter(y => y.isSynergyYear || y.primaryEvent.eventType === 'turning_point')
    .sort((a, b) => b.synergyCount - a.synergyCount);
  const climax = climaxYears.length > 0
    ? `一生最关键转折出现在${climaxYears.slice(0, 3).map(y => `${y.age}岁(${y.primaryEvent.title})`).join('、')}。这些年份为命运之锚，不可逆转，所有后续轨迹皆由此发散而出又收敛于此。`
    : '一生平稳运行，无极端转折，各方面均衡发展。';

  const closing = [
    `纵观一生，${phaseNarratives.length}个生命阶段各有主题，`,
    `从${phaseNarratives[0]?.phase.name || '启蒙'}至${phaseNarratives[phaseNarratives.length - 1]?.phase.name || '圆融'}，`,
    `命运的每一个节点皆已由九大体系确认。`,
    `量子坍缩完成，平行世界归一，此为唯一真实命运。`,
  ].join('');

  const fullText = [
    opening,
    '\n\n',
    ...phaseNarratives.map(pn => pn.narrative),
    '\n\n',
    climax,
    '\n\n',
    closing,
  ].join('\n');

  return { opening, phaseNarratives, climax, closing, fullText };
}

// ═══════════════════════════════════════
// Public API
// ═══════════════════════════════════════

export function expandDestiny(
  timeline: CollapsedEvent[],
  phases: DestinyPhase[],
  states: QuantumState[],
  systems: SystemAnalysis[],
  allBranchVotes: Map<number, Map<LifeAspect, { convergence: number; eventType: DestinyEventType; energy: number; systems: string[] }>>,
  baziProfile: BaZiProfile,
  ziweiReport: ZiweiReport,
  liuYaoResult: LiuYaoResult,
  westernReport: WesternAstrologyReport,
  vedicReport: VedicReport,
  numerologyReport: NumerologyReport,
  mayanReport: MayanReport,
  kabbalahReport: KabbalahReport,
  overallCoherence: number,
  totalWorlds: number,
): ExpandedDestiny {
  // 1. Build multi-event years
  const yearDestinies = buildYearDestinies(
    timeline, allBranchVotes, systems, baziProfile, westernReport, vedicReport, mayanReport,
  );

  // 2. Build causal chains
  const causalChains = buildCausalChains(yearDestinies);

  // 3. Phase narratives
  const phaseNarratives = buildPhaseNarratives(phases, yearDestinies, states, baziProfile);

  // 4. Full life narrative
  const synergyYears = yearDestinies.filter(y => y.isSynergyYear).map(y => y.age);
  const turningPoints = yearDestinies.filter(y => y.primaryEvent.eventType === 'turning_point').map(y => y.age);

  const lifeNarrative = buildLifeNarrative(
    phaseNarratives, states, baziProfile, westernReport, vedicReport, mayanReport, kabbalahReport,
    yearDestinies, synergyYears, overallCoherence, totalWorlds,
  );

  return {
    yearDestinies,
    phaseNarratives,
    lifeNarrative,
    causalChains,
    synergyYears,
    turningPoints,
  };
}
