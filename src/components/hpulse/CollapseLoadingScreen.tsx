import { useEffect, useState } from 'react';
import { Atom } from 'lucide-react';
import { HolographicPanel } from './HolographicPanel';
import { cn } from '@/lib/utils';

interface CollapseLoadingScreenProps {
  theoreticalBase?: number;
  systemOffset?: number;
  lockedQuarter?: number;
}

const STAGES = [
  '从多重可能世界中选择唯一生命路径',
  '生成世界树',
  '坍缩关键事件序列',
  '校准死亡候选',
  '输出最终命运向量',
];

export function CollapseLoadingScreen({
  theoreticalBase,
  systemOffset,
  lockedQuarter,
}: CollapseLoadingScreenProps) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStage(s => Math.min(STAGES.length - 1, s + 1)), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <HolographicPanel variant="ritual" innerPadding="lg">
      <div className="text-center space-y-6 py-4">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse-glow" />
          <Atom
            className="relative w-24 h-24 text-primary"
            style={{ animation: 'spin 1.2s linear infinite' }}
          />
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.45em] text-primary/70 font-mono">
            Quantum Collapse
          </p>
          <p className="mt-2 text-lg md:text-xl font-serif text-gradient-gold tracking-[0.2em]">
            {STAGES[stage]}
          </p>
        </div>

        {(theoreticalBase !== undefined || systemOffset !== undefined) && (
          <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-left">
            <Field label="Theoretical Base" value={theoreticalBase} />
            <Field label="System Offset" value={systemOffset} />
            <Field label="Locked Quarter" value={lockedQuarter} />
          </div>
        )}

        <div className="space-y-1.5 max-w-md mx-auto">
          {STAGES.map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex items-center gap-2 text-[11px] font-sans transition-all',
                i <= stage ? 'text-foreground/85' : 'text-muted-foreground/30',
              )}
            >
              <span
                className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full',
                  i < stage
                    ? 'bg-emerald-400'
                    : i === stage
                    ? 'bg-primary animate-pulse'
                    : 'bg-muted-foreground/30',
                )}
              />
              {s}
            </div>
          ))}
        </div>
      </div>
    </HolographicPanel>
  );
}

function Field({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-lg border border-primary/15 bg-card/40 p-2.5">
      <div className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground/60 font-mono">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm text-primary">
        {value === undefined ? '—' : value.toLocaleString()}
      </div>
    </div>
  );
}

export default CollapseLoadingScreen;
