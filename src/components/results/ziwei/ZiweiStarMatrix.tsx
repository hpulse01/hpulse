import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  starsByPalace: Record<string, { major: string[]; auxiliary: string[]; sha: string[]; minor?: string[] }>;
}

/** ZiweiStarMatrix — collapsible per-palace star listing (default folded). */
export function ZiweiStarMatrix({ starsByPalace }: Props) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(starsByPalace);
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无星曜矩阵 / Star matrix unavailable.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-primary/[0.04]">
        <span className="flex items-center gap-2 text-xs font-mono text-muted-foreground/85">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          星曜矩阵 · {entries.length} 宫
        </span>
      </button>
      {open && (
        <div className="border-t border-primary/10 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto scrollbar-thin">
          {entries.map(([palace, s]) => (
            <div key={palace} className="rounded border border-primary/10 bg-card/40 p-2">
              <div className="text-[11px] font-serif tracking-wider text-primary/90 mb-1">{palace}</div>
              <div className="flex flex-wrap gap-1">
                {s.major.map(n => <Chip key={n} cls="text-primary border-primary/40 bg-primary/[0.05]">{n}</Chip>)}
                {s.auxiliary.map(n => <Chip key={n} cls="text-sky-300 border-sky-400/30 bg-sky-400/[0.04]">{n}</Chip>)}
                {s.sha.map(n => <Chip key={n} cls="text-destructive/85 border-destructive/35 bg-destructive/[0.04]">{n}</Chip>)}
                {(s.minor ?? []).map(n => <Chip key={n} cls="text-muted-foreground/85 border-muted-foreground/30 bg-muted/[0.04]">{n}</Chip>)}
                {s.major.length + s.auxiliary.length + s.sha.length === 0 && <span className="text-[10px] text-muted-foreground/55">—</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ children, cls }: { children: string; cls: string }) {
  return <span className={`px-1.5 py-0.5 text-[10px] font-serif rounded border ${cls}`}>{children}</span>;
}
