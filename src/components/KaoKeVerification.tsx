import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KaoKeOption {
  clauseNumber: number;
  content: string;
  timeOffset: number;
}

interface KaoKeVerificationProps {
  options: KaoKeOption[];
  onSelect: (selectedOption: KaoKeOption) => void;
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

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelect(options[selectedIndex]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-primary/30 pb-6">
        <h2 className="text-2xl font-display text-primary tracking-wider">
          考刻验证
        </h2>
        <p className="text-muted-foreground">
          请选择与您实际情况相符的描述
        </p>
        
        {/* GanZhi Display */}
        <div className="mt-4 py-3 px-6 bg-secondary/50 rounded inline-block">
          <span className="text-foreground/90 tracking-widest font-serif">
            {ganZhiDisplay}
          </span>
        </div>
      </div>

      {/* Verification Question */}
      <div className="text-center mb-6">
        <p className="text-lg text-foreground/80">
          以下哪项描述与您的家庭情况相符？
        </p>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            key={option.clauseNumber}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "w-full p-6 text-left rounded border transition-all duration-300",
              "hover:border-primary/50 hover:bg-secondary/30",
              selectedIndex === index
                ? "border-primary bg-secondary/50 shadow-lg shadow-primary/10"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-start gap-4">
              {/* Option Letter */}
              <span className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                selectedIndex === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {String.fromCharCode(65 + index)}
              </span>
              
              {/* Option Text */}
              <p className={cn(
                "text-lg font-serif leading-relaxed transition-colors",
                selectedIndex === index
                  ? "text-foreground"
                  : "text-foreground/70"
              )}>
                {option.content}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Confirm Button */}
      <div className="pt-6 border-t border-border">
        <Button
          onClick={handleConfirm}
          disabled={selectedIndex === null || isLoading}
          className={cn(
            "w-full py-6 text-lg font-serif tracking-widest transition-all duration-300",
            selectedIndex !== null
              ? "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isLoading ? (
            <span className="animate-pulse">验证中...</span>
          ) : (
            '确认选择'
          )}
        </Button>
        
        <p className="text-center text-muted-foreground text-sm mt-4">
          选择错误将影响推算准确性，请如实选择
        </p>
      </div>
    </div>
  );
}
