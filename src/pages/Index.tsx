import { Target } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { DisclaimerDialog, hasConsented } from '@/components/DisclaimerDialog';
import { SixRelationsVerification } from '@/components/SixRelationsVerification';
import { Footer } from '@/components/Footer';
import { AppHeader } from '@/components/layout/AppHeader';
import { InputConsole } from '@/components/steps/InputConsole';
import { ResultTabsView } from '@/components/results/ResultTabsView';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { SectionHeader } from '@/components/hpulse/SectionHeader';
import { QuantumLoadingScreen } from '@/components/hpulse/QuantumLoadingScreen';
import { CollapseLoadingScreen } from '@/components/hpulse/CollapseLoadingScreen';
import { usePredictionFlow } from '@/hooks/usePredictionFlow';
import { useState } from 'react';

const Index = () => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => hasConsented());
  const flow = usePredictionFlow();
  const {
    step, birthInput, ganZhiDisplay, baseNumber, theoreticalBase,
    fullReport, calibrationResult, quantumResult, clauseCount,
    unifiedReport, selectedKaoKe, hpulse,
    handleBirthDataSubmit, handleTimeLocked, handleReset,
  } = flow;

  const isResultStep = step === 'result';

  return (
    <div className="min-h-screen flex flex-col bg-background bg-scroll-texture">
      <SEO
        title="H-Pulse — Quantum Prediction System"
        description="Run a deterministic, multi-engine quantum destiny projection across BaZi, Ziwei, Liu Yao, Qi Men, Tieban, Vedic, Western, Kabbalah and more."
        path="/"
      />
      <DisclaimerDialog
        open={!disclaimerAccepted}
        onAccept={() => setDisclaimerAccepted(true)}
      />

      <AppHeader clauseCount={clauseCount} />

      <main className="flex-1 py-6 md:py-10">
        <div className={`container mx-auto px-4 ${isResultStep ? 'max-w-7xl' : 'max-w-6xl'}`}>

          {step === 'input' && (
            <InputConsole onSubmit={handleBirthDataSubmit} />
          )}

          {step === 'calculating' && (
            <div className="max-w-2xl mx-auto animate-fade-in-up">
              <QuantumLoadingScreen />
            </div>
          )}

          {step === 'verification' && (
            <div className="max-w-3xl mx-auto animate-fade-in-up">
              <HolographicPanel variant="elevated" innerPadding="lg">
                <SectionHeader
                  titleZh="六亲校时"
                  titleEn="Temporal Lock Verification"
                  description="通过六亲事实反向校准出生时辰偏移,锁定唯一时轨。"
                  icon={<Target className="w-4 h-4" />}
                  className="mb-5"
                />
                <SixRelationsVerification
                  baseNumber={baseNumber}
                  ganZhiDisplay={ganZhiDisplay}
                  onTimeLocked={handleTimeLocked}
                  isLoading={false}
                />
              </HolographicPanel>
            </div>
          )}

          {step === 'projecting' && (
            <div className="max-w-2xl mx-auto animate-fade-in-up">
              <CollapseLoadingScreen
                theoreticalBase={theoreticalBase}
                systemOffset={
                  calibrationResult?.systemOffset ??
                  (theoreticalBase ? 0 : undefined)
                }
                lockedQuarter={calibrationResult?.lockedQuarterIndex}
              />
            </div>
          )}

          {isResultStep && fullReport && birthInput && quantumResult && (
            <ResultTabsView
              quantumResult={quantumResult}
              unifiedReport={unifiedReport}
              fullReport={fullReport}
              birthInput={birthInput}
              ganZhiDisplay={ganZhiDisplay}
              baseNumber={baseNumber}
              theoreticalBase={theoreticalBase}
              calibrationResult={calibrationResult}
              selectedKaoKe={selectedKaoKe}
              hpulse={hpulse}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
