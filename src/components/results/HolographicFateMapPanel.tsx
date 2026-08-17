/**
 * H-Pulse — Holographic Fate Map Panel (v5.1 三层全息命盘)
 *
 * Renders the deterministic HolographicFateMap output (Macro / Meso / Micro)
 * produced by `generateHolographicFateMap()` in the orchestrator.
 *
 * Digital Temple aesthetic: antique gold accent, deep space backgrounds.
 */

import { useMemo, useState } from 'react';
import type { HolographicFateMap, MacroPhaseOverview, MesoEvent } from '@/types/holisticFateMap';
import { FATE_DIMENSION_LABELS, ALL_FATE_DIMENSIONS, type FateDimension } from '@/types/prediction';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Activity, Sparkles, Layers, Sun } from 'lucide-react';

interface HolographicFateMapPanelProps {
  map: HolographicFateMap | null;
  birthYear: number;
}

const TREND_LABEL: Record<MacroPhaseOverview['trend'], string> = {
  ascending: '上升', peak: '巅峰', stable: '平稳', declining: '下行', turbulent: '动荡',
};
const TREND_COLOR: Record<MacroPhaseOverview['trend'], string> = {
  ascending: 'text-emerald-300 border-emerald-400/40',
  peak: 'text-amber-300 border-amber-400/40',
  stable: 'text-sky-300 border-sky-400/40',
  declining: 'text-rose-300 border-rose-400/40',
  turbulent: 'text-orange-300 border-orange-400/40',
};
const GRADE_COLOR: Record<string, string> = {
  S: 'text-amber-300 border-amber-400/60 bg-amber-500/10',
  A: 'text-primary border-primary/60 bg-primary/10',
  B: 'text-sky-300 border-sky-400/40 bg-sky-500/5',
  C: 'text-muted-foreground border-border/40 bg-card/30',
  D: 'text-rose-300 border-rose-400/40 bg-rose-500/5',
};
const INTENSITY_COLOR: Record<MesoEvent['intensity'], string> = {
  minor: 'border-border/30 bg-card/30',
  moderate: 'border-sky-400/30 bg-sky-500/5',
  major: 'border-primary/40 bg-primary/8',
  critical: 'border-amber-400/50 bg-amber-500/10',
  life_defining: 'border-rose-400/60 bg-rose-500/15',
};
const INTENSITY_LABEL: Record<MesoEvent['intensity'], string> = {
  minor: '微', moderate: '中', major: '大', critical: '关键', life_defining: '人生定格',
};

function FateBar({ dim, value }: { dim: FateDimension; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = value >= 70 ? 'from-emerald-500/70 to-emerald-400' : value <= 30 ? 'from-rose-500/70 to-rose-400' : 'from-primary/70 to-primary';
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-14 text-muted-foreground font-sans">{FATE_DIMENSION_LABELS[dim]}</span>
      <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-7 text-right font-mono text-foreground/90">{Math.round(value)}</span>
    </div>
  );
}

