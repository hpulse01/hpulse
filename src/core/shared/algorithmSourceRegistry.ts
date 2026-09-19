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

import type { EngineOutput, SourceGrade as EngineSourceGrade } from '@/types/prediction';
import {
  normalizeStatus,
  STATUS_MAX_CONFIDENCE,
  type ImplementationStatus,
} from './implementationStatus';
import { normalizeConfidence01 } from './confidence';

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
      '调候用神（穷通宝鉴全表）', '化气格识别', '从格判断（从强/从弱/从财官儿势）',
      '流月细化（冲合/风险机会标记）',
    ],
    missingRules: ['盲派技法', '神煞全表'],
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
      '博士十二神完整', '星曜亮度全表（庙旺得利平闲陷）', '格局自动识别（含扩展格局）',
    ],
    missingRules: ['南北派差异全谱'],
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
      '伏神/飞神', '进神退神', '反吟伏吟评分', '应期细化',
    ],
    missingRules: ['卦身、星煞等派别扩展'],
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
      '命运总论/婚姻/财富/事业/健康趋势/子嗣/父母分区',
    ],
    missingRules: ['古籍完整公式校验', '十三部条文齐备', '增删神数交叉验证'],
    sourceUrls: ['《铁板神数》(待校验)'],
    validationNotes: ['当前公式属项目自定义校时模型，必须维持 needs_source_validation'],
  },
  meihua: {
    engineName: 'meihua',
    engineNameCN: '梅花易数',
    sourceGrade: 'B',
    implementationStatus: 'partial',
    implementedRules: [
      '年月日时起卦', '数字起卦', '上卦', '下卦', '动爻',
      '本卦', '互卦', '变卦', '体用关系', '五行生克', '吉凶趋势',
    ],
    missingRules: ['外应', '声音字数等高级起卦法'],
    sourceUrls: ['https://zh.wikisource.org/zh-hans/梅花易數/卷一'],
    validationNotes: ['时间起卦已使用农历年月日与本地时支；日界固定为当地民用 00:00，闰月按同月序数'],
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
      '天盘干转宫', '十干克应格局（青龙返首/飞鸟跌穴等）', '三诈五假（真/休/重诈+天假）',
      '击刑/入墓/六仪击刑', '三奇得门', '伏吟反吟评分',
    ],
    missingRules: ['飞盘法', '拐干', '九遁全部及门派变体格局'],
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
      '九宗门完整三传（贼克/比用/涉害/遥克/昴星/别责/八专/伏吟/反吟）',
      '课体识别（元首/重审/知一/蒿矢/弹射等）',
    ],
    missingRules: ['毕法赋七百诀', '年命', '课体九十八种全谱细化'],
    sourceUrls: ['《大六壬指南》', '《六壬大全》'],
    validationNotes: ['partial — 不可视为完整六壬'],
  },
  taiyi: {
    engineName: 'taiyi',
    engineNameCN: '太乙神数',
    sourceGrade: 'C',
    implementationStatus: 'partial',
    implementedRules: [
      '太乙积年', '局数', '太乙所在宫', '文昌', '始击（计神临宫）',
      '计神（寅首逆行）', '十六神', '主客算累计', '大将/参将',
    ],
    missingRules: ['阳九/百六/三纪五元', '大游小游', '月计/日计/时计完整'],
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
      'Placidus 宫制（高纬回退 Whole Sign）',
    ],
    missingRules: ['Koch 宫制', '小行星', '现代心理占星解读层'],
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
      'Antardasha', 'Rahu/Ketu 真交点', 'Navamsa D9',
    ],
    missingRules: ['D10 等其余分宫盘', 'Shadbala', 'Yogas 识别'],
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
      'Chaldean 体系', 'Karmic Debt (13/14/16/19)', 'Maturity Number',
      'Life Path 月/日/年分单元约简（保留中间主数/业债数）',
      '姓名各段先约简再合并（避免伪主数/丢失主数）',
      'Y 依首尾与相邻元音位置分类',
      'Pinnacles 四周期与 36-Life Path/9/9 年龄窗口',
      'Challenges 四数绝对差（不伪造精确年龄边界）',
    ],
    missingRules: ['变音符/非拉丁姓名转写规则'],
    sourceUrls: [
      'https://www.worldnumerology.com/do-your-own-reading/',
      'https://www.worldnumerology.com/numerology-pinnacles/',
      'https://www.worldnumerology.com/numerology-challenges/',
      'https://www.worldnumerology.com/numerology-expression/',
      'https://www.worldnumerology.com/numerology-articles/numerology-Y-vowel-consonant.html',
    ],
    validationNotes: [
      '缺姓名时 Destiny/Soul/Personality 返回 null + warning，不伪造',
      'Challenge 时期来源明确为流动且重叠，仅报四数而不绑定精确年龄窗口',
      '非 A–Z 字母 fail-closed：要求用户显式提供无变音符转写，不静默丢字符',
    ],
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
      'Haab 365 日历', 'Calendar Round 52 年组合', '夜之主 Lords of the Night (G1-G9)',
    ],
    missingRules: ['819 日周期', '金星周期表'],
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
      'Mispar Gadol（显式尾字母 500..900 变体）',
      'Mispar Katan/Siduri 扩展 gematria', '22 路径（希伯来字母/塔罗对应）完整解读',
    ],
    missingRules: ['Tikkun 细化', '希伯来原文姓名转写表扩充'],
    sourceUrls: [
      'https://www.chabad.org/library/article_cdo/aid/6037869/jewish/Why-the-Five-Hebrew-Final-Letters.htm',
      'https://www.encyclopedia.com/philosophy-and-religion/bible/bible-general/gematria',
    ],
    validationNotes: [
      '缺姓名时降级为 birth-only + warning，confidence 显著降低',
      'Gadol 仅对用户显式输入的 ך/ם/ן/ף/ץ 应用 500/600/700/800/900；拉丁 fallback 不推测尾字母',
    ],
  },
};

