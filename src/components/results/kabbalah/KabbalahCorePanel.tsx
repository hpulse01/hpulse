import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import {
  EngineAuditTrace,
  EngineMissingNotice,
  EnginePanelHeader,
  EngineWarningStrip,
} from '../_shared/EnginePanelShell';
import { GematriaPanel } from './GematriaPanel';
import { TreeOfLifePanel } from './TreeOfLifePanel';
import { KabbalahMissingInputPanel } from './KabbalahMissingInputPanel';

interface Props { engineOutput?: EngineOutput | null }

export function KabbalahCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="卡巴拉暂无结构化输出 / Kabbalah output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const hasName = norm.derivedFromName === 'true' || engineOutput.rawInputSnapshot?.hasName === true;
  const hasHebrew = norm.gematriaSource === 'hebrew';

  const number = (key: string): number | undefined => {
    if (!norm[key] || norm[key] === '-') return undefined;
    const value = Number(norm[key]);
    return Number.isFinite(value) ? value : undefined;
  };

  const path = norm.pathNumber && norm.pathNumber !== '-'
    ? [
        `#${norm.pathNumber}`,
        norm.pathLetter !== '-' ? norm.pathLetter : null,
        norm.pathRoute !== '-' ? norm.pathRoute : null,
      ].filter(Boolean).join(' · ')
    : undefined;

  const missing = <KabbalahMissingInputPanel hasName={hasName} hasHebrew={hasHebrew} />;
  const gem = (
    <GematriaPanel
      total={number('gematriaTotal')}
      gadol={number('gematriaGadol')}
      katan={number('gematriaKatan')}
      siduri={number('gematriaSiduri')}
      source={norm.gematriaSource !== '-' ? norm.gematriaSource : undefined}
    />
  );
  const tree = (
    <TreeOfLifePanel
      activeSephirahNumber={number('sephirahNumber')}
      activeSephirahName={norm.sephirahName !== '-' ? norm.sephirahName : undefined}
      activePath={path}
    />
  );

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="卡巴拉" />
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
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
