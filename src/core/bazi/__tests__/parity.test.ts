/**
 * Bidirectional parity test between the new P4.2 core and the legacy
 * `performDeepBaZiAnalysis` engine.
 *
 * IMPORTANT: the legacy engine uses lunar-typescript's `getYearInGanZhi()`
 * which switches the year pillar at *Lunar New Year* (春节). The new core
 * uses `getYearInGanZhiExact()` which switches at 立春 — the canonically
 * correct 子平 八字 boundary.
 *
 * Therefore parity is only expected for births that fall OUTSIDE the
 * 立春 ↔ 春节 disagreement window. We assert:
 *   1. fourPillars match for dates well clear of any boundary.
 *   2. day stem matches always (day boundary policy is identical).
 *   3. inside the disagreement window, new core matches 立春 truth and
 *      legacy disagrees — documented, not "patched".
 */
import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../../astro-time/normalizeBirthTime';
import { calculateBazi } from '../calculateBazi';
import { performDeepBaZiAnalysis } from '../../../utils/baziDeepAnalysis';

const SH = { geoLatitude: 31.2304, geoLongitude: 121.4737, timezoneIana: 'Asia/Shanghai' };

const cases = [
  { y: 1995, m: 6,  d: 15, h: 14, mi: 30 },
  { y: 1985, m: 8,  d: 20, h: 11, mi: 0 },
  { y: 2000, m: 7,  d: 20, h: 8,  mi: 0 },  // mid-月, well clear of any 节
  { y: 2010, m: 12, d: 1,  h: 18, mi: 30 },
  { y: 1978, m: 9,  d: 9,  h: 9,  mi: 0 },
];

describe('P4.2 ↔ legacy parity (outside 立春 boundary window)', () => {
  for (const c of cases) {
    it(`${c.y}-${c.m}-${c.d} ${c.h}:${c.mi} four pillars match legacy`, () => {
      const astro = normalizeBirthTime({
        birthLocalDateTime: { year: c.y, month: c.m, day: c.d, hour: c.h, minute: c.mi }, ...SH,
      });
      const newChart = calculateBazi(astro);
      const legacy = performDeepBaZiAnalysis(c.y, c.m, c.d, c.h, c.mi, 'male');

      expect(newChart.fourPillars.day.ganzhi).toBe(legacy.fourPillars.day);
      expect(newChart.fourPillars.month.ganzhi).toBe(legacy.fourPillars.month);
      expect(newChart.fourPillars.year.ganzhi).toBe(legacy.fourPillars.year);
      expect(newChart.fourPillars.hour.ganzhi).toBe(legacy.fourPillars.hour);
    });
  }
});

describe('P4.2 corrects the 立春 boundary the legacy engine gets wrong', () => {
  // 1990 春节 was Jan 27; 立春 was Feb 4. A birth on Feb 1 is BEFORE 立春
  // → year pillar must remain 己巳 (1989) per 子平 rule, but legacy's
  // getYearInGanZhi treats it as already 庚午 (since past 春节).
  it('1990-02-01 12:00: new core = 己巳, legacy = 庚午', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 2, day: 1, hour: 12, minute: 0 }, ...SH,
    });
    const newChart = calculateBazi(astro);
    const legacy = performDeepBaZiAnalysis(1990, 2, 1, 12, 0, 'male');

    expect(newChart.fourPillars.year.ganzhi).toBe('己巳');
    expect(legacy.fourPillars.year).toBe('庚午'); // documented divergence
  });

  it('1990-02-10 12:00 (after 立春): both agree on 庚午', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 2, day: 10, hour: 12, minute: 0 }, ...SH,
    });
    const newChart = calculateBazi(astro);
    const legacy = performDeepBaZiAnalysis(1990, 2, 10, 12, 0, 'male');

    expect(newChart.fourPillars.year.ganzhi).toBe('庚午');
    expect(legacy.fourPillars.year).toBe('庚午');
  });
});
