import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminOrchestrationSnapshot } from '@/types/unifiedPrediction';
import { assertSuperAdminAccess } from '@/utils/predictionAccess';
import type { UserProfile } from '@/hooks/useAuth';
import { Activity, GitBranch, Shield, Weight, AlertTriangle, Database, Users } from 'lucide-react';

interface Props {
  profile: UserProfile | null;
  snapshot: AdminOrchestrationSnapshot;
}

export function AdminOrchestrationConsole({ profile, snapshot }: Props) {
  assertSuperAdminAccess(profile);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: '事件候选', value: snapshot.totalEventCandidates, icon: Activity },
          { label: '世界树节点', value: snapshot.totalWorldNodes, icon: GitBranch },
          { label: '路径总数', value: snapshot.totalPaths, icon: Shield },
          { label: '剪枝阈值', value: snapshot.pruningThreshold, icon: Weight },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="bg-card/60 border-border/40">
              <CardContent className="flex items-center gap-3 p-4">
                <Icon className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-lg font-semibold text-foreground">{item.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card/60 border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-primary" />13 引擎覆盖矩阵</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {snapshot.engineCoverageMatrix.map((engine) => (
            <div key={engine.engineId} className="rounded-lg border border-border/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{engine.engineId}</span>
                  <Badge variant="outline">{engine.status}</Badge>
                  <Badge variant="outline">权重 {Math.round(engine.contributionWeight * 100)}%</Badge>
                </div>
                <div className="text-xs text-muted-foreground">completeness {Math.round(engine.completenessScore * 100)}%</div>
              </div>
              <div className="mt-2 grid gap-2 text-xs md:grid-cols-4">
                <div>真实执行：{engine.realExecution ? '是' : '否'}</div>
                <div>事件输出：{engine.structuredEvents ? engine.eventCandidateCount : 0}</div>
                <div>解释轨迹：{engine.explanationTrace ? '有' : '无'}</div>
                <div>测试覆盖：{engine.tested ? '有' : '无'}</div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">风险：{engine.pseudoImplementationRisk} · 下一缺口：{engine.nextGap}</div>
              {engine.warnings.length > 0 && (
                <div className="mt-2 flex items-start gap-2 text-xs text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3 w-3" />
                  <span>{engine.warnings.join('；')}</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-card/60 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-primary" />坍缩与执行摘要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            {snapshot.collapse ? (
              <>
                <div>死亡边界：{snapshot.collapse.deathAge} 岁 · {snapshot.collapse.deathCause}</div>
                <div>坍缩置信度：{Math.round(snapshot.collapse.collapseConfidence * 100)}%</div>
                <div>{snapshot.collapse.selectedReason}</div>
              </>
            ) : (
              <div>当前无坍缩结果。</div>
            )}
            <div className="border-t border-border/20 pt-2">
              {snapshot.executionSummary.map((entry) => (
                <div key={`${entry.engineName}-${entry.startedAt}`}>
                  {entry.engineName} · {entry.timingBasis} · {entry.success ? 'ok' : entry.errorMessage} · {entry.durationMs}ms
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm"><Users className="h-4 w-4 text-primary" />能力映射与后台口径</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            {Object.entries(snapshot.userAccessPolicy).map(([role, permissions]) => (
              <div key={role}>
                <div className="font-medium text-foreground">{role}</div>
                <div>{permissions.join(' · ')}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
