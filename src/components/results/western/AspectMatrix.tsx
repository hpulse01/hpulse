interface Aspect { from: string; to: string; type: 'conjunction'|'opposition'|'trine'|'square'|'sextile'|string; orb?: number; }
interface Props { aspects?: Aspect[] }

const STYLE: Record<string, string> = {
  conjunction: 'bg-primary/15 text-primary border-primary/30',
  opposition: 'bg-rose-400/10 text-rose-300 border-rose-400/30',
  trine: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  square: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  sextile: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
};
const SYM: Record<string, string> = { conjunction:'☌', opposition:'☍', trine:'△', square:'□', sextile:'⚹' };

export function AspectMatrix({ aspects }: Props) {
  if (!aspects || aspects.length === 0) {
    return <div className="rounded-md border border-primary/15 bg-card/30 p-3 text-[11px] text-muted-foreground/70">暂无相位数据 / No aspect data.</div>;
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">相位 · Aspects</div>
      <div className="flex flex-wrap gap-1">
        {aspects.map((a, i) => (
          <span key={i} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${STYLE[a.type] ?? 'border-primary/20 text-foreground/80'}`}>
            {SYM[a.type] ?? ''} {a.from}-{a.to}{a.orb != null ? ` ${a.orb.toFixed(1)}°` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
