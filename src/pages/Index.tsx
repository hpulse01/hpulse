import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { DisclaimerDialog, hasConsented } from '@/components/DisclaimerDialog';
import { BirthDataForm, type BirthDataWithGeo } from '@/components/BirthDataForm';
import { SixRelationsVerification } from '@/components/SixRelationsVerification';
import { DestinyDashboard } from '@/components/DestinyDashboard';
import { UnifiedQuantumPanel } from '@/components/UnifiedQuantumPanel';
import { UnifiedResultsPanel } from '@/components/UnifiedResultsPanel';
import { DestinyTreePanel } from '@/components/DestinyTreePanel';
import { PredictionOverview } from '@/components/results/PredictionOverview';
import { EngineContributionPanel } from '@/components/results/EngineContributionPanel';
import { DestinyTreeLayer } from '@/components/results/DestinyTreeLayer';
import { UniquePathLayer } from '@/components/results/UniquePathLayer';
import { FateVectorRadar } from '@/components/results/FateVectorRadar';
import { EngineConsensusPanel } from '@/components/results/EngineConsensusPanel';
import { LifeTrajectoryTimeline } from '@/components/results/LifeTrajectoryTimeline';
import { Footer } from '@/components/Footer';
import { UserMenu } from '@/components/UserMenu';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useI18n } from '@/hooks/useI18n';

