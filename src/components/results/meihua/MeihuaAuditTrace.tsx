import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { ExplanationTraceViewer } from '@/components/hpulse/ExplanationTraceViewer';
import { WarningCenter } from '@/components/hpulse/WarningCenter';

interface Props { engineOutput?: EngineOutput | null }

export function MeihuaAuditTrace({ engineOutput }: Props) {
  if (!engineOutput) {
    return <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">梅花 EngineOutput 不可用 / Meihua audit unavailable.</div>;
  }
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/15 bg-card/30 px-3 py-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">审计 · Audit</span>
        <ImplementationStatusBadge status={norm.implementationStatus} />
        <SourceGradeBadge grade={engineOutput.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {{formatPercent(engineOutput.confidence)} · compl {{formatScore(engineOutput.completenessScore)} · {engineOutput.computationTimeMs ?? 0}ms
        </span>
      </div>
      {engineOutput.uncertaintyNotes && engineOutput.uncertaintyNotes.length > 0 && (
        <ul className="rounded border border-amber-400/30 bg-amber-400/[0.04] p-2 text-[10px] font-mono space-y-0.5 text-amber-300/85">
          {engineOutput.uncertaintyNotes.map((s, i) => <li key={i}>· {s}</li>)}
        </ul>
      )}
      <WarningCenter engineOutputs={[engineOutput]} />
      <ExplanationTraceViewer engineOutputs={[engineOutput]} />
    </div>
  );
}
