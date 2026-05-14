interface Props { verdict?: string; events?: string[] }
export function VedicJudgementPanel({ verdict, events }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">综合判读 · Synthesis</div>
      {verdict && <div className="text-xs text-foreground/90 leading-relaxed">{verdict}</div>}
      {events && events.length > 0 && (
        <ul className="text-[11px] space-y-0.5 list-disc list-inside text-muted-foreground/85 font-mono">
          {events.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}
