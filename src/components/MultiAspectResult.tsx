import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, Coins, Briefcase, Activity } from 'lucide-react';

interface DestinyAspect {
  key: string;
  label: string;
  clauseNumber: number;
  content: string;
  icon: React.ReactNode;
}

interface MultiAspectResultProps {
  aspects: DestinyAspect[];
  pillarsDisplay: string;
  onReset: () => void;
}

export function MultiAspectResult({ 
  aspects,
  pillarsDisplay,
  onReset 
}: MultiAspectResultProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isRevealing, setIsRevealing] = useState(true);

  // Staggered reveal animation
  useEffect(() => {
    if (revealedCount < aspects.length) {
      const timer = setTimeout(() => {
        setRevealedCount(prev => prev + 1);
      }, 800); // 800ms between each reveal
      return () => clearTimeout(timer);
    } else {
      setIsRevealing(false);
    }
  }, [revealedCount, aspects.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3 border-b border-primary/30 pb-5">
        <h2 className="text-2xl font-display text-primary tracking-wider animate-fade-in-up">
          天机显示
        </h2>
        <div className="py-2 px-4 bg-secondary/30 rounded inline-block">
          <span className="text-foreground/80 tracking-widest font-serif text-sm">
            {pillarsDisplay}
          </span>
        </div>
      </div>

      {/* Destiny Aspects - Revealed One by One */}
      <div className="space-y-4">
        {aspects.map((aspect, index) => (
          <div
            key={aspect.key}
            className={cn(
              "transition-all duration-700 ease-out",
              index < revealedCount
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none"
            )}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="bg-card/50 border border-border rounded-lg p-5 hover:border-primary/30 transition-colors">
              {/* Aspect Header */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {aspect.icon}
                </div>
                <div>
                  <h3 className="text-lg font-display text-primary">
                    {aspect.label}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    条文 #{aspect.clauseNumber}
                  </span>
                </div>
              </div>

              {/* Aspect Content */}
              <p className="text-foreground/90 font-serif text-base leading-relaxed tracking-wide">
                {aspect.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator while revealing */}
      {isRevealing && (
        <div className="text-center py-4">
          <div className="inline-block animate-pulse">
            <span className="text-primary text-xl">☯</span>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            天机显现中...
          </p>
        </div>
      )}

      {/* Footer Actions - Show after all revealed */}
      {!isRevealing && (
        <div className="pt-4 border-t border-border space-y-4 animate-fade-in-up">
          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <span className="text-primary text-lg">☯</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          {/* Interpretation Note */}
          <div className="text-center text-muted-foreground text-sm space-y-1">
            <p>古籍原文，意涵深远</p>
            <p>建议结合个人实际细细体会</p>
          </div>

          {/* Reset Button */}
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full py-5 text-lg font-serif tracking-widest border-border 
                       hover:border-primary hover:bg-secondary transition-all duration-300"
          >
            重新推算
          </Button>
        </div>
      )}
    </div>
  );
}

// Icon mapping for aspects
export const ASPECT_ICONS: Record<string, React.ReactNode> = {
  lifeDestiny: <Activity className="w-5 h-5" />,
  marriage: <Heart className="w-5 h-5" />,
  wealth: <Coins className="w-5 h-5" />,
  career: <Briefcase className="w-5 h-5" />,
};

export const ASPECT_LABELS: Record<string, string> = {
  lifeDestiny: '命运总论',
  marriage: '婚姻姻缘',
  wealth: '财运财富',
  career: '事业前程',
};
