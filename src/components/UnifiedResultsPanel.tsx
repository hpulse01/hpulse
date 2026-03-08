/**
 * Unified Prediction Results Panel
 *
 * Displays the P1 UnifiedPredictionResult:
 * - Fused 6-dimensional FateVector radar/bar
 * - Per-engine confidence & weight
 * - Detected conflicts with explanations
 * - Causal summary
 * - Uncertainty notes
 */

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UnifiedPredictionResult, FateDimension, PredictionConflict, EngineOutput, WeightEntry } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import {
  BarChart3, AlertTriangle, Sparkles, Shield, Info, ChevronRight,
  TrendingUp, Activity, Brain, Heart, Coins, Sun,
} from 'lucide-react';
import { useState } from 'react';

// ── Dimension icons & colors ──

const DIM_ICONS: Record<FateDimension, typeof Sun> = {
  life: Sun,
  wealth: Coins,
  relation: Heart,
  health: Activity,
  wisdom: Brain,
  spirit: Sparkles,
};

const DIM_COLORS: Record<FateDimension, string> = {
  life: 'text-amber-400',
  wealth: 'text-emerald-400',
  relation: 'text-rose-400',
  health: 'text-purple-400',
  wisdom: 'text-blue-400',
  spirit: 'text-indigo-400',
};

const DIM_BAR_COLORS: Record<FateDimension, string> = {
  life: 'bg-amber-500',
  wealth: 'bg-emerald-500',
  relation: 'bg-rose-500',
  health: 'bg-purple-500',
  wisdom: 'bg-blue-500',
  spirit: 'bg-indigo-500',
};

