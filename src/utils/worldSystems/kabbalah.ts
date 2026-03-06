/**
 * Kabbalah / Tree of Life Engine (卡巴拉生命之树)
 *
 * Maps birth data to Sephiroth positions, paths, and spiritual archetypes.
 */

export interface KabbalahInput {
  year: number;
  month: number;
  day: number;
}

export interface SephirahInfo {
  index: number;        // 1-10
  name: string;
  nameCN: string;
  hebrew: string;
  meaning: string;
  energy: number;       // 0-100 resonance
  isActive: boolean;
}

export interface PathInfo {
  from: number;
  to: number;
  tarotArcana: string;
  letter: string;
  meaning: string;
}

export interface KabbalahReport {
  soulSephirah: SephirahInfo;
  personalitySephirah: SephirahInfo;
  lifePath: PathInfo;
  activeSephiroth: SephirahInfo[];
  treeBalance: { pillarOfMercy: number; pillarOfSeverity: number; middlePillar: number };
  lifeVectors: Record<string, number>;
}

const SEPHIROTH: Omit<SephirahInfo, 'energy' | 'isActive'>[] = [
  { index: 1, name: 'Kether', nameCN: '王冠', hebrew: 'כתר', meaning: '纯粹存在·神性意志·源头' },
  { index: 2, name: 'Chokmah', nameCN: '智慧', hebrew: 'חכמה', meaning: '原初智慧·灵感闪现·父性原则' },
  { index: 3, name: 'Binah', nameCN: '理解', hebrew: 'בינה', meaning: '深层理解·形式赋予·母性原则' },
  { index: 4, name: 'Chesed', nameCN: '慈悲', hebrew: 'חסד', meaning: '仁慈扩展·丰盛恩典·爱的力量' },
  { index: 5, name: 'Geburah', nameCN: '严厉', hebrew: 'גבורה', meaning: '力量纪律·正义审判·精炼净化' },
  { index: 6, name: 'Tiphareth', nameCN: '美', hebrew: 'תפארת', meaning: '和谐之美·太阳中心·灵魂本质' },
  { index: 7, name: 'Netzach', nameCN: '胜利', hebrew: 'נצח', meaning: '情感直觉·创造激情·永恒循环' },
  { index: 8, name: 'Hod', nameCN: '荣耀', hebrew: 'הוד', meaning: '理性分析·沟通表达·知识光辉' },
  { index: 9, name: 'Yesod', nameCN: '基础', hebrew: 'יסוד', meaning: '潜意识基础·梦境连接·灵性基石' },
  { index: 10, name: 'Malkuth', nameCN: '王国', hebrew: 'מלכות', meaning: '物质实现·大地王国·具象显化' },
];

const PATHS: PathInfo[] = [
  { from: 1, to: 2, tarotArcana: '愚者', letter: 'Aleph', meaning: '纯真勇气的起始' },
  { from: 1, to: 3, tarotArcana: '女祭司', letter: 'Beth', meaning: '内在智慧的通道' },
  { from: 1, to: 6, tarotArcana: '魔术师', letter: 'Gimel', meaning: '意志显化的道路' },
  { from: 2, to: 3, tarotArcana: '皇后', letter: 'Daleth', meaning: '创造力的桥梁' },
  { from: 2, to: 6, tarotArcana: '皇帝', letter: 'He', meaning: '权威秩序的建立' },
  { from: 2, to: 4, tarotArcana: '星星', letter: 'Vav', meaning: '希望指引的方向' },
  { from: 3, to: 6, tarotArcana: '战车', letter: 'Zayin', meaning: '意志力的驱动' },
  { from: 3, to: 5, tarotArcana: '正义', letter: 'Cheth', meaning: '因果法则的平衡' },
  { from: 4, to: 5, tarotArcana: '力量', letter: 'Teth', meaning: '慈悲与严厉的张力' },
  { from: 4, to: 6, tarotArcana: '隐士', letter: 'Yod', meaning: '内在导师的光' },
  { from: 4, to: 7, tarotArcana: '命运之轮', letter: 'Kaph', meaning: '循环变化中的机遇' },
  { from: 5, to: 6, tarotArcana: '倒吊人', letter: 'Lamed', meaning: '牺牲带来的洞见' },
  { from: 5, to: 8, tarotArcana: '死神', letter: 'Mem', meaning: '转化与重生' },
  { from: 6, to: 7, tarotArcana: '节制', letter: 'Nun', meaning: '情感的中和' },
  { from: 6, to: 8, tarotArcana: '恶魔', letter: 'Samekh', meaning: '执着的超越' },
  { from: 6, to: 9, tarotArcana: '塔', letter: 'Ayin', meaning: '旧结构的瓦解' },
  { from: 7, to: 8, tarotArcana: '月亮', letter: 'Pe', meaning: '幻象与真实' },
  { from: 7, to: 9, tarotArcana: '太阳', letter: 'Tsade', meaning: '光明照耀' },
  { from: 7, to: 10, tarotArcana: '审判', letter: 'Qoph', meaning: '最终觉醒' },
  { from: 8, to: 9, tarotArcana: '世界', letter: 'Resh', meaning: '完成与圆满' },
  { from: 8, to: 10, tarotArcana: '教皇', letter: 'Shin', meaning: '神圣传承' },
  { from: 9, to: 10, tarotArcana: '恋人', letter: 'Tav', meaning: '灵与肉的合一' },
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

function dateToSephirahIndex(year: number, month: number, day: number): number {
  const sum = year + month * 3 + day * 7;
  return (sum % 10) + 1;
}

export const KabbalahEngine = {
  calculate(input: KabbalahInput): KabbalahReport {
    const soulIdx = dateToSephirahIndex(input.year, input.month, input.day);
    const personalityIdx = ((input.month + input.day) % 10) + 1;

    const soulSeph = SEPHIROTH[soulIdx - 1];
    const persSeph = SEPHIROTH[personalityIdx - 1];

    // Active sephiroth based on birth resonance
    const activeSephiroth: SephirahInfo[] = SEPHIROTH.map(s => {
      const dist = Math.abs(s.index - soulIdx) + Math.abs(s.index - personalityIdx);
      const energy = Math.max(10, 90 - dist * 10 + ((input.day * input.month + s.index) % 20));
      return { ...s, energy: Math.min(95, energy), isActive: energy > 50 };
    });

    // Life path (connecting soul to personality through tree)
    const pathIdx = (soulIdx + personalityIdx) % PATHS.length;
    const lifePath = PATHS[pathIdx];

    // Pillar balance
    const mercyPillar = [2, 4, 7].reduce((s, i) => s + (activeSephiroth[i - 1]?.energy || 0), 0) / 3;
    const severityPillar = [3, 5, 8].reduce((s, i) => s + (activeSephiroth[i - 1]?.energy || 0), 0) / 3;
    const middlePillar = [1, 6, 9, 10].reduce((s, i) => s + (activeSephiroth[i - 1]?.energy || 0), 0) / 4;

    // Life vectors
    const soulVec = SEPHIRAH_VECTORS[soulIdx] || {};
    const persVec = SEPHIRAH_VECTORS[personalityIdx] || {};
    const base = 50;
    const aspects = ['career', 'wealth', 'love', 'health', 'wisdom', 'social', 'creativity', 'fortune', 'family', 'spirituality'];
    const lifeVectors: Record<string, number> = {};
    for (const a of aspects) {
      lifeVectors[a] = clamp(base + (soulVec[a] || 0) * 0.6 + (persVec[a] || 0) * 0.4);
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
      },
      lifeVectors,
    };
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
