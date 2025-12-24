/**
 * Smart Keyword Parser for Iron Plate Destiny Engine
 * 
 * Converts natural language input into standardized database search terms.
 * Handles various input formats including:
 * - Chinese: "父亲生肖牛，母亲是兔"
 * - English: "Father is Ox, Mother Rabbit"
 * - Mixed: "爸爸属牛 妈妈兔"
 * - Compact: "父牛母兔"
 */

// ==========================================
// ZODIAC MAPPING
// ==========================================

const ZODIAC_MAP: Record<string, string> = {
  // 鼠 - Rat
  '鼠': '鼠', '子': '鼠', 'rat': '鼠',
  // 牛 - Ox
  '牛': '牛', '丑': '牛', 'ox': '牛',
  // 虎 - Tiger
  '虎': '虎', '寅': '虎', 'tiger': '虎',
  // 兔 - Rabbit
  '兔': '兔', '卯': '兔', 'rabbit': '兔',
  // 龙 - Dragon
  '龙': '龙', '辰': '龙', 'dragon': '龙',
  // 蛇 - Snake
  '蛇': '蛇', '巳': '蛇', 'snake': '蛇',
  // 马 - Horse
  '马': '马', '午': '马', 'horse': '马',
  // 羊 - Goat/Sheep
  '羊': '羊', '未': '羊', 'goat': '羊', 'sheep': '羊',
  // 猴 - Monkey
  '猴': '猴', '申': '猴', 'monkey': '猴',
  // 鸡 - Rooster
  '鸡': '鸡', '酉': '鸡', 'rooster': '鸡', 'chicken': '鸡',
  // 狗 - Dog
  '狗': '狗', '戌': '狗', 'dog': '狗',
  // 猪 - Pig
  '猪': '猪', '亥': '猪', 'pig': '猪',
};

// ==========================================
// CHINESE NUMERAL MAPPING
// ==========================================

const CHINESE_NUMERALS: Record<string, string> = {
  '0': '零', '1': '一', '2': '二', '3': '三', '4': '四',
  '5': '五', '6': '六', '7': '七', '8': '八', '9': '九', '10': '十',
};

// Reverse map for Chinese to Arabic
const NUMERAL_TO_ARABIC: Record<string, number> = {
  '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
};

// ==========================================
// PARSER RESULT INTERFACE
// ==========================================

export interface ParsedKeywords {
  /** Standardized search terms for database query */
  searchTerms: string[];
  /** Detected father's zodiac (Chinese character) */
  fatherZodiac: string | null;
  /** Detected mother's zodiac (Chinese character) */
  motherZodiac: string | null;
  /** Detected siblings count */
  siblingsCount: number | null;
  /** Whether any structured data was extracted */
  hasStructuredData: boolean;
  /** Original input for reference */
  originalInput: string;
}

// ==========================================
// KEYWORD PARSER
// ==========================================

