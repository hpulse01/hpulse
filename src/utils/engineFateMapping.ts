/**
 * H-Pulse Engine → 6D FateVector Precise Mapping v1.0
 *
 * Implements the Notion specification for per-engine FateVector mapping:
 *   - 六爻：六亲→6D (世爻→life, 财爻→wealth, 应爻→relation, 官鬼→wisdom, 子孙→health, 父母→spirit)
 *   - 奇门：八门→6D (开门→wealth, 休门→health, 生门→wealth, 伤门→health↓, etc.)
 *   - 紫微：十二宫→6D (命宫→life, 财帛→wealth, 夫妻→relation, 疾厄→health, etc.)
 *   - 八字：十神→6D (正官→life, 正财→wealth, 正印→wisdom, etc.)
 *   - 铁板：十二宫→6D
 *   - 西方：行星品质→6D
 *   - 吠陀：Yoga类型→6D
 *   - 数字：核心数字→6D
 *   - 玛雅：日符能量→6D
 *   - 卡巴拉：质点→6D
 *
 * All mappings return FateVector with values in [5, 95] range.
 */

import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';

function clamp(v: number, min = 5, max = 95): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function emptyVector(base = 50): FateVector {
  return { life: base, wealth: base, relation: base, health: base, wisdom: base, spirit: base };
}

// ═══════════════════════════════════════════════
// 1. 六爻 (Liu Yao) → 6D
//    Notion: 六亲-维度映射
// ═══════════════════════════════════════════════

interface LiuYaoLine {
  position: number;
  yinYang: 'yin' | 'yang';
  isChanging: boolean;
  branch: string;
  relative: string;  // 六亲: 世, 兄弟, 子孙, 妻财, 官鬼, 父母
  isShiYao?: boolean;
  isYingYao?: boolean;
  spirit?: string;   // 六神: 青龙, 朱雀, 勾陈, 螣蛇, 白虎, 玄武
}

/**
 * 六爻六亲→6D精确映射
 * 世爻→E_life (旺衰+动变)
 * 财爻→E_wealth (财爻强弱×世爻关系)
 * 应爻→E_relation (应爻状态+世应生克)
 * 官鬼爻→E_wisdom (官爻状态，正向/负向视用神)
 * 子孙爻→E_health (子孙爻旺相程度)
 * 父母爻→E_spirit (父母爻+整体卦气)
 */
export function mapLiuYaoToFateVector(lines: LiuYaoLine[], overallTendency: string): FateVector {
  const fv = emptyVector();
  
  // Branch element strength lookup
  const BRANCH_STRENGTH: Record<string, number> = {
    '子': 8, '丑': 5, '寅': 7, '卯': 8, '辰': 6, '巳': 7,
    '午': 8, '未': 5, '申': 7, '酉': 8, '戌': 5, '亥': 7,
  };
  
  // Spirit modifiers: 六神对各维度的影响
  const SPIRIT_MODS: Record<string, Partial<Record<FateDimension, number>>> = {
    '青龙': { wealth: 6, relation: 4, spirit: 3 },
    '朱雀': { wisdom: 5, relation: -3 },
    '勾陈': { life: 3, health: -2 },
    '螣蛇': { wisdom: 4, spirit: 5, health: -3 },
    '白虎': { life: -4, health: -5, wealth: 3 },
    '玄武': { relation: -4, wisdom: 3, spirit: 4 },
  };

  for (const line of lines) {
    const strength = BRANCH_STRENGTH[line.branch] ?? 5;
    const yangBoost = line.yinYang === 'yang' ? 3 : -2;
    const changingBoost = line.isChanging ? 4 : 0;
    const lineScore = strength + yangBoost + changingBoost;

    // 世爻 → life
    if (line.isShiYao || line.relative === '世') {
      fv.life = clamp(fv.life + lineScore);
    }
    // 应爻 → relation
    if (line.isYingYao || line.relative === '应') {
      fv.relation = clamp(fv.relation + lineScore * 0.8);
    }

    // 六亲映射
    switch (line.relative) {
      case '妻财': case '财':
        fv.wealth = clamp(fv.wealth + lineScore * 1.2);
        break;
      case '官鬼': case '官':
        // 官鬼双面性：旺则权位，衰则灾祸
        fv.wisdom = clamp(fv.wisdom + (lineScore > 8 ? lineScore * 0.8 : -lineScore * 0.5));
        fv.life = clamp(fv.life + (lineScore > 10 ? -3 : 2));
        break;
      case '子孙': case '子':
        fv.health = clamp(fv.health + lineScore);
        fv.relation = clamp(fv.relation + lineScore * 0.4);
        break;
      case '父母': case '父':
        fv.spirit = clamp(fv.spirit + lineScore * 0.9);
        fv.wisdom = clamp(fv.wisdom + lineScore * 0.5);
        break;
      case '兄弟': case '兄':
        fv.relation = clamp(fv.relation + lineScore * 0.5);
        fv.wealth = clamp(fv.wealth - lineScore * 0.4); // 兄弟克财
        break;
    }

    // 六神修正
    if (line.spirit && SPIRIT_MODS[line.spirit]) {
      for (const [dim, mod] of Object.entries(SPIRIT_MODS[line.spirit]!)) {
        fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + mod);
      }
    }
  }

  // 整体卦气修正
  if (overallTendency === '大吉' || overallTendency === '吉') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] + 5);
  } else if (overallTendency === '大凶' || overallTendency === '凶') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] - 5);
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 2. 奇门遁甲 (Qimen) → 6D
//    Notion: 八门-维度映射
// ═══════════════════════════════════════════════

