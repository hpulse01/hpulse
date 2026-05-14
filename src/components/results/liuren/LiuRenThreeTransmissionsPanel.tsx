interface Transmission { stage: string; branch?: string; general?: string; meaning?: string }
interface Props { transmissions?: Transmission[] }

export function LiuRenThreeTransmissionsPanel({ transmissions }: Props) {
  const items = transmissions && transmissions.length > 0 ? transmissions : [
    { stage: '初传 · Chu' }, { stage: '中传 · Zhong' }, { stage: '末传 · Mo' },
  ];
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">三传 · Three Transmissions</div>
      <div className="flex items-stretch gap-2">
        {items.map((t, i) => (
          <div key={i} className="flex-1 rounded border border-primary/15 bg-card/20 p-2 text-center relative">
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/65">{t.stage}</div>
            <div className="text-sm font-serif mt-1 text-foreground/90">{t.branch ?? '—'}</div>
            <div className="text-[10px] font-mono text-primary/80">{t.general ?? '—'}</div>
            {t.meaning && <div className="text-[9px] text-muted-foreground/70 mt-1 leading-snug">{t.meaning}</div>}
            {i < items.length - 1 && <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-primary/60 text-xs hidden sm:block">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
