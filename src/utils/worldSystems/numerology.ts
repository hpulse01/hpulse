/**
 * Numerology Engine (数字命理学)
 *
 * Pythagorean and Chaldean systems combined.
 * Life Path, Birthday, Personal Year, Pinnacles, Challenges, and Cycles.
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
  energy: number; // 0-100
}

export interface NumerologyReport {
  lifePath: number;
  lifePathMeaning: string;
  birthdayNumber: number;
  destinyExpression: number;
  pinnacles: PinnacleInfo[];
  challenges: ChallengeInfo[];
  personalYears: PersonalYearInfo[];
  lifeVectors: Record<string, number>;
}

function reduceToSingle(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n; // master numbers
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

export const NumerologyEngine = {
  calculate(input: NumerologyInput): NumerologyReport {
    // Life Path: reduce full birth date
    const yearSum = reduceToSingle(digitSum(input.year));
    const monthSum = reduceToSingle(input.month);
    const daySum = reduceToSingle(input.day);
    const lifePath = reduceToSingle(yearSum + monthSum + daySum);

    // Birthday Number
    const birthdayNumber = reduceToSingle(input.day);

    // Destiny Expression (from date digits, since no name)
    const allDigits = digitSum(input.year) + digitSum(input.month) + digitSum(input.day);
    const destinyExpression = reduceToSingle(allDigits);

    // Pinnacles (4 periods)
    const firstPinnacleEnd = 36 - lifePath;
    const pinnacles: PinnacleInfo[] = [
      {
        number: reduceToSingle(monthSum + daySum),
        meaning: NUMBER_MEANINGS[reduceToSingle(monthSum + daySum)] || '',
        startAge: 0,
        endAge: Math.max(firstPinnacleEnd, 27),
      },
      {
        number: reduceToSingle(daySum + yearSum),
        meaning: NUMBER_MEANINGS[reduceToSingle(daySum + yearSum)] || '',
        startAge: Math.max(firstPinnacleEnd, 27) + 1,
        endAge: Math.max(firstPinnacleEnd, 27) + 9,
      },
      {
        number: reduceToSingle(reduceToSingle(monthSum + daySum) + reduceToSingle(daySum + yearSum)),
        meaning: '',
        startAge: Math.max(firstPinnacleEnd, 27) + 10,
        endAge: Math.max(firstPinnacleEnd, 27) + 18,
      },
      {
        number: reduceToSingle(monthSum + yearSum),
        meaning: NUMBER_MEANINGS[reduceToSingle(monthSum + yearSum)] || '',
        startAge: Math.max(firstPinnacleEnd, 27) + 19,
        endAge: 99,
      },
    ];
    pinnacles[2].meaning = NUMBER_MEANINGS[pinnacles[2].number] || '';

    // Challenges
    const challenges: ChallengeInfo[] = [
      {
        number: Math.abs(monthSum - daySum) || 0,
        meaning: NUMBER_MEANINGS[Math.abs(monthSum - daySum)] || '无挑战',
        startAge: 0,
        endAge: Math.max(firstPinnacleEnd, 27),
      },
      {
        number: Math.abs(daySum - yearSum) || 0,
        meaning: NUMBER_MEANINGS[Math.abs(daySum - yearSum)] || '无挑战',
        startAge: Math.max(firstPinnacleEnd, 27) + 1,
        endAge: Math.max(firstPinnacleEnd, 27) + 9,
      },
      {
        number: reduceToSingle(Math.abs(Math.abs(monthSum - daySum) - Math.abs(daySum - yearSum))),
        meaning: '',
        startAge: Math.max(firstPinnacleEnd, 27) + 10,
        endAge: Math.max(firstPinnacleEnd, 27) + 18,
      },
      {
        number: Math.abs(monthSum - yearSum) || 0,
        meaning: NUMBER_MEANINGS[Math.abs(monthSum - yearSum)] || '无挑战',
        startAge: Math.max(firstPinnacleEnd, 27) + 19,
        endAge: 99,
      },
    ];
    challenges[2].meaning = NUMBER_MEANINGS[challenges[2].number] || '内在调和';

    // Personal Years for age 1-80
    const personalYears: PersonalYearInfo[] = [];
    for (let age = 1; age <= 80; age++) {
      const calendarYear = input.year + age;
      const pyRaw = digitSum(calendarYear) + input.month + input.day;
      const py = reduceToSingle(pyRaw);
      const pyInfo = PERSONAL_YEAR_ENERGY[py] || PERSONAL_YEAR_ENERGY[reduceToSingle(py)] || { meaning: '过渡', energy: 50 };
      personalYears.push({
        age,
        year: calendarYear,
        number: py,
        meaning: pyInfo.meaning,
        energy: pyInfo.energy,
      });
    }

    // Life vectors based on life path and birthday number
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
    };

    const base = 50;
    const boosts = lpBoost[lifePath] || {};
    const lifeVectors: Record<string, number> = {
      career: clamp(base + (boosts.career || 0)),
      wealth: clamp(base + (boosts.wealth || 0)),
      love: clamp(base + (boosts.love || 0)),
      health: clamp(base + (boosts.health || 0)),
      wisdom: clamp(base + (boosts.wisdom || 0)),
      social: clamp(base + (boosts.social || 0)),
      creativity: clamp(base + (boosts.creativity || 0)),
      fortune: clamp(base + (boosts.fortune || 0)),
      family: clamp(base + (boosts.family || 0)),
      spirituality: clamp(base + (boosts.spirituality || 0)),
    };

    return {
      lifePath,
      lifePathMeaning: NUMBER_MEANINGS[lifePath] || '',
      birthdayNumber,
      destinyExpression,
      pinnacles,
      challenges,
      personalYears,
      lifeVectors,
    };
  },
};

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}
