/**
 * P4.7 — 八门 转盘.
 * 简化规则:
 *   - 值使门 = 旬首之 仪 所在宫的 default 八门 (palace 5 → 寄 2 死门).
 *   - 时支宫 = 值使门新位置 (HOUR_BRANCH_PALACE).
 *   - 八宫环序按 阴/阳遁 移位.
 */
import type { BranchCN, DunDirection, GateName, PalaceNumber, SanQiLiuYi, ExplanationStep } from './types';
import { GATE_AT_PALACE, HOUR_BRANCH_PALACE, LOOP_ORDER } from './constants';

export interface GateRotationResult {
  gateAtPalace: Record<PalaceNumber, GateName | null>;
  zhiShiGate: GateName;
  zhiShiOriginPalace: PalaceNumber;
  hourBranchPalace: PalaceNumber;
}

function loopIndex(p: PalaceNumber): number {
  return LOOP_ORDER.indexOf(p);
}

export function rotateGates(
  layout: Record<PalaceNumber, SanQiLiuYi>,
  xunShouYi: SanQiLiuYi,
  hourBranch: BranchCN,
  dun: DunDirection,
  trace: ExplanationStep[],
): GateRotationResult {
  let originPalace: PalaceNumber = 1;
  for (const p of [1,2,3,4,5,6,7,8,9] as PalaceNumber[]) {
    if (layout[p] === xunShouYi) { originPalace = p; break; }
  }
  const effOrigin: PalaceNumber = originPalace === 5 ? 2 : originPalace;
  const zhiShiGate = (GATE_AT_PALACE[effOrigin] ?? '死门') as GateName;

  const hourBranchPalace = HOUR_BRANCH_PALACE[hourBranch];
  const effTarget: PalaceNumber = hourBranchPalace === 5 ? 2 : hourBranchPalace;

  const fromIdx = loopIndex(effOrigin);
  const toIdx = loopIndex(effTarget);
  const dir = dun === 'yang' ? 1 : -1;
  const shift = ((toIdx - fromIdx) * dir + 800) % 8;

  const out: Partial<Record<PalaceNumber, GateName | null>> = { 5: null };
  for (let i = 0; i < 8; i++) {
    const srcPalace = LOOP_ORDER[i];
    const gate = GATE_AT_PALACE[srcPalace];
    const newIdx = (i + dir * shift + 800) % 8;
    const dstPalace = LOOP_ORDER[newIdx];
    out[dstPalace] = gate;
  }

  trace.push({
    rule: 'qimen.gateRotation',
    detail: `值使门=${zhiShiGate}（原${effOrigin}宫），随时支${hourBranch}移至${hourBranchPalace}宫；环序${dun === 'yang' ? '顺' : '逆'}移 ${shift} 步；中宫无门。`,
    data: { zhiShiGate, zhiShiOriginPalace: effOrigin, hourBranchPalace, shift, gateAtPalace: out },
  });

  return {
    gateAtPalace: out as Record<PalaceNumber, GateName | null>,
    zhiShiGate,
    zhiShiOriginPalace: effOrigin,
    hourBranchPalace,
  };
}
