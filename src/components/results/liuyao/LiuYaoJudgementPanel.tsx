interface Props {
  clashCombine?: { type: string; description: string }[];
  emptyDeath?: string[];
  monthBuild?: string;
  dayBuild?: string;
  trend?: 'auspicious' | 'inauspicious' | 'mixed' | 'neutral' | string;
  events?: string[];
}

const TREND_TONE: Record<string, string> = {
  auspicious: 'border-emerald-400/40 text-emerald-300',
  inauspicious: 'border-destructive/40 text-destructive',
  mixed: 'border-amber-400/40 text-amber-300',
  neutral: 'border-muted-foreground/30 text-muted-foreground',
};

/** LiuYaoJudgementPanel — 日月建 / 冲合 / 空亡 / 吉凶趋势 / 事件候选 */
export function LiuYaoJudgementPanel({ clashCombine, emptyDeath, monthBuild, dayBuild, trend, events }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">综合判读 · Judgement</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <Stat label="月建" value={monthBuild} />
        <Stat label="日辰" value={dayBuild} />
        <Stat label="旬空" value={emptyDeath?.join('/') ?? '—'} />
        <div className={`rounded border px-2 py-1.5 ${TREND_TONE[trend ?? 'neutral']}`}>
          <div className="opacity-60 uppercase tracking-wider text-[9px]">趋势</div>
          <div className="opacity-90 mt-0.5">{trendLabel(trend)}</div>
        </div>
      </div>
      {clashCombine && clashCombine.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/65 mb-1">冲合刑害</div>
          <ul className="space-y-1">
            {clashCombine.map((c, i) => (
              <li key={i} className="text-[11px] font-mono">
                <span className={`px-1.5 py-0.5 rounded border ${c.type.includes('冲') ? 'border-destructive/35 text-destructive' : c.type.includes('合') ? 'border-emerald-400/35 text-emerald-300' : 'border-amber-400/35 text-amber-300'}`}>{c.type}</span>
                <span className="ml-2 text-foreground/85">{c.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {events && events.length > 0 && (
        <details className="rounded border border-primary/10 bg-card/20">
          <summary className="cursor-pointer px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">事件候选 · {events.length}</summary>
          <ul className="px-3 py-1.5 space-y-0.5 text-[11px] font-mono text-foreground/85 max-h-48 overflow-y-auto scrollbar-thin">
            {events.map((e, i) => <li key={i}>· {e}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-primary/15 bg-card/20 px-2 py-1.5">
      <div className="opacity-60 uppercase tracking-wider text-[9px] text-muted-foreground">{label}</div>
      <div className="text-foreground/90 mt-0.5">{value ?? '—'}</div>
    </div>
  );
}

function trendLabel(t?: string): string {
  switch (t) {
    case 'auspicious': return '吉势';
    case 'inauspicious': return '凶势';
    case 'mixed': return '混合';
    case 'neutral': return '中性';
    default: return t ?? '—';
  }
}
