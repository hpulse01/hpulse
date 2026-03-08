import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Footer } from '@/components/Footer';
import { UserMenu } from '@/components/UserMenu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

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
import { Atom, RotateCcw, Sparkles, Scroll, Zap, TreePine, Target, Layers, Shield, Activity } from 'lucide-react';

type AppStep = 'input' | 'calculating' | 'verification' | 'projecting' | 'result';

const ALL_ENGINE_LABELS = [
  '铁板神数', '八字命理', '紫微斗数', '六爻卦象',
  '西方占星', '吠陀占星', '数字命理', '玛雅历法', '卡巴拉',
  '梅花易数', '奇门遁甲', '大六壬', '太乙神数',
];

const Index = () => {
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
      toast({ title: '推算出错', description: '请检查输入数据后重试', variant: 'destructive' });
      setStep('input');
    }
  }, [toast]);

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
      toast({ title: '推算完成', description: '十三大体系量子坍缩完毕，命运轨迹已确定' });
    } catch (error) {
      console.error('Projection error:', error);
      toast({ title: '推演出错', description: '请重新开始', variant: 'destructive' });
      setStep('verification');
    }
  }, [theoreticalBase, birthInput, toast]);

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

  // Build result tabs based on role
  const resultTabs = useMemo(() => {
    const tabs = [
      { id: 'overview', label: '预测总览', icon: Sparkles },
      { id: 'engines', label: '引擎贡献', icon: Layers },
      { id: 'tree', label: '命运树', icon: TreePine },
      { id: 'path', label: '唯一路径', icon: Target },
      { id: 'destiny', label: '铁板命盘', icon: Scroll },
      { id: 'quantum', label: '量子全知', icon: Atom },
    ];
    // Only super_admin sees the orchestration tab
    if (isSuperAdmin) {
      tabs.push({ id: 'orchestration', label: '统一编排', icon: Shield });
    }
    return tabs;
  }, [isSuperAdmin]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-3 md:py-5 border-b border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-card/30 to-background" />
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-4xl font-serif text-primary tracking-[0.15em]">
                H-Pulse
              </h1>
              <p className="text-muted-foreground text-[10px] md:text-xs tracking-wider">
                Quantum Destiny Prediction · 量子命运预测系统
              </p>
              {clauseCount !== null && clauseCount > 0 && (
                <p className="text-muted-foreground/40 text-[10px] mt-1">
                  条文库: {clauseCount.toLocaleString()} 条 · 十三大命理体系
                </p>
              )}
              {clauseCount === 0 && isSuperAdmin && (
                <p className="text-accent/70 text-[10px] mt-1">
                  ⚠ 条文库为空 → <a href="/admin-import" className="underline hover:text-accent">导入</a>
                </p>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 md:py-8">
        <div className={`container mx-auto px-4 ${step === 'result' ? 'max-w-6xl' : 'max-w-2xl'}`}>

          {/* Step: Input */}
          {step === 'input' && (
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 -z-10 opacity-20 rounded-xl overflow-hidden">
                <QuantumField energy={30} dominantElement="金" />
              </div>
              <div className="bg-card/60 backdrop-blur-sm border border-primary/20 rounded-xl p-6 md:p-8 shadow-2xl">
                <BirthDataForm onSubmit={handleBirthDataSubmit} isLoading={false} />
              </div>
            </div>
          )}

          {/* Step: Calculating */}
          {step === 'calculating' && (
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <QuantumField energy={50} dominantElement="水" />
              </div>
              <div className="relative bg-card/40 backdrop-blur-sm border border-primary/30 rounded-xl p-12 shadow-2xl">
                <div className="text-center space-y-6">
                  <Atom className="w-16 h-16 text-primary animate-spin mx-auto" style={{ animationDuration: '3s' }} />
                  <div className="space-y-2">
                    <p className="text-xl font-serif text-primary tracking-wider">
                      十三大体系初始化中...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Initializing 13-Engine Analysis
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ALL_ENGINE_LABELS.map((sys, i) => (
                      <Badge key={sys} variant="outline" className="text-[10px] border-primary/30 text-primary/80 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
                        {sys}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Verification */}
          {step === 'verification' && (
            <div className="bg-card/50 border border-primary/20 rounded-xl p-6 md:p-8 shadow-xl">
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
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <QuantumField energy={85} dominantElement="火" />
              </div>
              <div className="relative bg-card/40 backdrop-blur-sm border border-primary/30 rounded-xl p-12 shadow-2xl">
                <div className="text-center space-y-6">
                  <Atom className="w-16 h-16 text-primary animate-spin mx-auto" style={{ animationDuration: '1s' }} />
                  <div className="space-y-2">
                    <p className="text-xl font-serif text-primary tracking-wider">
                      量子坍缩 · 收敛唯一命运...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quantum Collapse → One True Destiny
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-accent font-mono animate-pulse">
                      ∞ worlds → 1 true destiny
                    </p>
                    <div className="w-48 mx-auto h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Unified Result */}
          {step === 'result' && fullReport && birthInput && quantumResult && (
            <div className="space-y-5">
              {/* Quantum Signature Header */}
              <div className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <QuantumField energy={quantumResult.overallCoherence * 100} dominantElement={quantumResult.dominantElement} />
                </div>
                <div className="relative z-10 bg-gradient-to-b from-card/70 via-card/50 to-card/70 backdrop-blur-sm border border-primary/20 rounded-xl p-5 md:p-7">
                  <div className="text-center space-y-3">
                    <h2 className="text-xl md:text-2xl font-serif text-primary tracking-wider">
                      命运已全知
                    </h2>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary/80 font-mono">
                      {quantumResult.quantumSignature}
                    </Badge>
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
                      <span>共振度: <strong className="text-primary">{Math.round(quantumResult.overallCoherence * 100)}%</strong></span>
                      <span>世界总数: <strong className="text-primary">{quantumResult.totalWorldsGenerated.toLocaleString()}</strong></span>
                      <span>命理体系: <strong className="text-primary">13</strong></span>
                      <span>主导五行: <strong className="text-primary">{quantumResult.dominantElement}</strong></span>
                      {quantumResult.collapseResult && (
                        <span>坍缩寿命: <strong className="text-rose-400">{quantumResult.collapseResult.deathAge}岁</strong></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed border-t border-primary/20 pt-3 mt-2">
                      {quantumResult.lifeSummary}
                    </p>
                    <div className="inline-block px-3 py-1.5 bg-secondary/50 rounded border border-primary/10">
                      <span className="text-foreground/80 font-mono tracking-widest text-xs">
                        {ganZhiDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Tabs */}
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                <TabsList className={`grid w-full bg-secondary/30 border border-primary/20 h-auto ${isSuperAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
                  {resultTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="text-[9px] sm:text-xs py-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                      >
                        <Icon className="w-3 h-3 mr-1 hidden sm:inline" />{tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {/* Tab: Prediction Overview */}
                <TabsContent value="overview" className="mt-5">
                  {quantumResult.unifiedResult && (
                    <PredictionOverview result={quantumResult.unifiedResult} />
                  )}
                </TabsContent>

                {/* Tab: Engine Contribution */}
                <TabsContent value="engines" className="mt-5">
                  {quantumResult.unifiedResult && (
                    <EngineContributionPanel result={quantumResult.unifiedResult} />
                  )}
                </TabsContent>

                {/* Tab: Destiny Tree */}
                <TabsContent value="tree" className="mt-5">
                  {quantumResult.destinyTree && quantumResult.collapseResult ? (
                    <DestinyTreeLayer tree={quantumResult.destinyTree} collapse={quantumResult.collapseResult} />
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs">命运树数据加载中...</div>
                  )}
                </TabsContent>

                {/* Tab: Unique Path */}
                <TabsContent value="path" className="mt-5">
                  {quantumResult.collapseResult ? (
                    <UniquePathLayer collapse={quantumResult.collapseResult} birthYear={birthInput.year} />
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs">坍缩数据加载中...</div>
                  )}
                </TabsContent>

                {/* Tab: Iron Plate Destiny Dashboard */}
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

                {/* Tab: Quantum Omniscience */}
                <TabsContent value="quantum" className="mt-5">
                  <UnifiedQuantumPanel result={quantumResult} birthYear={birthInput.year} />
                </TabsContent>

                {/* Tab: Unified Orchestration (SUPER_ADMIN ONLY) */}
                {isSuperAdmin && (
                  <TabsContent value="orchestration" className="mt-5">
                    {quantumResult.unifiedResult && (
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-rose-400" />
                          <span className="text-xs text-rose-300">Super Admin 专属 · 统一编排诊断面板</span>
                        </div>
                        <UnifiedResultsPanel result={quantumResult.unifiedResult} />
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>

              {/* Footer Actions */}
              <div className="space-y-3 pt-3 border-t border-primary/20">
                <div className="bg-card/30 border border-primary/10 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    H-Pulse量子预测系统综合十三大命理体系（铁板神数·八字·紫微斗数·六爻·西方占星·吠陀占星·数字命理·玛雅历法·卡巴拉·梅花易数·奇门遁甲·大六壬·太乙神数），
                    通过递归命运树的量子坍缩与铁板考刻校准，收敛为唯一确定性命运轨迹。
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline"
                  className="w-full py-4 text-base font-serif tracking-wider border-primary/30 hover:border-primary hover:bg-primary/10 transition-all duration-300 group">
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  重新推算
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
