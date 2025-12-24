import { useState, useCallback } from 'react';
import { BirthDataForm } from '@/components/BirthDataForm';
import { KaoKeVerification } from '@/components/KaoKeVerification';
import { DestinyResult } from '@/components/DestinyResult';
import { Footer } from '@/components/Footer';
import { useClauseData } from '@/hooks/useClauseData';
import { 
  convertSolarToLunar, 
  calculateBaseNumber, 
  getKaoKeOptions,
  projectDestiny,
  formatGanZhi,
  type BirthData 
} from '@/services/TiebanCalculator';
import { useToast } from '@/hooks/use-toast';

type AppStep = 'input' | 'verification' | 'result';

interface KaoKeOption {
  clauseNumber: number;
  content: string;
  timeOffset: number;
}

interface DestinyData {
  clauseNumber: number;
  content: string;
  category?: string;
}

const Index = () => {
  const [step, setStep] = useState<AppStep>('input');
  const [isProcessing, setIsProcessing] = useState(false);
  const [kaoKeOptions, setKaoKeOptions] = useState<KaoKeOption[]>([]);
  const [ganZhiDisplay, setGanZhiDisplay] = useState('');
  const [baseNumber, setBaseNumber] = useState(0);
  const [destinyData, setDestinyData] = useState<DestinyData | null>(null);

  const { getClause, getClauses, isLoading: clausesLoading } = useClauseData();
  const { toast } = useToast();

  const handleBirthDataSubmit = useCallback((birthData: BirthData) => {
    setIsProcessing(true);

    try {
      // Convert to lunar calendar and get GanZhi
      const birthDate = new Date(
        birthData.year,
        birthData.month - 1,
        birthData.day,
        birthData.hour,
        birthData.minute
      );
      
      const lunarData = convertSolarToLunar(birthDate);
      const ganZhi = formatGanZhi(lunarData.ganZhi);
      setGanZhiDisplay(ganZhi);

      // Calculate base number
      const calculatedBase = calculateBaseNumber(lunarData.ganZhi, birthData);
      setBaseNumber(calculatedBase);

      // Get Kao Ke verification options
      const optionNumbers = getKaoKeOptions(calculatedBase);
      const clauseData = getClauses(optionNumbers);

      // Build options with content
      const options: KaoKeOption[] = optionNumbers.map((num, index) => {
        const clause = clauseData[index];
        return {
          clauseNumber: num,
          content: clause?.content || `条文 ${num} (待解读)`,
          timeOffset: [-30, -15, 0, 15, 30][index] || 0,
        };
      }).filter(opt => opt.content);

      if (options.length === 0) {
        toast({
          title: '条文数据尚未加载',
          description: '请稍后重试或联系管理员',
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
  }, [getClauses, toast]);

  const handleKaoKeSelect = useCallback((selectedOption: KaoKeOption) => {
    setIsProcessing(true);

    try {
      // Lock the base number with the selected time offset
      const lockedNumber = baseNumber + selectedOption.timeOffset;
      
      // Project destiny
      const destinyClauseNumber = projectDestiny(lockedNumber);
      const destinyClause = getClause(destinyClauseNumber);

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
  }, [baseNumber, getClause, toast]);

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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container max-w-xl mx-auto px-4">
          {/* Loading State for Clauses */}
          {clausesLoading && (
            <div className="text-center py-20">
              <div className="inline-block animate-pulse">
                <span className="text-primary text-2xl">☯</span>
              </div>
              <p className="text-muted-foreground mt-4">加载条文数据中...</p>
            </div>
          )}

          {/* Step: Input */}
          {!clausesLoading && step === 'input' && (
            <div className="bg-card/50 border border-border rounded-lg p-8 shadow-xl shadow-black/20">
              <BirthDataForm 
                onSubmit={handleBirthDataSubmit} 
                isLoading={isProcessing}
              />
            </div>
          )}

          {/* Step: Verification */}
          {!clausesLoading && step === 'verification' && (
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
          {!clausesLoading && step === 'result' && destinyData && (
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
