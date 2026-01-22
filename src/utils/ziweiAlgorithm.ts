import { Solar } from 'lunar-typescript';

export interface ZiweiInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
}

export interface ZiweiStar {
  name: string;
  type: 'major' | 'minor' | 'auxiliary';
  brightness: '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷';
  group: 'ziwei' | 'tianfu';
}

export interface ZiweiPalace {
  name: string;
  branch: string;
  index: number;
  isMing: boolean;
  isShen: boolean;
  stars: ZiweiStar[];
}

export interface ZiweiReport {
  solarDate: string;
  lunarDate: string;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourBranch: string;
  mingGong: string;
  shenGong: string;
  palaces: ZiweiPalace[];
  wuxingju: { name: string; number: number };
  ziweiPosition: number;
  tianfuPosition: number;
}

const PALACE_ORDER = [
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '仆役',
  '官禄',
  '田宅',
  '福德',
  '父母',
];

const PALACE_BRANCH_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
const HOUR_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 五行局对照表 [天干索引][地支索引] => 五行局名称
// 根据命宫天干地支确定五行局
const WUXING_JU_TABLE: Record<string, Record<string, { name: string; number: number }>> = {
  '甲': { '子': { name: '水二局', number: 2 }, '丑': { name: '水二局', number: 2 }, '寅': { name: '火六局', number: 6 }, '卯': { name: '火六局', number: 6 }, '辰': { name: '木三局', number: 3 }, '巳': { name: '木三局', number: 3 }, '午': { name: '金四局', number: 4 }, '未': { name: '金四局', number: 4 }, '申': { name: '土五局', number: 5 }, '酉': { name: '土五局', number: 5 }, '戌': { name: '火六局', number: 6 }, '亥': { name: '火六局', number: 6 } },
  '己': { '子': { name: '水二局', number: 2 }, '丑': { name: '水二局', number: 2 }, '寅': { name: '火六局', number: 6 }, '卯': { name: '火六局', number: 6 }, '辰': { name: '木三局', number: 3 }, '巳': { name: '木三局', number: 3 }, '午': { name: '金四局', number: 4 }, '未': { name: '金四局', number: 4 }, '申': { name: '土五局', number: 5 }, '酉': { name: '土五局', number: 5 }, '戌': { name: '火六局', number: 6 }, '亥': { name: '火六局', number: 6 } },
  '乙': { '子': { name: '火六局', number: 6 }, '丑': { name: '火六局', number: 6 }, '寅': { name: '金四局', number: 4 }, '卯': { name: '金四局', number: 4 }, '辰': { name: '水二局', number: 2 }, '巳': { name: '水二局', number: 2 }, '午': { name: '木三局', number: 3 }, '未': { name: '木三局', number: 3 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '土五局', number: 5 }, '亥': { name: '土五局', number: 5 } },
  '庚': { '子': { name: '火六局', number: 6 }, '丑': { name: '火六局', number: 6 }, '寅': { name: '金四局', number: 4 }, '卯': { name: '金四局', number: 4 }, '辰': { name: '水二局', number: 2 }, '巳': { name: '水二局', number: 2 }, '午': { name: '木三局', number: 3 }, '未': { name: '木三局', number: 3 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '土五局', number: 5 }, '亥': { name: '土五局', number: 5 } },
  '丙': { '子': { name: '土五局', number: 5 }, '丑': { name: '土五局', number: 5 }, '寅': { name: '水二局', number: 2 }, '卯': { name: '水二局', number: 2 }, '辰': { name: '火六局', number: 6 }, '巳': { name: '火六局', number: 6 }, '午': { name: '土五局', number: 5 }, '未': { name: '土五局', number: 5 }, '申': { name: '木三局', number: 3 }, '酉': { name: '木三局', number: 3 }, '戌': { name: '金四局', number: 4 }, '亥': { name: '金四局', number: 4 } },
  '辛': { '子': { name: '土五局', number: 5 }, '丑': { name: '土五局', number: 5 }, '寅': { name: '水二局', number: 2 }, '卯': { name: '水二局', number: 2 }, '辰': { name: '火六局', number: 6 }, '巳': { name: '火六局', number: 6 }, '午': { name: '土五局', number: 5 }, '未': { name: '土五局', number: 5 }, '申': { name: '木三局', number: 3 }, '酉': { name: '木三局', number: 3 }, '戌': { name: '金四局', number: 4 }, '亥': { name: '金四局', number: 4 } },
  '丁': { '子': { name: '木三局', number: 3 }, '丑': { name: '木三局', number: 3 }, '寅': { name: '土五局', number: 5 }, '卯': { name: '土五局', number: 5 }, '辰': { name: '金四局', number: 4 }, '巳': { name: '金四局', number: 4 }, '午': { name: '水二局', number: 2 }, '未': { name: '水二局', number: 2 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '木三局', number: 3 }, '亥': { name: '木三局', number: 3 } },
  '壬': { '子': { name: '木三局', number: 3 }, '丑': { name: '木三局', number: 3 }, '寅': { name: '土五局', number: 5 }, '卯': { name: '土五局', number: 5 }, '辰': { name: '金四局', number: 4 }, '巳': { name: '金四局', number: 4 }, '午': { name: '水二局', number: 2 }, '未': { name: '水二局', number: 2 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '木三局', number: 3 }, '亥': { name: '木三局', number: 3 } },
  '戊': { '子': { name: '金四局', number: 4 }, '丑': { name: '金四局', number: 4 }, '寅': { name: '木三局', number: 3 }, '卯': { name: '木三局', number: 3 }, '辰': { name: '土五局', number: 5 }, '巳': { name: '土五局', number: 5 }, '午': { name: '火六局', number: 6 }, '未': { name: '火六局', number: 6 }, '申': { name: '水二局', number: 2 }, '酉': { name: '水二局', number: 2 }, '戌': { name: '水二局', number: 2 }, '亥': { name: '水二局', number: 2 } },
  '癸': { '子': { name: '金四局', number: 4 }, '丑': { name: '金四局', number: 4 }, '寅': { name: '木三局', number: 3 }, '卯': { name: '木三局', number: 3 }, '辰': { name: '土五局', number: 5 }, '巳': { name: '土五局', number: 5 }, '午': { name: '火六局', number: 6 }, '未': { name: '火六局', number: 6 }, '申': { name: '水二局', number: 2 }, '酉': { name: '水二局', number: 2 }, '戌': { name: '水二局', number: 2 }, '亥': { name: '水二局', number: 2 } },
};