import { getClauseCount } from '@/services/SupabaseService';
import {
  TiebanEngine,
  type TiebanInput,
  type KaoKeWithMatch,
  type DestinyProjection,
  type CalibrationResult,
  type FullDestinyReport,
} from '@/utils/tiebanAlgorithm';
import {
  QuantumPredictionEngine,
  type QuantumPredictionResult,
} from '@/utils/quantumPredictionEngine';
import { QuantumField } from '@/components/quantum/QuantumField';
import { useToast } from '@/hooks/use-toast';
import { Atom, RotateCcw, Sparkles, Scroll, Zap, TreePine, Target, Layers, Shield, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

type AppStep = 'input' | 'calculating' | 'verification' | 'projecting' | 'result';

const Index = () => {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => hasConsented());
  const [step, setStep] = useState<AppStep>('input');
  const [birthInput, setBirthInput] = useState<TiebanInput | null>(null);
  const [ganZhiDisplay, setGanZhiDisplay] = useState('');
  const [baseNumber, setBaseNumber] = useState(0);
  const [theoreticalBase, setTheoreticalBase] = useState(0);
  const [fullReport, setFullReport] = useState<FullDestinyReport | null>(null);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);
  const [quantumResult, setQuantumResult] = useState<QuantumPredictionResult | null>(null);
  const [clauseCount, setClauseCount] = useState<number | null>(null);
  const [activeResultTab, setActiveResultTab] = useState('overview');

  const { isSuperAdmin } = useSuperAdmin();
  const { toast } = useToast();
  const { t, engineLabel, lang } = useI18n();

  // Engine labels (bilingual)
  const allEngineLabels = useMemo(() => [
    'tieban', 'bazi', 'ziwei', 'liuyao',
    'western', 'vedic', 'numerology', 'mayan', 'kabbalah',
    'meihua', 'qimen', 'liuren', 'taiyi',
  ].map(e => engineLabel(e)), [engineLabel]);

  useEffect(() => {
    getClauseCount().then(count => {
      setClauseCount(count);
    });
  }, []);

  const handleBirthDataSubmit = useCallback(async (birthData: BirthDataWithGeo) => {
    setStep('calculating');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setBirthInput(birthData);
      const result = TiebanEngine.calculateBaseNumber(birthData);
      setBaseNumber(result.baseNumber);
      setGanZhiDisplay(result.pillars.fullDisplay);
      const theoreticBase = TiebanEngine.calculateTheoreticalBase(birthData);
      setTheoreticalBase(theoreticBase);
      setStep('verification');
    } catch (error) {
      console.error('Calculation error:', error);
      toast({ title: t('ui.calc_error'), description: t('ui.calc_error_desc'), variant: 'destructive' });
      setStep('input');
    }
  }, [toast, t]);

  const handleTimeLocked = useCallback(async (
    lockedKeIndex: number,
    selectedOption: KaoKeWithMatch
  ) => {
    setStep('projecting');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const systemOffset = TiebanEngine.calculateSystemOffset(theoreticalBase, selectedOption.clauseNumber);
      const calibration: CalibrationResult = {
        theoreticalBase,
        confirmedClauseId: selectedOption.clauseNumber,
        systemOffset,
        lockedQuarterIndex: lockedKeIndex
      };
      setCalibrationResult(calibration);
      const report: FullDestinyReport = TiebanEngine.generateFullDestinyReport(birthInput!, theoreticalBase, systemOffset);
      setFullReport(report);
      const qResult = QuantumPredictionEngine.predict(birthInput!, systemOffset);
      setQuantumResult(qResult);
      setStep('result');
      toast({ title: t('ui.prediction_complete'), description: t('ui.prediction_complete_desc') });
    } catch (error) {
      console.error('Projection error:', error);
      toast({ title: t('ui.proj_error'), description: t('ui.proj_error_desc'), variant: 'destructive' });
      setStep('verification');
    }
  }, [theoreticalBase, birthInput, toast, t]);

  const handleReset = useCallback(() => {
    setStep('input');
    setBirthInput(null);
    setGanZhiDisplay('');
    setBaseNumber(0);
    setTheoreticalBase(0);
    setFullReport(null);
    setCalibrationResult(null);
    setQuantumResult(null);
    setActiveResultTab('overview');
  }, []);

  const resultTabs = useMemo(() => {
    const tabs = [
      { id: 'overview', label: t('tab.overview'), icon: Sparkles },
      { id: 'engines', label: t('tab.engines'), icon: Layers },
      { id: 'tree', label: t('tab.tree'), icon: TreePine },
      { id: 'path', label: t('tab.path'), icon: Target },
      { id: 'destiny', label: t('tab.destiny'), icon: Scroll },
      { id: 'radar', label: lang === 'zh' ? '命运雷达' : 'Fate Radar', icon: Activity },
      { id: 'consensus', label: lang === 'zh' ? '引擎共识' : 'Consensus', icon: BarChart3 },
      { id: 'timeline', label: lang === 'zh' ? '人生轨迹' : 'Timeline', icon: Zap },
      { id: 'quantum', label: t('tab.quantum'), icon: Atom },
    ];
    if (isSuperAdmin) {
      tabs.push({ id: 'orchestration', label: t('tab.orchestration'), icon: Shield });
    }
    return tabs;
  }, [isSuperAdmin, t, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-scroll-texture">
      {/* Mandatory Disclaimer */}
      <DisclaimerDialog
        open={!disclaimerAccepted}
        onAccept={() => setDisclaimerAccepted(true)}
      />
      {/* Header */}
      <header className="relative border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-card/80 to-transparent" />
        <div className="container max-w-6xl mx-auto px-4 py-4 md:py-5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <LanguageToggle />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-serif text-gradient-gold tracking-[0.2em] font-semibold">
                {t('ui.title')}
              </h1>
              <p className="text-muted-foreground text-[10px] md:text-xs tracking-widest mt-1 font-sans">
                {t('ui.subtitle')}
              </p>
              {clauseCount !== null && clauseCount > 0 && (
                <p className="text-muted-foreground/30 text-[10px] mt-1.5 font-sans">
                  {clauseCount.toLocaleString()} {t('ui.clauses')} · 13 {t('ui.engines')}
                </p>
              )}
              {clauseCount === 0 && isSuperAdmin && (
                <p className="text-accent/70 text-[10px] mt-1">
                  {t('admin.clause_empty')} → <a href="/admin-import" className="underline hover:text-accent">{t('admin.import')}</a>
                </p>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-8 md:py-12">
        <div className={`container mx-auto px-4 ${step === 'result' ? 'max-w-6xl' : 'max-w-xl'}`}>

          {/* Step: Input */}
          {step === 'input' && (
            <div className="relative animate-fade-in-up">
              <div className="absolute inset-0 -z-10 opacity-15 rounded-2xl overflow-hidden">
                <QuantumField energy={25} dominantElement="金" />
              </div>
              <div className="glass-elevated rounded-2xl p-7 md:p-10 shadow-2xl shadow-black/30">
                <BirthDataForm onSubmit={handleBirthDataSubmit} isLoading={false} />
              </div>
            </div>
          )}

          {/* Step: Calculating */}
          {step === 'calculating' && (
            <div className="relative animate-fade-in-up">
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <QuantumField energy={50} dominantElement="水" />
              </div>
              <div className="relative glass rounded-2xl p-12 md:p-16 shadow-2xl shadow-black/40">
                <div className="text-center space-y-8">
                  <div className="relative w-20 h-20 mx-auto">
                    <Atom className="w-20 h-20 text-primary/80 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-serif text-foreground tracking-wider">
                      {t('ui.initializing')}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans tracking-widest uppercase">
                      {t('ui.initializing_sub')}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                    {allEngineLabels.map((sys, i) => (
                      <span
                        key={sys}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-border/40 text-muted-foreground animate-pulse font-sans"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Verification */}
          {step === 'verification' && (
            <div className="glass-elevated rounded-2xl p-6 md:p-8 shadow-xl shadow-black/30 animate-fade-in-up">
              <SixRelationsVerification
                baseNumber={baseNumber}
                ganZhiDisplay={ganZhiDisplay}
                onTimeLocked={handleTimeLocked}
                isLoading={false}
              />
            </div>
          )}

          {/* Step: Projecting */}
          {step === 'projecting' && (
            <div className="relative animate-fade-in-up">
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <QuantumField energy={85} dominantElement="火" />
              </div>
              <div className="relative glass rounded-2xl p-12 md:p-16 shadow-2xl shadow-black/40">
                <div className="text-center space-y-8">
                  <div className="relative w-20 h-20 mx-auto">
                    <Atom className="w-20 h-20 text-primary animate-spin" style={{ animationDuration: '1s' }} />
                    <div className="absolute inset-0 rounded-full animate-pulse-glow" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg font-serif text-foreground tracking-wider">
                      {t('ui.collapsing')}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans tracking-widest uppercase">
                      {t('ui.collapsing_sub')}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs text-primary/70 font-mono animate-pulse">
                      {t('ui.collapsing_sub')}
                    </p>
                    <div className="w-48 mx-auto h-1 bg-border/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && fullReport && birthInput && quantumResult && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Quantum Signature Header */}
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <QuantumField energy={quantumResult.overallCoherence * 100} dominantElement={quantumResult.dominantElement} />
                </div>
                <div className="relative z-10 glass-elevated rounded-2xl p-6 md:p-8">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-sans text-primary tracking-wider">{t('ui.destiny_resolved_badge')}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif text-gradient-gold tracking-wider">
                      {t('ui.destiny_resolved')}
                    </h2>
                    <p className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                      {quantumResult.quantumSignature}
                    </p>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground font-sans">
                      <span>{t('ui.coherence')} <strong className="text-primary">{Math.round(quantumResult.overallCoherence * 100)}%</strong></span>
                      <span>{t('ui.worlds')} <strong className="text-primary">{quantumResult.totalWorldsGenerated.toLocaleString()}</strong></span>
                      <span>{t('ui.engines')} <strong className="text-primary">13</strong></span>
                      <span>{t('ui.element')} <strong className="text-primary">{quantumResult.dominantElement}</strong></span>
                      {quantumResult.collapseResult && (
                        <span>{t('ui.lifespan')} <strong className="text-accent">{quantumResult.collapseResult.deathAge}{t('ui.years_old')}</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed border-t border-border/30 pt-4 mt-2">
                      {quantumResult.lifeSummary}
                    </p>
                    <div className="inline-block px-4 py-2 bg-card/50 rounded-lg border border-border/30">
                      <span className="text-foreground/70 font-serif tracking-[0.3em] text-sm">
                        {ganZhiDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Tabs */}
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                <TabsList className="flex w-full bg-card/60 border border-border/30 h-auto p-1 rounded-xl overflow-x-auto gap-0.5">
                  {resultTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="text-[9px] sm:text-xs py-2.5 rounded-lg font-sans data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                      >
                        <Icon className="w-3.5 h-3.5 mr-1 hidden sm:inline" />{tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  {quantumResult.unifiedResult && (
                    <PredictionOverview result={quantumResult.unifiedResult} />
                  )}
                </TabsContent>

                <TabsContent value="engines" className="mt-6">
                  {quantumResult.unifiedResult && (
                    <EngineContributionPanel result={quantumResult.unifiedResult} />
                  )}
                </TabsContent>

                <TabsContent value="tree" className="mt-6">
                  {quantumResult.destinyTree && quantumResult.collapseResult ? (
                    <DestinyTreeLayer tree={quantumResult.destinyTree} collapse={quantumResult.collapseResult} />
                  ) : (
                    <div className="p-12 text-center text-muted-foreground text-xs glass rounded-2xl">
                      {lang === 'zh' ? '命运树数据加载中...' : 'Loading destiny tree...'}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="path" className="mt-6">
                  {quantumResult.collapseResult ? (
                    <UniquePathLayer collapse={quantumResult.collapseResult} birthYear={birthInput.year} />
                  ) : (
                    <div className="p-12 text-center text-muted-foreground text-xs glass rounded-2xl">
                      {lang === 'zh' ? '坍缩数据加载中...' : 'Loading collapse data...'}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="destiny" className="mt-6">
                  <DestinyDashboard
                    report={fullReport}
                    pillarsDisplay={ganZhiDisplay}
                    birthYear={birthInput.year}
                    birthData={{
                      year: birthInput.year,
                      month: birthInput.month,
                      day: birthInput.day,
                      hour: birthInput.hour,
                      minute: birthInput.minute,
                      gender: birthInput.gender,
                    }}
                    onReset={handleReset}
                  />
                </TabsContent>

                <TabsContent value="radar" className="mt-6">
                  {quantumResult.unifiedResult && (
                    <div className="glass-elevated rounded-2xl p-6">
                      <FateVectorRadar fateVector={quantumResult.unifiedResult.fusedFateVector} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="consensus" className="mt-6">
                  {quantumResult.unifiedResult && (
                    <EngineConsensusPanel result={quantumResult.unifiedResult} />
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="mt-6">
                  {quantumResult.collapseResult ? (
                    <LifeTrajectoryTimeline collapse={quantumResult.collapseResult} birthYear={birthInput.year} />
                  ) : (
                    <div className="p-12 text-center text-muted-foreground text-xs glass rounded-2xl">
                      {lang === 'zh' ? '轨迹数据加载中...' : 'Loading trajectory...'}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quantum" className="mt-6">
                  <UnifiedQuantumPanel result={quantumResult} birthYear={birthInput.year} />
                </TabsContent>

                {isSuperAdmin && (
                  <TabsContent value="orchestration" className="mt-6">
                    {quantumResult.unifiedResult && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-accent" />
                          <span className="text-xs text-accent/90 font-sans">{t('admin.super_admin')}</span>
                        </div>
                        <UnifiedResultsPanel result={quantumResult.unifiedResult} />
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>

              {/* Footer Actions */}
              <div className="space-y-4 pt-4 border-t border-border/20">
                <div className="glass rounded-xl p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-accent/80">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold tracking-wide">{t('disclaimer.title')}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-sans">
                    {t('disclaimer.text')}
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline"
                  className="w-full py-5 text-sm font-sans tracking-wider border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 rounded-xl group">
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  {t('ui.reset')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
