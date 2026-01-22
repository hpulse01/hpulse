/**
 * Deep BaZi Analysis Module (八字深度分析)
 * 
 * Provides comprehensive analysis including:
 * - Ten Gods (十神)
 * - Hidden Stems (藏干)
 * - Na Yin (纳音五行)
 * - Five Element Balance (五行平衡)
 * - Day Master Strength (日主强弱)
 */

import { Solar } from 'lunar-typescript';

// 天干
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干五行
const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

// 天干阴阳
const STEM_YIN_YANG: Record<string, string> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
};

// 地支五行
const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 地支藏干表
const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
};

// 纳音表 (60甲子)
const NA_YIN: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
  '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
};

// 十神关系矩阵 (日主为基准)
// 返回: [同性关系, 异性关系]
function getTenGodRelation(dayMasterElement: string, targetElement: string): [string, string] {
  const elements = ['木', '火', '土', '金', '水'];
  const dayIdx = elements.indexOf(dayMasterElement);
  const targetIdx = elements.indexOf(targetElement);
  
  if (dayIdx === -1 || targetIdx === -1) return ['未知', '未知'];
  
  const diff = (targetIdx - dayIdx + 5) % 5;
  
  switch (diff) {
    case 0: return ['比肩', '劫财'];     // 同我
    case 1: return ['食神', '伤官'];     // 我生
    case 2: return ['偏财', '正财'];     // 我克
    case 3: return ['七杀', '正官'];     // 克我
    case 4: return ['偏印', '正印'];     // 生我
    default: return ['未知', '未知'];
  }
}

export interface TenGod {
  position: string;      // 位置：年干、月干、日干、时干
  stem: string;          // 天干
  element: string;       // 五行
  yinYang: string;       // 阴阳
  tenGod: string;        // 十神名称
  description: string;   // 简述
}

export interface HiddenStemInfo {
  position: string;      // 位置：年支、月支、日支、时支
  branch: string;        // 地支
  hiddenStems: {
    stem: string;
    element: string;
    tenGod: string;
    isMain: boolean;     // 是否为主气
  }[];
}

export interface NaYinInfo {
  pillar: string;        // 柱名
  ganZhi: string;        // 干支
  naYin: string;         // 纳音
  element: string;       // 纳音五行
}

export interface ElementBalance {
  element: string;
  count: number;
  percentage: number;
  status: '旺' | '相' | '休' | '囚' | '死' | '平';
}

export interface DeepBaZiAnalysis {
  // 基础信息
  fourPillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  
  // 日主分析
  dayMaster: {
    stem: string;
    element: string;
    yinYang: string;
    strengthScore: number;  // 0-100
    strengthLevel: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺';
    description: string;
  };
  
  // 十神配置
  tenGods: TenGod[];
  
  // 藏干分析
  hiddenStems: HiddenStemInfo[];
  
  // 纳音分析
  naYinAnalysis: NaYinInfo[];
  
  // 五行平衡
  elementBalance: ElementBalance[];
  
  // 喜忌分析
  favorable: {
    elements: string[];
    gods: string[];
    description: string;
  };
  unfavorable: {
    elements: string[];
    gods: string[];
    description: string;
  };
  
  // 格局判断
  pattern: {
    name: string;
    type: '正格' | '外格' | '特殊格';
    description: string;
  };
  
  // 综合评语
  summary: string;
}

/**
 * Perform deep BaZi analysis
 */
export function performDeepBaZiAnalysis(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
  gender: 'male' | 'female' = 'male'
): DeepBaZiAnalysis {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  // 四柱
  const fourPillars = {
    year: lunar.getYearInGanZhi(),
    month: lunar.getMonthInGanZhi(),
    day: lunar.getDayInGanZhi(),
    hour: lunar.getTimeInGanZhi(),
  };
  
  // 日主分析
  const dayGan = eightChar.getDayGan();
  const dayElement = STEM_ELEMENTS[dayGan];
  const dayYinYang = STEM_YIN_YANG[dayGan];
  
  // 计算日主强度
  const strengthResult = calculateDayMasterStrength(fourPillars, dayElement);
  
  // 十神分析
  const tenGods = calculateTenGods(fourPillars, dayGan, dayElement, dayYinYang);
  
  // 藏干分析
  const hiddenStems = calculateHiddenStems(fourPillars, dayGan, dayElement, dayYinYang);
  
  // 纳音分析
  const naYinAnalysis = calculateNaYin(fourPillars);
  
  // 五行平衡
  const elementBalance = calculateElementBalance(fourPillars, hiddenStems);
  
  // 喜忌分析
  const { favorable, unfavorable } = calculateFavorableElements(
    dayElement, 
    strengthResult.level,
    elementBalance
  );
  
  // 格局判断
  const pattern = determinePattern(tenGods, strengthResult.level, elementBalance);
  
  // 综合评语
  const summary = generateSummary(
    dayGan, dayElement, dayYinYang, 
    strengthResult, pattern, favorable, unfavorable
  );
  
  return {
    fourPillars,
    dayMaster: {
      stem: dayGan,
      element: dayElement,
      yinYang: dayYinYang,
      strengthScore: strengthResult.score,
      strengthLevel: strengthResult.level,
      description: strengthResult.description,
    },
    tenGods,
    hiddenStems,
    naYinAnalysis,
    elementBalance,
    favorable,
    unfavorable,
    pattern,
    summary,
  };
}

