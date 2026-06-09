/**
 * P4.5 — Top-level orchestrator: cast → najia → palace → spirits → 旺衰 → 变卦 → 用神 → 冲合.
 * Deterministic. No Math.random outside seeded LCG (random mode requires explicit seed).
 */

import type {
  CalendarContext, Hexagram, HexagramLine, LineValue, LiuyaoChart, LiuyaoCoreInput,
  RawLine, SixRelative, YinYang,
} from './types';
import type { AstroWarning, ExplanationStep, SourceGrade } from '../astro-time/types';
import { trigramFromBits, lookupHexagramName } from './hexagramTables';
import { applyNajia } from './najia';
import { assignRelatives, determinePalace } from './sixRelatives';
import { spiritsForDayStem } from './sixSpirits';
import {
  dayRelation, isVoid, monthStrength, voidBranchesForDay,
} from './wangShuai';
import { BRANCH_ELEMENTS, BRANCHES, STEMS } from './constants';
import { annotateChangingLineTargets, buildChangedHexagram } from './changingLines';
import { analyzeYongShen } from './yongshen';
import { detectClashCombine } from './clashCombine';
import { findFuShen, detectJinTuiShen, detectFanFuYin, deriveYingQi } from './advancedRules';
import { normalizeBirthTime } from '../astro-time/normalizeBirthTime';
import { fourPillarsFromAstro } from '../calendar/fourPillars';

// ─── Casting strategies ───────────────────────────────────────────────────

function valueFromBitsAndChange(bit: 0|1, isChanging: boolean): LineValue {
  if (bit === 1) return isChanging ? 9 : 7;
  return isChanging ? 6 : 8;
}

function rawLine(position: number, value: LineValue): RawLine {
  const yinYang: YinYang = (value === 7 || value === 9) ? 'yang' : 'yin';
  return { position, value, yinYang, isChanging: value === 6 || value === 9 };
}

/** Plum-blossom time-cast: deterministic from year/month/day/hour numbers. */
function castFromTime(yearNum: number, monthNum: number, dayNum: number, hourBranchIdx: number) {
  const lowerSum = yearNum + monthNum + dayNum;             // 下卦
  const upperSum = lowerSum + hourBranchIdx;                // 上卦
  const changingSum = upperSum;                              // 动爻
  const lowerIdx = ((lowerSum - 1) % 8 + 8) % 8;
  const upperIdx = ((upperSum - 1) % 8 + 8) % 8;
  const changingPos = ((changingSum - 1) % 6 + 6) % 6 + 1;  // 1..6
  return { lowerIdx, upperIdx, changingPos };
}

/** Map TRIGRAMS index 0..7 (乾兑离震巽坎艮坤) to bits via trigramFromBits inverse. */
const TRIGRAM_BITS: ([0|1, 0|1, 0|1])[] = [
  [1,1,1],[1,1,0],[1,0,1],[1,0,0],[0,1,1],[0,1,0],[0,0,1],[0,0,0],
];

function rawLinesFromTrigramsAndChange(lowerIdx: number, upperIdx: number, changingPos: number): RawLine[] {
  const bits: (0|1)[] = [
    ...TRIGRAM_BITS[lowerIdx],
    ...TRIGRAM_BITS[upperIdx],
  ];
  return bits.map((b, i) => rawLine(i + 1, valueFromBitsAndChange(b, i + 1 === changingPos)));
}

