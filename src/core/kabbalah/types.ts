/**
 * P4.10 — Kabbalah types.
 */
export type SephirahName =
  | 'Keter' | 'Chokhmah' | 'Binah' | 'Chesed' | 'Gevurah'
  | 'Tiferet' | 'Netzach' | 'Hod' | 'Yesod' | 'Malkuth';

export interface SephirahMapping {
  /** 1..10. */
  number: number;
  name: SephirahName;
  /** Short attribute. */
  attribute: string;
}

export interface GematriaResult {
  /** Total numeric value (Mispar Hechrachi — standard gematria). */
  total: number;
  /** Per-letter breakdown. */
  letters: { letter: string; value: number }[];
  /** Source language: 'hebrew' for native Hebrew input, 'transliterated' for Latin letters mapped to nearest Hebrew letter. */
  source: 'hebrew' | 'transliterated';
}

export interface KabbalahInput {
  /** Birth date (Gregorian) — used as a fallback path mapping. */
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  /** Hebrew or Latin name. Required for full Gematria; without it we degrade. */
  name?: string;
}

export interface KabbalahWarning {
  code: string; message: string; level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface KabbalahResult {
  input: KabbalahInput;
  /** Gematria of the supplied name; null if no name provided. */
  gematria: GematriaResult | null;
  /** Sephirah mapping for the primary path (from Gematria mod 10, or LifePath if no name). */
  primarySephirah: SephirahMapping | null;
  /** Whether the result was derived from a real name vs birth-date-only fallback. */
  derivedFromName: boolean;
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: KabbalahWarning[];
  explanationTrace: ExplanationStep[];
}
