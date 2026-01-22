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
  type: 'major' | 'minor' | 'auxiliary' | 'sha';
  brightness: '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷';
  group: 'ziwei' | 'tianfu' | 'auxiliary' | 'sha';
  sihua?: '禄' | '权' | '科' | '忌';
}

export interface SihuaInfo {
  star: string;
  transform: '禄' | '权' | '科' | '忌';
  meaning: string;
}

export interface ZiweiPalace {
  name: string;
  branch: string;
  index: number;
  isMing: boolean;
  isShen: boolean;
  stars: ZiweiStar[];
}

// 大限信息
export interface DaxianInfo {
  startAge: number;
  endAge: number;
  palaceName: string;
  branch: string;
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
  sihua: SihuaInfo[];
  auxiliaryStars: string[];
  daxian: DaxianInfo[]; // 大限列表
  startDaxianAge: number; // 起运年龄
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

// 四化飞星表 - 根据年干确定四化
const SIHUA_TABLE: Record<string, { 禄: string; 权: string; 科: string; 忌: string }> = {
  '甲': { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
  '乙': { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
  '丙': { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
  '丁': { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
  '戊': { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' },
  '己': { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
  '庚': { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
  '辛': { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
  '壬': { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
  '癸': { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' },
};

// 四化含义
const SIHUA_MEANINGS: Record<string, string> = {
  '禄': '主财禄、机遇、顺利',
  '权': '主权力、掌控、决断',
  '科': '主声名、贵人、学业',
  '忌': '主阻碍、是非、波折',
};

// 五行局对照表 [天干索引][地支索引] => 五行局名称
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

// 辅星名称
const AUXILIARY_STARS = ['左辅', '右弼', '文昌', '文曲', '天魁', '天钺', '禄存', '天马', '擎羊', '陀罗', '火星', '铃星'];

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
  // 辅星亮度（简化版）
  '左辅': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '旺', '巳': '庙', '午': '庙', '未': '旺', '申': '庙', '酉': '庙', '戌': '旺', '亥': '庙' },
  '右弼': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '旺', '巳': '庙', '午': '庙', '未': '旺', '申': '庙', '酉': '庙', '戌': '旺', '亥': '庙' },
  '文昌': { '子': '庙', '丑': '得', '寅': '庙', '卯': '平', '辰': '陷', '巳': '庙', '午': '旺', '未': '平', '申': '庙', '酉': '平', '戌': '陷', '亥': '庙' },
  '文曲': { '子': '庙', '丑': '平', '寅': '陷', '卯': '庙', '辰': '旺', '巳': '平', '午': '庙', '未': '平', '申': '陷', '酉': '庙', '戌': '旺', '亥': '平' },
  '天魁': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '庙', '辰': '庙', '巳': '庙', '午': '庙', '未': '庙', '申': '庙', '酉': '庙', '戌': '庙', '亥': '庙' },
  '天钺': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '庙', '辰': '庙', '巳': '庙', '午': '庙', '未': '庙', '申': '庙', '酉': '庙', '戌': '庙', '亥': '庙' },
  '禄存': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '庙', '辰': '庙', '巳': '庙', '午': '庙', '未': '庙', '申': '庙', '酉': '庙', '戌': '庙', '亥': '庙' },
  '天马': { '子': '平', '丑': '平', '寅': '庙', '卯': '平', '辰': '平', '巳': '庙', '午': '平', '未': '平', '申': '庙', '酉': '平', '戌': '平', '亥': '庙' },
  '擎羊': { '子': '陷', '丑': '庙', '寅': '陷', '卯': '陷', '辰': '庙', '巳': '陷', '午': '陷', '未': '庙', '申': '陷', '酉': '陷', '戌': '庙', '亥': '陷' },
  '陀罗': { '子': '陷', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '陷', '巳': '庙', '午': '陷', '未': '陷', '申': '庙', '酉': '陷', '戌': '陷', '亥': '庙' },
  '火星': { '子': '陷', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '陷', '巳': '庙', '午': '旺', '未': '陷', '申': '陷', '酉': '庙', '戌': '陷', '亥': '陷' },
  '铃星': { '子': '陷', '丑': '陷', '寅': '陷', '卯': '庙', '辰': '陷', '巳': '陷', '午': '陷', '未': '庙', '申': '陷', '酉': '陷', '戌': '陷', '亥': '庙' },
};

// 禄存安星表（根据年干）
const LUCUN_TABLE: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

// 擎羊安星表（禄存+1位）
const QINGYANG_TABLE: Record<string, string> = {
  '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午',
  '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑',
};

// 陀罗安星表（禄存-1位）
const TUOLUO_TABLE: Record<string, string> = {
  '甲': '丑', '乙': '寅', '丙': '辰', '丁': '巳', '戊': '辰',
  '己': '巳', '庚': '未', '辛': '申', '壬': '戌', '癸': '亥',
};

// 天魁安星表（根据年干）
const TIANKUI_TABLE: Record<string, string> = {
  '甲': '丑', '戊': '丑', '庚': '丑',
  '乙': '子', '己': '子',
  '丙': '亥', '丁': '亥',
  '辛': '午', '壬': '卯', '癸': '卯',
};

// 天钺安星表（根据年干）
const TIANYUE_TABLE: Record<string, string> = {
  '甲': '未', '戊': '未', '庚': '未',
  '乙': '申', '己': '申',
  '丙': '酉', '丁': '酉',
  '辛': '寅', '壬': '巳', '癸': '巳',
};

// 天马安星表（根据年支）
const TIANMA_TABLE: Record<string, string> = {
  '寅': '巳', '午': '巳', '戌': '巳',
  '申': '亥', '子': '亥', '辰': '亥',
  '巳': '申', '酉': '申', '丑': '申',
  '亥': '寅', '卯': '寅', '未': '寅',
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
  return (12 - ziweiPosition) % 12;
};

// 计算左辅位置（从辰位起正月，顺数至生月）
const calculateZuofu = (lunarMonth: number): number => {
  const chenIndex = 2; // 辰位在PALACE_BRANCH_ORDER中的索引
  return (chenIndex + lunarMonth - 1) % 12;
};

// 计算右弼位置（从戌位起正月，逆数至生月）
const calculateYoubi = (lunarMonth: number): number => {
  const xuIndex = 8; // 戌位在PALACE_BRANCH_ORDER中的索引
  return (xuIndex - lunarMonth + 1 + 12) % 12;
};

// 计算文昌位置（从戌位起子时，逆数至生时）
const calculateWenchang = (hourBranchIndex: number): number => {
  const xuIndex = 8;
  return (xuIndex - hourBranchIndex + 12) % 12;
};

// 计算文曲位置（从辰位起子时，顺数至生时）
const calculateWenqu = (hourBranchIndex: number): number => {
  const chenIndex = 2;
  return (chenIndex + hourBranchIndex) % 12;
};

// 计算火星位置
const calculateHuoxing = (yearBranch: string, hourBranchIndex: number): number => {
  const yinGroup = ['寅', '午', '戌'];
  const shenGroup = ['申', '子', '辰'];
  const siGroup = ['巳', '酉', '丑'];
  const haiGroup = ['亥', '卯', '未'];
  
  let startIndex: number;
  if (yinGroup.includes(yearBranch)) startIndex = 2; // 寅
  else if (shenGroup.includes(yearBranch)) startIndex = 2; // 寅
  else if (siGroup.includes(yearBranch)) startIndex = 4; // 辰(卯+1)
  else startIndex = 8; // 戌(酉+1)
  
  return (startIndex + hourBranchIndex) % 12;
};

// 计算铃星位置
const calculateLingxing = (yearBranch: string, hourBranchIndex: number): number => {
  const yinGroup = ['寅', '午', '戌'];
  const shenGroup = ['申', '子', '辰'];
  
  let startIndex: number;
  if (yinGroup.includes(yearBranch) || shenGroup.includes(yearBranch)) {
    startIndex = 4; // 辰(卯+1)
  } else {
    startIndex = 8; // 戌(酉+1)
  }
  
  return (startIndex + hourBranchIndex) % 12;
};

export const ZiweiEngine = {
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

    // 获取年干支
    const yearGan = lunar.getYearGan();
    const yearZhi = lunar.getYearZhi();
    
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
    
    // 获取四化信息
    const sihuaConfig = SIHUA_TABLE[yearGan];
    const sihuaList: SihuaInfo[] = [];
    
    if (sihuaConfig) {
      (['禄', '权', '科', '忌'] as const).forEach(transform => {
        const starName = sihuaConfig[transform];
        sihuaList.push({
          star: starName,
          transform,
          meaning: SIHUA_MEANINGS[transform],
        });
      });
    }
    
    // 安紫微星系（带四化）
    Object.entries(ZIWEI_GROUP_OFFSETS).forEach(([starName, offset]) => {
      const position = ((ziweiPosition + offset) % 12 + 12) % 12;
      const branch = PALACE_BRANCH_ORDER[position];
      const sihua = sihuaList.find(s => s.star === starName)?.transform;
      palaceStars[position].push({
        name: starName,
        type: 'major',
        brightness: STAR_BRIGHTNESS[starName]?.[branch] || '平',
        group: 'ziwei',
        sihua,
      });
    });
    
    // 安天府星系（带四化）
    Object.entries(TIANFU_GROUP_OFFSETS).forEach(([starName, offset]) => {
      const position = ((tianfuPosition + offset) % 12 + 12) % 12;
      const branch = PALACE_BRANCH_ORDER[position];
      const sihua = sihuaList.find(s => s.star === starName)?.transform;
      palaceStars[position].push({
        name: starName,
        type: 'major',
        brightness: STAR_BRIGHTNESS[starName]?.[branch] || '平',
        group: 'tianfu',
        sihua,
      });
    });

    // 安辅星
    const auxiliaryPositions: { name: string; position: number }[] = [];
    
    // 左辅右弼
    const zuofuPos = calculateZuofu(lunarMonth);
    const youbiPos = calculateYoubi(lunarMonth);
    auxiliaryPositions.push({ name: '左辅', position: zuofuPos });
    auxiliaryPositions.push({ name: '右弼', position: youbiPos });
    
    // 文昌文曲
    const wenchangPos = calculateWenchang(hourBranchIndex);
    const wenquPos = calculateWenqu(hourBranchIndex);
    auxiliaryPositions.push({ name: '文昌', position: wenchangPos });
    auxiliaryPositions.push({ name: '文曲', position: wenquPos });
    
    // 天魁天钺
    const tiankuiBranch = TIANKUI_TABLE[yearGan];
    const tianyueBranch = TIANYUE_TABLE[yearGan];
    if (tiankuiBranch) {
      const pos = PALACE_BRANCH_ORDER.indexOf(tiankuiBranch);
      if (pos >= 0) auxiliaryPositions.push({ name: '天魁', position: pos });
    }
    if (tianyueBranch) {
      const pos = PALACE_BRANCH_ORDER.indexOf(tianyueBranch);
      if (pos >= 0) auxiliaryPositions.push({ name: '天钺', position: pos });
    }
    
    // 禄存
    const lucunBranch = LUCUN_TABLE[yearGan];
    if (lucunBranch) {
      const pos = PALACE_BRANCH_ORDER.indexOf(lucunBranch);
      if (pos >= 0) auxiliaryPositions.push({ name: '禄存', position: pos });
    }
    
    // 擎羊陀罗
    const qingyangBranch = QINGYANG_TABLE[yearGan];
    const tuoluoBranch = TUOLUO_TABLE[yearGan];
    if (qingyangBranch) {
      const pos = PALACE_BRANCH_ORDER.indexOf(qingyangBranch);
      if (pos >= 0) auxiliaryPositions.push({ name: '擎羊', position: pos });
    }
    if (tuoluoBranch) {
      const pos = PALACE_BRANCH_ORDER.indexOf(tuoluoBranch);
      if (pos >= 0) auxiliaryPositions.push({ name: '陀罗', position: pos });
    }
    
    // 天马
    const tianmaBranch = TIANMA_TABLE[yearZhi];
    if (tianmaBranch) {
      const pos = PALACE_BRANCH_ORDER.indexOf(tianmaBranch);
      if (pos >= 0) auxiliaryPositions.push({ name: '天马', position: pos });
    }
    
    // 火星铃星
    const huoxingPos = calculateHuoxing(yearZhi, hourBranchIndex);
    const lingxingPos = calculateLingxing(yearZhi, hourBranchIndex);
    auxiliaryPositions.push({ name: '火星', position: huoxingPos });
    auxiliaryPositions.push({ name: '铃星', position: lingxingPos });
    
    // 添加辅星到宫位
    auxiliaryPositions.forEach(({ name, position }) => {
      const branch = PALACE_BRANCH_ORDER[position];
      const isSha = ['擎羊', '陀罗', '火星', '铃星'].includes(name);
      const sihua = sihuaList.find(s => s.star === name)?.transform;
      palaceStars[position].push({
        name,
        type: isSha ? 'sha' : 'auxiliary',
        brightness: STAR_BRIGHTNESS[name]?.[branch] || '平',
        group: isSha ? 'sha' : 'auxiliary',
        sihua,
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

    // 计算大限 (Major Luck Periods)
    // 起运年龄根据五行局数确定
    const startDaxianAge = wuxingju.number;
    
    // 大限顺逆行：阳男阴女顺行，阴男阳女逆行
    const yearGanIndex = HEAVENLY_STEMS.indexOf(yearGan);
    const isYangYear = yearGanIndex % 2 === 0;
    const isMale = input.gender === 'male';
    const isClockwise = (isYangYear && isMale) || (!isYangYear && !isMale);
    
    // 生成8个大限（每个10年）
    const daxian: DaxianInfo[] = [];
    for (let i = 0; i < 8; i++) {
      const startAge = startDaxianAge + i * 10;
      const endAge = startAge + 9;
      
      // 从命宫开始，顺/逆行
      const palaceOffset = isClockwise ? i : -i;
      const palaceIndex = ((mingIndex + palaceOffset) % 12 + 12) % 12;
      const daxianPalace = palaces.find(p => p.index === palaceIndex);
      
      daxian.push({
        startAge,
        endAge,
        palaceName: daxianPalace?.name || PALACE_ORDER[i % 12],
        branch: PALACE_BRANCH_ORDER[palaceIndex],
        stars: palaceStars[palaceIndex] || [],
      });
    }

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
      sihua: sihuaList,
      auxiliaryStars: auxiliaryPositions.map(p => p.name),
      daxian,
      startDaxianAge,
    };
  },
};
