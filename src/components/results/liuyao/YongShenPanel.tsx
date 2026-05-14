import { Crosshair } from 'lucide-react';

interface Props {
  yongShen?: string;
  strength?: string;
  hidden?: boolean;
  jiShen?: string;
  yuanShen?: string;
  chouShen?: string;
  category?: string;
}

const STRENGTH_TONE: Record<string, string> = {
  '旺相': 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.05]',
  '发动': 'border-amber-400/45 text-amber-300 bg-amber-400/[0.05]',
  '休囚': 'border-muted-foreground/30 text-muted-foreground bg-muted/[0.04]',
  '受克': 'border-destructive/40 text-destructive bg-destructive/[0.05]',
  '空亡': 'border-destructive/40 text-destructive/85 bg-destructive/[0.05]',
  '不现': 'border-amber-400/35 text-amber-300/85 bg-amber-400/[0.04]',
};

export function YongShenPanel({ yongShen, strength, hidden, jiShen, yuanShen, chouShen, category }: Props) {
  if (!yongShen && !category) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无用神判读 / Yong Shen unavailable.
      </div>
    );
  }
  const tone = STRENGTH_TONE[strength ?? ''] ?? 'border-primary/30 text-primary bg-primary/[0.04]';
  return (
    <div className={`rounded-md border ${tone} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-4 h-4 opacity-85" />
        <span className="text-[10px] font-mono uppercase tracking-[0.28em] opacity-85">用神 · Yong Shen</span>
        {category && <span className="ml-auto text-[10px] font-mono opacity-70">类别 · {category}</span>}
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <div className="font-serif text-2xl tracking-[0.2em]">{yongShen ?? '—'}</div>
        {strength && <span className="text-xs font-mono uppercase tracking-[0.18em]">{strength}</span>}
        {hidden && <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300/85 border border-amber-400/35 rounded px-1.5 py-0.5">不现 · 查伏神</span>}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
        <Slot label="原神" value={yuanShen} />
        <Slot label="忌神" value={jiShen} />
        <Slot label="仇神" value={chouShen} />
      </dl>
    </div>
  );
}

function Slot({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-current/20 bg-current/[0.02] px-2 py-1.5">
      <div className="opacity-60 uppercase tracking-wider text-[9px]">{label}</div>
      <div className="opacity-90 mt-0.5 truncate">{value ?? '—'}</div>
    </div>
  );
}
