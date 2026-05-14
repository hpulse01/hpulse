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

interface TimeNumbers {
  upperRaw: number;
  lowerRaw: number;
  movingRaw: number;
  detail: string;
}

/** 从 queryTimeUtc + timezoneIana 推出年支序数/月/日/时支序数。
 *  注意：此处采用公历近似 + 时支映射 (子=1..亥=12)；正式农历换算由 P4.1 calendar core 提供。
 *  这里独立推出确定数字以保证 deterministic：相同输入 → 相同输出。
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

  // 时支序数：23-1=子(1), 1-3=丑(2), ..., 21-23=亥(12)
  const branchIdx0 = Math.floor(((hour + 1) % 24) / 2); // 0..11 子→亥
  const branchOrd = branchIdx0 + 1;

  // 年支序数：以公历年对 12 取模映射到 12 地支（子=1900%12 起算的近似），仅用于起卦数字。
  // 注：传统应用农历年干支；此处采用公历年对 12 取模作 deterministic surrogate，
  // 并标记为 partial 以提示后续可由 calendar core 升级。
  const yearBranchOrd = ((year - 4) % 12 + 12) % 12 + 1; // 公元 4 年=甲子年 → 子=1
  warnings.push({
    code: 'meihua.time.yearBranch.surrogate',
    message: '年支序数采用公历年对 12 取模的 deterministic 近似，建议接入 calendar core 的真实农历年支以提升精度。',
    level: 'warn',
  });

  const upperRaw = yearBranchOrd + month + day;
  const lowerRaw = yearBranchOrd + month + day + branchOrd;
  const movingRaw = lowerRaw;

  return {
    upperRaw,
    lowerRaw,
    movingRaw,
    detail: `年支序=${yearBranchOrd}(${EARTHLY_BRANCHES[((yearBranchOrd - 1) % 12 + 12) % 12]})，月=${month}，日=${day}，时支序=${branchOrd}(${EARTHLY_BRANCHES[branchIdx0]})；上=${upperRaw}, 下=${lowerRaw}, 动=${movingRaw}`,
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
  let implementationStatus: MeihuaChart['implementationStatus'] = 'complete';
  let sourceGrade: MeihuaChart['sourceGrade'] = 'B';

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
    implementationStatus = 'partial';
    sourceGrade = 'C';
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
    input.mode === 'numbers' ? 0.9 : 0.75;

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
