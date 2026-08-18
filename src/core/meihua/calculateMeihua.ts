/**
 * P4.6 — Meihua Yishu deterministic calculator.
 *
 * Modes:
 *   - 'time'    : 年月日时起卦（农历年支序数 + 月 + 日 + 时支序数）
 *   - 'numbers' : 数字起卦（用户提供 upperNumber + lowerNumber）
 *   - 'manual'  : 用户直接指定上下卦 + 动爻
 *
 * 严格禁止 Math.random / Date.now 影响结果。
 */
import type {
  MeihuaInput,
  MeihuaChart,
  ExplanationStep,
  MeihuaWarning,
  Trigram,
} from './types';
import { trigramFromNumber, movingLineFromSum } from './numberToTrigram';
import { trigramByName, buildHexagram, deriveHuGua, deriveBianGua } from './trigrams';
import { analyzeBodyUse } from './bodyUse';
import { EARTHLY_BRANCHES } from './constants';
import { Solar } from 'lunar-typescript';

interface TimeNumbers {
  upperRaw: number;
  lowerRaw: number;
  movingRaw: number;
  detail: string;
}

/** 从 queryTimeUtc + timezoneIana 推出农历年支序数/月/日/时支序数。
 *  规则口径：当地民用日界 00:00；闰月沿用本月序数；子=1..亥=12。
 *  该口径对应《梅花易数》卷一“年月日时起卦”的年/月/日/时取数法。
 */
function deriveTimeNumbers(input: MeihuaInput, warnings: MeihuaWarning[]): TimeNumbers | null {
  if (!input.queryTimeUtc || !input.timezoneIana) return null;

  // Convert UTC → local wall time using Intl (deterministic, no Date.now / random).
  const utc = new Date(input.queryTimeUtc);
  if (Number.isNaN(utc.getTime())) {
    warnings.push({ code: 'meihua.time.invalid', message: 'queryTimeUtc 无效。', level: 'error' });
    return null;
  }

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: input.timezoneIana,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', hour12: false,
  });
  const parts = fmt.formatToParts(utc).reduce((m, p) => { m[p.type] = p.value; return m; }, {} as Record<string, string>);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;

  // Convert the local civil Gregorian date to the Chinese lunar date. The
  // library is intentionally fed wall-clock components rather than the UTC
  // instant so the chosen product policy follows the user's local civil day.
  const lunar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar();
  const lunarMonthRaw = lunar.getMonth();
  const lunarMonth = Math.abs(lunarMonthRaw);
  const lunarDay = lunar.getDay();
  const yearBranch = lunar.getYearZhi();
  const yearBranchIdx = EARTHLY_BRANCHES.indexOf(yearBranch as (typeof EARTHLY_BRANCHES)[number]);
  if (yearBranchIdx < 0) {
    warnings.push({ code: 'meihua.time.yearBranch.invalid', message: `无法识别农历年支：${yearBranch}`, level: 'error' });
    return null;
  }

  // 时支序数：23-1=子(1), 1-3=丑(2), ..., 21-23=亥(12)
  const branchIdx0 = Math.floor(((hour + 1) % 24) / 2); // 0..11 子→亥
  const branchOrd = branchIdx0 + 1;
  const yearBranchOrd = yearBranchIdx + 1;

  if (lunarMonthRaw < 0) {
    warnings.push({
      code: 'meihua.time.leapMonth.policy',
      message: `闰${lunarMonth}月按同月序数 ${lunarMonth} 取数。`,
      level: 'info',
    });
  }

  const upperRaw = yearBranchOrd + lunarMonth + lunarDay;
  const lowerRaw = yearBranchOrd + lunarMonth + lunarDay + branchOrd;
  const movingRaw = lowerRaw;

  return {
    upperRaw,
    lowerRaw,
    movingRaw,
    detail: `当地公历=${year}-${month}-${day} ${hour}:00，农历=${lunar.getYear()}年${lunarMonthRaw < 0 ? '闰' : ''}${lunarMonth}月${lunarDay}日，年支序=${yearBranchOrd}(${yearBranch})，时支序=${branchOrd}(${EARTHLY_BRANCHES[branchIdx0]})；上=${upperRaw}, 下=${lowerRaw}, 动=${movingRaw}；日界=当地00:00，闰月=同月序`,
  };
}

