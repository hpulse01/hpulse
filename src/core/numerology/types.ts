/**
 * P4.10 — Numerology types.
 */
export interface NumerologyInput {
  /** Local birth date (Gregorian). */
  birthYear: number;
  birthMonth: number;     // 1..12
  birthDay: number;       // 1..31
  /** Full birth name (Latin script). Optional — without it, name-based numbers are skipped. */
  fullName?: string;
  /** Reference year for Personal Year (defaults to current Gregorian year of queryTimeUtc). */
  referenceYear?: number;
  /** ISO UTC timestamp the query was made (used only to derive default referenceYear). */
  queryTimeUtc?: string;
}

export interface NumerologyWarning {
  code: string; message: string; level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface KarmicDebt {
  /** Which core number carried the debt. */
  source: 'lifePath' | 'destiny' | 'soulUrge' | 'personality' | 'birthday';
  /** The unreduced total (13, 14, 16 or 19). */
  number: number;
}

export interface PinnacleCycle {
  index: 1 | 2 | 3 | 4;
  number: number;
  /** Conventional age range; age 0 begins at birth. */
  startAge: number;
  /** Inclusive. Null means the fourth cycle is open-ended. */
  endAgeInclusive: number | null;
}

export interface NumerologyResult {
  input: NumerologyInput;
  /** Life Path number derived from full birth date. Master numbers 11/22/33 preserved. */
  lifePath: number;
  /** Destiny / Expression number — sum of all letters in full name. */
  destiny: number | null;
  /** Soul Urge — sum of vowels. */
  soulUrge: number | null;
  /** Personality — sum of consonants. */
  personality: number | null;
  /** Personal Year for referenceYear. */
  personalYear: number;
  referenceYear: number;
  /** Birthday number — reduce(birthDay), master numbers preserved. */
  birthday: number;
  /** Maturity number — reduce(lifePath + destiny). Null without name. */
  maturity: number | null;
  /** Karmic Debt numbers (13/14/16/19) detected in unreduced core totals. */
  karmicDebts: KarmicDebt[];
  /** Chaldean Destiny (name) number — secondary system. Null without name. */
  chaldeanDestiny: number | null;
  /** Four conventional Pinnacle values with their age ranges. */
  pinnacleCycles: PinnacleCycle[];
  /** Four Challenge values. Their timing is deliberately not given exact boundaries. */
  challenges: [number, number, number, number];
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: NumerologyWarning[];
  explanationTrace: ExplanationStep[];
}
