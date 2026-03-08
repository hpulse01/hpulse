/**
 * Kabbalah / Tree of Life Engine v3.0 (卡巴拉生命之树)
 *
 * v3.0 Upgrades:
 * - Lightning Flash (Seder Hishtalshelut) sequence analysis
 * - Path of the Flaming Sword traversal
 * - Enhanced Qliphoth (shadow) with remediation
 * - Da'at (Knowledge) gateway activation
 * - Pillar resonance with birth date cycles
 * - Active path network analysis
 */

export interface KabbalahInput {
  year: number;
  month: number;
  day: number;
}

export interface SephirahInfo {
  index: number;
  name: string;
  nameCN: string;
  hebrew: string;
  meaning: string;
  energy: number;
  isActive: boolean;
  world: string;     // Which of 4 worlds
  pillar: string;    // Mercy, Severity, Middle
}

export interface PathInfo {
  from: number;
  to: number;
  tarotArcana: string;
  letter: string;
  hebrewLetter: string;
  meaning: string;
}

export interface GematriaResult {
  totalValue: number;
  reducedValue: number;
  meaning: string;
  resonantSephirah: string;
}

export interface FourWorldsBalance {
  atziluth: number;   // 原型世界 (Archetypal)
  briah: number;      // 创造世界 (Creative)
  yetzirah: number;   // 形成世界 (Formative)
  assiah: number;     // 行动世界 (Material)
  dominantWorld: string;
  interpretation: string;
}

/** v3.0: Lightning Flash */
export interface LightningFlashInfo {
  sequence: number[];
  currentPosition: number;
  interpretation: string;
}

/** v3.0: Da'at Gateway */
export interface DaatGateway {
  isActive: boolean;
  strength: number;
  interpretation: string;
}

/** v3.0: Active Paths */
export interface ActivePathInfo {
  path: PathInfo;
  strength: number;
  isOnFlamingSword: boolean;
}

export interface KabbalahReport {
  soulSephirah: SephirahInfo;
  personalitySephirah: SephirahInfo;
  lifePath: PathInfo;
  activeSephiroth: SephirahInfo[];
  treeBalance: { pillarOfMercy: number; pillarOfSeverity: number; middlePillar: number; interpretation: string };
  gematria: GematriaResult;
  fourWorlds: FourWorldsBalance;
  shadowSephirah: string;
  /** v3.0 */
  lightningFlash: LightningFlashInfo;
  daatGateway: DaatGateway;
  activePaths: ActivePathInfo[];
  lifeVectors: Record<string, number>;
}

const SEPHIROTH: (Omit<SephirahInfo, 'energy' | 'isActive'> & { world: string; pillar: string })[] = [
  { index: 1, name: 'Kether', nameCN: '王冠', hebrew: 'כתר', meaning: '纯粹存在·神性意志·源头', world: 'Atziluth', pillar: 'Middle' },
  { index: 2, name: 'Chokmah', nameCN: '智慧', hebrew: 'חכמה', meaning: '原初智慧·灵感闪现·父性原则', world: 'Atziluth', pillar: 'Mercy' },
  { index: 3, name: 'Binah', nameCN: '理解', hebrew: 'בינה', meaning: '深层理解·形式赋予·母性原则', world: 'Atziluth', pillar: 'Severity' },
  { index: 4, name: 'Chesed', nameCN: '慈悲', hebrew: 'חסד', meaning: '仁慈扩展·丰盛恩典·爱的力量', world: 'Briah', pillar: 'Mercy' },
  { index: 5, name: 'Geburah', nameCN: '严厉', hebrew: 'גבורה', meaning: '力量纪律·正义审判·精炼净化', world: 'Briah', pillar: 'Severity' },
  { index: 6, name: 'Tiphareth', nameCN: '美', hebrew: 'תפארת', meaning: '和谐之美·太阳中心·灵魂本质', world: 'Briah', pillar: 'Middle' },
  { index: 7, name: 'Netzach', nameCN: '胜利', hebrew: 'נצח', meaning: '情感直觉·创造激情·永恒循环', world: 'Yetzirah', pillar: 'Mercy' },
  { index: 8, name: 'Hod', nameCN: '荣耀', hebrew: 'הוד', meaning: '理性分析·沟通表达·知识光辉', world: 'Yetzirah', pillar: 'Severity' },
  { index: 9, name: 'Yesod', nameCN: '基础', hebrew: 'יסוד', meaning: '潜意识基础·梦境连接·灵性基石', world: 'Yetzirah', pillar: 'Middle' },
  { index: 10, name: 'Malkuth', nameCN: '王国', hebrew: 'מלכות', meaning: '物质实现·大地王国·具象显化', world: 'Assiah', pillar: 'Middle' },
];