export function calculateMeihua(input: MeihuaInput): MeihuaChart {
  const trace: ExplanationStep[] = [];
  const warnings: MeihuaWarning[] = [];

  let upperTrigram: Trigram;
  let lowerTrigram: Trigram;
  let movingLine: number;
  let upperRaw = 0;
  let lowerRaw = 0;
  let movingRaw = 0;
  let castingSource = '';
  const implementationStatus: MeihuaChart['implementationStatus'] = 'complete';
  const sourceGrade: MeihuaChart['sourceGrade'] = 'B';

  if (input.mode === 'manual') {
    if (!input.manualUpper || !input.manualLower || !input.manualMovingLine) {
      throw new Error('manual mode requires manualUpper + manualLower + manualMovingLine');
    }
    if (input.manualMovingLine < 1 || input.manualMovingLine > 6) {
      throw new Error('manualMovingLine must be 1..6');
    }
    upperTrigram = trigramByName(input.manualUpper);
    lowerTrigram = trigramByName(input.manualLower);
    movingLine = input.manualMovingLine;
    castingSource = `manual:upper=${input.manualUpper},lower=${input.manualLower},move=${input.manualMovingLine}`;
    trace.push({
      rule: 'meihua.cast.manual',
      detail: `手工起卦：上卦=${input.manualUpper}，下卦=${input.manualLower}，动爻=第${input.manualMovingLine}爻。`,
      data: { upper: input.manualUpper, lower: input.manualLower, move: input.manualMovingLine },
    });
  } else if (input.mode === 'numbers') {
    if (input.upperNumber === undefined || input.lowerNumber === undefined) {
      throw new Error('numbers mode requires upperNumber + lowerNumber');
    }
    upperRaw = input.upperNumber;
    lowerRaw = input.lowerNumber;
    movingRaw = input.upperNumber + input.lowerNumber;
    upperTrigram = trigramFromNumber(upperRaw);
    lowerTrigram = trigramFromNumber(lowerRaw);
    movingLine = movingLineFromSum(movingRaw);
    castingSource = `numbers:upper=${upperRaw},lower=${lowerRaw}`;
    trace.push({
      rule: 'meihua.cast.numbers',
      detail: `数字起卦：上数=${upperRaw}→${upperTrigram.name}(先天${upperTrigram.preHeavenNumber})，下数=${lowerRaw}→${lowerTrigram.name}(先天${lowerTrigram.preHeavenNumber})，动爻=(上+下) mod 6=${movingLine}。`,
      data: { upperRaw, lowerRaw, movingRaw, upper: upperTrigram.name, lower: lowerTrigram.name, movingLine },
    });
  } else {
    // time mode
    const tn = deriveTimeNumbers(input, warnings);
    if (!tn) {
      throw new Error('time mode requires valid queryTimeUtc + timezoneIana');
    }
    upperRaw = tn.upperRaw;
    lowerRaw = tn.lowerRaw;
    movingRaw = tn.movingRaw;
    upperTrigram = trigramFromNumber(upperRaw);
    lowerTrigram = trigramFromNumber(lowerRaw);
    movingLine = movingLineFromSum(movingRaw);
    castingSource = `time:${input.queryTimeUtc}|tz=${input.timezoneIana}|${tn.detail}`;
    trace.push({
      rule: 'meihua.cast.time',
      detail: `年月日时起卦：${tn.detail}；上卦=${upperTrigram.name}，下卦=${lowerTrigram.name}，动爻=第${movingLine}爻。`,
      data: { upperRaw, lowerRaw, movingRaw, upper: upperTrigram.name, lower: lowerTrigram.name, movingLine },
    });
  }

  // 本卦 / 互卦 / 变卦
  const benGua = buildHexagram(upperTrigram, lowerTrigram);
  trace.push({
    rule: 'meihua.benGua',
    detail: `本卦=${benGua.name}（上${upperTrigram.name}/下${lowerTrigram.name}）。`,
    data: { name: benGua.name, bits: benGua.bits },
  });

  const huGua = deriveHuGua(benGua);
  trace.push({
    rule: 'meihua.huGua',
    detail: `互卦=${huGua.name}（取本卦 2,3,4 爻为下，3,4,5 爻为上）。`,
    data: { name: huGua.name, bits: huGua.bits },
  });

  const bianGua = deriveBianGua(benGua, movingLine);
  trace.push({
    rule: 'meihua.bianGua',
    detail: `变卦=${bianGua.name}（动爻第${movingLine}爻阴阳互换）。`,
    data: { name: bianGua.name, bits: bianGua.bits, movingLine },
  });

  const bodyUse = analyzeBodyUse(benGua, movingLine, trace);

  // confidence + completeness
  const confidence = Math.round(
    (input.mode === 'manual' ? 75 : input.mode === 'numbers' ? 70 : 60)
    + (bodyUse.trend === 'auspicious' ? 5 : bodyUse.trend === 'inauspicious' ? -5 : 0)
  );
  const completenessScore =
    input.mode === 'manual' ? 0.95 :
    input.mode === 'numbers' ? 0.9 : 0.9;

  return {
    input,
    castingMode: input.mode,
    castingSource,
    upperRaw, lowerRaw, movingLineRaw: movingRaw,
    upperTrigram, lowerTrigram, movingLine,
    benGua, huGua, bianGua,
    bodyUse,
    confidence,
    completenessScore,
    sourceGrade,
    implementationStatus,
    warnings,
    explanationTrace: trace,
  };
}
