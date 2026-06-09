import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { EngineWarningStrip } from '../_shared/EnginePanelShell';
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

  // P4.4c — rich fields
  const kongWangPillars = asText(n.kongWangPillars).split(',').filter(Boolean);
  const tiaohou = safeJson<{ primary: string; description: string; presentInStems: boolean }>(asText(n.tiaohouJson));
  const flowYear = safeJson<{ year: number; age: number; ganZhi: string; tenGod: string; clashes: string[]; combinations: string[]; riskFlags: string[]; opportunityFlags: string[] }>(asText(n.flowYearJson));
  const flowMonth = safeJson<{ year: number; month: number; ganZhi: string; tenGod: string; clashes: string[]; combinations: string[]; riskFlags: string[]; opportunityFlags: string[] }>(asText(n.flowMonthJson));
  const domainScores = safeJson<Record<string, number>>(asText(n.domainScoresJson));
  const domainSignals = safeJson<Record<string, string[]>>(asText(n.domainSignalsJson));
  const usefulCandidates = safeJson<Array<{ element: string; reason: string; score: number }>>(asText(n.usefulGodCandidatesJson)) ?? [];
  const currentDaYunGZ = asText(n.currentDaYunGZ);
  const currentDaYunTG = asText(n.currentDaYunTenGod);

  const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];
  const DOMAIN_LABELS: Record<string, string> = {
    career: '事业', wealth: '财富', relationship: '感情', health: '健康', family: '家庭',
  };

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

      <EngineWarningStrip warnings={bazi.warnings} uncertainty={bazi.uncertaintyNotes} />


      {/* Four pillars grid with kongWang indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {pillars.map((gz, i) => {
          const isKong = kongWangPillars.includes(PILLAR_KEYS[i]);
          return (
            <div key={i} className="rounded-lg border border-primary/20 bg-card/50 px-3 py-3 text-center shadow-[0_0_24px_-14px_hsl(40_65%_55%_/_0.55)] relative">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">{PILLAR_LABELS[i]}</div>
              <div className="mt-1 font-serif text-2xl tracking-[0.32em] text-primary/95">{gz || '—'}</div>
              {isKong && (
                <div className="absolute top-1 right-1 text-[9px] px-1 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">空</div>
              )}
            </div>
          );
        })}
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
          {usefulCandidates.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {usefulCandidates.slice(0, 4).map((c, i) => (
                <div key={i} className="text-[10px] text-muted-foreground flex items-center justify-between gap-2">
                  <span><span className="text-foreground/85">{c.element}</span> · {c.reason}</span>
                  <span className="font-mono text-primary/70">{c.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">忌神 · Avoid</div>
          <div className="mt-1 text-sm font-serif tracking-wider text-foreground/85">{avoidGod || '—'}</div>
        </div>
      </div>

      {/* Tiaohou */}
      {tiaohou && (
        <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 flex items-center justify-between">
            <span>调候用神 · Tiaohou</span>
            <span className={`text-[9px] px-1 rounded border ${tiaohou.presentInStems ? 'text-emerald-300 border-emerald-400/40' : 'text-amber-300 border-amber-400/40'}`}>
              {tiaohou.presentInStems ? '原局有' : '原局缺'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-serif text-primary">{tiaohou.primary}</span>
            <span className="text-[11px] text-muted-foreground">{tiaohou.description}</span>
          </div>
        </div>
      )}

      {/* Domain scores radar-like display */}
      {domainScores && (
        <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">五维细分</div>
          <div className="space-y-1.5">
            {Object.entries(domainScores).map(([key, score]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground/85 font-sans">{DOMAIN_LABELS[key] ?? key}</span>
                  <span className="font-mono text-primary/80">{Math.round(score)}</span>
                </div>
                <div className="h-1 bg-secondary/30 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                </div>
                {domainSignals?.[key]?.length ? (
                  <div className="text-[10px] text-muted-foreground/80 mt-0.5 leading-relaxed">
                    {domainSignals[key].slice(0, 2).join(' · ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Da Yun timeline */}
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2 flex items-center justify-between">
          <span>大运 · Da Yun</span>
          {currentDaYunGZ && (
            <span className="text-[10px] text-primary/85 font-serif">当前 {currentDaYunGZ}{currentDaYunTG ? `（${currentDaYunTG}）` : ''}</span>
          )}
        </div>
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

      {/* Flow year + month */}
      {(flowYear || flowMonth) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {flowYear && (
            <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">
                流年 {flowYear.year}（{flowYear.age}岁）
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-base font-serif text-primary">{flowYear.ganZhi}</span>
                <span className="text-[11px] text-muted-foreground">{flowYear.tenGod}</span>
              </div>
              <FlowFlags clashes={flowYear.clashes} combinations={flowYear.combinations} risks={flowYear.riskFlags} opps={flowYear.opportunityFlags} />
            </div>
          )}
          {flowMonth && (
            <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">
                流月 {flowMonth.year}/{flowMonth.month}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-base font-serif text-primary">{flowMonth.ganZhi}</span>
                <span className="text-[11px] text-muted-foreground">{flowMonth.tenGod}</span>
              </div>
              <FlowFlags clashes={flowMonth.clashes} combinations={flowMonth.combinations} risks={flowMonth.riskFlags} opps={flowMonth.opportunityFlags} />
            </div>
          )}
        </div>
      )}

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

function safeJson<T>(s: string): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

function FlowFlags({ clashes, combinations, risks, opps }: { clashes?: string[]; combinations?: string[]; risks?: string[]; opps?: string[] }) {
  const hasAny = (clashes?.length || combinations?.length || risks?.length || opps?.length);
  if (!hasAny) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {clashes?.map((c, i) => <span key={`c${i}`} className="text-[9px] px-1 rounded border border-rose-400/40 text-rose-300">冲 {c}</span>)}
      {combinations?.map((c, i) => <span key={`m${i}`} className="text-[9px] px-1 rounded border border-emerald-400/40 text-emerald-300">合 {c}</span>)}
      {risks?.map((r, i) => <span key={`r${i}`} className="text-[9px] px-1 rounded border border-amber-400/40 text-amber-300">险 {r}</span>)}
      {opps?.map((o, i) => <span key={`o${i}`} className="text-[9px] px-1 rounded border border-sky-400/40 text-sky-300">机 {o}</span>)}
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
