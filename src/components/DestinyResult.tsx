import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DestinyResultProps {
  clauseNumber: number;
  content: string;
  category?: string;
  onReset: () => void;
}

export function DestinyResult({ 
  clauseNumber, 
  content, 
  category,
  onReset 
}: DestinyResultProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);

  // Split content into lines for staggered animation
  const lines = content.split(/[，。！？；]/).filter(Boolean);

  useEffect(() => {
    // Start reveal animation after component mounts
    const revealTimer = setTimeout(() => {
      setIsRevealed(true);
    }, 500);

    return () => clearTimeout(revealTimer);
  }, []);

  useEffect(() => {
    if (isRevealed) {
      // Stagger line reveals
      lines.forEach((_, index) => {
        setTimeout(() => {
          setVisibleLines(prev => [...prev, index]);
        }, 800 + index * 600);
      });
    }
  }, [isRevealed, lines.length]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={cn(
        "text-center space-y-4 border-b border-primary/30 pb-6 transition-all duration-1000",
        isRevealed ? "opacity-100" : "opacity-0"
      )}>
        <h2 className="text-2xl font-display text-primary tracking-wider">
          天机显示
        </h2>
        {category && (
          <span className="inline-block px-4 py-1 bg-accent/20 text-accent rounded text-sm">
            {category}
          </span>
        )}
      </div>

      {/* Clause Number */}
      <div className={cn(
        "text-center transition-all duration-1000 delay-300",
        isRevealed ? "opacity-100" : "opacity-0"
      )}>
        <span className="text-muted-foreground text-sm">条文第</span>
        <span className="text-primary text-3xl font-display mx-2 animate-pulse-glow inline-block px-4 py-2 rounded">
          {clauseNumber}
        </span>
        <span className="text-muted-foreground text-sm">号</span>
      </div>

      {/* Main Content - Line by Line Reveal */}
      <div className="py-8 px-6 bg-card/50 rounded border border-border/50 min-h-[200px]">
        <div className="text-center space-y-4">
          {lines.map((line, index) => (
            <p
              key={index}
              className={cn(
                "text-2xl font-serif leading-loose tracking-widest text-foreground",
                "opacity-0 transition-all duration-1000",
                visibleLines.includes(index) && "opacity-100 animate-fade-in-up"
              )}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards'
              }}
            >
              {line}
              {index < lines.length - 1 && <span className="text-primary/50">。</span>}
            </p>
          ))}
        </div>
      </div>

      {/* Decorative Divider */}
      <div className={cn(
        "flex items-center justify-center gap-4 transition-all duration-1000",
        visibleLines.length === lines.length ? "opacity-100" : "opacity-0"
      )}>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <span className="text-primary text-lg">☯</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col gap-4 transition-all duration-1000",
        visibleLines.length === lines.length ? "opacity-100" : "opacity-0"
      )}>
        <Button
          onClick={onReset}
          variant="outline"
          className="w-full py-6 text-lg font-serif tracking-widest border-border 
                     hover:border-primary hover:bg-secondary transition-all duration-300"
        >
          重新推算
        </Button>
      </div>

      {/* Interpretation Note */}
      <div className={cn(
        "text-center text-muted-foreground text-sm transition-all duration-1000",
        visibleLines.length === lines.length ? "opacity-100" : "opacity-0"
      )}>
        <p>古籍原文，意涵深远</p>
        <p>建议结合个人实际细细体会</p>
      </div>
    </div>
  );
}
