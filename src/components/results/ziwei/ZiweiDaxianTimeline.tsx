interface DaxianItem {
  startAge: number;
  endAge: number;
  palaceName?: string;
  branch?: string;
  direction?: 'clockwise' | 'counterclockwise' | string;
  stars?: string[];
  evidence?: string;
}

interface Props {
  items: DaxianItem[];
  currentAge?: number;
}

/** ZiweiDaxianTimeline — horizontal on desktop, vertical stack on mobile. */
export function ZiweiDaxianTimeline({ items, currentAge }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无大限数据 / Da Xian timeline unavailable.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">大限 · Da Xian</div>
      {/* Desktop horizontal */}
      <div className="hidden md:block overflow-x-auto -mx-1 px-1 scrollbar-thin">
        <ol className="inline-flex gap-2 min-w-full">
          {items.map((d, i) => {
            const active = currentAge != null && currentAge >= d.startAge && currentAge <= d.endAge;
            return (
              <li key={i} className={`shrink-0 rounded-md border px-3 py-2 text-center min-w-[130px] ${active ? 'border-primary/55 bg-primary/[0.08]' : 'border-primary/15 bg-card/40'}`}>
                <div className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider">{d.startAge}–{d.endAge} 岁</div>
                <div className="mt-1 font-serif text-sm text-primary/90">{d.palaceName ?? '—'}</div>
                {d.branch && <div className="text-[10px] font-mono text-muted-foreground/65">{d.branch}</div>}
              </li>
            );
          })}
        </ol>
      </div>
      {/* Mobile vertical */}
      <ol className="md:hidden space-y-1.5">
        {items.map((d, i) => {
          const active = currentAge != null && currentAge >= d.startAge && currentAge <= d.endAge;
          return (
            <li key={i} className={`flex items-center gap-3 rounded-md border px-3 py-2 ${active ? 'border-primary/55 bg-primary/[0.06]' : 'border-primary/15 bg-card/40'}`}>
              <span className="font-mono text-[10px] text-muted-foreground/70 w-16 shrink-0">{d.startAge}–{d.endAge}</span>
              <span className="font-serif text-sm text-primary/90 flex-1 truncate">{d.palaceName ?? '—'}</span>
              {d.branch && <span className="text-[10px] font-mono text-muted-foreground/65">{d.branch}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
