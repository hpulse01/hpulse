import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { ExplanationTraceViewer } from '@/components/hpulse/ExplanationTraceViewer';
import { WarningCenter } from '@/components/hpulse/WarningCenter';

interface Props {
  engineOutput?: EngineOutput | null;
}

/** TiebanAuditTrace — reuses shared audit components for tieban EngineOutput. */
export function TiebanAuditTrace({ engineOutput }: Props) {
  if (!engineOutput) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        铁板神数 EngineOutput 不可用 / Tieban audit metadata unavailable.
      </div>
    );
  }
  const { confidence, completenessScore, sourceGrade, normalizedOutput, validationFlags } = engineOutput;
  const status = (normalizedOutput as Record<string, string> | undefined)?.implementationStatus;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/15 bg-card/30 px-3 py-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">审计 · Audit</span>
        <ImplementationStatusBadge status={status} />
        <SourceGradeBadge grade={sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {formatPercent(confidence)} · compl {formatScore(completenessScore)}
        </span>
      </div>
      {validationFlags && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono">
          <FlagBlock label="passed" items={validationFlags.passed} cls="text-emerald-300/85 border-emerald-400/30" />
          <FlagBlock label="warnings" items={validationFlags.warnings} cls="text-amber-300/85 border-amber-400/30" />
          <FlagBlock label="failed" items={validationFlags.failed} cls="text-destructive/85 border-destructive/35" />
        </div>
      )}
      <WarningCenter engineOutputs={[engineOutput]} />
      <ExplanationTraceViewer engineOutputs={[engineOutput]} />
    </div>
  );
}

function FlagBlock({ label, items, cls }: { label: string; items: string[]; cls: string }) {
  return (
    <div className={`rounded-md border bg-card/20 px-2.5 py-2 ${cls}`}>
      <div className="uppercase tracking-[0.22em] opacity-75">{label} · {items?.length ?? 0}</div>
      <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto scrollbar-thin">
        {(items ?? []).map((s, i) => <li key={i} className="leading-snug truncate" title={s}>{s}</li>)}
        {(!items || items.length === 0) && <li className="opacity-50">—</li>}
      </ul>
    </div>
  );
}