/**
 * 八门→6D映射 (from Notion)
 * 开门→wealth (+0.8)
 * 休门→health (+0.7)
 * 生门→wealth (+0.8)
 * 伤门→health (-0.6)
 * 杜门→relation (-0.5)
 * 景门→wisdom (+0.7)
 * 死门→life (-0.8)
 * 惊门→spirit (-0.6)
 */
const QIMEN_GATE_MAPPING: Record<string, Partial<Record<FateDimension, number>>> = {
  '开门': { wealth: 16, life: 8, wisdom: 4 },
  '休门': { health: 14, spirit: 8, relation: 4 },
  '生门': { wealth: 16, health: 6, life: 6 },
  '伤门': { health: -12, relation: -6, life: -4 },
  '杜门': { relation: -10, wisdom: -4, spirit: -4 },
  '景门': { wisdom: 14, spirit: 6, life: 4 },
  '死门': { life: -16, health: -10, spirit: -6 },
  '惊门': { spirit: -12, health: -6, relation: -4 },
};

/**
 * 九星→6D辅助修正
 */
const QIMEN_STAR_MAPPING: Record<string, Partial<Record<FateDimension, number>>> = {
  '天心': { wisdom: 6, health: 4 },
  '天蓬': { wealth: 6, life: -3 },
  '天冲': { life: 5, wealth: 3 },
  '天辅': { wisdom: 6, spirit: 4 },
  '天禽': { life: 4, wealth: 4 },
  '天英': { wisdom: 5, spirit: 3 },
  '天任': { health: 5, relation: 3 },
  '天柱': { life: -4, relation: -3 },
  '天芮': { health: -6, life: -3 },
};

export function mapQimenToFateVector(
  gates: Array<{ name: string; palace: number }>,
  stars: Array<{ name: string; palace: number }>,
  zhiFu: string,
  zhiShi: string,
  auspiciousness: string,
): FateVector {
  const fv = emptyVector();
  
  // Apply gate mappings
  for (const gate of gates) {
    const mods = QIMEN_GATE_MAPPING[gate.name];
    if (mods) {
      for (const [dim, val] of Object.entries(mods)) {
        fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + val);
      }
    }
  }

  // Apply star mappings
  for (const star of stars) {
    const mods = QIMEN_STAR_MAPPING[star.name];
    if (mods) {
      for (const [dim, val] of Object.entries(mods)) {
        fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + val * 0.6);
      }
    }
  }

  // Overall auspiciousness modifier
  if (auspiciousness === '大吉' || auspiciousness === '吉') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] + 4);
  } else if (auspiciousness === '凶' || auspiciousness === '大凶') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] - 4);
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 3. 紫微斗数 (Ziwei) → 6D
//    精确十二宫→6D映射
// ═══════════════════════════════════════════════

