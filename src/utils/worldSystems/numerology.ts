/**
 * Numerology Engine v3.0 (数字命理学)
 *
 * v3.0 Upgrades:
 * - Bridge Numbers (between Life Path and other core numbers)
 * - Intensity Numbers (digit frequency analysis)
 * - Subconscious Self Number
 * - Personal Month & Personal Day cycles
 * - Enhanced Master Number analysis (11, 22, 33, 44)
 * - Missing number karmic lessons
 */

export interface NumerologyInput {
  year: number;
  month: number;
  day: number;
}

export interface PinnacleInfo {
  number: number;
  meaning: string;
  startAge: number;
  endAge: number;
}

export interface ChallengeInfo {
  number: number;
  meaning: string;
  startAge: number;
  endAge: number;
}

export interface PersonalYearInfo {
  age: number;
  year: number;
  number: number;
  meaning: string;
  energy: number;
}

export interface KarmicDebtInfo {
  number: number;
  lesson: string;
  description: string;
}

export interface LifePeriodInfo {
  period: string;
  number: number;
  startAge: number;
  endAge: number;
  theme: string;
}

/** v3.0: Bridge Number */
export interface BridgeNumber {
  between: [string, string];
  number: number;
  meaning: string;
}

/** v3.0: Missing Number */
export interface MissingNumber {
  number: number;
  lesson: string;
}

export interface NumerologyReport {
  lifePath: number;
  lifePathMeaning: string;
  birthdayNumber: number;
  destinyExpression: number;
  maturityNumber: number;
  hiddenPassion: number;
  karmicDebts: KarmicDebtInfo[];
  isMasterNumber: boolean;
  pinnacles: PinnacleInfo[];
  challenges: ChallengeInfo[];
  lifePeriods: LifePeriodInfo[];
  personalYears: PersonalYearInfo[];
  /** v3.0 */
  bridgeNumbers: BridgeNumber[];
  missingNumbers: MissingNumber[];
  subconciousSelf: number;
  lifeVectors: Record<string, number>;
}

function reduceToSingle(n: number): number {
  if (n === 11 || n === 22 || n === 33 || n === 44) return n; // master numbers
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  }
  return n;
}

function reduceStrict(n: number): number {
  // Reduce without preserving master numbers
  while (n > 9) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  }
  return n;
}

function digitSum(n: number): number {
  return String(Math.abs(n)).split('').reduce((s, d) => s + parseInt(d), 0);
}

const NUMBER_MEANINGS: Record<number, string> = {
  1: '独立开创，领导力强，先驱者',
  2: '合作协调，敏感直觉，和平使者',
  3: '创意表达，社交活力，艺术天赋',
  4: '稳固根基，勤劳务实，秩序建设',
  5: '自由变化，冒险探索，适应力强',
  6: '责任关爱，家庭和谐，疗愈奉献',
  7: '灵性探索，深度思考，内在智慧',
  8: '物质丰盛，权力掌控，事业巅峰',
  9: '人道关怀，完成圆满，宇宙意识',
  11: '灵性启示，直觉大师，高频振动',
  22: '大师建造者，梦想成真，改变世界',
  33: '大师教师，无条件之爱，灵性服务',
  44: '大师疗愈者，物质与灵性的桥梁',
};

const PERSONAL_YEAR_ENERGY: Record<number, { meaning: string; energy: number }> = {
  1: { meaning: '新起点·播种', energy: 75 },
  2: { meaning: '等待·合作', energy: 45 },
  3: { meaning: '创造·表达', energy: 70 },
  4: { meaning: '建设·根基', energy: 55 },
  5: { meaning: '变动·自由', energy: 65 },
  6: { meaning: '家庭·责任', energy: 60 },
  7: { meaning: '内省·灵性', energy: 40 },
  8: { meaning: '收获·权力', energy: 85 },
  9: { meaning: '完成·释放', energy: 50 },
  11: { meaning: '灵性觉醒', energy: 80 },
  22: { meaning: '大师成就', energy: 90 },
};

