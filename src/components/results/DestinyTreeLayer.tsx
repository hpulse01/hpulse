/**
 * Destiny Tree Layer — Shows event seeds, fusion, tree generation, death termination, collapse path
 * Combines what was previously in DestinyTreePanel into a more complete visualization.
 */
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RecursiveWorldTree, CollapseResult, CollapsedPathNode, RejectedBranchSummary } from '@/types/destinyTree';
import {
  TreePine, Skull, GitBranch, ArrowRight, Sparkles,
  CheckCircle, XCircle, Shield, Activity, TrendingUp, FileSearch,
  Layers, Target,
} from 'lucide-react';
import { useState } from 'react';

function sc(v: number) {
  if (v >= 0.7) return 'text-emerald-400';
  if (v >= 0.4) return 'text-amber-300';
  return 'text-rose-400';
}

const DEATH_LABELS: Record<string, string> = {
  natural_aging: '自然寿终', illness: '疾病', accident: '意外',
  violence: '暴力', sudden: '突发', lifespan_limit: '寿限',
};

const INTENSITY_COLORS: Record<string, string> = {
  minor: 'border-border/30 text-muted-foreground',
  moderate: 'border-blue-500/30 text-blue-400',
  major: 'border-amber-500/30 text-amber-400',
  critical: 'border-rose-500/30 text-rose-400',
  life_defining: 'border-fuchsia-500/30 text-fuchsia-400',
};

interface Props {
  tree: RecursiveWorldTree;
  collapse: CollapseResult;
}

