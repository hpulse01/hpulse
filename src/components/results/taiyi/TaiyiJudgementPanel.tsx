interface Props {
  verdict?: string;
  riskFlags?: string[];
  opportunityFlags?: string[];
  events?: string[];
}
export function TaiyiJudgementPanel({ verdict, riskFlags, opportunityFlags, events }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">综合判读 · Judgement</div>
      {verdict && <div className="text-xs text-foreground/90"><span className="text-muted-foreground/70">判定:</span> {verdict}</div>}
      {opportunityFlags && opportunityFlags.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-emerald-300/80 mb-1">机遇 · Opportunities</div>
          <div className="flex flex-wrap gap-1">
            {opportunityFlags.map((o, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-400/30 text-emerald-200/90 bg-emerald-400/[0.05]">{o}</span>)}
          </div>
        </div>
      )}
      {riskFlags && riskFlags.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-rose-300/80 mb-1">风险 · Risks</div>
          <div className="flex flex-wrap gap-1">
            {riskFlags.map((r, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border border-rose-400/30 text-rose-200/90 bg-rose-400/[0.05]">{r}</span>)}
          </div>
        </div>
      )}
      {events && events.length > 0 && (
        <ul className="text-[11px] space-y-0.5 list-disc list-inside text-muted-foreground/85 font-mono">
          {events.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}
