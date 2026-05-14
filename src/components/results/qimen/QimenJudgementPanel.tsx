interface Props {
  events?: string[];
  opportunities?: string[];
  risks?: string[];
}

export function QimenJudgementPanel({ events, opportunities, risks }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">综合判读 · Judgement</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Block label="机会点 · opportunities" items={opportunities} cls="border-emerald-400/30 text-emerald-300/85" />
        <Block label="风险点 · risks" items={risks} cls="border-destructive/35 text-destructive/85" />
      </div>
      {events && events.length > 0 && (
        <details className="rounded border border-primary/10 bg-card/20">
          <summary className="cursor-pointer px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">事件候选 · {events.length}</summary>
          <ul className="px-3 py-1.5 space-y-0.5 text-[11px] font-mono text-foreground/85 max-h-60 overflow-y-auto scrollbar-thin">
            {events.map((e, i) => <li key={i}>· {e}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function Block({ label, items, cls }: { label: string; items?: string[]; cls: string }) {
  return (
    <div className={`rounded border bg-card/20 px-2.5 py-2 ${cls}`}>
      <div className="text-[9px] font-mono uppercase tracking-[0.22em] opacity-75">{label}</div>
      <ul className="mt-1 text-[11px] font-mono space-y-0.5">
        {(items ?? []).map((s, i) => <li key={i}>· {s}</li>)}
        {(!items || items.length === 0) && <li className="opacity-50">—</li>}
      </ul>
    </div>
  );
}
