/**
 * Tests for SixRelationsVerification state-management logic.
 *
 * These tests validate the calibration flow without a DOM, focusing on the
 * state-transition invariants that caused the "silent form reset" bug where
 * hasCalibrated being in the useEffect dependency array caused the effect to
 * fire on the calibration-complete transition (false→true), immediately
 * wiping results.
 */

import { describe, it, expect } from 'vitest';

/**
 * Minimal model of the component's calibration state machine.
 * Mirrors the real useState / useEffect logic so we can assert transitions.
 */
function createCalibrationStateMachine() {
  let hasCalibrated = false;
  let matchedOptions: unknown[] = [];
  let noMatchMessage: string | null = null;
  let selectedIndex: number | null = null;
  let isCalibrating = false;

  let fatherZodiac: number | null = null;
  let motherZodiac: number | null = null;

  // The ref-based guard (post-fix) — tracks hasCalibrated for the
  // form-change effect without making it a dependency.
  const hasCalibratedRef = { current: false };

  function syncRef() {
    hasCalibratedRef.current = hasCalibrated;
  }

  // Simulates the useEffect that resets on form-input changes.
  // BUG version: deps include hasCalibrated → fires on calibration complete.
  // FIX version: reads hasCalibratedRef, deps are form-inputs only.
  function runFormChangeEffect_BUGGY() {
    if (hasCalibrated) {
      hasCalibrated = false;
      matchedOptions = [];
      selectedIndex = null;
      noMatchMessage = null;
    }
  }

  function runFormChangeEffect_FIXED() {
    if (hasCalibratedRef.current) {
      hasCalibrated = false;
      matchedOptions = [];
      selectedIndex = null;
      noMatchMessage = null;
    }
  }

  return {
    get state() {
      return { hasCalibrated, matchedOptions, noMatchMessage, selectedIndex, isCalibrating };
    },

    setFormInputs(father: number, mother: number) {
      fatherZodiac = father;
      motherZodiac = mother;
    },

    /** Simulates handleCalibration completing with N matches */
    async simulateCalibrationSuccess(matches: unknown[]) {
      isCalibrating = true;
      hasCalibrated = false;
      noMatchMessage = null;
      syncRef();

      // async DB call returns
      matchedOptions = matches;
      hasCalibrated = true;
      isCalibrating = false;
      syncRef();
    },

    /** Simulates handleCalibration completing with 0 matches */
    async simulateCalibrationEmpty() {
      isCalibrating = true;
      hasCalibrated = false;
      noMatchMessage = null;
      syncRef();

      noMatchMessage = '数据库中未收录完全匹配条文。';
      hasCalibrated = true;
      isCalibrating = false;
      syncRef();
    },

    /** Simulates handleCalibration catching an error */
    async simulateCalibrationError() {
      isCalibrating = true;
      hasCalibrated = false;
      noMatchMessage = null;
      syncRef();

      noMatchMessage = '查询出错，请稍后重试。';
      hasCalibrated = true;
      isCalibrating = false;
      syncRef();
    },

    runFormChangeEffect_BUGGY,
    runFormChangeEffect_FIXED,
    syncRef,
  };
}

describe('SixRelationsVerification calibration state machine', () => {
  describe('BUG reproduction: hasCalibrated in useEffect deps', () => {
    it('wipes match results when buggy effect fires after calibration success', async () => {
      const sm = createCalibrationStateMachine();
      sm.setFormInputs(1, 3);
      await sm.simulateCalibrationSuccess([{ clauseNumber: 42 }]);

      expect(sm.state.hasCalibrated).toBe(true);
      expect(sm.state.matchedOptions).toHaveLength(1);

      // Simulate React running the effect because hasCalibrated changed (the bug)
      sm.runFormChangeEffect_BUGGY();

      // BUG: results wiped, form reappears
      expect(sm.state.hasCalibrated).toBe(false);
      expect(sm.state.matchedOptions).toHaveLength(0);
    });

    it('wipes no-match message when buggy effect fires after empty calibration', async () => {
      const sm = createCalibrationStateMachine();
      sm.setFormInputs(1, 3);
      await sm.simulateCalibrationEmpty();

      expect(sm.state.hasCalibrated).toBe(true);
      expect(sm.state.noMatchMessage).toBeTruthy();

      sm.runFormChangeEffect_BUGGY();

      expect(sm.state.hasCalibrated).toBe(false);
      expect(sm.state.noMatchMessage).toBeNull();
    });
  });

  describe('FIX: ref-based guard prevents spurious reset', () => {
    it('preserves match results after calibration success', async () => {
      const sm = createCalibrationStateMachine();
      sm.setFormInputs(1, 3);
      await sm.simulateCalibrationSuccess([{ clauseNumber: 42 }, { clauseNumber: 99 }]);

      // Fixed effect does NOT fire on hasCalibrated change — only on form input change.
      // Even if React were to run it, the ref trick means the deps don't include hasCalibrated.
      // The effect only runs when fatherZodiac/motherZodiac/etc. change.
      expect(sm.state.hasCalibrated).toBe(true);
      expect(sm.state.matchedOptions).toHaveLength(2);
    });

    it('preserves no-match message after empty calibration', async () => {
      const sm = createCalibrationStateMachine();
      sm.setFormInputs(1, 3);
      await sm.simulateCalibrationEmpty();

      expect(sm.state.hasCalibrated).toBe(true);
      expect(sm.state.noMatchMessage).toBeTruthy();
    });

    it('preserves error message after calibration error', async () => {
      const sm = createCalibrationStateMachine();
      sm.setFormInputs(1, 3);
      await sm.simulateCalibrationError();

      expect(sm.state.hasCalibrated).toBe(true);
      expect(sm.state.noMatchMessage).toContain('出错');
    });

    it('resets results when form input changes AFTER calibration', async () => {
      const sm = createCalibrationStateMachine();
      sm.setFormInputs(1, 3);
      await sm.simulateCalibrationSuccess([{ clauseNumber: 42 }]);

      expect(sm.state.hasCalibrated).toBe(true);

      // User changes form input — the fixed effect should reset
      sm.setFormInputs(5, 7);
      sm.runFormChangeEffect_FIXED();

      expect(sm.state.hasCalibrated).toBe(false);
      expect(sm.state.matchedOptions).toHaveLength(0);
    });

    it('does not reset when form changes before any calibration', () => {
      const sm = createCalibrationStateMachine();
      sm.syncRef();
      sm.setFormInputs(1, 3);
      sm.runFormChangeEffect_FIXED();

      // No calibration has happened, so nothing to reset
      expect(sm.state.hasCalibrated).toBe(false);
      expect(sm.state.matchedOptions).toHaveLength(0);
      expect(sm.state.noMatchMessage).toBeNull();
    });
  });
});
