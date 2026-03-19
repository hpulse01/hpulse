/**
 * EngineConsensusPanel — Cross-engine consensus analysis and agreement visualization
 */
import { useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UnifiedPredictionResult, FateDimension, PredictionConflict } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { useI18n } from '@/hooks/useI18n';
import { Handshake, AlertTriangle, BarChart3, ChevronRight } from 'lucide-react';

const DIM_COLORS: Record<FateDimension, string> = {
  life: 'text-amber-400', wealth: 'text-emerald-400', relation: 'text-rose-400',
  health: 'text-purple-400', wisdom: 'text-blue-400', spirit: 'text-indigo-400',
  socialStatus: 'text-yellow-400', creativity: 'text-pink-400', luck: 'text-lime-400', homeStability: 'text-teal-400',
};

const DIM_BG: Record<FateDimension, string> = {
  life: 'bg-amber-500/10', wealth: 'bg-emerald-500/10', relation: 'bg-rose-500/10',
  health: 'bg-purple-500/10', wisdom: 'bg-blue-500/10', spirit: 'bg-indigo-500/10',
  socialStatus: 'bg-yellow-500/10', creativity: 'bg-pink-500/10', luck: 'bg-lime-500/10', homeStability: 'bg-teal-500/10',
};

function agreementLevel(engines: { value: number }[]): { score: number; label: string; labelCN: string; color: string } {
  if (engines.length < 2) return { score: 1, label: 'Single', labelCN: '单引擎', color: 'text-muted-foreground/50' };
  const values = engines.map(e => e.value);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;

  if (cv < 0.1) return { score: 0.95, label: 'Strong Consensus', labelCN: '高度一致', color: 'text-emerald-400' };
  if (cv < 0.2) return { score: 0.75, label: 'Good Agreement', labelCN: '较好一致', color: 'text-blue-400' };
  if (cv < 0.35) return { score: 0.5, label: 'Moderate', labelCN: '中等分歧', color: 'text-amber-400' };
  return { score: 0.25, label: 'Divergent', labelCN: '显著分歧', color: 'text-rose-400' };
}

interface Props {
  result: UnifiedPredictionResult;
}

