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
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: MayanWarning[];
  explanationTrace: ExplanationStep[];
}
