import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchClauseByNumber } from '@/services/SupabaseService';
import type { KaoKeCandidate } from '@/utils/tiebanAlgorithm';

interface KaoKeVerificationProps {
  options: KaoKeCandidate[];
  onSelect: (lockedKeIndex: number, selectedOption: KaoKeCandidate) => void;
  ganZhiDisplay: string;
  isLoading?: boolean;
}

export function KaoKeVerification({ 
  options, 
  onSelect, 
  ganZhiDisplay,
  isLoading 
}: KaoKeVerificationProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loadedOptions, setLoadedOptions] = useState<KaoKeCandidate[]>([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(true);

  // Fetch REAL clause content from database for each option
  useEffect(() => {
    const loadClauseContent = async () => {
      setIsLoadingClauses(true);
      
      console.log('=== Loading Kao Ke Clauses from Database ===');
      
      const enrichedOptions = await Promise.all(
        options.map(async (option) => {
          const clause = await fetchClauseByNumber(option.clauseNumber);
          console.log(`Clause ${option.clauseNumber}:`, clause?.content || 'NOT FOUND');
          return {
            ...option,
            content: clause?.content || `条文 ${option.clauseNumber} (数据库中未找到)`,
          };
        })
      );
      
      setLoadedOptions(enrichedOptions);
      setIsLoadingClauses(false);
    };

    if (options.length > 0) {
      loadClauseContent();
    }
  }, [options]);

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      const selectedOption = loadedOptions[selectedIndex];
      onSelect(selectedOption.keIndex, selectedOption);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3 border-b border-primary/30 pb-5">
        <h2 className="text-2xl font-display text-primary tracking-wider">
          考刻验证
        </h2>
        
        {/* GanZhi Display */}
        <div className="py-2 px-4 bg-secondary/50 rounded inline-block">
          <span className="text-foreground/90 tracking-widest font-serif text-sm">
            {ganZhiDisplay}
          </span>
        </div>
      </div>

      {/* Important Instruction */}
      <div className="bg-accent/10 border border-accent/30 rounded p-4">
        <p className="text-foreground/80 text-sm leading-relaxed text-center">
          <span className="text-accent font-medium">铁板神数需精确时刻校准</span>
          <br />
          请选择与您<strong>家庭历史</strong>最相符的描述
        </p>
      </div>

      {/* Loading State */}
      {isLoadingClauses && (
        <div className="text-center py-12">
          <div className="inline-block animate-pulse">
            <span className="text-primary text-3xl">☯</span>
          </div>
          <p className="text-muted-foreground mt-4">从条文库加载验证选项...</p>
        </div>
      )}

      {/* 8 Options Grid */}
      {!isLoadingClauses && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loadedOptions.map((option, index) => (
            <button
              key={`${option.clauseNumber}-${option.keIndex}`}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "p-4 text-left rounded border transition-all duration-300",
                "hover:border-primary/50 hover:bg-secondary/30",
                selectedIndex === index
                  ? "border-primary bg-secondary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Option Index */}
                <span className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  selectedIndex === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </span>
                
                {/* Option Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-serif leading-relaxed transition-colors line-clamp-3",
                    selectedIndex === index
                      ? "text-foreground"
                      : "text-foreground/70"
                  )}>
                    {option.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {option.timeLabel}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Confirm Button */}
      {!isLoadingClauses && (
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleConfirm}
            disabled={selectedIndex === null || isLoading}
            className={cn(
              "w-full py-5 text-lg font-serif tracking-widest transition-all duration-300",
              selectedIndex !== null
                ? "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="animate-pulse">锁定时刻中...</span>
            ) : (
              '此项与我情况相符'
            )}
          </Button>
          
          <p className="text-center text-muted-foreground text-xs mt-3">
            确认后将锁定时刻坐标，推演命运轨迹
          </p>
        </div>
      )}
    </div>
  );
}
