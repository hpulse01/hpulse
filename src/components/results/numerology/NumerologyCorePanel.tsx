import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace } from '../_shared/EnginePanelShell';
import { NumerologyNumberGrid } from './NumerologyNumberGrid';
import { PersonalYearPanel } from './PersonalYearPanel';
import { NumerologyMissingInputPanel } from './NumerologyMissingInputPanel';

interface Props { engineOutput?: EngineOutput | null; userName?: string | null; currentYear?: number }

export function NumerologyCorePanel({ engineOutput, userName, currentYear }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="数字命理暂无结构化输出 / Numerology output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const hasName = !!(userName && userName.trim().length > 0);

  const num = (k: string): number | undefined => norm[k] ? Number(norm[k]) : undefined;

  const birthdayNumbers = [
    { label: 'Life Path', value: num('lifePath') },
    { label: "Birthday", value: num('birthdayNumber') },
    { label: 'Personal Year', value: num('personalYear') },
  ];
  const nameNumbers = [
    { label: 'Destiny', value: num('destiny'), missing: !hasName },
    { label: 'Soul Urge', value: num('soulUrge'), missing: !hasName },
    { label: 'Personality', value: num('personality'), missing: !hasName },
  ];

  const py = <PersonalYearPanel personalYear={num('personalYear')} year={currentYear} meaning={norm.personalYearMeaning} />;
  const birthGrid = (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Birthday-Derived</div>
      <NumerologyNumberGrid numbers={birthdayNumbers} />
    </div>
  );
  const nameGrid = (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Name-Derived</div>
      <NumerologyNumberGrid numbers={nameNumbers} />
    </div>
  );
  const missing = <NumerologyMissingInputPanel hasName={hasName} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="数字命理" />
      {missing}
      <div className="hidden lg:grid lg:grid-cols-[1fr_2fr] gap-5">
        <div className="space-y-3">{py}</div>
        <div className="space-y-4">{birthGrid}{nameGrid}</div>
      </div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Personal Year" defaultOpen>{py}</MobileSectionAccordion>
        <MobileSectionAccordion title="Birthday-Derived" defaultOpen>{birthGrid}</MobileSectionAccordion>
        <MobileSectionAccordion title="Name-Derived">{nameGrid}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
