interface TrigramData {
  name?: string;
  symbol?: string;
  element?: string;
}

interface Props {
  bengua?: { name?: string; upper?: TrigramData; lower?: TrigramData };
  hugua?: { name?: string };
  biangua?: { name?: string };
  movingLine?: number;
}

const TRIGRAM_SYMBOL: Record<string, string> = {
  '乾': '☰', '兑': '☱', '离': '☲', '震': '☳',
  '巽': '☴', '坎': '☵', '艮': '☶', '坤': '☷',
};

/** MeihuaHexagramTrio — 本卦 / 互卦 / 变卦 三联卡 (横向桌面 / 纵向移动). */
export function MeihuaHexagramTrio({ bengua, hugua, biangua, movingLine }: Props) {
  const items = [
    { label: '本卦 · Ben', name: bengua?.name, sub: trigramSub(bengua?.upper?.name, bengua?.lower?.name) },
    { label: '互卦 · Hu', name: hugua?.name, sub: '中爻 2-4 / 3-5' },
    { label: '变卦 · Bian', name: biangua?.name, sub: movingLine ? `第 ${movingLine} 爻动` : '—' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map((it, i) => (
        <div key={i} className={`rounded-lg border p-3 text-center ${i === 0 ? 'border-primary/45 bg-primary/[0.05]' : i === 2 ? 'border-amber-400/40 bg-amber-400/[0.04]' : 'border-primary/20 bg-card/40'}`}>
          <div className={`text-[10px] font-mono uppercase tracking-[0.28em] ${i === 0 ? 'text-primary/85' : i === 2 ? 'text-amber-300/85' : 'text-muted-foreground/70'}`}>{it.label}</div>
          <div className="mt-2 font-serif text-2xl tracking-[0.18em] text-foreground/95">{it.name ?? '—'}</div>
          <div className="mt-1 text-[10px] font-mono text-muted-foreground/70">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}

function trigramSub(upper?: string, lower?: string): string {
  if (!upper && !lower) return '—';
  const u = upper ? `${upper}${TRIGRAM_SYMBOL[upper] ? ' ' + TRIGRAM_SYMBOL[upper] : ''}` : '?';
  const l = lower ? `${lower}${TRIGRAM_SYMBOL[lower] ? ' ' + TRIGRAM_SYMBOL[lower] : ''}` : '?';
  return `上 ${u} · 下 ${l}`;
}
