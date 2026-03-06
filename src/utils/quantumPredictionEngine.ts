/**
 * H-Pulse Quantum Prediction Engine (量子预测引擎)
 *
 * Synthesizes four classical Chinese metaphysics systems into a unified
 * quantum-inspired prediction model:
 *
 *   1. Tieban Shenshu (铁板神数) - Deterministic clause mapping
 *   2. BaZi (八字)              - Four Pillars elemental analysis
 *   3. Ziwei Doushu (紫微斗数)  - Star palace positioning
 *   4. Liu Yao (六爻)           - Hexagram divination
 *
 * Each system is treated as a "quantum observable" that collapses into
 * a coherent prediction when measured together. Cross-system resonance
 * amplifies signal strength and confidence.
 */

import { TiebanEngine, type TiebanInput, type FullDestinyReport, type BaZiProfile } from './tiebanAlgorithm';
import { ZiweiEngine, type ZiweiReport, type ZiweiPalace } from './ziweiAlgorithm';
import { calculateLiuYaoHexagram, type LiuYaoResult, type Hexagram } from './liuYaoAlgorithm';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface QuantumInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
}

export type LifeAspect =
  | 'career'
  | 'wealth'
  | 'love'
  | 'health'
  | 'wisdom'
  | 'social'
  | 'creativity'
  | 'fortune';

export interface QuantumState {
  aspect: LifeAspect;
  label: string;
  amplitude: number;   // 0-1, raw signal strength
  phase: number;        // 0-2π, represents timing/cyclical position
  coherence: number;    // 0-1, cross-system agreement
  probability: number;  // final prediction score 0-100
  trend: 'rising' | 'stable' | 'declining';
  description: string;
}

export interface SystemContribution {
  system: string;
  weight: number;
  rawScore: number;
  normalizedScore: number;
  detail: string;
}

export interface QuantumEntanglement {
  aspectA: LifeAspect;
  aspectB: LifeAspect;
  correlation: number; // -1 to 1
  description: string;
}

export interface QuantumTimeline {
  age: number;
  year: number;
  energy: number;      // 0-100
  element: string;
  phase: string;
  ganZhi: string;
  isCurrentAge: boolean;
}

