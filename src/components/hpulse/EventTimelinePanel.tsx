/**
 * EventTimelinePanel — deterministic mainline destiny path as
 * Year · Month · Event · Causal Chain · Engines, grouped by life decade.
 *
 * Pure presentation — no business logic, no randomness.
 */
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar, GitBranch, Flag, Heart, Briefcase, Coins, GraduationCap,
  Stethoscope, Plane, Sparkles as SparkIcon, Users, Flame, AlertTriangle,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import type { CollapseResult, RejectedBranchSummary } from '@/types/destinyTree';

export interface EventTimelinePanelProps {
  collapseResult: CollapseResult | null | undefined;
  birthYear: number;
  birthMonth: number;
  /** If false, render a waiting placeholder instead of any future events. */
  kaoKeVerified?: boolean;
}

// ──────────────────────────── meta ────────────────────────────

const CATEGORY_META: Record<string, { label: string; accent: string; ring: string; chip: string; Icon: typeof Calendar }> = {
  relationship: { label: '感情', accent: 'text-pink-300',   ring: 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]',   chip: 'border-pink-500/30 text-pink-200 bg-pink-500/5',     Icon: Heart },
  career:       { label: '事业', accent: 'text-amber-300',  ring: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',   chip: 'border-amber-500/30 text-amber-200 bg-amber-500/5',  Icon: Briefcase },
  wealth:       { label: '财运', accent: 'text-yellow-300', ring: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',  chip: 'border-yellow-500/30 text-yellow-200 bg-yellow-500/5', Icon: Coins },
  education:    { label: '学业', accent: 'text-sky-300',    ring: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]',     chip: 'border-sky-500/30 text-sky-200 bg-sky-500/5',        Icon: GraduationCap },
  health:       { label: '健康', accent: 'text-emerald-300', ring: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]', chip: 'border-emerald-500/30 text-emerald-200 bg-emerald-500/5', Icon: Stethoscope },
  migration:    { label: '迁徙', accent: 'text-cyan-300',   ring: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]',    chip: 'border-cyan-500/30 text-cyan-200 bg-cyan-500/5',     Icon: Plane },
  family:       { label: '家庭', accent: 'text-rose-300',   ring: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]',   chip: 'border-rose-500/30 text-rose-200 bg-rose-500/5',     Icon: Users },
  spiritual:    { label: '心灵', accent: 'text-violet-300', ring: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]', chip: 'border-violet-500/30 text-violet-200 bg-violet-500/5', Icon: SparkIcon },
  turning_point:{ label: '转折', accent: 'text-orange-300', ring: 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]',  chip: 'border-orange-500/30 text-orange-200 bg-orange-500/5', Icon: GitBranch },
  accident:     { label: '意外', accent: 'text-red-300',    ring: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]',    chip: 'border-red-500/30 text-red-200 bg-red-500/5',        Icon: AlertTriangle },
};
const DEFAULT_META = { label: '事件', accent: 'text-foreground', ring: 'bg-primary', chip: 'border-border/40 text-foreground bg-card/40', Icon: Flame };

const INTENSITY_LABEL: Record<string, string> = {
  life_defining: '人生定义', critical: '关键', major: '重大', moderate: '中等', minor: '轻微',
};
const INTENSITY_RANK: Record<string, number> = {
  life_defining: 5, critical: 4, major: 3, moderate: 2, minor: 1,
};

function parseMonth(text: string | undefined): number | null {
  if (!text) return null;
  const m = text.match(/(?:第)?\s*(1[0-2]|[1-9])\s*月/);
  if (!m) return null;
  const v = Number(m[1]);
  return v >= 1 && v <= 12 ? v : null;
}

function deriveMonth(id: string, fallbackMonth: number): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 12) + 1 || fallbackMonth;
}

const MONTH_CN = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

interface RenderRow {
  key: string;
  year: number;
  month: number;
  monthIsExplicit: boolean;
  age: number;
  ageWindow?: [number, number];
  yearWindow?: [number, number];
  title: string;
  category: string;
  intensity: string;
  probability: number;
  causalChain: string[];
  engines: string[];
  isTerminal: boolean;
  isRejected: boolean;
  reason?: string;
}

function buildTitle(category: string, subcategory: string | undefined, description: string | undefined): string {
  const sub = (subcategory ?? '').trim();
  const desc = (description ?? '').trim();
  if (sub && desc && !desc.includes(sub)) return `${sub} · ${desc}`;
  return desc || sub || category;
}

function buildRows(collapse: CollapseResult, birthYear: number, birthMonth: number): RenderRow[] {
  const rows: RenderRow[] = [];
  for (const node of collapse.collapsedPath) {
    const ev = node.event;
    const text = `${ev.description ?? ''} ${ev.subcategory ?? ''}`;
    const parsed = parseMonth(text);
    const monthIsExplicit = parsed != null;
    const month = parsed ?? deriveMonth(ev.id, birthMonth);

    const causalSet = new Set<string>();
    for (const sup of ev.engineSupports ?? []) {
      for (const cf of sup.causalFactors ?? []) causalSet.add(cf);
    }
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
      category: ev.category,
      intensity: ev.intensity,
      probability: ev.fusedProbability,
      causalChain: Array.from(causalSet).slice(0, 6),
      engines,
      isTerminal: node.isTerminal,
      isRejected: false,
    });
  }
  return rows.sort((a, b) => a.year - b.year || a.month - b.month || a.age - b.age);
}

