/**
 * Prediction Overview — Top-level summary card
 * Shows: FateVector, confidence, engine count, conflict count, activation summary
 */
import { Badge } from '@/components/ui/badge';
import type { UnifiedPredictionResult, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import {
  Sun, Coins, Heart, Activity, Brain, Sparkles,
  CheckCircle, AlertTriangle, Zap,
} from 'lucide-react';

const DIM_ICONS: Record<FateDimension, typeof Sun> = {
  life: Sun, wealth: Coins, relation: Heart,
  health: Activity, wisdom: Brain, spirit: Sparkles,
};

const DIM_BAR: Record<FateDimension, string> = {
  life: 'bg-amber-500', wealth: 'bg-emerald-500', relation: 'bg-rose-500',
  health: 'bg-purple-500', wisdom: 'bg-blue-500', spirit: 'bg-indigo-500',
};

function sc(v: number) {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

interface Props { result: UnifiedPredictionResult }

export function PredictionOverview({ result }: Props) {
  const fv = result.fusedFateVector;
  const birthEngines = result.engineOutputs.filter(e => e.timingBasis === 'birth').length;
  const queryEngines = result.engineOutputs.filter(e => e.timingBasis === 'query').length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: '综合置信度', value: `${Math.round(result.finalConfidence * 100)}%`, color: sc(result.finalConfidence * 100) },
          { label: '活跃引擎', value: result.activeEngines.length, color: 'text-primary' },
          { label: '本命引擎', value: birthEngines, color: 'text-amber-400' },
          { label: '即时引擎', value: queryEngines, color: 'text-blue-400' },
          { label: '体系冲突', value: result.conflicts.length, color: result.conflicts.length > 3 ? 'text-rose-400' : 'text-emerald-400' },
          { label: '失败引擎', value: result.failedEngines.length, color: result.failedEngines.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg bg-card/40 border border-border/20 text-center">
            <div className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Fate Vector */}
      <div className="p-4 rounded-xl bg-card/40 border border-primary/20">
        <h3 className="text-sm font-serif text-primary mb-3 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />融合命运向量
          <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70 ml-auto">
            {result.executedEngines.length}系融合 · v{result.algorithmVersion}
          </Badge>
        </h3>
        <div className="space-y-2.5">
          {ALL_FATE_DIMENSIONS.map(dim => {
            const Icon = DIM_ICONS[dim];
            const val = fv[dim];
            return (
              <div key={dim} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${dim === 'life' ? 'text-amber-400' : dim === 'wealth' ? 'text-emerald-400' : dim === 'relation' ? 'text-rose-400' : dim === 'health' ? 'text-purple-400' : dim === 'wisdom' ? 'text-blue-400' : 'text-indigo-400'}`} />
                    <span className="text-xs text-foreground">{FATE_DIMENSION_LABELS[dim]}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${sc(val)}`}>{val}</span>
                </div>
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${DIM_BAR[dim]}`} style={{ width: `${val}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engine status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Natal engines */}
        <div className="p-3 rounded-xl bg-card/40 border border-amber-500/20">
          <h4 className="text-xs font-serif text-amber-300 flex items-center gap-1.5 mb-2">
            <Sun className="w-3.5 h-3.5" />本命引擎 ({birthEngines})
            <span className="text-[9px] text-muted-foreground font-normal ml-1">基于出生时刻</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.engineOutputs.filter(e => e.timingBasis === 'birth').map(eo => (
              <Badge key={eo.engineName} variant="outline" className="text-[9px] border-amber-500/20 text-amber-300/80">
                <CheckCircle className="w-2.5 h-2.5 mr-0.5 text-emerald-400" />{eo.engineNameCN}
              </Badge>
            ))}
          </div>
        </div>

        {/* Instant engines */}
        <div className="p-3 rounded-xl bg-card/40 border border-blue-500/20">
          <h4 className="text-xs font-serif text-blue-300 flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5" />即时引擎 ({queryEngines})
            <span className="text-[9px] text-muted-foreground font-normal ml-1">基于测算时间</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.engineOutputs.filter(e => e.timingBasis === 'query').map(eo => (
              <Badge key={eo.engineName} variant="outline" className="text-[9px] border-blue-500/20 text-blue-300/80">
                <Zap className="w-2.5 h-2.5 mr-0.5 text-blue-400" />{eo.engineNameCN}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Causal summary */}
      <p className="text-xs text-muted-foreground leading-relaxed px-1">{result.causalSummary}</p>

      {/* Warnings */}
      {result.failedEngines.length > 0 && (
        <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
          {result.failedEngines.map(fe => (
            <div key={fe.engineName} className="flex items-start gap-2 text-[10px] text-rose-400/80">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{fe.engineName}: {fe.error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