/**
 * Calculate day master strength
 */
function calculateDayMasterStrength(
  pillars: { year: string; month: string; day: string; hour: string },
  dayElement: string
): { score: number; level: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺'; description: string } {
  let score = 50; // Base score
  
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];
  
  // Check each pillar
  pillarList.forEach((pillar, idx) => {
    const stem = pillar.charAt(0);
    const branch = pillar.charAt(1);
    const stemElement = STEM_ELEMENTS[stem];
    const branchElement = BRANCH_ELEMENTS[branch];
    
    // Weight: month is most important
    const weight = idx === 1 ? 3 : 1;
    
    // Same element (helps)
    if (stemElement === dayElement) score += 5 * weight;
    if (branchElement === dayElement) score += 5 * weight;
    
    // Element that produces day master (helps)
    const producerElement = getProducerElement(dayElement);
    if (stemElement === producerElement) score += 4 * weight;
    if (branchElement === producerElement) score += 4 * weight;
    
    // Element that day master produces (drains)
    const producedElement = getProducedElement(dayElement);
    if (stemElement === producedElement) score -= 3 * weight;
    if (branchElement === producedElement) score -= 3 * weight;
    
    // Element that conquers day master (hurts)
    const conquerorElement = getConquerorElement(dayElement);
    if (stemElement === conquerorElement) score -= 4 * weight;
    if (branchElement === conquerorElement) score -= 4 * weight;
  });
  
  // Check hidden stems for additional support/drain
  const hiddens = Object.values(pillars).map(p => HIDDEN_STEMS[p.charAt(1)] || []).flat();
  hiddens.forEach(h => {
    const hElement = STEM_ELEMENTS[h];
    if (hElement === dayElement) score += 2;
    if (hElement === getProducerElement(dayElement)) score += 1;
    if (hElement === getConquerorElement(dayElement)) score -= 1;
  });
  
  // Normalize score
  score = Math.max(0, Math.min(100, score));
  
  let level: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺';
  let description: string;
  
  if (score < 25) {
    level = '极弱';
    description = '日主力量极弱，需大力扶持，喜印比生助';
  } else if (score < 40) {
    level = '偏弱';
    description = '日主偏弱，需印星生扶或比劫帮身';
  } else if (score < 60) {
    level = '中和';
    description = '日主中和，五行较为平衡，取用灵活';
  } else if (score < 80) {
    level = '偏旺';
    description = '日主偏旺，喜食伤泄秀或财官耗泄';
  } else {
    level = '极旺';
    description = '日主极旺，须以财官杀克制或食伤大泄';
  }
  
  return { score, level, description };
}

/**
 * Calculate Ten Gods for all pillars
 */
function calculateTenGods(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string,
  dayElement: string,
  dayYinYang: string
): TenGod[] {
  const result: TenGod[] = [];
  const positions = [
    { name: '年干', pillar: pillars.year },
    { name: '月干', pillar: pillars.month },
    { name: '日干', pillar: pillars.day },
    { name: '时干', pillar: pillars.hour },
  ];
  
  positions.forEach(({ name, pillar }) => {
    const stem = pillar.charAt(0);
    const element = STEM_ELEMENTS[stem];
    const yinYang = STEM_YIN_YANG[stem];
    
    if (stem === dayGan) {
      result.push({
        position: name,
        stem,
        element,
        yinYang,
        tenGod: '日元',
        description: '自身，命主本人',
      });
    } else {
      const [sameSex, diffSex] = getTenGodRelation(dayElement, element);
      const tenGod = yinYang === dayYinYang ? sameSex : diffSex;
      result.push({
        position: name,
        stem,
        element,
        yinYang,
        tenGod,
        description: getTenGodDescription(tenGod),
      });
    }
  });
  
  return result;
}

/**
 * Calculate hidden stems for all branches
 */
