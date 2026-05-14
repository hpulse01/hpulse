import { useState, useMemo } from 'react';
import type { EngineOutput } from '@/types/prediction';
import { ChevronDown, ChevronRight, Copy, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Props {
  engineOutputs: EngineOutput[] | undefined | null;
  className?: string;
}

/**
 * ExplanationTraceViewer — terminal-style folded viewer for every engine's
 * explanationTrace. One engine expanded at a time. Mobile-friendly.
 */
export function ExplanationTraceViewer({ engineOutputs, className }: Props) {
  const list = useMemo(() => (engineOutputs ?? []).filter(e => Array.isArray(e.explanationTrace)), [engineOutputs]);
  const [openId, setOpenId] = useState<string | null>(null);
  const { toast } = useToast();

  if (list.length === 0) {
    return (
      <div className={`rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground ${className ?? ''}`}>
        暂无解释链 / No explanation trace yet.
      </div>
    );
  }

  return (
    <section className={className}>
      <header className="flex items-center gap-2 mb-3">
        <Terminal className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-mono uppercase tracking-[0.32em] text-primary/85">
          Explanation Trace · 解释链
        </h3>
      </header>
      <ul className="space-y-2">
        {list.map((e) => {
          const open = openId === e.engineName;
          const trace = e.explanationTrace ?? [];
          return (
            <li key={e.engineName} className="rounded-lg border border-primary/15 bg-card/30">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : e.engineName)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-primary/[0.04] rounded-lg"
              >
                <span className="flex items-center gap-2 min-w-0">
                  {open ? <ChevronDown className="w-3.5 h-3.5 text-primary/80 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />}
                  <span className="font-serif text-sm truncate">{e.engineNameCN || e.engineName}</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">{trace.length} steps</span>
              </button>
              {open && (
                <div className="border-t border-primary/10 px-3 py-3 bg-background/40">
                  <div className="flex justify-end mb-2">
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-6 text-[10px] font-mono"
                      onClick={() => {
                        navigator.clipboard?.writeText(trace.join('\n'));
                        toast({ title: 'Trace copied', description: `${trace.length} steps · ${e.engineName}` });
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <ol className="font-mono text-[11px] space-y-1 max-h-80 overflow-y-auto">
                    {trace.map((step, i) => (
                      <li key={i} className="flex gap-2 text-foreground/85 break-words">
                        <span className="text-primary/60 shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                        <span className="whitespace-pre-wrap">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
