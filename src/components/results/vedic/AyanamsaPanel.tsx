interface Props { ayanamsa?: string; ayanamsaValue?: number; zodiacSystem?: string }
export function AyanamsaPanel({ ayanamsa, ayanamsaValue, zodiacSystem }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">Ayanamsa</div>
      <div className="text-xs font-mono space-y-0.5">
        <div><span className="text-muted-foreground/70">System:</span> <span className="text-primary/85">{ayanamsa ?? 'Lahiri'}</span></div>
        <div><span className="text-muted-foreground/70">Value:</span> <span className="tabular-nums">{ayanamsaValue != null ? ayanamsaValue.toFixed(4) + '°' : '—'}</span></div>
        <div><span className="text-muted-foreground/70">Zodiac:</span> <span>{zodiacSystem ?? 'Sidereal'}</span></div>
      </div>
    </div>
  );
}
