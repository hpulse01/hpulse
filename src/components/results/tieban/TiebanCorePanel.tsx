import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import type { FullDestinyReport, KaoKeWithMatch, CalibrationResult } from '@/utils/tiebanAlgorithm';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { TiebanBaseTrace } from './TiebanBaseTrace';
import { SystemOffsetPanel } from './SystemOffsetPanel';
import { FamilyVerificationTrace } from './FamilyVerificationTrace';
import { ClauseLookupPanel, type ClauseLookupItem } from './ClauseLookupPanel';
import { TiebanDestinySections, type DestinySectionView } from './TiebanDestinySections';
import { TiebanAuditTrace } from './TiebanAuditTrace';

interface Props {
  engineOutput?: EngineOutput | null;
  fullReport?: FullDestinyReport | null;
  calibration?: CalibrationResult | null;
  selectedKaoKe?: KaoKeWithMatch | null;
  expectedFact?: { fatherZodiac?: number; motherZodiac?: number; parentsStatus?: string; siblingsCount?: number } | null;
  baseNumber?: number;
  theoreticalBase?: number;
  pillarsDisplay?: string;
}

const SECTION_LABELS: Record<string, string> = {
  overview: '命运总论', marriage: '婚姻姻缘', wealth: '财运财富', career: '事业前程',
  health: '健康寿元', children: '子嗣后代', parents: '父母六亲', migration: '迁移远行', disaster: '灾厄风险',
};