export function DestinyTreeLayer({ tree, collapse }: Props) {
  const [tab, setTab] = useState('path');

  const events = collapse.collapsedPath.filter(n => n.age > 0);
  const turningPoints = events.filter(n => n.event.intensity === 'major' || n.event.intensity === 'critical' || n.event.intensity === 'life_defining');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-xl bg-card/40 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-serif text-primary flex items-center gap-1.5">
            <TreePine className="w-4 h-4" />递归命运树 · 量子坍缩
          </h2>
          <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70 font-mono">
            {tree.totalNodes}节点 · {tree.totalPaths}路径 · 深度{tree.maxDepth}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          由{tree.totalPaths}条命运路径坍缩为唯一确定态，终止于{collapse.deathAge}岁({DEATH_LABELS[collapse.deathCause] || '寿终'})。
          置信度 {Math.round(collapse.collapseConfidence * 100)}%。
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: '总节点', value: tree.totalNodes, icon: Activity },
          { label: '总路径', value: tree.totalPaths, icon: GitBranch },
          { label: '最大深度', value: tree.maxDepth, icon: TrendingUp },
          { label: '关键转折', value: turningPoints.length, icon: Target },
          { label: '坍缩寿命', value: `${collapse.deathAge}岁`, icon: Skull },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-3 rounded-lg bg-card/30 border border-border/20 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-primary/60" />
            <div className="text-lg font-mono font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary/30 border border-primary/20 h-auto">
          <TabsTrigger value="path" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">坍缩主路径</TabsTrigger>
          <TabsTrigger value="rejected" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">被拒支线({collapse.rejectedBranches.length})</TabsTrigger>
          <TabsTrigger value="death" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">终局判定</TabsTrigger>
          <TabsTrigger value="audit" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">坍缩审计</TabsTrigger>
        </TabsList>

        <TabsContent value="path" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[600px] pr-2">
              <h3 className="text-sm font-serif text-primary flex items-center gap-1.5 mb-3">
                <ArrowRight className="w-4 h-4" />唯一坍缩路径 ({events.length} 个节点)
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-primary/20" />
                <div className="space-y-1">
                  {events.map((node, i) => (
                    <div key={i} className="relative pl-10">
                      <div className={`absolute left-[11px] top-3 w-[10px] h-[10px] rounded-full border-2 ${
                        node.isDeath ? 'bg-rose-500 border-rose-400'
                          : node.event.isMainline ? 'bg-primary border-primary'
                          : 'bg-muted border-muted-foreground'
                      }`} />
                      <div className={`p-3 rounded-lg border ${
                        node.isDeath ? 'border-rose-500/30 bg-rose-500/5' : 'border-border/20 bg-card/30'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-serif text-foreground">{node.age}岁</span>
                            <span className="text-[10px] text-muted-foreground">({node.year}年)</span>
                            {node.isDeath && (
                              <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-400">
                                <Skull className="w-3 h-3 mr-0.5" />
                                {DEATH_LABELS[node.deathCause || ''] || '终'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[8px] px-1 ${INTENSITY_COLORS[node.event.intensity] || ''}`}>
                              {node.event.intensity}
                            </Badge>
                            <span className={`text-[10px] font-mono ${sc(node.cumulativeProbability)}`}>
                              P={node.cumulativeProbability.toFixed(3)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {node.event.description.length > 120 ? node.event.description.slice(0, 120) + '...' : node.event.description}
                        </p>
                        {node.engineSupports.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {node.engineSupports.map(e => (
                              <Badge key={e} variant="outline" className="text-[8px] px-1 border-primary/20 text-primary/70">{e}</Badge>
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
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              {collapse.rejectedBranches.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                  命运路径高度确定，无显著被拒支线
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4" />被拒支线 ({collapse.rejectedBranches.length})
                  </h3>
                  {collapse.rejectedBranches.map((b, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/20 bg-card/20 opacity-70">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{b.branchAge}岁分叉</span>
                        <span className="text-[10px] font-mono text-rose-400">P={b.probability.toFixed(4)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80">{b.branchEvent}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{b.rejectedReason}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="death" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4 space-y-4">
            {/* Death determination */}
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Skull className="w-5 h-5 text-rose-400" />
                <span className="text-sm font-serif text-rose-300">终局判定 · {collapse.deathAge}岁</span>
              </div>
              <p className="text-xs text-foreground/80 mb-2">{collapse.deathDescription}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>死因: <strong className="text-rose-400">{DEATH_LABELS[collapse.deathCause] || collapse.deathCause}</strong></span>
                <span>置信度: <strong className={sc(collapse.collapseConfidence)}>{Math.round(collapse.collapseConfidence * 100)}%</strong></span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">{collapse.deathBoundaryReason}</p>
            </div>

            {/* Death fusion candidates */}
            {tree.deathFusion && (
              <div className="space-y-2">
                <h4 className="text-xs font-serif text-rose-300">死亡候选融合</h4>
                {tree.deathFusion.strongCandidates.length > 0 && (
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                    <div className="text-[10px] text-rose-400 mb-1">强候选 ({tree.deathFusion.strongCandidates.length})</div>
                    {tree.deathFusion.strongCandidates.map((dc, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground">
                        · {dc.estimatedAge}岁 ({dc.cause}) — {dc.engines.join('+')} — {dc.description}
                      </div>
                    ))}
                  </div>
                )}
                {tree.deathFusion.weakCandidates.length > 0 && (
                  <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                    <div className="text-[10px] text-amber-400 mb-1">弱候选 ({tree.deathFusion.weakCandidates.length})</div>
                    {tree.deathFusion.weakCandidates.map((dc, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground">
                        · {dc.estimatedAge}岁 ({dc.cause}) — {dc.engines.join('+')}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/60">{tree.deathFusion.fusionReasoning}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4 space-y-4">
            <ScrollArea className="h-[500px] pr-2">
              {/* Dominant engines */}
              {collapse.dominantEngines.length > 0 && (
                <div className="p-3 rounded-lg border border-primary/20 bg-card/30 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSearch className="w-4 h-4 text-primary/60" />
                    <span className="text-xs font-serif text-primary">主导引擎</span>
                  </div>
                  <div className="flex gap-1.5">
                    {collapse.dominantEngines.map(e => (
                      <Badge key={e} variant="outline" className="text-[9px] border-primary/30 text-primary">{e}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected reason */}
              <div className="p-3 rounded-lg border border-primary/20 bg-card/30 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-serif text-primary">选择理由</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{collapse.selectedReason}</p>
              </div>

              {/* Conflict resolution */}
              {collapse.conflictResolutionNotes.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-serif text-amber-300">冲突解决</span>
                  </div>
                  {collapse.conflictResolutionNotes.map((note, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">{note}</p>
                  ))}
                </div>
              )}

              {/* Collapse reasoning */}
              <div className="p-3 rounded-lg border border-primary/20 bg-card/30 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary/60" />
                  <span className="text-xs font-serif text-primary">坍缩推理</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{collapse.collapseReasoning}</p>
              </div>

              {/* Final life summary */}
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-serif text-primary">命运总评</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{collapse.finalLifeSummary}</p>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
