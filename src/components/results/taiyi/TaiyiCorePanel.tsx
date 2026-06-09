import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace, EngineWarningStrip } from '../_shared/EnginePanelShell';
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
    taiyiAccumulatedYears={(norm.taiyiAccumulatedYears ?? norm.jiNian) ? Number(norm.taiyiAccumulatedYears ?? norm.jiNian) : undefined}
    juNumber={norm.juNumber ? Number(norm.juNumber) : undefined}
    yangYin={norm.yangYin ?? (norm.dun === 'yang' ? '阳遁' : norm.dun === 'yin' ? '阴遁' : undefined)}
    era={norm.era ?? (norm.yuanIndex ? `元位 ${norm.yuanIndex}` : undefined)}
  />;
  const palace = <TaiyiPalacePanel
    taiyiPalace={norm.taiyiPalace ? Number(norm.taiyiPalace) : undefined}
    palaceName={norm.taiyiPalaceName}
    description={norm.palaceDescription}
  />;
  const gods = <TaiyiGodPositionsPanel
    wenChang={norm.wenChang ?? (norm.wenChangPalace ? `${norm.wenChangPalace}宫` : undefined)}
    shiJi={norm.shiJi ?? (norm.shiJiPalace ? `${norm.shiJiPalace}宫` : undefined)}
    jiShen={norm.jiShen ? `${norm.jiShen}${norm.jiShenGod ? `（${norm.jiShenGod}）` : ''}` : undefined}
    daYou={norm.daYou} taiSui={norm.taiSui ?? norm.yearBranch} heJi={norm.heJi}
  />;
  const hg = <TaiyiHostGuestPanel
    host={norm.host ?? (norm.zhuSuan ? `主算 ${norm.zhuSuan}${norm.zhuDaJiang ? ` · 大将${norm.zhuDaJiang}宫 参将${norm.zhuCanJiang}宫` : ''}` : undefined)}
    guest={norm.guest ?? (norm.keSuan ? `客算 ${norm.keSuan}${norm.keDaJiang ? ` · 大将${norm.keDaJiang}宫 参将${norm.keCanJiang}宫` : ''}` : undefined)}
    hostStrength={norm.hostStrength ? Number(norm.hostStrength) : undefined}
    guestStrength={norm.guestStrength ? Number(norm.guestStrength) : undefined}
    verdict={norm.hostGuestVerdict ?? norm.zhuKeJudgment}
  />;
  const judge = <TaiyiJudgementPanel verdict={norm.verdict} riskFlags={risks} opportunityFlags={opps} events={engineOutput.eventCandidates ?? []} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="太乙神数" />
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
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
