/**
 * P4.2 — analyzeElements.
 *
 * Lightweight wrapper that returns favorable / unfavorable element lists
 * derived from wuxing balance + day-master strength. Used by analyzeStrength
 * and the orchestrator.
 */

import type { Element } from '../calendar/ganzhi';
import { relation } from '../calendar/wuxing';
import type { ElementWeight, StrengthLevel } from './types';

export interface ElementVerdict {
  favorable: Element[];
  unfavorable: Element[];
  notes: string[];
}

const ALL: Element[] = ['木', '火', '土', '金', '水'];

export function analyzeElements(
  dayMasterElement: Element,
  balance: ElementWeight[],
  strength: StrengthLevel,
): ElementVerdict {
  const fav: Element[] = [];
  const unfav: Element[] = [];
  const notes: string[] = [];
  // For weak day master → 比劫(same) and 印(generates DM) are favorable.
  // For strong day master → 食伤(DM generates), 财(DM controls), 官杀(controls DM) are favorable.
  const weak = strength === 'weak' || strength === 'veryWeak';
  for (const el of ALL) {
    const r = relation(el, dayMasterElement);
    if (weak) {
      if (r === 'same' || r === 'generates') fav.push(el);
      else unfav.push(el);
    } else {
      if (r === 'generatedBy' || r === 'controls' || r === 'controlledBy') fav.push(el);
      else unfav.push(el);
    }
  }
  notes.push(`day-master ${dayMasterElement} ${weak ? 'weak' : 'strong/balanced'} → favored=${fav.join('/')}`);
  void balance; // future: refine by deficit
  return { favorable: fav, unfavorable: unfav, notes };
}
