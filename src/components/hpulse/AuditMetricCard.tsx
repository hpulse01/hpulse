import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const TONES: Record<NonNullable<Props['tone']>, string> = {
  default: 'border-primary/15 text-foreground',
  gold: 'border-primary/30 text-primary',
  success: 'border-emerald-400/30 text-emerald-300',
  warning: 'border-amber-400/30 text-amber-300',
  danger: 'border-destructive/40 text-destructive',
  info: 'border-purple-400/30 text-purple-200',
};

export function AuditMetricCard({ label, value, hint, tone = 'default', className }: Props) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card/40 backdrop-blur-sm px-3 py-2.5 shadow-[0_0_18px_-12px_hsl(40_65%_55%_/_0.35)]',
        TONES[tone],
        className,
      )}
    >
      <div className="text-[9px] uppercase tracking-[0.28em] font-mono text-muted-foreground/75">
        {label}
      </div>
      <div className="text-lg font-serif tracking-wider mt-1">{value}</div>
      {hint ? (
        <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono truncate" title={hint}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
