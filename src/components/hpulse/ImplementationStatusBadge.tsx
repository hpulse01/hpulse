import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, ShieldAlert, XCircle, HelpCircle } from 'lucide-react';

type Status = 'complete' | 'partial' | 'needs_source_validation' | 'placeholder_removed' | 'failed' | 'unknown' | string;

interface Props {
  status: Status | undefined;
  className?: string;
  showLabel?: boolean;
}

const MAP: Record<string, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  complete: { label: '完整', cls: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/[0.06]', Icon: CheckCircle2 },
  partial: { label: '部分', cls: 'border-amber-400/40 text-amber-300 bg-amber-400/[0.06]', Icon: AlertTriangle },
  needs_source_validation: { label: '待校验', cls: 'border-purple-400/40 text-purple-200 bg-purple-400/[0.06]', Icon: ShieldAlert },
  placeholder_removed: { label: '占位移除', cls: 'border-muted-foreground/30 text-muted-foreground bg-muted/[0.06]', Icon: HelpCircle },
  failed: { label: '失败', cls: 'border-destructive/45 text-destructive bg-destructive/[0.08]', Icon: XCircle },
  unknown: { label: '未知', cls: 'border-muted-foreground/25 text-muted-foreground bg-muted/[0.04]', Icon: HelpCircle },
};

export function ImplementationStatusBadge({ status, className, showLabel = true }: Props) {
  const key = (status ?? 'unknown').toString();
  const m = MAP[key] ?? MAP.unknown;
  const { Icon } = m;
  return (
    <span
      title={`implementationStatus: ${key}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em]',
        m.cls,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      {showLabel && <span>{m.label}</span>}
    </span>
  );
}
