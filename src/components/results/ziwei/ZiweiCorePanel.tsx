import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { ZiweiPalaceChart } from './ZiweiPalaceChart';
import type { ZiweiPalaceCardData } from './ZiweiPalaceCard';
import { ZiweiSihuaPanel } from './ZiweiSihuaPanel';
import { ZiweiDaxianTimeline } from './ZiweiDaxianTimeline';
import { ZiweiLiunianPanel } from './ZiweiLiunianPanel';
import { ZiweiPatternPanel } from './ZiweiPatternPanel';
import { ZiweiStrengthPanel } from './ZiweiStrengthPanel';
import { ZiweiStarMatrix } from './ZiweiStarMatrix';
import { ZiweiAuditTrace } from './ZiweiAuditTrace';
import { EngineWarningStrip } from '../_shared/EnginePanelShell';
import { asText, formatPercent, formatScore } from '@/utils/displayFormat';

interface Props {
  engineOutput?: EngineOutput | null;
  birthYear?: number;
}

const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
];

interface RawStar { name?: string; brightness?: string }
interface RawPalace {
  name?: string;
  branch?: string;
  stem?: string;
  isMing?: boolean;
  isShen?: boolean;
  isEmpty?: boolean;
  strengthScore?: number;
  majorStars?: RawStar[] | string[];
  auxiliaryStars?: RawStar[] | string[];
  shaStars?: RawStar[] | string[];
  minorStars?: RawStar[] | string[];
  borrowedFromName?: string;
  borrowedStars?: string[];
  selfSihua?: Array<{ star?: string; transform?: string }>;
}

function starName(s: unknown): string {
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object' && 'name' in s) return String((s as RawStar).name ?? '');
  return '';
}

function normalizePalace(p: RawPalace): ZiweiPalaceCardData {
  return {
    name: p.name ?? '',
    branch: p.branch,
    stem: p.stem,
    isMing: !!p.isMing,
    isShen: !!p.isShen,
    isEmpty: !!p.isEmpty,
    strengthScore: p.strengthScore,
    majorStars: (p.majorStars ?? []).map(starName).filter(Boolean),
    auxiliaryStars: (p.auxiliaryStars ?? []).map(starName).filter(Boolean),
    shaStars: (p.shaStars ?? []).map(starName).filter(Boolean),
    minorStars: (p.minorStars ?? []).map(starName).filter(Boolean),
    borrowedFromName: p.borrowedFromName,
    borrowedStars: p.borrowedStars,
    selfSihua: (p.selfSihua ?? []).map(s => ({ star: String(s.star ?? ''), transform: String(s.transform ?? '') })).filter(s => s.star),
  };
}

