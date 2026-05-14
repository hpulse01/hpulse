import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DisclaimerDialog, hasConsented } from '@/components/DisclaimerDialog';
import { BirthDataForm, type BirthDataWithGeo } from '@/components/BirthDataForm';
import { SixRelationsVerification } from '@/components/SixRelationsVerification';
import { DestinyDashboard } from '@/components/DestinyDashboard';
import { UnifiedQuantumPanel } from '@/components/UnifiedQuantumPanel';
import { PredictionOverview } from '@/components/results/PredictionOverview';
import { EngineContributionPanel } from '@/components/results/EngineContributionPanel';
import { DestinyTreeLayer } from '@/components/results/DestinyTreeLayer';
import { UniquePathLayer } from '@/components/results/UniquePathLayer';
import { Footer } from '@/components/Footer';
import { UserMenu } from '@/components/UserMenu';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

import { getClauseCount } from '@/services/SupabaseService';
import { PredictionOrchestrator } from '@/utils/predictionOrchestrator';
import { AdminOrchestrationConsole } from '@/components/AdminOrchestrationConsole';
import {
  TiebanEngine,
  type TiebanInput,
  type KaoKeWithMatch,
  type CalibrationResult,
  type FullDestinyReport,
} from '@/utils/tiebanAlgorithm';
import {
  QuantumPredictionEngine,
  type QuantumPredictionResult,
} from '@/utils/quantumPredictionEngine';
import { useToast } from '@/hooks/use-toast';
import {
  Atom, RotateCcw, Sparkles, Scroll, TreePine, Target, Layers, Shield,
  AlertTriangle, Archive, ArrowLeft, Database, Activity, BookOpen,
} from 'lucide-react';

import { AuditTracePanel } from '@/components/results/audit/AuditTracePanel';
import { BaziCorePanel } from '@/components/results/bazi/BaziCorePanel';
import { TiebanCorePanel } from '@/components/results/tieban/TiebanCorePanel';
import { ZiweiCorePanel } from '@/components/results/ziwei/ZiweiCorePanel';

import { HeroMission } from '@/components/hpulse/HeroMission';
import { SystemStatusBar } from '@/components/hpulse/SystemStatusBar';
import { EngineStatusGrid } from '@/components/hpulse/EngineStatusGrid';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { SectionHeader } from '@/components/hpulse/SectionHeader';
import { QuantumLoadingScreen } from '@/components/hpulse/QuantumLoadingScreen';
import { CollapseLoadingScreen } from '@/components/hpulse/CollapseLoadingScreen';
import { ResultShell } from '@/components/hpulse/ResultShell';

type AppStep = 'input' | 'calculating' | 'verification' | 'projecting' | 'result';

