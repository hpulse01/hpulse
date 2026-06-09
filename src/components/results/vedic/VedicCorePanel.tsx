import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace, EngineWarningStrip } from '../_shared/EnginePanelShell';
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

  // P4.4d — Rahu/Ketu + Navamsa extras
  const nodes = (
    <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Nodes & Navamsa (D9)</div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <div className="text-muted-foreground">Rahu · 北交点</div>
          <div className="text-foreground font-serif">{norm.rahu || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Ketu · 南交点</div>
          <div className="text-foreground font-serif">{norm.ketu || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Lagna Navamsa</div>
          <div className="text-foreground font-serif">{norm.lagnaNavamsa || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Moon Navamsa</div>
          <div className="text-foreground font-serif">{norm.moonNavamsa || '—'}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="吠陀占星" />
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
      <div className="hidden lg:grid lg:grid-cols-[1fr_1.2fr] gap-5">
        <div className="space-y-3">{ayan}{rashi}{naks}{nodes}</div>
        <div className="space-y-3">{dashaP}{judge}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Ayanamsa" defaultOpen>{ayan}</MobileSectionAccordion>
        <MobileSectionAccordion title="Rashi & Lagna" defaultOpen>{rashi}</MobileSectionAccordion>
        <MobileSectionAccordion title="Nakshatra">{naks}</MobileSectionAccordion>
        <MobileSectionAccordion title="Nodes & Navamsa">{nodes}</MobileSectionAccordion>
        <MobileSectionAccordion title="Dasha">{dashaP}</MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读">{judge}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
