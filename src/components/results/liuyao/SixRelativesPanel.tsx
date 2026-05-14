interface Props {
  lines?: { position: number; relative?: string; branch?: string; isShi?: boolean; isYing?: boolean }[];
}

const COLOR: Record<string, string> = {
  '父母': 'border-sky-400/35 text-sky-300/90 bg-sky-400/[0.04]',
  '兄弟': 'border-primary/35 text-primary/90 bg-primary/[0.04]',
  '子孙': 'border-emerald-400/35 text-emerald-300/90 bg-emerald-400/[0.04]',
  '妻财': 'border-amber-400/35 text-amber-300/90 bg-amber-400/[0.04]',
  '官鬼': 'border-destructive/35 text-destructive/85 bg-destructive/[0.04]',
};

/** SixRelativesPanel — per-line 六亲 + 世应 markers. */
export function SixRelativesPanel({ lines }: Props) {
  if (!lines || lines.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无六亲数据 / Six-relatives unavailable.
      </div>
    );
  }
  const ordered = [...lines].sort((a, b) => b.position - a.position);
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">六亲 · Six Relatives</div>
      <ul className="space-y-1">
        {ordered.map((ln) => (
          <li key={ln.position} className="flex items-center gap-2 text-[11px] font-mono">
            <span className="w-12 text-muted-foreground/65 tabular-nums">第{ln.position}爻</span>
            <span className={`px-2 py-0.5 rounded border ${COLOR[ln.relative ?? ''] ?? 'border-muted-foreground/25 text-muted-foreground'}`}>
              {ln.relative ?? '—'}{ln.branch ?? ''}
            </span>
            {ln.isShi && <span className="text-primary border border-primary/40 rounded px-1 text-[9px]">世</span>}
            {ln.isYing && <span className="text-emerald-300 border border-emerald-400/40 rounded px-1 text-[9px]">应</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
