/**
 * Unified Prediction Results Panel v2.0
 *
 * Displays UnifiedPredictionResult with:
 * - Fused 10-dimensional FateVector
 * - Engine activation: active / executed / skipped / failed
 * - Timing basis categorization (natal vs instant)
 * - Execution trace timeline
 * - Conflict detection & fusion explanation
 * - Per-engine detail panels (Ziwei, San-Shi, Meihua, etc.)
 */

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UnifiedPredictionResult, FateDimension, PredictionConflict, ExecutionTraceEntry } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import {
  BarChart3, AlertTriangle, Sparkles, Shield, Info, ChevronRight, ChevronDown,
  TrendingUp, Activity, Brain, Heart, Coins, Sun, CheckCircle, XCircle,
  Clock, Zap, Timer, Layers, Crown, Palette, Clover, Home,
} from 'lucide-react';
import { useState } from 'react';

// ── Dimension icons & colors ──

const DIM_ICONS: Record<FateDimension, typeof Sun> = {
  life: Sun, wealth: Coins, relation: Heart,
  health: Activity, wisdom: Brain, spirit: Sparkles,
  socialStatus: Crown, creativity: Palette, luck: Clover, homeStability: Home,
};

const DIM_COLORS: Record<FateDimension, string> = {
  life: 'text-amber-400', wealth: 'text-emerald-400', relation: 'text-rose-400',
  health: 'text-purple-400', wisdom: 'text-blue-400', spirit: 'text-indigo-400',
  socialStatus: 'text-yellow-400', creativity: 'text-pink-400', luck: 'text-lime-400', homeStability: 'text-teal-400',
};

const DIM_BAR_COLORS: Record<FateDimension, string> = {
  life: 'bg-amber-500', wealth: 'bg-emerald-500', relation: 'bg-rose-500',
  health: 'bg-purple-500', wisdom: 'bg-blue-500', spirit: 'bg-indigo-500',
  socialStatus: 'bg-yellow-500', creativity: 'bg-pink-500', luck: 'bg-lime-500', homeStability: 'bg-teal-500',
};