function buildRejectedRows(collapse: CollapseResult, birthYear: number, birthMonth: number): RenderRow[] {
  return (collapse.rejectedBranches ?? []).slice(0, 8).map((r: RejectedBranchSummary, i): RenderRow => {
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
      engines: [],
      isTerminal: false,
      isRejected: true,
      reason: r.rejectedReason || r.reason,
    };
  }).sort((a, b) => a.year - b.year);
}

interface DecadeGroup {
  decade: number;        // start age, e.g. 30
  label: string;         // "30 — 39 岁"
  yearRange: [number, number];
  rows: RenderRow[];
}

function groupByDecade(rows: RenderRow[]): DecadeGroup[] {
  const buckets = new Map<number, RenderRow[]>();
  for (const r of rows) {
    const d = Math.floor(r.age / 10) * 10;
    if (!buckets.has(d)) buckets.set(d, []);
    buckets.get(d)!.push(r);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([decade, rs]) => {
      const yearStart = Math.min(...rs.map(r => r.year));
      const yearEnd = Math.max(...rs.map(r => r.year));
      return {
        decade,
        label: `${decade} — ${decade + 9} 岁`,
        yearRange: [yearStart, yearEnd] as [number, number],
        rows: rs,
      };
    });
}

// ──────────────────────────── component ────────────────────────────

