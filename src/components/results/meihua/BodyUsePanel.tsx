import { ArrowRight } from 'lucide-react';

interface Props {
  bodyTrigram?: string;
  bodyElement?: string;
  useTrigram?: string;
  useElement?: string;
  relation?: string;
  trend?: string;
}

const TREND_TONE: Record<string, string> = {
  auspicious: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.05]',
  inauspicious: 'border-destructive/40 text-destructive bg-destructive/[0.05]',
  mixed: 'border-amber-400/40 text-amber-300 bg-amber-400/[0.05]',
  neutral: 'border-muted-foreground/30 text-muted-foreground bg-muted/[0.04]',
};

const ELEMENT_TONE: Record<string, string> = {
  '金': 'border-foreground/35 text-foreground/95',
  '木': 'border-emerald-400/40 text-emerald-300',
  '水': 'border-sky-400/40 text-sky-300',
  '火': 'border-destructive/40 text-destructive',
  '土': 'border-amber-400/40 text-amber-300',
};

/** BodyUsePanel — 体卦 vs 用卦 + 五行 + 生克 + 趋势. */
export function BodyUsePanel({ bodyTrigram, bodyElement, useTrigram, useElement, relation, trend }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">体用 · Body / Use</div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className={`rounded-md border ${ELEMENT_TONE[bodyElement ?? ''] ?? 'border-primary/30 text-primary'} bg-primary/[0.04] px-3 py-2 text-center`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-70">体卦 · Body</div>
          <div className="mt-1 font-serif text-xl">{bodyTrigram ?? '—'}</div>
          <div className="text-[10px] font-mono opacity-80 mt-0.5">五行 {bodyElement ?? '—'}</div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="w-4 h-4 text-amber-300/85" />
          <span className="text-[10px] font-mono text-amber-300/85 px-1.5 py-0.5 rounded border border-amber-400/35">{relation ?? '关系'}</span>
        </div>
        <div className={`rounded-md border ${ELEMENT_TONE[useElement ?? ''] ?? 'border-muted-foreground/30 text-muted-foreground'} bg-card/40 px-3 py-2 text-center`}>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-70">用卦 · Use</div>
          <div className="mt-1 font-serif text-xl">{useTrigram ?? '—'}</div>
          <div className="text-[10px] font-mono opacity-80 mt-0.5">五行 {useElement ?? '—'}</div>
        </div>
      </div>
      {trend && (
        <div className={`rounded border px-3 py-2 text-[11px] font-mono ${TREND_TONE[trend] ?? 'border-muted-foreground/30 text-muted-foreground'}`}>
          趋势 · {trend}
        </div>
      )}
    </div>
  );
}
