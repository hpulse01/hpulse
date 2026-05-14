/**
 * P4.10 — Tree of Life sephirah mapping helpers.
 */
import { SEPHIROT } from './constants';
import type { SephirahMapping } from './types';

/** Map a positive integer to a sephirah 1..10. 0 → Malkuth (10). */
export function sephirahFromNumber(n: number): SephirahMapping {
  const v = ((Math.abs(Math.trunc(n)) - 1) % 10 + 10) % 10 + 1;
  return SEPHIROT[v - 1];
}
