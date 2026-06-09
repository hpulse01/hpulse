import { useMemo } from 'react';
import type { EngineOutput, FateVector } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import { Sparkles } from 'lucide-react';

interface Props {
  engineOutputs: EngineOutput[] | undefined | null;
  className?: string;
}

/**
 * FateVectorDashboard — fuses every engine's FateVector by capped-confidence
 * weighted average and shows the 10-dimension result as semantic bars.
 * No mock — empty input shows an explicit empty state.
 */
export function FateVectorDashboard({ engineOutputs, className }: Props) {
  const fused = useMemo<FateVector | null>(() => {
    const list = engineOutputs ?? [];
    if (list.length === 0) return null;
    const acc: Record<string, number> = {};
    let totalW = 0;
    for (const e of list) {
      const w = Math.max(0.01, typeof e.confidence === 'number' ? e.confidence : 0.3);
      totalW += w;
      const fv = e.fateVector;
      if (!fv) continue;
      for (const d of ALL_FATE_DIMENSIONS) {
        const v = fv[d];
        if (typeof v === 'number') acc[d] = (acc[d] ?? 0) + v * w;
      }
    }
    if (totalW === 0) return null;
    const out = {} as FateVector;
    for (const d of ALL_FATE_DIMENSIONS) {
      out[d] = Math.max(0, Math.min(100, (acc[d] ?? 0) / totalW));
    }
    return out;
  }, [engineOutputs]);

  if (!fused) {
    return (
      <div className={`rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground ${className ?? ''}`}>
        暂无 FateVector 数据。
      </div>
    );
  }

  return (
    <section className={className}>
      <header className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-mono uppercase tracking-[0.32em] text-primary/85">
          Fate Vector · 命运向量（融合）
        </h3>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_FATE_DIMENSIONS.map(d => {
          const v = fused[d];
          const tone = v >= 70 ? 'bg-emerald-400/70' : v >= 50 ? 'bg-primary/70' : v >= 30 ? 'bg-amber-400/70' : 'bg-destructive/60';
          return (
            <div key={d} className="rounded-md border border-primary/15 bg-card/30 px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-serif">{FATE_DIMENSION_LABELS[d]}</span>
                <span className="text-[11px] font-mono text-primary/85">{v.toFixed(1)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div className={`h-full ${tone}`} style={{ width: `${v}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] font-mono text-muted-foreground/65">
        权重：confidence 加权平均 · 不引入随机 · 缺维度自动留空
      </p>
    </section>
  );
}
