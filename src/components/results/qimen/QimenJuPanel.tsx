interface Props {
  dunDirection?: 'yang' | 'yin' | string;
  juNumber?: number;
  solarTerm?: string;
  threeYuan?: string;
  hourGanzhi?: string;
  hourXunShou?: string;
  zhiFuStar?: string;
  zhiShiGate?: string;
}

export function QimenJuPanel({ dunDirection, juNumber, solarTerm, threeYuan, hourGanzhi, hourXunShou, zhiFuStar, zhiShiGate }: Props) {
  const yang = dunDirection === 'yang';
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-3">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`text-xs font-mono uppercase tracking-[0.22em] px-2 py-1 rounded border ${yang ? 'border-amber-400/40 text-amber-300' : 'border-sky-400/40 text-sky-300'}`}>
          {yang ? '阳遁' : dunDirection === 'yin' ? '阴遁' : '—'} {juNumber != null ? `${juNumber}局` : ''}
        </span>
        {solarTerm && <span className="text-[10px] font-mono text-muted-foreground/75">节气 · {solarTerm}</span>}
        {threeYuan && <span className="text-[10px] font-mono text-muted-foreground/75">{threeYuan}</span>}
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
        <Cell label="时柱" value={hourGanzhi} />
        <Cell label="旬首" value={hourXunShou} />
        <Cell label="值符星" value={zhiFuStar} />
        <Cell label="值使门" value={zhiShiGate} />
      </dl>
    </div>
  );
}

function Cell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-primary/15 bg-card/20 px-2 py-1.5">
      <div className="opacity-60 uppercase tracking-wider text-[9px] text-muted-foreground">{label}</div>
      <div className="text-foreground/90 mt-0.5">{value ?? '—'}</div>
    </div>
  );
}
