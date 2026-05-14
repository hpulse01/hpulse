import { formatPercent, formatScore } from '@/utils/displayFormat';
import type { EngineOutput } from '@/types/prediction';
import { SourceGradeBadge } from '@/components/hpulse/SourceGradeBadge';
import { ImplementationStatusBadge } from '@/components/hpulse/ImplementationStatusBadge';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { MeihuaHexagramTrio } from './MeihuaHexagramTrio';
import { BodyUsePanel } from './BodyUsePanel';
import { TrigramRelationPanel } from './TrigramRelationPanel';
import { MeihuaJudgementPanel } from './MeihuaJudgementPanel';
import { MeihuaAuditTrace } from './MeihuaAuditTrace';

interface Props { engineOutput?: EngineOutput | null }

export function MeihuaCorePanel({ engineOutput }: Props) {
  if (!engineOutput) {
    return (
      <div className="rounded-xl border border-primary/15 bg-card/30 p-4 text-xs text-muted-foreground">
        该引擎尚未接入 P4 Core / 梅花暂无结构化输出 / 可在 P4.x 算法阶段继续补全。
      </div>
    );
  }
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const events = engineOutput.eventCandidates ?? [];
  const movingLine = norm.movingLine ? Number(norm.movingLine) : undefined;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-serif tracking-[0.22em] text-gradient-gold">{engineOutput.engineNameCN ?? '梅花易数'}</h3>
        <span className="text-[10px] font-mono text-muted-foreground/70">v{engineOutput.engineVersion}</span>
        <ImplementationStatusBadge status={norm.implementationStatus} />
        <SourceGradeBadge grade={engineOutput.sourceGrade} />
        {norm.castingSource && <span className="text-[10px] font-mono text-muted-foreground/65">起卦 · {norm.castingSource}</span>}
        <span className="ml-auto text-[10px] font-mono text-primary/85 tabular-nums">
          conf {{formatPercent(engineOutput.confidence)} · compl {{formatScore(engineOutput.completenessScore)}
        </span>
      </header>

      <MeihuaHexagramTrio
        bengua={{ name: norm.benGua, upper: { name: norm.upperTrigram }, lower: { name: norm.lowerTrigram } }}
        hugua={{ name: norm.huGua }}
        biangua={{ name: norm.bianGua }}
        movingLine={movingLine}
      />

      <div className="hidden lg:grid lg:grid-cols-2 gap-3">
        <BodyUsePanel
          bodyTrigram={norm.bodyTrigram}
          useTrigram={norm.useTrigram}
          relation={norm.bodyUseRelation}
          trend={norm.trend}
        />
        <TrigramRelationPanel upperTrigram={norm.upperTrigram} lowerTrigram={norm.lowerTrigram} />
      </div>

      <div className="hidden lg:block">
        <MeihuaJudgementPanel
          relation={norm.bodyUseRelation}
          trend={norm.trend}
          trendScore={engineOutput.aspectScores?.bodyUseTrendScore}
          events={events}
        />
      </div>

      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="体用 · Body / Use" defaultOpen>
          <BodyUsePanel bodyTrigram={norm.bodyTrigram} useTrigram={norm.useTrigram} relation={norm.bodyUseRelation} trend={norm.trend} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="上下卦 · Trigram Relation">
          <TrigramRelationPanel upperTrigram={norm.upperTrigram} lowerTrigram={norm.lowerTrigram} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="系统判读 · Judgement" defaultOpen>
          <MeihuaJudgementPanel relation={norm.bodyUseRelation} trend={norm.trend} trendScore={engineOutput.aspectScores?.bodyUseTrendScore} events={events} />
        </MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计 · Audit">
          <MeihuaAuditTrace engineOutput={engineOutput} />
        </MobileSectionAccordion>
      </div>

      <div className="hidden lg:block">
        <MeihuaAuditTrace engineOutput={engineOutput} />
      </div>
    </div>
  );
}
