import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { TaiyiJuPanel } from './TaiyiJuPanel';
import { TaiyiPalacePanel } from './TaiyiPalacePanel';
import { TaiyiGodPositionsPanel } from './TaiyiGodPositionsPanel';
import { TaiyiHostGuestPanel } from './TaiyiHostGuestPanel';
import { TaiyiJudgementPanel } from './TaiyiJudgementPanel';

interface Props { engineOutput?: EngineOutput | null }

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function TaiyiCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="太乙神数暂无结构化输出 / Taiyi Shenshu output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  const risks = parseJSON<string[]>(norm.riskFlags, []);
  const opps = parseJSON<string[]>(norm.opportunityFlags, []);

  const ju = <TaiyiJuPanel
    taiyiAccumulatedYears={norm.taiyiAccumulatedYears ? Number(norm.taiyiAccumulatedYears) : undefined}
    juNumber={norm.juNumber ? Number(norm.juNumber) : undefined}
    yangYin={norm.yangYin}
    era={norm.era}
  />;
  const palace = <TaiyiPalacePanel
    taiyiPalace={norm.taiyiPalace ? Number(norm.taiyiPalace) : undefined}
    palaceName={norm.taiyiPalaceName}
    description={norm.palaceDescription}
  />;
  const gods = <TaiyiGodPositionsPanel
    wenChang={norm.wenChang} shiJi={norm.shiJi} daYou={norm.daYou} taiSui={norm.taiSui} heJi={norm.heJi}
  />;
  const hg = <TaiyiHostGuestPanel
    host={norm.host} guest={norm.guest}
    hostStrength={norm.hostStrength ? Number(norm.hostStrength) : undefined}
    guestStrength={norm.guestStrength ? Number(norm.guestStrength) : undefined}
    verdict={norm.hostGuestVerdict}
  />;
  const judge = <TaiyiJudgementPanel verdict={norm.verdict} riskFlags={risks} opportunityFlags={opps} events={engineOutput.eventCandidates ?? []} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="太乙神数" />
      <div className="hidden lg:grid lg:grid-cols-[1fr_1fr] gap-5">
        <div className="space-y-3">{palace}{ju}{gods}</div>
        <div className="space-y-3">{hg}{judge}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="太乙所在宫" defaultOpen>{palace}</MobileSectionAccordion>
        <MobileSectionAccordion title="局数" defaultOpen>{ju}</MobileSectionAccordion>
        <MobileSectionAccordion title="神位">{gods}</MobileSectionAccordion>
        <MobileSectionAccordion title="主客">{hg}</MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读">{judge}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