// 十四主星名称
const FOURTEEN_MAIN_STARS = [
  '紫微', '天机', '太阳', '武曲', '天同', '廉贞', // 紫微星系
  '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军', // 天府星系
];

// 紫微星系各星相对紫微的位置偏移（逆时针）
const ZIWEI_GROUP_OFFSETS: Record<string, number> = {
  '紫微': 0,
  '天机': -1,
  '太阳': -3,
  '武曲': -4,
  '天同': -5,
  '廉贞': -8,
};

// 天府星系各星相对天府的位置偏移（顺时针）
const TIANFU_GROUP_OFFSETS: Record<string, number> = {
  '天府': 0,
  '太阴': 1,
  '贪狼': 2,
  '巨门': 3,
  '天相': 4,
  '天梁': 5,
  '七杀': 6,
  '破军': 10,
};

// 星曜亮度表 [星名][地支索引] => 亮度
const STAR_BRIGHTNESS: Record<string, Record<string, '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷'>> = {
  '紫微': { '子': '旺', '丑': '庙', '寅': '庙', '卯': '陷', '辰': '得', '巳': '旺', '午': '庙', '未': '庙', '申': '陷', '酉': '平', '戌': '旺', '亥': '庙' },
  '天机': { '子': '庙', '丑': '陷', '寅': '旺', '卯': '庙', '辰': '平', '巳': '平', '午': '庙', '未': '陷', '申': '旺', '酉': '庙', '戌': '平', '亥': '平' },
  '太阳': { '子': '陷', '丑': '陷', '寅': '平', '卯': '庙', '辰': '旺', '巳': '庙', '午': '旺', '未': '得', '申': '得', '酉': '平', '戌': '陷', '亥': '陷' },
  '武曲': { '子': '旺', '丑': '庙', '寅': '陷', '卯': '平', '辰': '庙', '巳': '陷', '午': '利', '未': '庙', '申': '陷', '酉': '平', '戌': '庙', '亥': '陷' },
  '天同': { '子': '庙', '丑': '陷', '寅': '平', '卯': '陷', '辰': '平', '巳': '庙', '午': '平', '未': '陷', '申': '平', '酉': '陷', '戌': '平', '亥': '庙' },
  '廉贞': { '子': '平', '丑': '庙', '寅': '庙', '卯': '利', '辰': '陷', '巳': '平', '午': '利', '未': '庙', '申': '庙', '酉': '利', '戌': '陷', '亥': '平' },
  '天府': { '子': '庙', '丑': '庙', '寅': '旺', '卯': '旺', '辰': '庙', '巳': '庙', '午': '庙', '未': '旺', '申': '旺', '酉': '庙', '戌': '庙', '亥': '庙' },
  '太阴': { '子': '庙', '丑': '旺', '寅': '平', '卯': '陷', '辰': '陷', '巳': '陷', '午': '陷', '未': '陷', '申': '平', '酉': '得', '戌': '旺', '亥': '庙' },
  '贪狼': { '子': '旺', '丑': '平', '寅': '庙', '卯': '陷', '辰': '庙', '巳': '陷', '午': '旺', '未': '平', '申': '庙', '酉': '陷', '戌': '庙', '亥': '陷' },
  '巨门': { '子': '庙', '丑': '陷', '寅': '庙', '卯': '庙', '辰': '平', '巳': '陷', '午': '旺', '未': '陷', '申': '庙', '酉': '庙', '戌': '平', '亥': '陷' },
  '天相': { '子': '庙', '丑': '庙', '寅': '陷', '卯': '平', '辰': '旺', '巳': '陷', '午': '庙', '未': '庙', '申': '陷', '酉': '平', '戌': '旺', '亥': '陷' },
  '天梁': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '平', '巳': '陷', '午': '旺', '未': '庙', '申': '庙', '酉': '庙', '戌': '平', '亥': '陷' },
  '七杀': { '子': '旺', '丑': '庙', '寅': '庙', '卯': '平', '辰': '庙', '巳': '陷', '午': '旺', '未': '庙', '申': '庙', '酉': '平', '戌': '庙', '亥': '陷' },
  '破军': { '子': '旺', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '庙', '巳': '陷', '午': '旺', '未': '陷', '申': '庙', '酉': '陷', '戌': '庙', '亥': '陷' },
};

