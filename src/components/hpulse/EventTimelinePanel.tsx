/**
 * EventTimelinePanel — renders the deterministic mainline destiny path as
 * explicit events: Year · Month · Event · Causal Chain · Engines.
 *
 * Source of truth: `quantumResult.collapseResult.collapsedPath` (already
 * fused across all engines via `fuseEventSeeds` + world-tree collapse in
 * `quantumPredictionEngine.ts`).
 *
 * Pure presentation — no business logic, no randomness. Month is parsed
 * from the event text when present, otherwise derived deterministically
 * from the event id (stable across renders).
 */
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar, GitBranch, Skull, Heart, Briefcase, Coins, GraduationCap,
  Stethoscope, Plane, Sparkles as SparkIcon, Users, Flame, AlertTriangle,
} from 'lucide-react';
import type { CollapseResult, CollapsedPathNode, RejectedBranchSummary } from '@/types/destinyTree';

export interface EventTimelinePanelProps {
  collapseResult: CollapseResult | null | undefined;
  birthYear: number;
  birthMonth: number;
  /** If false, render a waiting placeholder instead of any future events. */
  kaoKeVerified?: boolean;
}

// ──────────────────────────── helpers ────────────────────────────

const CATEGORY_META: Record<string, { label: string; tone: string; Icon: typeof Calendar }> = {
  relationship: { label: '感情', tone: 'text-pink-300 border-pink-500/30 bg-pink-500/5', Icon: Heart },
  career:       { label: '事业', tone: 'text-amber-300 border-amber-500/30 bg-amber-500/5', Icon: Briefcase },
  wealth:       { label: '财运', tone: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/5', Icon: Coins },
  education:    { label: '学业', tone: 'text-sky-300 border-sky-500/30 bg-sky-500/5', Icon: GraduationCap },
  health:       { label: '健康', tone: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5', Icon: Stethoscope },
  migration:    { label: '迁徙', tone: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/5', Icon: Plane },
  family:       { label: '家庭', tone: 'text-rose-300 border-rose-500/30 bg-rose-500/5', Icon: Users },
  spiritual:    { label: '心灵', tone: 'text-violet-300 border-violet-500/30 bg-violet-500/5', Icon: SparkIcon },
  turning_point:{ label: '转折', tone: 'text-orange-300 border-orange-500/30 bg-orange-500/5', Icon: GitBranch },
  accident:     { label: '意外', tone: 'text-red-300 border-red-500/30 bg-red-500/5', Icon: AlertTriangle },
  death:        { label: '终局', tone: 'text-rose-200 border-rose-500/40 bg-rose-500/10', Icon: Skull },
};
const DEFAULT_META = { label: '事件', tone: 'text-foreground border-border/40 bg-card/40', Icon: Flame };

const INTENSITY_LABEL: Record<string, string> = {
  life_defining: '人生定义', critical: '关键', major: '重大', moderate: '中等', minor: '轻微',
};

/** Extract month 1-12 from natural-language Chinese text like "32岁3月". */
function parseMonth(text: string | undefined): number | null {
  if (!text) return null;
  const m = text.match(/(?:第)?\s*(1[0-2]|[1-9])\s*月/);
  if (!m) return null;
  const v = Number(m[1]);
  return v >= 1 && v <= 12 ? v : null;
}

/** Stable hash → 1..12 from a string. Used only when month is not explicit. */
function deriveMonth(id: string, fallbackMonth: number): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 12) + 1 || fallbackMonth;
}

interface RenderRow {
  key: string;
  year: number;
  month: number;
  monthIsExplicit: boolean;
  age: number;
  ageWindow?: [number, number];
  yearWindow?: [number, number];
  title: string;
  subcategory?: string;
  category: string;
  intensity: string;
  probability: number;
  causalChain: string[];
  triggers: string[];
  engines: string[];
  isDeath: boolean;
  isRejected: boolean;
  reason?: string;
}

/** Compose a concrete title: "subcategory · description". Strip noise. */
function buildTitle(category: string, subcategory: string | undefined, description: string | undefined): string {
  const sub = (subcategory ?? '').trim();
  const desc = (description ?? '').trim();
  if (sub && desc && !desc.includes(sub)) return `${sub} · ${desc}`;
  return desc || sub || category;
}

function buildRows(
  collapse: CollapseResult,
  birthYear: number,
  birthMonth: number,
): RenderRow[] {
  const rows: RenderRow[] = [];

  for (const node of collapse.collapsedPath) {
    const ev = node.event;
    const text = `${ev.description ?? ''} ${ev.subcategory ?? ''}`;
    const parsed = parseMonth(text);
    const monthIsExplicit = parsed != null;
    const month = parsed ?? deriveMonth(ev.id, birthMonth);

    // Aggregate causal factors + trigger conditions across engine supports.
    const causalSet = new Set<string>();
    const triggerSet = new Set<string>();
    for (const sup of ev.engineSupports ?? []) {
      for (const cf of sup.causalFactors ?? []) causalSet.add(cf);
    }
    // Trigger conditions live on the seeds, but aren't lifted here — leave empty unless surfaced later.
    const engines = Array.from(new Set((ev.engineSupports ?? []).map(s => s.engineName)));
    const aw = ev.ageWindow as [number, number] | undefined;

    rows.push({
      key: `path-${node.age}-${ev.id}`,
      year: node.year,
      month,
      monthIsExplicit,
      age: node.age,
      ageWindow: aw,
      yearWindow: aw ? [birthYear + aw[0], birthYear + aw[1]] : undefined,
      title: buildTitle(ev.category, ev.subcategory, ev.description),
      subcategory: ev.subcategory,
      category: ev.category,
      intensity: ev.intensity,
      probability: ev.fusedProbability,
      causalChain: Array.from(causalSet).slice(0, 6),
      triggers: Array.from(triggerSet).slice(0, 4),
      engines,
      isDeath: node.isDeath,
      isRejected: false,
    });
  }

  return rows.sort((a, b) =>
    a.year - b.year || a.month - b.month || a.age - b.age,
  );
}

function buildRejectedRows(
  collapse: CollapseResult,
  birthYear: number,
  birthMonth: number,
): RenderRow[] {
  return (collapse.rejectedBranches ?? []).slice(0, 6).map((r: RejectedBranchSummary, i): RenderRow => {
    const year = birthYear + r.branchAge;
    const parsed = parseMonth(r.branchEvent);
    return {
      key: `rej-${i}-${r.branchAge}`,
      year,
      month: parsed ?? deriveMonth(`${r.branchEvent}-${i}`, birthMonth),
      monthIsExplicit: parsed != null,
      age: r.branchAge,
      title: r.branchEvent,
      category: 'turning_point',
      intensity: 'moderate',
      probability: r.probability,
      causalChain: [r.rejectedReason || r.reason],
      triggers: [],
      engines: [],
      isDeath: false,
      isRejected: true,
      reason: r.rejectedReason || r.reason,
    };
  });
}

// ──────────────────────────── component ────────────────────────────

export function EventTimelinePanel({ collapseResult, birthYear, birthMonth, kaoKeVerified = true }: EventTimelinePanelProps) {
  if (!kaoKeVerified) {
    return (
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card/50 to-background/30 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary/60" />
          <span className="font-serif text-sm text-primary/80">明确事件时间线</span>
          <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-300 font-mono">
            等待考刻验证
          </Badge>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
          <span className="text-3xl text-primary/40 animate-pulse">☯</span>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            未来事件需先锁定时刻坐标。请在「考刻验证」中选择与家族历史相符的条文，
            完成后此处将渲染年份+月份+诱因链的完整时间线。
          </p>
        </div>
      </div>
    );
  }
  if (!collapseResult || collapseResult.collapsedPath.length === 0) return null;

  const mainRows = buildRows(collapseResult, birthYear, birthMonth);
  const rejRows = buildRejectedRows(collapseResult, birthYear, birthMonth);

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card/50 to-background/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-serif text-sm text-primary">明确事件时间线</span>
          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary/80 font-mono">
            {mainRows.length} 主线 · {rejRows.length} 支线
          </Badge>
        </div>
        <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
          坍缩置信 {(collapseResult.collapseConfidence * 100).toFixed(0)}%
        </Badge>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        来源：多引擎事件融合 → 世界树坍缩。每条事件含年份、月份（来自原文或确定性派生）、诱因链、贡献引擎。
      </p>

      <ScrollArea className="max-h-[520px] pr-2">
        <ol className="relative border-l border-primary/15 ml-2 space-y-2.5">
          {mainRows.map(row => <TimelineRow key={row.key} row={row} />)}
        </ol>
        {rejRows.length > 0 && (
          <div className="pl-4 pt-3 mt-3 border-t border-border/20">
            <div className="text-[10px] text-muted-foreground font-serif mb-1.5 flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> 被拒分支（未发生但曾候选）
            </div>
            <ol className="relative border-l border-rose-500/15 ml-2 space-y-2">
              {rejRows.map(row => <TimelineRow key={row.key} row={row} />)}
            </ol>
          </div>
        )}
      </ScrollArea>

      {collapseResult.collapseReasoning && (
        <details className="rounded-lg border border-border/20 bg-background/40 p-2">
          <summary className="cursor-pointer text-[10px] font-serif text-primary/80">
            坍缩推理
          </summary>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 whitespace-pre-line">
            {collapseResult.collapseReasoning}
          </p>
        </details>
      )}
    </div>
  );
}

