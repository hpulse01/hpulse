/**
 * Engine Contribution Panel
 * Shows per-engine weight, confidence, version, timing basis, and contribution details.
 * Also renders individual engine detail sub-panels for all 13 engines.
 */
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UnifiedPredictionResult, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import {
  Shield, Sun, Zap, Layers, Sparkles, Activity,
  CheckCircle, Timer,
} from 'lucide-react';
import { useState } from 'react';

function sc(v: number) {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

const DIM_BAR: Record<FateDimension, string> = {
  life: 'bg-amber-500', wealth: 'bg-emerald-500', relation: 'bg-rose-500',
  health: 'bg-purple-500', wisdom: 'bg-blue-500', spirit: 'bg-indigo-500',
};

interface Props { result: UnifiedPredictionResult }

export function EngineContributionPanel({ result }: Props) {
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null);

  return (
    <ScrollArea className="h-[700px] pr-2">
      <div className="space-y-3">
        <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
          <Shield className="w-4 h-4" />引擎贡献层 · {result.engineOutputs.length} 个引擎
        </h3>

        {result.engineOutputs.map(eo => {
          const w = result.weightsUsed.find(w => w.engineName === eo.engineName);
          const weightPct = Math.round((w?.weight ?? 0) * 100);
          const basisLabel = eo.timingBasis === 'birth' ? '本命' : eo.timingBasis === 'query' ? '即时' : '混合';
          const basisColor = eo.timingBasis === 'birth' ? 'border-amber-500/30 text-amber-400' : eo.timingBasis === 'query' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400';
          const BasisIcon = eo.timingBasis === 'birth' ? Sun : eo.timingBasis === 'query' ? Zap : Layers;
          const isExpanded = expandedEngine === eo.engineName;

          return (
            <div key={eo.engineName} className="rounded-xl bg-card/40 border border-border/20 overflow-hidden">
              <button
                onClick={() => setExpandedEngine(isExpanded ? null : eo.engineName)}
                className="w-full p-3 text-left hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <BasisIcon className={`w-3.5 h-3.5 ${eo.timingBasis === 'birth' ? 'text-amber-400' : 'text-blue-400'}`} />
                    <span className="text-sm font-serif text-foreground">{eo.engineNameCN}</span>
                    <Badge variant="outline" className={`text-[8px] px-1 ${basisColor}`}>{basisLabel}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">权重{weightPct}%</span>
                    <span className={`text-xs font-mono font-bold ${sc(eo.confidence * 100)}`}>
                      {Math.round(eo.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${eo.confidence * 100}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground">{eo.ruleSchool} · {eo.sourceGrade}级 · v{eo.engineVersion}</span>
                  <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                    <Timer className="w-2.5 h-2.5" />{eo.computationTimeMs}ms
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-border/10 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  {/* FateVector for this engine */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground font-serif">引擎命运向量</div>
                    {ALL_FATE_DIMENSIONS.map(dim => (
                      <div key={dim} className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground w-14 shrink-0">{FATE_DIMENSION_LABELS[dim]}</span>
                        <div className="flex-1 h-1 bg-secondary/20 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${DIM_BAR[dim]}`} style={{ width: `${eo.fateVector[dim]}%` }} />
                        </div>
                        <span className={`text-[9px] font-mono w-6 text-right ${sc(eo.fateVector[dim])}`}>{eo.fateVector[dim]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Normalized Output (engine-specific detail) */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground font-serif">关键输出</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(eo.normalizedOutput).slice(0, 12).map(([k, v]) => (
                        <div key={k} className="p-1.5 rounded bg-card/30 border border-border/10">
                          <div className="text-[9px] text-muted-foreground">{k}</div>
                          <div className="text-[10px] text-foreground truncate" title={v}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Uncertainty notes */}
                  {eo.uncertaintyNotes.length > 0 && (
                    <div className="text-[9px] text-muted-foreground/60">
                      {eo.uncertaintyNotes.map((n, i) => <div key={i}>· {n}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
