interface Props { daySign?: string; glyph?: string; glyphMeaning?: string; kin?: number }
export function TzolkinPanel({ daySign, glyph, glyphMeaning, kin }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">Tzolkin · 卓尔金</div>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-md border-2 border-primary/40 bg-primary/[0.06] flex items-center justify-center text-2xl font-serif text-gradient-gold">{glyph ?? '◇'}</div>
        <div className="min-w-0">
          <div className="text-sm font-serif text-foreground/90">{daySign ?? '—'}</div>
          {glyphMeaning && <div className="text-[10px] text-muted-foreground/75 leading-snug">{glyphMeaning}</div>}
          {kin != null && <div className="text-[10px] font-mono text-primary/80 mt-0.5">Kin {kin}</div>}
        </div>
      </div>
    </div>
  );
}
