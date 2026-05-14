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

interface Props {
  engineOutput?: EngineOutput | null;
  birthYear?: number;
}

const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
];

const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/** ZiweiCorePanel — composite Ziwei view driven by EngineOutput. */
export function ZiweiCorePanel({ engineOutput, birthYear }: Props) {
  if (!engineOutput) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        该引擎尚未接入 P4 Core / 紫微暂无结构化输出 / 可在 P4.x 算法阶段继续补全。
      </div>
    );
  }
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  // ── Build palaces from aspectScores + (optional) star data buried in eventCandidates ──
  const palaceScores = engineOutput.aspectScores ?? {};
  const palaces: ZiweiPalaceCardData[] = PALACE_NAMES.map(name => ({
    name,
    strengthScore: palaceScores[name],
    isMing: name === '命宫',
    isShen: name === guessShen(norm),
    branch: undefined,
    majorStars: [],
    auxiliaryStars: [],
    shaStars: [],
  }));

  // ── Patterns / Daxian / Liunian parsed from eventCandidates ──
  const events = engineOutput.eventCandidates ?? [];
  const patterns = events
    .map(e => e.match(/^格局:(.+?)\((吉格|凶格|特殊格), impact=(-?\d+)\)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map(m => ({ name: m[1], type: m[2] as '吉格' | '凶格' | '特殊格', impact: Number(m[3]) }));

  const daxian = (engineOutput.timeWindows ?? []).map(w => ({
    startAge: w.startAge,
    endAge: w.endAge,
    palaceName: w.evidence?.replace('大限 ', '').split('(')[0]?.trim(),
    branch: w.evidence?.match(/\(([^)]+)\)/)?.[1],
    evidence: w.evidence,
  }));

  const liunian = events
    .map(e => e.match(/^流年:(\d+)\((\d+)岁\)宫=(.+?)\((.+?)\)(?: 四化:(.+))?$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map(m => ({
      year: Number(m[1]),
      age: Number(m[2]),
      palaceName: m[3],
      branch: m[4],
      sihua: m[5] ? m[5].split(',').map(s => {
        const sm = s.match(/^(.+?)([禄权科忌])$/);
        return sm ? { star: sm[1], transform: sm[2] } : { star: s, transform: '' };
      }) : [],
    }));

  const targetYear = liunian[0]?.year;
  const currentAge = birthYear && targetYear ? targetYear - birthYear : undefined;

  const sihuaItems: { star: string; transform: string }[] = []; // not surfaced in normalizedOutput; left empty graceful

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">{engineOutput.engineNameCN ?? '紫微斗数'}</h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{engineOutput.engineVersion}</span>
        <ImplementationStatusBadge status={norm.implementationStatus} />
        <SourceGradeBadge grade={engineOutput.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {((engineOutput.confidence ?? 0) * 100).toFixed(0)}% · compl {(engineOutput.completenessScore ?? 0).toFixed(0)}
        </span>
      </header>

      {/* Basic chart info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Cell label="年柱" value={norm.yearGanZhi} />
        <Cell label="命宫地支" value={norm.mingGongBranch} />
        <Cell label="身宫地支" value={norm.shenGongBranch} />
        <Cell label="五行局" value={norm.wuxingJu} />
      </div>

      {/* Palace chart — desktop matrix / mobile cards */}
      <ZiweiPalaceChart palaces={palaces} />

      {/* Desktop side-by-side patterns + strength */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <ZiweiSihuaPanel items={sihuaItems} yearStem={norm.mingGongStem} />
          <ZiweiPatternPanel items={patterns} />
        </div>
        <div className="space-y-3">
          <ZiweiStrengthPanel
            mingScore={norm.mingScore ? Number(norm.mingScore) : undefined}
            grade={norm.grade}
            palaceScores={palaceScores}
          />
          <ZiweiDaxianTimeline items={daxian} currentAge={currentAge} />
        </div>
      </div>

      <div className="hidden lg:block">
        <ZiweiLiunianPanel items={liunian} targetYear={targetYear} />
      </div>

      <div className="hidden lg:block">
        <ZiweiStarMatrix starsByPalace={Object.fromEntries(palaces.map(p => [p.name, { major: p.majorStars ?? [], auxiliary: p.auxiliaryStars ?? [], sha: p.shaStars ?? [] }]))} />
      </div>

      {/* Mobile accordions */}
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="四化 · Sihua">
          <ZiweiSihuaPanel items={sihuaItems} yearStem={norm.mingGongStem} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="格局 · Patterns" subtitle={`${patterns.length} 格`}>
          <ZiweiPatternPanel items={patterns} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="命格强度 · Strength" defaultOpen>
          <ZiweiStrengthPanel mingScore={norm.mingScore ? Number(norm.mingScore) : undefined} grade={norm.grade} palaceScores={palaceScores} />
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

function guessShen(norm: Record<string, string>): string | undefined {
  // best-effort: if normalizedOutput exposes shenGong palace name; else undefined.
  if (!norm.shenGongBranch) return undefined;
  // Without the full palace ring, mapping branch→palace requires the chart; mark unknown.
  const idx = BRANCHES.indexOf(norm.shenGongBranch);
  return idx >= 0 ? undefined : undefined;
}