const getHourBranchIndex = (hour: number): number => {
  return Math.floor(((hour + 1) % 24) / 2);
};

// 根据年干获取命宫天干
const getMingGongGan = (yearGan: string, mingBranchIndex: number): string => {
  const yearGanIndex = HEAVENLY_STEMS.indexOf(yearGan);
  // 起寅首天干
  const yinGanIndex = (yearGanIndex * 2 + 2) % 10;
  // 命宫天干
  return HEAVENLY_STEMS[(yinGanIndex + mingBranchIndex) % 10];
};

// 计算紫微星位置
const calculateZiweiPosition = (lunarDay: number, bureauNumber: number): number => {
  // 紫微星定位公式
  const quotient = Math.ceil(lunarDay / bureauNumber);
  const remainder = (bureauNumber - (lunarDay % bureauNumber)) % bureauNumber;
  
  let position = quotient;
  if (remainder % 2 === 0) {
    position = (quotient + remainder - 1) % 12;
  } else {
    position = (quotient - remainder - 1 + 12) % 12;
  }
  
  return position;
};

// 计算天府星位置（与紫微关于寅-申轴对称）
const calculateTianfuPosition = (ziweiPosition: number): number => {
  // 寅=0, 申=6 为轴心
  // 天府位置 = (12 - 紫微位置) % 12 简化为关于寅申轴的对称
  return (12 - ziweiPosition) % 12;
};

