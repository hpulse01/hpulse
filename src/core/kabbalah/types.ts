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

export interface TreePath {
  /** Path number 11..32 (Golden Dawn attribution). */
  number: number;
  /** Hebrew letter carried by the path. */
  letter: string;
  /** Letter name (e.g. 'Aleph'). */
  letterName: string;
  from: SephirahName;
  to: SephirahName;
  meaning: string;
}

export interface GematriaResult {
  /** Total numeric value (Mispar Hechrachi — standard gematria). */
  total: number;
  /** Mispar Katan (small value): letter values reduced to 1..9 before summing. */
  katan: number;
  /** Mispar Siduri (ordinal value): letters counted by alphabet position 1..22. */
  siduri: number;
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
  /** Primary Tree of Life path (11..32) — from the name's first letter when available,
   *  otherwise from the gematria/birth-date number. Null when nothing to derive from. */
  primaryPath: TreePath | null;
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: KabbalahWarning[];
  explanationTrace: ExplanationStep[];
}
