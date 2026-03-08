/**
 * Mayan Calendar Engine v2.0 (玛雅历法)
 *
 * Upgrades:
 * - Dreamspell Cross (Guide, Analog, Antipode, Occult, Hidden)
 * - Earth Family classification
 * - Color cycle (Red/White/Blue/Yellow)
 * - Castle cycle (5 castles of 52 kins)
 * - Enhanced wavespell analysis
 */

export interface MayanInput {
  year: number;
  month: number;
  day: number;
}

export interface DreamspellCross {
  guide: { sign: string; signCN: string; role: string };
  analog: { sign: string; signCN: string; role: string };
  antipode: { sign: string; signCN: string; role: string };
  occult: { sign: string; signCN: string; role: string };
}

export interface MayanReport {
  kin: number;
  daySign: string;
  daySignCN: string;
  daySignMeaning: string;
  galacticTone: number;
  toneMeaning: string;
  galacticSignature: string;
  haabMonth: string;
  haabDay: number;
  longCount: string;
  wavespell: string;
  color: string;
  colorCN: string;
  earthFamily: string;
  castle: string;
  dreamspellCross: DreamspellCross;
  lifeVectors: Record<string, number>;
}

const DAY_SIGNS: { name: string; cn: string; meaning: string; color: string; earthFamily: string; energy: Record<string, number> }[] = [
  { name: 'Imix', cn: '红龙', meaning: '诞生·滋养·存在', color: 'Red', earthFamily: 'Cardinal', energy: { creativity: 15, family: 10, fortune: 5 } },
  { name: 'Ik', cn: '白风', meaning: '灵感·呼吸·精神', color: 'White', earthFamily: 'Core', energy: { wisdom: 15, spirituality: 12, social: 5 } },
  { name: 'Akbal', cn: '蓝夜', meaning: '梦境·直觉·丰盛', color: 'Blue', earthFamily: 'Signal', energy: { wealth: 12, creativity: 10, wisdom: 8 } },
  { name: 'Kan', cn: '黄种子', meaning: '觉知·靶向·开花', color: 'Yellow', earthFamily: 'Gateway', energy: { career: 12, health: 8, fortune: 8 } },
  { name: 'Chicchan', cn: '红蛇', meaning: '生命力·本能·存活', color: 'Red', earthFamily: 'Cardinal', energy: { health: 15, fortune: 8, creativity: 5 } },
  { name: 'Cimi', cn: '白世界桥', meaning: '机会·死亡·平衡', color: 'White', earthFamily: 'Core', energy: { spirituality: 15, wisdom: 10, love: -5 } },
  { name: 'Manik', cn: '蓝手', meaning: '知识·成就·疗愈', color: 'Blue', earthFamily: 'Signal', energy: { career: 15, health: 10, wisdom: 8 } },
  { name: 'Lamat', cn: '黄星', meaning: '美·优雅·艺术', color: 'Yellow', earthFamily: 'Gateway', energy: { creativity: 15, love: 10, social: 8 } },
  { name: 'Muluc', cn: '红月', meaning: '流动·净化·宇宙水', color: 'Red', earthFamily: 'Cardinal', energy: { love: 12, health: 10, spirituality: 8 } },
  { name: 'Oc', cn: '白狗', meaning: '忠诚·心·爱', color: 'White', earthFamily: 'Core', energy: { love: 15, family: 12, social: 8 } },
  { name: 'Chuen', cn: '蓝猴', meaning: '魔法·幻象·游戏', color: 'Blue', earthFamily: 'Signal', energy: { creativity: 15, social: 10, fortune: 5 } },
  { name: 'Eb', cn: '黄人', meaning: '自由意志·智慧·影响', color: 'Yellow', earthFamily: 'Gateway', energy: { wisdom: 15, career: 8, social: 5 } },
  { name: 'Ben', cn: '红天行者', meaning: '探索·空间·觉醒', color: 'Red', earthFamily: 'Cardinal', energy: { fortune: 12, spirituality: 10, creativity: 8 } },
  { name: 'Ix', cn: '白巫师', meaning: '永恒·受容·超越时间', color: 'White', earthFamily: 'Core', energy: { spirituality: 15, wisdom: 12, health: 5 } },
  { name: 'Men', cn: '蓝鹰', meaning: '视野·心智·创造', color: 'Blue', earthFamily: 'Signal', energy: { wisdom: 15, career: 10, creativity: 8 } },
  { name: 'Cib', cn: '黄战士', meaning: '勇气·质问·智能', color: 'Yellow', earthFamily: 'Gateway', energy: { career: 15, fortune: 10, health: 5 } },
  { name: 'Caban', cn: '红地球', meaning: '进化·导航·同步', color: 'Red', earthFamily: 'Cardinal', energy: { health: 12, family: 10, fortune: 8 } },
  { name: 'Etznab', cn: '白镜', meaning: '无尽·反射·剑', color: 'White', earthFamily: 'Core', energy: { wisdom: 12, spirituality: 10, love: -3 } },
  { name: 'Cauac', cn: '蓝风暴', meaning: '催化·能量·自我生成', color: 'Blue', earthFamily: 'Signal', energy: { fortune: 15, creativity: 10, career: 8 } },
  { name: 'Ahau', cn: '黄太阳', meaning: '启蒙·生命·宇宙火', color: 'Yellow', earthFamily: 'Gateway', energy: { spirituality: 15, fortune: 12, career: 10 } },
];

