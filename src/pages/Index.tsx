import { useState, useCallback } from 'react';
import { BirthDataForm } from '@/components/BirthDataForm';
import { KaoKeVerification } from '@/components/KaoKeVerification';
import { DestinyResult } from '@/components/DestinyResult';
import { Footer } from '@/components/Footer';
import { fetchClauseByNumber, getClauseCount } from '@/services/SupabaseService';
import { 
  TiebanService,
  type TiebanInput,
  type KaoKeCandidate,
} from '@/services/TiebanCalculator';
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
  useState(() => {
    getClauseCount().then(setClauseCount);
  });

  const handleBirthDataSubmit = useCallback(async (birthData: TiebanInput) => {
    setIsProcessing(true);

    try {
      // Step 1: Get GanZhi pillars for display
      const pillars = TiebanService.getGanZhiPillars(birthData);
      const ganZhi = TiebanService.formatPillars(pillars);
      setGanZhiDisplay(ganZhi);

      // Step 2: Calculate base number
      const calculatedBase = TiebanService.calculateBaseNumber(birthData);
      setBaseNumber(calculatedBase);

      console.log('Base number calculated:', calculatedBase);
      console.log('GanZhi:', ganZhi);

      // Step 3: Generate Kao Ke verification options
      const options = TiebanService.generateKaoKeOptions(calculatedBase);

      if (options.length === 0) {
        toast({
          title: '推算出错',
          description: '无法生成验证选项',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }

      setKaoKeOptions(options);
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

  const handleKaoKeSelect = useCallback(async (selectedOption: KaoKeCandidate) => {
    setIsProcessing(true);

    try {
      console.log('Selected quarter:', selectedOption.quarterIndex);
      console.log('Clause number:', selectedOption.clauseNumber);

      // Step 4: Calculate final destiny with locked quarter
      const destinyClauseNumber = TiebanService.projectSingleDestiny(
        baseNumber, 
        selectedOption.quarterIndex
      );

      console.log('Destiny clause number:', destinyClauseNumber);

      // Fetch the clause content from database
      const destinyClause = await fetchClauseByNumber(destinyClauseNumber);

      if (destinyClause) {
        setDestinyData({
          clauseNumber: destinyClause.clause_number,
          content: destinyClause.content,
          category: destinyClause.category || undefined,
        });
      } else {
        // Fallback if clause not found
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

          {/* Step: Verification */}
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
