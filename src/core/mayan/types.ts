/**
 * P4.10 — Mayan calendar types.
 */
export type MayanDaySign =
  | 'Imix' | 'Ik' | 'Akbal' | 'Kan' | 'Chicchan'
  | 'Cimi' | 'Manik' | 'Lamat' | 'Muluc' | 'Oc'
  | 'Chuen' | 'Eb' | 'Ben' | 'Ix' | 'Men'
  | 'Cib' | 'Caban' | 'Etznab' | 'Cauac' | 'Ahau';

export interface TzolkinDay {
  /** Galactic tone 1..13. */
  tone: number;
  /** Day sign. */
  sign: MayanDaySign;
  /** Day-sign index 0..19 (Imix = 0). */
  signIndex: number;
  /** Position in 260-day cycle, 1..260. */
  position: number;
}

export interface LongCount {
  baktun: number;
  katun: number;
  tun: number;
  uinal: number;
  kin: number;
  /** Days since GMT-correlation epoch (JD 584283). */
  daysSinceEpoch: number;
}

export interface HaabDay {
  /** Day within the month: 0..19 (0..4 in Wayeb). */
  day: number;
  /** Haab month name (Pop..Cumku, Wayeb). */
  month: string;
  /** Month index 0..18 (18 = Wayeb). */
  monthIndex: number;
  /** Day of the 365-day haab year, 0..364. */
  dayOfYear: number;
  /** True if within the 5 unlucky Wayeb days. */
  isWayeb: boolean;
}

export interface LordOfNight {
  /** 1..9. */
  number: number;
  /** "G1".."G9". */
  name: string;
}

export interface CalendarRound {
  /** Position within the 18,980-day (~52 year) Calendar Round, 1-based. */
  position: number;
  /** Cycle length in days (18,980). */
  cycleDays: number;
  /** Full Calendar Round designation, e.g. "4 Ahau 8 Cumku". */
  designation: string;
}

export interface MayanInput {
  /** UTC timestamp to convert. */
  utcDateTime: string;
}

export interface MayanWarning {
  code: string; message: string; level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface MayanResult {
  input: MayanInput;
  julianDay: number;
  tzolkin: TzolkinDay;
  longCount: LongCount;
  haab: HaabDay;
  lordOfNight: LordOfNight;
  calendarRound: CalendarRound;
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: MayanWarning[];
  explanationTrace: ExplanationStep[];
}
