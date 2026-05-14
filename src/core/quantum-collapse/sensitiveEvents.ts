/**
 * Quantum Collapse — Sensitive Event Handling
 *
 * Detect sensitive flags from text + canonical category. Never delete the
 * event; only annotate severity and display guidance. No threatening
 * language; no harm advice.
 */

import { SENSITIVE_CATEGORIES, SENSITIVE_KEYWORDS } from './constants';
import type {
  CanonicalCategory, DisplayGuidance, EventSeed, FusedEvent,
  SensitiveFlag, SeverityLevel,
} from './types';

export function detectSensitiveFlags(text: string, category: CanonicalCategory): SensitiveFlag[] {
  const lower = (text ?? '').toLowerCase();
  const flags = new Set<SensitiveFlag>();
  for (const [flag, keywords] of Object.entries(SENSITIVE_KEYWORDS) as Array<[SensitiveFlag, string[]]>) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) flags.add(flag);
  }
  if (SENSITIVE_CATEGORIES.includes(category)) {
    if (category === 'death') flags.add('death');
    if (category === 'illness') flags.add('illness');
    if (category === 'accident') flags.add('accident');
    if (category === 'legal') flags.add('legal_dispute');
    if (category === 'conflict') flags.add('violence');
  }
  return Array.from(flags);
}

export function classifySensitiveSeverity(flags: SensitiveFlag[]): SeverityLevel {
  if (flags.length === 0) return 'minor';
  if (flags.includes('death')) return 'life_defining';
  if (flags.includes('self_harm') || flags.includes('violence') || flags.includes('crime')) return 'critical';
  if (flags.includes('illness') || flags.includes('accident') || flags.includes('family_loss')) return 'major';
  return 'moderate';
}

/**
 * Resolve display guidance.
 *
 * - admin_only_detail when self_harm/violence/crime are present (we keep
 *   the event, but the UI must collapse it for non-admin viewers).
 * - collapsed when death/illness/accident at high severity.
 * - cautious for all other sensitive flags.
 * - neutral otherwise.
 */
export function sanitizeSensitiveDisplay(flags: SensitiveFlag[]): DisplayGuidance {
  if (flags.includes('self_harm') || flags.includes('crime') || flags.includes('violence')) {
    return 'admin_only_detail';
  }
  if (flags.includes('death')) return 'collapsed';
  if (flags.includes('illness') || flags.includes('accident')) return 'cautious';
  if (flags.length > 0) return 'cautious';
  return 'neutral';
}

export function annotateSeedSensitive(seed: EventSeed): EventSeed {
  const fromText = detectSensitiveFlags(seed.description + ' ' + seed.evidence, seed.category);
  const merged = Array.from(new Set([...seed.sensitiveFlags, ...fromText]));
  return { ...seed, sensitiveFlags: merged };
}

export function annotateFusedSensitive(event: FusedEvent): FusedEvent {
  const fromText = detectSensitiveFlags(event.title + ' ' + event.description, event.canonicalCategory);
  const merged = Array.from(new Set([...event.sensitiveFlags, ...fromText]));
  return {
    ...event,
    sensitiveFlags: merged,
    displayGuidance: sanitizeSensitiveDisplay(merged),
  };
}