const ZIWEI_PALACE_MAPPING: Record<string, { primary: FateDimension; secondary?: FateDimension; weight: number }> = {
  '命宫': { primary: 'life', weight: 1.5 },
  '兄弟': { primary: 'relation', secondary: 'spirit', weight: 0.8 },
  '夫妻': { primary: 'relation', weight: 1.3 },
  '子女': { primary: 'relation', secondary: 'health', weight: 0.9 },
  '财帛': { primary: 'wealth', weight: 1.4 },
  '疾厄': { primary: 'health', weight: 1.4 },
  '迁移': { primary: 'life', secondary: 'relation', weight: 0.9 },
  '仆役': { primary: 'relation', weight: 0.7 },
  '官禄': { primary: 'life', secondary: 'wisdom', weight: 1.3 },
  '田宅': { primary: 'wealth', secondary: 'health', weight: 1.0 },
  '福德': { primary: 'spirit', secondary: 'wisdom', weight: 1.2 },
  '父母': { primary: 'relation', secondary: 'spirit', weight: 0.8 },
};

interface ZiweiStar {
  name: string;
  type: 'major' | 'auxiliary' | 'sha';
  brightness: string;
  sihua?: string;
}

interface ZiweiPalace {
  name: string;
  stars: ZiweiStar[];
  isMing?: boolean;
  isShen?: boolean;
}

