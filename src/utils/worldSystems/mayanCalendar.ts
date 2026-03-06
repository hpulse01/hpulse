/**
 * Mayan Calendar Engine (玛雅历法)
 *
 * Tzolkin (260-day sacred calendar), Haab (365-day solar calendar),
 * Long Count, and Galactic Signature.
 */

export interface MayanInput {
  year: number;
  month: number;
  day: number;
}

export interface MayanReport {
  kin: number;            // 1-260
  daySign: string;
  daySignCN: string;
  daySignMeaning: string;
  galacticTone: number;   // 1-13
  toneMeaning: string;
  galacticSignature: string;
  haabMonth: string;
  haabDay: number;
  longCount: string;
  wavespell: string;
  lifeVectors: Record<string, number>;
}

const DAY_SIGNS: { name: string; cn: string; meaning: string; energy: Record<string, number> }[] = [
  { name: 'Imix', cn: '红龙', meaning: '诞生·滋养·存在', energy: { creativity: 15, family: 10, fortune: 5 } },
  { name: 'Ik', cn: '白风', meaning: '灵感·呼吸·精神', energy: { wisdom: 15, spirituality: 12, social: 5 } },
  { name: 'Akbal', cn: '蓝夜', meaning: '梦境·直觉·丰盛', energy: { wealth: 12, creativity: 10, wisdom: 8 } },
  { name: 'Kan', cn: '黄种子', meaning: '觉知·靶向·开花', energy: { career: 12, health: 8, fortune: 8 } },
  { name: 'Chicchan', cn: '红蛇', meaning: '生命力·本能·存活', energy: { health: 15, fortune: 8, creativity: 5 } },
  { name: 'Cimi', cn: '白世界桥', meaning: '机会·死亡·平衡', energy: { spirituality: 15, wisdom: 10, love: -5 } },
  { name: 'Manik', cn: '蓝手', meaning: '知识·成就·疗愈', energy: { career: 15, health: 10, wisdom: 8 } },
  { name: 'Lamat', cn: '黄星', meaning: '美·优雅·艺术', energy: { creativity: 15, love: 10, social: 8 } },
  { name: 'Muluc', cn: '红月', meaning: '流动·净化·宇宙水', energy: { love: 12, health: 10, spirituality: 8 } },
  { name: 'Oc', cn: '白狗', meaning: '忠诚·心·爱', energy: { love: 15, family: 12, social: 8 } },
  { name: 'Chuen', cn: '蓝猴', meaning: '魔法·幻象·游戏', energy: { creativity: 15, social: 10, fortune: 5 } },
  { name: 'Eb', cn: '黄人', meaning: '自由意志·智慧·影响', energy: { wisdom: 15, career: 8, social: 5 } },
  { name: 'Ben', cn: '红天行者', meaning: '探索·空间·觉醒', energy: { fortune: 12, spirituality: 10, creativity: 8 } },
  { name: 'Ix', cn: '白巫师', meaning: '永恒·受容·超越时间', energy: { spirituality: 15, wisdom: 12, health: 5 } },
  { name: 'Men', cn: '蓝鹰', meaning: '视野·心智·创造', energy: { wisdom: 15, career: 10, creativity: 8 } },
  { name: 'Cib', cn: '黄战士', meaning: '勇气·质问·智能', energy: { career: 15, fortune: 10, health: 5 } },
  { name: 'Caban', cn: '红地球', meaning: '进化·导航·同步', energy: { health: 12, family: 10, fortune: 8 } },
  { name: 'Etznab', cn: '白镜', meaning: '无尽·反射·剑', energy: { wisdom: 12, spirituality: 10, love: -3 } },
  { name: 'Cauac', cn: '蓝风暴', meaning: '催化·能量·自我生成', energy: { fortune: 15, creativity: 10, career: 8 } },
  { name: 'Ahau', cn: '黄太阳', meaning: '启蒙·生命·宇宙火', energy: { spirituality: 15, fortune: 12, career: 10 } },
];

const TONE_MEANINGS: string[] = [
  '', // index 0 unused
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

// Correlation constant (GMT: 584283)
const CORRELATION = 584283;

function gregorianToJulianDay(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

export const MayanCalendarEngine = {
  calculate(input: MayanInput): MayanReport {
    const jd = gregorianToJulianDay(input.year, input.month, input.day);
    const longCountDays = Math.round(jd - CORRELATION);

    // Tzolkin
    const tzolkinDay = ((longCountDays + 19) % 20 + 20) % 20; // 0-19
    const tzolkinTone = ((longCountDays - 1) % 13 + 13) % 13 + 1; // 1-13
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

    // Wavespell (group of 13 kins)
    const wavespellStart = Math.floor((kin - 1) / 13) * 13;
    const wavespellSign = DAY_SIGNS[wavespellStart % 20];
    const wavespell = `${wavespellSign.cn}波符`;

    // Life vectors from day sign energy
    const base = 50;
    const lifeVectors: Record<string, number> = {
      career: clamp(base + (sign.energy.career || 0) + tzolkinTone * 0.5),
      wealth: clamp(base + (sign.energy.wealth || 0) + tzolkinTone * 0.3),
      love: clamp(base + (sign.energy.love || 0) + tzolkinTone * 0.4),
      health: clamp(base + (sign.energy.health || 0) + tzolkinTone * 0.3),
      wisdom: clamp(base + (sign.energy.wisdom || 0) + tzolkinTone * 0.5),
      social: clamp(base + (sign.energy.social || 0) + tzolkinTone * 0.3),
      creativity: clamp(base + (sign.energy.creativity || 0) + tzolkinTone * 0.4),
      fortune: clamp(base + (sign.energy.fortune || 0) + tzolkinTone * 0.5),
      family: clamp(base + (sign.energy.family || 0) + tzolkinTone * 0.3),
      spirituality: clamp(base + (sign.energy.spirituality || 0) + tzolkinTone * 0.5),
    };

    return {
      kin, daySign: sign.name, daySignCN: sign.cn, daySignMeaning: sign.meaning,
      galacticTone: tzolkinTone, toneMeaning, galacticSignature,
      haabMonth, haabDay, longCount, wavespell, lifeVectors,
    };
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