export function getEngineSource(name: string): EngineSourceRecord | undefined {
  return ALGORITHM_SOURCE_REGISTRY[name];
}

export function listRegisteredEngines(): string[] {
  return Object.keys(ALGORITHM_SOURCE_REGISTRY);
}

const STATUS_RANK: Record<ImplementationStatus, number> = {
  placeholder_removed: 0,
  needs_source_validation: 1,
  partial: 2,
  complete: 3,
};

const GRADE_RANK: Record<EngineSourceGrade, number> = { D: 0, C: 1, B: 2, A: 3 };
const GRADE_CONFIDENCE_CAP: Record<EngineSourceGrade, number> = { A: 1, B: 0.85, C: 0.65, D: 0.45 };

function conservativeStatus(a: ImplementationStatus, b: ImplementationStatus): ImplementationStatus {
  return STATUS_RANK[a] <= STATUS_RANK[b] ? a : b;
}

function conservativeGrade(a: EngineSourceGrade, b: SourceGrade): EngineSourceGrade {
  return GRADE_RANK[a] <= GRADE_RANK[b] ? a : b;
}

/**
 * Enforce the audited registry as a hard ceiling before output reaches fusion.
 * A calculator may be complete for its local feature subset, but it may not
 * advertise a stronger status or confidence than the known engine-wide gaps.
 */
export function applySourceRegistryPolicy(output: EngineOutput): EngineOutput {
  const record = getEngineSource(output.engineName);
  if (!record) {
    return {
      ...output,
      confidence: Math.min(normalizeConfidence01(output.confidence), 0.4),
      warnings: Array.from(new Set([...output.warnings, 'source_registry_missing'])),
      normalizedOutput: {
        ...output.normalizedOutput,
        implementationStatus: 'needs_source_validation',
      },
    };
  }

  const declared = normalizeStatus(
    output.normalizedOutput.implementationStatus
      ?? output.normalizedOutput.p4ImplementationStatus,
  );
  const status = conservativeStatus(declared, record.implementationStatus);
  const sourceGrade = conservativeGrade(output.sourceGrade, record.sourceGrade);
  const completenessCap = Number.isFinite(output.completenessScore)
    ? Math.max(0, Math.min(1, output.completenessScore / 100))
    : 0;
  const confidenceCap = Math.min(
    STATUS_MAX_CONFIDENCE[status],
    GRADE_CONFIDENCE_CAP[sourceGrade],
    completenessCap,
  );
  const gapWarning = record.missingRules.length > 0
    ? `registry_missing_rules: ${record.missingRules.join('；')}`
    : null;

  return {
    ...output,
    sourceGrade,
    sourceUrls: Array.from(new Set([...output.sourceUrls, ...record.sourceUrls])),
    confidence: Math.min(normalizeConfidence01(output.confidence), confidenceCap),
    warnings: Array.from(new Set([
      ...output.warnings,
      ...(gapWarning ? [gapWarning] : []),
    ])),
    uncertaintyNotes: Array.from(new Set([
      ...output.uncertaintyNotes,
      ...record.validationNotes,
    ])),
    normalizedOutput: {
      ...output.normalizedOutput,
      declaredImplementationStatus: declared,
      implementationStatus: status,
      p4ImplementationStatus: status,
      registryPolicyApplied: true,
    },
    validationFlags: {
      ...output.validationFlags,
      warnings: Array.from(new Set([
        ...output.validationFlags.warnings,
        ...(gapWarning ? [gapWarning] : []),
      ])),
    },
  };
}
