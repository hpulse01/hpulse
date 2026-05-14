import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';

interface Props {
  bazi: EngineOutput | undefined | null;
}

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

/**
 * BaziCorePanel — surfaces the four pillars + day master + pattern from
 * the P4.2 bazi engine's normalizedOutput. Gracefully handles missing
 * data with explicit fallback messaging.
 */
export function BaziCorePanel({ bazi }: Props) {
  if (!bazi) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        八字引擎尚未接入 P4 Core 输出 / Bazi engine output not available.
      </div>
    );
  }

  const n = bazi.normalizedOutput ?? {};
  const pillars = [n.yearGZ, n.monthGZ, n.dayGZ, n.hourGZ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">
          {bazi.engineNameCN || '八字命理'}
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{bazi.engineVersion}</span>
        <ImplementationStatusBadge status={n.implementationStatus} />
        <SourceGradeBadge grade={bazi.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85">
          conf {((bazi.confidence ?? 0) * 100).toFixed(0)}% · compl {(bazi.completenessScore ?? 0).toFixed(0)}
        </span>
      </header>

      {/* Four pillars grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {pillars.map((gz, i) => (
          <div key={i} className="rounded-lg border border-primary/20 bg-card/50 px-3 py-3 text-center shadow-[0_0_24px_-14px_hsl(40_65%_55%_/_0.55)]">
            <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">{PILLAR_LABELS[i]}</div>
            <div className="mt-1 font-serif text-2xl tracking-[0.32em] text-primary/95">{gz || '—'}</div>
          </div>
        ))}
      </div>

      {/* Day master strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Cell label="日主" value={n.dayMaster} />
        <Cell label="日主五行" value={n.dayMasterElement} />
        <Cell label="强弱" value={n.strengthLevel} hint={`score ${n.strengthScore ?? '—'}`} />
        <Cell label="格局" value={n.pattern} />
      </div>

      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">用神 / Useful God</div>
        <div className="mt-1 text-sm font-serif tracking-wider text-primary/90">{n.usefulGod || '—'}</div>
      </div>

      {/* Da Yun timeline (timeWindows) */}
      {Array.isArray(bazi.timeWindows) && bazi.timeWindows.length > 0 && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">大运 · Da Yun</div>
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
            <ol className="inline-flex gap-2 min-w-full">
              {bazi.timeWindows.map((w, i) => (
                <li key={i} className="shrink-0 rounded-md border border-primary/15 bg-card/40 px-3 py-2 text-center min-w-[110px]">
                  <div className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                    {w.startAge}–{w.endAge}
                  </div>
                  <div className="mt-1 font-serif text-sm text-primary/90">{w.evidence?.replace('大运 ', '')}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, hint }: { label: string; value?: string; hint?: string }) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">{label}</div>
      <div className="mt-1 font-serif text-base tracking-wider text-foreground">{value || '—'}</div>
      {hint && <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{hint}</div>}
    </div>
  );
}