export function EngineConsensusPanel({ result }: Props) {
  const { dimLabel, lang } = useI18n();
  const [expandedDim, setExpandedDim] = useState<FateDimension | null>(null);

  // Per-dimension consensus analysis
  const dimAnalysis = useMemo(() => {
    return ALL_FATE_DIMENSIONS.map(dim => {
      const engineValues = result.engineOutputs.map(eo => ({
        name: lang === 'zh' ? eo.engineNameCN : eo.engineName,
        value: eo.fateVector[dim],
        confidence: eo.confidence,
        weight: result.weightsUsed.find(w => w.engineName === eo.engineName)?.weight ?? 0,
      }));
      const agreement = agreementLevel(engineValues);
      const fusedValue = result.fusedFateVector[dim];
      const conflicts = result.conflicts.filter(c => c.dimension === dim);

      return { dim, engineValues, agreement, fusedValue, conflicts };
    });
  }, [result, lang]);

  // Overall consensus score
  const overallConsensus = useMemo(() => {
    const scores = dimAnalysis.map(d => d.agreement.score);
    return scores.reduce((s, v) => s + v, 0) / scores.length;
  }, [dimAnalysis]);

  // Weight distribution (detect dominance)
  const weightStats = useMemo(() => {
    const ws = result.weightsUsed.map(w => w.weight);
    const total = ws.reduce((s, v) => s + v, 0);
    const normalized = ws.map(w => w / total);
    const hhi = normalized.reduce((s, w) => s + w * w, 0);
    const maxWeight = Math.max(...normalized);
    const dominant = result.weightsUsed.find(w => w.weight / total === maxWeight);
    return { hhi, maxWeight, dominant, total };
  }, [result.weightsUsed]);

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: lang === 'zh' ? '整体一致性' : 'Overall Consensus', value: `${Math.round(overallConsensus * 100)}%`,
            color: overallConsensus > 0.7 ? 'text-emerald-400' : overallConsensus > 0.5 ? 'text-amber-300' : 'text-rose-400' },
          { label: lang === 'zh' ? '维度冲突' : 'Dim Conflicts', value: result.conflicts.length,
            color: result.conflicts.length > 5 ? 'text-rose-400' : 'text-emerald-400' },
          { label: lang === 'zh' ? '权重集中度' : 'Weight HHI', value: `${(weightStats.hhi * 100).toFixed(0)}%`,
            color: weightStats.hhi > 0.3 ? 'text-amber-400' : 'text-emerald-400' },
          { label: lang === 'zh' ? '主导引擎' : 'Dominant', value: weightStats.dominant
            ? (lang === 'zh' ? (result.engineOutputs.find(e => e.engineName === weightStats.dominant!.engineName)?.engineNameCN || weightStats.dominant.engineName) : weightStats.dominant.engineName)
            : '—',
            color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <div className={`text-lg font-mono font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-sans">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Per-dimension consensus */}
      <div className="glass-elevated rounded-2xl p-5">
        <h3 className="text-sm font-serif text-foreground flex items-center gap-2 mb-4">
          <Handshake className="w-4 h-4 text-primary" />
          {lang === 'zh' ? '维度共识分析' : 'Dimension Consensus Analysis'}
        </h3>

        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-3">
            {dimAnalysis.map(da => {
              const isExpanded = expandedDim === da.dim;

              return (
                <div key={da.dim} className="rounded-xl border border-border/10 overflow-hidden">
                  <button onClick={() => setExpandedDim(isExpanded ? null : da.dim)}
                    className="w-full p-3.5 text-left hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ChevronRight className={`w-3 h-3 text-muted-foreground/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        <span className={`text-xs font-sans font-medium ${DIM_COLORS[da.dim]}`}>{dimLabel(da.dim)}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${DIM_BG[da.dim]} ${da.agreement.color} font-sans`}>
                          {lang === 'zh' ? da.agreement.labelCN : da.agreement.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-semibold text-foreground/70">{da.fusedValue}</span>
                        {da.conflicts.length > 0 && (
                          <span className="text-[9px] text-rose-400/60 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />{da.conflicts.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mini engine value distribution bar */}
                    <div className="mt-2 flex gap-0.5 h-1.5">
                      {da.engineValues.sort((a, b) => b.weight - a.weight).map((ev, i) => (
                        <div key={i} className="rounded-full bg-gradient-to-r from-primary/30 to-primary/60 transition-all"
                          style={{ width: `${Math.max(2, ev.value)}%`, opacity: 0.3 + ev.weight * 3 }}
                          title={`${ev.name}: ${ev.value}`} />
                      ))}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/5 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Engine breakdown */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-muted-foreground/40 font-sans">
                          {lang === 'zh' ? '各引擎评分' : 'Engine Scores'}
                        </div>
                        {da.engineValues.sort((a, b) => b.weight - a.weight).map((ev, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/50 w-20 shrink-0 truncate font-sans">{ev.name}</span>
                            <div className="flex-1 h-1.5 bg-border/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r from-primary/40 to-primary/70`}
                                style={{ width: `${ev.value}%` }} />
                            </div>
                            <span className="text-[9px] font-mono w-6 text-right text-foreground/50">{ev.value}</span>
                            <span className="text-[8px] text-muted-foreground/30 w-8 text-right font-sans">{Math.round(ev.weight * 100)}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Conflicts for this dimension */}
                      {da.conflicts.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] text-rose-400/60 font-sans flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {lang === 'zh' ? '冲突详情' : 'Conflict Details'}
                          </div>
                          {da.conflicts.map((c, ci) => (
                            <div key={ci} className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-[10px] font-sans">
                              <span className="text-foreground/50">{c.engineA}</span>
                              <span className="text-muted-foreground/30 mx-1">({c.valueA})</span>
                              <span className="text-rose-400/50 mx-1">vs</span>
                              <span className="text-foreground/50">{c.engineB}</span>
                              <span className="text-muted-foreground/30 mx-1">({c.valueB})</span>
                              <span className="text-muted-foreground/30 mx-1">Δ{c.delta}</span>
                              <div className="text-[9px] text-muted-foreground/30 mt-0.5">{c.explanation}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Weight distribution chart */}
      <div className="glass rounded-2xl p-5">
        <h4 className="text-xs font-sans text-foreground/50 flex items-center gap-2 mb-3">
          <BarChart3 className="w-3.5 h-3.5 text-primary/40" />
          {lang === 'zh' ? '引擎权重分布' : 'Engine Weight Distribution'}
        </h4>
        <div className="space-y-1.5">
          {result.weightsUsed
            .sort((a, b) => b.weight - a.weight)
            .map(w => {
              const pct = Math.round((w.weight / weightStats.total) * 100);
              const eo = result.engineOutputs.find(e => e.engineName === w.engineName);
              return (
                <div key={w.engineName} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground/60 w-20 shrink-0 truncate font-sans">
                    {lang === 'zh' ? (eo?.engineNameCN ?? w.engineName) : w.engineName}
                  </span>
                  <div className="flex-1 h-2 bg-border/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary/70 transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] font-mono w-8 text-right text-foreground/50">{pct}%</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
