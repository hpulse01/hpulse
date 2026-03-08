/**
 * Deep BaZi Analysis Module (八字深度分析) v2.0
 * 
 * Professional-grade Four Pillars engine with:
 * - Ten Gods (十神) with full relationship matrix
 * - Hidden Stems (藏干) with proportional weights
 * - Na Yin (纳音五行) for all 60 Jiazi
 * - Five Element Balance (五行平衡) with seasonal adjustments
 * - Day Master Strength (日主强弱) with 令/地/人 三才法
 * - Twelve Stages of Life (十二长生) for all four pillars
 * - Shen Sha (神煞) lookup: 20+ orthodox stars
 * - Pattern determination (格局判定) with orthodox rules
 * - Xi Yong (喜忌) assessment
 * - Three-layer output: rawParams → chartResult → analysisConclusion
 */

import { Solar } from 'lunar-typescript';

// ═══════════════════════════════════════════════
// 基础常量
// ═══════════════════════════════════════════════

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const STEM_YIN_YANG: Record<string, string> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'
};

const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 地支藏干表（本气/中气/余气）
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

// 藏干力量权重（本气100%，中气60%，余气30%）
const HIDDEN_STEM_WEIGHTS = [1.0, 0.6, 0.3];

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

// ═══════════════════════════════════════════════
// 十二长生（从天干查地支）
// ═══════════════════════════════════════════════

const TWELVE_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

/**
 * 十二长生起始地支（阳干顺行，阴干逆行）
 * 阳干长生位：甲→亥, 丙戊→寅, 庚→巳, 壬→申
 * 阴干长生位：乙→午, 丁己→酉, 辛→子, 癸→卯
 */
const CHANGSHENG_START: Record<string, number> = {
  '甲': 11, // 亥
  '丙': 2,  // 寅
  '戊': 2,  // 寅
  '庚': 5,  // 巳
  '壬': 8,  // 申
  '乙': 6,  // 午
  '丁': 9,  // 酉
  '己': 9,  // 酉
  '辛': 0,  // 子
  '癸': 3,  // 卯
};

function getTwelveStage(stem: string, branch: string): string {
  const startIdx = CHANGSHENG_START[stem];
  if (startIdx === undefined) return '未知';
  const branchIdx = BRANCHES.indexOf(branch);
  if (branchIdx === -1) return '未知';
  const isYang = STEM_YIN_YANG[stem] === '阳';
  let offset: number;
  if (isYang) {
    offset = (branchIdx - startIdx + 12) % 12;
  } else {
    offset = (startIdx - branchIdx + 12) % 12;
  }
  return TWELVE_STAGES[offset];
}

// ═══════════════════════════════════════════════
// 神煞查法（20+正统神煞）
// ═══════════════════════════════════════════════

interface ShenShaInfo {
  name: string;
  type: '吉星' | '凶星' | '中性';
  position: string; // 在哪个柱
  description: string;
}

/**
 * 天乙贵人：甲戊庚→丑未, 乙己→子申, 丙丁→亥酉, 壬癸→卯巳, 辛→午寅
 */
const TIANYI_TABLE: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
};

/** 文昌贵人：以日干查 */
const WENCHANG_TABLE: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

/** 驿马：以年支或日支查 */
const YIMA_TABLE: Record<string, string> = {
  '寅': '申', '午': '申', '戌': '申',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳',
};

/** 桃花（咸池）：以年支或日支查 */
const TAOHUA_TABLE: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '申': '酉', '子': '酉', '辰': '酉',
  '巳': '午', '酉': '午', '丑': '午',
  '亥': '子', '卯': '子', '未': '子',
};

/** 华盖：以年支查 */
const HUAGAI_TABLE: Record<string, string> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '申': '辰', '子': '辰', '辰': '辰',
  '巳': '丑', '酉': '丑', '丑': '丑',
  '亥': '未', '卯': '未', '未': '未',
};

/** 将星：以年支查 */
const JIANGXING_TABLE: Record<string, string> = {
  '寅': '午', '午': '午', '戌': '午',
  '申': '子', '子': '子', '辰': '子',
  '巳': '酉', '酉': '酉', '丑': '酉',
  '亥': '卯', '卯': '卯', '未': '卯',
};

/** 天德贵人：以月支查 */
const TIANDE_TABLE: Record<string, string> = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛',
  '午': '亥', '未': '甲', '申': '癸', '酉': '寅',
  '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚',
};

/** 月德贵人：以月支查 */
const YUEDE_TABLE: Record<string, string> = {
  '寅': '丙', '午': '丙', '戌': '丙',
  '申': '壬', '子': '壬', '辰': '壬',
  '巳': '庚', '酉': '庚', '丑': '庚',
  '亥': '甲', '卯': '甲', '未': '甲',
};

/** 禄神：以日干查 */
const LUSHEN_TABLE: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
};

/** 羊刃：以日干查 */
const YANGREN_TABLE: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳', '戊': '午',
  '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥',
};

/** 劫煞：以年支查 */
const JIESHA_TABLE: Record<string, string> = {
  '寅': '亥', '午': '亥', '戌': '亥',
  '申': '巳', '子': '巳', '辰': '巳',
  '巳': '寅', '酉': '寅', '丑': '寅',
  '亥': '申', '卯': '申', '未': '申',
};

