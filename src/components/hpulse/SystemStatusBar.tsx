import { cn } from '@/lib/utils';
import { Activity, Database, Cpu, Network } from 'lucide-react';

interface SystemStatusBarProps {
  clauseCount: number | null;
  engineCount?: number;
  online?: boolean;
  className?: string;
}

interface PillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok?: boolean;
}

function Pill({ icon, label, value, ok = true }: PillProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border/30 bg-card/30 backdrop-blur-sm">
      <span className={cn('relative flex h-1.5 w-1.5')}>
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            ok ? 'bg-emerald-400' : 'bg-rose-400',
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full h-1.5 w-1.5',
            ok ? 'bg-emerald-400' : 'bg-rose-400',
          )}
        />
      </span>
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70 font-mono hidden md:inline">
        {label}
      </span>
      <span className="text-[10px] font-mono text-foreground/85">{value}</span>
    </div>
  );
}

export function SystemStatusBar({
  clauseCount,
  engineCount = 13,
  online = true,
  className,
}: SystemStatusBarProps) {
  const clauseValue =
    clauseCount === null ? '...' : clauseCount > 0 ? clauseCount.toLocaleString() : '0';
  const clauseOk = clauseCount === null ? true : clauseCount > 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 md:gap-2', className)}>
      <Pill
        icon={<Activity className="w-3 h-3" />}
        label="System"
        value={online ? 'ONLINE' : 'OFFLINE'}
        ok={online}
      />
      <Pill
        icon={<Cpu className="w-3 h-3" />}
        label="Engines"
        value={`${engineCount} READY`}
      />
      <Pill
        icon={<Database className="w-3 h-3" />}
        label="Clauses"
        value={clauseValue}
        ok={clauseOk}
      />
      <Pill
        icon={<Network className="w-3 h-3" />}
        label="Orchestration"
        value="ACTIVE"
      />
    </div>
  );
}

export default SystemStatusBar;
