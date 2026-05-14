interface NumberCell { label: string; value?: number | string; description?: string; missing?: boolean }
interface Props { numbers: NumberCell[] }

export function NumerologyNumberGrid({ numbers }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {numbers.map((n, i) => (
        <div key={i} className={`rounded-md border p-3 text-center ${n.missing ? 'border-amber-400/30 bg-amber-400/[0.04]' : 'border-primary/25 bg-card/40'}`}>
          <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">{n.label}</div>
          <div className={`text-2xl font-serif mt-1 ${n.missing ? 'text-amber-300/60' : 'text-gradient-gold'}`}>{n.missing ? '—' : n.value ?? '—'}</div>
          {n.description && <div className="text-[10px] text-muted-foreground/65 mt-1 leading-snug">{n.description}</div>}
          {n.missing && <div className="text-[9px] text-amber-300/70 font-mono mt-1">missing input</div>}
        </div>
      ))}
    </div>
  );
}
