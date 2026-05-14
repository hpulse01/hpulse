interface Props { yongShen?: string; verdict?: string; events?: string[] }
export function LiuRenJudgementPanel({ yongShen, verdict, events }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">综合判断 · Judgement</div>
      <div className="text-xs space-y-1">
        <div><span className="text-muted-foreground/70">用神:</span> <span className="text-primary/90 font-serif">{yongShen ?? '—'}</span></div>
        <div><span className="text-muted-foreground/70">吉凶:</span> <span className="text-foreground/90">{verdict ?? '—'}</span></div>
      </div>
      {events && events.length > 0 && (
        <ul className="text-[11px] space-y-0.5 list-disc list-inside text-muted-foreground/85 font-mono">
          {events.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}
