/**
 * Destiny Tree Visualization Panel v3.0
 *
 * Shows the recursive event-driven world tree, collapsed path,
 * rejected branches, death fusion, and collapse audit details.
 */

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RecursiveWorldTree, CollapseResult, CollapsedPathNode, RejectedBranchSummary } from '@/types/destinyTree';
import {
  TreePine, Skull, GitBranch, ArrowRight, Sparkles,
  CheckCircle, XCircle, Shield, Activity, TrendingUp, FileSearch,
} from 'lucide-react';
import { useState } from 'react';

function scoreColor(v: number): string {
  if (v >= 0.7) return 'text-emerald-400';
  if (v >= 0.4) return 'text-amber-300';
  return 'text-rose-400';
}

const DEATH_CAUSE_LABELS: Record<string, string> = {
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

function CollapsedPathView({ path }: { path: CollapsedPathNode[] }) {
  const events = path.filter(n => n.age > 0);
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
        <ArrowRight className="w-4 h-4" />坍缩命运路径 ({events.length} 个节点)
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
                        {DEATH_CAUSE_LABELS[node.deathCause || ''] || '终'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[8px] px-1 ${INTENSITY_COLORS[node.event.intensity] || ''}`}>
                      {node.event.intensity}
                    </Badge>
                    <span className={`text-[10px] font-mono ${scoreColor(node.cumulativeProbability)}`}>
                      P={node.cumulativeProbability.toFixed(3)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {node.event.description.length > 100 ? node.event.description.slice(0, 100) + '...' : node.event.description}
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
    </div>
  );
}

function RejectedBranchesView({ branches }: { branches: RejectedBranchSummary[] }) {
  if (branches.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        <Sparkles className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
        命运路径高度确定，无显著被拒绝支线
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
        <GitBranch className="w-4 h-4" />被坍缩的支线 ({branches.length})
      </h3>
      {branches.map((b, i) => (
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
  );
}

function TreeStatsView({ tree, collapse }: { tree: RecursiveWorldTree; collapse: CollapseResult }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-serif text-primary flex items-center gap-1.5">
        <TreePine className="w-4 h-4" />命运树统计
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: '总节点', value: tree.totalNodes, icon: Activity },
          { label: '总路径', value: tree.totalPaths, icon: GitBranch },
          { label: '最大深度', value: tree.maxDepth, icon: TrendingUp },
          { label: '坍缩寿命', value: `${collapse.deathAge}岁`, icon: Skull },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-3 rounded-lg bg-card/30 border border-border/20 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1 text-primary/60" />
            <div className="text-lg font-mono font-bold text-foreground">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Death info */}
      <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center gap-2 mb-1">
          <Skull className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-serif text-rose-300">终局判定</span>
        </div>
        <p className="text-xs text-foreground/80">{collapse.deathDescription}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          <span>死因: <strong className="text-rose-400">{DEATH_CAUSE_LABELS[collapse.deathCause] || collapse.deathCause}</strong></span>
          <span>置信度: <strong className={scoreColor(collapse.collapseConfidence)}>{Math.round(collapse.collapseConfidence * 100)}%</strong></span>
        </div>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{collapse.deathBoundaryReason}</p>
      </div>

      {/* Dominant engines */}
      {collapse.dominantEngines.length > 0 && (
        <div className="p-3 rounded-lg border border-primary/20 bg-card/30">
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
      <div className="p-3 rounded-lg border border-primary/20 bg-card/30">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-serif text-primary">选择理由</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{collapse.selectedReason}</p>
      </div>

      {/* Conflict resolution */}
      {collapse.conflictResolutionNotes.length > 0 && (
        <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
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
      <div className="p-3 rounded-lg border border-primary/20 bg-card/30">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary/60" />
          <span className="text-xs font-serif text-primary">坍缩推理</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">{collapse.collapseReasoning}</p>
      </div>

      {/* Life summary */}
      <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-serif text-primary">命运总评</span>
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{collapse.finalLifeSummary}</p>
      </div>
    </div>
  );
}

interface DestinyTreePanelProps {
  tree: RecursiveWorldTree;
  collapse: CollapseResult;
}

export function DestinyTreePanel({ tree, collapse }: DestinyTreePanelProps) {
  const [activeTab, setActiveTab] = useState('path');

  return (
    <div className="space-y-4">
      <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-serif text-primary flex items-center gap-1.5">
            <TreePine className="w-4 h-4" />递归命运树 · 量子坍缩
          </h2>
          <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/70 font-mono">
            {tree.totalNodes}节点 · {tree.totalPaths}路径
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          由{tree.totalPaths}条命运路径坍缩为唯一确定态，终止于{collapse.deathAge}岁({DEATH_CAUSE_LABELS[collapse.deathCause] || '寿终'})。
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-secondary/30 border border-primary/20 h-auto">
          <TabsTrigger value="path" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            坍缩路径
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            被拒支线({collapse.rejectedBranches.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            审计详情
          </TabsTrigger>
        </TabsList>

        <TabsContent value="path" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[600px] pr-2">
              <CollapsedPathView path={collapse.collapsedPath} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[500px] pr-2">
              <RejectedBranchesView branches={collapse.rejectedBranches} />
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="bg-card/40 border border-primary/20 rounded-xl p-4">
            <ScrollArea className="h-[600px] pr-2">
              <TreeStatsView tree={tree} collapse={collapse} />
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