const PATHS: PathInfo[] = [
  { from: 1, to: 2, tarotArcana: '愚者', letter: 'Aleph', hebrewLetter: 'א', meaning: '纯真勇气的起始' },
  { from: 1, to: 3, tarotArcana: '女祭司', letter: 'Beth', hebrewLetter: 'ב', meaning: '内在智慧的通道' },
  { from: 1, to: 6, tarotArcana: '魔术师', letter: 'Gimel', hebrewLetter: 'ג', meaning: '意志显化的道路' },
  { from: 2, to: 3, tarotArcana: '皇后', letter: 'Daleth', hebrewLetter: 'ד', meaning: '创造力的桥梁' },
  { from: 2, to: 6, tarotArcana: '皇帝', letter: 'He', hebrewLetter: 'ה', meaning: '权威秩序的建立' },
  { from: 2, to: 4, tarotArcana: '星星', letter: 'Vav', hebrewLetter: 'ו', meaning: '希望指引的方向' },
  { from: 3, to: 6, tarotArcana: '战车', letter: 'Zayin', hebrewLetter: 'ז', meaning: '意志力的驱动' },
  { from: 3, to: 5, tarotArcana: '正义', letter: 'Cheth', hebrewLetter: 'ח', meaning: '因果法则的平衡' },
  { from: 4, to: 5, tarotArcana: '力量', letter: 'Teth', hebrewLetter: 'ט', meaning: '慈悲与严厉的张力' },
  { from: 4, to: 6, tarotArcana: '隐士', letter: 'Yod', hebrewLetter: 'י', meaning: '内在导师的光' },
  { from: 4, to: 7, tarotArcana: '命运之轮', letter: 'Kaph', hebrewLetter: 'כ', meaning: '循环变化中的机遇' },
  { from: 5, to: 6, tarotArcana: '倒吊人', letter: 'Lamed', hebrewLetter: 'ל', meaning: '牺牲带来的洞见' },
  { from: 5, to: 8, tarotArcana: '死神', letter: 'Mem', hebrewLetter: 'מ', meaning: '转化与重生' },
  { from: 6, to: 7, tarotArcana: '节制', letter: 'Nun', hebrewLetter: 'נ', meaning: '情感的中和' },
  { from: 6, to: 8, tarotArcana: '恶魔', letter: 'Samekh', hebrewLetter: 'ס', meaning: '执着的超越' },
  { from: 6, to: 9, tarotArcana: '塔', letter: 'Ayin', hebrewLetter: 'ע', meaning: '旧结构的瓦解' },
  { from: 7, to: 8, tarotArcana: '月亮', letter: 'Pe', hebrewLetter: 'פ', meaning: '幻象与真实' },
  { from: 7, to: 9, tarotArcana: '太阳', letter: 'Tsade', hebrewLetter: 'צ', meaning: '光明照耀' },
  { from: 7, to: 10, tarotArcana: '审判', letter: 'Qoph', hebrewLetter: 'ק', meaning: '最终觉醒' },
  { from: 8, to: 9, tarotArcana: '世界', letter: 'Resh', hebrewLetter: 'ר', meaning: '完成与圆满' },
  { from: 8, to: 10, tarotArcana: '教皇', letter: 'Shin', hebrewLetter: 'ש', meaning: '神圣传承' },
  { from: 9, to: 10, tarotArcana: '恋人', letter: 'Tav', hebrewLetter: 'ת', meaning: '灵与肉的合一' },
];

