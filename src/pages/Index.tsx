import { useState, useCallback, useEffect } from 'react';
import { BirthDataForm } from '@/components/BirthDataForm';
import { SixRelationsVerification } from '@/components/SixRelationsVerification';
import { DestinyRevelation } from '@/components/DestinyRevelation';
import { Footer } from '@/components/Footer';
import { getClauseCount } from '@/services/SupabaseService';
import { 
  TiebanEngine,
  type TiebanInput,
  type KaoKeWithMatch,
  type DestinyProjection,
} from '@/utils/tiebanAlgorithm';
import { useToast } from '@/hooks/use-toast';

type AppStep = 'input' | 'calculating' | 'verification' | 'projecting' | 'result';

const Index = () => {
  const [step, setStep] = useState<AppStep>('input');
  const [birthInput, setBirthInput] = useState<TiebanInput | null>(null);
  const [ganZhiDisplay, setGanZhiDisplay] = useState('');
  const [baseNumber, setBaseNumber] = useState(0);
  const [destinyProjection, setDestinyProjection] = useState<DestinyProjection | null>(null);
  const [clauseCount, setClauseCount] = useState<number | null>(null);

  const { toast } = useToast();

  // Check clause count on mount
  useEffect(() => {
    getClauseCount().then(count => {
      setClauseCount(count);
      console.log('Database clause count:', count);
    });
  }, []);

  /**
   * STEP 1: Handle birth data submission
   * - Calculate base number using TiebanEngine
   * - Store birth input for later use
   * - Proceed to Six Relations verification
   */
  const handleBirthDataSubmit = useCallback(async (birthData: TiebanInput) => {
    setStep('calculating');

    try {
      console.log('=== STEP 1: Birth Data Submitted ===');
      console.log('Input:', birthData);

      // Simulate brief calculation time for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Store birth input
      setBirthInput(birthData);

      // Calculate base number and get pillars
      const result = TiebanEngine.calculateBaseNumber(birthData);
      setBaseNumber(result.baseNumber);
      setGanZhiDisplay(result.pillars.fullDisplay);

      console.log('Base Number:', result.baseNumber);
      console.log('Pillars:', result.pillars.fullDisplay);
      console.log('Stem Sum:', result.stemSum, 'Branch Sum:', result.branchSum);

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
   * STEP 2: Handle Six Relations verification (user confirms which quarter matches)
   * - Lock the keIndex based on family data matching
   * - Calculate destiny paths using TiebanEngine.calculateDestinyPaths
   */
  const handleTimeLocked = useCallback(async (
    lockedKeIndex: number, 
    selectedOption: KaoKeWithMatch
  ) => {
    setStep('projecting');

    try {
      console.log('=== STEP 2: User Locked Quarter via Six Relations ===');
      console.log('Locked keIndex:', lockedKeIndex);
      console.log('Match Score:', selectedOption.matchScore);
      console.log('Selected clause:', selectedOption.clauseNumber);

      // Simulate projection calculation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate all destiny paths using the locked quarter
      const projection: DestinyProjection = TiebanEngine.calculateDestinyPaths(
        baseNumber, 
        lockedKeIndex
      );

      console.log('=== STEP 3: Destiny Projection ===');
      console.log('Life Destiny:', projection.lifeDestiny);
      console.log('Marriage:', projection.marriage);
      console.log('Wealth:', projection.wealth);
      console.log('Career:', projection.career);

      setDestinyProjection(projection);
      setStep('result');

      toast({
        title: '推算完成',
        description: '天机已显，请细细体会',
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
  }, [baseNumber, toast]);

  const handleReset = useCallback(() => {
    setStep('input');
    setBirthInput(null);
    setGanZhiDisplay('');
    setBaseNumber(0);
    setDestinyProjection(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-6 md:py-8 border-b border-border/30">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-serif text-primary tracking-[0.2em] mb-2">
            铁板神数
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm tracking-wider">
            Iron Plate Divine Number System
          </p>
          {clauseCount !== null && clauseCount > 0 && (
            <p className="text-muted-foreground/50 text-xs mt-2">
              条文库: {clauseCount.toLocaleString()} 条
            </p>
          )}
          {clauseCount === 0 && (
            <p className="text-accent/70 text-xs mt-2">
              ⚠ 条文库为空，请先导入数据 → <a href="/admin-import" className="underline hover:text-accent">导入页面</a>
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 md:py-12">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Step: Input */}
          {step === 'input' && (
            <div className="max-w-xl mx-auto bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
              <BirthDataForm 
                onSubmit={handleBirthDataSubmit} 
                isLoading={false}
              />
            </div>
          )}

          {/* Step: Calculating (Loading Transition) */}
          {step === 'calculating' && (
            <div className="max-w-xl mx-auto bg-card/50 border border-border rounded-lg p-12 shadow-xl shadow-black/20">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="text-6xl animate-spin text-primary">☯</div>
                  <div className="absolute inset-0 animate-pulse-glow rounded-full" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-serif text-primary tracking-wider">
                    正在推演乾坤...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Calculating Celestial Coordinates
                  </p>
                </div>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Six Relations Verification */}
          {step === 'verification' && (
            <div className="bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
              <SixRelationsVerification
                baseNumber={baseNumber}
                ganZhiDisplay={ganZhiDisplay}
                onTimeLocked={handleTimeLocked}
                isLoading={false}
              />
            </div>
          )}

          {/* Step: Projecting Destiny (Loading Transition) */}
          {step === 'projecting' && (
            <div className="max-w-xl mx-auto bg-card/50 border border-border rounded-lg p-12 shadow-xl shadow-black/20">
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="text-6xl text-primary animate-pulse">卦</div>
                  <div className="absolute inset-0 animate-pulse-glow rounded-full" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-serif text-primary tracking-wider">
                    天机推演中...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Projecting Destiny Pathways
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {['命', '运', '缘', '财'].map((char, i) => (
                    <span
                      key={char}
                      className="text-lg text-primary/50 animate-pulse"
                      style={{ animationDelay: `${i * 300}ms` }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Destiny Revelation */}
          {step === 'result' && destinyProjection && (
            <div className="bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
              <DestinyRevelation
                destinyIds={destinyProjection}
                pillarsDisplay={ganZhiDisplay}
                onReset={handleReset}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
