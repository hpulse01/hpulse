/**
 * P4.2 — analyzeTenGods.
 *
 * Aggregates ten-gods exposure across stems + hidden stems, grouped by
 * canonical category (财官印食伤比劫枭杀).
 */

import type { TenGod } from '../calendar/tenGods';
import type { BaziPillar } from './types';

export interface TenGodAggregate {
  god: TenGod;
  totalWeight: number;
  positions: BaziPillar['position'][];
}

export function analyzeTenGods(pillars: BaziPillar[]): TenGodAggregate[] {
  const map = new Map<TenGod, TenGodAggregate>();
  const ensure = (g: TenGod): TenGodAggregate => {
    let v = map.get(g);
    if (!v) { v = { god: g, totalWeight: 0, positions: [] }; map.set(g, v); }
    return v;
  };
  for (const p of pillars) {
    if (p.tenGod !== '日主') {
      const g = ensure(p.tenGod as TenGod);
      g.totalWeight += 1.0;
      if (!g.positions.includes(p.position)) g.positions.push(p.position);
    }
    for (const h of p.hiddenStems) {
      const g = ensure(h.tenGod);
      g.totalWeight += h.weight;
      if (!g.positions.includes(p.position)) g.positions.push(p.position);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalWeight - a.totalWeight);
}
