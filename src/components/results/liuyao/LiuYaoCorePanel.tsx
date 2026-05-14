import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { HexagramDisplay } from './HexagramDisplay';
import { ChangingLinesPanel } from './ChangingLinesPanel';
import { SixRelativesPanel } from './SixRelativesPanel';
import { SixSpiritsPanel } from './SixSpiritsPanel';
import { YongShenPanel } from './YongShenPanel';
import { LiuYaoJudgementPanel } from './LiuYaoJudgementPanel';
import { LiuYaoAuditTrace } from './LiuYaoAuditTrace';

interface Props { engineOutput?: EngineOutput | null }

export function LiuYaoCorePanel({ engineOutput }: Props) {
  if (!engineOutput) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        该引擎尚未接入 P4 Core / 六爻暂无结构化输出 / 可在 P4.x 算法阶段继续补全。
      </div>
    );
  }
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const events = engineOutput.eventCandidates ?? [];

  // Parse changing lines from events: "动爻:第X爻RELbranch→REL2branch2"
  const changingLines = events
    .map(e => e.match(/^动爻:第(\d+)爻(.+?)([子丑寅卯辰巳午未申酉戌亥])→(.+?)([子丑寅卯辰巳午未申酉戌亥])$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map(m => ({ position: Number(m[1]), fromRelative: m[2], fromBranch: m[3], toRelative: m[4], toBranch: m[5] }));

  // Build line array (positions 1-6) from changing-lines events for SixRelatives display
  const changingPos = new Set(changingLines.map(c => c.position));
  const shi = norm.shiYao ? Number(norm.shiYao) : undefined;
  const ying = norm.yingYao ? Number(norm.yingYao) : undefined;
  const lines = Array.from({ length: 6 }).map((_, i) => {
    const pos = i + 1;
    const cl = changingLines.find(c => c.position === pos);
    return {
      position: pos,
      type: undefined as 'yang' | 'yin' | undefined,
      isChanging: changingPos.has(pos),
      isShi: pos === shi,
      isYing: pos === ying,
      relative: cl?.fromRelative,
      branch: cl?.fromBranch,
    };
  });

  // Clash/combine from events
  const clashCombine = events
    .map(e => e.match(/^(冲卦|合卦|冲爻|合爻|刑|害|破):(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map(m => ({ type: m[1], description: m[2] }));

  const yongShenStrength = norm.yongShenStrength;
  const yongShen = norm.yongShen;
  const hidden = yongShenStrength === '不现' || yongShen === '不现';

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">{engineOutput.engineNameCN ?? '六爻'}</h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{engineOutput.engineVersion}</span>
        <ImplementationStatusBadge status={(norm.implementationStatus as string) ?? (norm.p4ImplementationStatus as string) ?? undefined} />
        <SourceGradeBadge grade={engineOutput.sourceGrade} />
        {norm.castingSource && <span className="text-[10px] font-mono text-muted-foreground/65">起卦 · {norm.castingSource}</span>}
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {formatPercent(engineOutput.confidence)} · compl {formatScore(engineOutput.completenessScore)}
        </span>
      </header>

      {/* Desktop: 卦象 left, 判断 right */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(280px,1fr)_1.5fr] gap-5">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <HexagramDisplay name={norm.mainHexagram} palace={norm.palace} lines={lines} label="本卦 · Main" />
            <HexagramDisplay name={norm.changedHexagram || undefined} label="变卦 · Changed" />
          </div>
          <ChangingLinesPanel items={changingLines} />
        </div>
        <div className="space-y-3">
          <YongShenPanel yongShen={yongShen} strength={yongShenStrength} hidden={hidden} />
          <div className="grid grid-cols-2 gap-3">
            <SixRelativesPanel lines={lines} />
            <SixSpiritsPanel spirits={undefined} />
          </div>
          <LiuYaoJudgementPanel clashCombine={clashCombine} events={events.filter(e => !e.startsWith('动爻') && !e.startsWith('本卦') && !e.startsWith('变卦'))} />
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="卦象 · Hexagrams" defaultOpen>
          <div className="space-y-3">
            <HexagramDisplay name={norm.mainHexagram} palace={norm.palace} lines={lines} label="本卦 · Main" />
            <HexagramDisplay name={norm.changedHexagram || undefined} label="变卦 · Changed" />
            <ChangingLinesPanel items={changingLines} />
          </div>
        </MobileSectionAccordion>
        <MobileSectionAccordion title="用神 · Yong Shen" defaultOpen>
          <YongShenPanel yongShen={yongShen} strength={yongShenStrength} hidden={hidden} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="六亲 · Six Relatives">
          <SixRelativesPanel lines={lines} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="六神 · Six Spirits">
          <SixSpiritsPanel spirits={undefined} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读 · Judgement">
          <LiuYaoJudgementPanel clashCombine={clashCombine} events={events} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计 · Audit">
          <LiuYaoAuditTrace engineOutput={engineOutput} />
        </MobileSectionAccordion>
      </div>

      <div className="hidden lg:block">
        <LiuYaoAuditTrace engineOutput={engineOutput} />
      </div>
    </div>
  );
}
