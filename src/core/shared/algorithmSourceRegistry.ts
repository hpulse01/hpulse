/**
 * algorithmSourceRegistry.ts — single source of truth for every core
 * engine's rule provenance. Used by the audit layer to decide:
 *   • which engines may claim "complete"
 *   • what sourceGrade ceiling is defensible
 *   • which rules are still missing
 *
 * Adding a rule here is the only way to claim it as implemented.
 * The audit will cross-check engine output against this registry.
 */

import type { ImplementationStatus } from './implementationStatus';

export type SourceGrade = 'A' | 'B' | 'C' | 'D';

export interface EngineSourceRecord {
  engineName: string;
  engineNameCN: string;
  sourceGrade: SourceGrade;
  implementationStatus: ImplementationStatus;
  /** Rules that have been implemented and unit-tested. */
  implementedRules: string[];
  /** Rules acknowledged missing or simplified — must surface as warnings. */
  missingRules: string[];
  /** Authoritative references. */
  sourceUrls: string[];
  /** Free-form audit notes. */
  validationNotes: string[];
}

export const ALGORITHM_SOURCE_REGISTRY: Record<string, EngineSourceRecord> = {
  bazi: {
    engineName: 'bazi',
    engineNameCN: '八字',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '年月日时四柱（立春切年/节气切月）', '十神', '藏干', '纳音',
      '五行平衡', '阴阳平衡', '十二长生', '空亡',
      '日主强弱（多因子综合：月令/通根/透干/生扶/克泄）',
      '用神候选', '喜忌神', '大运顺逆', '起运年龄', '当前大运',
      '流年', '合冲刑害破基础', '事业/财富/关系/健康/家庭分区',
    ],
    missingRules: ['调候用神细化', '化气格', '从格判断', '流月细化'],
    sourceUrls: ['《滴天髓》', '《子平真诠》', '《穷通宝鉴》'],
    validationNotes: ['强弱判断未与权威排盘软件做大样本回归校验'],
  },
  ziwei: {
    engineName: 'ziwei',
    engineNameCN: '紫微斗数',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '农历上下文', '命宫/身宫', '十二宫', '五行局',
      '紫微星定位', '天府星定位', '十四主星全部落宫',
      '四化', '辅星基础', '煞星基础', '三方四正', '对宫',
      '大限', '流年（targetYear 来源 input）',
    ],
    missingRules: ['博士十二神完整', '星曜亮度全表', '南北派差异', '格局自动识别'],
    sourceUrls: ['《紫微斗数全书》', '《紫微斗数全集》'],
    validationNotes: ['流年绝不使用 new Date，已测试'],
  },
  liuyao: {
    engineName: 'liuyao',
    engineNameCN: '六爻',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '本卦/变卦', '动爻', '世应', '纳甲', '六亲', '六神',
      '日月建', '旺衰基础', '冲合刑害基础', '空亡',
      '时间起卦', '手动起卦', 'castMethod 记录',
    ],
    missingRules: ['伏神', '飞神', '进退神', '反吟伏吟评分', '应期细化'],
    sourceUrls: ['《增删卜易》', '《卜筮正宗》'],
    validationNotes: ['默认起卦零随机；用户摇卦时记录 random source'],
  },
  tieban: {
    engineName: 'tieban',
    engineNameCN: '铁板神数',
    sourceGrade: 'C',
    implementationStatus: 'needs_source_validation',
    implementedRules: [
      'baseNumber', 'theoreticalBase', 'quarterKe', 'systemOffset',
      '六亲校时（用户事实优先）',
      '条文 exact/fallback 透明记录（matchedClauseNumber/exactMatch/fallbackDistance/source）',
      '命运总论/婚姻/财富/事业/健康寿元/子嗣/父母分区',
    ],
    missingRules: ['古籍完整公式校验', '十三部条文齐备', '增删神数交叉验证'],
    sourceUrls: ['《铁板神数》(待校验)'],
    validationNotes: ['当前公式属项目自定义校时模型，必须维持 needs_source_validation'],
  },
  meihua: {
    engineName: 'meihua',
    engineNameCN: '梅花易数',
    sourceGrade: 'B',
    implementationStatus: 'complete',
    implementedRules: [
      '年月日时起卦', '数字起卦', '上卦', '下卦', '动爻',
      '本卦', '互卦', '变卦', '体用关系', '五行生克', '吉凶趋势',
    ],
    missingRules: ['外应', '声音字数等高级起卦法'],
    sourceUrls: ['《梅花易数》(邵雍)'],
    validationNotes: ['零 hash 冒充；无姓名/数字时降级为 partial'],
  },
  qimen: {
    engineName: 'qimen',
    engineNameCN: '奇门遁甲',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '阴遁/阳遁', '局数', '九宫', '三奇六仪',
      '九星', '八门', '八神', '值符', '值使',
      '时家奇门基础排盘', '用神宫基础判断',
    ],
    missingRules: ['三诈五假', '伏吟反吟评分', '飞盘/转盘差异', '高级格局识别'],
    sourceUrls: ['《奇门遁甲秘笈大全》', '《烟波钓叟歌》'],
    validationNotes: ['高级格局缺失时已 warning'],
  },
  liuren: {
    engineName: 'liuren',
    engineNameCN: '大六壬',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '月将', '占时', '天盘地盘', '四课', '三传',
      '十二天将', '基础判断',
    ],
    missingRules: ['毕法赋', '九宗门', '贵人临门细化', '课体九十八种识别'],
    sourceUrls: ['《大六壬指南》', '《六壬大全》'],
    validationNotes: ['partial — 不可视为完整六壬'],
  },
  taiyi: {
    engineName: 'taiyi',
    engineNameCN: '太乙神数',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '太乙积年', '局数', '太乙所在宫', '文昌', '始击',
      '主客基础判断',
    ],
    missingRules: ['计神', '岁计/月计/日计/时计完整', '十六神将完整'],
    sourceUrls: ['《太乙金镜式经》'],
    validationNotes: ['partial — 仅基础盘'],
  },
  western: {
    engineName: 'western',
    engineNameCN: '西方占星',
    sourceGrade: 'B',
    implementationStatus: 'partial',
    implementedRules: [
      'astronomy-engine 真实行星位置', '日月水金火木土天海冥 10 行星',
      '黄经/星座/度数', 'Whole Sign 宫位', '上升点 Asc',
      '相位（合/冲/拱/刑/六合）+ orbs',
    ],
    missingRules: ['Placidus/Koch 宫制', '小行星', '南北交点细化', '现代心理占星解读层'],
    sourceUrls: ['Astronomy Engine (Don Cross)', 'Swiss Ephemeris 文档'],
    validationNotes: ['Placidus 触发时 warning + 回退 Whole Sign'],
  },
  vedic: {
    engineName: 'vedic',
    engineNameCN: '吠陀占星',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      'Lahiri ayanamsa（J2000 锚 23.85° + 50.2388475″/年）',
      'Sidereal zodiac', 'Rashi', 'Nakshatra + Pada',
      'Vimshottari Mahadasha 完整 120 年',
    ],
    missingRules: ['Antardasha', 'Rahu/Ketu', 'Lagna 部分场景', 'Divisional charts (D9 等)'],
    sourceUrls: ['Lahiri Chitrapaksha', 'BV Raman 著述'],
    validationNotes: ['绝不使用热带黄道冒充恒星黄道'],
  },
  numerology: {
    engineName: 'numerology',
    engineNameCN: '数字命理',
    sourceGrade: 'B',
    implementationStatus: 'partial',
    implementedRules: [
      'Pythagorean 字母→数字', '主数 11/22/33 保留',
      'Life Path', 'Destiny', 'Soul Urge', 'Personality', 'Personal Year',
    ],
    missingRules: ['Chaldean 体系', 'Karmic Debt 高级解读'],
    sourceUrls: ['Pythagorean numerology classical mapping'],
    validationNotes: ['缺姓名时 Destiny/Soul/Personality 返回 null + warning，不伪造'],
  },
  mayan: {
    engineName: 'mayan',
    engineNameCN: '玛雅历',
    sourceGrade: 'B',
    implementationStatus: 'partial',
    implementedRules: [
      'Tzolkin day sign (20)', 'Galactic tone (1-13)',
      'Long Count（vigesimal，1 tun = 18 uinal）',
      'JD 584283 = 4 Ahau 历元校准',
    ],
    missingRules: ['Haab 365 日历', 'Calendar Round 52 年组合'],
    sourceUrls: ['GMT correlation 584283'],
    validationNotes: ['确定性 — 同 JD 同 day sign'],
  },
  kabbalah: {
    engineName: 'kabbalah',
    engineNameCN: '卡巴拉',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      'Mispar Hechrachi gematria（希伯来）', '拉丁转写 fallback',
      'Tree of Life Sephirot 映射',
    ],
    missingRules: ['Mispar Gadol/Katan 等扩展 gematria', '路径 22 通道完整解读'],
    sourceUrls: ['Sefer Yetzirah 引用'],
    validationNotes: ['缺姓名时降级为 birth-only + warning，confidence 显著降低'],
  },
};

export function getEngineSource(name: string): EngineSourceRecord | undefined {
  return ALGORITHM_SOURCE_REGISTRY[name];
}

export function listRegisteredEngines(): string[] {
  return Object.keys(ALGORITHM_SOURCE_REGISTRY);
}
