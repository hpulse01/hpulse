interface SihuaItem {
  star: string;
  transform: '禄' | '权' | '科' | '忌' | string;
  palace?: string;
  meaning?: string;
}

interface Props {
  items: SihuaItem[];
  yearStem?: string;
}

const TONE: Record<string, string> = {
  '禄': 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.05]',
  '权': 'border-sky-400/40 text-sky-300 bg-sky-400/[0.05]',
  '科': 'border-primary/45 text-primary bg-primary/[0.05]',
  '忌': 'border-destructive/40 text-destructive bg-destructive/[0.05]',
};

/** ZiweiSihuaPanel — 禄/权/科/忌 badges. */
export function ZiweiSihuaPanel({ items, yearStem }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无四化数据 / Sihua data unavailable.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">四化 · Sihua</div>
        {yearStem && <span className="text-[10px] font-mono text-primary/85">年干 {yearStem}</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((s, i) => (
          <div key={i} className={`rounded-md border px-2.5 py-2 ${TONE[s.transform] ?? 'border-muted-foreground/30 text-muted-foreground bg-muted/[0.04]'}`}>
            <div className="flex items-center justify-between gap-1">
              <span className="font-serif text-base tracking-[0.18em]">{s.star}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-90">化{s.transform}</span>
            </div>
            {s.palace && <div className="text-[10px] font-mono opacity-75 mt-0.5">→ {s.palace}</div>}
            {s.meaning && <div className="text-[10px] font-sans opacity-80 mt-1 leading-snug">{s.meaning}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