export function ZiweiCorePanel({ engineOutput, birthYear }: Props) {
  if (!engineOutput) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        紫微斗数引擎尚未接入 P4 Core / Ziwei engine output not available.
      </div>
    );
  }
  const norm = engineOutput.normalizedOutput ?? {};
  const status = asText(norm.implementationStatus) || asText(norm.p4ImplementationStatus);

  // ── Palaces: prefer structured normalizedOutput.palaces, fallback to aspectScores rings ──
  const rawPalaces = Array.isArray(norm.palaces) ? (norm.palaces as RawPalace[]) : null;
  const palaceScores = engineOutput.aspectScores ?? {};
  const palaces: ZiweiPalaceCardData[] = rawPalaces
    ? rawPalaces.map(normalizePalace)
    : PALACE_NAMES.map(name => ({
        name,
        strengthScore: palaceScores[name],
        isMing: name === '命宫',
        isShen: name === asText(norm.shenGong),
        majorStars: [], auxiliaryStars: [], shaStars: [],
      }));

  // ── Sihua / Daxian / Liunian / Patterns / Strength — prefer structured ──
  const sihuaRaw = Array.isArray(norm.sihua) ? (norm.sihua as Array<{ star?: string; transform?: string }>) : [];
  const sihuaItems = sihuaRaw.map(s => ({ star: String(s.star ?? ''), transform: String(s.transform ?? '') })).filter(s => s.star);

  const daxianRaw = Array.isArray(norm.daxian) ? (norm.daxian as Array<{ startAge?: number; endAge?: number; palaceName?: string; branch?: string }>) : [];
  const daxian = daxianRaw.length > 0
    ? daxianRaw.map(d => ({
        startAge: d.startAge ?? 0,
        endAge: d.endAge ?? 0,
        palaceName: d.palaceName,
        branch: d.branch,
        evidence: `大限 ${d.palaceName ?? ''}(${d.branch ?? ''})`,
      }))
    : (engineOutput.timeWindows ?? []).map(w => ({
        startAge: w.startAge,
        endAge: w.endAge,
        palaceName: w.evidence?.replace('大限 ', '').split('(')[0]?.trim(),
        branch: w.evidence?.match(/\(([^)]+)\)/)?.[1],
        evidence: w.evidence,
      }));

  const liunianRaw = Array.isArray(norm.liunian) ? (norm.liunian as Array<{ year?: number; age?: number; palaceName?: string; branch?: string; sihua?: Array<{ star?: string; transform?: string }> }>) : [];
  const liunian = liunianRaw.map(ln => ({
    year: ln.year ?? 0,
    age: ln.age ?? 0,
    palaceName: ln.palaceName ?? '',
    branch: ln.branch ?? '',
    sihua: (ln.sihua ?? []).map(s => ({ star: String(s.star ?? ''), transform: String(s.transform ?? '') })),
  }));

  const patternsRaw = Array.isArray(norm.patterns) ? (norm.patterns as Array<{ name?: string; type?: string; impact?: number }>) : [];
  const patterns = patternsRaw.map(p => ({
    name: String(p.name ?? ''),
    type: (p.type as '吉格' | '凶格' | '特殊格') ?? '吉格',
    impact: p.impact ?? 0,
  }));

  const strengthRaw = (norm.strengthAnalysis ?? null) as { mingScore?: number; grade?: string } | null;
  const mingScore = strengthRaw?.mingScore ?? (norm.mingScore ? Number(asText(norm.mingScore)) : undefined);
  const grade = strengthRaw?.grade ?? asText(norm.grade);

  const targetYear = liunian[0]?.year;
  const currentAge = birthYear && targetYear ? targetYear - birthYear : undefined;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">{engineOutput.engineNameCN ?? '紫微斗数'}</h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{engineOutput.engineVersion}</span>
        <ImplementationStatusBadge status={status || undefined} />
        <SourceGradeBadge grade={engineOutput.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {formatPercent(engineOutput.confidence)} · compl {formatScore(engineOutput.completenessScore)}
        </span>
      </header>

      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />


      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Cell label="年柱" value={asText(norm.yearGanZhi)} />
        <Cell label="命宫" value={`${asText(norm.mingGong) || ''} ${asText(norm.mingGongBranch)}`.trim()} />
        <Cell label="身宫" value={`${asText(norm.shenGong) || ''} ${asText(norm.shenGongBranch)}`.trim()} />
        <Cell label="五行局" value={asText(norm.wuxingJu)} />
      </div>

      <ZiweiPalaceChart palaces={palaces} />

      <div className="hidden lg:grid lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <ZiweiSihuaPanel items={sihuaItems} yearStem={asText(norm.mingGongStem)} />
          <ZiweiPatternPanel items={patterns} />
        </div>
        <div className="space-y-3">
          <ZiweiStrengthPanel mingScore={mingScore} grade={grade} palaceScores={palaceScores} />
          <ZiweiDaxianTimeline items={daxian} currentAge={currentAge} />
        </div>
      </div>

      <div className="hidden lg:block">
        <ZiweiLiunianPanel items={liunian} targetYear={targetYear} />
      </div>

      <div className="hidden lg:block">
        <ZiweiStarMatrix starsByPalace={Object.fromEntries(palaces.map(p => [p.name, { major: p.majorStars ?? [], auxiliary: p.auxiliaryStars ?? [], sha: p.shaStars ?? [] }]))} />
      </div>

      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="四化 · Sihua" subtitle={`${sihuaItems.length} 化`}>
          <ZiweiSihuaPanel items={sihuaItems} yearStem={asText(norm.mingGongStem)} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="格局 · Patterns" subtitle={`${patterns.length} 格`}>
          <ZiweiPatternPanel items={patterns} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="命格强度 · Strength" defaultOpen>
          <ZiweiStrengthPanel mingScore={mingScore} grade={grade} palaceScores={palaceScores} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="大限 · Da Xian" subtitle={`${daxian.length} 段`}>
          <ZiweiDaxianTimeline items={daxian} currentAge={currentAge} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="流年 · Liunian" subtitle={`${liunian.length} 年`}>
          <ZiweiLiunianPanel items={liunian} targetYear={targetYear} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计 · Audit Trace">
          <ZiweiAuditTrace engineOutput={engineOutput} />
        </MobileSectionAccordion>
      </div>

      <div className="hidden lg:block">
        <ZiweiAuditTrace engineOutput={engineOutput} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">{label}</div>
      <div className="mt-1 font-serif text-base tracking-wider text-foreground">{value || '—'}</div>
    </div>
  );
}