function calculateHiddenStems(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string,
  dayElement: string,
  dayYinYang: string
): HiddenStemInfo[] {
  const result: HiddenStemInfo[] = [];
  const positions = [
    { name: '年支', pillar: pillars.year },
    { name: '月支', pillar: pillars.month },
    { name: '日支', pillar: pillars.day },
    { name: '时支', pillar: pillars.hour },
  ];
  
  positions.forEach(({ name, pillar }) => {
    const branch = pillar.charAt(1);
    const hidden = HIDDEN_STEMS[branch] || [];
    
    result.push({
      position: name,
      branch,
      hiddenStems: hidden.map((stem, idx) => {
        const element = STEM_ELEMENTS[stem];
        const yinYang = STEM_YIN_YANG[stem];
        const [sameSex, diffSex] = getTenGodRelation(dayElement, element);
        const tenGod = yinYang === dayYinYang ? sameSex : diffSex;
        
        return {
          stem,
          element,
          tenGod,
          isMain: idx === 0, // First hidden stem is the main one
        };
      }),
    });
  });
  
  return result;
}

/**
 * Calculate Na Yin for all pillars
 */
function calculateNaYin(
  pillars: { year: string; month: string; day: string; hour: string }
): NaYinInfo[] {
  const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
  const pillarValues = [pillars.year, pillars.month, pillars.day, pillars.hour];
  
  return pillarValues.map((gz, idx) => {
    const naYin = NA_YIN[gz] || '未知';
    // Extract element from na yin name
    let element = '未知';
    if (naYin.includes('金')) element = '金';
    else if (naYin.includes('木')) element = '木';
    else if (naYin.includes('水')) element = '水';
    else if (naYin.includes('火')) element = '火';
    else if (naYin.includes('土')) element = '土';
    
    return {
      pillar: pillarNames[idx],
      ganZhi: gz,
      naYin,
      element,
    };
  });
}

/**
 * Calculate element balance from all sources
 */
function calculateElementBalance(
  pillars: { year: string; month: string; day: string; hour: string },
  hiddenStems: HiddenStemInfo[]
): ElementBalance[] {
  const counts: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  
  // Count from stems
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];
  pillarList.forEach(p => {
    const stem = p.charAt(0);
    const branch = p.charAt(1);
    counts[STEM_ELEMENTS[stem]] = (counts[STEM_ELEMENTS[stem]] || 0) + 2;
    counts[BRANCH_ELEMENTS[branch]] = (counts[BRANCH_ELEMENTS[branch]] || 0) + 1.5;
  });
  
  // Count from hidden stems
  hiddenStems.forEach(hs => {
    hs.hiddenStems.forEach((h, idx) => {
      const weight = idx === 0 ? 1 : 0.5; // Main hidden stem gets more weight
      counts[h.element] = (counts[h.element] || 0) + weight;
    });
  });
  
  // Calculate total
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  
  // Determine status based on percentage
  return Object.entries(counts).map(([element, count]) => {
    const percentage = Math.round((count / total) * 100);
    let status: ElementBalance['status'];
    
    if (percentage >= 30) status = '旺';
    else if (percentage >= 22) status = '相';
    else if (percentage >= 15) status = '休';
    else if (percentage >= 8) status = '囚';
    else status = '死';
    
    return { element, count, percentage, status };
  });
}

/**
 * Calculate favorable and unfavorable elements
 */
function calculateFavorableElements(
  dayElement: string,
  strengthLevel: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺',
  elementBalance: ElementBalance[]
): {
  favorable: { elements: string[]; gods: string[]; description: string };
  unfavorable: { elements: string[]; gods: string[]; description: string };
} {
  const producer = getProducerElement(dayElement);
  const produced = getProducedElement(dayElement);
  const conqueror = getConquerorElement(dayElement);
  const conquered = getConqueredElement(dayElement);
  
  let favorable: { elements: string[]; gods: string[]; description: string };
  let unfavorable: { elements: string[]; gods: string[]; description: string };
  
  if (strengthLevel === '极弱' || strengthLevel === '偏弱') {
    favorable = {
      elements: [producer, dayElement],
      gods: ['正印', '偏印', '比肩', '劫财'],
      description: `日主${strengthLevel}，喜${producer}(印星)生扶，${dayElement}(比劫)帮身`,
    };
    unfavorable = {
      elements: [conqueror, produced, conquered],
      gods: ['七杀', '正官', '食神', '伤官', '偏财', '正财'],
      description: `忌${conqueror}(官杀)克身，${produced}(食伤)泄气，${conquered}(财星)耗力`,
    };
  } else if (strengthLevel === '极旺' || strengthLevel === '偏旺') {
    favorable = {
      elements: [produced, conquered, conqueror],
      gods: ['食神', '伤官', '偏财', '正财', '七杀', '正官'],
      description: `日主${strengthLevel}，喜${produced}(食伤)泄秀，${conquered}(财星)耗泄，${conqueror}(官杀)制衡`,
    };
    unfavorable = {
      elements: [producer, dayElement],
      gods: ['正印', '偏印', '比肩', '劫财'],
      description: `忌${producer}(印星)再生，${dayElement}(比劫)助力过旺`,
    };
  } else {
    // 中和 - flexible
    favorable = {
      elements: [produced, conquered],
      gods: ['食神', '伤官', '偏财', '正财'],
      description: '日主中和，取用灵活，喜食伤生财，财官相生',
    };
    unfavorable = {
      elements: [],
      gods: [],
      description: '五行平衡，无明显忌神，需看大运流年具体情况',
    };
  }
  
  return { favorable, unfavorable };
}