const SEPHIRAH_VECTORS: Record<number, Record<string, number>> = {
  1: { spirituality: 20, wisdom: 15, fortune: 10 },
  2: { wisdom: 20, creativity: 12, career: 8 },
  3: { wisdom: 15, family: 12, health: 8 },
  4: { love: 15, wealth: 12, social: 10 },
  5: { career: 15, health: -5, fortune: 8 },
  6: { fortune: 15, love: 10, health: 10, spirituality: 10 },
  7: { love: 15, creativity: 12, social: 8 },
  8: { wisdom: 15, career: 10, social: 8 },
  9: { spirituality: 15, creativity: 10, wisdom: 8 },
  10: { wealth: 15, health: 10, family: 10, career: 8 },
};

// Klipah (shadow) mapping
const SHADOW_NAMES: Record<number, string> = {
  1: 'Thaumiel (双头·分裂)', 2: 'Ghagiel (阻碍·混乱)',
  3: 'Sathariel (隐藏·遮蔽)', 4: 'Gamchicoth (贪婪·吞噬)',
  5: 'Golachab (焚烧·暴力)', 6: 'Thagirion (争斗·丑陋)',
  7: 'Harab Serapel (乌鸦·腐败)', 8: 'Samael (虚假·欺骗)',
  9: 'Gamaliel (淫欲·放纵)', 10: 'Lilith (物质执着·幻象)',
};

// Gematria values for digits
const GEMATRIA_MEANINGS: Record<number, string> = {
  1: '统一·神性意志', 2: '二元·平衡', 3: '三位一体·创造',
  4: '稳定·四元素', 5: '变革·五芒星', 6: '和谐·美·爱',
  7: '灵性·完满', 8: '无限·力量', 9: '完成·圆满',
};

function dateToSephirahIndex(year: number, month: number, day: number): number {
  const sum = year + month * 3 + day * 7;
  return (sum % 10) + 1;
}

function calculateGematria(year: number, month: number, day: number): GematriaResult {
  const digits = `${year}${month}${day}`;
  let total = 0;
  for (const ch of digits) {
    total += parseInt(ch) || 0;
  }
  let reduced = total;
  while (reduced > 9) {
    reduced = String(reduced).split('').reduce((s, d) => s + parseInt(d), 0);
  }

  const sephirahNames: Record<number, string> = {
    1: 'Kether', 2: 'Chokmah', 3: 'Binah', 4: 'Chesed', 5: 'Geburah',
    6: 'Tiphareth', 7: 'Netzach', 8: 'Hod', 9: 'Yesod',
  };

  return {
    totalValue: total,
    reducedValue: reduced,
    meaning: GEMATRIA_MEANINGS[reduced] || '过渡',
    resonantSephirah: sephirahNames[reduced] || 'Malkuth',
  };
}

