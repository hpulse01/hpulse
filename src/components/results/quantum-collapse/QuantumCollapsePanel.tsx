import type { ReactNode } from 'react';
import type { QuantumPredictionResult } from '@/utils/quantumPredictionEngine';
import { formatPercent, formatScore } from '@/utils/displayFormat';

interface Props {
  quantumResult?: QuantumPredictionResult | null;
}

/**
 * Scenario-fusion diagnostic panel for the deterministic event tree.
 *
 * Super-admin diagnostic view: read-only summary of what already exists in
 * QuantumPredictionResult (event-driven collapse pipeline).
 */
export function QuantumCollapsePanel({ quantumResult }: Props) {
  if (!quantumResult) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        情景融合数据尚未生成 / Scenario fusion not available.
      </div>
    );
  }

  const tree = quantumResult.destinyTree;
  const collapse = quantumResult.collapseResult;
  const phases = quantumResult.destinyPhases ?? [];
  const timeline = quantumResult.destinyTimeline ?? [];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">情景融合 · Scenario Fusion</h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/40 text-amber-300/85 bg-amber-500/5">
          legacy / event-driven
        </span>
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          agreement {formatPercent(quantumResult.overallCoherence)}
        </span>
      </header>

      <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-100/85">
        当前展示确定性情景排序诊断；稳定度和权重不是事件发生概率。
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Metric label="totalWorlds" value={quantumResult.totalWorldsGenerated ?? '—'} />
        <Metric label="tree.nodes" value={tree?.totalNodes ?? '—'} />
        <Metric label="tree.paths" value={tree?.totalPaths ?? '—'} />
        <Metric label="collapsed.steps" value={collapse?.collapsedPath?.length ?? '—'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Metric label="paths considered" value={collapse?.totalPathsConsidered ?? '—'} />
        <Metric label="analysis horizon" value={collapse?.planningHorizonAge ?? '—'} />
        <Metric label="agreement" value={formatScore((quantumResult.overallCoherence ?? 0) * 100)} />
        <Metric label="phases" value={phases.length} />
      </div>

      {/* Collapsed path summary */}
      {collapse?.collapsedPath && collapse.collapsedPath.length > 0 && (
        <Section title={`最高排序路径 · Top-Ranked Path (${collapse.collapsedPath.length} steps)`}>
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
            <ol className="inline-flex gap-1.5 min-w-full">
              {collapse.collapsedPath.slice(0, 24).map((node, i) => (
                <li key={i} className="shrink-0 rounded border border-primary/20 bg-card/40 px-2.5 py-1.5 min-w-[110px]">
                  <div className="text-[9px] font-mono text-muted-foreground/70 uppercase">step {i + 1}</div>
                  <div className="text-[11px] text-foreground/90 font-serif truncate" title={JSON.stringify(node)}>
                    {summarizeNode(node)}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      )}

      {/* Phases */}
      {phases.length > 0 && (
        <Section title={`生命阶段 · Destiny Phases (${phases.length})`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {phases.slice(0, 8).map((p, i) => (
              <div key={i} className="rounded border border-primary/15 bg-card/30 px-3 py-2">
                <div className="text-[10px] font-mono text-muted-foreground/70 uppercase">
                  {('startAge' in p ? `${p.startAge}` : '?')}–{('endAge' in p ? `${p.endAge}` : '?')}
                </div>
                <div className="text-xs font-serif text-foreground/85 truncate">
                  {('phaseName' in p ? String(p.phaseName) : 'phase')}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Timeline events count */}
      {timeline.length > 0 && (
        <Section title={`事件时间线 · Destiny Timeline (${timeline.length})`}>
          <ul className="space-y-1 text-[11px] font-mono text-foreground/80 max-h-64 overflow-y-auto">
            {timeline.slice(0, 60).map((e, i) => {
              const rec = e as unknown as Record<string, unknown>;
              const age = rec.age;
              const desc = rec.description;
              const descText = typeof desc === 'string'
                ? desc
                : typeof desc === 'number' || typeof desc === 'boolean'
                  ? String(desc)
                  : '—';
              return (
                <li key={i} className="border-b border-primary/5 py-1 break-words">
                  · {age != null ? `[age ${age}] ` : ''}{descText}
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </div>
  );
}

function summarizeNode(node: unknown): string {
  if (!node || typeof node !== 'object') return '—';
  const o = node as Record<string, unknown>;
  if (typeof o.label === 'string') return o.label;
  if (typeof o.description === 'string') return o.description;
  if (typeof o.event === 'string') return o.event;
  if (typeof o.age === 'number') return `age ${o.age}`;
  return Object.keys(o).slice(0, 3).join(', ');
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-primary/20 bg-card/40 px-3 py-2 text-center">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">{label}</div>
      <div className="mt-0.5 font-serif text-base text-primary/90 tabular-nums">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">{title}</div>
      {children}
    </div>
  );
}
