import { Target, SkipForward } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { DisclaimerDialog, hasConsented } from '@/components/DisclaimerDialog';
import { Footer } from '@/components/Footer';
import { AppHeader } from '@/components/layout/AppHeader';
import { InputConsole } from '@/components/steps/InputConsole';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { SectionHeader } from '@/components/hpulse/SectionHeader';
import { QuantumLoadingScreen } from '@/components/hpulse/QuantumLoadingScreen';
import { CollapseLoadingScreen } from '@/components/hpulse/CollapseLoadingScreen';
import { usePredictionFlow } from '@/hooks/usePredictionFlow';
import { lazy, Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';

const SixRelationsVerification = lazy(() =>
  import('@/components/SixRelationsVerification').then((module) => ({ default: module.SixRelationsVerification })),
);
const ResultTabsView = lazy(() =>
  import('@/components/results/ResultTabsView').then((module) => ({ default: module.ResultTabsView })),
);

const Index = () => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => hasConsented());
  const flow = usePredictionFlow();
  const {
    step, birthInput, ganZhiDisplay, baseNumber, theoreticalBase,
    fullReport, calibrationResult, quantumResult, clauseCount,
    unifiedReport, selectedKaoKe, verificationSkipped, hpulse,
    handleBirthDataSubmit, handleTimeLocked, handleSkipVerification, handleReset,
  } = flow;

  const isResultStep = step === 'result';

  return (
    <div className="min-h-screen flex flex-col bg-background bg-scroll-texture">
      <SEO
        title="H-Pulse — Multi-System Cultural Rule Analysis"
        description="Run deterministic, source-traceable cultural-rule calculations across BaZi, Ziwei, Liu Yao, Qi Men, Tieban, Vedic, Western, Kabbalah and more. Not scientific prediction or quantum computing."
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
                <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-card/40" />}>
                  <SixRelationsVerification
                    baseNumber={baseNumber}
                    ganZhiDisplay={ganZhiDisplay}
                    onTimeLocked={handleTimeLocked}
                    onSkipVerification={handleSkipVerification}
                    isLoading={false}
                  />
                </Suspense>
                <div className="mt-6 pt-4 border-t border-border/30 text-center">
                  <Button
                    variant="ghost"
                    onClick={handleSkipVerification}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    跳过校时，直接推算 (Skip Verification)
                  </Button>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    跳过六亲校时后，系统偏移量默认为 0，铁板条文精度可能降低。
                  </p>
                </div>
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
            <Suspense fallback={<div className="h-72 animate-pulse rounded-lg bg-card/40" />}>
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
                verificationSkipped={verificationSkipped}
                hpulse={hpulse}
                onReset={handleReset}
              />
            </Suspense>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
