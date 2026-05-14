import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { TzolkinPanel } from './TzolkinPanel';
import { GalacticTonePanel } from './GalacticTonePanel';
import { LongCountPanel } from './LongCountPanel';

interface Props { engineOutput?: EngineOutput | null }

export function MayanCorePanel({ engineOutput }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="玛雅历暂无结构化输出 / Mayan output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;

  const num = (k: string) => norm[k] ? Number(norm[k]) : undefined;

  const tz = <TzolkinPanel daySign={norm.daySign} glyph={norm.dayGlyph} glyphMeaning={norm.glyphMeaning} kin={num('kin')} />;
  const tone = <GalacticTonePanel tone={num('galacticTone')} toneName={norm.toneName} meaning={norm.toneMeaning} />;
  const lc = <LongCountPanel longCount={norm.longCount} baktun={num('baktun')} katun={num('katun')} tun={num('tun')} uinal={num('uinal')} kin={num('longCountKin')} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="玛雅历" />
      <div className="hidden lg:grid lg:grid-cols-3 gap-5">{tz}{tone}{lc}</div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Tzolkin" defaultOpen>{tz}</MobileSectionAccordion>
        <MobileSectionAccordion title="Galactic Tone" defaultOpen>{tone}</MobileSectionAccordion>
        <MobileSectionAccordion title="Long Count">{lc}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
