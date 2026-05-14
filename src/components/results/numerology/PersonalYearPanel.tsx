interface Props { personalYear?: number; year?: number; meaning?: string }
export function PersonalYearPanel({ personalYear, year, meaning }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-4 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Personal Year{year ? ` · ${year}` : ''}</div>
      <div className="text-3xl font-serif text-gradient-gold mt-2">{personalYear ?? '—'}</div>
      {meaning && <p className="text-[11px] text-foreground/80 mt-2 leading-relaxed">{meaning}</p>}
    </div>
  );
}
