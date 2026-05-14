import { cn } from '@/lib/utils';

interface Props {
  grade: 'A' | 'B' | 'C' | 'D' | string | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Source grade visual badge — A=jade-gold, B=gold, C=amber, D=dim red.
 * Uses semantic tokens; never raw colors.
 */
export function SourceGradeBadge({ grade, className, size = 'sm' }: Props) {
  const g = String(grade ?? 'D').toUpperCase();
  const styles: Record<string, string> = {
    A: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.06]',
    B: 'border-primary/45 text-primary bg-primary/[0.06]',
    C: 'border-amber-400/40 text-amber-300 bg-amber-400/[0.06]',
    D: 'border-destructive/40 text-destructive/90 bg-destructive/[0.06]',
  };
  const labels: Record<string, string> = {
    A: 'A · 经典完整',
    B: 'B · 主干完整',
    C: 'C · 部分实现',
    D: 'D · 占位/待校',
  };
  const cls = styles[g] ?? styles.D;
  return (
    <span
      title={`Source grade ${g}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border font-mono uppercase tracking-[0.18em]',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        cls,
        className,
      )}
    >
      <span className="opacity-90">{labels[g] ?? `· ${g}`}</span>
    </span>
  );
}
