interface ChangingLine {
  position: number;
  fromRelative?: string;
  fromBranch?: string;
  toRelative?: string;
  toBranch?: string;
}

interface Props { items: ChangingLine[] }

export function ChangingLinesPanel({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        无动爻 / No changing lines.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-amber-400/35 bg-amber-400/[0.04] p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90 mb-2">动爻 · Changing Lines · {items.length}</div>
      <ul className="space-y-1.5">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-1.5 py-0.5 rounded border border-amber-400/40 text-amber-300/95">第 {c.position} 爻</span>
            <span className="text-foreground/85">{c.fromRelative ?? '—'}{c.fromBranch ?? ''}</span>
            <span className="text-amber-300/80">→</span>
            <span className="text-foreground/85">{c.toRelative ?? '?'}{c.toBranch ?? ''}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
