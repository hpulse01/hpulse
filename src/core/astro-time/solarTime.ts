/**
 * Mean / true solar time at a given geographic longitude.
 *
 * Mean solar time uses purely the longitude correction:
 *   meanSolarTime = UTC + longitude * 4 min/degree
 *
 * True solar time accounts for the Equation of Time, computed via
 * astronomy-engine's HourAngle(Sun, …) which returns the local hour
 * angle of the Sun in hours (negative before transit). Therefore:
 *   trueSolarTime = 12 + hourAngleHours  (mod 24)
 *
 * Both return a fractional hour in [0, 24).
 */

import { Body, HourAngle, Observer } from 'astronomy-engine';

const ONE_DAY_MIN = 24 * 60;

function modHours(h: number): number {
  let r = h % 24;
  if (r < 0) r += 24;
  return r;
}

export function meanSolarTimeHours(utc: Date, longitudeDeg: number): number {
  const utcHours = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  return modHours(utcHours + longitudeDeg / 15);
}

export function trueSolarTimeHours(
  utc: Date,
  latitudeDeg: number,
  longitudeDeg: number,
): number {
  // Observer altitude is irrelevant for the equation of time / hour angle of the Sun.
  const observer = new Observer(latitudeDeg, longitudeDeg, 0);
  const ha = HourAngle(Body.Sun, utc, observer); // hours
  return modHours(12 + ha);
}

/**
 * Difference (true − mean), in minutes, in [-720, 720).
 */
export function solarTimeCorrectionMinutes(trueHours: number, meanHours: number): number {
  let diff = (trueHours - meanHours) * 60;
  // Normalize to [-720, 720)
  while (diff >= ONE_DAY_MIN / 2) diff -= ONE_DAY_MIN;
  while (diff < -ONE_DAY_MIN / 2) diff += ONE_DAY_MIN;
  return diff;
}
