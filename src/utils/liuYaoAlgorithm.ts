/**
 * Liu Yao (六爻) Hexagram Divination Algorithm
 * 
 * Based on the time of calculation (when user clicks to calculate),
 * generates a hexagram using the traditional method.
 * 
 * This creates a "Time Hexagram" (时间卦) that reflects the cosmic energy
 * at the moment of inquiry, combining with BaZi and Iron Plate for deeper insight.
 */

// 64 Hexagrams with their names and basic meanings
const HEXAGRAM_DATA: Record<string, { name: string; symbol: string; description: string }> = {
  '111111': { name: '乾为天', symbol: '☰', description: '刚健中正，自强不息' },
  '000000': { name: '坤为地', symbol: '☷', description: '厚德载物，柔顺利贞' },
  '100010': { name: '水雷屯', symbol: '䷂', description: '万物始生，艰难起步' },
  '010001': { name: '山水蒙', symbol: '䷃', description: '启蒙养正，教化育人' },
  '111010': { name: '水天需', symbol: '䷄', description: '等待时机，饮食宴乐' },
  '010111': { name: '天水讼', symbol: '䷅', description: '争讼之事，戒慎谨慎' },
  '010000': { name: '地水师', symbol: '䷆', description: '师出以律，以正治众' },
  '000010': { name: '水地比', symbol: '䷇', description: '亲附比邻，团结协作' },
  '111011': { name: '风天小畜', symbol: '䷈', description: '小有积蓄，密云不雨' },
  '110111': { name: '天泽履', symbol: '䷉', description: '履行正道，如履虎尾' },
  '111000': { name: '地天泰', symbol: '䷊', description: '天地交泰，通达亨通' },
  '000111': { name: '天地否', symbol: '䷋', description: '闭塞不通，否极泰来' },
  '101111': { name: '天火同人', symbol: '䷌', description: '志同道合，与人和睦' },
  '111101': { name: '火天大有', symbol: '䷍', description: '大有收获，丰盛富足' },
  '001000': { name: '地山谦', symbol: '䷎', description: '谦虚受益，低调处世' },
  '000100': { name: '雷地豫', symbol: '䷏', description: '顺以动，和乐自得' },
  '100110': { name: '泽雷随', symbol: '䷐', description: '随时而动，顺从自然' },
  '011001': { name: '山风蛊', symbol: '䷑', description: '除旧布新，纠正弊病' },
  '110000': { name: '地泽临', symbol: '䷒', description: '居临天下，惠泽万民' },
  '000011': { name: '风地观', symbol: '䷓', description: '观察审视，省察自身' },
  '100101': { name: '火雷噬嗑', symbol: '䷔', description: '刑狱法制，明断是非' },
  '101001': { name: '山火贲', symbol: '䷕', description: '文饰点缀，外美内实' },
  '000001': { name: '山地剥', symbol: '䷖', description: '剥落消亡，谨慎守成' },
  '100000': { name: '地雷复', symbol: '䷗', description: '一阳来复，返本还原' },
  '100111': { name: '天雷无妄', symbol: '䷘', description: '无妄真诚，不妄求取' },
  '111001': { name: '山天大畜', symbol: '䷙', description: '大有积蓄，厚积薄发' },
  '100001': { name: '山雷颐', symbol: '䷚', description: '养正之道，修身养性' },
  '011110': { name: '泽风大过', symbol: '䷛', description: '过度之象，矫枉过正' },
  '010010': { name: '坎为水', symbol: '䷜', description: '坎陷重重，习坎不惧' },
  '101101': { name: '离为火', symbol: '䷝', description: '附丽光明，柔顺贞正' },
  '001110': { name: '泽山咸', symbol: '䷞', description: '感应相通，少男少女' },
  '011100': { name: '雷风恒', symbol: '䷟', description: '恒久不变，持之以恒' },
  '001111': { name: '天山遁', symbol: '䷠', description: '退避隐遁，远小人' },
  '111100': { name: '雷天大壮', symbol: '䷡', description: '刚壮威严，慎勿过刚' },
  '000101': { name: '火地晋', symbol: '䷢', description: '光明上进，前途光明' },
  '101000': { name: '地火明夷', symbol: '䷣', description: '光明损伤，韬光养晦' },
  '101011': { name: '风火家人', symbol: '䷤', description: '治家之道，正位于内' },
  '110101': { name: '火泽睽', symbol: '䷥', description: '乖违悖异，睽而能合' },
  '001010': { name: '水山蹇', symbol: '䷦', description: '艰难险阻，知难而退' },
  '010100': { name: '雷水解', symbol: '䷧', description: '解除困难，缓和松懈' },
  '110001': { name: '山泽损', symbol: '䷨', description: '损己益人，损有益无' },
  '100011': { name: '风雷益', symbol: '䷩', description: '增益补充，损上益下' },
  '111110': { name: '泽天夬', symbol: '䷪', description: '决断果敢，扬于王庭' },
  '011111': { name: '天风姤', symbol: '䷫', description: '邂逅相遇，阴生于下' },
  '000110': { name: '泽地萃', symbol: '䷬', description: '聚集荟萃，群贤毕至' },
  '011000': { name: '地风升', symbol: '䷭', description: '上升进取，积小成大' },
  '010110': { name: '泽水困', symbol: '䷮', description: '困穷窘迫，坚守正道' },
  '011010': { name: '水风井', symbol: '䷯', description: '井养不穷，往来井井' },
  '101110': { name: '泽火革', symbol: '䷰', description: '革故鼎新，变革更新' },
  '011101': { name: '火风鼎', symbol: '䷱', description: '鼎立新意，稳固发展' },
  '100100': { name: '震为雷', symbol: '䷲', description: '震惊百里，不丧匕鬯' },
  '001001': { name: '艮为山', symbol: '䷳', description: '止于至善，静止安定' },
  '001011': { name: '风山渐', symbol: '䷴', description: '循序渐进，渐进有序' },
  '110100': { name: '雷泽归妹', symbol: '䷵', description: '归妹从兄，有所归依' },
  '101100': { name: '雷火丰', symbol: '䷶', description: '丰盛盈满，日中则昃' },
  '001101': { name: '火山旅', symbol: '䷷', description: '羁旅在外，谨慎小心' },
  '011011': { name: '巽为风', symbol: '䷸', description: '风行地上，随风潜入' },
  '110110': { name: '兑为泽', symbol: '䷹', description: '喜悦和谐，口舌言辞' },
  '010011': { name: '风水涣', symbol: '䷺', description: '涣散离散，聚散有时' },
  '110010': { name: '水泽节', symbol: '䷻', description: '节制适度，有节有度' },
  '110011': { name: '风泽中孚', symbol: '䷼', description: '诚信中正，信及豚鱼' },
  '001100': { name: '雷山小过', symbol: '䷽', description: '小有过越，飞鸟遗音' },
  '010101': { name: '水火既济', symbol: '䷾', description: '已济成功，守成防变' },
  '101010': { name: '火水未济', symbol: '䷿', description: '未济待渡，终则有始' },
};

