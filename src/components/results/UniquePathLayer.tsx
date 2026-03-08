/**
 * Unique Path Layer — Main timeline with turning points, terminus, and rejected comparison
 */
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CollapseResult, CollapsedPathNode } from '@/types/destinyTree';
import { ArrowRight, Skull, Sparkles, Target } from 'lucide-react';

const DEATH_LABELS: Record<string, string> = {
  natural_aging: '自然寿终', illness: '疾病', accident: '意外',
  violence: '暴力', sudden: '突发', lifespan_limit: '寿限',
};

interface Props { collapse: CollapseResult; birthYear: number }

export function UniquePathLayer({ collapse, birthYear }: Props) {
  const events = collapse.collapsedPath.filter(n => n.age > 0);
  const turningPoints = events.filter(n =>
    n.event.intensity === 'major' || n.event.intensity === 'critical' || n.event.intensity === 'life_defining'
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 rounded-xl bg-card/40 border border-primary/20">
        <h3 className="text-sm font-serif text-primary flex items-center gap-1.5 mb-2">
          <Target className="w-4 h-4" />唯一命运路径 · {events.length} 个节点
        </h3>
        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
          <span>关键转折: <strong className="text-primary">{turningPoints.length}</strong></span>
          <span>终局: <strong className="text-rose-400">{collapse.deathAge}岁 ({DEATH_LABELS[collapse.deathCause]})</strong></span>
          <span>考虑路径: <strong className="text-primary">{collapse.totalPathsConsidered}</strong></span>
        </div>
      </div>

      {/* Turning Points */}
      {turningPoints.length > 0 && (
        <div className="p-4 rounded-xl bg-card/40 border border-amber-500/20">
          <h4 className="text-xs font-serif text-amber-300 flex items-center gap-1.5 mb-3">
            <Target className="w-3.5 h-3.5" />关键转折 ({turningPoints.length})
          </h4>
          <div className="space-y-2">
            {turningPoints.map((tp, i) => (
              <div key={i} className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-serif text-foreground">{tp.age}岁</span>
                    <span className="text-[10px] text-muted-foreground">({tp.year}年)</span>
                    <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400">{tp.event.intensity}</Badge>
                  </div>
                  {tp.engineSupports.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">{tp.engineSupports.join('·')}</span>
                  )}
                </div>
                <p className="text-xs text-foreground/80">{tp.event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full timeline */}
      <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
        <ScrollArea className="h-[500px] pr-2">
          <h4 className="text-xs font-serif text-primary mb-3 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5" />完整时间线
          </h4>
          <div className="space-y-1">
            {events.map((node, i) => (
              <div key={i} className={`flex items-start gap-3 p-2 rounded-lg border ${
                node.isDeath ? 'border-rose-500/30 bg-rose-500/5' :
                node.event.intensity === 'life_defining' || node.event.intensity === 'critical' ? 'border-amber-500/20 bg-amber-500/5' :
                'border-border/10 bg-card/20'
              }`}>
                <div className="text-center min-w-[40px]">
                  <div className="text-sm font-serif text-foreground">{node.age}<span className="text-[9px] text-muted-foreground">岁</span></div>
                  <div className="text-[9px] text-muted-foreground">{node.year}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {node.isDeath && <Skull className="w-3 h-3 text-rose-400" />}
                    <span className="text-[10px] text-foreground/80 leading-relaxed">
                      {node.event.description.length > 80 ? node.event.description.slice(0, 80) + '...' : node.event.description}
                    </span>
                  </div>
                  {node.engineSupports.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {node.engineSupports.slice(0, 4).map(e => (
                        <Badge key={e} variant="outline" className="text-[7px] px-0.5 border-primary/10 text-primary/50">{e}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Final summary */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-serif text-primary">命运总评</span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{collapse.finalLifeSummary}</p>
      </div>
    </div>
  );
}
