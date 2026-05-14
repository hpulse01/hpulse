import { describe, it, expect } from 'vitest';
import { findClause, clampClauseId } from '../clauseMapping';

describe('clampClauseId', () => {
  it('clamps below MIN to 1', () => {
    expect(clampClauseId(-10)).toEqual({ id: 1, clamped: true });
  });
  it('clamps above MAX to 12000', () => {
    expect(clampClauseId(99999)).toEqual({ id: 12000, clamped: true });
  });
  it('passes through valid ids', () => {
    expect(clampClauseId(5000)).toEqual({ id: 5000, clamped: false });
  });
});

describe('findClause', () => {
  it('returns EXACT when requested id exists', () => {
    const lookup = (n: number) => (n === 100 ? { content: 'hello' } : null);
    const r = findClause(100, lookup);
    expect(r.exactMatch).toBe(true);
    expect(r.fallbackReason).toBe('EXACT');
    expect(r.fallbackDistance).toBe(0);
    expect(r.matchedClauseNumber).toBe(100);
    expect(r.payload).toBe('hello');
  });

  it('returns NEAREST_NEIGHBOR with correct distance when one is available', () => {
    const lookup = (n: number) => (n === 105 ? { content: 'x' } : null);
    const r = findClause(100, lookup);
    expect(r.exactMatch).toBe(false);
    expect(r.fallbackReason).toBe('NEAREST_NEIGHBOR');
    expect(r.fallbackDistance).toBe(5);
    expect(r.matchedClauseNumber).toBe(105);
  });

  it('prefers smaller distance even when both sides available', () => {
    const lookup = (n: number) => ([97, 110].includes(n) ? { content: n } : null);
    const r = findClause(100, lookup);
    expect(r.matchedClauseNumber).toBe(97);
    expect(r.fallbackDistance).toBe(3);
  });

  it('returns PALACE_BOUNDARY_CLAMP when request is out of range and clamp value exists', () => {
    const lookup = (n: number) => (n === 12000 ? { content: 'edge' } : null);
    const r = findClause(99999, lookup);
    expect(r.fallbackReason).toBe('PALACE_BOUNDARY_CLAMP');
    expect(r.matchedClauseNumber).toBe(12000);
    expect(r.exactMatch).toBe(false);
    expect(r.fallbackDistance).toBe(99999 - 12000);
  });

  it('returns NO_MATCH within the search radius', () => {
    const lookup = () => null;
    const r = findClause(5000, lookup, { searchRadius: 5 });
    expect(r.exactMatch).toBe(false);
    expect(r.fallbackReason).toBe('NO_MATCH');
    expect(r.matchedClauseNumber).toBeNull();
    expect(r.fallbackDistance).toBeNull();
  });

  it('never silently substitutes — exactMatch is true ONLY for true exact', () => {
    const lookup = (n: number) => (n === 50 ? { content: 'x' } : null);
    const r = findClause(60, lookup);
    expect(r.exactMatch).toBe(false);
  });
});
