/**
 * P4.10 — Gematria computation (Hebrew + Latin transliteration fallback).
 */
import { HEBREW_GEMATRIA, LATIN_TO_HEBREW } from './constants';
import type { GematriaResult } from './types';

const HEBREW_RANGE_RE = /[\u0590-\u05FF]/;

export function isHebrewInput(s: string): boolean {
  return HEBREW_RANGE_RE.test(s);
}

export function gematria(name: string): GematriaResult {
  const trimmed = name.trim();
  const source: GematriaResult['source'] = isHebrewInput(trimmed) ? 'hebrew' : 'transliterated';
  const letters: GematriaResult['letters'] = [];

  if (source === 'hebrew') {
    for (const ch of trimmed) {
      const v = HEBREW_GEMATRIA[ch];
      if (v != null) letters.push({ letter: ch, value: v });
    }
  } else {
    for (const raw of trimmed.toUpperCase()) {
      const heb = LATIN_TO_HEBREW[raw];
      if (heb != null) {
        letters.push({ letter: heb, value: HEBREW_GEMATRIA[heb] });
      }
    }
  }

  const total = letters.reduce((s, l) => s + l.value, 0);
  return { total, letters, source };
}
