import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  sublabel?: string;
  confidence?: number; // 0..1
  trend?: 'up' | 'down' | 'flat';
  tone?: 'default' | 'gold' | 'jade' | 'danger' | 'quantum';
  icon?: ReactNode;
  className?: string;
}

const TONE = {
  default: 'border-border/40 bg-card/40',
  gold: 'border-primary/30 bg-primary/[0.04]',
  jade: 'border-emerald-500/25 bg-emerald-500/[0.04]',
  danger: 'border-destructive/30 bg-destructive/[0.05]',
  quantum: 'border-blue-500/25 bg-blue-500/[0.04]',
};

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };
const TREND_COLOR = {
  up: 'text-emerald-400',
  down: 'text-rose-400',
  flat: 'text-muted-foreground',
};

export function MetricCard({
  label,
  value,
  unit,
  sublabel,
  confidence,
  trend,
  tone = 'default',
  icon,
  className,
}: MetricCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  return (
    <div
      className={cn(
        'rounded-xl border backdrop-blur-md p-3.5 transition-colors hover:border-primary/40',
        TONE[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-mono">
            {icon}
            <span className="truncate">{label}</span>
          </div>
          {sublabel && (
            <div className="text-[10px] text-muted-foreground/50 font-sans truncate">
              {sublabel}
            </div>
          )}
        </div>
        {TrendIcon && <TrendIcon className={cn('w-3.5 h-3.5 shrink-0', TREND_COLOR[trend!])} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-xl md:text-2xl font-serif text-foreground tracking-wider">
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted-foreground/70 font-mono">{unit}</span>}
      </div>
      {typeof confidence === 'number' && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">
            <span>confidence</span>
            <span>{Math.round(confidence * 100)}%</span>
          </div>
          <div className="h-1 bg-secondary/40 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
              style={{ width: `${Math.max(0, Math.min(1, confidence)) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
