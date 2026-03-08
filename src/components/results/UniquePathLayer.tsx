/**
 * Unique Path Layer — Final timeline, turning points, terminus
 */
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CollapseResult } from '@/types/destinyTree';
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
    <div className="space-y-5">
      {/* Summary */}
      <div className="glass-elevated rounded-2xl p-5">
        <h3 className="text-sm font-serif text-foreground flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />唯一命运路径
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground/50 font-sans">
          <span>节点 <strong className="text-foreground/70">{events.length}</strong></span>
          <span>转折 <strong className="text-primary">{turningPoints.length}</strong></span>
          <span>终局 <strong className="text-accent">{collapse.deathAge}岁 ({DEATH_LABELS[collapse.deathCause]})</strong></span>
          <span>路径 <strong className="text-foreground/70">{collapse.totalPathsConsidered}</strong></span>
        </div>
      </div>

      {/* Turning Points */}
      {turningPoints.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h4 className="text-xs font-sans text-amber-400/70 flex items-center gap-2 mb-4">
            <Target className="w-3.5 h-3.5" />关键转折
          </h4>
          <div className="space-y-2.5">
            {turningPoints.map((tp, i) => (
              <div key={i} className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-500/3 hover:bg-amber-500/5 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-serif text-foreground">{tp.age}岁</span>
                    <span className="text-[10px] text-muted-foreground/30 font-sans">{tp.year}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-amber-500/15 text-amber-400/60 font-sans">{tp.event.intensity}</span>
                  </div>
                  {tp.engineSupports.length > 0 && (
                    <span className="text-[9px] text-muted-foreground/30 font-sans">{tp.engineSupports.join(' · ')}</span>
                  )}
                </div>
                <p className="text-[11px] text-foreground/60 font-sans leading-relaxed">{tp.event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Timeline */}
      <div className="glass-elevated rounded-2xl p-5">
        <ScrollArea className="h-[450px]">
          <h4 className="text-xs font-sans text-foreground/50 mb-4 flex items-center gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-primary/40" />完整时间线
          </h4>
          <div className="space-y-1">
            {events.map((node, i) => (
              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
                node.isDeath ? 'border-destructive/15 bg-destructive/3' :
                node.event.intensity === 'life_defining' || node.event.intensity === 'critical' ? 'border-amber-500/10 bg-amber-500/3' :
                'border-transparent hover:border-border/10 hover:bg-card/20'
              }`}>
                <div className="text-center min-w-[36px] pt-0.5">
                  <div className="text-sm font-serif text-foreground/70">{node.age}</div>
                  <div className="text-[8px] text-muted-foreground/30 font-sans">{node.year}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {node.isDeath && <Skull className="w-3 h-3 text-destructive/50" />}
                    <span className="text-[11px] text-foreground/50 leading-relaxed font-sans">
                      {node.event.description.length > 80 ? node.event.description.slice(0, 80) + '…' : node.event.description}
                    </span>
                  </div>
                  {node.engineSupports.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {node.engineSupports.slice(0, 4).map(e => (
                        <span key={e} className="text-[7px] px-1 py-0.5 rounded-full border border-border/8 text-muted-foreground/30 font-sans">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Summary */}
      <div className="glass rounded-2xl p-5 border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary/50" />
          <span className="text-sm font-serif text-foreground/80">命运总评</span>
        </div>
        <p className="text-xs text-foreground/50 leading-relaxed font-sans">{collapse.finalLifeSummary}</p>
      </div>
    </div>
  );
}
