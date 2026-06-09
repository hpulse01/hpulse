import type { EngineOutput } from '@/types/prediction';
import { MobileSectionAccordion } from '@/components/hpulse/MobileSectionAccordion';
import { EnginePanelHeader, EngineMissingNotice, EngineAuditTrace, EngineWarningStrip } from '../_shared/EnginePanelShell';
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

  // P4.4d — extra fields: Lord of Night, Calendar Round, Wayeb flag
  const extras = (
    <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2.5 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Mayan Extras</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-muted-foreground">夜主 · Lord of Night</div>
          <div className="text-foreground font-serif">{norm.lordOfNight || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">日历轮 · Calendar Round</div>
          <div className="text-foreground font-serif">{norm.calendarRound || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Wayeb（5 不吉日）</div>
          <div className={`font-serif ${norm.isWayeb === 'true' ? 'text-rose-300' : 'text-emerald-300'}`}>
            {norm.isWayeb === 'true' ? '是' : '否'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <EnginePanelHeader engineOutput={engineOutput} fallbackName="玛雅历" />
      <EngineWarningStrip warnings={engineOutput.warnings} uncertainty={engineOutput.uncertaintyNotes} />
      <div className="hidden lg:grid lg:grid-cols-3 gap-5">{tz}{tone}{lc}</div>
      <div className="hidden lg:block">{extras}</div>
      <div className="lg:hidden space-y-2">
        <MobileSectionAccordion title="Tzolkin" defaultOpen>{tz}</MobileSectionAccordion>
        <MobileSectionAccordion title="Galactic Tone" defaultOpen>{tone}</MobileSectionAccordion>
        <MobileSectionAccordion title="Long Count">{lc}</MobileSectionAccordion>
        <MobileSectionAccordion title="夜主 / 历轮 / Wayeb">{extras}</MobileSectionAccordion>
        <MobileSectionAccordion title="算法审计"><EngineAuditTrace engineOutput={engineOutput} /></MobileSectionAccordion>
      </div>
      <div className="hidden lg:block"><EngineAuditTrace engineOutput={engineOutput} /></div>
    </div>
  );
}