export const ZiweiEngine = {
  /**
   * 命宫起法：
   * 以寅宫为一，生月顺数至对应宫位，再从该宫起生时顺数。
   * 身宫起法：
   * 从命宫起生时顺数确定身宫。
   * 十四主星排布：根据五行局和农历日期计算
   */
  generateReport: (input: ZiweiInput): ZiweiReport => {
    const solar = Solar.fromYmd(input.year, input.month, input.day);
    const lunar = solar.getLunar();
    const lunarMonthRaw = lunar.getMonth();
    const lunarMonth = Math.abs(lunarMonthRaw);
    const lunarDay = lunar.getDay();
    const isLeapMonth = lunarMonthRaw < 0;

    const hourBranchIndex = getHourBranchIndex(input.hour);
    const hourBranch = HOUR_BRANCHES[hourBranchIndex];
    const hourIndex = hourBranchIndex + 1;

    const mingIndex = (lunarMonth + hourIndex - 1) % 12;
    const mingGongBranch = PALACE_BRANCH_ORDER[mingIndex];
    const shenIndex = (mingIndex + hourIndex - 1) % 12;
    const shenGongBranch = PALACE_BRANCH_ORDER[shenIndex];

    // 获取年干
    const yearGan = lunar.getYearGan();
    // 获取命宫天干
    const mingGan = getMingGongGan(yearGan, mingIndex);
    
    // 确定五行局
    const wuxingju = WUXING_JU_TABLE[mingGan]?.[mingGongBranch] || { name: '水二局', number: 2 };
    
    // 计算紫微星位置
    const ziweiPosition = calculateZiweiPosition(lunarDay, wuxingju.number);
    
    // 计算天府星位置
    const tianfuPosition = calculateTianfuPosition(ziweiPosition);
    
    // 初始化宫位星曜
    const palaceStars: ZiweiStar[][] = Array(12).fill(null).map(() => []);
    
    // 安紫微星系
    Object.entries(ZIWEI_GROUP_OFFSETS).forEach(([starName, offset]) => {
      const position = ((ziweiPosition + offset) % 12 + 12) % 12;
      const branch = PALACE_BRANCH_ORDER[position];
      palaceStars[position].push({
        name: starName,
        type: 'major',
        brightness: STAR_BRIGHTNESS[starName]?.[branch] || '平',
        group: 'ziwei',
      });
    });
    
    // 安天府星系
    Object.entries(TIANFU_GROUP_OFFSETS).forEach(([starName, offset]) => {
      const position = ((tianfuPosition + offset) % 12 + 12) % 12;
      const branch = PALACE_BRANCH_ORDER[position];
      palaceStars[position].push({
        name: starName,
        type: 'major',
        brightness: STAR_BRIGHTNESS[starName]?.[branch] || '平',
        group: 'tianfu',
      });
    });

    const palaces = PALACE_ORDER.map((name, index) => {
      const branchIndex = (mingIndex + index) % 12;
      const branch = PALACE_BRANCH_ORDER[branchIndex];
      return {
        name,
        branch,
        index: branchIndex,
        isMing: branchIndex === mingIndex,
        isShen: branchIndex === shenIndex,
        stars: palaceStars[branchIndex] || [],
      };
    });

    return {
      solarDate: `${input.year}年${input.month}月${input.day}日`,
      lunarDate: `${lunar.getYear()}年${isLeapMonth ? '闰' : ''}${lunarMonth}月${lunarDay}日`,
      lunarMonth,
      lunarDay,
      isLeapMonth,
      yearGanZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      hourBranch,
      mingGong: mingGongBranch,
      shenGong: shenGongBranch,
      palaces,
      wuxingju,
      ziweiPosition,
      tianfuPosition,
    };
  },
};
