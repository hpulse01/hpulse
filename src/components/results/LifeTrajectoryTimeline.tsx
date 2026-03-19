/**
 * LifeTrajectoryTimeline — Full life trajectory visualization with
 * age-based timeline, event markers, fate vector curves, and phase bands.
 */
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CollapseResult, CollapsedPathNode } from '@/types/destinyTree';
import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { useI18n } from '@/hooks/useI18n';
import { ChevronDown, ChevronUp, Sparkles, Activity, Clock } from 'lucide-react';

const PHASE_COLORS = [
  'bg-sky-500/8', 'bg-emerald-500/8', 'bg-amber-500/8',
  'bg-rose-500/8', 'bg-purple-500/8', 'bg-indigo-500/8',
  'bg-teal-500/8', 'bg-orange-500/8', 'bg-pink-500/8',
];

const PHASE_BORDERS = [
  'border-sky-500/15', 'border-emerald-500/15', 'border-amber-500/15',
  'border-rose-500/15', 'border-purple-500/15', 'border-indigo-500/15',
  'border-teal-500/15', 'border-orange-500/15', 'border-pink-500/15',
];

const INTENSITY_STYLES: Record<string, string> = {
  minor: 'border-border/15 bg-card/10',
  moderate: 'border-blue-500/15 bg-blue-500/5',
  major: 'border-amber-500/20 bg-amber-500/5',
  critical: 'border-orange-500/25 bg-orange-500/8',
  life_defining: 'border-primary/30 bg-primary/10',
};

const INTENSITY_DOT: Record<string, string> = {
  minor: 'bg-muted-foreground/30',
  moderate: 'bg-blue-400',
  major: 'bg-amber-400',
  critical: 'bg-orange-400',
  life_defining: 'bg-primary',
};

interface LifePhase {
  name: string;
  nameCN: string;
  range: [number, number];
}

const PHASES: LifePhase[] = [
  { name: 'Infancy', nameCN: '婴幼', range: [0, 5] },
  { name: 'Childhood', nameCN: '童年', range: [6, 12] },
  { name: 'Adolescence', nameCN: '少年', range: [13, 17] },
  { name: 'Youth', nameCN: '青年', range: [18, 29] },
  { name: 'Prime', nameCN: '壮年', range: [30, 44] },
  { name: 'Midlife', nameCN: '中年', range: [45, 59] },
  { name: 'Senior', nameCN: '壮暮', range: [60, 74] },
  { name: 'Elderly', nameCN: '晚年', range: [75, 89] },
  { name: 'Longevity', nameCN: '长寿', range: [90, 120] },
];

interface Props {
  collapse: CollapseResult;
  birthYear: number;
}