/** TiebanCorePanel — orchestrates the full Tieban result view (desktop 2-col, mobile accordion). */
export function TiebanCorePanel(props: Props) {
  const {
    engineOutput, fullReport, calibration, selectedKaoKe, expectedFact,
    baseNumber, theoreticalBase, pillarsDisplay,
  } = props;

  if (!engineOutput && !fullReport) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        该引擎尚未接入 P4 Core / 暂无结构化输出 / 可在 P4.x 算法阶段继续补全。
      </div>
    );
  }

  const norm = (engineOutput?.normalizedOutput ?? {}) as Record<string, string>;
  const lockedQuarter = calibration?.lockedQuarterIndex
    ?? (norm.lockedQuarterIndex ? Number(norm.lockedQuarterIndex) : null);
  const sysOffset = calibration?.systemOffset
    ?? (norm.systemOffset ? Number(norm.systemOffset) : 0);
  const tBase = theoreticalBase ?? (norm.theoreticalBase ? Number(norm.theoreticalBase) : undefined);
  const confirmed = calibration?.confirmedClauseId
    ?? (norm.confirmedClauseId ? Number(norm.confirmedClauseId) : null);

  // Build destiny sections from legacy projection (always available) merged with eventCandidates parsing.
  const sections = buildSections(fullReport, engineOutput);
  const clauseItems = buildClauseItemsFromEvents(engineOutput);
  const calibTrace = parseCalibrationTrace(engineOutput);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">{engineOutput?.engineNameCN ?? '铁板神数'}</h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{engineOutput?.engineVersion ?? '—'}</span>
        <ImplementationStatusBadge status={norm.implementationStatus} />
        <SourceGradeBadge grade={engineOutput?.sourceGrade} />
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {{formatPercent(engineOutput?.confidence)} · compl {{formatScore(engineOutput?.completenessScore)}
        </span>
      </header>

      {/* Desktop: 2-col base+calibration | sections+clauses. Mobile: stacked accordions. */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <TiebanBaseTrace
            baseNumber={baseNumber}
            theoreticalBase={tBase}
            lockedQuarterIndex={lockedQuarter}
            systemOffset={sysOffset}
            pillarsDisplay={pillarsDisplay}
            calculationSteps={engineOutput?.explanationTrace?.filter(s => s.includes('base') || s.includes('quarter') || s.includes('theoretical'))}
          />
          <SystemOffsetPanel
            systemOffset={sysOffset}
            theoreticalBase={tBase}
            confirmedClauseId={confirmed}
            lockedQuarterIndex={lockedQuarter}
          />
          <FamilyVerificationTrace
            selectedOption={selectedKaoKe}
            expectedFact={expectedFact}
            calibrationTrace={calibTrace}
            systemOffset={sysOffset}
            theoreticalBase={tBase}
            confirmedClauseId={confirmed}
          />
        </div>
        <div className="space-y-3">
          {clauseItems.length > 0 && <ClauseLookupPanel items={clauseItems} />}
          <TiebanDestinySections sections={sections} />
        </div>
      </div>

      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="基础计算 · Base + Quarter" subtitle={`base ${baseNumber ?? '—'} · θ ${tBase ?? '—'}`} defaultOpen>
          <TiebanBaseTrace
            baseNumber={baseNumber}
            theoreticalBase={tBase}
            lockedQuarterIndex={lockedQuarter}
            systemOffset={sysOffset}
            pillarsDisplay={pillarsDisplay}
            calculationSteps={engineOutput?.explanationTrace}
          />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="系统偏移 · System Offset" subtitle={`offset ${sysOffset}`}>
          <SystemOffsetPanel systemOffset={sysOffset} theoreticalBase={tBase} confirmedClauseId={confirmed} lockedQuarterIndex={lockedQuarter} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="六亲校时 · Family Calibration">
          <FamilyVerificationTrace selectedOption={selectedKaoKe} expectedFact={expectedFact} calibrationTrace={calibTrace} systemOffset={sysOffset} theoreticalBase={tBase} confirmedClauseId={confirmed} />
        </MobileSectionAccordion>
        {clauseItems.length > 0 && (
          <MobileSectionAccordion title="条文映射 · Clause Lookup" subtitle={`${clauseItems.length} 条`}>
            <ClauseLookupPanel items={clauseItems} title="" />
          </MobileSectionAccordion>
        )}
        <MobileSectionAccordion title="报告分区 · Destiny Sections" subtitle={`${sections.length} 区`} defaultOpen>
          <TiebanDestinySections sections={sections} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计 · Audit Trace">
          <TiebanAuditTrace engineOutput={engineOutput ?? null} />
        </MobileSectionAccordion>
      </div>

      {/* Desktop audit trace */}
      <div className="hidden lg:block">
        <TiebanAuditTrace engineOutput={engineOutput ?? null} />
      </div>
    </div>
  );
}

function buildSections(report?: FullDestinyReport | null, eo?: EngineOutput | null): DestinySectionView[] {
  // Prefer P4 core sections parsed from eventCandidates (carries exact/fallback flags).
  const eventSections = parseSectionsFromEvents(eo);
  if (eventSections.length > 0) return eventSections;
  // Fallback to legacy DestinyProjection numeric scores.
  if (!report?.destinyProjection) return [];
  const dp = report.destinyProjection;
  return [
    { sectionKey: 'overview', sectionName: SECTION_LABELS.overview, confidence: dp.lifeDestiny / 100, content: `命数评分 ${dp.lifeDestiny}/100` },
    { sectionKey: 'marriage', sectionName: SECTION_LABELS.marriage, confidence: dp.marriage / 100, content: `婚姻评分 ${dp.marriage}/100` },
    { sectionKey: 'wealth', sectionName: SECTION_LABELS.wealth, confidence: dp.wealth / 100, content: `财运评分 ${dp.wealth}/100` },
    { sectionKey: 'career', sectionName: SECTION_LABELS.career, confidence: dp.career / 100, content: `事业评分 ${dp.career}/100` },
    { sectionKey: 'health', sectionName: SECTION_LABELS.health, confidence: dp.health / 100, content: `健康评分 ${dp.health}/100` },
    { sectionKey: 'children', sectionName: SECTION_LABELS.children, confidence: dp.children / 100, content: `子嗣评分 ${dp.children}/100` },
  ];
}

function parseSectionsFromEvents(eo?: EngineOutput | null): DestinySectionView[] {
  if (!eo?.eventCandidates) return [];
  const out: DestinySectionView[] = [];
  for (const ev of eo.eventCandidates) {
    // patterns: "命运总论:条文123(精确)" / "...(回退±2)" / "...(unavailable)"
    const m = ev.match(/^(.+?):条文(\d+)(?:→(\d+))?\((.+?)\)$/);
    if (!m) continue;
    const [, name, reqStr, matchedStr, status] = m;
    const requested = Number(reqStr);
    const matched = matchedStr ? Number(matchedStr) : (status === '精确' ? requested : null);
    const exactMatch = status === '精确';
    const fallbackUsed = status.startsWith('回退');
    const distMatch = status.match(/±(\d+)/);
    const sectionKey = nameToKey(name);
    out.push({
      sectionKey, sectionName: name, requestedClauseNumber: requested,
      matchedClauseNumber: matched, exactMatch, fallbackUsed,
      fallbackDistance: distMatch ? Number(distMatch[1]) : null,
      fallbackReason: exactMatch ? 'EXACT' : fallbackUsed ? 'NEAREST_NEIGHBOR' : 'NO_MATCH',
      confidence: exactMatch ? 0.85 : fallbackUsed ? 0.55 : 0.3,
    });
  }
  return out;
}

function buildClauseItemsFromEvents(eo?: EngineOutput | null): ClauseLookupItem[] {
  return parseSectionsFromEvents(eo).map(s => ({
    requestedClauseNumber: s.requestedClauseNumber,
    matchedClauseNumber: s.matchedClauseNumber,
    exactMatch: s.exactMatch,
    fallbackUsed: s.fallbackUsed,
    fallbackDistance: s.fallbackDistance,
    fallbackReason: s.fallbackReason,
    sectionName: s.sectionName,
  }));
}

function parseCalibrationTrace(eo?: EngineOutput | null): string[] {
  if (!eo?.explanationTrace) return [];
  return eo.explanationTrace.filter(s => /calibrat|familyVerif|kaoke|六亲|systemOffset/i.test(s));
}

function nameToKey(name: string): string {
  const m: Record<string, string> = {
    '命运总论': 'overview', '婚姻姻缘': 'marriage', '财运财富': 'wealth', '事业前程': 'career',
    '健康寿元': 'health', '子嗣后代': 'children', '父母六亲': 'parents', '迁移远行': 'migration', '灾厄风险': 'disaster',
  };
  return m[name] ?? name;
}
