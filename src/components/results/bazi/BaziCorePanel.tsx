import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { asText, formatPercent, formatScore } from '@/utils/displayFormat';

interface Props {
  bazi: EngineOutput | undefined | null;
}

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

const STEM_TO_ELEMENT: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

/** Parse "甲子 乙丑 丙寅 丁卯" → individual pillars. */
function pillarFromLegacy(four: string | undefined, idx: number): string {
  if (!four) return '';
  const parts = four.split(/\s+/).filter(Boolean);
  return parts[idx] ?? '';
}

/** Parse legacy "甲(木)" → "甲" */
function dayMasterFromLegacy(legacy: string | undefined): string {
  if (!legacy) return '';
  const m = legacy.match(/^(.)(?:\(|（|$)/);
  return m?.[1] ?? legacy;
}

/** Parse "偏强(72分)" → "偏强" */
function strengthLevelFromLegacy(legacy: string | undefined): string {
  if (!legacy) return '';
  return legacy.replace(/[(（].*$/, '');
}

export function BaziCorePanel({ bazi }: Props) {
  if (!bazi) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        八字引擎尚未接入 P4 Core 输出 / Bazi engine output not available.
      </div>
    );
  }

  const n = bazi.normalizedOutput ?? {};
  const four = asText(n['四柱']);

  // P4 core key → fallback to legacy 中文 key
  const yearGZ = asText(n.yearGZ) || pillarFromLegacy(four, 0);
  const monthGZ = asText(n.monthGZ) || pillarFromLegacy(four, 1);
  const dayGZ = asText(n.dayGZ) || pillarFromLegacy(four, 2);
  const hourGZ = asText(n.hourGZ) || pillarFromLegacy(four, 3);
  const pillars = [yearGZ, monthGZ, dayGZ, hourGZ];

  const dayMasterRaw = asText(n.dayMaster) || dayMasterFromLegacy(asText(n['日主']));
  const dayMaster = dayMasterRaw;
  const dayMasterElement = asText(n.dayMasterElement) || STEM_TO_ELEMENT[dayMaster] || '';
  const strengthLevel = asText(n.strengthLevel) || strengthLevelFromLegacy(asText(n['强度']));
  const strengthScore = asText(n.strengthScore);
  const pattern = asText(n.pattern) || asText(n['格局']);
  const usefulGod = asText(n.usefulGod) || asText(n['喜用']);
  const avoidGod = asText(n.avoidGod) || asText(n['忌']);

  const status = asText(n.implementationStatus) || asText(n.p4ImplementationStatus);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">
          {bazi.engineNameCN || '八字命理'}
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{bazi.engineVersion}</span>
        <ImplementationStatusBadge status={status || undefined} />
        <SourceGradeBadge grade={bazi.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85">
          conf {formatPercent(bazi.confidence)} · compl {formatScore(bazi.completenessScore)}
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Cell label="日主" value={dayMaster} />
        <Cell label="日主五行" value={dayMasterElement} />
        <Cell label="强弱" value={strengthLevel} hint={strengthScore ? `score ${strengthScore}` : undefined} />
        <Cell label="格局" value={pattern} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">用神 · Useful God</div>
          <div className="mt-1 text-sm font-serif tracking-wider text-primary/90">{usefulGod || '—'}</div>
        </div>
        <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">忌神 · Avoid</div>
          <div className="mt-1 text-sm font-serif tracking-wider text-foreground/85">{avoidGod || '—'}</div>
        </div>
      </div>

      {/* Da Yun timeline (timeWindows) */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">大运 · Da Yun</div>
        {Array.isArray(bazi.timeWindows) && bazi.timeWindows.length > 0 ? (
          <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
            <ol className="inline-flex gap-2 min-w-full">
              {bazi.timeWindows.map((w, i) => (
                <li key={i} className="shrink-0 rounded-md border border-primary/15 bg-card/40 px-3 py-2 text-center min-w-[110px]">
                  <div className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                    {w.startAge}–{w.endAge}
                  </div>
                  <div className="mt-1 font-serif text-sm text-primary/90">{(w.evidence ?? '').replace('大运 ', '')}</div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground/60 italic">暂无大运时间窗 / No Da Yun windows available.</div>
        )}
      </div>

      {bazi.warnings?.length > 0 && (
        <details className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2">
          <summary className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/85 cursor-pointer">⚠ warnings ({bazi.warnings.length})</summary>
          <ul className="mt-2 space-y-1 text-[11px] text-amber-100/85">
            {bazi.warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </details>
      )}
      {bazi.explanationTrace?.length > 0 && (
        <details className="rounded-md border border-primary/15 bg-card/30 px-3 py-2">
          <summary className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 cursor-pointer">explanation trace ({bazi.explanationTrace.length})</summary>
          <ol className="mt-2 space-y-1 text-[11px] text-foreground/80 list-decimal list-inside">
            {bazi.explanationTrace.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </details>
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
