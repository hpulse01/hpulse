/**
 * P4.10 — Digit reduction with master-number preservation.
 */
import { MASTER_NUMBERS } from './constants';

/** Sum the decimal digits of a non-negative integer. */
export function sumDigits(n: number): number {
  let s = 0;
  let x = Math.abs(Math.trunc(n));
  while (x > 0) {
    s += x % 10;
    x = Math.floor(x / 10);
  }
  return s;
}

/**
 * Reduce a positive integer to a single digit, preserving master numbers
 * (11/22/33) at any reduction step.
 */
export function reduceToDigit(n: number): number {
  let v = Math.abs(Math.trunc(n));
  if (v === 0) return 0;
  while (v > 9 && !MASTER_NUMBERS.has(v)) {
    v = sumDigits(v);
  }
  return v;
}