export const KeywordParser = {
  /**
   * Parses a natural language string and returns standardized DB search terms.
   * 
   * @example
   * Input: "父亲生肖牛，母亲是兔"
   * Output: { searchTerms: ["父牛", "母兔"], fatherZodiac: "牛", motherZodiac: "兔", ... }
   * 
   * @example
   * Input: "Father is Ox, Mother Rabbit, 3 siblings"
   * Output: { searchTerms: ["父牛", "母兔", "兄弟三"], fatherZodiac: "牛", motherZodiac: "兔", siblingsCount: 3, ... }
   */
  extractSearchTerms(input: string): ParsedKeywords {
    const result: ParsedKeywords = {
      searchTerms: [],
      fatherZodiac: null,
      motherZodiac: null,
      siblingsCount: null,
      hasStructuredData: false,
      originalInput: input,
    };

    if (!input || !input.trim()) {
      return result;
    }

    const lowerInput = input.toLowerCase();
    const normalizedInput = input.replace(/\s+/g, '');

    // ========================================
    // 1. DETECT COMPACT FORMAT FIRST (父牛母兔)
    // ========================================
    const compactMatch = normalizedInput.match(/父([鼠牛虎兔龙蛇马羊猴鸡狗猪])母([鼠牛虎兔龙蛇马羊猴鸡狗猪])/);
    if (compactMatch) {
      result.fatherZodiac = compactMatch[1];
      result.motherZodiac = compactMatch[2];
      result.searchTerms.push(`父${result.fatherZodiac}母${result.motherZodiac}`);
      result.hasStructuredData = true;
    }

    // ========================================
    // 2. DETECT FATHER'S ZODIAC (various patterns)
    // ========================================
    if (!result.fatherZodiac) {
      // Patterns: 父亲属牛, 爸爸牛, father ox, 父属牛, 生父属牛
      const fatherPatterns = [
        /(父|爸|dad|father|乾)[亲親]?[是属為为]?/gi,
        /生父[是属為为]?/gi,
      ];

      for (const [key, zodiac] of Object.entries(ZODIAC_MAP)) {
        // Check if father indicator is followed by this zodiac
        const pattern = new RegExp(`(父|爸|dad|father|乾)[亲親是属為为生]*.{0,3}${key}`, 'i');
        if (pattern.test(lowerInput)) {
          result.fatherZodiac = zodiac;
          break;
        }
      }
    }

    // ========================================
    // 3. DETECT MOTHER'S ZODIAC (various patterns)
    // ========================================
    if (!result.motherZodiac) {
      for (const [key, zodiac] of Object.entries(ZODIAC_MAP)) {
        const pattern = new RegExp(`(母|妈|媽|mom|mother|坤)[亲親是属為为生]*.{0,3}${key}`, 'i');
        if (pattern.test(lowerInput)) {
          result.motherZodiac = zodiac;
          break;
        }
      }
    }

    // ========================================
    // 4. DETECT SIBLINGS COUNT
    // ========================================
    // Patterns: 兄弟三人, 兄弟3人, 3 siblings, 同胞三
    const siblingPatterns = [
      /(兄弟|弟兄|同胞|手足|siblings?)\s*([0-9一二三四五六七八九十]+)/i,
      /([0-9一二三四五六七八九十]+)\s*(兄弟|弟兄|同胞|手足|siblings?)/i,
    ];

    for (const pattern of siblingPatterns) {
      const match = lowerInput.match(pattern);
      if (match) {
        const numStr = match[2] || match[1];
        // Convert to number
        if (/[0-9]/.test(numStr)) {
          result.siblingsCount = parseInt(numStr, 10);
        } else if (NUMERAL_TO_ARABIC[numStr] !== undefined) {
          result.siblingsCount = NUMERAL_TO_ARABIC[numStr];
        }
        break;
      }
    }

    // ========================================
    // 5. BUILD SEARCH TERMS
    // ========================================
    // Clear previous terms if we detected individual components
    if (result.fatherZodiac && result.motherZodiac && result.searchTerms.length === 0) {
      // Prefer compact format for exact matching
      result.searchTerms.push(`父${result.fatherZodiac}母${result.motherZodiac}`);
      result.hasStructuredData = true;
    } else if (result.fatherZodiac && result.searchTerms.length === 0) {
      result.searchTerms.push(`父${result.fatherZodiac}`);
      result.hasStructuredData = true;
    }

    if (result.motherZodiac && !result.searchTerms.some(t => t.includes(`母${result.motherZodiac}`))) {
      result.searchTerms.push(`母${result.motherZodiac}`);
      result.hasStructuredData = true;
    }

    if (result.siblingsCount !== null) {
      const chineseNum = CHINESE_NUMERALS[result.siblingsCount.toString()] || result.siblingsCount.toString();
      result.searchTerms.push(`兄弟${chineseNum}`);
      result.hasStructuredData = true;
    }

    // ========================================
    // 6. FALLBACK: Split by spaces/commas
    // ========================================
    if (!result.hasStructuredData) {
      const fallbackTerms = input
        .split(/[\s,，、]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
      result.searchTerms = fallbackTerms;
    }

    return result;
  },

  /**
   * Convert parsed keywords to a search query string
   */
  toQueryString(parsed: ParsedKeywords): string {
    return parsed.searchTerms.join(' ');
  },

  /**
   * Get display badges for parsed keywords
   */
  getDisplayBadges(parsed: ParsedKeywords): string[] {
    const badges: string[] = [];
    if (parsed.fatherZodiac) {
      badges.push(`父${parsed.fatherZodiac}`);
    }
    if (parsed.motherZodiac) {
      badges.push(`母${parsed.motherZodiac}`);
    }
    if (parsed.siblingsCount !== null) {
      const chineseNum = CHINESE_NUMERALS[parsed.siblingsCount.toString()] || parsed.siblingsCount.toString();
      badges.push(`兄弟${chineseNum}人`);
    }
    return badges;
  },
};

export default KeywordParser;