export function LifeTrajectoryTimeline({ collapse, birthYear }: Props) {
  const { t, dimLabel, lang } = useI18n();
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [selectedDims, setSelectedDims] = useState<FateDimension[]>(['life', 'wealth', 'health']);

  const events = collapse.collapsedPath;
  const maxAge = collapse.deathAge;

  // Group events by life phase
  const phaseGroups = useMemo(() => {
    return PHASES.map(phase => ({
      ...phase,
      events: events.filter(e => e.age >= phase.range[0] && e.age <= phase.range[1] && e.age <= maxAge),
    })).filter(pg => pg.range[0] <= maxAge);
  }, [events, maxAge]);

  // Aggregate fate vector per decade for mini sparkline
  const decadeSummary = useMemo(() => {
    const decades: { age: number; fv: FateVector }[] = [];
    for (let age = 0; age <= maxAge; age += 10) {
      const closest = events.reduce((best, e) =>
        Math.abs(e.age - age) < Math.abs(best.age - age) ? e : best, events[0]);
      if (closest) decades.push({ age, fv: closest.fateVector });
    }
    return decades;
  }, [events, maxAge]);

  const toggleDim = (dim: FateDimension) => {
    setSelectedDims(prev =>
      prev.includes(dim) ? prev.filter(d => d !== dim) : [...prev, dim]
    );
  };

  const DIM_COLORS: Record<FateDimension, string> = {
    life: '#f59e0b', wealth: '#10b981', relation: '#f43f5e',
    health: '#a855f7', wisdom: '#3b82f6', spirit: '#6366f1',
    socialStatus: '#eab308', creativity: '#ec4899', luck: '#84cc16', homeStability: '#14b8a6',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-elevated rounded-2xl p-5">
        <h3 className="text-sm font-serif text-foreground flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          {lang === 'zh' ? '完整生命轨迹' : 'Complete Life Trajectory'}
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground/50 font-sans">
          <span>{lang === 'zh' ? '寿数' : 'Lifespan'} <strong className="text-accent">{maxAge}{lang === 'zh' ? '岁' : ' yrs'}</strong></span>
          <span>{lang === 'zh' ? '事件' : 'Events'} <strong className="text-foreground/70">{events.length}</strong></span>
          <span>{lang === 'zh' ? '阶段' : 'Phases'} <strong className="text-foreground/70">{phaseGroups.length}</strong></span>
          <span>{lang === 'zh' ? '置信度' : 'Confidence'} <strong className="text-primary">{Math.round(collapse.collapseConfidence * 100)}%</strong></span>
        </div>
      </div>

      {/* Dimension filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_FATE_DIMENSIONS.map(dim => (
          <button key={dim} onClick={() => toggleDim(dim)}
            className={`text-[10px] px-2.5 py-1 rounded-full border font-sans transition-all ${
              selectedDims.includes(dim)
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/20 text-muted-foreground/40 hover:border-border/40'
            }`}>
            {dimLabel(dim)}
          </button>
        ))}
      </div>

      {/* Decade sparkline overview */}
      {decadeSummary.length > 1 && (
        <div className="glass rounded-2xl p-4">
          <div className="text-[10px] text-muted-foreground/40 font-sans mb-3">
            {lang === 'zh' ? '十年跨度命运曲线' : 'Decade Fate Curves'}
          </div>
          <svg width="100%" height={80} viewBox={`0 0 ${decadeSummary.length * 60} 80`} className="overflow-visible">
            {selectedDims.map(dim => {
              const pts = decadeSummary.map((d, i) => ({
                x: i * 60 + 30,
                y: 75 - (d.fv[dim] / 100) * 70,
              }));
              const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
              return (
                <path key={dim} d={path} fill="none" stroke={DIM_COLORS[dim]} strokeWidth={1.5} strokeOpacity={0.7} />
              );
            })}
            {decadeSummary.map((d, i) => (
              <text key={i} x={i * 60 + 30} y={78} textAnchor="middle" fontSize={8}
                className="fill-current text-muted-foreground/30">{d.age}</text>
            ))}
          </svg>
        </div>
      )}

      {/* Phase-by-phase timeline */}
      <ScrollArea className="h-[550px]">
        <div className="space-y-2 pr-3">
          {phaseGroups.map((pg, pi) => {
            const isExpanded = expandedPhase === pi;
            const majorEvents = pg.events.filter(e =>
              e.event.intensity === 'major' || e.event.intensity === 'critical' || e.event.intensity === 'life_defining'
            );
            const hasEvents = pg.events.length > 0;

            return (
              <div key={pi} className={`rounded-xl border ${PHASE_BORDERS[pi % PHASE_BORDERS.length]} ${PHASE_COLORS[pi % PHASE_COLORS.length]} overflow-hidden`}>
                <button onClick={() => setExpandedPhase(isExpanded ? null : pi)}
                  className="w-full p-3.5 text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground/30" /> : <ChevronDown className="w-3 h-3 text-muted-foreground/30" />}
                      <span className="text-sm font-serif text-foreground/80">{lang === 'zh' ? pg.nameCN : pg.name}</span>
                      <span className="text-[10px] text-muted-foreground/30 font-sans">{pg.range[0]}-{Math.min(pg.range[1], maxAge)}{lang === 'zh' ? '岁' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {majorEvents.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/70 border border-amber-500/15 font-sans">
                          {majorEvents.length} {lang === 'zh' ? '重大' : 'major'}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/30 font-sans">{pg.events.length}</span>
                    </div>
                  </div>

                  {/* Mini summary when collapsed */}
                  {!isExpanded && hasEvents && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {pg.events.slice(0, 3).map((e, i) => (
                        <span key={i} className="text-[9px] text-muted-foreground/40 font-sans">
                          {e.age}{lang === 'zh' ? '岁' : ''}: {e.event.description.slice(0, 20)}…
                        </span>
                      ))}
                      {pg.events.length > 3 && (
                        <span className="text-[9px] text-muted-foreground/25 font-sans">+{pg.events.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>

                {/* Expanded event list */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 space-y-1.5 border-t border-border/5 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {pg.events.map((node, ei) => (
                      <div key={ei} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                        node.isDeath ? 'border-destructive/20 bg-destructive/5' :
                        INTENSITY_STYLES[node.event.intensity] || INTENSITY_STYLES.minor
                      }`}>
                        {/* Age column */}
                        <div className="text-center min-w-[40px] pt-0.5">
                          <div className="text-sm font-serif text-foreground/70">{node.age}</div>
                          <div className="text-[8px] text-muted-foreground/25 font-sans">{node.year}</div>
                          <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${INTENSITY_DOT[node.event.intensity] || INTENSITY_DOT.minor}`} />
                        </div>

                        {/* Event detail */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full border border-border/10 text-muted-foreground/40 font-sans">
                              {node.event.category}
                            </span>
                            <span className="text-[8px] text-muted-foreground/25 font-sans">
                              {node.event.intensity}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground/60 font-sans leading-relaxed">
                            {node.event.description}
                          </p>

                          {/* Fate impact mini bars */}
                          {Object.keys(node.event.fateImpact).length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {(Object.entries(node.event.fateImpact) as [FateDimension, number][])
                                .filter(([, v]) => Math.abs(v) > 3)
                                .slice(0, 5)
                                .map(([dim, v]) => (
                                  <span key={dim} className={`text-[8px] px-1 py-0.5 rounded font-sans ${
                                    v > 0 ? 'bg-emerald-500/10 text-emerald-400/70' : 'bg-rose-500/10 text-rose-400/70'
                                  }`}>
                                    {dimLabel(dim)} {v > 0 ? '+' : ''}{v}
                                  </span>
                                ))}
                            </div>
                          )}

                          {/* Engine supports */}
                          {node.engineSupports.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {node.engineSupports.slice(0, 4).map(e => (
                                <span key={e} className="text-[7px] px-1 py-0.5 rounded-full border border-border/8 text-muted-foreground/25 font-sans">{e}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {pg.events.length === 0 && (
                      <div className="text-center py-4 text-[10px] text-muted-foreground/25 font-sans">
                        {lang === 'zh' ? '此阶段无显著事件' : 'No significant events in this phase'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Life summary */}
      <div className="glass rounded-2xl p-5 border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary/50" />
          <span className="text-sm font-serif text-foreground/80">{lang === 'zh' ? '生命轨迹总评' : 'Life Trajectory Summary'}</span>
        </div>
        <p className="text-xs text-foreground/50 leading-relaxed font-sans">{collapse.finalLifeSummary}</p>
      </div>
    </div>
  );
}
