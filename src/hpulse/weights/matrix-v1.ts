/**
 * HPU-3 weight matrices — v1.0.0 (matrixVersion = "wmat-1.0.0").
 *
 * Hand-curated coefficients aligned to each engine's classical strengths:
 *  - bazi / ziwei / tieban — natal lifelong fate (strong on career/wealth/year-decade scale)
 *  - liuyao / daliuren     — instant query (strong on decision/crisis at hour/day)
 *  - qimen                 — strategy & crisis at minute/hour
 *  - meihua                — quick decision, omen reading
 *  - taiyi                 — macro cycles (year/decade), migration
 *  - astrology             — psychological, love, life-rhythm
 *  - numerology            — auxiliary signal, broadly applicable but low weight
 *
 * Values are coefficients, not probabilities. Final W is normalized by Σ.
 * Range chosen in [0.1, 1.5] to keep no single axis from dominating.
 */
import type { EngineId, EventType, Granularity, LifeStage } from "./types";

type Row<K extends string> = Record<EngineId, number> & { __k?: K };

const r = <K extends string>(o: Record<EngineId, number>): Row<K> => o as Row<K>;

/** α_i(t) — life-stage strength. */
export const ALPHA: Record<LifeStage, Row<"alpha">> = {
  childhood: r({
    bazi: 1.0, ziwei: 0.9, tieban: 0.8, meihua: 0.6, liuyao: 0.4,
    qimen: 0.3, daliuren: 0.3, taiyi: 0.7, astrology: 1.0, numerology: 0.6,
  }),
  youth: r({
    bazi: 1.2, ziwei: 1.1, tieban: 1.0, meihua: 0.8, liuyao: 0.9,
    qimen: 0.9, daliuren: 0.8, taiyi: 0.9, astrology: 1.1, numerology: 0.7,
  }),
  prime: r({
    bazi: 1.4, ziwei: 1.3, tieban: 1.2, meihua: 1.0, liuyao: 1.1,
    qimen: 1.2, daliuren: 1.1, taiyi: 1.1, astrology: 0.9, numerology: 0.6,
  }),
  middle: r({
    bazi: 1.3, ziwei: 1.2, tieban: 1.2, meihua: 1.0, liuyao: 1.0,
    qimen: 1.0, daliuren: 1.0, taiyi: 1.2, astrology: 0.8, numerology: 0.5,
  }),
  elder: r({
    bazi: 1.2, ziwei: 1.1, tieban: 1.1, meihua: 0.8, liuyao: 0.8,
    qimen: 0.7, daliuren: 0.7, taiyi: 1.3, astrology: 0.7, numerology: 0.4,
  }),
};

/** β_i(e) — event-type affinity. */
export const BETA: Record<EventType, Row<"beta">> = {
  career: r({
    bazi: 1.5, ziwei: 1.4, tieban: 1.3, meihua: 0.7, liuyao: 0.8,
    qimen: 1.0, daliuren: 0.8, taiyi: 0.9, astrology: 0.7, numerology: 0.5,
  }),
  wealth: r({
    bazi: 1.5, ziwei: 1.3, tieban: 1.2, meihua: 0.8, liuyao: 1.0,
    qimen: 1.1, daliuren: 0.9, taiyi: 0.8, astrology: 0.6, numerology: 0.5,
  }),
  love: r({
    bazi: 1.2, ziwei: 1.4, tieban: 1.1, meihua: 0.9, liuyao: 1.1,
    qimen: 0.6, daliuren: 0.8, taiyi: 0.6, astrology: 1.4, numerology: 0.5,
  }),
  health: r({
    bazi: 1.3, ziwei: 1.2, tieban: 1.0, meihua: 0.7, liuyao: 0.8,
    qimen: 0.7, daliuren: 0.7, taiyi: 0.9, astrology: 1.0, numerology: 0.4,
  }),
  crisis: r({
    bazi: 0.9, ziwei: 0.9, tieban: 0.8, meihua: 1.1, liuyao: 1.3,
    qimen: 1.5, daliuren: 1.4, taiyi: 0.8, astrology: 0.6, numerology: 0.4,
  }),
  decision: r({
    bazi: 0.8, ziwei: 0.8, tieban: 0.8, meihua: 1.4, liuyao: 1.5,
    qimen: 1.3, daliuren: 1.3, taiyi: 0.7, astrology: 0.7, numerology: 0.5,
  }),
  migration: r({
    bazi: 1.0, ziwei: 1.0, tieban: 0.9, meihua: 0.9, liuyao: 1.1,
    qimen: 1.2, daliuren: 1.0, taiyi: 1.3, astrology: 0.8, numerology: 0.5,
  }),
  general: r({
    bazi: 1.2, ziwei: 1.2, tieban: 1.0, meihua: 0.9, liuyao: 0.9,
    qimen: 0.9, daliuren: 0.9, taiyi: 1.0, astrology: 0.9, numerology: 0.6,
  }),
};

/** γ_i(d) — granularity precision. */
export const GAMMA: Record<Granularity, Row<"gamma">> = {
  minute: r({
    bazi: 0.4, ziwei: 0.4, tieban: 0.3, meihua: 1.3, liuyao: 1.2,
    qimen: 1.5, daliuren: 1.4, taiyi: 0.3, astrology: 0.5, numerology: 0.4,
  }),
  hour: r({
    bazi: 0.6, ziwei: 0.6, tieban: 0.5, meihua: 1.3, liuyao: 1.4,
    qimen: 1.5, daliuren: 1.4, taiyi: 0.4, astrology: 0.6, numerology: 0.4,
  }),
  day: r({
    bazi: 0.9, ziwei: 0.9, tieban: 0.8, meihua: 1.2, liuyao: 1.3,
    qimen: 1.2, daliuren: 1.2, taiyi: 0.6, astrology: 0.9, numerology: 0.6,
  }),
  week: r({
    bazi: 1.0, ziwei: 1.0, tieban: 0.9, meihua: 1.0, liuyao: 1.0,
    qimen: 0.9, daliuren: 0.9, taiyi: 0.7, astrology: 1.0, numerology: 0.6,
  }),
  month: r({
    bazi: 1.2, ziwei: 1.2, tieban: 1.1, meihua: 0.8, liuyao: 0.8,
    qimen: 0.7, daliuren: 0.7, taiyi: 1.0, astrology: 1.1, numerology: 0.6,
  }),
  year: r({
    bazi: 1.5, ziwei: 1.4, tieban: 1.3, meihua: 0.6, liuyao: 0.6,
    qimen: 0.5, daliuren: 0.5, taiyi: 1.3, astrology: 1.2, numerology: 0.5,
  }),
  decade: r({
    bazi: 1.5, ziwei: 1.5, tieban: 1.4, meihua: 0.4, liuyao: 0.4,
    qimen: 0.3, daliuren: 0.3, taiyi: 1.5, astrology: 1.1, numerology: 0.4,
  }),
};
