import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { PlanetPositionTable, type PlanetRow } from './PlanetPositionTable';
import { ZodiacWheelPanel } from './ZodiacWheelPanel';
import { HousePanel } from './HousePanel';
import { AspectMatrix } from './AspectMatrix';
import { WesternJudgementPanel } from './WesternJudgementPanel';

interface Props { engineOutput?: EngineOutput | null }

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function WesternCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="西方占星暂无结构化输出 / Western astrology output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  const planets = parseJSON<PlanetRow[]>(norm.planets, []);
  const houses = parseJSON<{house:number;sign?:string;cusp?:number}[]>(norm.houses, []);
  const aspects = parseJSON<{from:string;to:string;type:string;orb?:number}[]>(norm.aspects, []);
  const themes = parseJSON<string[]>(norm.themes, []);

  const wheel = <ZodiacWheelPanel ascendant={norm.ascendant} sunSign={norm.sunSign} moonSign={norm.moonSign} />;
  const table = <PlanetPositionTable planets={planets} />;
  const houseP = <HousePanel houses={houses} system={norm.houseSystem} />;
  const asp = <AspectMatrix aspects={aspects} />;
  const judge = <WesternJudgementPanel verdict={norm.verdict} events={engineOutput.eventCandidates ?? []} themes={themes} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="西方占星" />
      <div className="hidden lg:grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <div className="space-y-3">{wheel}{houseP}</div>
        <div className="space-y-3">{table}{asp}{judge}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="黄道带" defaultOpen>{wheel}</MobileSectionAccordion>
        <MobileSectionAccordion title="行星位置" defaultOpen>{table}</MobileSectionAccordion>
        <MobileSectionAccordion title="十二宫">{houseP}</MobileSectionAccordion>
        <MobileSectionAccordion title="相位">{asp}</MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读">{judge}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
