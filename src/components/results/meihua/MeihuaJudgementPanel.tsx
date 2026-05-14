interface Props {
  trend?: string;
  relation?: string;
  trendScore?: number;
  events?: string[];
  timeHint?: string;
}

const TREND_TONE: Record<string, string> = {
  auspicious: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.05]',
  inauspicious: 'border-destructive/40 text-destructive bg-destructive/[0.05]',
  mixed: 'border-amber-400/40 text-amber-300 bg-amber-400/[0.05]',
  neutral: 'border-muted-foreground/30 text-muted-foreground bg-muted/[0.04]',
};

export function MeihuaJudgementPanel({ trend, relation, trendScore, events, timeHint }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">系统判读 · Judgement</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <Stat label="体用关系" value={relation} />
        <div className={`rounded border px-2 py-1.5 ${TREND_TONE[trend ?? 'neutral']}`}>
          <div className="opacity-60 uppercase tracking-wider text-[9px]">趋势</div>
          <div className="opacity-90 mt-0.5">{trend ?? '—'}</div>
        </div>
        <Stat label="趋势分" value={trendScore != null ? String(trendScore) : undefined} />
        <Stat label="时间提示" value={timeHint} />
      </div>
      {events && events.length > 0 && (
        <details className="rounded border border-primary/10 bg-card/20">
          <summary className="cursor-pointer px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">事件方向 · {events.length}</summary>
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
