import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace, EngineWarningStrip } from '../_shared/EnginePanelShell';
import { NumerologyNumberGrid } from './NumerologyNumberGrid';
import { PersonalYearPanel } from './PersonalYearPanel';
import { NumerologyMissingInputPanel } from './NumerologyMissingInputPanel';

interface Props { engineOutput?: EngineOutput | null; currentYear?: number }

interface PinnacleCycleView {
  index: number;
  number: number;
  startAge: number;
  endAgeInclusive: number | null;
}

function parseJSON<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function PinnacleChallengePanel({ cycles, challenges }: {
  cycles: PinnacleCycleView[];
  challenges: number[];
}) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">
        Pinnacles & Challenges · 高峰与挑战
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cycles.map((cycle) => (
          <div key={cycle.index} className="rounded border border-primary/15 bg-card/30 p-2 text-center">
            <div className="text-[9px] font-mono text-muted-foreground/70">P{cycle.index}</div>
            <div className="text-xl font-serif text-gradient-gold">{cycle.number}</div>
            <div className="text-[9px] text-muted-foreground/65">
              age {cycle.startAge}–{cycle.endAgeInclusive ?? '+'}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {challenges.map((challenge, index) => (
          <div key={index} className="rounded border border-amber-400/20 bg-amber-400/[0.03] p-2 text-center">
            <div className="text-[9px] font-mono text-muted-foreground/70">
              {index === 2 ? 'Main C' : `C${index + 1}`}
            </div>
            <div className="text-lg font-serif text-amber-200/90">{challenge}</div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground/65">
        Challenge periods are fluid and overlapping; exact ages are intentionally not fabricated.
      </p>
    </div>
  );
}

export function NumerologyCorePanel({ engineOutput, currentYear }: Props) {
  if (!engineOutput) return <EngineMissingNotice message="数字命理暂无结构化输出 / Numerology output unavailable." />;
  const norm = (engineOutput.normalizedOutput ?? {}) as Record<string, string>;
  const hasName = norm.hasName === 'true' || engineOutput.rawInputSnapshot?.hasName === true;
  const pinnacleCycles = parseJSON<PinnacleCycleView[]>(norm.pinnacleCycles, []);
  const challenges = parseJSON<number[]>(norm.challenges, []);

  const num = (k: string): number | undefined => {
    if (!norm[k] || norm[k] === '-') return undefined;
    const value = Number(norm[k]);
    return Number.isFinite(value) ? value : undefined;
  };

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
  const cycles = <PinnacleChallengePanel cycles={pinnacleCycles} challenges={challenges} />;

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="数字命理" />
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
      {missing}
      <div className="hidden lg:grid lg:grid-cols-[1fr_2fr] gap-5">
        <div className="space-y-3">{py}</div>
        <div className="space-y-4">{birthGrid}{nameGrid}</div>
      </div>
      <div className="hidden lg:block">{cycles}</div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Personal Year" defaultOpen>{py}</MobileSectionAccordion>
        <MobileSectionAccordion title="Birthday-Derived" defaultOpen>{birthGrid}</MobileSectionAccordion>
        <MobileSectionAccordion title="Name-Derived">{nameGrid}</MobileSectionAccordion>
        <MobileSectionAccordion title="Pinnacles & Challenges" defaultOpen>{cycles}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
