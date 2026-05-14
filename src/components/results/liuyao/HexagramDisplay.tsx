interface LineData {
  /** 1 = bottom, 6 = top */
  position: number;
  /** 'yang' | 'yin' */
  type?: 'yang' | 'yin' | string;
  isChanging?: boolean;
  isShi?: boolean;
  isYing?: boolean;
  relative?: string;
  branch?: string;
  spirit?: string;
}

interface Props {
  name?: string;
  palace?: string;
  upperTrigram?: string;
  lowerTrigram?: string;
  lines?: LineData[];
  label?: string;
  compact?: boolean;
}

/**
 * HexagramDisplay — visual 6-line hexagram. Top line first (位 6 → 1).
 * Yang = solid bar; Yin = broken bar; changing = gold accent + ○/✕ marker.
 */
export function HexagramDisplay({ name, palace, upperTrigram, lowerTrigram, lines, label, compact }: Props) {
  const ordered = (lines ?? []).slice().sort((a, b) => b.position - a.position); // top first
  return (
    <div className={`rounded-lg border border-primary/25 bg-card/40 p-3 ${compact ? '' : 'min-w-[200px]'}`}>
      {label && <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1">{label}</div>}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-serif text-base tracking-[0.2em] text-primary/95 truncate">{name ?? '—'}</div>
        {palace && <span className="text-[10px] font-mono text-muted-foreground/70 shrink-0">{palace}宫</span>}
      </div>
      <div className="flex flex-col gap-1.5 py-1">
        {ordered.length > 0 ? ordered.map((ln) => <LineRow key={ln.position} line={ln} />)
          : Array.from({ length: 6 }).map((_, i) => <PlaceholderLine key={i} />)}
      </div>
      {(upperTrigram || lowerTrigram) && (
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono text-muted-foreground/75">
          <div>上 · {upperTrigram ?? '—'}</div>
          <div>下 · {lowerTrigram ?? '—'}</div>
        </div>
      )}
    </div>
  );
}

function LineRow({ line }: { line: LineData }) {
  const yang = line.type === 'yang';
  const changing = line.isChanging;
  return (
    <div className="flex items-center gap-2 group">
      <span className="w-4 text-[9px] font-mono text-muted-foreground/55 text-right tabular-nums">{line.position}</span>
      <div className="flex-1 flex items-center gap-1 h-3">
        {yang ? (
          <div className={`h-full flex-1 rounded-sm ${changing ? 'bg-amber-300/85 shadow-[0_0_10px_hsl(40_90%_60%_/_0.55)]' : 'bg-foreground/85'}`} />
        ) : (
          <>
            <div className={`h-full flex-[0.45] rounded-sm ${changing ? 'bg-amber-300/85 shadow-[0_0_10px_hsl(40_90%_60%_/_0.55)]' : 'bg-foreground/85'}`} />
            <div className="h-full flex-[0.1]" />
            <div className={`h-full flex-[0.45] rounded-sm ${changing ? 'bg-amber-300/85 shadow-[0_0_10px_hsl(40_90%_60%_/_0.55)]' : 'bg-foreground/85'}`} />
          </>
        )}
      </div>
      <div className="flex items-center gap-1 w-28 shrink-0 text-[10px] font-mono">
        {changing && <span className="text-amber-300/95">●</span>}
        {line.isShi && <span className="text-primary border border-primary/40 rounded px-1 text-[9px]">世</span>}
        {line.isYing && <span className="text-emerald-300 border border-emerald-400/40 rounded px-1 text-[9px]">应</span>}
        {line.relative && <span className="text-muted-foreground/85 truncate">{line.relative}{line.branch ?? ''}</span>}
      </div>
    </div>
  );
}

function PlaceholderLine() {
  return <div className="h-3 flex items-center"><div className="flex-1 h-px bg-muted/30" /></div>;
}
