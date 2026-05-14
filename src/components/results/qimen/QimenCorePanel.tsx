import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { QimenJuPanel } from './QimenJuPanel';
import { QimenNinePalaceGrid } from './QimenNinePalaceGrid';
import { QimenStarsGatesPanel } from './QimenStarsGatesPanel';
import { QimenYongShenPanel } from './QimenYongShenPanel';
import { QimenJudgementPanel } from './QimenJudgementPanel';

interface Props { engineOutput?: EngineOutput | null }

export function QimenCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="奇门遁甲暂无结构化输出 / Qi Men output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="奇门遁甲" />

      <div className="hidden lg:grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-3">
          <QimenJuPanel norm={norm} />
          <QimenNinePalaceGrid norm={norm} />
        </div>
        <div className="space-y-3">
          <QimenYongShenPanel norm={norm} />
          <QimenStarsGatesPanel norm={norm} />
          <QimenJudgementPanel events={engineOutput.eventCandidates ?? []} />
        </div>
      </div>

      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="局信息 · Ju" defaultOpen><QimenJuPanel norm={norm} /></MobileSectionAccordion>
        <MobileSectionAccordion title="九宫盘 · 9 Palaces" defaultOpen><QimenNinePalaceGrid norm={norm} /></MobileSectionAccordion>
        <MobileSectionAccordion title="用神 · Yong Shen"><QimenYongShenPanel norm={norm} /></MobileSectionAccordion>
        <MobileSectionAccordion title="星·门 · Stars & Gates"><QimenStarsGatesPanel norm={norm} /></MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读 · Judgement"><QimenJudgementPanel events={engineOutput.eventCandidates ?? []} /></MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计 · Audit"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>

      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
