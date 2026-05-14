import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { ExplanationTraceViewer } from '@/components/hpulse/ExplanationTraceViewer';
import { AlertTriangle, Info } from 'lucide-react';

interface HeaderProps {
  engineOutput: EngineOutput;
  fallbackName?: string;
  extraTags?: React.ReactNode;
}

/** Shared header with status badges, version, confidence, completeness. */
export function EnginePanelHeader({ engineOutput, fallbackName, extraTags }: HeaderProps) {
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  return (
    <header className="flex flex-wrap items-center gap-2">
      <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">
        {engineOutput.engineNameCN ?? fallbackName ?? engineOutput.engineName}
      </h3>
      <span className="text-[10px] font-mono text-muted-foreground/70">v{engineOutput.engineVersion}</span>
      <ImplementationStatusBadge status={norm.implementationStatus} />
      <SourceGradeBadge grade={engineOutput.sourceGrade} />
      {extraTags}
      <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
        conf {formatPercent(engineOutput.confidence)} · compl{' '}
        {formatScore(engineOutput.completenessScore)} · {engineOutput.computationTimeMs ?? 0}ms
      </span>
    </header>
  );
}

interface MissingProps {
  message?: string;
}
export function EngineMissingNotice({ message }: MissingProps) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground flex items-start gap-2">
      <Info className="w-3.5 h-3.5 text-primary/70 mt-0.5 shrink-0" />
      <span>{message ?? '该引擎尚未输出 / Engine has produced no structured output yet.'}</span>
    </div>
  );
}

interface WarningStripProps {
  warnings?: string[];
  uncertainty?: string[];
}
export function EngineWarningStrip({ warnings, uncertainty }: WarningStripProps) {
  const all = [...(warnings ?? []), ...(uncertainty ?? [])];
  if (all.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.04] p-3 text-[11px] text-amber-200/85 space-y-1">
      <div className="flex items-center gap-1.5 text-amber-300/90">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span className="font-mono uppercase tracking-[0.2em]">Warnings · {all.length}</span>
      </div>
      <ul className="space-y-0.5 list-disc list-inside font-mono">
        {all.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}
        {all.length > 8 && <li className="text-amber-200/55">… +{all.length - 8} more</li>}
      </ul>
    </div>
  );
}

interface AuditProps {
  engineOutput: EngineOutput;
}
export function EngineAuditTrace({ engineOutput }: AuditProps) {
  return (
    <div className="space-y-3">
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
      <ExplanationTraceViewer engineOutputs={[engineOutput]} />
      {engineOutput.validationFlags && (
        <div className="rounded-lg border border-primary/15 bg-card/30 p-3 text-[11px] font-mono space-y-1">
          {engineOutput.validationFlags.passed?.length > 0 && (
            <div className="text-emerald-300/80">✓ passed: {engineOutput.validationFlags.passed.join(', ')}</div>
          )}
          {engineOutput.validationFlags.failed?.length > 0 && (
            <div className="text-rose-300/80">✗ failed: {engineOutput.validationFlags.failed.join(', ')}</div>
          )}
          {engineOutput.validationFlags.warnings?.length > 0 && (
            <div className="text-amber-200/80">⚠ {engineOutput.validationFlags.warnings.join(', ')}</div>
          )}
        </div>
      )}
    </div>
  );
}

interface KVProps { label: string; value?: string | number | null; mono?: boolean }
export function KVRow({ label, value, mono }: KVProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-primary/5 last:border-0">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono">{label}</span>
      <span className={`text-xs ${mono ? 'font-mono' : ''} text-foreground/90 truncate`}>
        {value === undefined || value === null || value === '' ? <span className="text-muted-foreground/40">—</span> : value}
      </span>
    </div>
  );
}