/**
 * Determine the BaZi pattern (格局)
 */
function determinePattern(
  tenGods: TenGod[],
  strengthLevel: string,
  elementBalance: ElementBalance[]
): { name: string; type: '正格' | '外格' | '特殊格'; description: string } {
  // Get the month stem's ten god
  const monthGod = tenGods.find(t => t.position === '月干')?.tenGod || '';
  
  // Check for special patterns first
  const dominantElement = elementBalance.find(e => e.percentage >= 40);
  if (dominantElement) {
    return {
      name: `${dominantElement.element}气专旺格`,
      type: '特殊格',
      description: `${dominantElement.element}五行一气独旺，为专旺格局`,
    };
  }
  
  // Normal patterns based on month god
  const patterns: Record<string, { name: string; desc: string }> = {
    '正官': { name: '正官格', desc: '官星透出，主贵显仕途' },
    '七杀': { name: '七杀格', desc: '杀星透出，主权威武贵' },
    '正财': { name: '正财格', desc: '财星透出，主富裕稳健' },
    '偏财': { name: '偏财格', desc: '偏财透出，主横财意外' },
    '正印': { name: '正印格', desc: '印星透出，主学业声名' },
    '偏印': { name: '偏印格', desc: '偏印透出，主技艺偏学' },
    '食神': { name: '食神格', desc: '食神透出，主口福财禄' },
    '伤官': { name: '伤官格', desc: '伤官透出，主聪明技艺' },
    '比肩': { name: '建禄格', desc: '比肩当令，主自立自强' },
    '劫财': { name: '羊刃格', desc: '劫财当令，主刚强果断' },
  };
  
  const pattern = patterns[monthGod];
  if (pattern) {
    return {
      name: pattern.name,
      type: '正格',
      description: pattern.desc,
    };
  }
  
  return {
    name: '杂格',
    type: '正格',
    description: '格局不明显，需综合分析',
  };
}

/**
 * Generate summary text
 */
function generateSummary(
  dayGan: string,
  dayElement: string,
  dayYinYang: string,
  strength: { score: number; level: string; description: string },
  pattern: { name: string; type: string; description: string },
  favorable: { elements: string[]; gods: string[]; description: string },
  unfavorable: { elements: string[]; gods: string[]; description: string }
): string {
  const yinYangDesc = dayYinYang === '阳' ? '阳刚' : '阴柔';
  
  return `命主日元${dayGan}${dayElement}，属${yinYangDesc}之性。` +
    `${strength.description}。` +
    `格局为${pattern.name}，${pattern.description}。` +
    `${favorable.description}。` +
    (unfavorable.description ? `${unfavorable.description}。` : '');
}

// Helper functions
function getProducerElement(element: string): string {
  const cycle = ['木', '火', '土', '金', '水'];
  const idx = cycle.indexOf(element);
  return cycle[(idx + 4) % 5];
}

function getProducedElement(element: string): string {
  const cycle = ['木', '火', '土', '金', '水'];
  const idx = cycle.indexOf(element);
  return cycle[(idx + 1) % 5];
}

function getConquerorElement(element: string): string {
  const cycle = ['木', '火', '土', '金', '水'];
  const idx = cycle.indexOf(element);
  return cycle[(idx + 3) % 5];
}

function getConqueredElement(element: string): string {
  const cycle = ['木', '火', '土', '金', '水'];
  const idx = cycle.indexOf(element);
  return cycle[(idx + 2) % 5];
}

function getTenGodDescription(god: string): string {
  const descriptions: Record<string, string> = {
    '比肩': '同我者，兄弟朋友，竞争合作',
    '劫财': '夺我者，竞争对手，多耗财',
    '食神': '我生者，口福寿禄，创造表达',
    '伤官': '我泄者，才华聪明，叛逆多变',
    '偏财': '我克者，横财意外，父亲情人',
    '正财': '我取者，正当收入，妻子财产',
    '七杀': '克我者，权威压力，威严魄力',
    '正官': '制我者，事业地位，丈夫上司',
    '偏印': '生我者，技艺偏学，继母艺术',
    '正印': '助我者，学业名声，母亲贵人',
  };
  return descriptions[god] || '未知';
}

export default {
  performDeepBaZiAnalysis,
};
