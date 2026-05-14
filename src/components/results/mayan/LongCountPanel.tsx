import { AlertTriangle } from 'lucide-react';
interface Props { longCount?: string; baktun?: number; katun?: number; tun?: number; uinal?: number; kin?: number }

export function LongCountPanel({ longCount, baktun, katun, tun, uinal, kin }: Props) {
  const display = longCount ?? (baktun != null ? `${baktun}.${katun ?? 0}.${tun ?? 0}.${uinal ?? 0}.${kin ?? 0}` : undefined);
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">Long Count · 长纪历</div>
      {display ? (
        <div className="text-lg font-mono text-primary/90 tabular-nums">{display}</div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-300/85">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Long Count 缺失 / not computed.</span>
        </div>
      )}
      {display && (
        <div className="grid grid-cols-5 gap-1 mt-2 text-[9px] font-mono text-center text-muted-foreground/70">
          <div>baktun<br /><span className="text-foreground/85">{baktun ?? '—'}</span></div>
          <div>katun<br /><span className="text-foreground/85">{katun ?? '—'}</span></div>
          <div>tun<br /><span className="text-foreground/85">{tun ?? '—'}</span></div>
          <div>uinal<br /><span className="text-foreground/85">{uinal ?? '—'}</span></div>
          <div>kin<br /><span className="text-foreground/85">{kin ?? '—'}</span></div>
        </div>
      )}
    </div>
  );
}