export function EventTimelinePanel({
  collapseResult,
  birthYear,
  birthMonth,
  kaoKeVerified = true,
}: EventTimelinePanelProps) {
  const [showRejected, setShowRejected] = useState(false);

  const { groups, rejRows, mainCount } = useMemo(() => {
    if (!collapseResult) return { groups: [] as DecadeGroup[], rejRows: [] as RenderRow[], mainCount: 0 };
    const main = buildRows(collapseResult, birthYear, birthMonth);
    return {
      groups: groupByDecade(main),
      rejRows: buildRejectedRows(collapseResult, birthYear, birthMonth),
      mainCount: main.length,
    };
  }, [collapseResult, birthYear, birthMonth]);

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
            未来事件需先锁定时刻坐标。请在「考刻验证」中选择与家族历史相符的条文,
            完成后此处将渲染年份+月份+诱因链的完整时间线。
          </p>
        </div>
      </div>
    );
  }
  if (!collapseResult || collapseResult.collapsedPath.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card/60 via-background/40 to-background/20 p-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-serif text-sm text-primary tracking-wider">规则情景时间线</span>
          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary/80 font-mono">
            {mainCount} 主线 · {rejRows.length} 幽灵分支
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">选择稳定度</span>
          <div className="h-1.5 w-20 rounded-full bg-border/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/60 to-primary"
              style={{ width: `${Math.round(collapseResult.selectionStability * 100)}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-primary tabular-nums">
            {(collapseResult.selectionStability * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-relaxed border-l-2 border-primary/30 pl-2">
        来源：多引擎规则融合 → 确定性情景排序。年份与月份是规则输出或派生索引，不代表事件必然发生。
      </p>

      {/* ── Timeline ── */}
      <ScrollArea className="max-h-[560px] pr-2">
        <div className="space-y-5">
          {groups.map(g => <DecadeBlock key={g.decade} group={g} />)}
        </div>

        {/* Rejected (ghost) branches */}
        {rejRows.length > 0 && (
          <div className="mt-5 pt-4 border-t border-dashed border-rose-500/20">
            <button
              type="button"
              onClick={() => setShowRejected(s => !s)}
              className="flex items-center gap-1.5 text-[10px] font-serif text-rose-300/80 hover:text-rose-200 transition-colors group"
            >
              {showRejected ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <GitBranch className="w-3 h-3" />
              幽灵分支 — 曾经候选,被世界树拒绝({rejRows.length})
            </button>
            {showRejected && (
              <ol className="mt-2.5 space-y-1.5 pl-4 border-l border-dashed border-rose-500/20">
                {rejRows.map(r => (
                  <li key={r.key} className="flex items-start gap-2 text-[10px] text-muted-foreground/70">
                    <span className="font-mono tabular-nums text-rose-300/60 shrink-0 mt-px">
                      {r.year}·{String(r.month).padStart(2, '0')}
                    </span>
                    <span className="text-foreground/55 line-through decoration-rose-500/40">
                      {r.title}
                    </span>
                    {r.reason && (
                      <span className="text-rose-300/60 text-[9px] italic">— {r.reason}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </ScrollArea>

      {collapseResult.collapseReasoning && (
        <details className="rounded-lg border border-border/20 bg-background/40 p-2">
          <summary className="cursor-pointer text-[10px] font-serif text-primary/80">
            情景排序说明
          </summary>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-1 whitespace-pre-line">
            {collapseResult.collapseReasoning}
          </p>
        </details>
      )}
    </div>
  );
}

// ──────────────────────────── decade block ────────────────────────────

function DecadeBlock({ group }: { group: DecadeGroup }) {
  return (
    <section>
      {/* Decade header — sticky-feeling band */}
      <header className="sticky top-0 z-10 -mx-0.5 px-2 py-1.5 mb-2 backdrop-blur-md bg-background/60 border-b border-primary/15 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-base text-primary tracking-[0.15em] tabular-nums">
            {group.decade}s
          </span>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
            {group.label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-primary/50 tabular-nums">
          {group.yearRange[0]} — {group.yearRange[1]}
        </span>
      </header>

      {/* Axis + rows */}
      <ol className="relative ml-1 space-y-2">
        {/* gold axis */}
        <span
          aria-hidden
          className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-primary/0 via-primary/40 to-primary/10"
        />
        {group.rows.map(row => <TimelineRow key={row.key} row={row} />)}
      </ol>
    </section>
  );
}

// ──────────────────────────── row ────────────────────────────

function TimelineRow({ row }: { row: RenderRow }) {
  const meta = CATEGORY_META[row.category] ?? DEFAULT_META;
  const Icon = row.isTerminal ? Flag : meta.Icon;
  const rank = INTENSITY_RANK[row.intensity] ?? 2;
  const isHero = rank >= 4 || row.isTerminal;

  return (
    <li className="relative pl-6">
      {/* node */}
      <span
        aria-hidden
        className={`absolute left-[3px] top-3 w-[9px] h-[9px] rounded-full ring-2 ring-background ${meta.ring} ${
          row.isTerminal ? 'animate-pulse' : ''
        }`}
      />

      <div
        className={`rounded-lg border bg-background/30 backdrop-blur-sm transition-colors hover:bg-background/50 ${
          isHero ? 'border-current/40 ' + meta.accent : 'border-border/30'
        }`}
      >
        {/* Top strip: time anchor + chips */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-sm font-semibold tabular-nums ${meta.accent}`}>
              {row.year}
            </span>
            <span className="font-serif text-xs text-muted-foreground">
              · {MONTH_CN[row.month]}月
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">
              ({String(row.month).padStart(2, '0')})
            </span>
            {!row.monthIsExplicit && (
              <span className="text-[8px] text-muted-foreground/50 font-mono">≈派生</span>
            )}
            <span className="text-[10px] text-muted-foreground/70 ml-1 font-mono tabular-nums">
              {row.age}岁
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={`text-[9px] py-0 h-4 ${meta.chip}`}>
              <Icon className="w-2.5 h-2.5 mr-0.5 inline" />
              {meta.label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[9px] py-0 h-4 font-mono ${
                rank >= 4 ? 'border-primary/40 text-primary' : 'border-border/30 text-muted-foreground'
              }`}
            >
              {INTENSITY_LABEL[row.intensity] ?? row.intensity}
            </Badge>
          </div>
        </div>

        {/* Title — primary hierarchy */}
        <div className={`px-3 pt-1 ${isHero ? 'font-serif text-sm text-foreground' : 'text-xs text-foreground/90'} leading-snug`}>
          {row.title}
        </div>

        {/* Window */}
        {row.ageWindow && row.ageWindow[0] !== row.ageWindow[1] && (
          <div className="px-3 mt-1 text-[10px] text-muted-foreground/70 font-mono tabular-nums">
            窗口 {row.ageWindow[0]}–{row.ageWindow[1]}岁
            {row.yearWindow && ` · ${row.yearWindow[0]}–${row.yearWindow[1]}`}
          </div>
        )}

        {/* Causal chain */}
        {row.causalChain.length > 0 && (
          <div className="px-3 mt-1.5 text-[10px] leading-relaxed flex items-start gap-1 flex-wrap">
            <span className="text-muted-foreground/60 font-mono uppercase text-[9px] tracking-wider shrink-0 mt-px">诱因</span>
            <span className="text-foreground/75">
              {row.causalChain.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-primary/40 mx-1">→</span>}
                  {c}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* Footer: internal ranking weight + engines */}
        <div className="px-3 py-2 mt-1.5 border-t border-border/15 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0">Rank</span>
            <div className="h-1 w-16 rounded-full bg-border/20 overflow-hidden">
              <div
                className={`h-full ${row.isTerminal ? 'bg-sky-400' : 'bg-primary/70'}`}
                style={{ width: `${Math.max(4, Math.round(row.probability * 100))}%` }}
              />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-foreground/80 shrink-0">
              {(row.probability * 100).toFixed(0)}%
            </span>
          </div>
          {row.engines.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {row.engines.slice(0, 5).map(e => (
                <span
                  key={e}
                  className="text-[9px] font-mono px-1 py-0.5 rounded bg-background/50 border border-border/20 text-muted-foreground/80"
                >
                  {e}
                </span>
              ))}
              {row.engines.length > 5 && (
                <span className="text-[9px] font-mono text-muted-foreground/60">+{row.engines.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
