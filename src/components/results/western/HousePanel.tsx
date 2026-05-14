interface HouseRow { house: number; sign?: string; cusp?: number; ruler?: string; }
interface Props { houses?: HouseRow[]; system?: string }

export function HousePanel({ houses, system }: Props) {
  const list = Array.from({ length: 12 }, (_, i) => houses?.find(h => h.house === i + 1) ?? { house: i + 1 });
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">十二宫 · Houses</div>
        <span className="text-[10px] font-mono text-muted-foreground/65">{system ?? 'Whole Sign'}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {list.map(h => (
          <div key={h.house} className="rounded border border-primary/15 bg-card/20 px-2 py-1.5 text-[10px] font-mono">
            <div className="text-muted-foreground/65">House {h.house}</div>
            <div className="text-primary/85">{h.sign ?? '—'}</div>
            {h.cusp != null && <div className="text-muted-foreground/55 text-[9px]">cusp {h.cusp.toFixed(1)}°</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
