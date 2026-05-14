import type { EngineOutput } from '@/types/prediction';
import { AlgorithmIntegrityPanel } from '@/components/hpulse/AlgorithmIntegrityPanel';
import { EngineAuditMatrix } from '@/components/hpulse/EngineAuditMatrix';
import { ExplanationTraceViewer } from '@/components/hpulse/ExplanationTraceViewer';
import { WarningCenter } from '@/components/hpulse/WarningCenter';
import { FateVectorDashboard } from '@/components/hpulse/FateVectorDashboard';

interface Props {
  engineOutputs: EngineOutput[] | undefined | null;
}

/**
 * AuditTracePanel — composite panel that surfaces all P4 audit metadata
 * in a single result tab. Desktop renders a 2-column layout; mobile and
 * tablet stack everything.
 */
export function AuditTracePanel({ engineOutputs }: Props) {
  return (
    <div className="space-y-5">
      <AlgorithmIntegrityPanel engineOutputs={engineOutputs} />
      <FateVectorDashboard engineOutputs={engineOutputs} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EngineAuditMatrix engineOutputs={engineOutputs} />
        <WarningCenter engineOutputs={engineOutputs} />
      </div>
      <ExplanationTraceViewer engineOutputs={engineOutputs} />
    </div>
  );
}
