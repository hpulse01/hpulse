import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { GematriaPanel } from './GematriaPanel';
import { TreeOfLifePanel } from './TreeOfLifePanel';
import { KabbalahMissingInputPanel } from './KabbalahMissingInputPanel';

interface Props { engineOutput?: EngineOutput | null; userName?: string | null }

function parseJSON<T>(s: string | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

export function KabbalahCorePanel({ engineOutput, userName }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="卡巴拉暂无结构化输出 / Kabbalah output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const hasName = !!(userName && userName.trim().length > 0);
  const hasHebrew = norm.hebrewInput === 'true' || !!norm.hebrewName;

  const sephirot = parseJSON<{id:number;name:string;meaning?:string;active?:boolean}[]>(norm.sephirot, []);
  const letters = parseJSON<string[]>(norm.nameLetters, []);

  const missing = <KabbalahMissingInputPanel hasName={hasName} hasHebrew={hasHebrew} />;
  const gem = <GematriaPanel gematria={norm.gematria ? Number(norm.gematria) : undefined} nameLetters={letters} method={norm.gematriaMethod} />;
  const tree = <TreeOfLifePanel sephirot={sephirot} activePath={norm.activePath} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="卡巴拉" />
      {missing}
      <div className="hidden lg:grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <div>{gem}</div>
        <div>{tree}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Gematria" defaultOpen>{gem}</MobileSectionAccordion>
        <MobileSectionAccordion title="Tree of Life" defaultOpen>{tree}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
