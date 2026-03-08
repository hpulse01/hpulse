/**
 * Unified Quantum Panel
 * Combines quantum state visualization, waveform, and entanglement
 * from the old QuantumPrediction page into a reusable tab panel.
 */

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/useI18n';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuantumRadar } from '@/components/quantum/QuantumRadar';
import { QuantumWaveform } from '@/components/quantum/QuantumWaveform';
import { QuantumCoherencePanel } from '@/components/quantum/QuantumCoherencePanel';
import { QuantumEntanglementMap } from '@/components/quantum/QuantumEntanglementMap';
import {
  QuantumPredictionEngine,
  type QuantumPredictionResult,
  type LifeAspect,
  type CollapsedEvent,
  type DestinyPhase,
} from '@/utils/quantumPredictionEngine';
import {
  Sparkles, TrendingUp, TrendingDown, Minus, Waves, Network, BarChart3, BookOpen,
  Briefcase, Coins, Heart, Activity, Brain, Users,
  Palette, Star, Home, Compass, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Constants ───

const ASPECT_ICONS: Record<LifeAspect, typeof Star> = {
  career: Briefcase, wealth: Coins, love: Heart, health: Activity,
  wisdom: Brain, social: Users, creativity: Palette, fortune: Star,
  family: Home, spirituality: Compass,
};

const ASPECT_COLORS: Record<LifeAspect, string> = {
  career: 'text-amber-400', wealth: 'text-emerald-400', love: 'text-rose-400',
  health: 'text-purple-400', wisdom: 'text-blue-400', social: 'text-cyan-400',
  creativity: 'text-pink-400', fortune: 'text-yellow-400',
  family: 'text-orange-400', spirituality: 'text-indigo-400',
};

const TREND_ICONS = { rising: TrendingUp, stable: Minus, declining: TrendingDown };
const TREND_COLORS = { rising: 'text-emerald-400', stable: 'text-slate-400', declining: 'text-rose-400' };

const EVENT_TYPE_COLORS: Record<string, string> = {
  milestone: 'border-amber-500/40 bg-amber-500/10',
  opportunity: 'border-emerald-500/40 bg-emerald-500/10',
  challenge: 'border-rose-500/40 bg-rose-500/10',
  transformation: 'border-violet-500/40 bg-violet-500/10',
  relationship: 'border-pink-500/40 bg-pink-500/10',
  achievement: 'border-yellow-500/40 bg-yellow-500/10',
  loss: 'border-red-500/40 bg-red-500/10',
  growth: 'border-teal-500/40 bg-teal-500/10',
  turning_point: 'border-fuchsia-500/40 bg-fuchsia-500/10',
};

// ─── Sub-components ───

function EventCard({ event, currentAge }: { event: CollapsedEvent; currentAge: number }) {
  const { lang } = useI18n();
  const isCurrent = event.age === currentAge;
  const isPast = event.age < currentAge;
  const typeCN = QuantumPredictionEngine.getEventTypeCN(event.eventType);
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || 'border-border/30 bg-card/30';

  return (
    <div className={`p-3 rounded-lg border transition-all ${isCurrent ? 'ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10 ' : ''} ${isPast ? 'opacity-60 ' : ''} ${typeColor}`}>
      <div className="flex items-start gap-3">
        <div className="text-center min-w-[48px]">
          <div className={`text-lg font-serif ${isCurrent ? 'text-violet-300' : 'text-foreground'}`}>{event.age}<span className="text-[10px] text-muted-foreground">{lang === 'zh' ? '岁' : ''}</span></div>
          <div className="text-[10px] text-muted-foreground">{event.year}</div>
          <div className="text-[10px] text-violet-300/60">{event.ganZhi}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-sm font-serif text-foreground">{event.title}</span>
            <span className="text-[9px] px-1 py-0 border border-violet-500/30 text-violet-300 rounded">{typeCN}</span>
            {event.convergence > 0.4 && <span className="text-[9px] px-1 py-0 border border-fuchsia-500/30 text-fuchsia-300 rounded">{event.systemVotes.length}{lang === 'zh' ? '系共振' : ' resonance'}</span>}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-secondary/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all" style={{ width: `${event.energyLevel}%` }} />
            </div>
            <span className="text-[10px] font-mono text-violet-300">{event.energyLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseSection({ phase, currentAge }: { phase: DestinyPhase; currentAge: number }) {
  const [expanded, setExpanded] = useState(phase.events.some(e => e.age === currentAge) || phase.startAge <= 12);
  const { lang } = useI18n();
  const significantEvents = phase.events.filter(e => e.convergence > 0.3 || e.eventType === 'turning_point' || e.eventType === 'milestone');
  const displayEvents = expanded ? phase.events : significantEvents.slice(0, 3);

  return (
    <div className="border border-violet-500/20 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 bg-violet-500/5 hover:bg-violet-500/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <span className="text-lg font-serif text-violet-300">{phase.element}</span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-serif text-violet-200">{phase.name} · {phase.theme}</h4>
            <p className="text-[10px] text-muted-foreground">{phase.startAge}-{phase.endAge}{lang === 'zh' ? '岁' : ''} · {lang === 'zh' ? '能量' : 'Energy'} {phase.overallEnergy}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${phase.overallEnergy}%` }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {displayEvents.length > 0 && (
        <div className="p-3 space-y-2">
          {displayEvents.map(e => <EventCard key={e.age} event={e} currentAge={currentAge} />)}
          {!expanded && phase.events.length > displayEvents.length && (
            <button onClick={() => setExpanded(true)} className="w-full text-center text-xs text-violet-400 hover:text-violet-300 py-2 transition-colors">
              {lang === 'zh' ? `展开全部 ${phase.events.length} 个事件` : `Expand all ${phase.events.length} events`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───

interface UnifiedQuantumPanelProps {
  result: QuantumPredictionResult;
  birthYear: number;
}

export function UnifiedQuantumPanel({ result, birthYear }: UnifiedQuantumPanelProps) {
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const { t, lang } = useI18n();
  const currentAge = useMemo(() => new Date().getFullYear() - birthYear, [birthYear]);
  const sortedStates = useMemo(() => [...result.states].sort((a, b) => b.probability - a.probability), [result]);

  const waveformTimeline = useMemo(() => {
    return result.destinyTimeline.map(e => ({
      age: e.age,
      year: e.year,
      energy: e.energyLevel,
      element: e.element,
      phase: '',
      ganZhi: e.ganZhi,
      isCurrentAge: e.age === currentAge,
    }));
  }, [result, currentAge]);

  return (
    <div className="space-y-5">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-violet-950/30 border border-violet-500/20 h-auto">
          <TabsTrigger value="timeline" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            <BookOpen className="w-3 h-3 mr-1 hidden sm:inline" />{t('quantum.omniscience')}
          </TabsTrigger>
          <TabsTrigger value="states" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            <BarChart3 className="w-3 h-3 mr-1 hidden sm:inline" />{t('quantum.states')}
          </TabsTrigger>
          <TabsTrigger value="waveform" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            <Waves className="w-3 h-3 mr-1 hidden sm:inline" />{t('quantum.waveform')}
          </TabsTrigger>
          <TabsTrigger value="entangle" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            <Network className="w-3 h-3 mr-1 hidden sm:inline" />{t('quantum.entangle')}
          </TabsTrigger>
        </TabsList>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-5 space-y-4">
          <ScrollArea className="h-[600px] pr-2">
            <div className="space-y-4">
              {result.destinyPhases.map((phase, i) => (
                <PhaseSection key={i} phase={phase} currentAge={currentAge} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Quantum States */}
        <TabsContent value="states" className="mt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 flex flex-col items-center">
              <h3 className="text-sm font-serif text-violet-300 mb-3"><Sparkles className="w-4 h-4 inline mr-1" />{t('quantum.ten_dim_field')}</h3>
              <QuantumRadar states={result.states} size={300} />
            </div>
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
              <h3 className="text-sm font-serif text-violet-300 mb-3">{t('quantum.ten_dim_states')}</h3>
              <div className="space-y-2">
                {sortedStates.map(state => {
                  const Icon = ASPECT_ICONS[state.aspect];
                  const TrendIcon = TREND_ICONS[state.trend];
                  const probColor = state.probability >= 70 ? 'text-emerald-400' : state.probability >= 45 ? 'text-amber-300' : 'text-rose-400';
                  return (
                    <button key={state.aspect} onClick={() => setSelectedAspect(selectedAspect === state.aspect ? null : state.aspect)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-all ${selectedAspect === state.aspect ? 'bg-violet-500/15 border-violet-500/50' : 'bg-card/30 border-border/30 hover:border-violet-500/30'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center ${ASPECT_COLORS[state.aspect]}`}><Icon className="w-3.5 h-3.5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-serif text-foreground">{state.label}</span>
                            <span className={`text-base font-mono font-bold ${probColor}`}>{state.probability}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1 bg-secondary/50 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700" style={{ width: `${state.probability}%` }} />
                            </div>
                            <div className={`flex items-center gap-0.5 ${TREND_COLORS[state.trend]}`}><TrendIcon className="w-3 h-3" /><span className="text-[9px]">{t(`trend.${state.trend}`)}</span></div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {selectedAspect && (
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <QuantumCoherencePanel
                contributions={buildCoherenceData(result, selectedAspect)}
                selectedAspect={selectedAspect}
                overallCoherence={result.overallCoherence}
              />
            </div>
          )}
        </TabsContent>

        {/* Waveform */}
        <TabsContent value="waveform" className="mt-5 space-y-5">
          <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
            <h3 className="text-sm font-serif text-violet-300 mb-1"><Waves className="w-4 h-4 inline mr-1" />一生能量波形</h3>
            <p className="text-[10px] text-muted-foreground mb-3">九大体系量子坍缩后的确定性能量曲线</p>
            <QuantumWaveform timeline={waveformTimeline} height={280} />
          </div>
          <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
            <h3 className="text-sm font-serif text-violet-300 mb-3">生命阶段能量</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {result.destinyPhases.map((p, i) => (
                <div key={i} className="p-3 rounded-lg bg-card/30 border border-violet-500/10 text-center">
                  <div className="text-xs font-serif text-violet-200">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">{p.startAge}-{p.endAge}岁</div>
                  <div className={`text-xl font-mono font-bold mt-1 ${p.overallEnergy >= 65 ? 'text-emerald-400' : p.overallEnergy >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{p.overallEnergy}</div>
                  <Badge variant="outline" className="text-[9px] mt-1 border-violet-500/20 text-violet-300/70">{p.element} · {p.theme}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Entanglement */}
        <TabsContent value="entangle" className="mt-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
              <h3 className="text-sm font-serif text-violet-300 mb-3"><Network className="w-4 h-4 inline mr-1" />量子纠缠图</h3>
              <QuantumEntanglementMap entanglements={result.entanglements} />
            </div>
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
              <h3 className="text-sm font-serif text-violet-300 mb-3">维度关联</h3>
              <div className="space-y-2">
                {result.entanglements.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).map((e, i) => {
                  const isPos = e.correlation > 0;
                  const strength = Math.abs(e.correlation);
                  return (
                    <div key={i} className="p-2.5 rounded-lg bg-card/30 border border-border/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-foreground">{QuantumPredictionEngine.getAspectLabel(e.aspectA)} ↔ {QuantumPredictionEngine.getAspectLabel(e.aspectB)}</span>
                        <Badge variant="outline" className={`text-[9px] ${isPos ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                          {isPos ? '+' : ''}{(e.correlation * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isPos ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${strength * 100}%` }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">{e.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Helpers ───

function buildCoherenceData(result: QuantumPredictionResult, aspect: LifeAspect) {
  const contribs: Record<LifeAspect, { system: string; weight: number; rawScore: number; normalizedScore: number; detail: string }[]> = {} as any;
  for (const a of QuantumPredictionEngine.getAllAspects()) {
    contribs[a] = result.systems.map(sys => ({
      system: sys.nameCN,
      weight: sys.weight,
      rawScore: sys.lifeVectors[a] ?? 50,
      normalizedScore: (sys.lifeVectors[a] ?? 50) / 100,
      detail: Object.entries(sys.meta).map(([k, v]) => `${k}:${v}`).join(' '),
    }));
  }
  return contribs;
}

export default UnifiedQuantumPanel;