/** LCG (Numerical Recipes) — deterministic, seeded. NEVER Math.random. */
function lcg(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function castFromSeed(seed: number): RawLine[] {
  const rng = lcg(seed);
  const out: RawLine[] = [];
  for (let i = 1; i <= 6; i++) {
    // Three-coin method probability: 1/8 老阳(9), 3/8 少阴(8), 3/8 少阳(7), 1/8 老阴(6)
    const r = rng();
    let v: LineValue;
    if (r < 1 / 8) v = 9;
    else if (r < 1 / 8 + 3 / 8) v = 8;
    else if (r < 1 / 8 + 3 / 8 + 3 / 8) v = 7;
    else v = 6;
    out.push(rawLine(i, v));
  }
  return out;
}

function castFromManual(manual: LineValue[]): RawLine[] {
  if (manual.length !== 6) throw new Error('manualLines must have exactly 6 values');
  return manual.map((v, i) => rawLine(i + 1, v));
}

// ─── Calendar context ─────────────────────────────────────────────────────

function buildCalendarContext(input: LiuyaoCoreInput, warnings: AstroWarning[], trace: ExplanationStep[]): CalendarContext | null {
  if (!input.queryTimeUtc || !input.timezoneIana) {
    warnings.push({
      code: 'LIUYAO_NO_CALENDAR',
      message: '未提供 queryTimeUtc + timezoneIana，无法计算月建/日辰/旬空，旺衰仅采用默认值。',
      severity: 'warning',
    });
    return null;
  }
  try {
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(input.queryTimeUtc);
    if (!m) throw new Error(`无法解析 queryTimeUtc: ${input.queryTimeUtc}`);
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(input.queryTimeUtc);
    const astro = normalizeBirthTime({
      birthLocalDateTime: {
        year: Number(m[1]), month: Number(m[2]), day: Number(m[3]),
        hour: Number(m[4]), minute: Number(m[5]), second: m[6] ? Number(m[6]) : 0,
      },
      birthUtcDateTime: hasZone ? new Date(input.queryTimeUtc).toISOString() : undefined,
      timezoneIana: input.timezoneIana,
      geoLatitude: input.geoLatitude,
      geoLongitude: input.geoLongitude,
    } as never);
    const fp = fourPillarsFromAstro(astro);
    const dayGanzhi = fp.day.ganzhi;
    const voids = voidBranchesForDay(dayGanzhi);
    const ctx: CalendarContext = {
      yearGanzhi: fp.year.ganzhi,
      monthGanzhi: fp.month.ganzhi,
      dayGanzhi,
      hourGanzhi: fp.hour.ganzhi,
      dayStem: fp.day.ganzhi.charAt(0),
      monthBranch: fp.month.ganzhi.charAt(1),
      dayBranch: fp.day.ganzhi.charAt(1),
      voidBranches: voids,
      monthElement: BRANCH_ELEMENTS[fp.month.ganzhi.charAt(1)],
      dayElement: BRANCH_ELEMENTS[fp.day.ganzhi.charAt(1)],
    };
    trace.push({
      rule: 'liuyao.calendar',
      detail: `历法上下文：年${ctx.yearGanzhi} 月${ctx.monthGanzhi} 日${ctx.dayGanzhi} 时${ctx.hourGanzhi}，旬空 ${voids.join('/')}`,
      data: { ctx },
    });
    return ctx;
  } catch (e) {
    warnings.push({
      code: 'LIUYAO_CALENDAR_FAILED',
      message: `历法计算失败：${(e as Error).message}`,
      severity: 'error',
    });
    return null;
  }
}

function defaultCalendar(): CalendarContext {
  return {
    yearGanzhi: '甲子', monthGanzhi: '甲子', dayGanzhi: '甲子', hourGanzhi: '甲子',
    dayStem: '甲', monthBranch: '子', dayBranch: '子',
    voidBranches: ['戌', '亥'], monthElement: '水', dayElement: '水',
  };
}

// ─── Main entry ───────────────────────────────────────────────────────────

export function calculateHexagram(input: LiuyaoCoreInput): LiuyaoChart {
  const warnings: AstroWarning[] = [];
  const trace: ExplanationStep[] = [];

  // 1. Casting
  let rawLines: RawLine[];
  let castingSource = '';
  if (input.mode === 'manual') {
    if (!input.manualLines) throw new Error('manual mode requires manualLines');
    rawLines = castFromManual(input.manualLines);
    castingSource = `manual:[${input.manualLines.join(',')}]`;
    trace.push({
      rule: 'liuyao.cast.manual',
      detail: '手动起卦：使用用户提供的 6 爻值（6/7/8/9）。',
      data: { manualLines: input.manualLines },
    });
  } else if (input.mode === 'random') {
    if (input.seed == null) throw new Error('random mode requires explicit numeric seed');
    rawLines = castFromSeed(input.seed);
    castingSource = `random:seed=${input.seed}`;
    trace.push({
      rule: 'liuyao.cast.random',
      detail: `随机摇卦：使用确定性 LCG，seed=${input.seed}（绝不调用 Math.random）。`,
      data: { seed: input.seed, generator: 'NumericalRecipes-LCG' },
    });
  } else {
    if (!input.queryTimeUtc || !input.timezoneIana) {
      throw new Error('time mode requires queryTimeUtc + timezoneIana');
    }
    // Build calendar to get year/month/day/hour-branch numbers (use lunar for plum-blossom)
    const cal = buildCalendarContext(input, warnings, trace);
    if (!cal) throw new Error('time mode failed: calendar context unavailable');
    const yearNum = (STEMS as readonly string[]).indexOf(cal.yearGanzhi.charAt(0)) + 1
                  + ((BRANCHES as readonly string[]).indexOf(cal.yearGanzhi.charAt(1)) + 1);
    const monthNum = (BRANCHES as readonly string[]).indexOf(cal.monthGanzhi.charAt(1)) + 1;
    const dayNum = (BRANCHES as readonly string[]).indexOf(cal.dayGanzhi.charAt(1)) + 1;
    const hourBranchIdx = (BRANCHES as readonly string[]).indexOf(cal.hourGanzhi.charAt(1)) + 1;
    const cast = castFromTime(yearNum, monthNum, dayNum, hourBranchIdx);
    rawLines = rawLinesFromTrigramsAndChange(cast.lowerIdx, cast.upperIdx, cast.changingPos);
    castingSource = `time:${input.queryTimeUtc}|tz=${input.timezoneIana}|lower=${cast.lowerIdx}|upper=${cast.upperIdx}|动爻=${cast.changingPos}`;
    trace.push({
      rule: 'liuyao.cast.time',
      detail: `时间起卦（梅花易数）：下卦索引=${cast.lowerIdx}，上卦索引=${cast.upperIdx}，动爻=第${cast.changingPos}爻。`,
      data: cast,
    });
  }

  // 2. Calendar context (if random/manual it may already have queryTimeUtc)
  const calendar = (input.mode === 'time' && input.queryTimeUtc && input.timezoneIana)
    ? buildCalendarContext(input, [], []) // already traced above for time mode
    : (input.queryTimeUtc && input.timezoneIana ? buildCalendarContext(input, warnings, trace) : null);
  const cal = calendar ?? defaultCalendar();
  if (!calendar) {
    trace.push({
      rule: 'liuyao.calendar.default',
      detail: '使用默认历法上下文（甲子年月日时），月建/日辰仅用于结构演示，建议补充 queryTimeUtc + timezoneIana。',
      data: { default: true },
    });
  }

  // 3. Trigrams
  const bits: (0|1)[] = rawLines.map((r) => (r.yinYang === 'yang' ? 1 : 0)) as (0|1)[];
  const lowerT = trigramFromBits([bits[0], bits[1], bits[2]]);
  const upperT = trigramFromBits([bits[3], bits[4], bits[5]]);
  trace.push({
    rule: 'liuyao.trigrams',
    detail: `下卦=${lowerT.name}(${lowerT.element})，上卦=${upperT.name}(${upperT.element})。`,
    data: { lower: lowerT, upper: upperT },
  });

  // 4. Najia
  const najia = applyNajia(lowerT.name, upperT.name);

  // 5. Palace + 世应
  const palace = determinePalace(bits);
  trace.push({
    rule: 'liuyao.palace',
    detail: `归 ${palace.palace} 宫(${palace.palaceElement})，世爻第 ${palace.shiYao} 爻，应爻第 ${palace.yingYao} 爻 (gongOrder=${palace.gongOrder})。`,
    data: { ...palace } as Record<string, unknown>,
  });

  // 6. 六亲 + 六神 + 旺衰
  const relatives: SixRelative[] = assignRelatives(palace.palaceElement, najia.map((n) => n.branch));
  const spirits = spiritsForDayStem(cal.dayStem);

  const lines: HexagramLine[] = najia.map((nj, i) => {
    const raw = rawLines[i];
    return {
      position: nj.position,
      value: raw.value,
      yinYang: raw.yinYang,
      isChanging: raw.isChanging,
      branch: nj.branch,
      stem: nj.stem,
      element: nj.element,
      relative: relatives[i],
      spirit: spirits[i],
      isShiYao: nj.position === palace.shiYao,
      isYingYao: nj.position === palace.yingYao,
      isVoid: isVoid(nj.branch, cal.voidBranches),
      monthStrength: monthStrength(cal.monthBranch, nj.element),
      dayRelation: dayRelation(cal.dayElement, nj.element),
    };
  });

  const info = lookupHexagramName(lowerT.name, upperT.name);
  const main: Hexagram = {
    name: info.name,
    description: info.description,
    upperTrigram: upperT,
    lowerTrigram: lowerT,
    palace: palace.palace,
    palaceElement: palace.palaceElement,
    shiYao: palace.shiYao,
    yingYao: palace.yingYao,
    lines,
    changingLines: rawLines.filter((r) => r.isChanging).map((r) => r.position),
  };

  // 7. 变卦
  let changed;
  if (main.changingLines.length > 0) {
    changed = buildChangedHexagram(rawLines, main.palaceElement, {
      dayStem: cal.dayStem, monthBranch: cal.monthBranch, dayBranch: cal.dayBranch,
      voidBranches: cal.voidBranches,
    });
    annotateChangingLineTargets(main.lines, changed);
    trace.push({
      rule: 'liuyao.changed',
      detail: `动爻 ${main.changingLines.join(',')} → 变卦 ${changed.name}。`,
      data: { changingLines: main.changingLines, changedName: changed.name },
    });
  } else {
    trace.push({
      rule: 'liuyao.changed.none',
      detail: '六爻安静，无变卦。',
      data: {},
    });
  }

  // 8. 用神
  const yongShen = analyzeYongShen(main, input);
  trace.push(...yongShen.trace);

  // 8b. 伏神（用神不现时从本宫首卦寻伏）
  const fuShen = yongShen.hidden ? findFuShen(main, yongShen.yongShen) : null;
  if (fuShen) {
    trace.push({
      rule: 'liuyao.fushen',
      detail: `用神不现，寻得伏神 ${fuShen.branch}(${fuShen.element}) 伏于第 ${fuShen.position} 爻飞神 ${fuShen.flyingBranch} 之下，${fuShen.relation}。${fuShen.judgment}`,
      data: { ...fuShen } as unknown as Record<string, unknown>,
    });
  }

  // 8c. 进退神
  const jinTuiShen = detectJinTuiShen(main);
  for (const jt of jinTuiShen) {
    trace.push({ rule: 'liuyao.jintui', detail: jt.description, data: { ...jt } as unknown as Record<string, unknown> });
  }

  // 8d. 伏吟 / 反吟
  const fanFuYin = detectFanFuYin(main);
  for (const note of fanFuYin.notes) {
    trace.push({ rule: 'liuyao.fanfuyin', detail: note, data: { scoreAdjustment: fanFuYin.scoreAdjustment } });
  }

  // 9. 冲合刑害
  const clashCombine = detectClashCombine(main);
  if (clashCombine.length > 0) {
    trace.push({
      rule: 'liuyao.clashCombine',
      detail: `检测到 ${clashCombine.length} 项冲/合/刑/害。`,
      data: { count: clashCombine.length, types: clashCombine.map((c) => c.type) },
    });
  }

  // 10. Source grade
  const sourceGrade: SourceGrade = calendar
    ? (yongShen.strength === '不现' ? 'C' : 'B')
    : 'C';

  // 9b. 应期
  const yingQi = deriveYingQi(main, yongShen, calendar);
  if (yingQi.length > 0) {
    trace.push({
      rule: 'liuyao.yingqi',
      detail: `应期候选：${yingQi.map((y) => `${y.branch}(${y.basis})`).join('、')}`,
      data: { candidates: yingQi.map((y) => y.branch) },
    });
  }

  const completenessScore = calendar ? 90 : 60;
  const baseConfidence =
    yongShen.strength === '旺相' ? 82 :
    yongShen.strength === '发动' ? 68 :
    yongShen.strength === '休囚' ? 48 :
    yongShen.strength === '受克' ? 38 :
    yongShen.strength === '空亡' ? 28 :
    yongShen.strength === '不现' ? (fuShen ? 40 : 30) : 50;
  const confidence = Math.max(10, baseConfidence + fanFuYin.scoreAdjustment);

  return {
    input,
    castingMode: input.mode,
    castingSource,
    calendar,
    mainHexagram: main,
    changedHexagram: changed,
    yongShen,
    fuShen,
    jinTuiShen,
    fanFuYin,
    yingQi,
    clashCombine,
    warnings,
    explanationTrace: trace,
    sourceGrade,
    confidence,
    completenessScore,
    implementationStatus: calendar ? 'complete' : 'partial',
  };
}
