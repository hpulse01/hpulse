/**
 * P4.1 — Single entry point that turns raw birth input into a fully
 * normalized astronomical timestamp suitable for every downstream engine.
 *
 * Pure deterministic. No randomness, no Math.random, no Date.now.
 */

import { julianDayFromUtc } from './julianDay';
import { offsetMinutesAt, utcFromLocal } from './timezone';
import {
  meanSolarTimeHours,
  solarTimeCorrectionMinutes,
  trueSolarTimeHours,
} from './solarTime';
import type {
  AstroWarning,
  DayBoundaryPolicy,
  ExplanationStep,
  NormalizedAstroTime,
  SourceGrade,
} from './types';

export interface NormalizeBirthTimeInput {
  /** Local civil time components, exactly as typed by the user. */
  birthLocalDateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
  };
  geoLatitude: number;
  geoLongitude: number;
  timezoneIana: string;
  /** Optional: pre-resolved UTC ISO string. If supplied, it is preferred over re-deriving. */
  birthUtcDateTime?: string;
  dayBoundaryPolicy?: DayBoundaryPolicy;
}

const isFiniteNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function normalizeBirthTime(input: NormalizeBirthTimeInput): NormalizedAstroTime {
  const warnings: AstroWarning[] = [];
  const trace: ExplanationStep[] = [];
  const policy: DayBoundaryPolicy = input.dayBoundaryPolicy ?? 'zi-shi-23';

  // ── Validation ─────────────────────────────────────────────────────────
  if (!input.timezoneIana) {
    warnings.push({
      code: 'TZ_MISSING',
      message: 'IANA timezone missing — falling back to UTC. Pillar/hour calculations will be inaccurate.',
      severity: 'error',
    });
  }
  if (!isFiniteNumber(input.geoLatitude) || !isFiniteNumber(input.geoLongitude)) {
    warnings.push({
      code: 'GEO_MISSING',
      message: 'Geographic coordinates missing or invalid — true solar time cannot be computed.',
      severity: 'error',
    });
  }
  if (Math.abs(input.geoLatitude) > 90 || Math.abs(input.geoLongitude) > 180) {
    warnings.push({
      code: 'GEO_OUT_OF_RANGE',
      message: 'Coordinates are outside Earth — clamped, but treat results as untrustworthy.',
      severity: 'error',
    });
  }

  const second = input.birthLocalDateTime.second ?? 0;

  // ── Resolve UTC + offset ──────────────────────────────────────────────
  let utc: Date;
  let offsetMinutes: number;
  if (input.birthUtcDateTime) {
    utc = new Date(input.birthUtcDateTime);
    if (Number.isNaN(utc.getTime())) {
      warnings.push({
        code: 'UTC_PARSE_FAIL',
        message: 'birthUtcDateTime is not a valid ISO string. Re-deriving from local + tz.',
        severity: 'warning',
      });
      const r = utcFromLocal(input.birthLocalDateTime, input.timezoneIana || 'UTC');
      utc = r.utc;
      offsetMinutes = r.offsetMinutes;
      trace.push({
        rule: 'utcFromLocal',
        detail: 'Derived UTC from local time + IANA timezone (Intl.DateTimeFormat tzdata).',
        data: { iana: input.timezoneIana, offsetMinutes },
      });
    } else {
      offsetMinutes = offsetMinutesAt(utc, input.timezoneIana || 'UTC');
      trace.push({
        rule: 'offsetMinutesAt',
        detail: 'Used supplied UTC instant; resolved historical offset from IANA tzdata.',
        data: { iana: input.timezoneIana, offsetMinutes },
      });
    }
  } else {
    const r = utcFromLocal(input.birthLocalDateTime, input.timezoneIana || 'UTC');
    utc = r.utc;
    offsetMinutes = r.offsetMinutes;
    trace.push({
      rule: 'utcFromLocal',
      detail: 'Derived UTC from local time + IANA timezone (Intl.DateTimeFormat tzdata).',
      data: { iana: input.timezoneIana, offsetMinutes },
    });
  }

  // ── Julian Day (UT) ───────────────────────────────────────────────────
  const jd = julianDayFromUtc(utc);
  trace.push({
    rule: 'julianDayFromUtc',
    detail: 'Computed Julian Day via Meeus AA chapter 7 (Gregorian).',
    data: { julianDay: jd },
  });

  // ── Solar time ────────────────────────────────────────────────────────
  const meanHours = meanSolarTimeHours(utc, input.geoLongitude);
  let trueHours = meanHours;
  let correction = 0;
  if (isFiniteNumber(input.geoLatitude) && isFiniteNumber(input.geoLongitude)) {
    trueHours = trueSolarTimeHours(utc, input.geoLatitude, input.geoLongitude);
    correction = solarTimeCorrectionMinutes(trueHours, meanHours);
    trace.push({
      rule: 'trueSolarTime',
      detail: 'True solar time from astronomy-engine HourAngle(Sun, observer).',
      data: { meanHours, trueHours, correctionMinutes: correction },
    });
  } else {
    warnings.push({
      code: 'TRUE_SOLAR_FALLBACK',
      message: 'True solar time not computed (missing coordinates); mean solar time used.',
      severity: 'warning',
    });
  }

  // ── Source grading ────────────────────────────────────────────────────
  let grade: SourceGrade = 'A';
  if (warnings.some((w) => w.severity === 'error')) grade = 'D';
  else if (warnings.some((w) => w.code === 'TRUE_SOLAR_FALLBACK')) grade = 'C';
  else if (warnings.length > 0) grade = 'B';

  return {
    localDateTime: { ...input.birthLocalDateTime, second },
    utcDateTime: utc.toISOString(),
    timezoneIana: input.timezoneIana || 'UTC',
    offsetMinutes,
    geoLatitude: input.geoLatitude,
    geoLongitude: input.geoLongitude,
    julianDay: jd,
    meanSolarTime: meanHours,
    trueSolarTime: trueHours,
    solarTimeCorrectionMinutes: correction,
    dayBoundaryPolicy: policy,
    warnings,
    explanationTrace: trace,
    sourceGrade: grade,
  };
}