export function mapZiweiToFateVector(palaces: ZiweiPalace[]): FateVector {
  const fv = emptyVector();
  
  const BRIGHTNESS_SCORE: Record<string, number> = {
    '庙': 10, '旺': 8, '得': 6, '利': 4, '平': 0, '闲': -3, '陷': -6,
  };
  
  const TYPE_WEIGHT: Record<string, number> = {
    major: 1.5, auxiliary: 0.8, sha: -1.0,
  };

  for (const palace of palaces) {
    const mapping = ZIWEI_PALACE_MAPPING[palace.name];
    if (!mapping) continue;

    let palaceScore = 0;
    for (const star of palace.stars) {
      const bri = BRIGHTNESS_SCORE[star.brightness] ?? 0;
      const tw = TYPE_WEIGHT[star.type] ?? 0.5;
      let starScore = bri * tw;
      
      // 四化修正
      if (star.sihua === '禄') starScore += 6;
      if (star.sihua === '权') starScore += 4;
      if (star.sihua === '科') starScore += 3;
      if (star.sihua === '忌') starScore -= 7;
      
      palaceScore += starScore;
    }
    
    palaceScore *= mapping.weight;
    fv[mapping.primary] = clamp(fv[mapping.primary] + palaceScore);
    if (mapping.secondary) {
      fv[mapping.secondary] = clamp(fv[mapping.secondary] + palaceScore * 0.5);
    }
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 4. 八字 (BaZi) → 6D
//    十神→6D精确映射
// ═══════════════════════════════════════════════

/**
 * 十神→6D (from Notion)
 * 正官/七杀 → life (事业权力)
 * 正财/偏财 → wealth
 * 正印/偏印 → wisdom + spirit
 * 食神/伤官 → wisdom (creativity) + relation
 * 比肩/劫财 → health + relation
 */
const TEN_GOD_MAPPING: Record<string, Partial<Record<FateDimension, number>>> = {
  '正官': { life: 8, wisdom: 3, relation: 2 },
  '七杀': { life: 7, health: -3, wisdom: 2 },
  '正财': { wealth: 8, relation: 4 },
  '偏财': { wealth: 7, relation: 3, life: 2 },
  '正印': { wisdom: 8, spirit: 5, health: 3 },
  '偏印': { wisdom: 7, spirit: 4, health: -2 },
  '食神': { wisdom: 5, relation: 4, health: 4, spirit: 3 },
  '伤官': { wisdom: 6, relation: -3, life: -2 },
  '比肩': { health: 5, relation: 3 },
  '劫财': { health: 3, relation: 2, wealth: -4 },
};

interface TenGodInfo {
  tenGod: string;
  stem: string;
  pillar: string;
}

export function mapBaziToFateVector(
  tenGods: TenGodInfo[],
  strengthScore: number,
  favorableElements: string[],
  unfavorableElements: string[],
  elementBalance: Array<{ element: string; percentage: number }>,
  patternType: string,
): FateVector {
  const fv = emptyVector();
  
  // Apply ten god mappings
  for (const tg of tenGods) {
    const mods = TEN_GOD_MAPPING[tg.tenGod];
    if (mods) {
      for (const [dim, val] of Object.entries(mods)) {
        fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + val);
      }
    }
  }

  // Day master strength influence
  const strengthDelta = (strengthScore - 50) * 0.15;
  fv.life = clamp(fv.life + strengthDelta);
  fv.health = clamp(fv.health + strengthDelta * 0.8);

  // Element balance influence
  for (const eb of elementBalance) {
    if (favorableElements.includes(eb.element)) {
      const bonus = eb.percentage * 0.12;
      fv.life = clamp(fv.life + bonus);
      fv.wealth = clamp(fv.wealth + bonus * 0.8);
    }
    if (unfavorableElements.includes(eb.element)) {
      const penalty = eb.percentage * 0.08;
      fv.health = clamp(fv.health - penalty);
      fv.life = clamp(fv.life - penalty * 0.6);
    }
  }

  // Pattern type bonus
  if (patternType === '正格') {
    fv.life = clamp(fv.life + 4);
    fv.wisdom = clamp(fv.wisdom + 3);
  } else if (patternType === '特殊格') {
    fv.life = clamp(fv.life + 6);
    fv.wisdom = clamp(fv.wisdom + 5);
    fv.spirit = clamp(fv.spirit + 4);
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 5. 铁板神数 (Tieban) → 6D
//    十二宫→6D
// ═══════════════════════════════════════════════

interface TiebanPalace {
  name: string;
  clauseStrength: number;
  evaluation: string;
}

export function mapTiebanToFateVector(
  palaces: TiebanPalace[],
  destinyProjection: Record<string, number>,
): FateVector {
  const fv = emptyVector();
  const norm = (v: number) => clamp((v % 1000) / 10);

  // Direct projection mapping
  fv.life = norm(destinyProjection.lifeDestiny ?? 5000);
  fv.wealth = norm(destinyProjection.wealth ?? 5000);
  fv.relation = norm(((destinyProjection.marriage ?? 5000) + (destinyProjection.children ?? 5000)) / 2);
  fv.health = norm(destinyProjection.health ?? 5000);
  fv.wisdom = norm(destinyProjection.career ?? 5000);
  fv.spirit = norm(((destinyProjection.lifeDestiny ?? 5000) + (destinyProjection.health ?? 5000)) / 2);

  // Palace strength refinement
  const PALACE_DIM: Record<string, FateDimension> = {
    '命宫': 'life', '财帛宫': 'wealth', '夫妻宫': 'relation',
    '疾厄宫': 'health', '官禄宫': 'wisdom', '福德宫': 'spirit',
    '子女宫': 'relation', '田宅宫': 'wealth', '兄弟宫': 'relation',
    '迁移宫': 'life', '仆役宫': 'relation', '父母宫': 'spirit',
  };

  for (const palace of palaces) {
    const dim = PALACE_DIM[palace.name];
    if (!dim) continue;
    const mod = (palace.clauseStrength - 50) * 0.2;
    fv[dim] = clamp(fv[dim] + mod);
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 6. Western Astrology → 6D
//    行星品质→6D
// ═══════════════════════════════════════════════

const PLANET_DIM_MAP: Record<string, Partial<Record<FateDimension, number>>> = {
  sun: { life: 1.0, spirit: 0.6 },
  moon: { health: 0.8, relation: 0.6, spirit: 0.4 },
  mercury: { wisdom: 1.0, relation: 0.3 },
  venus: { relation: 1.0, wealth: 0.5, spirit: 0.3 },
  mars: { life: 0.7, health: 0.5 },
  jupiter: { wealth: 0.8, wisdom: 0.6, spirit: 0.5 },
  saturn: { life: 0.5, health: -0.3, wisdom: 0.4 },
};

export function mapWesternToFateVector(
  lifeVectors: Record<string, number>,
  patterns?: Array<{ name: string; type: string }>,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  // Grand pattern bonuses
  if (patterns) {
    for (const p of patterns) {
      if (p.type === 'Grand Trine' || p.name.includes('大三角')) {
        fv.spirit = clamp(fv.spirit + 6);
        fv.wisdom = clamp(fv.wisdom + 4);
      }
      if (p.type === 'T-Square' || p.name.includes('T三角')) {
        fv.life = clamp(fv.life + 5);
        fv.health = clamp(fv.health - 3);
      }
      if (p.name.includes('群星')) {
        fv.life = clamp(fv.life + 4);
      }
    }
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 7. Vedic Astrology → 6D
//    Yoga→6D
// ═══════════════════════════════════════════════

export function mapVedicToFateVector(
  lifeVectors: Record<string, number>,
  yogas: Array<{ name: string; strength?: number }>,
  dashas: Array<{ planet: string; quality: string }>,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  // Yoga bonuses
  for (const yoga of yogas) {
    const name = yoga.name.toLowerCase();
    if (name.includes('raja')) { fv.life = clamp(fv.life + 6); fv.wealth = clamp(fv.wealth + 4); }
    if (name.includes('dhana')) { fv.wealth = clamp(fv.wealth + 7); }
    if (name.includes('budha')) { fv.wisdom = clamp(fv.wisdom + 6); }
    if (name.includes('mahapurusha')) { fv.life = clamp(fv.life + 5); fv.spirit = clamp(fv.spirit + 4); }
    if (name.includes('kemadruma')) { fv.relation = clamp(fv.relation - 6); fv.spirit = clamp(fv.spirit - 4); }
  }

  // Active Dasha quality
  const activeDasha = dashas[0];
  if (activeDasha) {
    if (activeDasha.quality === 'benefic') {
      for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] + 3);
    } else if (activeDasha.quality === 'malefic') {
      fv.health = clamp(fv.health - 4);
      fv.life = clamp(fv.life - 3);
    }
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 8. Numerology → 6D
// ═══════════════════════════════════════════════

export function mapNumerologyToFateVector(
  lifeVectors: Record<string, number>,
  lifePath: number,
  karmicDebt?: number[],
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  // Master numbers boost spirit/wisdom
  if (lifePath === 11 || lifePath === 22 || lifePath === 33) {
    fv.spirit = clamp(fv.spirit + 8);
    fv.wisdom = clamp(fv.wisdom + 5);
  }

  // Karmic debt reduces specific dimensions
  if (karmicDebt?.length) {
    for (const debt of karmicDebt) {
      if (debt === 13) fv.life = clamp(fv.life - 5);
      if (debt === 14) fv.health = clamp(fv.health - 5);
      if (debt === 16) fv.relation = clamp(fv.relation - 5);
      if (debt === 19) fv.spirit = clamp(fv.spirit - 5);
    }
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 9. Mayan Calendar → 6D
// ═══════════════════════════════════════════════

export function mapMayanToFateVector(
  lifeVectors: Record<string, number>,
  earthFamily: string,
  galacticTone: number,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  // Earth family modifiers
  const familyMods: Record<string, Partial<Record<FateDimension, number>>> = {
    'Polar': { spirit: 6, wisdom: 4 },
    'Cardinal': { life: 6, wealth: 4 },
    'Core': { health: 5, relation: 4 },
    'Signal': { wisdom: 6, spirit: 3 },
    'Gateway': { life: 4, relation: 5, spirit: 3 },
  };
  const mods = familyMods[earthFamily];
  if (mods) {
    for (const [dim, val] of Object.entries(mods)) {
      fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + val);
    }
  }

  // Galactic tone modifier (1-13)
  if (galacticTone >= 7) fv.spirit = clamp(fv.spirit + (galacticTone - 6));
  if (galacticTone <= 4) fv.life = clamp(fv.life + (5 - galacticTone));

  return fv;
}

// ═══════════════════════════════════════════════
// 10. Kabbalah → 6D
//     质点→6D
// ═══════════════════════════════════════════════

const SEPHIRAH_MAPPING: Record<string, Partial<Record<FateDimension, number>>> = {
  'Keter': { spirit: 10, wisdom: 5 },
  'Chokmah': { wisdom: 10, spirit: 6 },
  'Binah': { wisdom: 8, health: 4, spirit: 4 },
  'Chesed': { relation: 8, wealth: 5, spirit: 4 },
  'Gevurah': { life: 7, health: -3, wisdom: 4 },
  'Tiferet': { life: 6, relation: 6, health: 6, spirit: 6 },
  'Netzach': { relation: 8, wealth: 4, spirit: 3 },
  'Hod': { wisdom: 7, life: 4, spirit: 3 },
  'Yesod': { spirit: 8, health: 5, relation: 3 },
  'Malkuth': { life: 5, wealth: 5, health: 5 },
};

export function mapKabbalahToFateVector(
  lifeVectors: Record<string, number>,
  soulSephirah: string,
  personalitySephirah: string,
  fourWorldsBalance?: Record<string, number>,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  // Soul sephirah (primary influence)
  const soulMods = SEPHIRAH_MAPPING[soulSephirah];
  if (soulMods) {
    for (const [dim, val] of Object.entries(soulMods)) {
      fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + val);
    }
  }

  // Personality sephirah (secondary)
  const persMods = SEPHIRAH_MAPPING[personalitySephirah];
  if (persMods) {
    for (const [dim, val] of Object.entries(persMods)) {
      fv[dim as FateDimension] = clamp(fv[dim as FateDimension] + val * 0.6);
    }
  }

  // Four Worlds balance modifier
  if (fourWorldsBalance) {
    const atzilut = fourWorldsBalance['Atzilut'] ?? fourWorldsBalance['atzilut'] ?? 0;
    const beriah = fourWorldsBalance['Beriah'] ?? fourWorldsBalance['beriah'] ?? 0;
    const yetzirah = fourWorldsBalance['Yetzirah'] ?? fourWorldsBalance['yetzirah'] ?? 0;
    const assiah = fourWorldsBalance['Assiah'] ?? fourWorldsBalance['assiah'] ?? 0;
    
    fv.spirit = clamp(fv.spirit + atzilut * 0.3);
    fv.wisdom = clamp(fv.wisdom + beriah * 0.3);
    fv.relation = clamp(fv.relation + yetzirah * 0.3);
    fv.life = clamp(fv.life + assiah * 0.3);
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 11. 大六壬 (Liu Ren) → 6D
// ═══════════════════════════════════════════════

export function mapLiuRenToFateVector(
  lifeVectors: Record<string, number>,
  keType: string,
  auspiciousness: string,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  if (auspiciousness === '吉' || auspiciousness === '大吉') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] + 5);
  } else if (auspiciousness === '凶' || auspiciousness === '大凶') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] - 5);
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 12. 太乙神数 (Taiyi) → 6D
// ═══════════════════════════════════════════════

export function mapTaiyiToFateVector(
  lifeVectors: Record<string, number>,
  auspiciousness: string,
  patterns: Array<{ name: string; type: string }>,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  if (auspiciousness === '吉' || auspiciousness === '大吉') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] + 4);
  } else if (auspiciousness === '凶' || auspiciousness === '大凶') {
    for (const dim of ALL_FATE_DIMENSIONS) fv[dim] = clamp(fv[dim] - 4);
  }

  for (const p of patterns) {
    if (p.type === 'auspicious') {
      fv.life = clamp(fv.life + 3);
      fv.spirit = clamp(fv.spirit + 2);
    } else if (p.type === 'inauspicious') {
      fv.life = clamp(fv.life - 3);
      fv.health = clamp(fv.health - 2);
    }
  }

  return fv;
}

// ═══════════════════════════════════════════════
// 13. 梅花易数 (Meihua) → 6D
// ═══════════════════════════════════════════════

export function mapMeihuaToFateVector(
  lifeVectors: Record<string, number>,
  tiYongRelation: string,
): FateVector {
  const g = (k: string) => lifeVectors[k] ?? 50;
  const fv: FateVector = {
    life: clamp((g('career') + g('fortune')) / 2),
    wealth: g('wealth'),
    relation: clamp((g('love') + g('social') + g('family')) / 3),
    health: g('health'),
    wisdom: clamp((g('wisdom') + g('creativity')) / 2),
    spirit: g('spirituality'),
  };

  // 体用关系修正
  if (tiYongRelation === '体生用' || tiYongRelation === '用生体') {
    fv.life = clamp(fv.life + 5);
    fv.wealth = clamp(fv.wealth + 4);
  } else if (tiYongRelation === '体克用') {
    fv.life = clamp(fv.life + 3);
  } else if (tiYongRelation === '用克体') {
    fv.life = clamp(fv.life - 5);
    fv.health = clamp(fv.health - 3);
  }

  return fv;
}
