/**
 * P4.8 — Da Liu Ren (大六壬) deterministic calculator (basic plate).
 */
import type { LiurenInput, LiurenChart, ExplanationStep, LiurenWarning, BranchCN, StemCN } from './types';
import { normalizeBirthTime } from '../astro-time/normalizeBirthTime';
import { fourPillarsFromAstro } from '../calendar/fourPillars';
import { previousSolarTerm } from '../calendar/solarTerms';
import {
  resolveMonthGeneral, buildPlates, buildFourClasses, deriveThreeTransmissions, placeTwelveDeities,
} from './plate';

export function calculateLiurenChart(input: LiurenInput): LiurenChart {
  if (!input.queryTimeUtc || !input.timezoneIana) {
    throw new Error('Liuren requires queryTimeUtc + timezoneIana');
  }
  const trace: ExplanationStep[] = [];
  const warnings: LiurenWarning[] = [];

  const utc = new Date(input.queryTimeUtc);
  if (Number.isNaN(utc.getTime())) throw new Error('Liuren: invalid queryTimeUtc');

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: input.timezoneIana,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  });
  const parts = fmt.formatToParts(utc).reduce((m, p) => { m[p.type] = p.value; return m; }, {} as Record<string,string>);
  const local = {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
  };

  const lat = input.geoLatitude ?? 39.9042;
  const lon = input.geoLongitude ?? 116.4074;
  if (input.geoLatitude === undefined || input.geoLongitude === undefined) {
    warnings.push({
      code: 'liuren.geo.default',
      message: '未提供 geo，回退北京坐标。',
      level: 'warn',
    });
  }

  const astro = normalizeBirthTime({
    birthLocalDateTime: local,
    geoLatitude: lat, geoLongitude: lon,
    timezoneIana: input.timezoneIana,
    birthUtcDateTime: input.queryTimeUtc,
  });
  const fp = fourPillarsFromAstro(astro);
  trace.push({
    rule: 'liuren.fourPillars',
    detail: `年=${fp.year.ganzhi} 月=${fp.month.ganzhi} 日=${fp.day.ganzhi} 时=${fp.hour.ganzhi}.`,
    data: { year: fp.year.ganzhi, month: fp.month.ganzhi, day: fp.day.ganzhi, hour: fp.hour.ganzhi },
  });

  const term = previousSolarTerm(utc);
  trace.push({
    rule: 'liuren.solarTerm',
    detail: `最近节气=${term.name}.`,
    data: { name: term.name, utc: term.utc.toISOString() },
  });

  const mg = resolveMonthGeneral(term.name, trace, warnings);
  const hourBranch = fp.hour.branch as BranchCN;
  const dayStem = fp.day.stem as StemCN;
  const dayBranch = fp.day.branch as BranchCN;

  const platesRaw = buildPlates(mg.branch, hourBranch, trace);

  // 昼夜判定: 卯(5时)~申(17时) 为昼，否则为夜。
  const dayBranchIdxOfHour = ['卯','辰','巳','午','未','申'].includes(hourBranch);
  const isNight = input.nightDivination ?? !dayBranchIdxOfHour;

  const { plates, nobleEarth } = placeTwelveDeities(platesRaw, dayStem, isNight, trace);

  const fc = buildFourClasses(plates, dayStem, dayBranch, trace);
  const tt = deriveThreeTransmissions(plates, fc, trace, warnings);

  const dsPalace = plates.find((p) => p.earthBranch === fp.day.branch)?.earthBranch ?? '子';

  warnings.push({
    code: 'liuren.advanced.partial',
    message: '高级九宗门 (涉害/昴星/别责/八专/伏吟/反吟/遥克) 与年命/课体格局未完整实现，标记 partial。',
    level: 'info',
  });

  return {
    input,
    yearGanzhi: fp.year.ganzhi,
    monthGanzhi: fp.month.ganzhi,
    dayGanzhi: fp.day.ganzhi,
    hourGanzhi: fp.hour.ganzhi,
    solarTerm: term.name,
    monthGeneral: mg.general,
    monthGeneralBranch: mg.branch,
    hourBranch,
    dayStem,
    dayBranch,
    dayStemPalace: dsPalace as BranchCN,
    isNight,
    noblePerson: nobleEarth,
    plates,
    fourClasses: fc,
    threeTransmissions: tt,
    confidence: 60 + (tt.method === 'fallback' ? -10 : 0) + (tt.method === '贼克' ? 5 : 0),
    completenessScore: 0.65,
    sourceGrade: 'C',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