const TONE_MEANINGS: string[] = [
  '',
  '目的·统一·吸引',
  '挑战·极化·稳定',
  '服务·激活·结合',
  '形式·定义·测量',
  '光辉·赋能·指挥',
  '平衡·组织·平等',
  '共鸣·通道·启发',
  '整合·和谐·模型',
  '意图·脉动·实现',
  '显化·完美·创造',
  '解放·溶解·释放',
  '合作·奉献·复杂',
  '超越·忍耐·存在',
];

const HAAB_MONTHS = [
  'Pop', 'Uo', 'Zip', 'Zotz', 'Tzec', 'Xul', 'Yaxkin', 'Mol',
  'Chen', 'Yax', 'Zac', 'Ceh', 'Mac', 'Kankin', 'Muan', 'Pax',
  'Kayab', 'Cumku', 'Uayeb',
];

const COLOR_CN: Record<string, string> = { Red: '红', White: '白', Blue: '蓝', Yellow: '黄' };

const CASTLES = ['红色东方·转变之城', '白色北方·穿越之城', '蓝色西方·燃烧之城', '黄色南方·给予之城', '绿色中央·魔法之城'];

const CORRELATION = 584283;

function gregorianToJulianDay(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

/** Dreamspell Cross relationships */
function calculateDreamspellCross(signIdx: number, tone: number): DreamspellCross {
  // Guide: determined by tone
  const guideTable: Record<number, number> = { 1: 0, 6: 0, 11: 0, 2: 12, 7: 12, 12: 12, 3: 4, 8: 4, 13: 4, 4: 16, 9: 16, 5: 8, 10: 8 };
  const guideOffset = guideTable[tone] ?? 0;
  const guideIdx = (signIdx + guideOffset) % 20;

  // Analog: +19 or -1 mod 20
  const analogIdx = (signIdx + 19) % 20;

  // Antipode: +10 mod 20
  const antipodeIdx = (signIdx + 10) % 20;

  // Occult: 19 - signIdx
  const occultIdx = (19 - signIdx + 20) % 20;

  return {
    guide: { sign: DAY_SIGNS[guideIdx].name, signCN: DAY_SIGNS[guideIdx].cn, role: '引导·指引方向' },
    analog: { sign: DAY_SIGNS[analogIdx].name, signCN: DAY_SIGNS[analogIdx].cn, role: '类似·支持力量' },
    antipode: { sign: DAY_SIGNS[antipodeIdx].name, signCN: DAY_SIGNS[antipodeIdx].cn, role: '对极·挑战成长' },
    occult: { sign: DAY_SIGNS[occultIdx].name, signCN: DAY_SIGNS[occultIdx].cn, role: '隐秘·潜在天赋' },
  };
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

export const MayanCalendarEngine = {
  calculate(input: MayanInput): MayanReport {
    const jd = gregorianToJulianDay(input.year, input.month, input.day);
    const longCountDays = Math.round(jd - CORRELATION);

    // Tzolkin
    const tzolkinDay = ((longCountDays + 19) % 20 + 20) % 20;
    const tzolkinTone = ((longCountDays - 1) % 13 + 13) % 13 + 1;
    const kin = ((longCountDays % 260) + 260) % 260 + 1;

    const sign = DAY_SIGNS[tzolkinDay];
    const toneMeaning = TONE_MEANINGS[tzolkinTone] || '';
    const galacticSignature = `Kin ${kin}: ${sign.cn} · Tone ${tzolkinTone}`;

    // Haab
    const haabOrdinal = ((longCountDays + 348) % 365 + 365) % 365;
    const haabMonthIdx = Math.floor(haabOrdinal / 20);
    const haabDay = haabOrdinal % 20;
    const haabMonth = HAAB_MONTHS[Math.min(haabMonthIdx, 18)];

    // Long Count
    const rem = longCountDays >= 0 ? longCountDays : 0;
    const baktun = Math.floor(rem / 144000);
    const katun = Math.floor((rem % 144000) / 7200);
    const tun = Math.floor((rem % 7200) / 360);
    const uinal = Math.floor((rem % 360) / 20);
    const lcKin = rem % 20;
    const longCount = `${baktun}.${katun}.${tun}.${uinal}.${lcKin}`;

    // Wavespell
    const wavespellStart = Math.floor((kin - 1) / 13) * 13;
    const wavespellSign = DAY_SIGNS[wavespellStart % 20];
    const wavespell = `${wavespellSign.cn}波符`;

    // Castle (5 castles of 52 kins)
    const castleIdx = Math.floor((kin - 1) / 52) % 5;
    const castle = CASTLES[castleIdx];

    // Dreamspell Cross
    const dreamspellCross = calculateDreamspellCross(tzolkinDay, tzolkinTone);

    // Life vectors
    const base = 50;
    const crossBonus = 3; // Bonus for having a dreamspell cross analysis
    const lifeVectors: Record<string, number> = {
      career: clamp(base + (sign.energy.career || 0) + tzolkinTone * 0.5 + crossBonus),
      wealth: clamp(base + (sign.energy.wealth || 0) + tzolkinTone * 0.3),
      love: clamp(base + (sign.energy.love || 0) + tzolkinTone * 0.4),
      health: clamp(base + (sign.energy.health || 0) + tzolkinTone * 0.3),
      wisdom: clamp(base + (sign.energy.wisdom || 0) + tzolkinTone * 0.5 + crossBonus),
      social: clamp(base + (sign.energy.social || 0) + tzolkinTone * 0.3),
      creativity: clamp(base + (sign.energy.creativity || 0) + tzolkinTone * 0.4),
      fortune: clamp(base + (sign.energy.fortune || 0) + tzolkinTone * 0.5),
      family: clamp(base + (sign.energy.family || 0) + tzolkinTone * 0.3),
      spirituality: clamp(base + (sign.energy.spirituality || 0) + tzolkinTone * 0.5 + crossBonus),
    };

    return {
      kin, daySign: sign.name, daySignCN: sign.cn, daySignMeaning: sign.meaning,
      galacticTone: tzolkinTone, toneMeaning, galacticSignature,
      haabMonth, haabDay, longCount, wavespell,
      color: sign.color, colorCN: COLOR_CN[sign.color] || sign.color,
      earthFamily: sign.earthFamily, castle,
      dreamspellCross, lifeVectors,
    };
  },
};
