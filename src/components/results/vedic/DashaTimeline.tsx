interface DashaItem { lord: string; startYear?: number; endYear?: number; durationYears?: number; current?: boolean }
interface Props { dasha?: DashaItem[] }

export function DashaTimeline({ dasha }: Props) {
  if (!dasha || dasha.length === 0) {
    return <div className="rounded-md border border-primary/15 bg-card/30 p-3 text-[11px] text-muted-foreground/70">Vimshottari Dasha 暂无数据</div>;
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">Vimshottari Dasha</div>
      <ol className="space-y-1">
        {dasha.map((d, i) => (
          <li key={i} className={`flex items-center gap-2 text-[11px] font-mono p-1.5 rounded border ${d.current ? 'border-primary/50 bg-primary/[0.08]' : 'border-primary/10 bg-card/20'}`}>
            <span className={`w-2 h-2 rounded-full ${d.current ? 'bg-primary' : 'bg-primary/30'}`} />
            <span className="text-foreground/90 w-20">{d.lord}</span>
            <span className="text-muted-foreground/70 tabular-nums">{d.startYear ?? '?'} – {d.endYear ?? '?'}</span>
            {d.durationYears != null && <span className="text-muted-foreground/55 ml-auto">{d.durationYears}y</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
