/**
 * 五行生克 helpers. Pure.
 */

import type { Element } from './ganzhi';

export const ELEMENTS: readonly Element[] = ['木', '火', '土', '金', '水'];

/** Sheng cycle: a generates b. */
const SHENG: Record<Element, Element> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

/** Ke cycle: a controls b. */
const KE: Record<Element, Element> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

export function generates(a: Element, b: Element): boolean {
  return SHENG[a] === b;
}

export function generatedBy(a: Element, b: Element): boolean {
  return SHENG[b] === a;
}

export function controls(a: Element, b: Element): boolean {
  return KE[a] === b;
}

export function controlledBy(a: Element, b: Element): boolean {
  return KE[b] === a;
}

/** Same element. */
export function same(a: Element, b: Element): boolean {
  return a === b;
}

export type FiveRelation = 'same' | 'generates' | 'generatedBy' | 'controls' | 'controlledBy';

export function relation(a: Element, b: Element): FiveRelation {
  if (a === b) return 'same';
  if (generates(a, b)) return 'generates';
  if (generatedBy(a, b)) return 'generatedBy';
  if (controls(a, b)) return 'controls';
  return 'controlledBy';
}
