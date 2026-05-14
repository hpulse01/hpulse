import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { RashiPanel } from './RashiPanel';
import { NakshatraPanel } from './NakshatraPanel';
import { AyanamsaPanel } from './AyanamsaPanel';
import { DashaTimeline } from './DashaTimeline';
import { VedicJudgementPanel } from './VedicJudgementPanel';

interface Props { engineOutput?: EngineOutput | null }

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function VedicCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="吠陀占星暂无结构化输出 / Vedic astrology output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const dasha = parseJSON<{lord:string;startYear?:number;endYear?:number;durationYears?:number;current?:boolean}[]>(norm.vimshottariDasha, []);

  const ayan = <AyanamsaPanel ayanamsa={norm.ayanamsa} ayanamsaValue={norm.ayanamsaValue ? Number(norm.ayanamsaValue) : undefined} zodiacSystem={norm.zodiacSystem} />;
  const rashi = <RashiPanel rashi={norm.rashi} lagna={norm.lagna} moonRashi={norm.moonRashi} />;
  const naks = <NakshatraPanel nakshatra={norm.nakshatra} pada={norm.nakshatraPada ? Number(norm.nakshatraPada) : undefined} lord={norm.nakshatraLord} />;
  const dashaP = <DashaTimeline dasha={dasha} />;
  const judge = <VedicJudgementPanel verdict={norm.verdict} events={engineOutput.eventCandidates ?? []} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="吠陀占星" />
      <div className="hidden lg:grid lg:grid-cols-[1fr_1.2fr] gap-5">
        <div className="space-y-3">{ayan}{rashi}{naks}</div>
        <div className="space-y-3">{dashaP}{judge}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Ayanamsa" defaultOpen>{ayan}</MobileSectionAccordion>
        <MobileSectionAccordion title="Rashi & Lagna" defaultOpen>{rashi}</MobileSectionAccordion>
        <MobileSectionAccordion title="Nakshatra">{naks}</MobileSectionAccordion>
        <MobileSectionAccordion title="Dasha">{dashaP}</MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读">{judge}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
