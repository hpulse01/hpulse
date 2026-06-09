import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { QimenJuPanel } from './QimenJuPanel';
import { QimenNinePalaceGrid, type PalaceData } from './QimenNinePalaceGrid';
import { QimenStarsGatesPanel } from './QimenStarsGatesPanel';
import { QimenYongShenPanel } from './QimenYongShenPanel';
import { QimenJudgementPanel } from './QimenJudgementPanel';

interface Props { engineOutput?: EngineOutput | null }

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function QimenCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="奇门遁甲暂无结构化输出 / Qi Men output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  const palaces = parseJSON<PalaceData[]>(norm.palaces, []);
  const stars = parseJSON<string[]>(norm.stars, []);
  const gates = parseJSON<string[]>(norm.gates, []);
  const deities = parseJSON<string[]>(norm.deities, []);
  const opportunities = parseJSON<string[]>(norm.opportunities, []);
  const risks = parseJSON<string[]>(norm.risks, []);

  const ju = (
    <QimenJuPanel
      dunDirection={norm.dunDirection ?? norm.dun}
      juNumber={norm.juNumber ?? norm.ju ? Number(norm.juNumber ?? norm.ju) : undefined}
      solarTerm={norm.solarTerm}
      threeYuan={norm.threeYuan}
      hourGanzhi={norm.hourGanzhi}
      hourXunShou={norm.hourXunShou}
      zhiFuStar={norm.zhiFuStar}
      zhiShiGate={norm.zhiShiGate}
    />
  );
  const grid = (
    <QimenNinePalaceGrid
      palaces={palaces}
      zhiFuPalace={norm.zhiFuPalace ? Number(norm.zhiFuPalace) : undefined}
      zhiShiPalace={norm.zhiShiPalace ? Number(norm.zhiShiPalace) : undefined}
      yongShenPalace={norm.yongShenPalace ? Number(norm.yongShenPalace) : undefined}
    />
  );
  const yong = (
    <QimenYongShenPanel
      yongShen={norm.yongShen ?? norm.yongShenSymbol}
      yongShenPalace={norm.yongShenPalace ? Number(norm.yongShenPalace) : undefined}
      category={norm.yongShenCategory}
      hostGuest={norm.hostGuest}
    />
  );
  const sg = <QimenStarsGatesPanel stars={stars} gates={gates} deities={deities} />;
  const judge = <QimenJudgementPanel events={engineOutput.eventCandidates ?? []} opportunities={opportunities} risks={risks} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="奇门遁甲" />

      <div className="hidden lg:grid lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className="space-y-3">{ju}{grid}</div>
        <div className="space-y-3">{yong}{sg}{judge}</div>
      </div>

      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="局信息 · Ju" defaultOpen>{ju}</MobileSectionAccordion>
        <MobileSectionAccordion title="九宫盘 · 9 Palaces" defaultOpen>{grid}</MobileSectionAccordion>
        <MobileSectionAccordion title="用神 · Yong Shen">{yong}</MobileSectionAccordion>
        <MobileSectionAccordion title="星·门·神">{sg}</MobileSectionAccordion>
        <MobileSectionAccordion title="综合判读">{judge}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>

      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
