import { useState, useCallback, useEffect } from 'react';
import { BirthDataForm } from '@/components/BirthDataForm';
import { KaoKeVerification } from '@/components/KaoKeVerification';
import { DestinyResult } from '@/components/DestinyResult';
import { Footer } from '@/components/Footer';
import { fetchClauseByNumber, getClauseCount } from '@/services/SupabaseService';
import { 
  TiebanEngine,
  type TiebanInput,
  type KaoKeCandidate,
} from '@/utils/tiebanAlgorithm';
import { useToast } from '@/hooks/use-toast';

type AppStep = 'input' | 'verification' | 'result';

interface DestinyData {
  clauseNumber: number;
  content: string;
  category?: string;
}

const Index = () => {
  const [step, setStep] = useState<AppStep>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [kaoKeOptions, setKaoKeOptions] = useState<KaoKeCandidate[]>([]);
  const [ganZhiDisplay, setGanZhiDisplay] = useState('');
  const [baseNumber, setBaseNumber] = useState(0);
  const [destinyData, setDestinyData] = useState<DestinyData | null>(null);
  const [clauseCount, setClauseCount] = useState<number | null>(null);

  const { toast } = useToast();

  // Check clause count on mount
  useEffect(() => {
    getClauseCount().then(setClauseCount);
  }, []);

  /**
   * STEP 1: Handle birth data submission
   * - Calculate base number
   * - Generate Kao Ke candidates
   * - DO NOT calculate destiny yet
   */
  const handleBirthDataSubmit = useCallback(async (birthData: TiebanInput) => {
    setIsProcessing(true);

    try {
      // Calculate base number and get pillars
      const result = TiebanEngine.calculateBaseNumber(birthData);
      setBaseNumber(result.baseNumber);
      setGanZhiDisplay(result.pillars.fullDisplay);

      console.log('=== STEP 1: Base Calculation ===');
      console.log('Input:', birthData);
      console.log('Base Number:', result.baseNumber);
      console.log('Pillars:', result.pillars.fullDisplay);

      // Generate Kao Ke verification candidates
      const candidates = TiebanEngine.generateKaoKeCandidates(result.baseNumber);
      
      console.log('=== STEP 2: Kao Ke Candidates ===');
      candidates.forEach((c, i) => {
        console.log(`  [${i}] keIndex=${c.keIndex}, clauseNumber=${c.clauseNumber}, label=${c.timeLabel}`);
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
   * STEP 3: Handle Kao Ke selection (user clicks "This matches my situation")
   * - Lock the keIndex
   * - NOW calculate destiny paths
   */
  const handleKaoKeSelect = useCallback(async (
    lockedKeIndex: number, 
    selectedOption: KaoKeCandidate
  ) => {
    setIsProcessing(true);

    try {
      console.log('=== STEP 3: User Locked keIndex ===');
      console.log('Locked keIndex:', lockedKeIndex);
      console.log('Selected clause:', selectedOption.clauseNumber);

      // NOW we can calculate destiny (only after user verification)
      const destinyClauseNumber = TiebanEngine.calculatePrimaryDestiny(
        baseNumber, 
        lockedKeIndex
      );

      console.log('=== STEP 4: Destiny Calculation ===');
      console.log('Primary Destiny Clause:', destinyClauseNumber);

      // Fetch the clause content from database (with fallback)
      const destinyClause = await fetchClauseByNumber(destinyClauseNumber);

      if (destinyClause) {
        console.log('Found clause:', destinyClause.clause_number, destinyClause.content);
        setDestinyData({
          clauseNumber: destinyClause.clause_number,
          content: destinyClause.content,
          category: destinyClause.category || undefined,
        });
      } else {
        // Fallback if clause not found even with nearby search
        console.warn('No clause found, using fallback text');
        setDestinyData({
          clauseNumber: destinyClauseNumber,
          content: '此数待解，需参照古籍原文释义。天机幽微，非常理可尽述。',
          category: '待解读',
        });
      }

      setStep('result');
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
    setDestinyData(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-8 border-b border-border/30">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-display text-primary tracking-[0.2em] mb-2">
            铁板神数
          </h1>
          <p className="text-muted-foreground text-sm tracking-wider">
            Iron Plate Divine Number System
          </p>
          {clauseCount !== null && clauseCount > 0 && (
            <p className="text-muted-foreground/50 text-xs mt-2">
              条文库: {clauseCount.toLocaleString()} 条
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-xl mx-auto px-4">
          {/* Step: Input */}
          {step === 'input' && (
            <div className="bg-card/50 border border-border rounded-lg p-8 shadow-xl shadow-black/20">
              <BirthDataForm 
                onSubmit={handleBirthDataSubmit} 
                isLoading={isProcessing}
              />
            </div>
          )}

          {/* Step: Verification (Kao Ke) */}
          {step === 'verification' && (
            <div className="bg-card/50 border border-border rounded-lg p-8 shadow-xl shadow-black/20">
              <KaoKeVerification
                options={kaoKeOptions}
                onSelect={handleKaoKeSelect}
                ganZhiDisplay={ganZhiDisplay}
                isLoading={isProcessing}
              />
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && destinyData && (
            <div className="bg-card/50 border border-border rounded-lg p-8 shadow-xl shadow-black/20">
              <DestinyResult
                clauseNumber={destinyData.clauseNumber}
                content={destinyData.content}
                category={destinyData.category}
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
