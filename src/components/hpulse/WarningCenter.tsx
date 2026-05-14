import type { EngineOutput } from '@/types/prediction';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  engineOutputs: EngineOutput[] | undefined | null;
  className?: string;
}

interface RowItem {
  engine: string;
  kind: 'warning' | 'uncertainty' | 'failed';
  text: string;
}

/**
 * WarningCenter — surfaces every warning, uncertaintyNote and failed
 * validation flag. Never hides them. Distinguishes severity by tone.
 */
export function WarningCenter({ engineOutputs, className }: Props) {
  const rows: RowItem[] = [];
  for (const e of engineOutputs ?? []) {
    const name = e.engineNameCN || e.engineName;
    for (const w of e.warnings ?? []) rows.push({ engine: name, kind: 'warning', text: w });
    for (const u of e.uncertaintyNotes ?? []) rows.push({ engine: name, kind: 'uncertainty', text: u });
    for (const f of e.validationFlags?.failed ?? []) rows.push({ engine: name, kind: 'failed', text: f });
  }

  if (rows.length === 0) {
    return (
      <div className={`rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4 text-xs text-emerald-300/85 ${className ?? ''}`}>
        当前无警告 / No warnings reported.
      </div>
    );
  }

  return (
    <section className={className}>
      <header className="flex items-center gap-2 mb-3">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
        <h3 className="text-xs font-mono uppercase tracking-[0.32em] text-amber-300/85">
          Warnings & Uncertainty · 警告与不确定性
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">{rows.length} 条</span>
      </header>
      <ul className="space-y-1.5">
        {rows.map((r, i) => {
          const tone =
            r.kind === 'failed' ? 'border-destructive/35 bg-destructive/[0.06] text-destructive/90'
            : r.kind === 'warning' ? 'border-amber-400/30 bg-amber-400/[0.05] text-amber-200'
            : 'border-purple-400/25 bg-purple-400/[0.04] text-purple-200/90';
          return (
            <li key={i} className={`rounded-md border px-3 py-2 text-[12px] flex items-start gap-2 ${tone}`}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">
                  {r.engine} · {r.kind}
                </div>
                <div className="break-words">{r.text}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