const FLOW_STEPS = [
  { n: 1, label: '标准化出生时空', en: 'Standardize Birth Spacetime' },
  { n: 2, label: '多引擎独立执行', en: 'Independent Engine Execution' },
  { n: 3, label: '冲突检测与权重融合', en: 'Conflict Detection & Fusion' },
  { n: 4, label: '世界树生成', en: 'Destiny Tree Generation' },
  { n: 5, label: '唯一路径坍缩', en: 'Unique Path Collapse' },
  { n: 6, label: '生命轨迹报告', en: 'Life Trajectory Report' },
];

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
  const [unifiedReport, setUnifiedReport] = useState<ReturnType<typeof PredictionOrchestrator.execute> | null>(null);
  const [selectedKaoKe, setSelectedKaoKe] = useState<KaoKeWithMatch | null>(null);

  const { isSuperAdmin } = useAdminAccess();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useI18n();

  useEffect(() => {
    getClauseCount().then(count => setClauseCount(count));
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
    setSelectedKaoKe(selectedOption);
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
      if (qResult.unifiedResult) {
        setUnifiedReport(PredictionOrchestrator.execute(qResult.unifiedResult.input));
      }
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
    setUnifiedReport(null);
    setActiveResultTab('overview');
    setSelectedKaoKe(null);
  }, []);

  const resultTabs = useMemo(() => {
    const tabs = [
      { id: 'overview', label: t('tab.overview'), icon: Sparkles },
      { id: 'bazi', label: lang === 'zh' ? '八字' : 'Bazi', icon: BookOpen },
      { id: 'tieban', label: lang === 'zh' ? '铁板' : 'Tieban', icon: Scroll },
      { id: 'ziwei', label: lang === 'zh' ? '紫微' : 'Ziwei', icon: Atom },
      { id: 'engines', label: t('tab.engines'), icon: Layers },
      { id: 'audit', label: lang === 'zh' ? '算法审计' : 'Audit', icon: Activity },
      { id: 'tree', label: t('tab.tree'), icon: TreePine },
      { id: 'path', label: t('tab.path'), icon: Target },
      { id: 'destiny', label: t('tab.destiny'), icon: Scroll },
      { id: 'quantum', label: t('tab.quantum'), icon: Atom },
    ];
    if (isSuperAdmin) {
      tabs.push({ id: 'orchestration', label: t('tab.orchestration'), icon: Shield });
    }
    return tabs;
  }, [isSuperAdmin, t, lang]);

  const isResultStep = step === 'result';

  return (
    <div className="min-h-screen flex flex-col bg-background bg-scroll-texture">
      <DisclaimerDialog
        open={!disclaimerAccepted}
        onAccept={() => setDisclaimerAccepted(true)}
      />

      {/* Header */}
      <header className="relative border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg border border-primary/30 bg-primary/[0.06] flex items-center justify-center shrink-0">
                <Atom className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-serif text-gradient-gold tracking-[0.22em] leading-none">
                  H-Pulse
                </h1>
                <p className="text-[9px] uppercase tracking-[0.32em] text-muted-foreground/65 font-mono mt-0.5 truncate">
                  Quantum Prediction System
                </p>
              </div>
            </div>

            {/* Status (desktop) */}
            <div className="hidden lg:flex">
              <SystemStatusBar clauseCount={clauseCount} />
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <LanguageToggle />
              <Button asChild variant="ghost" size="sm" className="h-9 px-2 hidden sm:inline-flex">
                <Link to="/prediction-history">
                  <Archive className="w-3.5 h-3.5 sm:mr-1.5" />
                  <span className="hidden md:inline text-xs">预测档案</span>
                </Link>
              </Button>
              {isSuperAdmin && (
                <Button asChild variant="ghost" size="sm" className="h-9 px-2 hidden md:inline-flex">
                  <Link to="/admin-users">
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-accent" />
                    <span className="text-xs">Admin</span>
                  </Link>
                </Button>
              )}
              <UserMenu />
            </div>
          </div>
          {/* Status (mobile) */}
          <div className="lg:hidden mt-2 flex justify-center">
            <SystemStatusBar clauseCount={clauseCount} />
          </div>
          {clauseCount === 0 && isSuperAdmin && (
            <div className="mt-2 text-center">
              <span className="text-accent/80 text-[10px] font-mono">
                {t('admin.clause_empty')} →{' '}
                <Link to="/admin-import" className="underline hover:text-accent">
                  {t('admin.import')}
                </Link>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-6 md:py-10">
        <div className={`container mx-auto px-4 ${isResultStep ? 'max-w-7xl' : 'max-w-6xl'}`}>

          {/* Step: Input — Prediction Console */}
          {step === 'input' && (
            <div className="space-y-6 animate-fade-in-up">
              <HeroMission />
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Left: 40% input */}
                <div className="lg:col-span-2">
                  <HolographicPanel variant="elevated" innerPadding="lg">
                    <BirthDataForm onSubmit={handleBirthDataSubmit} isLoading={false} />
                  </HolographicPanel>
                </div>

                {/* Right: 60% engines + flow */}
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
          )}

          {/* Step: Calculating */}
          {step === 'calculating' && (
            <div className="max-w-2xl mx-auto animate-fade-in-up">
              <QuantumLoadingScreen />
            </div>
          )}

          {/* Step: Verification */}
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

          {/* Step: Projecting */}
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

          {/* Step: Result */}
          {isResultStep && fullReport && birthInput && quantumResult && (
            <div className="animate-fade-in-up">
              <ResultShell
                quantumSignature={quantumResult.quantumSignature}
                coherence={quantumResult.overallCoherence}
                worldsGenerated={quantumResult.totalWorldsGenerated}
                engineCount={13}
                dominantElement={quantumResult.dominantElement}
                deathAge={quantumResult.collapseResult?.deathAge}
                ganZhiDisplay={ganZhiDisplay}
                lifeSummary={quantumResult.lifeSummary}
              >
                {/* Tabs */}
                <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                  <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
                    <TabsList className="inline-flex w-auto min-w-full bg-card/40 border border-primary/15 h-auto p-1 rounded-xl gap-1">
                      {resultTabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                          <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="text-[11px] sm:text-xs py-2 px-3 rounded-lg font-sans whitespace-nowrap data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(40_65%_55%_/_0.25)] data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
                          >
                            <Icon className="w-3.5 h-3.5 mr-1.5 inline" />
                            {tab.label}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  <TabsContent value="overview" className="mt-5">
                    {quantumResult.unifiedResult && (
                      <PredictionOverview result={unifiedReport?.dashboardPayload ?? quantumResult.unifiedResult} />
                    )}
                  </TabsContent>

                  <TabsContent value="bazi" className="mt-5">
                    <HolographicPanel innerPadding="md">
                      <BaziCorePanel
                        bazi={quantumResult.unifiedResult?.engineOutputs?.find(e => e.engineName === 'bazi')}
                      />
                    </HolographicPanel>
                  </TabsContent>

                  <TabsContent value="engines" className="mt-5">
                    {quantumResult.unifiedResult && (
                      <EngineContributionPanel result={unifiedReport?.dashboardPayload ?? quantumResult.unifiedResult} />
                    )}
                  </TabsContent>

                  <TabsContent value="audit" className="mt-5">
                    <HolographicPanel innerPadding="md">
                      <AuditTracePanel engineOutputs={quantumResult.unifiedResult?.engineOutputs} />
                    </HolographicPanel>
                  </TabsContent>

                  <TabsContent value="tree" className="mt-5">
                    {quantumResult.destinyTree && quantumResult.collapseResult ? (
                      <DestinyTreeLayer tree={quantumResult.destinyTree} collapse={quantumResult.collapseResult} />
                    ) : (
                      <HolographicPanel innerPadding="lg" className="text-center text-xs text-muted-foreground">
                        {lang === 'zh' ? '命运树数据加载中...' : 'Loading destiny tree...'}
                      </HolographicPanel>
                    )}
                  </TabsContent>

                  <TabsContent value="path" className="mt-5">
                    {quantumResult.collapseResult ? (
                      <UniquePathLayer collapse={quantumResult.collapseResult} birthYear={birthInput.year} />
                    ) : (
                      <HolographicPanel innerPadding="lg" className="text-center text-xs text-muted-foreground">
                        {lang === 'zh' ? '坍缩数据加载中...' : 'Loading collapse data...'}
                      </HolographicPanel>
                    )}
                  </TabsContent>

                  <TabsContent value="destiny" className="mt-5">
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

                  <TabsContent value="quantum" className="mt-5">
                    <UnifiedQuantumPanel result={quantumResult} birthYear={birthInput.year} />
                  </TabsContent>

                  {isSuperAdmin && unifiedReport && (
                    <TabsContent value="orchestration" className="mt-5">
                      <div className="space-y-4">
                        <HolographicPanel innerPadding="md" className="border-accent/30">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-accent" />
                            <span className="text-xs text-accent/90 font-sans">{t('admin.super_admin')}</span>
                          </div>
                        </HolographicPanel>
                        <AdminOrchestrationConsole profile={profile} snapshot={unifiedReport.adminSnapshot} />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>

                {/* Footer Actions */}
                <div className="space-y-3 pt-4">
                  <HolographicPanel innerPadding="sm" className="text-center">
                    <div className="flex items-center justify-center gap-1.5 text-accent/85">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">
                        {t('disclaimer.title')}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/65 leading-relaxed font-sans max-w-3xl mx-auto">
                      {t('disclaimer.text')}
                    </p>
                  </HolographicPanel>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button
                      asChild
                      variant="outline"
                      className="py-5 text-sm font-sans tracking-wider border-border/40 hover:border-primary/40 hover:bg-primary/5 rounded-xl"
                    >
                      <Link to="/prediction-history">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        返回控制台 · 预测档案
                      </Link>
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="py-5 text-sm font-sans tracking-wider border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-xl group"
                    >
                      <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                      重新启动推演
                    </Button>
                  </div>
                </div>
              </ResultShell>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