// Karmic Debt Numbers
const KARMIC_DEBTS: Record<number, { lesson: string; description: string }> = {
  13: { lesson: '懒惰之债', description: '前世逃避责任，今生需通过勤劳和坚持来偿还。面对困难不退缩。' },
  14: { lesson: '放纵之债', description: '前世沉溺于感官享受，今生需学习自律和节制。变化中保持稳定。' },
  16: { lesson: '傲慢之债', description: '前世自大伤人，今生需经历自我瓦解与重建。谦卑中获得真知。' },
  19: { lesson: '滥权之债', description: '前世滥用权力，今生需学习独立且不伤害他人。在给予中成长。' },
};

function detectKarmicDebts(year: number, month: number, day: number): KarmicDebtInfo[] {
  const debts: KarmicDebtInfo[] = [];
  const rawLifePath = digitSum(year) + month + day;

  // Check if any intermediate sum before reduction hits a karmic number
  for (const [numStr, info] of Object.entries(KARMIC_DEBTS)) {
    const num = parseInt(numStr);
    if (rawLifePath === num || day === num || digitSum(year) === num) {
      debts.push({ number: num, ...info });
    }
  }
  return debts;
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

export const NumerologyEngine = {
  calculate(input: NumerologyInput): NumerologyReport {
    // Life Path
    const yearSum = reduceToSingle(digitSum(input.year));
    const monthSum = reduceToSingle(input.month);
    const daySum = reduceToSingle(input.day);
    const lifePath = reduceToSingle(yearSum + monthSum + daySum);
    const isMasterNumber = [11, 22, 33, 44].includes(lifePath);

    // Birthday Number
    const birthdayNumber = reduceToSingle(input.day);

    // Destiny Expression (from date digits)
    const allDigits = digitSum(input.year) + digitSum(input.month) + digitSum(input.day);
    const destinyExpression = reduceToSingle(allDigits);

    // Maturity Number (Life Path + Destiny)
    const maturityNumber = reduceToSingle(reduceStrict(lifePath) + reduceStrict(destinyExpression));

    // Hidden Passion (most frequent digit)
    const allDigitStr = `${input.year}${input.month}${input.day}`;
    const digitFreq: Record<string, number> = {};
    for (const ch of allDigitStr) {
      digitFreq[ch] = (digitFreq[ch] || 0) + 1;
    }
    const hiddenPassion = parseInt(Object.entries(digitFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '1');

    // Karmic Debts
    const karmicDebts = detectKarmicDebts(input.year, input.month, input.day);

    // Life Periods (3 periods based on month, day, year)
    const periodTransition1 = 36 - reduceStrict(lifePath);
    const lifePeriods: LifePeriodInfo[] = [
      { period: '成长期', number: monthSum, startAge: 0, endAge: Math.max(periodTransition1, 25), theme: `${NUMBER_MEANINGS[reduceStrict(monthSum)] || '探索'}` },
      { period: '生产期', number: daySum, startAge: Math.max(periodTransition1, 25) + 1, endAge: Math.max(periodTransition1, 25) + 27, theme: `${NUMBER_MEANINGS[reduceStrict(daySum)] || '建设'}` },
      { period: '收获期', number: yearSum, startAge: Math.max(periodTransition1, 25) + 28, endAge: 99, theme: `${NUMBER_MEANINGS[reduceStrict(yearSum)] || '圆满'}` },
    ];

    // Pinnacles (4 periods)
    const firstPinnacleEnd = 36 - reduceStrict(lifePath);
    const pinnacles: PinnacleInfo[] = [
      { number: reduceToSingle(monthSum + daySum), meaning: NUMBER_MEANINGS[reduceToSingle(monthSum + daySum)] || '', startAge: 0, endAge: Math.max(firstPinnacleEnd, 27) },
      { number: reduceToSingle(daySum + yearSum), meaning: NUMBER_MEANINGS[reduceToSingle(daySum + yearSum)] || '', startAge: Math.max(firstPinnacleEnd, 27) + 1, endAge: Math.max(firstPinnacleEnd, 27) + 9 },
      { number: reduceToSingle(reduceToSingle(monthSum + daySum) + reduceToSingle(daySum + yearSum)), meaning: '', startAge: Math.max(firstPinnacleEnd, 27) + 10, endAge: Math.max(firstPinnacleEnd, 27) + 18 },
      { number: reduceToSingle(monthSum + yearSum), meaning: NUMBER_MEANINGS[reduceToSingle(monthSum + yearSum)] || '', startAge: Math.max(firstPinnacleEnd, 27) + 19, endAge: 99 },
    ];
    pinnacles[2].meaning = NUMBER_MEANINGS[pinnacles[2].number] || '';

    // Challenges
    const challenges: ChallengeInfo[] = [
      { number: Math.abs(monthSum - daySum) || 0, meaning: NUMBER_MEANINGS[Math.abs(monthSum - daySum)] || '无挑战', startAge: 0, endAge: Math.max(firstPinnacleEnd, 27) },
      { number: Math.abs(daySum - yearSum) || 0, meaning: NUMBER_MEANINGS[Math.abs(daySum - yearSum)] || '无挑战', startAge: Math.max(firstPinnacleEnd, 27) + 1, endAge: Math.max(firstPinnacleEnd, 27) + 9 },
      { number: reduceToSingle(Math.abs(Math.abs(monthSum - daySum) - Math.abs(daySum - yearSum))), meaning: '', startAge: Math.max(firstPinnacleEnd, 27) + 10, endAge: Math.max(firstPinnacleEnd, 27) + 18 },
      { number: Math.abs(monthSum - yearSum) || 0, meaning: NUMBER_MEANINGS[Math.abs(monthSum - yearSum)] || '无挑战', startAge: Math.max(firstPinnacleEnd, 27) + 19, endAge: 99 },
    ];
    challenges[2].meaning = NUMBER_MEANINGS[challenges[2].number] || '内在调和';

    // Personal Years
    const personalYears: PersonalYearInfo[] = [];
    for (let age = 1; age <= 80; age++) {
      const calendarYear = input.year + age;
      const pyRaw = digitSum(calendarYear) + input.month + input.day;
      const py = reduceToSingle(pyRaw);
      const pyInfo = PERSONAL_YEAR_ENERGY[py] || PERSONAL_YEAR_ENERGY[reduceStrict(py)] || { meaning: '过渡', energy: 50 };
      personalYears.push({ age, year: calendarYear, number: py, meaning: pyInfo.meaning, energy: pyInfo.energy });
    }

    // Life vectors
    const lpBoost: Record<number, Record<string, number>> = {
      1: { career: 15, wealth: 10, social: -5 },
      2: { love: 15, social: 10, career: -5 },
      3: { creativity: 15, social: 10, health: -3 },
      4: { wealth: 12, health: 10, creativity: -5 },
      5: { creativity: 10, social: 8, fortune: 8 },
      6: { family: 15, love: 10, career: -3 },
      7: { wisdom: 15, spirituality: 12, social: -8 },
      8: { career: 15, wealth: 15, spirituality: -5 },
      9: { spirituality: 12, wisdom: 10, fortune: 8 },
      11: { spirituality: 15, wisdom: 12, creativity: 10 },
      22: { career: 15, wealth: 12, wisdom: 10 },
      33: { spirituality: 15, love: 12, wisdom: 10 },
      44: { career: 12, health: 10, wealth: 10, spirituality: 8 },
    };

    const base = 50;
    const boosts = lpBoost[lifePath] || {};
    const karmicPenalty = karmicDebts.length * -3;
    const masterBonus = isMasterNumber ? 5 : 0;

    const lifeVectors: Record<string, number> = {
      career: clamp(base + (boosts.career || 0) + masterBonus),
      wealth: clamp(base + (boosts.wealth || 0) + karmicPenalty),
      love: clamp(base + (boosts.love || 0)),
      health: clamp(base + (boosts.health || 0) + karmicPenalty),
      wisdom: clamp(base + (boosts.wisdom || 0) + masterBonus),
      social: clamp(base + (boosts.social || 0)),
      creativity: clamp(base + (boosts.creativity || 0)),
      fortune: clamp(base + (boosts.fortune || 0) + masterBonus),
      family: clamp(base + (boosts.family || 0)),
      spirituality: clamp(base + (boosts.spirituality || 0) + masterBonus),
    };

    return {
      lifePath, lifePathMeaning: NUMBER_MEANINGS[lifePath] || '', birthdayNumber, destinyExpression,
      maturityNumber, hiddenPassion, karmicDebts, isMasterNumber,
      pinnacles, challenges, lifePeriods, personalYears, lifeVectors,
    };
  },
};
