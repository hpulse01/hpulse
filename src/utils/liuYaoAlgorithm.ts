/**
 * 六爻卦象引擎 v2.0 — Liu Yao Hexagram Divination
 *
 * 正统纳甲装卦体系：
 * 1. 时间起卦（梅花时间法 → 生成六爻值 6/7/8/9）
 * 2. 纳甲装卦：按八宫归属确定宫卦五行，装六亲
 * 3. 世应判定：按八宫变化规律确定世爻应爻
 * 4. 六神排布：按日干查六神（青龙/朱雀/勾陈/螣蛇/白虎/玄武）
 * 5. 用神体系：根据测事类型选取用神/原神/忌神/仇神
 * 6. 动爻变爻分析
 * 7. 三层输出：rawParams → chartResult → analysisConclusion
 *
 * 规则版本：京房纳甲法 v2.0
 */

// ═══════════════════════════════════════════════
// 基础常量
// ═══════════════════════════════════════════════

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const FIVE_ELEMENTS = ['金', '水', '木', '火', '土'];

const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 五行生克
const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

// ═══════════════════════════════════════════════
// 八宫六十四卦系统
// ═══════════════════════════════════════════════

/** 八纯卦（八宫首卦）：乾兑离震巽坎艮坤 */
const EIGHT_PALACES = [
  { name: '乾', element: '金', lines: [1,1,1,1,1,1] },
  { name: '兑', element: '金', lines: [1,1,0,1,1,1] },
  { name: '离', element: '火', lines: [1,0,1,1,0,1] },
  { name: '震', element: '木', lines: [0,0,1,0,0,1] },
  { name: '巽', element: '木', lines: [0,1,1,0,1,1] },
  { name: '坎', element: '水', lines: [0,1,0,0,1,0] },
  { name: '艮', element: '土', lines: [1,0,0,1,0,0] },
  { name: '坤', element: '土', lines: [0,0,0,0,0,0] },
];

/**
 * 纳甲表：八纯卦的天干地支纳配
 * 格式：[爻1地支, 爻2, 爻3, 爻4, 爻5, 爻6]（从下到上）
 * 乾纳甲壬，坤纳乙癸，震纳庚，巽纳辛，坎纳戊，离纳己，艮纳丙，兑纳丁
 */
interface NaJiaEntry {
  innerStem: string;  // 内卦天干
  outerStem: string;  // 外卦天干
  innerBranches: string[];  // 内卦三爻地支
  outerBranches: string[];  // 外卦三爻地支
}

