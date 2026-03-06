import { Badge } from '@/components/ui/badge';
import type { SystemContribution, LifeAspect } from '@/utils/quantumPredictionEngine';
import { QuantumPredictionEngine } from '@/utils/quantumPredictionEngine';

interface QuantumCoherencePanelProps {
  contributions: Record<LifeAspect, SystemContribution[]>;
  selectedAspect: LifeAspect | null;
  overallCoherence: number;
}

const SYSTEM_COLORS: Record<string, string> = {
  '八字命理': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  '紫微斗数': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  '六爻卦象': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  '铁板神数': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

function BarSegment({ value, color }: { value: number; color: string }) {
  return (
    <div
      className={`h-2 rounded-full transition-all duration-700 ${color}`}
      style={{ width: `${Math.max(2, value)}%` }}
    />
  );
}

export function QuantumCoherencePanel({
  contributions,
  selectedAspect,
  overallCoherence,
}: QuantumCoherencePanelProps) {
  const displayAspect = selectedAspect || 'fortune';
  const contribs = contributions[displayAspect] || [];
  const label = QuantumPredictionEngine.getAspectLabel(displayAspect);

  const coherencePercent = Math.round(overallCoherence * 100);
  const coherenceColor =
    coherencePercent >= 70 ? 'text-emerald-400' :
    coherencePercent >= 40 ? 'text-amber-400' :
    'text-rose-400';

  return (
    <div className="space-y-4">
      {/* Overall Coherence */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">系统共振度</span>
        <span className={`text-lg font-mono font-bold ${coherenceColor}`}>
          {coherencePercent}%
        </span>
      </div>
      <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            coherencePercent >= 70 ? 'bg-emerald-500' :
            coherencePercent >= 40 ? 'bg-amber-500' :
            'bg-rose-500'
          }`}
          style={{ width: `${coherencePercent}%` }}
        />
      </div>

      {/* Per-System Breakdown */}
      <div className="pt-2 border-t border-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-serif text-primary">
            {label} · 四系分析
          </span>
          <Badge variant="outline" className="text-[10px]">
            {displayAspect}
          </Badge>
        </div>

        <div className="space-y-3">
          {contribs.map((c, i) => {
            const barColor =
              c.system === '八字命理' ? 'bg-amber-500' :
              c.system === '紫微斗数' ? 'bg-violet-500' :
              c.system === '六爻卦象' ? 'bg-cyan-500' :
              'bg-rose-500';

            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 ${SYSTEM_COLORS[c.system] || ''}`}
                    >
                      {c.system}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      权重 {Math.round(c.weight * 100)}%
                    </span>
                  </div>
                  <span className="text-xs font-mono text-foreground">
                    {Math.round(c.rawScore)}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                  <BarSegment value={c.rawScore} color={barColor} />
                </div>
                <p className="text-[10px] text-muted-foreground/70 truncate">
                  {c.detail}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
