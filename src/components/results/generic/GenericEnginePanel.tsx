import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { asText, formatPercent, formatScore } from '@/utils/displayFormat';

interface Props {
  engineOutput?: EngineOutput | null;
  title?: string;
}

/**
 * GenericEnginePanel — fallback view for any EngineOutput.
 * Used when a specialized engine UI is not yet built; guarantees
 * structured normalizedOutput, fateVector, timeWindows, eventCandidates,
 * warnings and explanationTrace are visible to the user instead of a blank tab.
 */
export function GenericEnginePanel({ engineOutput, title }: Props) {
  if (!engineOutput) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        {title ?? '该引擎'}尚未产出输出 / Engine output not available.
      </div>
    );
  }
  const eo = engineOutput;
  const n = eo.normalizedOutput ?? {};
  const status = asText(n.implementationStatus) || asText(n.p4ImplementationStatus);

  const entries = Object.entries(n)
    .filter(([k]) => k !== 'legacyNormalizedOutput' && k !== 'coreNormalizedOutput')
    .map(([k, v]) => {
      let display = '';
      if (v == null) display = '—';
      else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') display = String(v);
      else if (Array.isArray(v)) display = `[array · ${v.length}]`;
      else if (typeof v === 'object') display = '{…}';
      return [k, display] as const;
    });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">
          {title ?? eo.engineNameCN ?? eo.engineName}
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{eo.engineVersion}</span>
        <ImplementationStatusBadge status={status || undefined} />
        <SourceGradeBadge grade={eo.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {formatPercent(eo.confidence)} · compl {formatScore(eo.completenessScore)}
        </span>
      </header>

      {/* FateVector */}
      <Section title="FateVector">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {Object.entries(eo.fateVector ?? {}).map(([k, v]) => (
            <div key={k} className="rounded border border-primary/15 bg-card/30 px-2 py-1.5 text-center">
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">{k}</div>
              <div className="text-xs font-mono text-primary/90 tabular-nums">{Number(v).toFixed(0)}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* normalizedOutput */}
      {entries.length > 0 && (
        <Section title="normalizedOutput">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {entries.slice(0, 24).map(([k, v]) => (
              <div key={k} className="rounded border border-primary/10 bg-card/25 px-2.5 py-1.5">
                <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{k}</div>
                <div className="text-[11px] font-mono text-foreground/85 truncate" title={v}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* timeWindows */}
      {eo.timeWindows && eo.timeWindows.length > 0 && (
        <Section title={`timeWindows (${eo.timeWindows.length})`}>
          <div className="overflow-x-auto -mx-1 px-1">
            <ol className="inline-flex gap-2 min-w-full">
              {eo.timeWindows.slice(0, 16).map((w, i) => (
                <li key={i} className="shrink-0 rounded border border-primary/15 bg-card/30 px-2.5 py-1.5 min-w-[120px]">
                  <div className="text-[9px] font-mono text-muted-foreground/70">{w.dimension} · {w.startAge}–{w.endAge}</div>
                  <div className="text-[11px] text-foreground/85 truncate">{w.evidence}</div>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      )}

      {/* eventCandidates */}
      {eo.eventCandidates && eo.eventCandidates.length > 0 && (
        <Section title={`eventCandidates (${eo.eventCandidates.length})`}>
          <ul className="space-y-0.5 text-[11px] font-mono text-foreground/80 max-h-48 overflow-y-auto">
            {eo.eventCandidates.slice(0, 60).map((e, i) => <li key={i}>· {e}</li>)}
          </ul>
        </Section>
      )}

      {/* warnings */}
      {eo.warnings && eo.warnings.length > 0 && (
        <details className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2" open>
          <summary className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/85 cursor-pointer">⚠ warnings ({eo.warnings.length})</summary>
          <ul className="mt-2 space-y-1 text-[11px] text-amber-100/85">
            {eo.warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </details>
      )}

      {/* uncertaintyNotes */}
      {eo.uncertaintyNotes && eo.uncertaintyNotes.length > 0 && (
        <details className="rounded-md border border-sky-500/25 bg-sky-500/5 px-3 py-2">
          <summary className="text-[10px] font-mono uppercase tracking-[0.28em] text-sky-300/85 cursor-pointer">uncertainty notes ({eo.uncertaintyNotes.length})</summary>
          <ul className="mt-2 space-y-1 text-[11px] text-sky-100/85">
            {eo.uncertaintyNotes.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </details>
      )}

      {/* explanationTrace */}
      {eo.explanationTrace && eo.explanationTrace.length > 0 && (
        <details className="rounded-md border border-primary/15 bg-card/30 px-3 py-2">
          <summary className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 cursor-pointer">explanation trace ({eo.explanationTrace.length})</summary>
          <ol className="mt-2 space-y-1 text-[11px] text-foreground/80 list-decimal list-inside max-h-64 overflow-y-auto">
            {eo.explanationTrace.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </details>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">{title}</div>
      {children}
    </div>
  );
}
