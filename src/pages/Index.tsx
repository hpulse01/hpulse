import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { BirthDataForm } from '@/components/BirthDataForm';
import { SixRelationsVerification } from '@/components/SixRelationsVerification';
import { DestinyDashboard } from '@/components/DestinyDashboard';
import { UnifiedQuantumPanel } from '@/components/UnifiedQuantumPanel';
import { Footer } from '@/components/Footer';
import { UserMenu } from '@/components/UserMenu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
import { Atom, RotateCcw, Sparkles, Scroll, Zap } from 'lucide-react';

type AppStep = 'input' | 'calculating' | 'verification' | 'projecting' | 'result';

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
  const [activeResultTab, setActiveResultTab] = useState('destiny');

  const { toast } = useToast();

  useEffect(() => {
    getClauseCount().then(count => {
      setClauseCount(count);
    });
  }, []);

  /**
   * STEP 1: Handle birth data submission
   * Calculate base number, then go to Kao Ke verification
   */
  const handleBirthDataSubmit = useCallback(async (birthData: TiebanInput) => {
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
      toast({
        title: '推算出错',
        description: '请检查输入数据后重试',
        variant: 'destructive',
      });
      setStep('input');
    }
  }, [toast]);

  /**
   * STEP 2: Handle Kao Ke verification
   * Calibrate system offset, then run multi-system quantum orchestration
   */
  const handleTimeLocked = useCallback(async (
    lockedKeIndex: number,
    selectedOption: KaoKeWithMatch
  ) => {
    setStep('projecting');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const systemOffset = TiebanEngine.calculateSystemOffset(
        theoreticalBase,
        selectedOption.clauseNumber
      );

      const calibration: CalibrationResult = {
        theoreticalBase,
        confirmedClauseId: selectedOption.clauseNumber,
        systemOffset,
        lockedQuarterIndex: lockedKeIndex
      };
      setCalibrationResult(calibration);

      // Generate Iron Plate full destiny report
      const report: FullDestinyReport = TiebanEngine.generateFullDestinyReport(
        birthInput!,
        theoreticalBase,
        systemOffset
      );
      setFullReport(report);

      // Run quantum multi-system orchestration with calibrated offset
      const qResult = QuantumPredictionEngine.predict(birthInput!, systemOffset);
      setQuantumResult(qResult);

      setStep('result');
      toast({
        title: '推算完成',
        description: '九大体系量子坍缩完毕，命运轨迹已确定',
      });
    } catch (error) {
      console.error('Projection error:', error);
      toast({
        title: '推演出错',
        description: '请重新开始',
        variant: 'destructive',
      });
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
    setActiveResultTab('destiny');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-3 md:py-5 border-b border-violet-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/20 via-transparent to-purple-950/20" />
        <div className="container max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-primary to-fuchsia-300 tracking-[0.15em]">
                H-Pulse
              </h1>
              <p className="text-muted-foreground text-[10px] md:text-xs tracking-wider">
                Quantum Destiny Prediction · 量子命运预测系统
              </p>
              {clauseCount !== null && clauseCount > 0 && (
                <p className="text-muted-foreground/40 text-[10px] mt-1">
                  条文库: {clauseCount.toLocaleString()} 条 · 九大命理体系
                </p>
              )}
              {clauseCount === 0 && (
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
        <div className={`container mx-auto px-4 ${step === 'result' ? 'max-w-5xl' : 'max-w-2xl'}`}>

          {/* Step: Input */}
          {step === 'input' && (
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 -z-10 opacity-20 rounded-xl overflow-hidden">
                <QuantumField energy={30} dominantElement="金" />
              </div>
              <div className="bg-card/60 backdrop-blur-sm border border-violet-500/20 rounded-xl p-6 md:p-8 shadow-2xl shadow-violet-950/30">
                <BirthDataForm
                  onSubmit={handleBirthDataSubmit}
                  isLoading={false}
                />
              </div>
            </div>
          )}

          {/* Step: Calculating */}
          {step === 'calculating' && (
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <QuantumField energy={50} dominantElement="水" />
              </div>
              <div className="relative bg-card/40 backdrop-blur-sm border border-violet-500/30 rounded-xl p-12 shadow-2xl">
                <div className="text-center space-y-6">
                  <Atom className="w-16 h-16 text-violet-400 animate-spin mx-auto" style={{ animationDuration: '3s' }} />
                  <div className="space-y-2">
                    <p className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-primary tracking-wider">
                      九大体系初始化中...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Initializing Multi-System Analysis
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['铁板神数', '八字命理', '紫微斗数', '六爻卦象', '西方占星', '吠陀占星', '数字命理', '玛雅历法', '卡巴拉'].map((sys, i) => (
                      <Badge key={sys} variant="outline" className="text-[10px] border-violet-500/30 text-violet-300 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                        {sys}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Kao Ke Verification */}
          {step === 'verification' && (
            <div className="bg-card/50 border border-violet-500/20 rounded-xl p-6 md:p-8 shadow-xl shadow-black/20">
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
              <div className="relative bg-card/40 backdrop-blur-sm border border-violet-500/30 rounded-xl p-12 shadow-2xl">
                <div className="text-center space-y-6">
                  <Atom className="w-16 h-16 text-violet-400 animate-spin mx-auto" style={{ animationDuration: '1s' }} />
                  <div className="space-y-2">
                    <p className="text-xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 tracking-wider">
                      量子坍缩 · 收敛唯一命运...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Quantum Collapse → One True Destiny
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-fuchsia-400 font-mono animate-pulse">
                      ∞ worlds → 1 true destiny
                    </p>
                    <div className="w-48 mx-auto h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full animate-pulse" />
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
                <div className="relative z-10 bg-gradient-to-b from-card/70 via-card/50 to-card/70 backdrop-blur-sm border border-violet-500/20 rounded-xl p-5 md:p-7">
                  <div className="text-center space-y-3">
                    <h2 className="text-xl md:text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-primary to-fuchsia-300 tracking-wider">
                      命运已全知
                    </h2>
                    <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-300 font-mono">
                      {quantumResult.quantumSignature}
                    </Badge>
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
                      <span>共振度: <strong className="text-violet-300">{Math.round(quantumResult.overallCoherence * 100)}%</strong></span>
                      <span>世界总数: <strong className="text-violet-300">{quantumResult.totalWorldsGenerated.toLocaleString()}</strong></span>
                      <span>命理体系: <strong className="text-violet-300">{quantumResult.systems.length}</strong></span>
                      <span>主导五行: <strong className="text-violet-300">{quantumResult.dominantElement}</strong></span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed border-t border-violet-500/20 pt-3 mt-2">
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

              {/* Unified Result Tabs */}
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                <TabsList className="grid w-full grid-cols-3 bg-violet-950/30 border border-violet-500/20 h-auto">
                  <TabsTrigger value="destiny" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Scroll className="w-3 h-3 mr-1 hidden sm:inline" />铁板命盘
                  </TabsTrigger>
                  <TabsTrigger value="quantum" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Atom className="w-3 h-3 mr-1 hidden sm:inline" />量子全知
                  </TabsTrigger>
                  <TabsTrigger value="systems" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Sparkles className="w-3 h-3 mr-1 hidden sm:inline" />九系解析
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Iron Plate Destiny Dashboard (existing component) */}
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

                {/* Tab 2: Quantum Prediction Panels */}
                <TabsContent value="quantum" className="mt-5">
                  <UnifiedQuantumPanel
                    result={quantumResult}
                    birthYear={birthInput.year}
                  />
                </TabsContent>

                {/* Tab 3: Nine Systems Detail */}
                <TabsContent value="systems" className="mt-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {quantumResult.systems.map(sys => (
                      <div key={sys.id} className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-serif text-violet-200">{sys.nameCN}</h4>
                          <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-300/70">
                            {sys.origin} · {Math.round(sys.weight * 100)}%
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(sys.meta).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">{k}</span>
                              <span className="text-foreground truncate ml-2 max-w-[120px]">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <div className="text-[10px] text-muted-foreground">
                            世界分支: <strong className="text-violet-300">{(quantumResult.branchesPerSystem[sys.id] || 0).toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer Actions */}
              <div className="space-y-3 pt-3 border-t border-violet-500/20">
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    H-Pulse量子预测系统综合全球九大命理体系（铁板神数·八字·紫微斗数·六爻·西方占星·吠陀占星·数字命理·玛雅历法·卡巴拉），
                    通过{quantumResult.totalWorldsGenerated.toLocaleString()}个平行世界的量子坍缩与铁板考刻校准，收敛为唯一确定性命运轨迹。
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline"
                  className="w-full py-4 text-base font-serif tracking-wider border-violet-500/30 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-300 group">
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
