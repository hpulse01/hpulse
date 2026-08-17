/**
 * HPulseProjectionPanel — consumes ProjectionView (HPU-8) only.
 *
 * Renders the deterministic pipeline (HPU-2..7) output as the primary
 * results panel. No legacy types touched.
 */
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Atom, Skull, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Activity, Hourglass, Layers,
} from 'lucide-react';
import { FATE_DIMENSION_LABELS } from '@/types/prediction';
import type { ProjectionView } from '@/hpulse/projection';

const STAGE_LABELS_CN: Record<string, string> = {
  child: '童年', youth: '青年', adult: '壮年', senior: '中老年', elder: '晚年',
};
const STATUS_STYLES: Record<string, string> = {
  ok: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/5',
  degraded: 'border-amber-500/30 text-amber-300 bg-amber-500/5',
  skipped: 'border-muted-foreground/30 text-muted-foreground bg-card/30',
};

function scoreColor(v: number): string {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

export interface HPulseProjectionPanelProps {
  status: 'idle' | 'running' | 'ready' | 'error';
  view: ProjectionView | null;
  error?: string | null;
  /** Raw terminus/lifespan synthesis is restricted to the algorithm audit UI. */
  showSensitiveTerminus?: boolean;
}

export function HPulseProjectionPanel({
  status,
  view,
  error,
  showSensitiveTerminus = false,
}: HPulseProjectionPanelProps) {
  if (status === 'idle') return null;

  if (status === 'running') {
    return (
      <div className="rounded-xl border border-primary/20 bg-card/40 p-4 flex items-center gap-2 text-xs text-primary/80">
        <Atom className="w-4 h-4 animate-spin" />
        HPulse 管线运行中…（HPU-2 → HPU-7 → 投影）
      </div>
    );
  }

  if (status === 'error' || !view || !view.ok) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-300">
        <div className="flex items-center gap-2 font-serif mb-1">
          <AlertTriangle className="w-4 h-4" /> HPulse 管线失败
        </div>
        <div className="text-[11px] text-rose-300/80 font-mono break-all">
          {error || view?.reason || 'unknown_failure'}
        </div>
      </div>
    );
  }

  const { header, fateDimensions, engines, stages, death, warnings, explanationTrace } = view;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            <span className="font-serif text-sm text-primary">HPulse 管线投影</span>
            <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary/80">
              {header.quantumSignature}
            </Badge>
          </div>
          <Badge variant="outline" className="text-[9px] border-primary/20 text-muted-foreground">
            v{view.version}
          </Badge>
        </div>
        <p className="text-[11px] text-foreground/85 leading-relaxed mb-3">{header.summary}</p>
        <div className={`grid grid-cols-2 ${showSensitiveTerminus ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-2 text-center`}>
          <Stat label="总分" value={header.overallScore.toFixed(0)} hue={scoreColor(header.overallScore)} />
          <Stat label="置信度" value={`${(header.overallConfidence * 100).toFixed(0)}%`} />
          <Stat label="引擎覆盖" value={`${header.enginesActive}/${header.enginesConsidered}`} />
          <Stat label="主导阶段" value={STAGE_LABELS_CN[header.dominantStage] ?? header.dominantStage} />
          {showSensitiveTerminus && (
            <Stat label="终局峰值" value={header.deathAge != null ? `${header.deathAge}岁` : '—'} hue="text-rose-300" />
          )}
        </div>
      </div>

      {/* Stages timeline */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Hourglass className="w-4 h-4 text-primary" />
          <span className="font-serif text-sm text-primary">五阶段命运轨迹</span>
        </div>
        {stages.map((s) => (
          <div key={s.stage} className="p-2.5 rounded-lg bg-background/40 border border-border/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-serif text-foreground">{STAGE_LABELS_CN[s.stage] ?? s.stage}</span>
                <span className="text-[10px] text-muted-foreground">{s.startAge}–{s.endAge}岁 · 枢{s.pivotAge}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${scoreColor(s.stageScore)}`}>{s.stageScore.toFixed(0)}</span>
                <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                  置信 {(s.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
            <div className="h-1 bg-secondary/30 rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${s.stageScore}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex gap-2">
                {s.topDimensions.map((d) => (
                  <span key={d.dimension}>
                    {FATE_DIMENSION_LABELS[d.dimension]}·{d.score.toFixed(0)}
                  </span>
                ))}
              </div>
              <span>
                {s.dominantEngine ? `主导:${s.dominantEngine}` : '—'} · Δ{s.transitionMagnitude.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Fate dimensions */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-serif text-sm text-primary">十维命运向量（排名）</span>
        </div>
        {fateDimensions.map((d) => (
          <div key={d.dimension} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-6 font-mono">#{d.rank}</span>
            <span className="text-xs text-foreground w-16 shrink-0">{FATE_DIMENSION_LABELS[d.dimension]}</span>
            <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${d.bucket === 'top' ? 'bg-emerald-500' : d.bucket === 'bottom' ? 'bg-rose-500' : 'bg-amber-400'}`}
                style={{ width: `${d.score}%` }}
              />
            </div>
            <span className={`text-xs font-mono w-8 text-right ${scoreColor(d.score)}`}>{d.score.toFixed(0)}</span>
          </div>
        ))}
      </div>

      {/* Raw terminus synthesis is retained for super-admin algorithm auditing only. */}
      {showSensitiveTerminus && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-rose-300" />
            <span className="font-serif text-sm text-rose-200">终局合成（Death Fusion）</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <Stat label="峰值年龄" value={`${death.peakAge}岁`} hue="text-rose-300" />
            <Stat label="窗口" value={`${death.startAge}–${death.endAge}`} />
            <Stat label="强度" value={death.strength} />
            <Stat label="主因" value={death.cause} />
          </div>
          {death.causalChain.length > 0 && (
            <div className="text-[10px] text-muted-foreground pt-1">
              因果链：{death.causalChain.join(' → ')}
            </div>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {death.contributingEngines.map((e) => (
              <Badge key={e} variant="outline" className="text-[9px] border-rose-500/20 text-rose-300">{e}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Engines */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="font-serif text-sm text-primary">引擎状态（{engines.length}）</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {engines.map((e) => (
            <div key={e.engineId} className={`flex items-center gap-2 p-1.5 rounded-md border text-[11px] ${STATUS_STYLES[e.status]}`}>
              {e.status === 'ok'
                ? <CheckCircle className="w-3 h-3 shrink-0" />
                : e.status === 'degraded'
                  ? <AlertTriangle className="w-3 h-3 shrink-0" />
                  : <XCircle className="w-3 h-3 shrink-0" />}
              <span className="truncate flex-1">{e.engineName}</span>
              <span className="font-mono text-[9px] opacity-70">w{(e.averageWeight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2 text-amber-200 font-serif text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> 警告 ({warnings.length})
          </div>
          <ScrollArea className="max-h-32">
            <ul className="space-y-1 text-[10px] text-amber-200/80 list-disc pl-4">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </ScrollArea>
        </div>
      )}

      {/* Trace */}
      {explanationTrace.length > 0 && (
        <details className="rounded-xl border border-border/30 bg-card/30 p-3">
          <summary className="cursor-pointer text-xs font-serif text-primary flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> 解释轨迹 ({explanationTrace.length})
          </summary>
          <ScrollArea className="max-h-48 mt-2">
            <ol className="space-y-0.5 text-[10px] font-mono text-muted-foreground pl-4 list-decimal">
              {explanationTrace.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </ScrollArea>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value, hue }: { label: string; value: string; hue?: string }) {
  return (
    <div className="p-2 rounded-md bg-background/30 border border-border/20">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-mono font-bold ${hue ?? 'text-foreground'}`}>{value}</div>
    </div>
  );
}
