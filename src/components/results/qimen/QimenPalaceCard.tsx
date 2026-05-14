interface Props {
  palace?: number;
  trigram?: string;
  direction?: string;
  earthStem?: string;
  heavenStem?: string;
  star?: string;
  gate?: string;
  deity?: string;
  isZhiFu?: boolean;
  isZhiShi?: boolean;
  isYongShen?: boolean;
}

const GATE_TONE: Record<string, string> = {
  '开门': 'text-emerald-300', '休门': 'text-emerald-300', '生门': 'text-emerald-300',
  '杜门': 'text-muted-foreground', '景门': 'text-muted-foreground',
  '伤门': 'text-destructive', '惊门': 'text-destructive', '死门': 'text-destructive',
};

export function QimenPalaceCard({ palace, trigram, direction, earthStem, heavenStem, star, gate, deity, isZhiFu, isZhiShi, isYongShen }: Props) {
  const accent = isYongShen ? 'border-amber-400/55 bg-amber-400/[0.06]'
    : isZhiFu ? 'border-primary/55 bg-primary/[0.06]'
    : isZhiShi ? 'border-emerald-400/40 bg-emerald-400/[0.04]'
    : 'border-primary/15 bg-card/40';
  return (
    <div className={`rounded-md border ${accent} p-2 text-[11px] font-mono min-h-[110px] flex flex-col`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-muted-foreground/75">{palace ?? '—'}宫 · {trigram ?? '?'} · {direction ?? '?'}</span>
        <div className="flex gap-0.5">
          {isZhiFu && <span className="text-[8px] text-primary border border-primary/45 rounded px-1">符</span>}
          {isZhiShi && <span className="text-[8px] text-emerald-300 border border-emerald-400/40 rounded px-1">使</span>}
          {isYongShen && <span className="text-[8px] text-amber-300 border border-amber-400/45 rounded px-1">用</span>}
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] flex-1">
        <div><span className="opacity-55">天</span> <span className="text-foreground/90">{heavenStem ?? '—'}</span></div>
        <div><span className="opacity-55">地</span> <span className="text-foreground/90">{earthStem ?? '—'}</span></div>
        <div><span className="opacity-55">星</span> <span className="text-sky-300/90">{star ?? '—'}</span></div>
        <div><span className="opacity-55">神</span> <span className="text-foreground/85">{deity ?? '—'}</span></div>
        <div className="col-span-2"><span className="opacity-55">门</span> <span className={GATE_TONE[gate ?? ''] ?? 'text-foreground/90'}>{gate ?? '—'}</span></div>
      </div>
    </div>
  );
}
