interface PatternItem {
  name: string;
  type?: '吉格' | '凶格' | '特殊格' | string;
  description?: string;
  palaces?: string[];
  impact?: number;
  evidence?: string[];
}

interface Props { items: PatternItem[] }

const TONE: Record<string, string> = {
  '吉格': 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.05]',
  '凶格': 'border-destructive/40 text-destructive bg-destructive/[0.05]',
  '特殊格': 'border-primary/45 text-primary bg-primary/[0.05]',
};

/** ZiweiPatternPanel — 格局分类与影响。*/
export function ZiweiPatternPanel({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无格局数据 / No patterns detected.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">格局 · Patterns</div>
      <ul className="space-y-2">
        {items.map((p, i) => (
          <li key={i} className={`rounded-md border px-3 py-2 ${TONE[p.type ?? ''] ?? 'border-primary/20 bg-card/40'}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-serif text-sm tracking-wider">{p.name}</span>
              <div className="flex items-center gap-2">
                {p.type && <span className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-90">{p.type}</span>}
                {p.impact != null && (
                  <span className="text-[10px] font-mono tabular-nums opacity-85">
                    {p.impact > 0 ? `+${p.impact}` : p.impact}
                  </span>
                )}
              </div>
            </div>
            {p.description && <p className="mt-1 text-[11px] font-sans opacity-85 leading-relaxed">{p.description}</p>}
            {p.palaces && p.palaces.length > 0 && (
              <div className="mt-1 text-[10px] font-mono opacity-70">宫位: {p.palaces.join(' / ')}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
