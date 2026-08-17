/**
 * Destiny Tree Layer — scenario stats, ranked path, model boundary and audit.
 */
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RecursiveWorldTree, CollapseResult } from '@/types/destinyTree';
import { useI18n } from '@/hooks/useI18n';
import {
  TreePine, Flag, GitBranch, ArrowRight, Sparkles,
  CheckCircle, XCircle, Shield, Activity, TrendingUp, Target,
} from 'lucide-react';
import { useState } from 'react';

function sc(v: number) {
  if (v >= 0.7) return 'text-emerald-400';
  if (v >= 0.4) return 'text-amber-300';
  return 'text-rose-400';
}

const INTENSITY_COLORS: Record<string, string> = {
  minor: 'border-border/20 text-muted-foreground/60',
  moderate: 'border-blue-500/20 text-blue-400/70',
  major: 'border-amber-500/20 text-amber-400/70',
  critical: 'border-rose-500/20 text-rose-400/70',
  life_defining: 'border-purple-500/20 text-purple-400/70',
};

interface Props {
  tree: RecursiveWorldTree;
  collapse: CollapseResult;
}

export function DestinyTreeLayer({ tree, collapse }: Props) {
  const [tab, setTab] = useState('path');
  const { t, lang } = useI18n();
  const events = collapse.collapsedPath.filter(n => n.age > 0);
  const turningPoints = events.filter(n => n.event.intensity === 'major' || n.event.intensity === 'critical' || n.event.intensity === 'life_defining');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-elevated rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-serif text-foreground flex items-center gap-2">
            <TreePine className="w-4 h-4 text-primary" />{t('tree.recursive_tree')}
          </h2>
          <span className="text-[10px] text-muted-foreground/40 font-mono font-sans">
            {tree.totalNodes} nodes · {tree.totalPaths} paths · depth {tree.maxDepth}
          </span>
        </div>
        <p className="text-xs text-muted-foreground/60 font-sans leading-relaxed">
          {lang === 'zh'
            ? `从 ${tree.totalPaths.toLocaleString()} 条候选路径中按确定性规则排序；选择稳定度 ${Math.round(collapse.selectionStability * 100)}%。分析窗口上限不是寿命预测。`
            : `${tree.totalPaths.toLocaleString()} candidate paths ranked deterministically; selection stability ${Math.round(collapse.selectionStability * 100)}%. The analysis horizon is not a lifespan estimate.`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: t('tree.nodes'), value: tree.totalNodes, icon: Activity },
          { label: t('tree.paths'), value: tree.totalPaths, icon: GitBranch },
          { label: t('tree.depth'), value: tree.maxDepth, icon: TrendingUp },
          { label: t('tree.turning_points'), value: turningPoints.length, icon: Target },
          { label: lang === 'zh' ? '分析窗口' : 'Horizon', value: `${collapse.planningHorizonAge}`, icon: Flag },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass rounded-xl p-3 text-center">
            <Icon className="w-3.5 h-3.5 mx-auto mb-1.5 text-primary/40" />
            <div className="text-base font-mono font-semibold text-foreground">{value}</div>
            <div className="text-[9px] text-muted-foreground/40 font-sans">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-border/20 h-auto p-1 rounded-xl">
          <TabsTrigger value="path" className="text-[10px] sm:text-xs py-2 rounded-lg font-sans data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{t('tree.main_path')}</TabsTrigger>
          <TabsTrigger value="rejected" className="text-[10px] sm:text-xs py-2 rounded-lg font-sans data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{t('tree.rejected')}</TabsTrigger>
          <TabsTrigger value="boundary" className="text-[10px] sm:text-xs py-2 rounded-lg font-sans data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{lang === 'zh' ? '模型边界' : 'Model Boundary'}</TabsTrigger>
          <TabsTrigger value="audit" className="text-[10px] sm:text-xs py-2 rounded-lg font-sans data-[state=active]:bg-primary/15 data-[state=active]:text-primary">{t('tree.audit')}</TabsTrigger>
        </TabsList>

        <TabsContent value="path" className="mt-4">
          <div className="glass-elevated rounded-2xl p-5">
            <ScrollArea className="h-[550px]">
              <h3 className="text-xs font-sans text-foreground/70 flex items-center gap-2 mb-4">
                <ArrowRight className="w-3.5 h-3.5 text-primary/60" />{t('tree.collapse_path')} · {events.length} {lang === 'zh' ? '节点' : 'nodes'}
              </h3>
              <div className="relative">
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border/15" />
                <div className="space-y-1.5">
                  {events.map((node, i) => (
                    <div key={i} className="relative pl-10">
                      <div className={`absolute left-[11px] top-3.5 w-[10px] h-[10px] rounded-full border-2 ${
                        node.isTerminal ? 'bg-sky-400 border-sky-400/60'
                          : node.event.isMainline ? 'bg-primary/80 border-primary/40'
                          : 'bg-muted/50 border-border/30'
                      }`} />
                      <div className={`p-3 rounded-xl border transition-colors ${
                        node.isTerminal ? 'border-sky-500/20 bg-sky-500/5' : 'border-border/10 bg-card/20 hover:bg-card/30'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-serif text-foreground">{node.age}{lang === 'zh' ? '岁' : ''}</span>
                            <span className="text-[10px] text-muted-foreground/40 font-sans">{node.year}</span>
                            {node.isTerminal && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/15 font-sans">
                                {node.terminalReason ?? 'model_boundary'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-sans ${INTENSITY_COLORS[node.event.intensity] || ''}`}>
                              {t(`intensity.${node.event.intensity}`) !== `intensity.${node.event.intensity}` ? t(`intensity.${node.event.intensity}`) : node.event.intensity}
                            </span>
                            <span className={`text-[9px] font-mono ${sc(node.cumulativeProbability)}`}>
                              {node.cumulativeProbability.toFixed(3)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-foreground/60 leading-relaxed font-sans">
                          {node.event.description.length > 120 ? node.event.description.slice(0, 120) + '…' : node.event.description}
                        </p>
                        {node.engineSupports.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {node.engineSupports.map(e => (
                              <span key={e} className="text-[8px] px-1.5 py-0.5 rounded-full border border-border/10 text-muted-foreground/40 font-sans">{e}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <div className="glass-elevated rounded-2xl p-5">
            <ScrollArea className="h-[450px]">
              {collapse.rejectedBranches.length === 0 ? (
                <div className="p-8 text-center">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 text-primary/40" />
                  <p className="text-xs text-muted-foreground/40 font-sans">{t('tree.no_rejected')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collapse.rejectedBranches.map((b, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border/10 bg-card/15 opacity-60 hover:opacity-80 transition-opacity">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground/60 font-sans">{b.branchAge}{t('common.age')}{lang === 'zh' ? '分叉' : ' fork'}</span>
                        <span className="text-[10px] font-mono text-destructive/60">rank={b.probability.toFixed(4)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/50 font-sans">{b.branchEvent}</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-0.5 font-sans">{b.rejectedReason}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="boundary" className="mt-4">
          <div className="glass-elevated rounded-2xl p-5 space-y-4">
            <div className="p-5 rounded-xl border border-sky-500/15 bg-sky-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="w-5 h-5 text-sky-300/70" />
                <span className="text-sm font-serif text-foreground/80">{lang === 'zh' ? '有限模型边界' : 'Finite model boundary'} · {collapse.terminalAge}{t('common.age')}</span>
              </div>
              <p className="text-xs text-foreground/60 mb-3 font-sans leading-relaxed">{collapse.terminalDescription}</p>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground/50 font-sans">
                <span>{lang === 'zh' ? '停止原因' : 'Stop reason'}: <strong className="text-sky-300/80">{collapse.terminalReason}</strong></span>
                <span>{lang === 'zh' ? '选择稳定度' : 'Selection stability'}: <strong className={sc(collapse.selectionStability)}>{Math.round(collapse.selectionStability * 100)}%</strong></span>
              </div>
              {collapse.horizonReason && (
                <p className="text-[10px] text-muted-foreground/50 mt-2 font-sans">{collapse.horizonReason}</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="glass-elevated rounded-2xl p-5">
            <ScrollArea className="h-[450px]">
              <div className="space-y-3">
                {collapse.dominantEngines.length > 0 && (
                  <div className="p-4 rounded-xl border border-border/10 bg-card/20">
                    <div className="text-[10px] text-muted-foreground/40 font-sans mb-2">{t('tree.dominant_engines')}</div>
                    <div className="flex gap-1.5">
                      {collapse.dominantEngines.map(e => (
                        <span key={e} className="text-[10px] px-2 py-0.5 rounded-full border border-primary/20 text-primary/70 font-sans">{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border border-border/10 bg-card/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400/60" />
                    <span className="text-[10px] text-muted-foreground/40 font-sans">{t('tree.selection_reason')}</span>
                  </div>
                  <p className="text-[11px] text-foreground/50 leading-relaxed font-sans">{collapse.selectedReason}</p>
                </div>

                {collapse.conflictResolutionNotes.length > 0 && (
                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/3">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-3.5 h-3.5 text-amber-400/60" />
                      <span className="text-[10px] text-muted-foreground/40 font-sans">{t('tree.conflict_resolution')}</span>
                    </div>
                    {collapse.conflictResolutionNotes.map((note, i) => (
                      <p key={i} className="text-[10px] text-foreground/40 font-sans">{note}</p>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl border border-border/10 bg-card/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-3.5 h-3.5 text-primary/40" />
                    <span className="text-[10px] text-muted-foreground/40 font-sans">{t('tree.collapse_reasoning')}</span>
                  </div>
                  <p className="text-[11px] text-foreground/50 leading-relaxed font-sans">{collapse.collapseReasoning}</p>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                    <span className="text-[10px] text-primary/60 font-sans">{t('tree.final_summary')}</span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed font-sans">{collapse.finalLifeSummary}</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
