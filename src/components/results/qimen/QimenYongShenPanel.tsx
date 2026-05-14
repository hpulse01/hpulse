interface Props {
  yongShen?: string;
  yongShenPalace?: number;
  category?: string;
  hostGuest?: string;
}

export function QimenYongShenPanel({ yongShen, yongShenPalace, category, hostGuest }: Props) {
  return (
    <div className="rounded-md border border-amber-400/40 bg-amber-400/[0.04] p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90 mb-2">用神 · Yong Shen</div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <div className="font-serif text-2xl tracking-[0.18em] text-amber-300">{yongShen ?? '—'}</div>
        <span className="text-[11px] font-mono text-foreground/85">@ {yongShenPalace != null ? `${yongShenPalace}宫` : '不现'}</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono">
        <Slot label="类别" value={category} />
        <Slot label="主客" value={hostGuest} />
      </dl>
    </div>
  );
}

function Slot({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-amber-400/25 bg-amber-400/[0.03] px-2 py-1.5">
      <div className="opacity-60 uppercase tracking-wider text-[9px] text-amber-300/70">{label}</div>
      <div className="text-foreground/90 mt-0.5">{value ?? '—'}</div>
    </div>
  );
}