function scoreColor(v: number): string {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

// ── FateVector ──

function FateVectorDisplay({ result }: { result: UnifiedPredictionResult }) {
  const fv = result.fusedFateVector;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4" />融合命运向量
        </h3>
        <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70">
          {result.executedEngines.length}系融合
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
              <div className={`h-full rounded-full transition-all duration-700 ${DIM_BAR_COLORS[dim]}`} style={{ width: `${val}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Engine Status (active/executed/skipped/failed + timing basis) ──

function EngineStatusDisplay({ result }: { result: UnifiedPredictionResult }) {
  const natalEngines = result.engineOutputs.filter(e => e.timingBasis === 'birth');
  const instantEngines = result.engineOutputs.filter(e => e.timingBasis === 'query');
  const hybridEngines = result.engineOutputs.filter(e => e.timingBasis === 'hybrid');

  return (
    <div className="space-y-4">
      {/* All engines activated status */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-emerald-300 font-serif">
          全部 {result.activeEngines.length} 个引擎已启动，{result.executedEngines.length} 个成功执行
        </span>
      </div>

      {/* Natal engines */}
      <div className="space-y-2">
        <h4 className="text-xs font-serif text-amber-300 flex items-center gap-1.5">
          <Sun className="w-3.5 h-3.5" />本命引擎 ({natalEngines.length})
          <span className="text-[9px] text-muted-foreground font-normal ml-1">基于出生时刻</span>
        </h4>
        <div className="text-[10px] text-muted-foreground/70 mb-1">
          出生时间: {result.input.birthUtcDateTime}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {natalEngines.map(eo => (
            <div key={eo.engineName} className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-card/30 border border-border/10">
              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-foreground truncate">{eo.engineNameCN}</span>
              <span className="text-muted-foreground text-[9px] ml-auto">{eo.computationTimeMs}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instant engines */}
      <div className="space-y-2">
        <h4 className="text-xs font-serif text-blue-300 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />即时引擎 ({instantEngines.length})
          <span className="text-[9px] text-muted-foreground font-normal ml-1">基于测算时间</span>
        </h4>
        <div className="text-[10px] text-muted-foreground/70 mb-1">
          测算时间: {result.input.queryTimeUtc}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {instantEngines.map(eo => (
            <div key={eo.engineName} className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-card/30 border border-border/10">
              <Zap className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-foreground truncate">{eo.engineNameCN}</span>
              <span className="text-muted-foreground text-[9px] ml-auto">{eo.computationTimeMs}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hybrid engines */}
      {hybridEngines.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-serif text-purple-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />混合引擎 ({hybridEngines.length})
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {hybridEngines.map(eo => (
              <div key={eo.engineName} className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-card/30 border border-border/10">
                <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-foreground truncate">{eo.engineNameCN}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skipped */}
      {result.skippedEngines.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs text-muted-foreground flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />跳过引擎 ({result.skippedEngines.length})
          </h4>
          {result.skippedEngines.map(se => (
            <div key={se.engineName} className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
              <XCircle className="w-3 h-3 shrink-0" />
              <span>{se.engineName}</span>
              <span className="text-muted-foreground/40">— {se.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Failed */}
      {result.failedEngines.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />失败引擎 ({result.failedEngines.length})
          </h4>
          {result.failedEngines.map(fe => (
            <div key={fe.engineName} className="flex items-start gap-2 text-[10px] text-rose-400/80">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{fe.engineName}: {fe.error}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">{result.activationReasonSummary}</p>
    </div>
  );
}

// ── Execution Trace ──

function ExecutionTraceDisplay({ trace }: { trace: ExecutionTraceEntry[] }) {
  if (!trace || trace.length === 0) return null;

  const totalMs = trace.reduce((s, t) => s + t.durationMs, 0);
  const timingBasisLabel: Record<string, string> = { birth: '本命', query: '即时', hybrid: '混合' };
  const timingBasisColor: Record<string, string> = { birth: 'text-amber-400', query: 'text-blue-400', hybrid: 'text-purple-400' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
          <Timer className="w-4 h-4" />引擎执行轨迹
        </h3>
        <span className="text-[10px] text-muted-foreground">总耗时 {totalMs}ms</span>
      </div>
      <div className="space-y-1.5">
        {trace.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-card/30 border border-border/10">
            {entry.success
              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            }
            <span className="text-xs text-foreground w-20 shrink-0 truncate">{entry.engineName}</span>
            <Badge variant="outline" className={`text-[8px] px-1 border-border/20 ${timingBasisColor[entry.timingBasis] || 'text-muted-foreground'}`}>
              {timingBasisLabel[entry.timingBasis] || entry.timingBasis}
            </Badge>
            <div className="flex-1 h-1 bg-secondary/20 rounded-full overflow-hidden mx-1">
              <div
                className={`h-full rounded-full ${entry.success ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`}
                style={{ width: `${Math.min(100, (entry.durationMs / Math.max(1, totalMs)) * 100 * trace.length)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground w-12 text-right shrink-0">{entry.durationMs}ms</span>
            {!entry.success && entry.errorMessage && (
              <span className="text-[9px] text-rose-400 truncate max-w-[120px]" title={entry.errorMessage}>
                {entry.errorMessage.slice(0, 30)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Engine Confidence List ──

function EngineConfidenceList({ result }: { result: UnifiedPredictionResult }) {
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});

  const toggleTrace = (engineName: string) => {
    setExpandedTraces(prev => ({ ...prev, [engineName]: !prev[engineName] }));
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
        <Shield className="w-4 h-4" />各引擎置信度与权重
      </h3>
      {result.engineOutputs.map(eo => {
        const w = result.weightsUsed.find(w => w.engineName === eo.engineName);
        const weightPct = Math.round((w?.weight ?? 0) * 100);
        const basisLabel = eo.timingBasis === 'birth' ? '本命' : eo.timingBasis === 'query' ? '即时' : '混合';
        const basisColor = eo.timingBasis === 'birth' ? 'border-amber-500/30 text-amber-400' : eo.timingBasis === 'query' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400';
        const vf = eo.validationFlags;
        const isTraceExpanded = expandedTraces[eo.engineName] ?? false;
        return (
          <div key={eo.engineName} className="p-2.5 rounded-lg bg-card/30 border border-border/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif text-foreground">{eo.engineNameCN}</span>
                <Badge variant="outline" className={`text-[9px] px-1 ${basisColor}`}>{basisLabel}</Badge>
                <Badge variant="outline" className="text-[9px] px-1 border-border/20 text-muted-foreground">
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
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${eo.confidence * 100}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{eo.ruleSchool}</span>
              <span className="text-[9px] text-muted-foreground">{eo.computationTimeMs}ms</span>
            </div>

            {/* Completeness Score */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] text-muted-foreground">完整度</span>
              <div className="flex-1 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    eo.completenessScore >= 70 ? 'bg-emerald-500' : eo.completenessScore >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${eo.completenessScore}%` }}
                />
              </div>
              <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${scoreColor(eo.completenessScore)}`}>
                {eo.completenessScore}%
              </Badge>
            </div>

            {/* Validation Flags */}
            {vf && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] text-muted-foreground">校验</span>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-[9px] text-emerald-400">
                    <CheckCircle className="w-3 h-3" />{vf.passed.length}
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] text-rose-400">
                    <XCircle className="w-3 h-3" />{vf.failed.length}
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
                    <AlertTriangle className="w-3 h-3" />{vf.warnings.length}
                  </span>
                </div>
              </div>
            )}

            {/* Explanation Trace (collapsible) */}
            {eo.explanationTrace && eo.explanationTrace.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => toggleTrace(eo.engineName)}
                  className="flex items-center gap-1 text-[9px] text-primary/70 hover:text-primary transition-colors"
                >
                  {isTraceExpanded
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />
                  }
                  推理轨迹 ({eo.explanationTrace.length} 步)
                </button>
                {isTraceExpanded && (
                  <ol className="mt-1 space-y-0.5 pl-4 list-decimal">
                    {eo.explanationTrace.map((step, idx) => (
                      <li key={idx} className="text-[9px] text-muted-foreground/80 leading-relaxed">{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Conflict Display ──

function ConflictList({ conflicts }: { conflicts: PredictionConflict[] }) {
  if (conflicts.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        <Sparkles className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
        各活跃体系高度共振，未检测到显著冲突
      </div>
    );
  }

  const strategyLabels: Record<string, string> = {
    weighted_average: '加权平均', confidence_priority: '置信度优先',
    domain_expert: '领域专家优先', conservative: '保守估计',
  };
  const strategyColors: Record<string, string> = {
    weighted_average: 'border-blue-500/30 text-blue-400',
    confidence_priority: 'border-amber-500/30 text-amber-400',
    domain_expert: 'border-emerald-500/30 text-emerald-400',
    conservative: 'border-rose-500/30 text-rose-400',
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
        <AlertTriangle className="w-4 h-4" />体系冲突检测 ({conflicts.length})
      </h3>
      {conflicts.map((c, i) => (
        <div key={i} className="p-2.5 rounded-lg bg-card/30 border border-border/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">{FATE_DIMENSION_LABELS[c.dimension]}</span>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className={`text-[9px] px-1 ${strategyColors[c.resolutionStrategy] || ''}`}>
                {strategyLabels[c.resolutionStrategy] || c.resolutionStrategy}
              </Badge>
              <Badge variant="outline" className="text-[9px] px-1 border-rose-500/30 text-rose-400">Δ{c.delta}</Badge>
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

// ── Engine Vector Comparison ──

function EngineVectorComparison({ result }: { result: UnifiedPredictionResult }) {
  const [selectedDim, setSelectedDim] = useState<FateDimension>('life');
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4" />各引擎维度对比
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {ALL_FATE_DIMENSIONS.map(dim => (
          <button key={dim} onClick={() => setSelectedDim(dim)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
              selectedDim === dim
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'border-border/30 text-muted-foreground hover:border-primary/30'
            }`}
          >{FATE_DIMENSION_LABELS[dim]}</button>
        ))}
      </div>
      <div className="space-y-1.5">
        {result.engineOutputs
          .sort((a, b) => b.fateVector[selectedDim] - a.fateVector[selectedDim])
          .map(eo => {
            const val = eo.fateVector[selectedDim];
            const diff = val - result.fusedFateVector[selectedDim];
            return (
              <div key={eo.engineName} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 shrink-0 truncate">{eo.engineNameCN}</span>
                <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${DIM_BAR_COLORS[selectedDim]}`} style={{ width: `${val}%` }} />
                </div>
                <span className={`text-[10px] font-mono w-8 text-right ${scoreColor(val)}`}>{val}</span>
                <span className={`text-[9px] font-mono w-10 text-right ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                  {diff > 0 ? '+' : ''}{diff}
                </span>
              </div>
            );
          })}
        <div className="flex items-center gap-2 pt-1 border-t border-border/20">
          <span className="text-[10px] text-primary w-16 shrink-0 font-bold">融合值</span>
          <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${result.fusedFateVector[selectedDim]}%` }} />
          </div>
          <span className="text-[10px] font-mono font-bold text-primary w-8 text-right">{result.fusedFateVector[selectedDim]}</span>
          <span className="w-10" />
        </div>
      </div>
    </div>
  );
}

// ── Meihua Detail ──

function MeihuaDetail({ result }: { result: UnifiedPredictionResult }) {
  const meihua = result.engineOutputs.find(e => e.engineName === 'meihua');
  if (!meihua) return null;
  const no = meihua.normalizedOutput;
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-serif text-blue-300 flex items-center gap-1.5"><Sparkles className="w-4 h-4" />梅花易数卦象 <Badge variant="outline" className="text-[8px] border-blue-500/20 text-blue-400">即时</Badge></h3>
      <div className="grid grid-cols-3 gap-2">
        {(['本卦', '互卦', '变卦'] as const).map(label => (
          <div key={label} className="p-2.5 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-xs font-serif text-foreground">{no[label] || '—'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-card/30 border border-border/20 text-center">
          <div className="text-[10px] text-muted-foreground">动爻</div>
          <div className="text-xs font-mono text-foreground">第{no['动爻']}爻</div>
        </div>
        <div className="p-2 rounded-lg bg-card/30 border border-border/20 text-center">
          <div className="text-[10px] text-muted-foreground">体用关系</div>
          <div className="text-xs font-serif text-foreground">{no['体用']}</div>
        </div>
        <div className="p-2 rounded-lg bg-card/30 border border-border/20 text-center">
          <div className="text-[10px] text-muted-foreground">吉凶</div>
          <div className={`text-xs font-bold ${no['吉凶'] === '大吉' || no['吉凶'] === '吉' ? 'text-emerald-400' : no['吉凶'] === '大凶' || no['吉凶'] === '凶' ? 'text-rose-400' : 'text-amber-300'}`}>{no['吉凶']}</div>
        </div>
      </div>
    </div>
  );
}

// ── Qimen Detail ──

function QimenDetail({ result }: { result: UnifiedPredictionResult }) {
  const qimen = result.engineOutputs.find(e => e.engineName === 'qimen');
  if (!qimen) return null;
  const no = qimen.normalizedOutput;
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-serif text-blue-300 flex items-center gap-1.5"><Shield className="w-4 h-4" />奇门遁甲盘面 <Badge variant="outline" className="text-[8px] border-blue-500/20 text-blue-400">即时</Badge></h3>
      <div className="grid grid-cols-4 gap-2">
        {(['遁局', '值符', '值使', '时干'] as const).map(label => (
          <div key={label} className="p-2 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-xs font-serif text-foreground">{no[label] || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LiuRen Detail ──

function LiuRenDetail({ result }: { result: UnifiedPredictionResult }) {
  const liuren = result.engineOutputs.find(e => e.engineName === 'liuren');
  if (!liuren) return null;
  const no = liuren.normalizedOutput;
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-serif text-blue-300 flex items-center gap-1.5"><Activity className="w-4 h-4" />大六壬课体 <Badge variant="outline" className="text-[8px] border-blue-500/20 text-blue-400">即时</Badge></h3>
      <div className="grid grid-cols-3 gap-2">
        {(['四课', '三传', '课体'] as const).map(label => (
          <div key={label} className="p-2.5 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-xs font-serif text-foreground">{no[label] || '—'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(['天将', '日辰', '贵人', '吉凶'] as const).map(label => (
          <div key={label} className="p-2 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className={`text-xs font-serif ${
              label === '吉凶' ? (no[label] === '大吉' || no[label] === '吉' ? 'text-emerald-400' : no[label] === '大凶' || no[label] === '凶' ? 'text-rose-400' : 'text-amber-300') : 'text-foreground'
            }`}>{no[label] || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Taiyi Detail ──

function TaiyiDetail({ result }: { result: UnifiedPredictionResult }) {
  const taiyi = result.engineOutputs.find(e => e.engineName === 'taiyi');
  if (!taiyi) return null;
  const no = taiyi.normalizedOutput;
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-serif text-blue-300 flex items-center gap-1.5"><Sun className="w-4 h-4" />太乙神数 <Badge variant="outline" className="text-[8px] border-blue-500/20 text-blue-400">即时</Badge></h3>
      <div className="grid grid-cols-3 gap-2">
        {(['局式', '太乙值位', '格局'] as const).map(label => (
          <div key={label} className="p-2.5 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-xs font-serif text-foreground">{no[label] || '—'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(['主算', '客算', '趋势', '吉凶'] as const).map(label => (
          <div key={label} className="p-2 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className={`text-xs font-serif ${
              label === '吉凶' ? (no[label] === '大吉' || no[label] === '吉' ? 'text-emerald-400' : no[label] === '大凶' || no[label] === '凶' ? 'text-rose-400' : 'text-amber-300')
              : label === '趋势' ? (no[label] === '大旺' || no[label] === '旺' ? 'text-emerald-400' : no[label] === '大衰' || no[label] === '衰' ? 'text-rose-400' : 'text-amber-300')
              : 'text-foreground'
            }`}>{no[label] || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ziwei Detail ──

function ZiweiDetail({ result }: { result: UnifiedPredictionResult }) {
  const ziwei = result.engineOutputs.find(e => e.engineName === 'ziwei');
  if (!ziwei) return null;
  const no = ziwei.normalizedOutput;
  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-serif text-amber-300 flex items-center gap-1.5"><Sparkles className="w-4 h-4" />紫微斗数 <Badge variant="outline" className="text-[8px] border-amber-500/20 text-amber-400">本命</Badge></h3>
      <div className="grid grid-cols-3 gap-2">
        {(['命宫', '身宫', '五行局'] as const).map(label => (
          <div key={label} className="p-2.5 rounded-lg bg-card/30 border border-border/20 text-center">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-xs font-serif text-foreground">{no[label] || '—'}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(['主星', '辅星摘要', '煞星摘要', '四化摘要'] as const).map(label => (
          <div key={label} className="p-2 rounded-lg bg-card/30 border border-border/20">
            <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
            <div className="text-[10px] font-serif text-foreground leading-relaxed">{no[label] || '—'}</div>
          </div>
        ))}
      </div>
      {(no['大限摘要'] || no['流年摘要'] || no['关键格局摘要']) && (
        <div className="space-y-2">
          {(['大限摘要', '流年摘要', '关键格局摘要'] as const).map(label => no[label] ? (
            <div key={label} className="p-2 rounded-lg bg-card/30 border border-border/20">
              <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
              <div className="text-[10px] text-foreground leading-relaxed">{no[label]}</div>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

// ── Uncertainty Notes ──

function UncertaintyNotes({ result }: { result: UnifiedPredictionResult }) {
  const allNotes = result.engineOutputs.flatMap(eo => eo.uncertaintyNotes.map(note => ({ engine: eo.engineNameCN, note })));
  const allWarnings = result.engineOutputs.flatMap(eo => eo.warnings.map(w => ({ engine: eo.engineNameCN, warning: w })));
  if (allNotes.length === 0 && allWarnings.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5"><Info className="w-4 h-4" />不确定性说明</h3>
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
          <div key={i} className="text-[10px] text-muted-foreground/60">· [{n.engine}] {n.note}</div>
        ))}
        {allNotes.length > 8 && <div className="text-[10px] text-muted-foreground/40">…及其他 {allNotes.length - 8} 条说明</div>}
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
      <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-serif text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />统一编排结果
          </h2>
          <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70 font-mono">
            {result.predictionId}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{result.causalSummary}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
          <span>综合置信度: <strong className={scoreColor(result.finalConfidence * 100)}>{Math.round(result.finalConfidence * 100)}%</strong></span>
          <span>激活: <strong className="text-primary">{result.activeEngines.length}</strong></span>
          <span>执行: <strong className="text-emerald-400">{result.executedEngines.length}</strong></span>
          <span>跳过: <strong className="text-muted-foreground">{result.skippedEngines.length}</strong></span>
          <span>失败: <strong className={result.failedEngines.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>{result.failedEngines.length}</strong></span>
          <span>冲突: <strong className={result.conflicts.length > 3 ? 'text-rose-400' : 'text-emerald-400'}>{result.conflicts.length}</strong></span>
          <span>版本: <strong className="text-primary">{result.algorithmVersion}</strong></span>
        </div>
      </div>

      {/* Tabbed content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-secondary/30 border border-primary/20 h-auto">
          <TabsTrigger value="vector" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">命运向量</TabsTrigger>
          <TabsTrigger value="status" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">引擎状态</TabsTrigger>
          <TabsTrigger value="engines" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">引擎详情</TabsTrigger>
          <TabsTrigger value="trace" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">执行轨迹</TabsTrigger>
          <TabsTrigger value="conflicts" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">冲突({result.conflicts.length})</TabsTrigger>
          <TabsTrigger value="notes" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">不确定性</TabsTrigger>
        </TabsList>

        <TabsContent value="vector" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
              <FateVectorDisplay result={result} />
            </div>
            <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
              <EngineVectorComparison result={result} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <EngineStatusDisplay result={result} />
          </div>
        </TabsContent>

        <TabsContent value="engines" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[600px] pr-2">
              <EngineConfidenceList result={result} />
              <ZiweiDetail result={result} />
              <MeihuaDetail result={result} />
              <QimenDetail result={result} />
              <LiuRenDetail result={result} />
              <TaiyiDetail result={result} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="trace" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <ExecutionTraceDisplay trace={result.executionTrace} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <ConflictList conflicts={result.conflicts} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <UncertaintyNotes result={result} />
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
