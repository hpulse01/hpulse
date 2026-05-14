interface Lesson { name: string; upper?: string; lower?: string; relation?: string }
interface Props { lessons?: Lesson[] }

export function LiuRenFourLessonsPanel({ lessons }: Props) {
  const items = lessons && lessons.length > 0 ? lessons : ['一课','二课','三课','四课'].map(n => ({ name: n }));
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">四课 · Four Lessons</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((l, i) => (
          <div key={i} className="rounded border border-primary/15 bg-card/20 p-2 text-center">
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/65">{l.name}</div>
            <div className="text-xs font-serif mt-1 text-foreground/90">{l.upper ?? '—'}</div>
            <div className="text-[10px] font-mono text-muted-foreground/70">{l.lower ?? '—'}</div>
            {l.relation && <div className="text-[9px] text-primary/80 mt-1">{l.relation}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