function TimelineRow({ row }: { row: RenderRow }) {
  const meta = CATEGORY_META[row.category] ?? DEFAULT_META;
  const Icon = row.isDeath ? Skull : meta.Icon;

  return (
    <li className={`relative pl-4 ${row.isRejected ? 'opacity-60' : ''}`}>
      <span
        className={`absolute -left-[5px] top-2.5 w-2 h-2 rounded-full border ${
          row.isDeath ? 'bg-rose-400 border-rose-500' : 'bg-primary border-primary/80'
        }`}
      />
      <div className={`rounded-lg border p-2.5 ${meta.tone}`}>
        {/* Header row: year/month + age + category + intensity */}
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold tabular-nums">
              {row.year}年{String(row.month).padStart(2, '0')}月
              {!row.monthIsExplicit && (
                <span className="text-[8px] text-muted-foreground ml-0.5">≈</span>
              )}
            </span>
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              {row.age}岁
            </Badge>
            <Badge variant="outline" className={`text-[9px] border-current/30 ${meta.tone.split(' ')[0]}`}>
              <Icon className="w-2.5 h-2.5 mr-0.5 inline" />
              {meta.label}
            </Badge>
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              {INTENSITY_LABEL[row.intensity] ?? row.intensity}
            </Badge>
            {row.isRejected && (
              <Badge variant="outline" className="text-[9px] border-rose-500/30 text-rose-300">
                已拒
              </Badge>
            )}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
            P={row.probability.toFixed(2)}
          </span>
        </div>

        {/* Event title */}
        <div className="text-xs text-foreground/95 leading-snug mb-1.5">
          {row.title}
        </div>

        {/* Causal chain */}
        {row.causalChain.length > 0 && (
          <div className="text-[10px] text-foreground/70 leading-relaxed">
            <span className="text-muted-foreground">诱因：</span>
            {row.causalChain.join(' → ')}
          </div>
        )}

        {/* Engines */}
        {row.engines.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {row.engines.map(e => (
              <span
                key={e}
                className="text-[9px] font-mono px-1 py-0.5 rounded bg-background/40 border border-border/20 text-muted-foreground"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
