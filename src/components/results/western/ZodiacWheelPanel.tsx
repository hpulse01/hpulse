const SIGNS = ['♈ Aries','♉ Taurus','♊ Gemini','♋ Cancer','♌ Leo','♍ Virgo','♎ Libra','♏ Scorpio','♐ Sagittarius','♑ Capricorn','♒ Aquarius','♓ Pisces'];

interface Props { ascendant?: string; sunSign?: string; moonSign?: string; }

export function ZodiacWheelPanel({ ascendant, sunSign, moonSign }: Props) {
  return (
    <div className="rounded-md border border-primary/20 bg-card/40 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">黄道带 · Zodiac</div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <Cell label="Sun" value={sunSign} />
        <Cell label="Moon" value={moonSign} />
        <Cell label="ASC" value={ascendant} />
      </div>
      <div className="flex flex-wrap gap-1">
        {SIGNS.map(s => {
          const active = [sunSign, moonSign, ascendant].some(v => v && s.includes(v));
          return (
            <span key={s} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${active ? 'border-primary/60 text-primary bg-primary/10' : 'border-primary/15 text-muted-foreground/65 bg-card/20'}`}>{s}</span>
          );
        })}
      </div>
    </div>
  );
}
function Cell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-primary/15 bg-card/20 p-2">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/65">{label}</div>
      <div className="text-xs font-serif text-foreground/90 mt-0.5">{value ?? '—'}</div>
    </div>
  );
}
