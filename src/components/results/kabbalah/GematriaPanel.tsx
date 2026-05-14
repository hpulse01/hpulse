interface Props { gematria?: number; nameLetters?: string[]; method?: string }
export function GematriaPanel({ gematria, nameLetters, method }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Gematria · 数值</div>
        {method && <span className="text-[10px] font-mono text-muted-foreground/65">{method}</span>}
      </div>
      <div className="text-3xl font-serif text-gradient-gold text-center">{gematria ?? '—'}</div>
      {nameLetters && nameLetters.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {nameLetters.map((l, i) => <span key={i} className="text-[11px] font-serif px-1.5 py-0.5 rounded border border-primary/25 bg-card/30">{l}</span>)}
        </div>
      )}
    </div>
  );
}
