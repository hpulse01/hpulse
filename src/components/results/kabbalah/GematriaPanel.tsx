interface Props {
  total?: number;
  gadol?: number;
  katan?: number;
  siduri?: number;
  source?: string;
}

export function GematriaPanel({ total, gadol, katan, siduri, source }: Props) {
  const values = [
    { label: 'Hechrachi', value: total },
    { label: 'Gadol 500–900', value: gadol },
    { label: 'Katan', value: katan },
    { label: 'Siduri', value: siduri },
  ];

  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Gematria · 数值</div>
        {source && <span className="text-[10px] font-mono text-muted-foreground/65">{source}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {values.map(({ label, value }) => (
          <div key={label} className="rounded border border-primary/15 bg-card/30 px-2 py-2 text-center">
            <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70">{label}</div>
            <div className="mt-1 text-xl font-serif text-gradient-gold">{value ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
