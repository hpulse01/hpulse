import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { HolographicPanel } from './HolographicPanel';
import { MetricCard } from './MetricCard';
import { useI18n } from '@/hooks/useI18n';

interface ResultShellProps {
  quantumSignature: string;
  coherence: number;
  worldsGenerated: number;
  engineCount: number;
  dominantElement: string;
  deathAge?: number;
  ganZhiDisplay: string;
  lifeSummary: string;
  children: ReactNode;
}

export function ResultShell({
  quantumSignature,
  coherence,
  worldsGenerated,
  engineCount,
  dominantElement,
  deathAge,
  ganZhiDisplay,
  lifeSummary,
  children,
}: ResultShellProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      {/* Quantum Signature Banner */}
      <HolographicPanel variant="ritual" innerPadding="lg">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/[0.06]">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-primary/85 font-mono">
              {t('ui.destiny_resolved_badge')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-gradient-gold tracking-[0.22em]">
            {t('ui.destiny_resolved')}
          </h2>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider break-all px-4">
            {quantumSignature}
          </p>
          <div className="inline-block px-4 py-1.5 bg-card/50 rounded-lg border border-primary/15">
            <span className="text-foreground/80 font-serif tracking-[0.3em] text-sm">
              {ganZhiDisplay}
            </span>
          </div>
        </div>

        <div className={`mt-6 grid grid-cols-2 ${deathAge == null ? 'md:grid-cols-4' : 'md:grid-cols-5'} gap-2.5`}>
          <MetricCard
            label="Coherence"
            value={Math.round(coherence * 100)}
            unit="%"
            tone="gold"
          />
          <MetricCard
            label="Worlds"
            value={worldsGenerated.toLocaleString()}
            tone="quantum"
          />
          <MetricCard label="Engines" value={engineCount} tone="default" />
          <MetricCard
            label="Element"
            value={dominantElement}
            tone="gold"
          />
          {deathAge != null && (
            <MetricCard
              label="Lifespan"
              value={deathAge}
              unit="岁"
              tone="danger"
            />
          )}
        </div>
      </HolographicPanel>

      {/* Life Summary */}
      <HolographicPanel variant="elevated" innerPadding="md">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.35em] text-primary/70 font-mono">
              System Verdict · 系统总论
            </span>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed font-sans">
            {lifeSummary}
          </p>
          <p className="text-[10px] text-muted-foreground/55 italic font-sans pt-2 border-t border-border/20">
            本结果是当前算法版本下的文化规则解释，不是事实预测，也不能替代任何专业意见。
          </p>
        </div>
      </HolographicPanel>

      {children}
    </div>
  );
}

export default ResultShell;
