import { Solar } from 'lunar-typescript';

export interface ZiweiInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
}

export interface ZiweiPalace {
  name: string;
  branch: string;
  index: number;
  isMing: boolean;
  isShen: boolean;
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

const getHourBranchIndex = (hour: number): number => {
  return Math.floor(((hour + 1) % 24) / 2);
};

export const ZiweiEngine = {
  /**
   * 命宫起法：
   * 以寅宫为一，生月顺数至对应宫位，再从该宫起生时顺数。
   * 身宫起法：
   * 从命宫起生时顺数确定身宫。
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

    const palaces = PALACE_ORDER.map((name, index) => {
      const branchIndex = (mingIndex + index) % 12;
      const branch = PALACE_BRANCH_ORDER[branchIndex];
      return {
        name,
        branch,
        index: branchIndex,
        isMing: branchIndex === mingIndex,
        isShen: branchIndex === shenIndex,
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
    };
  },
};
