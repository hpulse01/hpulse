/**
 * P4.5 — 冲合刑害 detection across the cast hexagram.
 */

import type { ClashCombineEntry, Hexagram } from './types';
import {
  BRANCH_CHONG, BRANCH_HE, BRANCH_HAI, BRANCH_XING,
} from './constants';

export function detectClashCombine(main: Hexagram): ClashCombineEntry[] {
  const entries: ClashCombineEntry[] = [];
  const lines = main.lines;

  // 卦冲：上下卦六冲（世应同位地支冲）
  const shi = lines[main.shiYao - 1];
  const ying = lines[main.yingYao - 1];
  if (shi && ying && BRANCH_CHONG[shi.branch] === ying.branch) {
    entries.push({
      type: '冲卦', scope: '卦', positions: [shi.position, ying.position],
      description: `世爻${shi.branch}与应爻${ying.branch}相冲，主对方与己意见相左、事多变动。`,
    });
  }
  if (shi && ying && BRANCH_HE[shi.branch] === ying.branch) {
    entries.push({
      type: '合卦', scope: '卦', positions: [shi.position, ying.position],
      description: `世应${shi.branch}${ying.branch}相合，主双方意合、事易成。`,
    });
  }

  // 爻级：检查动爻与其它爻的冲合刑害
  for (const ln of lines) {
    if (!ln.isChanging) continue;
    for (const other of lines) {
      if (other.position === ln.position) continue;
      if (BRANCH_CHONG[ln.branch] === other.branch) {
        entries.push({
          type: '六冲', scope: '爻', positions: [ln.position, other.position],
          description: `第${ln.position}爻${ln.branch}动冲第${other.position}爻${other.branch}。`,
        });
      }
      if (BRANCH_HE[ln.branch] === other.branch) {
        entries.push({
          type: '六合', scope: '爻', positions: [ln.position, other.position],
          description: `第${ln.position}爻${ln.branch}动合第${other.position}爻${other.branch}。`,
        });
      }
      if (BRANCH_HAI[ln.branch] === other.branch) {
        entries.push({
          type: '相害', scope: '爻', positions: [ln.position, other.position],
          description: `第${ln.position}爻${ln.branch}与第${other.position}爻${other.branch}相害。`,
        });
      }
      if ((BRANCH_XING[ln.branch] || []).includes(other.branch) && other.branch !== ln.branch) {
        entries.push({
          type: '三刑', scope: '爻', positions: [ln.position, other.position],
          description: `第${ln.position}爻${ln.branch}与第${other.position}爻${other.branch}相刑。`,
        });
      }
    }
  }

  return entries;
}
