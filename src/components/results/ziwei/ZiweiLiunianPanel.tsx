interface LiunianItem {
  year: number;
  age?: number;
  palaceName?: string;
  branch?: string;
  stars?: string[];
  sihua?: { star: string; transform: string }[];
}

interface Props { items: LiunianItem[]; targetYear?: number }

export function ZiweiLiunianPanel({ items, targetYear }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无流年数据 / Liunian unavailable.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">流年 · Liunian</div>
        {targetYear && <span className="text-[10px] font-mono text-primary/85">焦点 {targetYear}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((y, i) => {
          const active = targetYear != null && y.year === targetYear;
          return (
            <div key={i} className={`rounded-md border px-2.5 py-2 ${active ? 'border-primary/55 bg-primary/[0.08]' : 'border-primary/15 bg-card/40'}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-xs text-foreground/90 tabular-nums">{y.year}</span>
                {y.age != null && <span className="text-[10px] font-mono text-muted-foreground/65">{y.age}岁</span>}
              </div>
              <div className="mt-1 font-serif text-sm text-primary/90 truncate">{y.palaceName ?? '—'}{y.branch ? ` · ${y.branch}` : ''}</div>
              {y.sihua && y.sihua.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {y.sihua.map((s, j) => (
                    <span key={j} className="text-[9px] font-mono px-1 py-0.5 rounded border border-primary/30 text-primary/85">{s.star}·{s.transform}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