// 六亲关系
const SIX_RELATIVES = ['父母', '兄弟', '子孙', '妻财', '官鬼'];

// 地支
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 五行
const FIVE_ELEMENTS = ['金', '水', '木', '火', '土'];

export interface HexagramLine {
  position: number;      // 1-6, bottom to top
  value: number;         // 6, 7, 8, 9 (old yin, young yang, young yin, old yang)
  isChanging: boolean;   // true if 6 or 9
  yinYang: 'yin' | 'yang';
  branch: string;        // 地支
  relative: string;      // 六亲
  element: string;       // 五行
}

export interface Hexagram {
  name: string;
  symbol: string;
  description: string;
  lines: HexagramLine[];
  changingLines: number[];
  binaryCode: string;
  targetHexagram?: {
    name: string;
    symbol: string;
    description: string;
    binaryCode: string;
  };
}

export interface LiuYaoResult {
  mainHexagram: Hexagram;
  hasChanging: boolean;
  divineTime: Date;
  timeGanZhi: string;
  interpretation: string;
}

/**
 * Calculate Liu Yao hexagram based on timestamp
 * Uses the traditional "Time Hexagram" (时间卦) method
 */
export function calculateLiuYaoHexagram(timestamp: Date = new Date()): LiuYaoResult {
  const year = timestamp.getFullYear();
  const month = timestamp.getMonth() + 1;
  const day = timestamp.getDate();
  const hour = timestamp.getHours();
  const minute = timestamp.getMinutes();
  const second = timestamp.getSeconds();

  // Calculate the six lines using time components
  // Traditional method: Use sum of time components to determine each line
  const lines: HexagramLine[] = [];
  
  // Sum for different purposes
  const baseSum = year + month + day;
  const timeSum = hour + minute;
  const fullSum = baseSum + timeSum + second;

  // Generate 6 lines (bottom to top)
  for (let i = 1; i <= 6; i++) {
    // Each line uses a different combination for randomness yet determinism
    const lineValue = calculateLineValue(baseSum, timeSum, second, i);
    const isChanging = lineValue === 6 || lineValue === 9;
    const yinYang = (lineValue === 7 || lineValue === 9) ? 'yang' : 'yin';
    
    // Assign branch and relative based on position
    const branchIndex = (baseSum + i) % 12;
    const relativeIndex = (fullSum + i) % 5;
    const elementIndex = (baseSum + timeSum + i) % 5;

    lines.push({
      position: i,
      value: lineValue,
      isChanging,
      yinYang,
      branch: EARTHLY_BRANCHES[branchIndex],
      relative: SIX_RELATIVES[relativeIndex],
      element: FIVE_ELEMENTS[elementIndex],
    });
  }

  // Build binary code (1=yang, 0=yin)
  const binaryCode = lines.map(l => l.yinYang === 'yang' ? '1' : '0').join('');
  const changingLines = lines.filter(l => l.isChanging).map(l => l.position);

  // Get main hexagram
  const mainData = HEXAGRAM_DATA[binaryCode] || {
    name: '未知卦',
    symbol: '?',
    description: '待解之卦',
  };

  const mainHexagram: Hexagram = {
    name: mainData.name,
    symbol: mainData.symbol,
    description: mainData.description,
    lines,
    changingLines,
    binaryCode,
  };

  // Calculate changed hexagram if there are changing lines
  if (changingLines.length > 0) {
    const changedBinary = lines.map((l, idx) => {
      if (l.isChanging) {
        return l.yinYang === 'yang' ? '0' : '1';
      }
      return l.yinYang === 'yang' ? '1' : '0';
    }).join('');

    const targetData = HEXAGRAM_DATA[changedBinary] || {
      name: '未知变卦',
      symbol: '?',
      description: '待解之卦',
    };

    mainHexagram.targetHexagram = {
      name: targetData.name,
      symbol: targetData.symbol,
      description: targetData.description,
      binaryCode: changedBinary,
    };
  }

  // Generate time GanZhi
  const timeGanZhi = getTimeGanZhi(timestamp);

  // Generate interpretation
  const interpretation = generateInterpretation(mainHexagram, changingLines);

  return {
    mainHexagram,
    hasChanging: changingLines.length > 0,
    divineTime: timestamp,
    timeGanZhi,
    interpretation,
  };
}

