import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from './SourceGradeBadge';
import { ImplementationStatusBadge } from './ImplementationStatusBadge';
import { Layers } from 'lucide-react';

interface Props {
  engineOutputs: EngineOutput[] | undefined | null;
  className?: string;
}

function statusOf(e: EngineOutput): string {
  return (
    (e.normalizedOutput?.implementationStatus as string) ??
    (e.normalizedOutput?.p4ImplementationStatus as string) ??
    'unknown'
  );
}

/**
 * EngineAuditMatrix — desktop table / mobile card list of every engine
 * with its sourceGrade, implementationStatus, confidence, completeness,
 * timing basis, warnings and execution time.
 */
export function EngineAuditMatrix({ engineOutputs, className }: Props) {
  const list = engineOutputs ?? [];
  if (list.length === 0) {
    return (
      <div className={`rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground ${className ?? ''}`}>
        暂无引擎数据。该引擎尚未接入 P4 Core。
      </div>
    );
  }

  return (
    <section className={className}>
      <header className="flex items-center gap-2 mb-3">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-mono uppercase tracking-[0.32em] text-primary/85">
          Engine Audit Matrix · 引擎审计矩阵
        </h3>
      </header>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-primary/15 bg-card/30">
        <table className="min-w-full text-xs">
          <thead className="bg-primary/[0.04] text-[10px] uppercase tracking-[0.22em] font-mono text-muted-foreground/80">
            <tr>
              <th className="px-3 py-2 text-left">Engine</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Grade</th>
              <th className="px-3 py-2 text-right">Conf</th>
              <th className="px-3 py-2 text-right">Compl</th>
              <th className="px-3 py-2 text-right">Warn</th>
              <th className="px-3 py-2 text-right">ms</th>
              <th className="px-3 py-2 text-left">Timing</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.engineName} className="border-t border-primary/10 hover:bg-primary/[0.03]">
                <td className="px-3 py-2 font-serif">
                  <div className="flex flex-col">
                    <span className="text-foreground">{e.engineNameCN || e.engineName}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                      {e.engineName} · v{e.engineVersion}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2"><ImplementationStatusBadge status={statusOf(e)} /></td>
                <td className="px-3 py-2"><SourceGradeBadge grade={e.sourceGrade} /></td>
                <td className="px-3 py-2 text-right font-mono text-primary/90">{{formatPercent(e.confidence)}</td>
                <td className="px-3 py-2 text-right font-mono">{{formatScore(e.completenessScore)}</td>
                <td className={`px-3 py-2 text-right font-mono ${(e.warnings?.length ?? 0) > 0 ? 'text-amber-300' : 'text-muted-foreground/60'}`}>
                  {e.warnings?.length ?? 0}
                </td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground/70">{(e.computationTimeMs ?? 0).toFixed(1)}</td>
                <td className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">{e.timingBasis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden space-y-2">
        {list.map((e) => (
          <li key={e.engineName} className="rounded-lg border border-primary/15 bg-card/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-serif text-sm">{e.engineNameCN || e.engineName}</div>
                <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                  {e.engineName} · v{e.engineVersion} · {e.timingBasis}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <ImplementationStatusBadge status={statusOf(e)} />
                <SourceGradeBadge grade={e.sourceGrade} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3 text-[10px] font-mono">
              <div><div className="text-muted-foreground/60">Conf</div><div className="text-primary/90">{{formatPercent(e.confidence)}</div></div>
              <div><div className="text-muted-foreground/60">Compl</div><div>{{formatScore(e.completenessScore)}</div></div>
              <div><div className="text-muted-foreground/60">Warn</div><div className={(e.warnings?.length ?? 0) > 0 ? 'text-amber-300' : ''}>{e.warnings?.length ?? 0}</div></div>
              <div><div className="text-muted-foreground/60">ms</div><div>{(e.computationTimeMs ?? 0).toFixed(1)}</div></div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