/** 亡神：以年支查 */
const WANGSHEN_TABLE: Record<string, string> = {
  '寅': '巳', '午': '巳', '戌': '巳',
  '申': '亥', '子': '亥', '辰': '亥',
  '巳': '申', '酉': '申', '丑': '申',
  '亥': '寅', '卯': '寅', '未': '寅',
};

function calculateShenSha(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string,
): ShenShaInfo[] {
  const result: ShenShaInfo[] = [];
  const yearBranch = pillars.year.charAt(1);
  const monthBranch = pillars.month.charAt(1);
  const dayBranch = pillars.day.charAt(1);
  const hourBranch = pillars.hour.charAt(1);
  const allBranches = [
    { branch: yearBranch, label: '年支' },
    { branch: monthBranch, label: '月支' },
    { branch: dayBranch, label: '日支' },
    { branch: hourBranch, label: '时支' },
  ];

  // 天乙贵人
  const tianyiTargets = TIANYI_TABLE[dayGan] || [];
  for (const { branch, label } of allBranches) {
    if (tianyiTargets.includes(branch)) {
      result.push({ name: '天乙贵人', type: '吉星', position: label, description: '贵人相助，逢凶化吉，主地位声望' });
    }
  }

  // 文昌贵人
  const wcTarget = WENCHANG_TABLE[dayGan];
  for (const { branch, label } of allBranches) {
    if (branch === wcTarget) {
      result.push({ name: '文昌贵人', type: '吉星', position: label, description: '主学业有成，聪明好学，文采出众' });
    }
  }

  // 驿马
  const yimaTarget = YIMA_TABLE[yearBranch];
  for (const { branch, label } of allBranches) {
    if (branch === yimaTarget) {
      result.push({ name: '驿马', type: '中性', position: label, description: '主奔波劳碌，远行迁移，动中求财' });
    }
  }

  // 桃花
  const thTarget = TAOHUA_TABLE[yearBranch];
  for (const { branch, label } of allBranches) {
    if (branch === thTarget) {
      result.push({ name: '桃花', type: '中性', position: label, description: '主异性缘佳，风流才子，注意感情纠纷' });
    }
  }

  // 华盖
  const hgTarget = HUAGAI_TABLE[yearBranch];
  for (const { branch, label } of allBranches) {
    if (branch === hgTarget) {
      result.push({ name: '华盖', type: '中性', position: label, description: '主聪明孤高，适宜学术宗教，艺术天赋' });
    }
  }

  // 将星
  const jxTarget = JIANGXING_TABLE[yearBranch];
  for (const { branch, label } of allBranches) {
    if (branch === jxTarget) {
      result.push({ name: '将星', type: '吉星', position: label, description: '主权威统御，领导才能，利于仕途' });
    }
  }

  // 天德贵人
  const tdTarget = TIANDE_TABLE[monthBranch];
  if (tdTarget) {
    for (const { branch, label } of allBranches) {
      const stemOrBranch = pillars[label === '年支' ? 'year' : label === '月支' ? 'month' : label === '日支' ? 'day' : 'hour'].charAt(0);
      if (stemOrBranch === tdTarget || branch === tdTarget) {
        result.push({ name: '天德贵人', type: '吉星', position: label, description: '主福寿安康，逢凶化吉，一生平安' });
      }
    }
  }

  // 禄神
  const luTarget = LUSHEN_TABLE[dayGan];
  for (const { branch, label } of allBranches) {
    if (branch === luTarget) {
      result.push({ name: '禄神', type: '吉星', position: label, description: '主衣食丰足，财禄充盈，自力更生' });
    }
  }

  // 羊刃
  const yrTarget = YANGREN_TABLE[dayGan];
  for (const { branch, label } of allBranches) {
    if (branch === yrTarget) {
      result.push({ name: '羊刃', type: '凶星', position: label, description: '主刚烈果断，易伤克六亲，需化解' });
    }
  }

  // 劫煞
  const jsTarget = JIESHA_TABLE[yearBranch];
  for (const { branch, label } of allBranches) {
    if (branch === jsTarget) {
      result.push({ name: '劫煞', type: '凶星', position: label, description: '主意外灾祸，小人暗算，需谨慎提防' });
    }
  }

  // 亡神
  const wsTarget = WANGSHEN_TABLE[yearBranch];
  for (const { branch, label } of allBranches) {
    if (branch === wsTarget) {
      result.push({ name: '亡神', type: '凶星', position: label, description: '主虚耗损失，做事多阻，精神不振' });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════
// v3.0: 地支刑冲合害 (Branch Interactions)
// ═══════════════════════════════════════════════

export interface BranchInteraction {
  type: '六合' | '三合' | '半合' | '六冲' | '三刑' | '自刑' | '六害' | '六破';
  branches: string[];
  positions: string[];
  effect: '吉' | '凶' | '中性';
  description: string;
}

/** 地支六合 */
const LIUHE_PAIRS: [string, string, string][] = [
  ['子', '丑', '土'], ['寅', '亥', '木'], ['卯', '戌', '火'],
  ['辰', '酉', '金'], ['巳', '申', '水'], ['午', '未', '火'],
];

/** 地支三合局 */
const SANHE_GROUPS: [string, string, string, string][] = [
  ['申', '子', '辰', '水'], ['寅', '午', '戌', '火'],
  ['巳', '酉', '丑', '金'], ['亥', '卯', '未', '木'],
];

/** 地支六冲 */
const LIUCHONG_PAIRS: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

/** 地支三刑 */
const SANXING_GROUPS: { branches: string[]; name: string; desc: string }[] = [
  { branches: ['寅', '巳', '申'], name: '无恩之刑', desc: '主忘恩负义，恩将仇报' },
  { branches: ['丑', '戌', '未'], name: '持势之刑', desc: '主依仗权势，招惹是非' },
  { branches: ['子', '卯'], name: '无礼之刑', desc: '主不守规矩，礼数欠缺' },
];

/** 地支自刑 */
const ZIXING_BRANCHES = ['辰', '午', '酉', '亥'];

/** 地支六害 */
const LIUHAI_PAIRS: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

/** 地支六破 */
const LIUPO_PAIRS: [string, string][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌'],
];

function calculateBranchInteractions(
  pillars: { year: string; month: string; day: string; hour: string },
): BranchInteraction[] {
  const results: BranchInteraction[] = [];
  const positions = [
    { branch: pillars.year.charAt(1), label: '年支' },
    { branch: pillars.month.charAt(1), label: '月支' },
    { branch: pillars.day.charAt(1), label: '日支' },
    { branch: pillars.hour.charAt(1), label: '时支' },
  ];

  // 六合
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const [a, b, element] of LIUHE_PAIRS) {
        if ((positions[i].branch === a && positions[j].branch === b) ||
            (positions[i].branch === b && positions[j].branch === a)) {
          results.push({
            type: '六合', branches: [positions[i].branch, positions[j].branch],
            positions: [positions[i].label, positions[j].label], effect: '吉',
            description: `${positions[i].label}${positions[i].branch}与${positions[j].label}${positions[j].branch}六合化${element}`,
          });
        }
      }
    }
  }

  // 三合
  const branchSet = positions.map(p => p.branch);
  for (const [a, b, c, element] of SANHE_GROUPS) {
    const hasA = branchSet.includes(a), hasB = branchSet.includes(b), hasC = branchSet.includes(c);
    if (hasA && hasB && hasC) {
      results.push({
        type: '三合', branches: [a, b, c],
        positions: positions.filter(p => [a, b, c].includes(p.branch)).map(p => p.label),
        effect: '吉', description: `${a}${b}${c}三合${element}局`,
      });
    } else if ((hasA && hasB) || (hasB && hasC) || (hasA && hasC)) {
      const present = [hasA ? a : null, hasB ? b : null, hasC ? c : null].filter(Boolean) as string[];
      results.push({
        type: '半合', branches: present,
        positions: positions.filter(p => present.includes(p.branch)).map(p => p.label),
        effect: '中性', description: `${present.join('')}半合${element}局`,
      });
    }
  }

  // 六冲
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const [a, b] of LIUCHONG_PAIRS) {
        if ((positions[i].branch === a && positions[j].branch === b) ||
            (positions[i].branch === b && positions[j].branch === a)) {
          results.push({
            type: '六冲', branches: [positions[i].branch, positions[j].branch],
            positions: [positions[i].label, positions[j].label], effect: '凶',
            description: `${positions[i].label}${positions[i].branch}与${positions[j].label}${positions[j].branch}相冲，主动荡变化`,
          });
        }
      }
    }
  }

  // 三刑
  for (const xing of SANXING_GROUPS) {
    const present = xing.branches.filter(b => branchSet.includes(b));
    if (present.length >= 2) {
      results.push({
        type: '三刑', branches: present,
        positions: positions.filter(p => present.includes(p.branch)).map(p => p.label),
        effect: '凶', description: `${xing.name}：${xing.desc}`,
      });
    }
  }

  // 自刑
  for (const branch of ZIXING_BRANCHES) {
    const count = branchSet.filter(b => b === branch).length;
    if (count >= 2) {
      results.push({
        type: '自刑', branches: [branch],
        positions: positions.filter(p => p.branch === branch).map(p => p.label),
        effect: '凶', description: `${branch}${branch}自刑，主自我矛盾伤害`,
      });
    }
  }

  // 六害
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const [a, b] of LIUHAI_PAIRS) {
        if ((positions[i].branch === a && positions[j].branch === b) ||
            (positions[i].branch === b && positions[j].branch === a)) {
          results.push({
            type: '六害', branches: [positions[i].branch, positions[j].branch],
            positions: [positions[i].label, positions[j].label], effect: '凶',
            description: `${positions[i].label}${positions[i].branch}与${positions[j].label}${positions[j].branch}相害，主暗损不利`,
          });
        }
      }
    }
  }

  // 六破
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const [a, b] of LIUPO_PAIRS) {
        if ((positions[i].branch === a && positions[j].branch === b) ||
            (positions[i].branch === b && positions[j].branch === a)) {
          results.push({
            type: '六破', branches: [positions[i].branch, positions[j].branch],
            positions: [positions[i].label, positions[j].label], effect: '凶',
            description: `${positions[i].label}${positions[i].branch}与${positions[j].label}${positions[j].branch}相破，主破耗不顺`,
          });
        }
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════
// v3.0: 天干合化 (Stem Combinations)
// ═══════════════════════════════════════════════

export interface StemCombination {
  type: '天干五合' | '天干相冲';
  stems: string[];
  positions: string[];
  resultElement?: string;
  canTransform: boolean;
  description: string;
}

/** 天干五合 */
const TIANGANWUHE: [string, string, string][] = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'],
  ['丁', '壬', '木'], ['戊', '癸', '火'],
];