/**
 * Calculate individual line value (6, 7, 8, or 9)
 * 6 = Old Yin (changes to Yang)
 * 7 = Young Yang (stable)
 * 8 = Young Yin (stable)
 * 9 = Old Yang (changes to Yin)
 */
function calculateLineValue(base: number, time: number, second: number, position: number): number {
  const seed = (base * position + time * (7 - position) + second + position * 13) % 16;
  
  // Distribution based on traditional coin method probabilities
  // 6: 1/16, 7: 3/16, 8: 5/16, 9: 7/16 (adjusted for algorithm)
  if (seed === 0) return 6;        // Old Yin (rare)
  if (seed <= 3) return 9;         // Old Yang
  if (seed <= 8) return 7;         // Young Yang
  return 8;                         // Young Yin
}

/**
 * Get the GanZhi for the current hour
 */
function getTimeGanZhi(date: Date): string {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  // Simplified GanZhi calculation for the hour
  const hourBranchIndex = Math.floor(((hour + 1) % 24) / 2);
  const dayStemIndex = (year + month + day) % 10;
  const hourStemIndex = ((dayStemIndex % 5) * 2 + hourBranchIndex) % 10;

  return `${STEMS[hourStemIndex]}${BRANCHES[hourBranchIndex]}`;
}

/**
 * Generate basic interpretation of the hexagram
 */
function generateInterpretation(hex: Hexagram, changingLines: number[]): string {
  let interp = `${hex.name}，${hex.description}。`;

  if (changingLines.length > 0) {
    interp += `动爻在${changingLines.map(l => `第${l}爻`).join('、')}。`;
    
    if (hex.targetHexagram) {
      interp += `变卦为${hex.targetHexagram.name}，${hex.targetHexagram.description}。`;
    }
  } else {
    interp += '六爻安静，卦象稳定。';
  }

  // Add element interpretation
  const dominantElement = getDominantElement(hex.lines);
  interp += `卦中${dominantElement}气较旺。`;

  return interp;
}

/**
 * Get the dominant element in the hexagram
 */
function getDominantElement(lines: HexagramLine[]): string {
  const counts: Record<string, number> = {};
  lines.forEach(l => {
    counts[l.element] = (counts[l.element] || 0) + 1;
  });

  let max = 0;
  let dominant = '金';
  Object.entries(counts).forEach(([el, count]) => {
    if (count > max) {
      max = count;
      dominant = el;
    }
  });

  return dominant;
}

/**
 * Format hexagram for display
 */
export function formatHexagramDisplay(hex: Hexagram): string {
  const lineSymbols = hex.lines.map(l => {
    const base = l.yinYang === 'yang' ? '▅▅▅▅▅' : '▅▅ ▅▅';
    const marker = l.isChanging ? ' ○' : '';
    return `${base}${marker} ${l.branch}${l.relative}(${l.element})`;
  }).reverse(); // Display top to bottom

  return lineSymbols.join('\n');
}

export default {
  calculateLiuYaoHexagram,
  formatHexagramDisplay,
};
