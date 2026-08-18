/**
 * P4.10 — Kabbalah core calculation.
 *
 * Without name input we DO NOT fabricate Gematria — we degrade gracefully:
 * primarySephirah is derived from a reduced birth-date sum and clearly
 * labelled as `derivedFromName=false` with reduced confidence.
 */
import { gematria, isHebrewInput } from './gematria';
import { sephirahFromNumber } from './treeOfLife';
import { pathFromLetter, pathFromNumber } from './paths';
import { reduceToDigit, sumDigits } from '../numerology/reduce';
import type { KabbalahInput, KabbalahResult, KabbalahWarning, ExplanationStep } from './types';

export function calculateKabbalah(input: KabbalahInput): KabbalahResult {
  const warnings: KabbalahWarning[] = [];
  const trace: ExplanationStep[] = [];

  const name = input.name?.trim() ?? '';
  const hasName = name.length > 0;

  let gem = null as ReturnType<typeof gematria> | null;
  let primaryNumber: number | null = null;

  if (hasName) {
    gem = gematria(name);
    primaryNumber = gem.total;
    trace.push({
      rule: 'kabbalah.gematria',
      detail: `Gematria(${gem.source}): Hechrachi=${gem.total}; Gadol(final-letter 500..900)=${gem.gadol}; Katan=${gem.katan}; Siduri=${gem.siduri}; letters=${gem.letters.length}`,
    });
    if (gem.source === 'transliterated') {
      warnings.push({
        code: 'latin_transliteration',
        message: 'Name was provided in Latin script; transliterated to Hebrew via coarse phonetic map. For exact gematria, supply Hebrew letters.',
        level: 'warn',
      });
      warnings.push({
        code: 'gadol_final_forms_not_inferred',
        message: 'Mispar Gadol final-letter values are only applied to explicit Hebrew final-form characters; Latin transliteration does not infer Hebrew word-final spelling.',
        level: 'info',
      });
    }
    if (gem.letters.length === 0) {
      warnings.push({
        code: 'no_gematria_letters',
        message: 'Name produced zero gematria-mappable letters; primary sephirah will fall back to birth date.',
        level: 'warn',
      });
      primaryNumber = null;
    }
  } else {
    warnings.push({
      code: 'no_name',
      message: 'No name (Hebrew or Latin) supplied — Gematria SKIPPED. Primary sephirah falls back to a coarse birth-date mapping; this is NOT a complete Kabbalistic profile.',
      level: 'warn',
    });
    trace.push({ rule: 'kabbalah.gematria', detail: 'skipped (no name)' });
  }

  if (primaryNumber == null) {
    if (input.birthYear != null && input.birthMonth != null && input.birthDay != null) {
      primaryNumber = reduceToDigit(
        sumDigits(input.birthYear) + sumDigits(input.birthMonth) + sumDigits(input.birthDay),
      );
      trace.push({
        rule: 'kabbalah.fallback',
        detail: `Fallback sephirah index from reduced birthdate = ${primaryNumber}`,
      });
    }
  }

  const primarySephirah = primaryNumber != null ? sephirahFromNumber(primaryNumber) : null;
  if (primarySephirah) {
    trace.push({
      rule: 'kabbalah.tree',
      detail: `Sephirah ${primarySephirah.number} ${primarySephirah.name} — ${primarySephirah.attribute}`,
    });
  }

  const derivedFromName = hasName && gem != null && gem.letters.length > 0;
  const isHebrewSource = derivedFromName && gem!.source === 'hebrew';

  let primaryPath = null as ReturnType<typeof pathFromNumber> | null;
  if (derivedFromName) {
    primaryPath = pathFromLetter(gem!.letters[0].letter) ?? pathFromNumber(gem!.total);
    trace.push({
      rule: 'kabbalah.path',
      detail: `Path ${primaryPath.number} (${primaryPath.letterName} ${primaryPath.letter}): ${primaryPath.from} → ${primaryPath.to} — ${primaryPath.meaning}`,
    });
  } else if (primaryNumber != null) {
    primaryPath = pathFromNumber(primaryNumber);
    trace.push({
      rule: 'kabbalah.path',
      detail: `Fallback path ${primaryPath.number} (${primaryPath.letterName}) from birth-date number ${primaryNumber}`,
    });
  }

  const completenessScore = isHebrewSource ? 90 : derivedFromName ? 70 : 42;
  const confidence = isHebrewSource ? 80 : derivedFromName ? 62 : 36;
  const sourceGrade: KabbalahResult['sourceGrade'] = isHebrewSource ? 'B' : derivedFromName ? 'C' : 'D';

  return {
    input,
    gematria: gem,
    primarySephirah,
    derivedFromName,
    primaryPath,
    confidence,
    completenessScore,
    sourceGrade,
    // The implemented Gematria subset is deterministic, but Tikkun and a
    // release-grade transliteration/orthography corpus remain out of scope.
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}

export { isHebrewInput };
