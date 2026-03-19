/**
 * Engine Contribution Panel — per-engine details (bilingual)
 */
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UnifiedPredictionResult, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { useI18n } from '@/hooks/useI18n';
import { Timer, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const DIM_BAR: Record<FateDimension, string> = {
  life: 'from-amber-500 to-amber-600', wealth: 'from-emerald-500 to-emerald-600',
  relation: 'from-rose-500 to-rose-600', health: 'from-purple-500 to-purple-600',
  wisdom: 'from-blue-500 to-blue-600', spirit: 'from-indigo-500 to-indigo-600',
  socialStatus: 'from-yellow-500 to-yellow-600', creativity: 'from-pink-500 to-pink-600',
  luck: 'from-lime-500 to-lime-600', homeStability: 'from-teal-500 to-teal-600',
};

function sc(v: number) {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

interface Props { result: UnifiedPredictionResult }

export function EngineContributionPanel({ result }: Props) {
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null);
  const { t, dimLabel, lang } = useI18n();

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-2.5 pr-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-serif text-foreground">{t('engine_panel.title')}</h3>
          <span className="text-[10px] text-muted-foreground/50 font-sans">{result.engineOutputs.length} engines</span>
        </div>

        {result.engineOutputs.map(eo => {
          const w = result.weightsUsed.find(w => w.engineName === eo.engineName);
          const weightPct = Math.round((w?.weight ?? 0) * 100);
          const basisKey = eo.timingBasis === 'birth' ? 'engine_panel.natal_label' : eo.timingBasis === 'query' ? 'engine_panel.instant_label' : 'engine_panel.mixed_label';
          const basisBg = eo.timingBasis === 'birth' ? 'bg-amber-500/10 text-amber-400/80 border-amber-500/20' : 'bg-blue-500/10 text-blue-400/80 border-blue-500/20';
          const isExpanded = expandedEngine === eo.engineName;

          return (
            <div key={eo.engineName} className="glass rounded-xl overflow-hidden transition-all">
              <button
                onClick={() => setExpandedEngine(isExpanded ? null : eo.engineName)}
                className="w-full p-4 text-left hover:bg-primary/3 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    <span className="text-sm font-serif text-foreground">{lang === 'zh' ? eo.engineNameCN : eo.engineName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-sans ${basisBg}`}>{t(basisKey)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground/50 font-sans">{weightPct}%</span>
                    <span className={`text-sm font-mono font-semibold ${sc(eo.confidence * 100)}`}>
                      {Math.round(eo.confidence * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-border/15 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary/40 to-primary/60" style={{ width: `${eo.confidence * 100}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] text-muted-foreground/40 font-sans">{eo.ruleSchool} · {eo.sourceGrade} · v{eo.engineVersion}</span>
                  <span className="text-[9px] text-muted-foreground/40 font-sans flex items-center gap-0.5">
                    <Timer className="w-2.5 h-2.5" />{eo.computationTimeMs}ms
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-border/10 pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground/50 font-sans">{t('engine_panel.fate_vector')}</div>
                    {ALL_FATE_DIMENSIONS.map(dim => (
                      <div key={dim} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/60 w-12 shrink-0 font-sans">{dimLabel(dim)}</span>
                        <div className="flex-1 h-1 bg-border/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${DIM_BAR[dim]}`} style={{ width: `${eo.fateVector[dim]}%` }} />
                        </div>
                        <span className={`text-[9px] font-mono w-6 text-right ${sc(eo.fateVector[dim])}`}>{eo.fateVector[dim]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] text-muted-foreground/50 font-sans">{t('engine_panel.key_outputs')}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(eo.normalizedOutput).slice(0, 12).map(([k, v]) => (
                        <div key={k} className="p-2 rounded-lg bg-card/30 border border-border/10">
                          <div className="text-[9px] text-muted-foreground/40 font-sans">{k}</div>
                          <div className="text-[10px] text-foreground/70 truncate font-sans" title={v}>{v || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {eo.uncertaintyNotes.length > 0 && (
                    <div className="text-[9px] text-muted-foreground/40 font-sans space-y-0.5">
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
