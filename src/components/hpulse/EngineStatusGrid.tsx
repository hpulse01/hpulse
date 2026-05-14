import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import { HolographicPanel } from './HolographicPanel';
import { SectionHeader } from './SectionHeader';
import { Cpu } from 'lucide-react';

export type EngineStatus = 'ready' | 'syncing' | 'locked' | 'skipped';

interface EngineStatusGridProps {
  status?: EngineStatus;
  /** Optional per-engine override map */
  perEngine?: Partial<Record<string, EngineStatus>>;
  className?: string;
}

const ENGINES = [
  'tieban', 'bazi', 'ziwei', 'liuyao',
  'meihua', 'qimen', 'liuren', 'taiyi',
  'western', 'vedic', 'numerology', 'mayan', 'kabbalah',
];

const STATUS_LABEL: Record<EngineStatus, string> = {
  ready: 'READY',
  syncing: 'SYNC',
  locked: 'LOCKED',
  skipped: 'SKIP',
};

const STATUS_COLOR: Record<EngineStatus, string> = {
  ready: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/[0.06]',
  syncing: 'text-primary border-primary/40 bg-primary/[0.08] animate-pulse',
  locked: 'text-amber-300 border-amber-500/30 bg-amber-500/[0.05]',
  skipped: 'text-muted-foreground border-border/30 bg-muted/20',
};

const ENERGY_BAR: Record<EngineStatus, string> = {
  ready: 'from-emerald-500/40 to-emerald-400',
  syncing: 'from-primary/30 to-primary',
  locked: 'from-amber-500/30 to-amber-400',
  skipped: 'from-muted/30 to-muted',
};

export function EngineStatusGrid({
  status = 'ready',
  perEngine = {},
  className,
}: EngineStatusGridProps) {
  const { engineLabel } = useI18n();
  return (
    <HolographicPanel innerPadding="md" className={className}>
      <SectionHeader
        titleZh="引擎矩阵"
        titleEn="Engine Status Matrix"
        icon={<Cpu className="w-4 h-4" />}
      />
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ENGINES.map((e, i) => {
          const s: EngineStatus = perEngine[e] ?? status;
          return (
            <div
              key={e}
              className={cn(
                'rounded-lg border p-2.5 backdrop-blur-sm transition-all',
                STATUS_COLOR[s],
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-serif text-foreground/85 truncate">
                  {engineLabel(e)}
                </span>
                <span className="text-[8px] font-mono tracking-[0.15em] shrink-0">
                  {STATUS_LABEL[s]}
                </span>
              </div>
              <div className="h-0.5 rounded-full bg-secondary/30 overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r', ENERGY_BAR[s])}
                  style={{ width: s === 'syncing' ? '70%' : s === 'ready' ? '100%' : s === 'locked' ? '60%' : '20%' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </HolographicPanel>
  );
}

export default EngineStatusGrid;
