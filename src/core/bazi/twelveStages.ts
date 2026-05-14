/**
 * P4.2 — 十二长生 (Twelve Stages) for a stem on each branch.
 *
 * 阳干 forward, 阴干 backward starting from the 长生 branch.
 */

import { BRANCHES, STEM_YINYANG, type Stem, type Branch } from '../calendar/ganzhi';
import { TWELVE_STAGE_START, TWELVE_STAGE_NAMES } from './constants';
import type { TwelveStage } from './types';

export function twelveStageOf(stem: Stem, branch: Branch): TwelveStage {
  const startBranch = TWELVE_STAGE_START[stem];
  const startIdx = BRANCHES.indexOf(startBranch);
  const branchIdx = BRANCHES.indexOf(branch);
  const forward = STEM_YINYANG[stem] === '阳';
  const offset = forward
    ? (branchIdx - startIdx + 12) % 12
    : (startIdx - branchIdx + 12) % 12;
  return TWELVE_STAGE_NAMES[offset] as TwelveStage;
}
