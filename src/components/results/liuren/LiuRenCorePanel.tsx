import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace, EngineWarningStrip } from '../_shared/EnginePanelShell';
import { LiuRenHeavenEarthPlate } from './LiuRenHeavenEarthPlate';
import { LiuRenFourLessonsPanel } from './LiuRenFourLessonsPanel';
import { LiuRenThreeTransmissionsPanel } from './LiuRenThreeTransmissionsPanel';
import { LiuRenGeneralsPanel } from './LiuRenGeneralsPanel';
import { LiuRenJudgementPanel } from './LiuRenJudgementPanel';

interface Props { engineOutput?: EngineOutput | null }

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function LiuRenCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="大六壬暂无结构化输出 / Da Liu Ren output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  const lessons = parseJSON<{name:string;upper?:string;lower?:string;relation?:string}[]>(norm.fourLessons, []);
  const parsedTransmissions = parseJSON<{stage:string;branch?:string;general?:string;meaning?:string}[]>(norm.threeTransmissions, []);
  const transmissions = parsedTransmissions.length > 0 ? parsedTransmissions :
    (norm.threeTransChu ? [
      { stage: '初 · Chu', branch: norm.threeTransChu },
      { stage: '中 · Zhong', branch: norm.threeTransZhong },
      { stage: '末 · Mo', branch: norm.threeTransMo, meaning: norm.threeTransMethod ? `发用: ${norm.threeTransMethod}${norm.keTi ? ` · 课体: ${norm.keTi}` : ''}` : undefined },
    ] : []);
  const generals = parseJSON<string[]>(norm.twelveGenerals, []);

  const plate = <LiuRenHeavenEarthPlate yueJiang={norm.yueJiang} zhanShi={norm.zhanShi} questionTime={norm.questionTime} hourGanzhi={norm.hourGanzhi} />;
  const four = <LiuRenFourLessonsPanel lessons={lessons} />;
  const three = <LiuRenThreeTransmissionsPanel transmissions={transmissions} />;
  const gens = <LiuRenGeneralsPanel generals={generals} />;
  const judge = <LiuRenJudgementPanel yongShen={norm.yongShen} verdict={norm.verdict ?? (norm.keTi ? `课体：${norm.keTi}` : undefined)} events={engineOutput.eventCandidates ?? []} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="大六壬" />
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
      <div className="hidden lg:grid lg:grid-cols-[1fr_1.2fr] gap-5">
        <div className="space-y-3">{plate}{gens}</div>
        <div className="space-y-3">{four}{three}{judge}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="天地盘" defaultOpen>{plate}</MobileSectionAccordion>
        <MobileSectionAccordion title="四课" defaultOpen>{four}</MobileSectionAccordion>
        <MobileSectionAccordion title="三传">{three}</MobileSectionAccordion>
        <MobileSectionAccordion title="十二天将">{gens}</MobileSectionAccordion>
        <MobileSectionAccordion title="综合判断">{judge}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
