/**
 * Prediction Overview — Top-level summary (bilingual)
 */
import { Badge } from '@/components/ui/badge';
import type { UnifiedPredictionResult, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { useI18n } from '@/hooks/useI18n';
import {
  Sun, Coins, Heart, Activity, Brain, Sparkles,
  CheckCircle, AlertTriangle, Zap,
} from 'lucide-react';

const DIM_ICONS: Record<FateDimension, typeof Sun> = {
  life: Sun, wealth: Coins, relation: Heart,
  health: Activity, wisdom: Brain, spirit: Sparkles,
};

const DIM_COLORS: Record<FateDimension, string> = {
  life: 'from-amber-500/80 to-amber-600/80',
  wealth: 'from-emerald-500/80 to-emerald-600/80',
  relation: 'from-rose-500/80 to-rose-600/80',
  health: 'from-purple-500/80 to-purple-600/80',
  wisdom: 'from-blue-500/80 to-blue-600/80',
  spirit: 'from-indigo-500/80 to-indigo-600/80',
};

const DIM_TEXT: Record<FateDimension, string> = {
  life: 'text-amber-400', wealth: 'text-emerald-400', relation: 'text-rose-400',
  health: 'text-purple-400', wisdom: 'text-blue-400', spirit: 'text-indigo-400',
};

function sc(v: number) {
  if (v >= 70) return 'text-emerald-400';
  if (v >= 45) return 'text-amber-300';
  return 'text-rose-400';
}

interface Props { result: UnifiedPredictionResult }

export function PredictionOverview({ result }: Props) {
  const { t, dimLabel, lang } = useI18n();
  const fv = result.fusedFateVector;
  const birthEngines = result.engineOutputs.filter(e => e.timingBasis === 'birth').length;
  const queryEngines = result.engineOutputs.filter(e => e.timingBasis === 'query').length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: t('overview.confidence'), value: `${Math.round(result.finalConfidence * 100)}%`, color: sc(result.finalConfidence * 100) },
          { label: t('overview.active_engines'), value: result.activeEngines.length, color: 'text-primary' },
          { label: t('overview.natal'), value: birthEngines, color: 'text-amber-400' },
          { label: t('overview.instant'), value: queryEngines, color: 'text-blue-400' },
          { label: t('overview.conflicts'), value: result.conflicts.length, color: result.conflicts.length > 3 ? 'text-rose-400' : 'text-emerald-400' },
          { label: t('overview.failed'), value: result.failedEngines.length, color: result.failedEngines.length > 0 ? 'text-rose-400' : 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <div className={`text-xl font-mono font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-1 font-sans">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Fate Vector */}
      <div className="glass-elevated rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-serif text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />{t('overview.fused_vector')}
          </h3>
          <span className="text-[10px] text-muted-foreground/50 font-sans">
            {result.executedEngines.length} engines · v{result.algorithmVersion}
          </span>
        </div>
        <div className="space-y-4">
          {ALL_FATE_DIMENSIONS.map(dim => {
            const Icon = DIM_ICONS[dim];
            const val = fv[dim];
            return (
              <div key={dim} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${DIM_TEXT[dim]}`} />
                    <span className="text-xs text-foreground/80 font-sans">{dimLabel(dim)}</span>
                  </div>
                  <span className={`text-sm font-mono font-semibold ${sc(val)}`}>{val}</span>
                </div>
                <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${DIM_COLORS[dim]} transition-all duration-1000`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engine groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-sans text-amber-400/80 flex items-center gap-2 mb-3">
            <Sun className="w-3.5 h-3.5" />{t('overview.natal_engines')}
            <span className="text-muted-foreground/40 text-[10px]">{t('overview.natal_desc')}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.engineOutputs.filter(e => e.timingBasis === 'birth').map(eo => (
              <span key={eo.engineName} className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/15 text-amber-300/70 bg-amber-500/5 font-sans">
                {lang === 'zh' ? eo.engineNameCN : eo.engineName}
              </span>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h4 className="text-xs font-sans text-blue-400/80 flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5" />{t('overview.instant_engines')}
            <span className="text-muted-foreground/40 text-[10px]">{t('overview.instant_desc')}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {result.engineOutputs.filter(e => e.timingBasis === 'query').map(eo => (
              <span key={eo.engineName} className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/15 text-blue-300/70 bg-blue-500/5 font-sans">
                {lang === 'zh' ? eo.engineNameCN : eo.engineName}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Causal summary */}
      <p className="text-xs text-muted-foreground/60 leading-relaxed px-1 font-sans">{result.causalSummary}</p>

      {/* Warnings */}
      {result.failedEngines.length > 0 && (
        <div className="glass rounded-xl p-3 border-destructive/20">
          {result.failedEngines.map(fe => (
            <div key={fe.engineName} className="flex items-start gap-2 text-[10px] text-destructive/80 font-sans">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{fe.engineName}: {fe.error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
