/**
 * P4.1 — Astronomical time normalization types.
 *
 * Pure data structures. No React. No randomness.
 */

export type DayBoundaryPolicy = 'zi-shi-23' | 'midnight-00';

export type SourceGrade = 'A' | 'B' | 'C' | 'D';

export interface ExplanationStep {
  /** Stable id of the rule applied. */
  rule: string;
  /** Human readable description. */
  detail: string;
  /** Optional structured payload that produced the result. */
  data?: Record<string, unknown>;
}

export interface AstroWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface NormalizedAstroTime {
  /** Local civil time at birth (as components). */
  localDateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
  /** UTC instant of birth as ISO-8601 string. */
  utcDateTime: string;
  /** IANA timezone identifier (e.g. 'Asia/Shanghai'). */
  timezoneIana: string;
  /** Actual UTC offset in minutes at the birth moment (handles DST). */
  offsetMinutes: number;
  geoLatitude: number;
  geoLongitude: number;
  /** Julian Day (UT). */
  julianDay: number;
  /** Mean solar time at birth longitude, in fractional hours (0–24). */
  meanSolarTime: number;
  /** True (apparent) solar time at birth longitude, in fractional hours (0–24). */
  trueSolarTime: number;
  /** True − Mean solar time, in minutes (Equation of Time + longitude correction effect already in mean). */
  solarTimeCorrectionMinutes: number;
  dayBoundaryPolicy: DayBoundaryPolicy;
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
  sourceGrade: SourceGrade;
}