const NA_JIA_TABLE: Record<string, NaJiaEntry> = {
  '乾': { innerStem: '甲', outerStem: '壬', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'] },
  '坤': { innerStem: '乙', outerStem: '癸', innerBranches: ['未', '巳', '卯'], outerBranches: ['丑', '亥', '酉'] },
  '震': { innerStem: '庚', outerStem: '庚', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'] },
  '巽': { innerStem: '辛', outerStem: '辛', innerBranches: ['丑', '亥', '酉'], outerBranches: ['未', '巳', '卯'] },
  '坎': { innerStem: '戊', outerStem: '戊', innerBranches: ['寅', '辰', '午'], outerBranches: ['申', '戌', '子'] },
  '离': { innerStem: '己', outerStem: '己', innerBranches: ['卯', '丑', '亥'], outerBranches: ['酉', '未', '巳'] },
  '艮': { innerStem: '丙', outerStem: '丙', innerBranches: ['辰', '午', '申'], outerBranches: ['戌', '子', '寅'] },
  '兑': { innerStem: '丁', outerStem: '丁', innerBranches: ['巳', '卯', '丑'], outerBranches: ['亥', '酉', '未'] },
};

// ═══════════════════════════════════════════════
// 六亲（六亲由宫卦五行定）
// ═══════════════════════════════════════════════

function getSixRelative(palaceElement: string, branchElement: string): string {
  if (palaceElement === branchElement) return '兄弟';
  if (WUXING_SHENG[palaceElement] === branchElement) return '子孙';
  if (WUXING_SHENG[branchElement] === palaceElement) return '父母';
  if (WUXING_KE[palaceElement] === branchElement) return '妻财';
  if (WUXING_KE[branchElement] === palaceElement) return '官鬼';
  return '未知';
}

// ═══════════════════════════════════════════════
// 六神
// ═══════════════════════════════════════════════

const SIX_SPIRITS_TABLE: Record<string, string[]> = {
  '甲': ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
  '乙': ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
  '丙': ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
  '丁': ['朱雀', '勾陈', '螣蛇', '白虎', '玄武', '青龙'],
  '戊': ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'],
  '己': ['勾陈', '螣蛇', '白虎', '玄武', '青龙', '朱雀'],
  '庚': ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
  '辛': ['白虎', '玄武', '青龙', '朱雀', '勾陈', '螣蛇'],
  '壬': ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'],
  '癸': ['玄武', '青龙', '朱雀', '勾陈', '螣蛇', '白虎'],
};

// ═══════════════════════════════════════════════
// 64卦表（上卦*8+下卦索引）
// ═══════════════════════════════════════════════

const TRIGRAM_LINES: number[][] = [
  [1,1,1], // 乾0
  [1,1,0], // 兑1
  [1,0,1], // 离2
  [1,0,0], // 震3
  [0,1,1], // 巽4
  [0,1,0], // 坎5
  [0,0,1], // 艮6
  [0,0,0], // 坤7
];

const TRIGRAM_NAMES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];

function linesToTrigramIndex(l: number[]): number {
  const val = (l[0] << 2) | (l[1] << 1) | l[2];
  const map: Record<number, number> = { 7:0, 6:1, 5:2, 4:3, 3:4, 2:5, 1:6, 0:7 };
  return map[val] ?? 7;
}

// 世应表：八宫每宫8卦的世爻位置（1-indexed from bottom）
const SHI_YING_TABLE: number[][] = [
  // [世爻, 应爻] for 八纯卦→一世→二世→三世→四世→五世→游魂→归魂
  // 八纯卦：世在6爻
  [6, 3], // 本宫卦（八纯卦）
  [1, 4], // 一世卦
  [2, 5], // 二世卦
  [3, 6], // 三世卦
  [4, 1], // 四世卦
  [5, 2], // 五世卦
  [4, 1], // 游魂卦
  [3, 6], // 归魂卦
];

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface HexagramLine {
  position: number;         // 1-6 (bottom to top)
  value: number;            // 6(老阴), 7(少阳), 8(少阴), 9(老阳)
  isChanging: boolean;
  yinYang: 'yin' | 'yang';
  branch: string;           // 纳甲地支
  element: string;          // 地支五行
  relative: string;         // 六亲
  spirit: string;           // 六神
  isShiYao: boolean;        // 是否世爻
  isYingYao: boolean;       // 是否应爻
  changedBranch?: string;   // 变爻后的地支
  changedElement?: string;
  changedRelative?: string;
  /** v3.0: 月建旺衰 */
  monthStrength?: '旺' | '相' | '休' | '囚' | '死';
  /** v3.0: 日辰生克 */
  dayRelation?: string;
}

export interface Hexagram {
  name: string;
  description: string;
  lines: HexagramLine[];
  changingLines: number[];
  upperTrigram: string;
  lowerTrigram: string;
  palace: string;           // 所属八宫
  palaceElement: string;    // 宫卦五行
  shiYao: number;           // 世爻位置
  yingYao: number;          // 应爻位置
  targetHexagram?: {
    name: string;
    description: string;
  };
}

/** v3.0: 用神体系 */
export interface YongShenSystem {
  /** 用神（所测事项的对应六亲） */
  yongShen: { relative: string; positions: number[]; description: string };
  /** 原神（生用神者） */
  yuanShen: { relative: string; description: string };
  /** 忌神（克用神者） */
  jiShen: { relative: string; description: string };
  /** 仇神（生忌神者） */
  chouShen: { relative: string; description: string };
  /** 用神旺衰评估 */
  strength: '旺相' | '休囚' | '受克' | '发动' | '空亡';
  /** 综合判断 */
  judgment: string;
}

/** v3.0: 伏神信息 */
export interface FuShenInfo {
  /** 缺少的六亲 */
  missingRelative: string;
  /** 伏于第几爻之下 */
  hiddenUnder: number;
  /** 伏神地支 */
  fuBranch: string;
  /** 伏神五行 */
  fuElement: string;
  /** 飞神（上面那爻）的六亲 */
  flyingRelative: string;
  /** 飞伏关系 */
  relation: '飞来生伏' | '飞来克伏' | '伏去生飞' | '伏去克飞' | '比和';
  /** 是否可用 */
  usable: boolean;
  description: string;
}

/** v3.0: 反吟伏吟 */
export interface FanFuYin {
  type: '反吟' | '伏吟';
  scope: '卦' | '爻';
  description: string;
}

export interface LiuYaoResult {
  // Layer 1: Raw Params
  rawParams: {
    divineTime: string;
    timeGanZhi: string;
    dayStem: string;
    method: string;
  };
  // Layer 2: Chart Result
  chartResult: {
    mainHexagram: Hexagram;
    hasChanging: boolean;
    changingCount: number;
  };
  // Layer 3: Analysis Conclusion
  analysisConclusion: {
    interpretation: string;
    dominantElement: string;
    overallTendency: '大吉' | '吉' | '平' | '凶' | '大凶';
    keyFindings: string[];
    /** v3.0 */
    yongShen?: YongShenSystem;
    fuShen?: FuShenInfo[];
    fanFuYin?: FanFuYin[];
  };
  // Legacy compatibility
  mainHexagram: Hexagram;
  hasChanging: boolean;
  divineTime: Date;
  timeGanZhi: string;
  interpretation: string;
}

// ═══════════════════════════════════════════════
// v3.0: 月建旺衰表 (五行在各月令的旺衰)
// ═══════════════════════════════════════════════

const MONTHLY_STRENGTH: Record<string, Record<string, '旺' | '相' | '休' | '囚' | '死'>> = {
  '寅': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '卯': { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' },
  '巳': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '午': { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' },
  '辰': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '戌': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '丑': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '未': { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' },
  '申': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '酉': { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' },
  '亥': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
  '子': { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' },
};

/** v3.0: 用神选取表 (按测事类型选用神六亲) */
const YONGSHEN_TABLE: Record<string, { yongShen: string; desc: string }> = {
  '财运': { yongShen: '妻财', desc: '测财以妻财为用神' },
  '事业': { yongShen: '官鬼', desc: '测官职事业以官鬼为用神' },
  '学业': { yongShen: '父母', desc: '测学业以父母为用神' },
  '婚姻': { yongShen: '妻财', desc: '男测婚以妻财为用神' },
  '健康': { yongShen: '官鬼', desc: '测疾病以官鬼为用神（病的象征）' },
  '子女': { yongShen: '子孙', desc: '测子女以子孙为用神' },
  '出行': { yongShen: '父母', desc: '测出行以父母为用神（车船之象）' },
  '综合': { yongShen: '世爻', desc: '综合测以世爻为用神' },
};

/** v3.0: 六亲生克关系 */
const RELATIVE_SHENG: Record<string, string> = {
  '父母': '官鬼', '官鬼': '妻财', '妻财': '子孙', '子孙': '兄弟', '兄弟': '父母',
};
const RELATIVE_KE: Record<string, string> = {
  '父母': '子孙', '官鬼': '兄弟', '妻财': '父母', '子孙': '官鬼', '兄弟': '妻财',
};

function getYuanShen(yongShen: string): string { return RELATIVE_SHENG[yongShen] || '未知'; }
function getJiShen(yongShen: string): string { return RELATIVE_KE[yongShen] || '未知'; }
function getChouShen(jiShen: string): string { return RELATIVE_SHENG[jiShen] || '未知'; }

function calculateYongShen(hex: Hexagram, queryType: string = '综合'): YongShenSystem {
  const config = YONGSHEN_TABLE[queryType] || YONGSHEN_TABLE['综合'];
  let yongRelative = config.yongShen;
  
  // 世爻特殊处理
  if (yongRelative === '世爻') {
    const shiLine = hex.lines[hex.shiYao - 1];
    yongRelative = shiLine?.relative || '兄弟';
  }
  
  const yongPositions = hex.lines
    .filter(l => l.relative === yongRelative)
    .map(l => l.position);
  
  const yuanRelative = getYuanShen(yongRelative);
  const jiRelative = getJiShen(yongRelative);
  const chouRelative = getChouShen(jiRelative);
  
  // 用神旺衰
  let strength: YongShenSystem['strength'] = '休囚';
  if (yongPositions.length > 0) {
    const yongLine = hex.lines[yongPositions[0] - 1];
    if (yongLine.isChanging) strength = '发动';
    else if (yongLine.monthStrength === '旺' || yongLine.monthStrength === '相') strength = '旺相';
    else strength = '休囚';
    // 检查是否受克
    const jiLines = hex.lines.filter(l => l.relative === jiRelative && l.isChanging);
    if (jiLines.length > 0) strength = '受克';
  }
  
  let judgment = '';
  if (yongPositions.length === 0) {
    judgment = `用神${yongRelative}不现于卦中，需寻伏神。`;
  } else if (strength === '旺相') {
    judgment = `用神${yongRelative}旺相有力，事可成。`;
  } else if (strength === '发动') {
    judgment = `用神${yongRelative}发动，事情将有变化。`;
  } else if (strength === '受克') {
    judgment = `用神${yongRelative}受忌神${jiRelative}动克，事多阻碍。`;
  } else {
    judgment = `用神${yongRelative}休囚无力，事难成或需等待。`;
  }

  return {
    yongShen: { relative: yongRelative, positions: yongPositions, description: config.desc },
    yuanShen: { relative: yuanRelative, description: `原神${yuanRelative}生用神` },
    jiShen: { relative: jiRelative, description: `忌神${jiRelative}克用神` },
    chouShen: { relative: chouRelative, description: `仇神${chouRelative}生忌神` },
    strength,
    judgment,
  };
}

/** v3.0: 伏神计算 */
function calculateFuShen(hex: Hexagram): FuShenInfo[] {
  const existingRelatives = new Set(hex.lines.map(l => l.relative));
  const allRelatives = ['父母', '兄弟', '子孙', '妻财', '官鬼'];
  const missing = allRelatives.filter(r => !existingRelatives.has(r));
  
  if (missing.length === 0) return [];
  
  // 伏神藏于本宫八纯卦对应爻下
  const palaceEntry = EIGHT_PALACES.find(p => p.name === hex.palace);
  if (!palaceEntry) return [];
  
  const pureNJ = NA_JIA_TABLE[hex.palace];
  if (!pureNJ) return [];
  
  const pureBranches = [...pureNJ.innerBranches, ...pureNJ.outerBranches];
  
  return missing.map(missingRelative => {
    // 找到八纯卦中该六亲所在爻位
    let hiddenPos = 1;
    let fuBranch = '';
    for (let i = 0; i < 6; i++) {
      const br = pureBranches[i];
      const el = BRANCH_ELEMENTS[br];
      const rel = getSixRelative(palaceEntry.element, el);
      if (rel === missingRelative) {
        hiddenPos = i + 1;
        fuBranch = br;
        break;
      }
    }
    
    if (!fuBranch) fuBranch = pureBranches[0];
    
    const fuElement = BRANCH_ELEMENTS[fuBranch] || '土';
    const flyingLine = hex.lines[hiddenPos - 1];
    const flyingElement = flyingLine?.element || '土';
    const flyingRelative = flyingLine?.relative || '未知';
    
    // 飞伏关系
    let relation: FuShenInfo['relation'] = '比和';
    if (fuElement === flyingElement) relation = '比和';
    else if (WUXING_SHENG[flyingElement] === fuElement) relation = '飞来生伏';
    else if (WUXING_KE[flyingElement] === fuElement) relation = '飞来克伏';
    else if (WUXING_SHENG[fuElement] === flyingElement) relation = '伏去生飞';
    else if (WUXING_KE[fuElement] === flyingElement) relation = '伏去克飞';
    
    const usable = relation === '飞来生伏' || relation === '比和';
    
    return {
      missingRelative, hiddenUnder: hiddenPos, fuBranch, fuElement,
      flyingRelative, relation, usable,
      description: `${missingRelative}伏于第${hiddenPos}爻${flyingRelative}之下，${relation}，${usable ? '伏神可用' : '伏神受制难用'}`,
    };
  });
}

/** v3.0: 反吟伏吟检测 */
function detectFanFuYin(hex: Hexagram): FanFuYin[] {
  const results: FanFuYin[] = [];
  
  if (!hex.targetHexagram) return results;
  
  // 卦级反吟：变卦与本卦六冲
  const CHONG_MAP: Record<string, string> = {
    '乾': '巽', '巽': '乾', '坤': '艮', '艮': '坤',
    '离': '坎', '坎': '离', '震': '兑', '兑': '震',
  };
  
  // 简化：如果上下卦都变为冲卦
  const changingLines = hex.changingLines;
  if (changingLines.length >= 4) {
    results.push({
      type: '反吟', scope: '卦',
      description: '本卦与变卦多爻相反，为反吟之象，主事情反复不定',
    });
  }
  
  // 伏吟：变卦与本卦相同（即无变化）
  if (changingLines.length === 0) {
    results.push({
      type: '伏吟', scope: '卦',
      description: '六爻皆静为伏吟之象，主事情停滞呻吟',
    });
  }
  
  // 爻级反吟/伏吟
  for (const line of hex.lines) {
    if (line.isChanging && line.changedBranch) {
      const BRANCH_CHONG: Record<string, string> = {
        '子': '午', '午': '子', '丑': '未', '未': '丑',
        '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
        '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
      };
      if (BRANCH_CHONG[line.branch] === line.changedBranch) {
        results.push({
          type: '反吟', scope: '爻',
          description: `第${line.position}爻${line.branch}动变${line.changedBranch}，爻反吟，该爻所代表之事反复`,
        });
      }
      if (line.branch === line.changedBranch) {
        results.push({
          type: '伏吟', scope: '爻',
          description: `第${line.position}爻动而不变，爻伏吟，该爻所代表之事难进`,
        });
      }
    }
  }
  
  return results;
}

// ═══════════════════════════════════════════════
// 64卦名表
// ═══════════════════════════════════════════════

const HEXAGRAM_64: Record<string, { name: string; desc: string }> = {
  '乾乾': { name: '乾为天', desc: '刚健中正，自强不息' },
  '兑乾': { name: '天泽履', desc: '履行正道，如履虎尾' },
  '离乾': { name: '天火同人', desc: '志同道合，与人和睦' },
  '震乾': { name: '天雷无妄', desc: '无妄真诚，不妄求取' },
  '巽乾': { name: '天风姤', desc: '邂逅相遇，阴生于下' },
  '坎乾': { name: '天水讼', desc: '争讼之事，戒慎谨慎' },
  '艮乾': { name: '天山遁', desc: '退避隐遁，远小人' },
  '坤乾': { name: '天地否', desc: '闭塞不通，否极泰来' },
  '乾兑': { name: '泽天夬', desc: '决断果敢，扬于王庭' },
  '兑兑': { name: '兑为泽', desc: '喜悦和谐，口舌言辞' },
  '离兑': { name: '泽火革', desc: '革故鼎新，变革更新' },
  '震兑': { name: '泽雷随', desc: '随时而动，顺从自然' },
  '巽兑': { name: '泽风大过', desc: '过度之象，矫枉过正' },
  '坎兑': { name: '泽水困', desc: '困穷窘迫，坚守正道' },
  '艮兑': { name: '泽山咸', desc: '感应相通，少男少女' },
  '坤兑': { name: '泽地萃', desc: '聚集荟萃，群贤毕至' },
  '乾离': { name: '火天大有', desc: '大有收获，丰盛富足' },
  '兑离': { name: '火泽睽', desc: '乖违悖异，睽而能合' },
  '离离': { name: '离为火', desc: '附丽光明，柔顺贞正' },
  '震离': { name: '火雷噬嗑', desc: '刑狱法制，明断是非' },
  '巽离': { name: '火风鼎', desc: '鼎立新意，稳固发展' },
  '坎离': { name: '火水未济', desc: '未济待渡，终则有始' },
  '艮离': { name: '火山旅', desc: '羁旅在外，谨慎小心' },
  '坤离': { name: '火地晋', desc: '光明上进，前途光明' },
  '乾震': { name: '雷天大壮', desc: '刚壮威严，慎勿过刚' },
  '兑震': { name: '雷泽归妹', desc: '归妹从兄，有所归依' },
  '离震': { name: '雷火丰', desc: '丰盛盈满，日中则昃' },
  '震震': { name: '震为雷', desc: '震惊百里，不丧匕鬯' },
  '巽震': { name: '雷风恒', desc: '恒久不变，持之以恒' },
  '坎震': { name: '雷水解', desc: '解除困难，缓和松懈' },
  '艮震': { name: '雷山小过', desc: '小有过越，飞鸟遗音' },
  '坤震': { name: '雷地豫', desc: '顺以动，和乐自得' },
  '乾巽': { name: '风天小畜', desc: '小有积蓄，密云不雨' },
  '兑巽': { name: '风泽中孚', desc: '诚信中正，信及豚鱼' },
  '离巽': { name: '风火家人', desc: '治家之道，正位于内' },
  '震巽': { name: '风雷益', desc: '增益补充，损上益下' },
  '巽巽': { name: '巽为风', desc: '风行地上，随风潜入' },
  '坎巽': { name: '风水涣', desc: '涣散离散，聚散有时' },
  '艮巽': { name: '风山渐', desc: '循序渐进，渐进有序' },
  '坤巽': { name: '风地观', desc: '观察审视，省察自身' },
  '乾坎': { name: '水天需', desc: '等待时机，饮食宴乐' },
  '兑坎': { name: '水泽节', desc: '节制适度，有节有度' },
  '离坎': { name: '水火既济', desc: '已济成功，守成防变' },
  '震坎': { name: '水雷屯', desc: '万物始生，艰难起步' },
  '巽坎': { name: '水风井', desc: '井养不穷，往来井井' },
  '坎坎': { name: '坎为水', desc: '坎陷重重，习坎不惧' },
  '艮坎': { name: '水山蹇', desc: '艰难险阻，知难而退' },
  '坤坎': { name: '水地比', desc: '亲附比邻，团结协作' },
  '乾艮': { name: '山天大畜', desc: '大有积蓄，厚积薄发' },
  '兑艮': { name: '山泽损', desc: '损己益人，损有益无' },
  '离艮': { name: '山火贲', desc: '文饰点缀，外美内实' },
  '震艮': { name: '山雷颐', desc: '养正之道，修身养性' },
  '巽艮': { name: '山风蛊', desc: '除旧布新，纠正弊病' },
  '坎艮': { name: '山水蒙', desc: '启蒙养正，教化育人' },
  '艮艮': { name: '艮为山', desc: '止于至善，静止安定' },
  '坤艮': { name: '山地剥', desc: '剥落消亡，谨慎守成' },
  '乾坤': { name: '地天泰', desc: '天地交泰，通达亨通' },
  '兑坤': { name: '地泽临', desc: '居临天下，惠泽万民' },
  '离坤': { name: '地火明夷', desc: '光明损伤，韬光养晦' },
  '震坤': { name: '地雷复', desc: '一阳来复，返本还原' },
  '巽坤': { name: '地风升', desc: '上升进取，积小成大' },
  '坎坤': { name: '地水师', desc: '师出以律，以正治众' },
  '艮坤': { name: '地山谦', desc: '谦虚受益，低调处世' },
  '坤坤': { name: '坤为地', desc: '厚德载物，柔顺利贞' },
};

// ═══════════════════════════════════════════════
// 起卦与纳甲核心
// ═══════════════════════════════════════════════

function calculateLineValue(base: number, time: number, second: number, position: number): number {
  const seed = (base * position + time * (7 - position) + second + position * 13) % 16;
  if (seed === 0) return 6;
  if (seed <= 3) return 9;
  if (seed <= 8) return 7;
  return 8;
}

function getHexagramName(upperIdx: number, lowerIdx: number): { name: string; desc: string } {
  const key = `${TRIGRAM_NAMES[lowerIdx]}${TRIGRAM_NAMES[upperIdx]}`;
  return HEXAGRAM_64[key] || { name: `${TRIGRAM_NAMES[upperIdx]}${TRIGRAM_NAMES[lowerIdx]}卦`, desc: '待解之卦' };
}

/**
 * 确定卦的八宫归属和世应
 * 简化方法：比较本卦与八纯卦的差异数确定宫次
 */
function determinePalaceAndShiYing(lines: number[]): {
  palace: string;
  palaceElement: string;
  shiYao: number;
  yingYao: number;
  gongOrder: number; // 0-7 在宫中的次序
} {
  // 尝试每个宫，找到最匹配的
  let bestPalace = 0;
  let bestOrder = 0;
  let bestMatch = -1;

  for (let p = 0; p < 8; p++) {
    const pureLines = EIGHT_PALACES[p].lines;
    let matchCount = 0;
    for (let i = 0; i < 6; i++) {
      if (lines[i] === pureLines[i]) matchCount++;
    }
    if (matchCount > bestMatch) {
      bestMatch = matchCount;
      bestPalace = p;
      // Determine order within palace
      if (matchCount === 6) bestOrder = 0; // 八纯卦
      else if (matchCount === 5) {
        // 一世到五世
        for (let i = 0; i < 6; i++) {
          if (lines[i] !== pureLines[i]) { bestOrder = i + 1; break; }
        }
      }
      else bestOrder = Math.max(1, 6 - matchCount);
    }
  }

  const order = Math.min(bestOrder, 7);
  const [shi, ying] = SHI_YING_TABLE[order] || [6, 3];
  const pal = EIGHT_PALACES[bestPalace];

  return {
    palace: pal.name,
    palaceElement: pal.element,
    shiYao: shi,
    yingYao: ying,
    gongOrder: order,
  };
}

/**
 * 纳甲装卦：根据上下卦的经卦确定每爻地支
 */
function assignNaJia(upperTrigramName: string, lowerTrigramName: string): string[] {
  const lowerNJ = NA_JIA_TABLE[lowerTrigramName];
  const upperNJ = NA_JIA_TABLE[upperTrigramName];
  if (!lowerNJ || !upperNJ) {
    // Fallback
    return ['子', '寅', '辰', '午', '申', '戌'];
  }
  return [...lowerNJ.innerBranches, ...upperNJ.outerBranches];
}

function getTimeGanZhi(date: Date): { ganZhi: string; dayStem: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  // 日干支
  const base2 = new Date(2000, 0, 1);
  const diff2 = Math.round((date.getTime() - base2.getTime()) / 86400000);
  const dayStemIdx = ((diff2 % 10) + 4 + 100) % 10;
  const dayStem = STEMS[dayStemIdx];

  const hourBranchIndex = Math.floor(((hour + 1) % 24) / 2);
  const hourStemIndex = ((dayStemIdx % 5) * 2 + hourBranchIndex) % 10;
  const ganZhi = `${STEMS[hourStemIndex]}${BRANCHES[hourBranchIndex]}`;

  return { ganZhi, dayStem };
}

// ═══════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════

export function calculateLiuYaoHexagram(timestamp: Date = new Date()): LiuYaoResult {
  const year = timestamp.getFullYear();
  const month = timestamp.getMonth() + 1;
  const day = timestamp.getDate();
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const second = timestamp.getSeconds();

  const baseSum = year + month + day;
  const timeSum = hour + minute;

  // 1. 生成六爻值
  const rawLines: { value: number; yinYang: 'yin' | 'yang'; isChanging: boolean }[] = [];
  for (let i = 1; i <= 6; i++) {
    const value = calculateLineValue(baseSum, timeSum, second, i);
    const isChanging = value === 6 || value === 9;
    const yinYang = (value === 7 || value === 9) ? 'yang' as const : 'yin' as const;
    rawLines.push({ value, yinYang, isChanging });
  }

  // 2. 确定上下卦
  const lowerBits = rawLines.slice(0, 3).map(l => l.yinYang === 'yang' ? 1 : 0);
  const upperBits = rawLines.slice(3, 6).map(l => l.yinYang === 'yang' ? 1 : 0);
  const lowerIdx = linesToTrigramIndex(lowerBits);
  const upperIdx = linesToTrigramIndex(upperBits);
  const lowerName = TRIGRAM_NAMES[lowerIdx];
  const upperName = TRIGRAM_NAMES[upperIdx];

  // 3. 纳甲装卦
  const naJiaBranches = assignNaJia(upperName, lowerName);

  // 4. 确定八宫、世应
  const fullLines = rawLines.map(l => l.yinYang === 'yang' ? 1 : 0);
  const { palace, palaceElement, shiYao, yingYao } = determinePalaceAndShiYing(fullLines);

  // 5. 六神
  const { ganZhi: timeGanZhi, dayStem } = getTimeGanZhi(timestamp);
  const spirits = SIX_SPIRITS_TABLE[dayStem] || SIX_SPIRITS_TABLE['甲'];

  // 6. 装卦
  const changingLines: number[] = [];
  const hexagramLines: HexagramLine[] = rawLines.map((raw, idx) => {
    const position = idx + 1;
    const branch = naJiaBranches[idx] || BRANCHES[(baseSum + idx) % 12];
    const element = BRANCH_ELEMENTS[branch] || '土';
    const relative = getSixRelative(palaceElement, element);
    const spirit = spirits[idx] || '青龙';
    const isShiYao = position === shiYao;
    const isYingYao = position === yingYao;

    if (raw.isChanging) changingLines.push(position);

    // 变爻
    let changedBranch: string | undefined;
    let changedElement: string | undefined;
    let changedRelative: string | undefined;
    if (raw.isChanging) {
      // 变卦后的经卦
      const changedBits = [...fullLines];
      changedBits[idx] = changedBits[idx] === 1 ? 0 : 1;
      const changedLowerIdx = linesToTrigramIndex(changedBits.slice(0, 3));
      const changedUpperIdx = linesToTrigramIndex(changedBits.slice(3, 6));
      const changedNJ = assignNaJia(TRIGRAM_NAMES[changedUpperIdx], TRIGRAM_NAMES[changedLowerIdx]);
      changedBranch = changedNJ[idx] || branch;
      changedElement = BRANCH_ELEMENTS[changedBranch] || element;
      changedRelative = getSixRelative(palaceElement, changedElement);
    }

    return {
      position,
      value: raw.value,
      isChanging: raw.isChanging,
      yinYang: raw.yinYang,
      branch,
      element,
      relative,
      spirit,
      isShiYao,
      isYingYao,
      changedBranch,
      changedElement,
      changedRelative,
    };
  });

  // 7. 卦名
  const hexInfo = getHexagramName(upperIdx, lowerIdx);

  // 8. 变卦
  let targetHexagram: Hexagram['targetHexagram'] | undefined;
  if (changingLines.length > 0) {
    const changedBits = [...fullLines];
    changingLines.forEach(pos => { changedBits[pos - 1] = changedBits[pos - 1] === 1 ? 0 : 1; });
    const cLower = linesToTrigramIndex(changedBits.slice(0, 3));
    const cUpper = linesToTrigramIndex(changedBits.slice(3, 6));
    const cInfo = getHexagramName(cUpper, cLower);
    targetHexagram = { name: cInfo.name, description: cInfo.desc };
  }

  const mainHexagram: Hexagram = {
    name: hexInfo.name,
    description: hexInfo.desc,
    lines: hexagramLines,
    changingLines,
    upperTrigram: upperName,
    lowerTrigram: lowerName,
    palace,
    palaceElement,
    shiYao,
    yingYao,
    targetHexagram,
  };

  // 9. 分析
  const interpretation = generateInterpretation(mainHexagram);
  const dominantElement = getDominantElement(hexagramLines);
  const tendency = assessTendency(mainHexagram);
  const keyFindings = extractKeyFindings(mainHexagram);

  return {
    rawParams: {
      divineTime: timestamp.toISOString(),
      timeGanZhi,
      dayStem,
      method: '时间起卦（京房纳甲法）',
    },
    chartResult: {
      mainHexagram,
      hasChanging: changingLines.length > 0,
      changingCount: changingLines.length,
    },
    analysisConclusion: {
      interpretation,
      dominantElement,
      overallTendency: tendency,
      keyFindings,
    },
    mainHexagram,
    hasChanging: changingLines.length > 0,
    divineTime: timestamp,
    timeGanZhi,
    interpretation,
  };
}

// ═══════════════════════════════════════════════
// 分析辅助
// ═══════════════════════════════════════════════

function generateInterpretation(hex: Hexagram): string {
  let interp = `${hex.name}，${hex.description}。归${hex.palace}宫(${hex.palaceElement})。`;
  interp += `世爻在第${hex.shiYao}爻(${hex.lines[hex.shiYao - 1]?.relative || ''}${hex.lines[hex.shiYao - 1]?.branch || ''})，`;
  interp += `应爻在第${hex.yingYao}爻(${hex.lines[hex.yingYao - 1]?.relative || ''}${hex.lines[hex.yingYao - 1]?.branch || ''})。`;

  if (hex.changingLines.length > 0) {
    interp += `动爻在${hex.changingLines.map(l => `第${l}爻(${hex.lines[l-1]?.relative || ''})`).join('、')}。`;
    if (hex.targetHexagram) {
      interp += `变卦为${hex.targetHexagram.name}，${hex.targetHexagram.description}。`;
    }
  } else {
    interp += '六爻安静，卦象稳定。';
  }

  return interp;
}

function getDominantElement(lines: HexagramLine[]): string {
  const counts: Record<string, number> = {};
  lines.forEach(l => { counts[l.element] = (counts[l.element] || 0) + 1; });
  let max = 0, dominant = '金';
  Object.entries(counts).forEach(([el, count]) => { if (count > max) { max = count; dominant = el; } });
  return dominant;
}

function assessTendency(hex: Hexagram): '大吉' | '吉' | '平' | '凶' | '大凶' {
  let score = 50;
  const shiLine = hex.lines[hex.shiYao - 1];
  if (shiLine) {
    // 世爻旺相加分
    if (['官鬼', '父母'].includes(shiLine.relative)) score -= 5;
    if (['子孙', '妻财'].includes(shiLine.relative)) score += 5;
    if (shiLine.relative === '兄弟') score += 2;
  }

  // 动爻吉凶
  for (const pos of hex.changingLines) {
    const line = hex.lines[pos - 1];
    if (line.relative === '子孙') score += 8;
    if (line.relative === '官鬼') score -= 6;
    if (line.relative === '妻财') score += 5;
  }

  // 六神
  const shiSpirit = hex.lines[hex.shiYao - 1]?.spirit;
  if (shiSpirit === '青龙') score += 5;
  if (shiSpirit === '白虎') score -= 5;

  if (score >= 70) return '大吉';
  if (score >= 58) return '吉';
  if (score >= 42) return '平';
  if (score >= 30) return '凶';
  return '大凶';
}

function extractKeyFindings(hex: Hexagram): string[] {
  const findings: string[] = [];
  const shiLine = hex.lines[hex.shiYao - 1];
  if (shiLine) {
    findings.push(`世爻${shiLine.relative}${shiLine.branch}(${shiLine.element})持${shiLine.spirit}`);
  }
  const yingLine = hex.lines[hex.yingYao - 1];
  if (yingLine) {
    findings.push(`应爻${yingLine.relative}${yingLine.branch}(${yingLine.element})`);
  }
  for (const pos of hex.changingLines) {
    const line = hex.lines[pos - 1];
    findings.push(`第${pos}爻${line.relative}${line.branch}发动→变${line.changedBranch || '?'}(${line.changedRelative || '?'})`);
  }
  return findings;
}

export function formatHexagramDisplay(hex: Hexagram): string {
  const lineSymbols = hex.lines.map(l => {
    const base = l.yinYang === 'yang' ? '▅▅▅▅▅' : '▅▅ ▅▅';
    const marker = l.isChanging ? ' ○' : '';
    const shi = l.isShiYao ? ' 世' : l.isYingYao ? ' 应' : '';
    return `${base}${marker} ${l.branch}${l.relative}(${l.element}) ${l.spirit}${shi}`;
  }).reverse();
  return lineSymbols.join('\n');
}

export default { calculateLiuYaoHexagram, formatHexagramDisplay };