export interface QuantumPredictionResult {
  states: QuantumState[];
  systemContributions: Record<LifeAspect, SystemContribution[]>;
  entanglements: QuantumEntanglement[];
  timeline: QuantumTimeline[];
  overallCoherence: number;
  dominantElement: string;
  quantumSignature: string;
  baziProfile: BaZiProfile;
  ziweiReport: ZiweiReport;
  liuYaoResult: LiuYaoResult;
  fullReport: FullDestinyReport;
  timestamp: Date;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ASPECT_LABELS: Record<LifeAspect, string> = {
  career: '事业',
  wealth: '财富',
  love: '情感',
  health: '健康',
  wisdom: '智慧',
  social: '人际',
  creativity: '创造',
  fortune: '运势',
};

const ELEMENT_ASPECT_MAP: Record<string, LifeAspect[]> = {
  '木': ['creativity', 'health'],
  '火': ['career', 'social'],
  '土': ['fortune', 'health'],
  '金': ['wealth', 'wisdom'],
  '水': ['wisdom', 'love'],
};

const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'];

const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const PALACE_ASPECT_MAP: Record<string, LifeAspect> = {
  '命宫': 'fortune',
  '兄弟': 'social',
  '夫妻': 'love',
  '子女': 'creativity',
  '财帛': 'wealth',
  '疾厄': 'health',
  '迁移': 'social',
  '仆役': 'social',
  '官禄': 'career',
  '田宅': 'wealth',
  '福德': 'wisdom',
  '父母': 'wisdom',
};

const BRIGHTNESS_SCORES: Record<string, number> = {
  '庙': 1.0, '旺': 0.9, '得': 0.75, '利': 0.65,
  '平': 0.5, '闲': 0.3, '陷': 0.15,
};

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

function getElementScore(elements: string[], favorable: string[], unfavorable: string[]): number {
  let score = 50;
  for (const el of elements) {
    if (favorable.includes(el)) score += 12;
    if (unfavorable.includes(el)) score -= 8;
  }
  return Math.max(0, Math.min(100, score));
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function hashToPhase(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return ((hash % 628) + 628) % 628 / 100;
}

function determineTrend(baziScore: number, ziweiScore: number, liuyaoScore: number): 'rising' | 'stable' | 'declining' {
  const avg = (baziScore + ziweiScore + liuyaoScore) / 3;
  const variance = [baziScore, ziweiScore, liuyaoScore]
    .reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / 3;
  if (liuyaoScore > avg + 5) return 'rising';
  if (liuyaoScore < avg - 5) return 'declining';
  return 'stable';
}

function generateDescription(aspect: LifeAspect, probability: number, trend: string, dominant: string): string {
  const aspectName = ASPECT_LABELS[aspect];
  const levelWord = probability >= 75 ? '强盛' : probability >= 50 ? '平稳' : '偏弱';
  const trendWord = trend === 'rising' ? '上升趋势' : trend === 'declining' ? '需注意调整' : '保持稳定';
  return `${aspectName}量子态${levelWord}，${dominant}气场${trendWord}`;
}

// ─────────────────────────────────────────────
// BaZi Contribution Extraction
// ─────────────────────────────────────────────

function extractBaZiContributions(
  profile: BaZiProfile,
  report: FullDestinyReport,
): Record<LifeAspect, SystemContribution> {
  const fav = profile.favorableElements;
  const unfav = profile.unfavorableElements;

  const pillarElements = Object.values(profile.pillars).map(p => {
    const stem = p.charAt(0);
    const branch = p.charAt(1);
    return [STEM_ELEMENTS[stem] || '', BRANCH_ELEMENTS[branch] || ''];
  }).flat().filter(Boolean);

  const aspectScores: Record<LifeAspect, number> = {
    career: 50, wealth: 50, love: 50, health: 50,
    wisdom: 50, social: 50, creativity: 50, fortune: 50,
  };

  for (const el of pillarElements) {
    const mapped = ELEMENT_ASPECT_MAP[el] || [];
    for (const asp of mapped) {
      aspectScores[asp] += fav.includes(el) ? 6 : unfav.includes(el) ? -4 : 2;
    }
  }

  const dayMasterEl = profile.dayMasterElement;
  if (dayMasterEl) {
    const strength = profile.strength.includes('Strong') ? 8 : -3;
    aspectScores.fortune += strength;
    aspectScores.health += strength > 0 ? 5 : -2;
  }

  const proj = report.destinyProjection;
  aspectScores.career += normalizeScore(proj.career % 1000, 0, 1000) * 20 - 10;
  aspectScores.wealth += normalizeScore(proj.wealth % 1000, 0, 1000) * 20 - 10;
  aspectScores.love += normalizeScore(proj.marriage % 1000, 0, 1000) * 20 - 10;
  aspectScores.health += normalizeScore(proj.health % 1000, 0, 1000) * 20 - 10;

  const result = {} as Record<LifeAspect, SystemContribution>;
  for (const aspect of Object.keys(aspectScores) as LifeAspect[]) {
    const raw = Math.max(0, Math.min(100, aspectScores[aspect]));
    result[aspect] = {
      system: '八字命理',
      weight: 0.35,
      rawScore: raw,
      normalizedScore: raw / 100,
      detail: `日主${profile.dayMaster}(${dayMasterEl})，${profile.strength}`,
    };
  }
  return result;
}

// ─────────────────────────────────────────────
// Ziwei Contribution Extraction
// ─────────────────────────────────────────────

function extractZiweiContributions(
  ziweiReport: ZiweiReport,
): Record<LifeAspect, SystemContribution> {
  const aspectScores: Record<LifeAspect, number> = {
    career: 50, wealth: 50, love: 50, health: 50,
    wisdom: 50, social: 50, creativity: 50, fortune: 50,
  };

  for (const palace of ziweiReport.palaces) {
    const targetAspect = PALACE_ASPECT_MAP[palace.name];
    if (!targetAspect) continue;

    for (const star of palace.stars) {
      const brightness = BRIGHTNESS_SCORES[star.brightness] ?? 0.5;
      const typeWeight = star.type === 'major' ? 8 : star.type === 'auxiliary' ? 4 : -3;
      const boost = typeWeight * brightness;

      aspectScores[targetAspect] += boost;

      if (star.sihua === '禄') aspectScores[targetAspect] += 6;
      if (star.sihua === '权') aspectScores[targetAspect] += 4;
      if (star.sihua === '科') aspectScores[targetAspect] += 3;
      if (star.sihua === '忌') aspectScores[targetAspect] -= 5;
    }
  }

  const result = {} as Record<LifeAspect, SystemContribution>;
  for (const aspect of Object.keys(aspectScores) as LifeAspect[]) {
    const raw = Math.max(0, Math.min(100, aspectScores[aspect]));
    const mingStars = ziweiReport.palaces.find(p => p.isMing)?.stars.map(s => s.name).join('、') || '';
    result[aspect] = {
      system: '紫微斗数',
      weight: 0.30,
      rawScore: raw,
      normalizedScore: raw / 100,
      detail: `命宫${ziweiReport.mingGong}，主星: ${mingStars || '无'}`,
    };
  }
  return result;
}

// ─────────────────────────────────────────────
// Liu Yao Contribution Extraction
// ─────────────────────────────────────────────

function extractLiuYaoContributions(
  liuYao: LiuYaoResult,
): Record<LifeAspect, SystemContribution> {
  const hex = liuYao.mainHexagram;
  const lines = hex.lines;

  const aspectScores: Record<LifeAspect, number> = {
    career: 50, wealth: 50, love: 50, health: 50,
    wisdom: 50, social: 50, creativity: 50, fortune: 50,
  };

  const lineAspectMap: Record<number, LifeAspect[]> = {
    1: ['fortune', 'health'],
    2: ['love', 'social'],
    3: ['creativity', 'wisdom'],
    4: ['career', 'social'],
    5: ['career', 'wealth'],
    6: ['wisdom', 'fortune'],
  };

  for (const line of lines) {
    const targets = lineAspectMap[line.position] || [];
    const yangBoost = line.yinYang === 'yang' ? 5 : -2;
    const changingBoost = line.isChanging ? 3 : 0;

    for (const asp of targets) {
      aspectScores[asp] += yangBoost + changingBoost;
    }

    const elAspects = ELEMENT_ASPECT_MAP[line.element] || [];
    for (const asp of elAspects) {
      aspectScores[asp] += 2;
    }
  }

  if (hex.targetHexagram) {
    aspectScores.fortune += 5;
  }

  const result = {} as Record<LifeAspect, SystemContribution>;
  for (const aspect of Object.keys(aspectScores) as LifeAspect[]) {
    const raw = Math.max(0, Math.min(100, aspectScores[aspect]));
    result[aspect] = {
      system: '六爻卦象',
      weight: 0.20,
      rawScore: raw,
      normalizedScore: raw / 100,
      detail: `${hex.name}，${hex.changingLines.length}爻动`,
    };
  }
  return result;
}

// ─────────────────────────────────────────────
// Tieban Contribution (as structural baseline)
// ─────────────────────────────────────────────

function extractTiebanContributions(
  report: FullDestinyReport,
): Record<LifeAspect, SystemContribution> {
  const proj = report.destinyProjection;
  const getScore = (val: number) => normalizeScore(val % 1000, 0, 1000) * 100;

  const scores: Record<LifeAspect, number> = {
    career: getScore(proj.career),
    wealth: getScore(proj.wealth),
    love: getScore(proj.marriage),
    health: getScore(proj.health),
    wisdom: (getScore(proj.lifeDestiny) + getScore(proj.career)) / 2,
    social: (getScore(proj.marriage) + getScore(proj.children)) / 2,
    creativity: getScore(proj.children),
    fortune: getScore(proj.lifeDestiny),
  };

  const result = {} as Record<LifeAspect, SystemContribution>;
  for (const aspect of Object.keys(scores) as LifeAspect[]) {
    result[aspect] = {
      system: '铁板神数',
      weight: 0.15,
      rawScore: scores[aspect],
      normalizedScore: scores[aspect] / 100,
      detail: `条文基数推演`,
    };
  }
  return result;
}

// ─────────────────────────────────────────────
// Entanglement Calculation
// ─────────────────────────────────────────────

function calculateEntanglements(states: QuantumState[]): QuantumEntanglement[] {
  const pairs: [LifeAspect, LifeAspect, string][] = [
    ['career', 'wealth', '事业兴则财运通'],
    ['love', 'health', '情志和则身心安'],
    ['wisdom', 'creativity', '智慧深则创造力强'],
    ['social', 'career', '人脉广则事业顺'],
    ['fortune', 'health', '运势旺则健康佳'],
    ['wealth', 'love', '财稳则情感安'],
    ['creativity', 'fortune', '创新助运势'],
    ['wisdom', 'career', '学以致用'],
  ];

  return pairs.map(([a, b, desc]) => {
    const stateA = states.find(s => s.aspect === a)!;
    const stateB = states.find(s => s.aspect === b)!;
    const diff = Math.abs(stateA.probability - stateB.probability);
    const correlation = 1 - (diff / 100) * 2;
    return {
      aspectA: a,
      aspectB: b,
      correlation: Math.max(-1, Math.min(1, correlation)),
      description: desc,
    };
  });
}

// ─────────────────────────────────────────────
// Timeline Generation
// ─────────────────────────────────────────────

function generateTimeline(
  input: QuantumInput,
  baziProfile: BaZiProfile,
  report: FullDestinyReport,
): QuantumTimeline[] {
  const now = new Date();
  const currentAge = now.getFullYear() - input.year;
  const timeline: QuantumTimeline[] = [];
  const fav = baziProfile.favorableElements;
  const unfav = baziProfile.unfavorableElements;

  const phases = ['起', '承', '转', '合', '蓄', '发', '收', '藏'];

  for (const fy of report.flowYears) {
    const ganZhi = fy.ganZhi;
    const stem = ganZhi.charAt(0);
    const branch = ganZhi.charAt(1);
    const stemEl = STEM_ELEMENTS[stem] || '';
    const branchEl = BRANCH_ELEMENTS[branch] || '';

    let energy = 50;
    if (fav.includes(stemEl)) energy += 15;
    if (fav.includes(branchEl)) energy += 10;
    if (unfav.includes(stemEl)) energy -= 12;
    if (unfav.includes(branchEl)) energy -= 8;

    const daYun = report.lifeCycles.find(c => fy.age >= c.startAge && fy.age <= c.endAge);
    if (daYun) {
      if (fav.includes(daYun.element)) energy += 8;
      if (unfav.includes(daYun.element)) energy -= 6;
    }

    energy = Math.max(5, Math.min(95, energy));

    timeline.push({
      age: fy.age,
      year: fy.year,
      energy,
      element: stemEl || branchEl,
      phase: phases[(fy.age - 1) % 8],
      ganZhi,
      isCurrentAge: fy.age === currentAge,
    });
  }

  return timeline;
}

// ─────────────────────────────────────────────
// Quantum Signature
// ─────────────────────────────────────────────

function computeQuantumSignature(input: QuantumInput, states: QuantumState[]): string {
  const elements = FIVE_ELEMENTS;
  const topAspects = [...states].sort((a, b) => b.probability - a.probability).slice(0, 3);
  const sig = topAspects.map(s => `${ASPECT_LABELS[s.aspect]}${Math.round(s.probability)}`).join('·');
  const hex = ((input.year * 13 + input.month * 7 + input.day * 3 + input.hour) % 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return `QS-${hex}-${sig}`;
}

// ─────────────────────────────────────────────
// Main Prediction Engine
// ─────────────────────────────────────────────

export const QuantumPredictionEngine = {
  predict(input: QuantumInput): QuantumPredictionResult {
    const timestamp = new Date();

    // 1. Run all four engines
    const tiebanInput: TiebanInput = { ...input };
    const baziProfile = TiebanEngine.calculateBaZiProfile(tiebanInput);
    const theoreticalBase = TiebanEngine.calculateTheoreticalBase(tiebanInput);
    const fullReport = TiebanEngine.generateFullDestinyReport(tiebanInput, theoreticalBase, 0);

    const ziweiReport = ZiweiEngine.generateReport({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      gender: input.gender,
    });

    const liuYaoResult = calculateLiuYaoHexagram(timestamp);

    // 2. Extract per-system contributions
    const baziContribs = extractBaZiContributions(baziProfile, fullReport);
    const ziweiContribs = extractZiweiContributions(ziweiReport);
    const liuyaoContribs = extractLiuYaoContributions(liuYaoResult);
    const tiebanContribs = extractTiebanContributions(fullReport);

    // 3. Merge into quantum states
    const aspects: LifeAspect[] = ['career', 'wealth', 'love', 'health', 'wisdom', 'social', 'creativity', 'fortune'];
    const allContribs = {} as Record<LifeAspect, SystemContribution[]>;

    const states: QuantumState[] = aspects.map(aspect => {
      const contribs = [
        baziContribs[aspect],
        ziweiContribs[aspect],
        liuyaoContribs[aspect],
        tiebanContribs[aspect],
      ];
      allContribs[aspect] = contribs;

      const weightedSum = contribs.reduce((sum, c) => sum + c.rawScore * c.weight, 0);
      const totalWeight = contribs.reduce((sum, c) => sum + c.weight, 0);
      const amplitude = weightedSum / (totalWeight * 100);

      const scores = contribs.map(c => c.normalizedScore);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
      const coherence = Math.max(0, 1 - Math.sqrt(variance) * 3);

      const probability = Math.round(
        Math.max(5, Math.min(95, amplitude * 100 * (0.7 + 0.3 * coherence)))
      );

      const phase = hashToPhase(`${aspect}-${input.year}-${input.month}-${input.day}`);
      const trend = determineTrend(
        baziContribs[aspect].rawScore,
        ziweiContribs[aspect].rawScore,
        liuyaoContribs[aspect].rawScore,
      );

      const pillarElements = Object.values(baziProfile.pillars)
        .map(p => STEM_ELEMENTS[p.charAt(0)] || '')
        .filter(Boolean);
      const dominantCounts: Record<string, number> = {};
      pillarElements.forEach(el => { dominantCounts[el] = (dominantCounts[el] || 0) + 1; });
      const dominant = Object.entries(dominantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '土';

      return {
        aspect,
        label: ASPECT_LABELS[aspect],
        amplitude,
        phase,
        coherence,
        probability,
        trend,
        description: generateDescription(aspect, probability, trend, dominant),
      };
    });

    // 4. Entanglements
    const entanglements = calculateEntanglements(states);

    // 5. Timeline
    const timeline = generateTimeline(input, baziProfile, fullReport);

    // 6. Overall coherence
    const overallCoherence = states.reduce((s, st) => s + st.coherence, 0) / states.length;

    // 7. Dominant element
    const elCounts: Record<string, number> = {};
    Object.values(baziProfile.pillars).forEach(p => {
      const el = STEM_ELEMENTS[p.charAt(0)];
      if (el) elCounts[el] = (elCounts[el] || 0) + 1;
    });
    const dominantElement = Object.entries(elCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '土';

    // 8. Quantum signature
    const quantumSignature = computeQuantumSignature(input, states);

    return {
      states,
      systemContributions: allContribs,
      entanglements,
      timeline,
      overallCoherence,
      dominantElement,
      quantumSignature,
      baziProfile,
      ziweiReport,
      liuYaoResult,
      fullReport,
      timestamp,
    };
  },

  getAspectLabel(aspect: LifeAspect): string {
    return ASPECT_LABELS[aspect];
  },

  getAllAspects(): LifeAspect[] {
    return ['career', 'wealth', 'love', 'health', 'wisdom', 'social', 'creativity', 'fortune'];
  },
};

export default QuantumPredictionEngine;