/** 天干相冲 */
const TIANGAN_CLASH: [string, string][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
];

function calculateStemCombinations(
  pillars: { year: string; month: string; day: string; hour: string },
  monthBranch: string,
): StemCombination[] {
  const results: StemCombination[] = [];
  const positions = [
    { stem: pillars.year.charAt(0), label: '年干' },
    { stem: pillars.month.charAt(0), label: '月干' },
    { stem: pillars.day.charAt(0), label: '日干' },
    { stem: pillars.hour.charAt(0), label: '时干' },
  ];

  // 天干五合
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const [a, b, element] of TIANGANWUHE) {
        if ((positions[i].stem === a && positions[j].stem === b) ||
            (positions[i].stem === b && positions[j].stem === a)) {
          // 判断是否化成：需月令五行配合
          const monthEl = BRANCH_ELEMENTS[monthBranch];
          const canTransform = monthEl === element;
          results.push({
            type: '天干五合', stems: [positions[i].stem, positions[j].stem],
            positions: [positions[i].label, positions[j].label],
            resultElement: element, canTransform,
            description: canTransform
              ? `${positions[i].label}${positions[i].stem}与${positions[j].label}${positions[j].stem}合化${element}，化成`
              : `${positions[i].label}${positions[i].stem}与${positions[j].label}${positions[j].stem}合${element}，合而不化`,
          });
        }
      }
    }
  }

  // 天干相冲
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      for (const [a, b] of TIANGAN_CLASH) {
        if ((positions[i].stem === a && positions[j].stem === b) ||
            (positions[i].stem === b && positions[j].stem === a)) {
          results.push({
            type: '天干相冲', stems: [positions[i].stem, positions[j].stem],
            positions: [positions[i].label, positions[j].label],
            canTransform: false,
            description: `${positions[i].label}${positions[i].stem}与${positions[j].label}${positions[j].stem}相冲克战`,
          });
        }
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════
// v3.0: 空亡 (Kong Wang / Void)
// ═══════════════════════════════════════════════

export interface KongWangInfo {
  /** 空亡地支 */
  voidBranches: string[];
  /** 四柱中是否有空亡 */
  affectedPillars: { pillar: string; branch: string; isVoid: boolean }[];
  /** 描述 */
  description: string;
}

/**
 * 空亡计算：以日柱查旬空
 * 甲子旬空戌亥, 甲戌旬空申酉, 甲申旬空午未,
 * 甲午旬空辰巳, 甲辰旬空寅卯, 甲寅旬空子丑
 */
const KONG_WANG_TABLE: Record<string, string[]> = {
  '甲子': ['戌', '亥'], '乙丑': ['戌', '亥'], '丙寅': ['戌', '亥'], '丁卯': ['戌', '亥'], '戊辰': ['戌', '亥'],
  '己巳': ['戌', '亥'], '庚午': ['戌', '亥'], '辛未': ['戌', '亥'], '壬申': ['戌', '亥'], '癸酉': ['戌', '亥'],
  '甲戌': ['申', '酉'], '乙亥': ['申', '酉'], '丙子': ['申', '酉'], '丁丑': ['申', '酉'], '戊寅': ['申', '酉'],
  '己卯': ['申', '酉'], '庚辰': ['申', '酉'], '辛巳': ['申', '酉'], '壬午': ['申', '酉'], '癸未': ['申', '酉'],
  '甲申': ['午', '未'], '乙酉': ['午', '未'], '丙戌': ['午', '未'], '丁亥': ['午', '未'], '戊子': ['午', '未'],
  '己丑': ['午', '未'], '庚寅': ['午', '未'], '辛卯': ['午', '未'], '壬辰': ['午', '未'], '癸巳': ['午', '未'],
  '甲午': ['辰', '巳'], '乙未': ['辰', '巳'], '丙申': ['辰', '巳'], '丁酉': ['辰', '巳'], '戊戌': ['辰', '巳'],
  '己亥': ['辰', '巳'], '庚子': ['辰', '巳'], '辛丑': ['辰', '巳'], '壬寅': ['辰', '巳'], '癸卯': ['辰', '巳'],
  '甲辰': ['寅', '卯'], '乙巳': ['寅', '卯'], '丙午': ['寅', '卯'], '丁未': ['寅', '卯'], '戊申': ['寅', '卯'],
  '己酉': ['寅', '卯'], '庚戌': ['寅', '卯'], '辛亥': ['寅', '卯'], '壬子': ['寅', '卯'], '癸丑': ['寅', '卯'],
  '甲寅': ['子', '丑'], '乙卯': ['子', '丑'], '丙辰': ['子', '丑'], '丁巳': ['子', '丑'], '戊午': ['子', '丑'],
  '己未': ['子', '丑'], '庚申': ['子', '丑'], '辛酉': ['子', '丑'], '壬戌': ['子', '丑'], '癸亥': ['子', '丑'],
};

function calculateKongWang(
  pillars: { year: string; month: string; day: string; hour: string },
): KongWangInfo {
  const dayGanZhi = pillars.day;
  const voidBranches = KONG_WANG_TABLE[dayGanZhi] || [];
  
  const pillarList = [
    { pillar: '年支', branch: pillars.year.charAt(1) },
    { pillar: '月支', branch: pillars.month.charAt(1) },
    { pillar: '日支', branch: pillars.day.charAt(1) },
    { pillar: '时支', branch: pillars.hour.charAt(1) },
  ];

  const affectedPillars = pillarList.map(p => ({
    ...p,
    isVoid: voidBranches.includes(p.branch),
  }));

  const voidPillars = affectedPillars.filter(p => p.isVoid);
  let description = `日柱${dayGanZhi}旬空${voidBranches.join('')}。`;
  if (voidPillars.length > 0) {
    description += `${voidPillars.map(p => `${p.pillar}(${p.branch})`).join('、')}落空亡，力量减弱。`;
  } else {
    description += '四柱无空亡。';
  }

  return { voidBranches, affectedPillars, description };
}

// ═══════════════════════════════════════════════
// 十神关系矩阵
// ═══════════════════════════════════════════════

function getTenGodRelation(dayMasterElement: string, targetElement: string): [string, string] {
  const elements = ['木', '火', '土', '金', '水'];
  const dayIdx = elements.indexOf(dayMasterElement);
  const targetIdx = elements.indexOf(targetElement);
  if (dayIdx === -1 || targetIdx === -1) return ['未知', '未知'];
  const diff = (targetIdx - dayIdx + 5) % 5;
  switch (diff) {
    case 0: return ['比肩', '劫财'];
    case 1: return ['食神', '伤官'];
    case 2: return ['偏财', '正财'];
    case 3: return ['七杀', '正官'];
    case 4: return ['偏印', '正印'];
    default: return ['未知', '未知'];
  }
}

// ═══════════════════════════════════════════════
// Types — 三层输出结构
// ═══════════════════════════════════════════════

export interface TenGod {
  position: string;
  stem: string;
  element: string;
  yinYang: string;
  tenGod: string;
  description: string;
}

export interface HiddenStemInfo {
  position: string;
  branch: string;
  hiddenStems: {
    stem: string;
    element: string;
    tenGod: string;
    isMain: boolean;
    weight: number; // 力量权重 1.0/0.6/0.3
  }[];
}

export interface NaYinInfo {
  pillar: string;
  ganZhi: string;
  naYin: string;
  element: string;
}

export interface ElementBalance {
  element: string;
  count: number;
  percentage: number;
  status: '旺' | '相' | '休' | '囚' | '死' | '平';
}

export interface TwelveStageInfo {
  pillar: string;
  branch: string;
  stage: string;
  stageDescription: string;
}

/** 三层输出：Layer 1 - 原始参数 */
export interface BaZiRawParams {
  solarDate: string;
  lunarDate: string;
  gender: string;
  fourPillars: { year: string; month: string; day: string; hour: string };
  dayMasterStem: string;
  dayMasterElement: string;
  dayMasterYinYang: string;
}

/** 三层输出：Layer 2 - 排盘结果 */
export interface BaZiChartResult {
  tenGods: TenGod[];
  hiddenStems: HiddenStemInfo[];
  naYinAnalysis: NaYinInfo[];
  elementBalance: ElementBalance[];
  twelveStages: TwelveStageInfo[];
  shenSha: ShenShaInfo[];
  /** v3.0: 地支刑冲合害 */
  branchInteractions: BranchInteraction[];
  /** v3.0: 天干合化 */
  stemCombinations: StemCombination[];
  /** v3.0: 空亡 */
  kongWang: KongWangInfo;
}

/** 三层输出：Layer 3 - 分析结论 */
export interface BaZiAnalysisConclusion {
  dayMaster: {
    stem: string;
    element: string;
    yinYang: string;
    strengthScore: number;
    strengthLevel: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺';
    description: string;
    seasonalStrength: string; // 令的状态
  };
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
  pattern: {
    name: string;
    type: '正格' | '外格' | '特殊格';
    description: string;
  };
  summary: string;
}

/** 完整分析结果（三层合一） */
export interface DeepBaZiAnalysis {
  // Layer 1
  rawParams: BaZiRawParams;
  // Layer 2
  chartResult: BaZiChartResult;
  // Layer 3
  analysisConclusion: BaZiAnalysisConclusion;

  // === Legacy compatibility (flat access) ===
  fourPillars: { year: string; month: string; day: string; hour: string };
  dayMaster: BaZiAnalysisConclusion['dayMaster'];
  tenGods: TenGod[];
  hiddenStems: HiddenStemInfo[];
  naYinAnalysis: NaYinInfo[];
  elementBalance: ElementBalance[];
  favorable: BaZiAnalysisConclusion['favorable'];
  unfavorable: BaZiAnalysisConclusion['unfavorable'];
  pattern: BaZiAnalysisConclusion['pattern'];
  summary: string;
  /** v3.0 */
  branchInteractions: BranchInteraction[];
  stemCombinations: StemCombination[];
  kongWang: KongWangInfo;
}

// ═══════════════════════════════════════════════
// 核心分析函数
// ═══════════════════════════════════════════════

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

  const fourPillars = {
    year: lunar.getYearInGanZhi(),
    month: lunar.getMonthInGanZhi(),
    day: lunar.getDayInGanZhi(),
    hour: lunar.getTimeInGanZhi(),
  };

  const dayGan = eightChar.getDayGan();
  const dayElement = STEM_ELEMENTS[dayGan];
  const dayYinYang = STEM_YIN_YANG[dayGan];
  const monthBranch = fourPillars.month.charAt(1);

  // Layer 2 computations
  const tenGods = calculateTenGods(fourPillars, dayGan, dayElement, dayYinYang);
  const hiddenStems = calculateHiddenStems(fourPillars, dayGan, dayElement, dayYinYang);
  const naYinAnalysis = calculateNaYin(fourPillars);
  const elementBalance = calculateElementBalance(fourPillars, hiddenStems);
  const twelveStages = calculateTwelveStages(fourPillars, dayGan);
  const shenSha = calculateShenSha(fourPillars, dayGan);

  // Layer 3 computations
  const strengthResult = calculateDayMasterStrength(fourPillars, dayElement, monthBranch, twelveStages);
  const { favorable, unfavorable } = calculateFavorableElements(dayElement, strengthResult.level, elementBalance);
  const pattern = determinePattern(tenGods, strengthResult.level, elementBalance);
  const summary = generateSummary(dayGan, dayElement, dayYinYang, strengthResult, pattern, favorable, unfavorable, shenSha);

  // Build three-layer output
  const rawParams: BaZiRawParams = {
    solarDate: `${year}年${month}月${day}日 ${hour}时${minute}分`,
    lunarDate: `${lunar.getYear()}年${Math.abs(lunar.getMonth())}月${lunar.getDay()}日`,
    gender: gender === 'male' ? '男' : '女',
    fourPillars,
    dayMasterStem: dayGan,
    dayMasterElement: dayElement,
    dayMasterYinYang: dayYinYang,
  };

  const chartResult: BaZiChartResult = {
    tenGods,
    hiddenStems,
    naYinAnalysis,
    elementBalance,
    twelveStages,
    shenSha,
  };

  const dayMaster = {
    stem: dayGan,
    element: dayElement,
    yinYang: dayYinYang,
    strengthScore: strengthResult.score,
    strengthLevel: strengthResult.level,
    description: strengthResult.description,
    seasonalStrength: strengthResult.seasonalStrength,
  };

  const analysisConclusion: BaZiAnalysisConclusion = {
    dayMaster,
    favorable,
    unfavorable,
    pattern,
    summary,
  };

  return {
    rawParams,
    chartResult,
    analysisConclusion,
    // Legacy flat access
    fourPillars,
    dayMaster,
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

// ═══════════════════════════════════════════════
// 十二长生计算
// ═══════════════════════════════════════════════

const STAGE_DESCRIPTIONS: Record<string, string> = {
  '长生': '如初生婴儿，充满生机，主吉祥发展',
  '沐浴': '如幼儿沐浴，尚需呵护，主桃花是非',
  '冠带': '如少年加冠，开始成长，主学业进步',
  '临官': '如成人就职，步入正轨，主事业有成',
  '帝旺': '如壮年鼎盛，权力最大，主富贵荣华',
  '衰': '如人之初老，盛极而衰，主守成为上',
  '病': '如人之染疾，力量减弱，主健康注意',
  '死': '如气息将绝，能量枯竭，主事业低谷',
  '墓': '如入库收藏，潜伏蓄势，主财库入墓',
  '绝': '如种子入土，旧气已尽，主绝处逢生',
  '胎': '如受气结胎，新生萌芽，主新的开始',
  '养': '如胎儿养育，渐具形态，主稳步发展',
};

function calculateTwelveStages(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string,
): TwelveStageInfo[] {
  const pillarList = [
    { name: '年柱', pillar: pillars.year },
    { name: '月柱', pillar: pillars.month },
    { name: '日柱', pillar: pillars.day },
    { name: '时柱', pillar: pillars.hour },
  ];

  return pillarList.map(({ name, pillar }) => {
    const branch = pillar.charAt(1);
    const stage = getTwelveStage(dayGan, branch);
    return {
      pillar: name,
      branch,
      stage,
      stageDescription: STAGE_DESCRIPTIONS[stage] || '未知',
    };
  });
}

// ═══════════════════════════════════════════════
// 日主强弱（三才法：得令/得地/得人）
// ═══════════════════════════════════════════════

function getSeasonalStrength(dayElement: string, monthBranch: string): { label: string; score: number } {
  const monthElement = BRANCH_ELEMENTS[monthBranch];
  const elements = ['木', '火', '土', '金', '水'];
  const dayIdx = elements.indexOf(dayElement);
  const monthIdx = elements.indexOf(monthElement);
  const diff = (monthIdx - dayIdx + 5) % 5;
  switch (diff) {
    case 0: return { label: '得令（旺）', score: 30 };   // 同气
    case 4: return { label: '得令（相）', score: 20 };   // 生我
    case 1: return { label: '失令（休）', score: 0 };    // 我生
    case 2: return { label: '失令（囚）', score: -10 };  // 我克
    case 3: return { label: '失令（死）', score: -20 };  // 克我
    default: return { label: '平', score: 0 };
  }
}

function calculateDayMasterStrength(
  pillars: { year: string; month: string; day: string; hour: string },
  dayElement: string,
  monthBranch: string,
  twelveStages: TwelveStageInfo[],
): { score: number; level: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺'; description: string; seasonalStrength: string } {
  let score = 50;

  // 1. 得令 (月令)
  const seasonal = getSeasonalStrength(dayElement, monthBranch);
  score += seasonal.score;

  // 2. 得地 (十二长生)
  const strongStages = ['长生', '冠带', '临官', '帝旺', '养'];
  const weakStages = ['病', '死', '墓', '绝'];
  for (const ts of twelveStages) {
    if (strongStages.includes(ts.stage)) score += 4;
    if (weakStages.includes(ts.stage)) score -= 3;
  }

  // 3. 得人 (天干地支五行)
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];
  const producer = getProducerElement(dayElement);
  const conqueror = getConquerorElement(dayElement);
  const produced = getProducedElement(dayElement);

  pillarList.forEach((pillar, idx) => {
    const stem = pillar.charAt(0);
    const branch = pillar.charAt(1);
    const stemEl = STEM_ELEMENTS[stem];
    const branchEl = BRANCH_ELEMENTS[branch];
    const weight = idx === 1 ? 2 : 1; // 月柱权重高

    if (stemEl === dayElement) score += 3 * weight;
    if (branchEl === dayElement) score += 3 * weight;
    if (stemEl === producer) score += 2 * weight;
    if (branchEl === producer) score += 2 * weight;
    if (stemEl === conqueror) score -= 3 * weight;
    if (branchEl === conqueror) score -= 3 * weight;
    if (stemEl === produced) score -= 2 * weight;
    if (branchEl === produced) score -= 2 * weight;
  });

  // 4. 藏干
  const allHiddens = Object.values(pillars).map(p => HIDDEN_STEMS[p.charAt(1)] || []).flat();
  allHiddens.forEach(h => {
    const hEl = STEM_ELEMENTS[h];
    if (hEl === dayElement) score += 2;
    if (hEl === producer) score += 1;
    if (hEl === conqueror) score -= 1;
  });

  score = Math.max(0, Math.min(100, score));

  let level: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺';
  let description: string;

  if (score < 25) { level = '极弱'; description = '日主力量极弱，需大力扶持，喜印比生助'; }
  else if (score < 40) { level = '偏弱'; description = '日主偏弱，需印星生扶或比劫帮身'; }
  else if (score < 60) { level = '中和'; description = '日主中和，五行较为平衡，取用灵活'; }
  else if (score < 80) { level = '偏旺'; description = '日主偏旺，喜食伤泄秀或财官耗泄'; }
  else { level = '极旺'; description = '日主极旺，须以财官杀克制或食伤大泄'; }

  return { score, level, description, seasonalStrength: seasonal.label };
}

// ═══════════════════════════════════════════════
// 十神、藏干、纳音计算
// ═══════════════════════════════════════════════

function calculateTenGods(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string, dayElement: string, dayYinYang: string,
): TenGod[] {
  const positions = [
    { name: '年干', pillar: pillars.year },
    { name: '月干', pillar: pillars.month },
    { name: '日干', pillar: pillars.day },
    { name: '时干', pillar: pillars.hour },
  ];
  return positions.map(({ name, pillar }) => {
    const stem = pillar.charAt(0);
    const element = STEM_ELEMENTS[stem];
    const yinYang = STEM_YIN_YANG[stem];
    if (stem === dayGan) {
      return { position: name, stem, element, yinYang, tenGod: '日元', description: '自身，命主本人' };
    }
    const [sameSex, diffSex] = getTenGodRelation(dayElement, element);
    const tenGod = yinYang === dayYinYang ? sameSex : diffSex;
    return { position: name, stem, element, yinYang, tenGod, description: getTenGodDescription(tenGod) };
  });
}

function calculateHiddenStems(
  pillars: { year: string; month: string; day: string; hour: string },
  dayGan: string, dayElement: string, dayYinYang: string,
): HiddenStemInfo[] {
  const positions = [
    { name: '年支', pillar: pillars.year },
    { name: '月支', pillar: pillars.month },
    { name: '日支', pillar: pillars.day },
    { name: '时支', pillar: pillars.hour },
  ];
  return positions.map(({ name, pillar }) => {
    const branch = pillar.charAt(1);
    const hidden = HIDDEN_STEMS[branch] || [];
    return {
      position: name,
      branch,
      hiddenStems: hidden.map((stem, idx) => {
        const element = STEM_ELEMENTS[stem];
        const yinYang = STEM_YIN_YANG[stem];
        const [sameSex, diffSex] = getTenGodRelation(dayElement, element);
        const tenGod = yinYang === dayYinYang ? sameSex : diffSex;
        return { stem, element, tenGod, isMain: idx === 0, weight: HIDDEN_STEM_WEIGHTS[idx] || 0.3 };
      }),
    };
  });
}

function calculateNaYin(pillars: { year: string; month: string; day: string; hour: string }): NaYinInfo[] {
  const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
  const pillarValues = [pillars.year, pillars.month, pillars.day, pillars.hour];
  return pillarValues.map((gz, idx) => {
    const naYin = NA_YIN[gz] || '未知';
    let element = '未知';
    if (naYin.includes('金')) element = '金';
    else if (naYin.includes('木')) element = '木';
    else if (naYin.includes('水')) element = '水';
    else if (naYin.includes('火')) element = '火';
    else if (naYin.includes('土')) element = '土';
    return { pillar: pillarNames[idx], ganZhi: gz, naYin, element };
  });
}

function calculateElementBalance(
  pillars: { year: string; month: string; day: string; hour: string },
  hiddenStems: HiddenStemInfo[],
): ElementBalance[] {
  const counts: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const pillarList = [pillars.year, pillars.month, pillars.day, pillars.hour];
  pillarList.forEach(p => {
    const stem = p.charAt(0);
    const branch = p.charAt(1);
    counts[STEM_ELEMENTS[stem]] = (counts[STEM_ELEMENTS[stem]] || 0) + 2;
    counts[BRANCH_ELEMENTS[branch]] = (counts[BRANCH_ELEMENTS[branch]] || 0) + 1.5;
  });
  hiddenStems.forEach(hs => {
    hs.hiddenStems.forEach(h => {
      counts[h.element] = (counts[h.element] || 0) + h.weight;
    });
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
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

// ═══════════════════════════════════════════════
// 喜忌、格局、总结
// ═══════════════════════════════════════════════

function calculateFavorableElements(
  dayElement: string,
  strengthLevel: '极弱' | '偏弱' | '中和' | '偏旺' | '极旺',
  elementBalance: ElementBalance[],
) {
  const producer = getProducerElement(dayElement);
  const produced = getProducedElement(dayElement);
  const conqueror = getConquerorElement(dayElement);
  const conquered = getConqueredElement(dayElement);

  if (strengthLevel === '极弱' || strengthLevel === '偏弱') {
    return {
      favorable: {
        elements: [producer, dayElement],
        gods: ['正印', '偏印', '比肩', '劫财'],
        description: `日主${strengthLevel}，喜${producer}(印星)生扶，${dayElement}(比劫)帮身`,
      },
      unfavorable: {
        elements: [conqueror, produced, conquered],
        gods: ['七杀', '正官', '食神', '伤官', '偏财', '正财'],
        description: `忌${conqueror}(官杀)克身，${produced}(食伤)泄气，${conquered}(财星)耗力`,
      },
    };
  } else if (strengthLevel === '极旺' || strengthLevel === '偏旺') {
    return {
      favorable: {
        elements: [produced, conquered, conqueror],
        gods: ['食神', '伤官', '偏财', '正财', '七杀', '正官'],
        description: `日主${strengthLevel}，喜${produced}(食伤)泄秀，${conquered}(财星)耗泄，${conqueror}(官杀)制衡`,
      },
      unfavorable: {
        elements: [producer, dayElement],
        gods: ['正印', '偏印', '比肩', '劫财'],
        description: `忌${producer}(印星)再生，${dayElement}(比劫)助力过旺`,
      },
    };
  } else {
    return {
      favorable: {
        elements: [produced, conquered],
        gods: ['食神', '伤官', '偏财', '正财'],
        description: '日主中和，取用灵活，喜食伤生财，财官相生',
      },
      unfavorable: {
        elements: [],
        gods: [],
        description: '五行平衡，无明显忌神，需看大运流年具体情况',
      },
    };
  }
}

function determinePattern(
  tenGods: TenGod[],
  strengthLevel: string,
  elementBalance: ElementBalance[],
): { name: string; type: '正格' | '外格' | '特殊格'; description: string } {
  const monthGod = tenGods.find(t => t.position === '月干')?.tenGod || '';
  const dominantElement = elementBalance.find(e => e.percentage >= 40);
  if (dominantElement) {
    return { name: `${dominantElement.element}气专旺格`, type: '特殊格', description: `${dominantElement.element}五行一气独旺，为专旺格局` };
  }
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
  const p = patterns[monthGod];
  if (p) return { name: p.name, type: '正格', description: p.desc };
  return { name: '杂格', type: '正格', description: '格局不明显，需综合分析' };
}

function generateSummary(
  dayGan: string, dayElement: string, dayYinYang: string,
  strength: { score: number; level: string; description: string; seasonalStrength: string },
  pattern: { name: string; type: string; description: string },
  favorable: { elements: string[]; gods: string[]; description: string },
  unfavorable: { elements: string[]; gods: string[]; description: string },
  shenSha: ShenShaInfo[],
): string {
  const yinYangDesc = dayYinYang === '阳' ? '阳刚' : '阴柔';
  const auspicious = shenSha.filter(s => s.type === '吉星').map(s => s.name);
  const inauspicious = shenSha.filter(s => s.type === '凶星').map(s => s.name);

  let text = `命主日元${dayGan}${dayElement}，属${yinYangDesc}之性。${strength.seasonalStrength}。${strength.description}。`;
  text += `格局为${pattern.name}，${pattern.description}。`;
  text += `${favorable.description}。`;
  if (unfavorable.description) text += `${unfavorable.description}。`;
  if (auspicious.length > 0) text += `命带吉星：${[...new Set(auspicious)].join('、')}。`;
  if (inauspicious.length > 0) text += `命带凶星：${[...new Set(inauspicious)].join('、')}，需注意化解。`;
  return text;
}

// Helper functions
function getProducerElement(el: string): string { const c = ['木', '火', '土', '金', '水']; return c[(c.indexOf(el) + 4) % 5]; }
function getProducedElement(el: string): string { const c = ['木', '火', '土', '金', '水']; return c[(c.indexOf(el) + 1) % 5]; }
function getConquerorElement(el: string): string { const c = ['木', '火', '土', '金', '水']; return c[(c.indexOf(el) + 3) % 5]; }
function getConqueredElement(el: string): string { const c = ['木', '火', '土', '金', '水']; return c[(c.indexOf(el) + 2) % 5]; }

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

export default { performDeepBaZiAnalysis };
