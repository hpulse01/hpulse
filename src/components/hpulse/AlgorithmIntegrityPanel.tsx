import { useMemo } from 'react';
import type { EngineOutput } from '@/types/prediction';
import { AuditMetricCard } from './AuditMetricCard';
import { Activity } from 'lucide-react';

interface Props {
  engineOutputs: EngineOutput[] | undefined | null;
  className?: string;
}

/**
 * AlgorithmIntegrityPanel — top-level dashboard summarising the audit
 * health of every engine that participated in this prediction.
 */
export function AlgorithmIntegrityPanel({ engineOutputs, className }: Props) {
  const stats = useMemo(() => {
    const list = engineOutputs ?? [];
    let complete = 0, partial = 0, nsv = 0, failed = 0, totalConf = 0, totalComp = 0, warns = 0, traces = 0;
    for (const e of list) {
      const status = e.normalizedOutput?.implementationStatus ?? e.normalizedOutput?.p4ImplementationStatus ?? 'unknown';
      if (status === 'complete') complete++;
      else if (status === 'partial' || status === 'partial_rules') partial++;
      else if (status === 'needs_source_validation') nsv++;
      if (e.validationFlags?.failed?.length) failed++;
      totalConf += typeof e.confidence === 'number' ? e.confidence : 0;
      totalComp += typeof e.completenessScore === 'number' ? e.completenessScore : 0;
      warns += e.warnings?.length ?? 0;
      traces += e.explanationTrace?.length ?? 0;
    }
    const n = Math.max(1, list.length);
    return {
      total: list.length,
      complete, partial, nsv, failed,
      avgConf: (totalConf / n) * 100,
      avgComp: totalComp / n,
      warns, traces,
    };
  }, [engineOutputs]);

  if (!engineOutputs || engineOutputs.length === 0) {
    return (
      <div className={`rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground ${className ?? ''}`}>
        暂无引擎执行数据 / No engine executions to audit yet.
      </div>
    );
  }

  return (
    <section className={className}>
      <header className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <h3 className="text-xs font-mono uppercase tracking-[0.32em] text-primary/85">
          Algorithm Integrity · 算法完整性
        </h3>
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
        <AuditMetricCard label="Engines" value={stats.total} tone="gold" />
        <AuditMetricCard label="Complete" value={stats.complete} tone="success" />
        <AuditMetricCard label="Partial" value={stats.partial} tone="warning" />
        <AuditMetricCard label="Needs Src" value={stats.nsv} tone="info" />
        <AuditMetricCard label="Failed" value={stats.failed} tone={stats.failed ? 'danger' : 'default'} />
        <AuditMetricCard label="Avg Conf" value={`${stats.avgConf.toFixed(1)}%`} tone="gold" />
        <AuditMetricCard label="Avg Compl" value={`${stats.avgComp.toFixed(0)}%`} />
        <AuditMetricCard label="Warnings" value={stats.warns} tone={stats.warns > 0 ? 'warning' : 'default'} />
      </div>
    </section>
  );
}
