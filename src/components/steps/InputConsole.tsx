import { Database } from 'lucide-react';
import { BirthDataForm, type BirthDataWithGeo } from '@/components/BirthDataForm';
import { HeroMission } from '@/components/hpulse/HeroMission';
import { EngineStatusGrid } from '@/components/hpulse/EngineStatusGrid';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { SectionHeader } from '@/components/hpulse/SectionHeader';

const FLOW_STEPS = [
  { n: 1, label: '标准化出生时空', en: 'Standardize Birth Spacetime' },
  { n: 2, label: '多引擎独立执行', en: 'Independent Engine Execution' },
  { n: 3, label: '冲突检测与权重融合', en: 'Conflict Detection & Fusion' },
  { n: 4, label: '世界树生成', en: 'Destiny Tree Generation' },
  { n: 5, label: '唯一路径坍缩', en: 'Unique Path Collapse' },
  { n: 6, label: '生命轨迹报告', en: 'Life Trajectory Report' },
];

interface InputConsoleProps {
  onSubmit: (birthData: BirthDataWithGeo) => void;
}

/** Landing console: hero + birth-data form + engine status + pipeline overview. */
export function InputConsole({ onSubmit }: InputConsoleProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <HeroMission />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <HolographicPanel variant="elevated" innerPadding="lg">
            <BirthDataForm onSubmit={onSubmit} isLoading={false} />
          </HolographicPanel>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <EngineStatusGrid status="ready" />

          <HolographicPanel innerPadding="md">
            <SectionHeader
              titleZh="推演流程"
              titleEn="Prediction Pipeline"
              icon={<Database className="w-4 h-4" />}
            />
            <ol className="mt-4 grid sm:grid-cols-2 gap-2.5">
              {FLOW_STEPS.map(s => (
                <li
                  key={s.n}
                  className="flex items-start gap-3 p-2.5 rounded-lg border border-border/25 bg-card/30 hover:border-primary/30 transition-colors"
                >
                  <span className="shrink-0 w-7 h-7 rounded-md border border-primary/30 bg-primary/[0.06] text-primary font-mono text-xs flex items-center justify-center">
                    {String(s.n).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-foreground/85 font-serif tracking-wider">
                      {s.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground/55 font-mono uppercase tracking-[0.18em] truncate">
                      {s.en}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </HolographicPanel>
        </div>
      </div>
    </div>
  );
}