function scoreColor(v: number): string {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

// ── Sub-components ──

function FateVectorDisplay({ result }: { result: UnifiedPredictionResult }) {
  const fv = result.fusedFateVector;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-serif text-violet-300 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4" />融合命运向量
        </h3>
        <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-300/70">
          {result.engineOutputs.length}系融合
        </Badge>
      </div>
      {ALL_FATE_DIMENSIONS.map(dim => {
        const Icon = DIM_ICONS[dim];
        const val = fv[dim];
        return (
          <div key={dim} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${DIM_COLORS[dim]}`} />
                <span className="text-xs text-foreground">{FATE_DIMENSION_LABELS[dim]}</span>
              </div>
              <span className={`text-sm font-mono font-bold ${scoreColor(val)}`}>{val}</span>
            </div>
            <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${DIM_BAR_COLORS[dim]}`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EngineConfidenceList({ result }: { result: UnifiedPredictionResult }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-violet-300 flex items-center gap-1.5">
        <Shield className="w-4 h-4" />各引擎置信度与权重
      </h3>
      {result.engineOutputs.map(eo => {
        const w = result.weightsUsed.find(w => w.engineName === eo.engineName);
        const weightPct = Math.round((w?.weight ?? 0) * 100);
        return (
          <div key={eo.engineName} className="p-2.5 rounded-lg bg-card/30 border border-border/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif text-foreground">{eo.engineNameCN}</span>
                <Badge variant="outline" className="text-[9px] px-1 border-violet-500/20 text-violet-300/60">
                  {eo.sourceGrade}级 · v{eo.engineVersion}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">权重{weightPct}%</span>
                <span className={`text-xs font-mono font-bold ${scoreColor(eo.confidence * 100)}`}>
                  {Math.round(eo.confidence * 100)}%
                </span>
              </div>
            </div>
            <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${eo.confidence * 100}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{eo.ruleSchool}</span>
              <span className="text-[9px] text-muted-foreground">{eo.computationTimeMs}ms</span>
            </div>
            {w?.reason && (
              <p className="text-[9px] text-muted-foreground/60 mt-0.5">{w.reason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConflictList({ conflicts }: { conflicts: PredictionConflict[] }) {
  if (conflicts.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        <Sparkles className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
        九大体系高度共振，未检测到显著冲突
      </div>
    );
  }

  const strategyLabels: Record<string, string> = {
    weighted_average: '加权平均',
    confidence_priority: '置信度优先',
    domain_expert: '领域专家优先',
    conservative: '保守估计',
  };

  const strategyColors: Record<string, string> = {
    weighted_average: 'border-blue-500/30 text-blue-400',
    confidence_priority: 'border-amber-500/30 text-amber-400',
    domain_expert: 'border-emerald-500/30 text-emerald-400',
    conservative: 'border-rose-500/30 text-rose-400',
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-violet-300 flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4" />体系冲突检测 ({conflicts.length})
      </h3>
      {conflicts.map((c, i) => (
        <div key={i} className="p-2.5 rounded-lg bg-card/30 border border-border/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">
              {FATE_DIMENSION_LABELS[c.dimension]}
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={`text-[9px] px-1 ${strategyColors[c.resolutionStrategy] || ''}`}>
                {strategyLabels[c.resolutionStrategy] || c.resolutionStrategy}
              </Badge>
              <Badge variant="outline" className="text-[9px] px-1 border-rose-500/30 text-rose-400">
                Δ{c.delta}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>{c.engineA}: {c.valueA}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{c.engineB}: {c.valueB}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">{c.explanation}</p>
        </div>
      ))}
    </div>
  );
}

function UncertaintyNotes({ result }: { result: UnifiedPredictionResult }) {
  const allNotes = result.engineOutputs.flatMap(eo =>
    eo.uncertaintyNotes.map(note => ({ engine: eo.engineNameCN, note }))
  );
  const allWarnings = result.engineOutputs.flatMap(eo =>
    eo.warnings.map(w => ({ engine: eo.engineNameCN, warning: w }))
  );

  if (allNotes.length === 0 && allWarnings.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-violet-300 flex items-center gap-1.5">
        <Info className="w-4 h-4" />不确定性说明
      </h3>
      {allWarnings.length > 0 && (
        <div className="space-y-1">
          {allWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400/80">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span><strong>{w.engine}</strong>: {w.warning}</span>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1">
        {allNotes.slice(0, 8).map((n, i) => (
          <div key={i} className="text-[10px] text-muted-foreground/60">
            · [{n.engine}] {n.note}
          </div>
        ))}
        {allNotes.length > 8 && (
          <div className="text-[10px] text-muted-foreground/40">
            …及其他 {allNotes.length - 8} 条说明
          </div>
        )}
      </div>
    </div>
  );
}

// ── Per-engine FateVector comparison ──

function EngineVectorComparison({ result }: { result: UnifiedPredictionResult }) {
  const [selectedDim, setSelectedDim] = useState<FateDimension>('life');

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-serif text-violet-300 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4" />各引擎维度对比
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {ALL_FATE_DIMENSIONS.map(dim => (
          <button
            key={dim}
            onClick={() => setSelectedDim(dim)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
              selectedDim === dim
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                : 'border-border/30 text-muted-foreground hover:border-violet-500/30'
            }`}
          >
            {FATE_DIMENSION_LABELS[dim]}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {result.engineOutputs
          .sort((a, b) => b.fateVector[selectedDim] - a.fateVector[selectedDim])
          .map(eo => {
            const val = eo.fateVector[selectedDim];
            const fusedVal = result.fusedFateVector[selectedDim];
            const diff = val - fusedVal;
            return (
              <div key={eo.engineName} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0 truncate">{eo.engineNameCN}</span>
                <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${DIM_BAR_COLORS[selectedDim]}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className={`text-[10px] font-mono w-8 text-right ${scoreColor(val)}`}>{val}</span>
                <span className={`text-[9px] font-mono w-10 text-right ${
                  diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-muted-foreground'
                }`}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              </div>
            );
          })}
        <div className="flex items-center gap-2 pt-1 border-t border-border/20">
          <span className="text-[10px] text-violet-300 w-16 shrink-0 font-bold">融合值</span>
          <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${result.fusedFateVector[selectedDim]}%` }}
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-violet-300 w-8 text-right">
            {result.fusedFateVector[selectedDim]}
          </span>
          <span className="w-10" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════

interface UnifiedResultsPanelProps {
  result: UnifiedPredictionResult;
}

export function UnifiedResultsPanel({ result }: UnifiedResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('vector');

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-serif text-violet-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />统一编排结果
          </h2>
          <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-300/70 font-mono">
            {result.predictionId}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{result.causalSummary}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>综合置信度: <strong className={scoreColor(result.finalConfidence * 100)}>{Math.round(result.finalConfidence * 100)}%</strong></span>
          <span>引擎数: <strong className="text-violet-300">{result.engineOutputs.length}</strong></span>
          <span>冲突数: <strong className={result.conflicts.length > 3 ? 'text-rose-400' : 'text-emerald-400'}>{result.conflicts.length}</strong></span>
          <span>版本: <strong className="text-violet-300">{result.algorithmVersion}</strong></span>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-violet-950/30 border border-violet-500/20 h-auto">
          <TabsTrigger value="vector" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            命运向量
          </TabsTrigger>
          <TabsTrigger value="engines" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            引擎详情
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            冲突({result.conflicts.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
            不确定性
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vector" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
              <FateVectorDisplay result={result} />
            </div>
            <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
              <EngineVectorComparison result={result} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engines" className="mt-4">
          <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <EngineConfidenceList result={result} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <ConflictList conflicts={result.conflicts} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <UncertaintyNotes result={result} />
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
