import { useEffect, useState } from 'react';
import { Atom } from 'lucide-react';
import { HolographicPanel } from './HolographicPanel';
import { useI18n } from '@/hooks/useI18n';
import { cn } from '@/lib/utils';

const ENGINES = [
  'tieban', 'bazi', 'ziwei', 'liuyao',
  'meihua', 'qimen', 'liuren', 'taiyi',
  'western', 'vedic', 'numerology', 'mayan', 'kabbalah',
];

const MESSAGES = [
  '标准化出生时空',
  '同步多体系引擎',
  '生成初始命运向量',
  '锁定时区与节气',
];

export function QuantumLoadingScreen() {
  const { engineLabel } = useI18n();
  const [activeMsg, setActiveMsg] = useState(0);
  const [activeEngines, setActiveEngines] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setActiveMsg(m => (m + 1) % MESSAGES.length), 900);
    const t2 = setInterval(
      () => setActiveEngines(n => Math.min(ENGINES.length, n + 1)),
      120,
    );
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  return (
    <HolographicPanel variant="ritual" innerPadding="lg">
      <div className="text-center space-y-8 py-4">
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-quantum-pulse" />
          <div
            className="absolute inset-2 rounded-full border border-primary/15"
            style={{ animation: 'spin 8s linear infinite' }}
          />
          <div
            className="absolute inset-4 rounded-full border border-primary/10"
            style={{ animation: 'spin 5s linear infinite reverse' }}
          />
          <Atom
            className="absolute inset-0 m-auto w-14 h-14 text-primary"
            style={{ animation: 'spin 3s linear infinite' }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.45em] text-primary/70 font-mono">
            Engine Synchronization
          </p>
          <p className="text-lg md:text-xl font-serif text-gradient-gold tracking-[0.2em]">
            {MESSAGES[activeMsg]}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/60">
            {String(activeEngines).padStart(2, '0')} / {ENGINES.length} engines online
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-w-xl mx-auto">
          {ENGINES.map((e, i) => {
            const on = i < activeEngines;
            return (
              <div
                key={e}
                className={cn(
                  'text-[9px] px-2 py-1 rounded border font-sans transition-all duration-500',
                  on
                    ? 'border-primary/40 bg-primary/[0.08] text-primary/90'
                    : 'border-border/20 text-muted-foreground/40',
                )}
              >
                {engineLabel(e)}
              </div>
            );
          })}
        </div>

        <div className="w-64 mx-auto h-1 bg-secondary/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 rounded-full transition-all duration-300"
            style={{ width: `${(activeEngines / ENGINES.length) * 100}%` }}
          />
        </div>
      </div>
    </HolographicPanel>
  );
}

export default QuantumLoadingScreen;
