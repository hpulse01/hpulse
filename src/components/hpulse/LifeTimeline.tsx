import { cn } from '@/lib/utils';
import { Skull, Sparkles } from 'lucide-react';

export interface LifeTimelineNode {
  age: number;
  year?: number;
  category?: string;
  description: string;
  cumulativeProbability?: number;
  engineSupports?: string[];
  isTerminal?: boolean;
}

interface LifeTimelineProps {
  nodes: LifeTimelineNode[];
  className?: string;
}

export function LifeTimeline({ nodes, className }: LifeTimelineProps) {
  return (
    <div className={cn('relative pl-6', className)}>
      <div
        aria-hidden
        className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/15 to-destructive/40"
      />
      <ol className="space-y-3">
        {nodes.map((n, i) => (
          <li key={i} className="relative">
            <span
              className={cn(
                'absolute -left-[18px] top-2 w-2.5 h-2.5 rounded-full border',
                n.isTerminal
                  ? 'bg-destructive/60 border-destructive shadow-[0_0_12px_hsl(0_55%_40%_/_0.6)]'
                  : 'bg-primary/40 border-primary',
              )}
            />
            <div
              className={cn(
                'rounded-lg border p-3 backdrop-blur-sm',
                n.isTerminal
                  ? 'border-destructive/40 bg-destructive/[0.06]'
                  : 'border-border/30 bg-card/40 hover:border-primary/30 transition-colors',
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {n.isTerminal ? (
                    <Skull className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-primary/70" />
                  )}
                  <span className="text-xs font-mono text-foreground/85">
                    {n.age}岁{n.year ? ` · ${n.year}` : ''}
                  </span>
                  {n.category && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-border/30 text-muted-foreground/70 font-sans">
                      {n.category}
                    </span>
                  )}
                </div>
                {typeof n.cumulativeProbability === 'number' && (
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    P {Math.round(n.cumulativeProbability * 100)}%
                  </span>
                )}
              </div>
              <p className={cn(
                'text-xs leading-relaxed font-sans',
                n.isTerminal ? 'text-destructive/85' : 'text-foreground/80',
              )}>
                {n.description}
              </p>
              {n.engineSupports && n.engineSupports.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {n.engineSupports.map(e => (
                    <span
                      key={e}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-primary/[0.06] border border-primary/15 text-primary/80 font-mono"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[10px] text-muted-foreground/50 italic font-sans">
        路径不是建议,而是当前模型坍缩出的唯一预测序列。
      </p>
    </div>
  );
}

export default LifeTimeline;
