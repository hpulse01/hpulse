import { useState, useCallback, useEffect } from 'react';
import { BirthDataForm } from '@/components/BirthDataForm';
import { KaoKeVerification } from '@/components/KaoKeVerification';
import { MultiAspectResult, ASPECT_ICONS, ASPECT_LABELS } from '@/components/MultiAspectResult';
import { Footer } from '@/components/Footer';
import { fetchClauseByNumber, getClauseCount } from '@/services/SupabaseService';
import { 
  TiebanEngine,
  type TiebanInput,
  type KaoKeCandidate,
  type DestinyProjection,
} from '@/utils/tiebanAlgorithm';
import { useToast } from '@/hooks/use-toast';
import { Heart, Coins, Briefcase, Activity } from 'lucide-react';

type AppStep = 'input' | 'verification' | 'result';

interface DestinyAspect {
  key: string;
  label: string;
  clauseNumber: number;
  content: string;
  icon: React.ReactNode;
}

const Index = () => {
  const [step, setStep] = useState<AppStep>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [kaoKeOptions, setKaoKeOptions] = useState<KaoKeCandidate[]>([]);
  const [ganZhiDisplay, setGanZhiDisplay] = useState('');
  const [baseNumber, setBaseNumber] = useState(0);
  const [destinyAspects, setDestinyAspects] = useState<DestinyAspect[]>([]);
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
   * - Generate Kao Ke candidates
   * - DO NOT calculate destiny yet (verification first!)
   */
  const handleBirthDataSubmit = useCallback(async (birthData: TiebanInput) => {
    setIsProcessing(true);

    try {
      console.log('=== STEP 1: Birth Data Submitted ===');
      console.log('Input:', birthData);

      // Calculate base number and get pillars
      const result = TiebanEngine.calculateBaseNumber(birthData);
      setBaseNumber(result.baseNumber);
      setGanZhiDisplay(result.pillars.fullDisplay);

      console.log('Base Number:', result.baseNumber);
      console.log('Pillars:', result.pillars.fullDisplay);
      console.log('Stem Sum:', result.stemSum, 'Branch Sum:', result.branchSum);

      // Generate Kao Ke verification candidates
      const candidates = TiebanEngine.generateKaoKeCandidates(result.baseNumber);
      
      console.log('=== STEP 2: Generated 8 Kao Ke Candidates ===');
      candidates.forEach((c, i) => {
        console.log(`  [${i}] keIndex=${c.keIndex}, clauseNumber=${c.clauseNumber}`);
      });

      if (candidates.length === 0) {
        toast({
          title: '推算出错',
          description: '无法生成验证选项',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      setKaoKeOptions(candidates);
      setStep('verification');
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: '推算出错',
        description: '请检查输入数据后重试',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  /**
   * STEP 3: Handle Kao Ke selection (user confirms which option matches)
   * - Lock the keIndex
   * - NOW calculate destiny paths using TiebanEngine.calculateDestinyPaths
   * - Fetch all 4 aspect clauses from DB
   */
  const handleKaoKeSelect = useCallback(async (
    lockedKeIndex: number, 
    selectedOption: KaoKeCandidate
  ) => {
    setIsProcessing(true);

    try {
      console.log('=== STEP 3: User Locked Quarter ===');
      console.log('Locked keIndex:', lockedKeIndex);
      console.log('Selected clause:', selectedOption.clauseNumber);

      // Calculate all destiny paths using the locked quarter
      const destinyProjection: DestinyProjection = TiebanEngine.calculateDestinyPaths(
        baseNumber, 
        lockedKeIndex
      );

      console.log('=== STEP 4: Destiny Projection ===');
      console.log('Life Destiny:', destinyProjection.lifeDestiny);
      console.log('Marriage:', destinyProjection.marriage);
      console.log('Wealth:', destinyProjection.wealth);
      console.log('Career:', destinyProjection.career);

      // Fetch all 4 aspect clauses from database
      const aspectKeys = ['lifeDestiny', 'marriage', 'wealth', 'career'] as const;
      const aspects: DestinyAspect[] = [];

      for (const key of aspectKeys) {
        const clauseNumber = destinyProjection[key];
        const clause = await fetchClauseByNumber(clauseNumber);
        
        aspects.push({
          key,
          label: ASPECT_LABELS[key] || key,
          clauseNumber: clause?.clause_number || clauseNumber,
          content: clause?.content || '此数待解，需参照古籍原文释义。',
          icon: ASPECT_ICONS[key] || <Activity className="w-5 h-5" />,
        });

        console.log(`Fetched ${key}: clause ${clauseNumber} ->`, clause?.content?.substring(0, 30) || 'NOT FOUND');
      }

      setDestinyAspects(aspects);
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
    } finally {
      setIsProcessing(false);
    }
  }, [baseNumber, toast]);

  const handleReset = useCallback(() => {
    setStep('input');
    setKaoKeOptions([]);
    setGanZhiDisplay('');
    setBaseNumber(0);
    setDestinyAspects([]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-6 md:py-8 border-b border-border/30">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-display text-primary tracking-[0.2em] mb-2">
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
        <div className="container max-w-xl mx-auto px-4">
          {/* Step: Input */}
          {step === 'input' && (
            <div className="bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
              <BirthDataForm 
                onSubmit={handleBirthDataSubmit} 
                isLoading={isProcessing}
              />
            </div>
          )}

          {/* Step: Verification (Kao Ke) */}
          {step === 'verification' && (
            <div className="bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
              <KaoKeVerification
                options={kaoKeOptions}
                onSelect={handleKaoKeSelect}
                ganZhiDisplay={ganZhiDisplay}
                isLoading={isProcessing}
              />
            </div>
          )}

          {/* Step: Multi-Aspect Result */}
          {step === 'result' && destinyAspects.length > 0 && (
            <div className="bg-card/50 border border-border rounded-lg p-6 md:p-8 shadow-xl shadow-black/20">
              <MultiAspectResult
                aspects={destinyAspects}
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