function MacroSection({ map }: { map: HolographicFateMap }) {
  const macro = map.macroLayer;
  const [showAllPhases, setShowAllPhases] = useState(false);
  const visiblePhases = showAllPhases ? macro.phaseOverviews : macro.phaseOverviews.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Title card */}
      <HolographicPanel innerPadding="md">
        <div className="flex items-start gap-3 flex-wrap">
          <div className={`px-2.5 py-1 rounded-md border text-sm font-serif tracking-wider ${GRADE_COLOR[macro.overallGrade]}`}>
            {macro.overallGrade} 级命格
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-base font-serif text-primary">{macro.fateTitle}</div>
            <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{macro.fateDescription}</div>
          </div>
        </div>
        {macro.coreTraits.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {macro.coreTraits.map((t, i) => (
              <Badge key={i} variant="outline" className="text-[10px] border-primary/30 text-primary/90 bg-primary/5">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </HolographicPanel>

      {/* Lifetime fate vector */}
      <HolographicPanel innerPadding="md">
        <div className="text-xs text-muted-foreground font-sans mb-2 flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> 终身命运向量均值
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {ALL_FATE_DIMENSIONS.map((d) => (
            <FateBar key={d} dim={d} value={macro.lifetimeAverageFate[d]} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
          <span>最强：<span className="text-emerald-300">{FATE_DIMENSION_LABELS[macro.strongestDimension]}</span></span>
          <span>最弱：<span className="text-rose-300">{FATE_DIMENSION_LABELS[macro.weakestDimension]}</span></span>
          <span>分析窗口：<span className="text-primary">0–{macro.analysisHorizonAge} 岁</span></span>
          <span>命运节点：<span className="text-foreground">{macro.totalNodes}</span></span>
        </div>
      </HolographicPanel>

      {/* Phase overviews */}
      <HolographicPanel innerPadding="md">
        <div className="text-xs text-muted-foreground font-sans mb-3 flex items-center justify-between">
          <span>六阶段运势走势</span>
          {macro.phaseOverviews.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllPhases((v) => !v)}
              className="text-[10px] text-primary/80 hover:text-primary inline-flex items-center gap-0.5"
            >
              {showAllPhases ? <>收起 <ChevronUp className="w-3 h-3" /></> : <>展开全部 <ChevronDown className="w-3 h-3" /></>}
            </button>
          )}
        </div>
        <div className="space-y-2">
          {visiblePhases.map((p) => (
            <div key={p.phase} className="border border-border/30 rounded-md p-2.5 bg-card/30">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-serif text-foreground">{p.phaseName}</span>
                  <span className="text-[10px] text-muted-foreground">({p.ageRange[0]}-{p.ageRange[1]} 岁)</span>
                </div>
                <Badge variant="outline" className={`text-[10px] ${TREND_COLOR[p.trend]}`}>{TREND_LABEL[p.trend]}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                核心主题：<span className="text-foreground/80">{p.coreTheme}</span>
                <span className="mx-2">·</span>
                关键事件 <span className="text-primary">{p.keyEventCount}</span>
                <span className="mx-2">·</span>
                主导引擎 <span className="text-primary/80">{p.dominantEngine}</span>
              </div>
            </div>
          ))}
        </div>
      </HolographicPanel>
    </div>
  );
}

function MesoSection({ map, birthYear }: { map: HolographicFateMap; birthYear: number }) {
  const meso = map.mesoLayer;
  const [filter, setFilter] = useState<'all' | 'turning' | 'peaks' | 'valleys'>('all');
  const list = useMemo(() => {
    if (filter === 'turning') return meso.turningPoints;
    if (filter === 'peaks') return meso.peaks;
    if (filter === 'valleys') return meso.valleys;
    return meso.keyEvents;
  }, [filter, meso]);

  return (
    <div className="space-y-4">
      <HolographicPanel innerPadding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
          <Stat label="关键事件" value={meso.keyEvents.length} />
          <Stat label="转折点" value={meso.turningPoints.length} accent="text-amber-300" />
          <Stat label="高峰" value={meso.peaks.length} accent="text-emerald-300" />
          <Stat label="低谷" value={meso.valleys.length} accent="text-rose-300" />
        </div>
      </HolographicPanel>

      <div className="flex gap-1.5 flex-wrap">
        {([
          ['all', '全部'],
          ['turning', '转折点'],
          ['peaks', '高峰'],
          ['valleys', '低谷'],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
              filter === k
                ? 'bg-primary/15 border-primary/50 text-primary'
                : 'bg-card/30 border-border/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
        {list.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-8">该筛选下暂无事件</div>
        ) : (
          list.map((ev) => (
            <div key={ev.id} className={`p-3 rounded-lg border ${INTENSITY_COLOR[ev.intensity]}`}>
              <div className="flex items-start gap-3">
                <div className="text-center min-w-[44px]">
                  <div className="text-base font-serif text-primary">{ev.age}</div>
                  <div className="text-[10px] text-muted-foreground">{ev.year}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-sm font-serif text-foreground">{ev.title}</span>
                    <span className="text-[9px] px-1 py-0 border border-primary/30 text-primary rounded">
                      {INTENSITY_LABEL[ev.intensity]}
                    </span>
                    {ev.isTurningPoint && (
                      <span className="text-[9px] px-1 py-0 border border-amber-400/50 text-amber-300 rounded">转折</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ev.description}</p>
                  <div className="text-[10px] text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>主导：<span className="text-foreground/90">{FATE_DIMENSION_LABELS[ev.maxChangeDimension]}</span></span>
                    <span>变化：<span className={ev.maxChangeAmount > 0 ? 'text-emerald-300' : ev.maxChangeAmount < 0 ? 'text-rose-300' : 'text-muted-foreground'}>
                      {ev.changeMagnitude > 0 ? '+' : ''}{ev.changeMagnitude}
                    </span></span>
                    <span>共识：<span className="text-primary">{ev.consensusCount}</span></span>
                    <span>置信：<span className="text-foreground/80">{Math.round(ev.confidence * 100)}%</span></span>
                  </div>
                  {ev.supportingEngines.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ev.supportingEngines.slice(0, 6).map((e) => (
                        <span key={e} className="text-[9px] px-1 py-0 rounded bg-secondary/40 text-muted-foreground">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MicroSection({ map }: { map: HolographicFateMap }) {
  const micro = map.microLayer;
  const trendIcon = micro.dimensionTrend === 'up' ? TrendingUp : micro.dimensionTrend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor =
    micro.dimensionTrend === 'up' ? 'text-emerald-300' : micro.dimensionTrend === 'down' ? 'text-rose-300' : 'text-muted-foreground';

  return (
    <div className="space-y-4">
      <HolographicPanel innerPadding="md">
        <div className="flex items-start gap-3">
          <Sun className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground font-sans mb-1">当前运势周期</div>
            <div className="text-sm font-serif text-foreground">{micro.currentCycle}</div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{micro.dailyGuidance}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/30 flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">关注维度：</span>
          <span className="text-foreground/90 font-sans">{FATE_DIMENSION_LABELS[micro.focusDimension]}</span>
          <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
        </div>
      </HolographicPanel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <HolographicPanel innerPadding="md">
          <div className="text-xs text-emerald-300 font-sans mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> 宜
          </div>
          <ul className="space-y-1 text-[11px] text-foreground/90">
            {micro.auspicious.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </HolographicPanel>

        <HolographicPanel innerPadding="md">
          <div className="text-xs text-rose-300 font-sans mb-2 flex items-center gap-1.5">
            <Activity className="w-3 h-3" /> 忌
          </div>
          <ul className="space-y-1 text-[11px] text-foreground/90">
            {micro.inauspicious.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-400 mt-0.5">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </HolographicPanel>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'text-primary' }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <div className={`text-lg font-serif ${accent}`}>{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}

export function HolographicFateMapPanel({ map, birthYear }: HolographicFateMapPanelProps) {
  if (!map) {
    return (
      <HolographicPanel innerPadding="lg" className="text-center text-xs text-muted-foreground">
        全息命盘数据加载中...
      </HolographicPanel>
    );
  }

  return (
    <div className="space-y-4">
      <HolographicPanel innerPadding="md" className="border-primary/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-serif text-primary tracking-wider">全息命盘 · v{map.version}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>考察路径 <span className="text-primary">{map.collapseInfo.totalPathsConsidered}</span></span>
            <span>·</span>
            <span>选择稳定度 <span className="text-primary">{Math.round(map.collapseInfo.selectionStability * 100)}%</span></span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1.5">
          排序依据：{map.collapseInfo.selectedReason}
        </div>
      </HolographicPanel>

      <Tabs defaultValue="macro">
        <TabsList className="bg-card/40 border border-primary/15 p-1 rounded-xl">
          <TabsTrigger value="macro" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            宏观 · 命格
          </TabsTrigger>
          <TabsTrigger value="meso" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            中观 · 事件
          </TabsTrigger>
          <TabsTrigger value="micro" className="text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            微观 · 日常
          </TabsTrigger>
        </TabsList>
        <TabsContent value="macro" className="mt-4">
          <MacroSection map={map} />
        </TabsContent>
        <TabsContent value="meso" className="mt-4">
          <MesoSection map={map} birthYear={birthYear} />
        </TabsContent>
        <TabsContent value="micro" className="mt-4">
          <MicroSection map={map} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default HolographicFateMapPanel;