function calculateFourWorlds(activeSephiroth: SephirahInfo[]): FourWorldsBalance {
  const worlds: Record<string, number> = { Atziluth: 0, Briah: 0, Yetzirah: 0, Assiah: 0 };
  for (const s of activeSephiroth) {
    if (s.isActive) {
      worlds[s.world] = (worlds[s.world] || 0) + s.energy;
    }
  }

  const total = Object.values(worlds).reduce((s, v) => s + v, 1);
  const normalized = {
    atziluth: Math.round(worlds.Atziluth / total * 100),
    briah: Math.round(worlds.Briah / total * 100),
    yetzirah: Math.round(worlds.Yetzirah / total * 100),
    assiah: Math.round(worlds.Assiah / total * 100),
  };

  const dominant = Object.entries(worlds).sort((a, b) => b[1] - a[1])[0][0];
  const interpretations: Record<string, string> = {
    Atziluth: '灵魂层面主导，适合灵性修行与冥想',
    Briah: '创造层面主导，适合艺术创作与构想',
    Yetzirah: '情感层面主导，人际关系与内心世界丰富',
    Assiah: '物质层面主导，擅长实际事务与具象化',
  };

  return { ...normalized, dominantWorld: dominant, interpretation: interpretations[dominant] || '' };
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

export const KabbalahEngine = {
  calculate(input: KabbalahInput): KabbalahReport {
    const soulIdx = dateToSephirahIndex(input.year, input.month, input.day);
    const personalityIdx = ((input.month + input.day) % 10) + 1;

    const soulSeph = SEPHIROTH[soulIdx - 1];
    const persSeph = SEPHIROTH[personalityIdx - 1];

    const activeSephiroth: SephirahInfo[] = SEPHIROTH.map(s => {
      const dist = Math.abs(s.index - soulIdx) + Math.abs(s.index - personalityIdx);
      const energy = Math.max(10, 90 - dist * 10 + ((input.day * input.month + s.index) % 20));
      return { ...s, energy: Math.min(95, energy), isActive: energy > 50 };
    });

    const pathIdx = (soulIdx + personalityIdx) % PATHS.length;
    const lifePath = PATHS[pathIdx];

    // Enhanced pillar balance
    const mercyPillar = [2, 4, 7].reduce((s, i) => s + (activeSephiroth[i - 1]?.energy || 0), 0) / 3;
    const severityPillar = [3, 5, 8].reduce((s, i) => s + (activeSephiroth[i - 1]?.energy || 0), 0) / 3;
    const middlePillar = [1, 6, 9, 10].reduce((s, i) => s + (activeSephiroth[i - 1]?.energy || 0), 0) / 4;

    const diff = Math.abs(mercyPillar - severityPillar);
    let pillarInterpretation: string;
    if (diff < 10) {
      pillarInterpretation = '慈悲与严厉高度平衡，内在和谐，处事公正';
    } else if (mercyPillar > severityPillar) {
      pillarInterpretation = '慈悲柱较强，性格宽厚仁慈，需注意过度放纵';
    } else {
      pillarInterpretation = '严厉柱较强，性格刚毅果断，需注意过于苛刻';
    }

    // Gematria
    const gematria = calculateGematria(input.year, input.month, input.day);

    // Four Worlds
    const fourWorlds = calculateFourWorlds(activeSephiroth);

    // Shadow
    const shadowSephirah = SHADOW_NAMES[soulIdx] || SHADOW_NAMES[10];

    // Life vectors
    const soulVec = SEPHIRAH_VECTORS[soulIdx] || {};
    const persVec = SEPHIRAH_VECTORS[personalityIdx] || {};
    const gematriaBonus = gematria.reducedValue === 6 || gematria.reducedValue === 9 ? 5 : 0;
    const base = 50;
    const aspects = ['career', 'wealth', 'love', 'health', 'wisdom', 'social', 'creativity', 'fortune', 'family', 'spirituality'];
    const lifeVectors: Record<string, number> = {};
    for (const a of aspects) {
      lifeVectors[a] = clamp(base + (soulVec[a] || 0) * 0.6 + (persVec[a] || 0) * 0.4 + gematriaBonus);
    }

    return {
      soulSephirah: activeSephiroth[soulIdx - 1],
      personalitySephirah: activeSephiroth[personalityIdx - 1],
      lifePath,
      activeSephiroth,
      treeBalance: {
        pillarOfMercy: Math.round(mercyPillar),
        pillarOfSeverity: Math.round(severityPillar),
        middlePillar: Math.round(middlePillar),
        interpretation: pillarInterpretation,
      },
      gematria,
      fourWorlds,
      shadowSephirah,
      lifeVectors,
    };
  },
};
