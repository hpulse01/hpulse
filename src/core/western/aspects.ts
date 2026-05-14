/**
 * P4.9 — Aspect detection between planet pairs.
 */
import { ASPECTS } from './constants';
import type { AspectHit, PlanetPosition } from './types';

/** Smallest angular separation in [0, 180]. */
export function angularSeparation(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

export function detectAspects(positions: PlanetPosition[]): AspectHit[] {
  const hits: AspectHit[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const sep = angularSeparation(positions[i].longitude, positions[j].longitude);
      let best: { def: typeof ASPECTS[number]; orb: number } | null = null;
      for (const def of ASPECTS) {
        const orb = Math.abs(sep - def.exactDeg);
        if (orb <= def.defaultOrbDeg && (!best || orb < best.orb)) {
          best = { def, orb };
        }
      }
      if (best) {
        hits.push({
          a: positions[i].planet,
          b: positions[j].planet,
          aspect: best.def.name,
          exactDeg: best.def.exactDeg,
          separationDeg: sep,
          orbDeg: best.orb,
        });
      }
    }
  }
  // Deterministic ordering: tightest orb first, then planet pair name.
  hits.sort((x, y) =>
    x.orbDeg - y.orbDeg ||
    `${x.a}-${x.b}-${x.aspect}`.localeCompare(`${y.a}-${y.b}-${y.aspect}`),
  );
  return hits;
}
