import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  baseNumber?: number;
  theoreticalBase?: number;
  lockedQuarterIndex?: number | null;
  systemOffset?: number;
  pillarsDisplay?: string;
  calculationSteps?: string[];
}

const QUARTER_LABELS = [
  '初刻 (0–15分)', '二刻 (15–30分)', '三刻 (30–45分)', '四刻 (45–60分)',
  '正刻 (60–75分)', '六刻 (75–90分)', '七刻 (90–105分)', '末刻 (105–120分)',
];

/** TiebanBaseTrace — exposes theoreticalBase / quarterKe / lockedQuarterIndex / systemOffset. */
export function TiebanBaseTrace({
  baseNumber, theoreticalBase, lockedQuarterIndex, systemOffset, pillarsDisplay, calculationSteps,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="原始 baseNumber" value={baseNumber} />
        <Stat label="theoreticalBase" value={theoreticalBase} hint="mod 12000" />
        <Stat label="lockedQuarter" value={lockedQuarterIndex == null ? '—' : QUARTER_LABELS[lockedQuarterIndex] ?? String(lockedQuarterIndex)} />
        <Stat label="systemOffset" value={systemOffset} hint={systemOffset === 0 ? '无校准' : '已校准'} />
      </div>
      {pillarsDisplay && (
        <div className="rounded-md border border-primary/20 bg-card/40 px-3 py-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">四柱 · Pillars</div>
          <div className="mt-1 font-serif text-base tracking-[0.32em] text-primary/95">{pillarsDisplay}</div>
        </div>
      )}
      {calculationSteps && calculationSteps.length > 0 && (
        <div className="rounded-md border border-primary/15 bg-card/30">
          <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-primary/[0.04]">
            <span className="flex items-center gap-2 text-xs font-mono text-muted-foreground/85">
              {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              calculationSteps · {calculationSteps.length}
            </span>
          </button>
          {open && (
            <ol className="border-t border-primary/10 px-4 py-2 space-y-1 text-[11px] font-mono text-muted-foreground/85 max-h-72 overflow-y-auto scrollbar-thin">
              {calculationSteps.map((s, i) => (
                <li key={i} className="leading-relaxed">
                  <span className="text-primary/60">{String(i + 1).padStart(2, '0')}</span> · {s}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string | null | undefined; hint?: string }) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">{label}</div>
      <div className="mt-1 font-serif text-base text-foreground tabular-nums">{value ?? '—'}</div>
      {hint && <div className="text-[9px] font-mono text-muted-foreground/55 mt-0.5">{hint}</div>}
    </div>
  );
}
