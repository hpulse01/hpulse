import { Star } from 'lucide-react';

export interface ZiweiPalaceCardData {
  name: string;
  branch?: string;
  isMing?: boolean;
  isShen?: boolean;
  strengthScore?: number;
  majorStars?: string[];
  minorStars?: string[];
  auxiliaryStars?: string[];
  shaStars?: string[];
  sihua?: { star: string; transform: string }[];
}

interface Props {
  palace: ZiweiPalaceCardData;
  compact?: boolean;
}

const SIHUA_COLOR: Record<string, string> = {
  '禄': 'text-emerald-300 border-emerald-400/40',
  '权': 'text-sky-300 border-sky-400/40',
  '科': 'text-primary border-primary/45',
  '忌': 'text-destructive border-destructive/40',
};

/** ZiweiPalaceCard — single palace tile used in the 4x3 chart and mobile list. */
export function ZiweiPalaceCard({ palace, compact }: Props) {
  const accent = palace.isMing ? 'border-primary/55 bg-primary/[0.06]'
    : palace.isShen ? 'border-emerald-400/40 bg-emerald-400/[0.04]'
    : 'border-primary/15 bg-card/40';
  const score = palace.strengthScore ?? 50;
  return (
    <div className={`rounded-md border ${accent} p-2.5 flex flex-col gap-1.5 min-h-[110px]`}>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-serif text-sm tracking-wider text-foreground/95 truncate">{palace.name}</span>
          {palace.branch && <span className="text-[10px] font-mono text-muted-foreground/70">{palace.branch}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {palace.isMing && <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-primary px-1 py-0.5 border border-primary/40 rounded">命</span>}
          {palace.isShen && <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-emerald-300 px-1 py-0.5 border border-emerald-400/40 rounded">身</span>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(palace.majorStars ?? []).map((s) => (
          <span key={s} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-serif rounded border border-primary/40 text-primary bg-primary/[0.05]">
            <Star className="w-2.5 h-2.5" />{s}
          </span>
        ))}
        {!compact && (palace.auxiliaryStars ?? []).map((s) => (
          <span key={s} className="px-1.5 py-0.5 text-[10px] font-serif rounded border border-sky-400/30 text-sky-300/90 bg-sky-400/[0.04]">{s}</span>
        ))}
        {!compact && (palace.shaStars ?? []).map((s) => (
          <span key={s} className="px-1.5 py-0.5 text-[10px] font-serif rounded border border-destructive/35 text-destructive/85 bg-destructive/[0.04]">{s}</span>
        ))}
      </div>
      {palace.sihua && palace.sihua.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {palace.sihua.map((sh, i) => (
            <span key={i} className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${SIHUA_COLOR[sh.transform] ?? 'text-muted-foreground border-muted-foreground/30'}`}>
              {sh.star}·{sh.transform}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="h-1 flex-1 rounded-full bg-muted/30 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums shrink-0">{score}</span>
      </div>
    </div>
  );
}
