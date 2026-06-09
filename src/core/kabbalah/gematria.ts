/**
 * P4.10 — Gematria computation (Hebrew + Latin transliteration fallback).
 */
import { HEBREW_GEMATRIA, LATIN_TO_HEBREW, HEBREW_ALPHABET } from './constants';
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
  const katan = letters.reduce((s, l) => s + reduceValue(l.value), 0);
  const siduri = letters.reduce((s, l) => s + ordinalValue(l.letter), 0);
  return { total, katan, siduri, letters, source };
}

const FINAL_TO_STANDARD: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

/** Mispar Katan: drop zeros from the standard value (10→1, 200→2, 400→4). */
function reduceValue(v: number): number {
  let x = v;
  while (x > 9 && x % 10 === 0) x = x / 10;
  return x;
}

/** Mispar Siduri: ordinal alphabet position 1..22 (final forms take base letter position). */
function ordinalValue(letter: string): number {
  const std = FINAL_TO_STANDARD[letter] ?? letter;
  const idx = HEBREW_ALPHABET.indexOf(std);
  return idx >= 0 ? idx + 1 : 0;
}
