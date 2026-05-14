/**
 * P4.10 — Mayan constants.
 */
import type { MayanDaySign } from './types';

/** 20 Tzolkin day signs in canonical order, Imix = index 0. */
export const DAY_SIGNS: MayanDaySign[] = [
  'Imix', 'Ik', 'Akbal', 'Kan', 'Chicchan',
  'Cimi', 'Manik', 'Lamat', 'Muluc', 'Oc',
  'Chuen', 'Eb', 'Ben', 'Ix', 'Men',
  'Cib', 'Caban', 'Etznab', 'Cauac', 'Ahau',
];

/**
 * GMT (Goodman–Martínez–Thompson) correlation constant:
 * Long Count 0.0.0.0.0 (4 Ahau, 8 Cumku) = Julian Day 584283
 * (proleptic Gregorian Aug 11, 3114 BCE).
 *
 * This is the most widely accepted correlation.
 */
export const MAYAN_EPOCH_JD = 584283;
