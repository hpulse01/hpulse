/**
 * Destiny Revelation Component (天命批注)
 * 
 * The final "payoff" screen - displays the calculated destiny clauses
 * with elegant typewriter/fade-in animations like opening a secret scroll.
 * 
 * Theme: "Digital Temple" - Parchment texture, Gold accents, Classical typography
 */

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fetchClauseByNumber } from '@/services/SupabaseService';
import type { DestinyProjection } from '@/utils/tiebanAlgorithm';
import { 
  Sparkles, 
  Heart, 
  Coins, 
  Briefcase, 
  RotateCcw,
  Scroll
} from 'lucide-react';

// ==========================================
// CONSTANTS
// ==========================================

const ASPECT_CONFIG = [
  { 
    key: 'lifeDestiny' as const, 
    label: '命运总论', 
    subtitle: 'Life Destiny',
    icon: Sparkles,
    color: 'text-amber-400'
  },
  { 
    key: 'marriage' as const, 
    label: '婚姻姻缘', 
    subtitle: 'Marriage & Love',
    icon: Heart,
    color: 'text-rose-400'
  },
  { 
    key: 'wealth' as const, 
    label: '财运财富', 
    subtitle: 'Wealth & Fortune',
    icon: Coins,
    color: 'text-emerald-400'
  },
  { 
    key: 'career' as const, 
    label: '事业前程', 
    subtitle: 'Career & Success',
    icon: Briefcase,
    color: 'text-sky-400'
  },
];

// ==========================================
// INTERFACES
// ==========================================

interface DestinyRevelationProps {
  destinyIds: DestinyProjection;
  pillarsDisplay: string;
  onReset: () => void;
}

interface LoadedAspect {
  key: string;
  label: string;
  subtitle: string;
  icon: typeof Sparkles;
  color: string;
  clauseNumber: number;
  content: string;
  isLoading: boolean;
}

// ==========================================
// TYPEWRITER HOOK
// ==========================================

function useTypewriter(text: string, speed: number = 30, startDelay: number = 0) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);

    if (!text) return;

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const startTyping = () => {
      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          currentIndex++;
          timeoutId = setTimeout(typeNextChar, speed);
        } else {
          setIsComplete(true);
        }
      };
      typeNextChar();
    };

    const delayTimeout = setTimeout(startTyping, startDelay);

    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(timeoutId);
    };
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
}

// ==========================================
// ASPECT CARD COMPONENT
// ==========================================

interface AspectCardProps {
  aspect: LoadedAspect;
  index: number;
  isRevealed: boolean;
}

function AspectCard({ aspect, index, isRevealed }: AspectCardProps) {
  const Icon = aspect.icon;
  const { displayedText, isComplete } = useTypewriter(
    isRevealed ? aspect.content : '',
    25,
    300
  );

  return (
    <div
      className={cn(
        "relative transition-all duration-700 ease-out",
        isRevealed
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none"
      )}
      style={{ transitionDelay: `${index * 200}ms` }}
    >
      {/* Card */}
      <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-card via-card to-secondary/30">
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent" />
        
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-primary/10">
          <div className={cn(
            "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center",
            aspect.color
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-serif text-primary tracking-wider">
              {aspect.label}
            </h3>
            <p className="text-xs text-muted-foreground">
              {aspect.subtitle} · 条文 #{aspect.clauseNumber}
            </p>
          </div>
        </div>

        {/* Content - Typewriter Effect */}
        <div className="p-5 min-h-[120px]">
          {aspect.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full bg-muted/30" />
              <Skeleton className="h-4 w-5/6 bg-muted/30" />
              <Skeleton className="h-4 w-4/6 bg-muted/30" />
            </div>
          ) : (
            <p className="font-serif text-foreground/90 text-base leading-loose tracking-wide">
              {displayedText}
              {!isComplete && isRevealed && (
                <span className="animate-pulse text-primary">|</span>
              )}
            </p>
          )}
        </div>

        {/* Seal Mark */}
        {isComplete && (
          <div className="absolute bottom-3 right-3 opacity-30">
            <div className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center">
              <Scroll className="w-5 h-5 text-primary/50" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function DestinyRevelation({
  destinyIds,
  pillarsDisplay,
  onReset,
}: DestinyRevelationProps) {
  const [aspects, setAspects] = useState<LoadedAspect[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all clause contents on mount
  useEffect(() => {
    const loadAspects = async () => {
      setIsLoading(true);

      const loadedAspects: LoadedAspect[] = await Promise.all(
        ASPECT_CONFIG.map(async (config) => {
          const clauseNumber = destinyIds[config.key];
          const clause = await fetchClauseByNumber(clauseNumber);

          return {
            ...config,
            clauseNumber: clause?.clause_number || clauseNumber,
            content: clause?.content || '此数待解，需参照古籍原文释义。天机玄妙，因缘际会自有定数。',
            isLoading: false,
          };
        })
      );

      setAspects(loadedAspects);
      setIsLoading(false);
    };

    loadAspects();
  }, [destinyIds]);

  // Staggered reveal animation
  useEffect(() => {
    if (!isLoading && revealedCount < aspects.length) {
      const timer = setTimeout(() => {
        setRevealedCount(prev => prev + 1);
      }, 1000); // 1 second between each reveal
      return () => clearTimeout(timer);
    }
  }, [isLoading, revealedCount, aspects.length]);

  const allRevealed = revealedCount >= aspects.length && !isLoading;

  return (
    <div className="space-y-8">
      {/* Header - Scroll Opening Effect */}
      <div className="text-center space-y-4 pb-6 border-b border-primary/20">
        {/* Title with Glow */}
        <div className="relative inline-block">
          <h2 className="text-3xl md:text-4xl font-serif text-primary tracking-[0.3em] animate-pulse-glow">
            天命批注
          </h2>
          <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full -z-10" />
        </div>
        
        <p className="text-sm text-muted-foreground tracking-widest">
          Destiny Decree · 铁板神数推演
        </p>

        {/* Pillars Display */}
        <div className="inline-block px-6 py-3 bg-secondary/50 rounded-lg border border-primary/10">
          <span className="text-foreground/80 font-mono tracking-[0.2em] text-sm">
            {pillarsDisplay}
          </span>
        </div>

        {/* Decorative Divider */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/50" />
          <span className="text-primary text-2xl">☯</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/50" />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12 space-y-4">
          <div className="inline-block animate-spin text-primary text-4xl">
            ☯
          </div>
          <p className="text-muted-foreground font-serif">
            正在开启天书...
          </p>
        </div>
      )}

      {/* Aspect Cards Grid */}
      {!isLoading && (
        <div className="grid gap-6">
          {aspects.map((aspect, index) => (
            <AspectCard
              key={aspect.key}
              aspect={aspect}
              index={index}
              isRevealed={index < revealedCount}
            />
          ))}
        </div>
      )}

      {/* Revealing Progress */}
      {!isLoading && !allRevealed && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-3 text-muted-foreground">
            <span className="animate-pulse text-primary text-xl">☯</span>
            <span className="font-serif">天机显现中...</span>
            <span className="text-sm">({revealedCount}/{aspects.length})</span>
          </div>
        </div>
      )}

      {/* Footer - Show after all revealed */}
      {allRevealed && (
        <div className="space-y-6 pt-6 animate-fade-in-up">
          {/* Decorative Seal */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center bg-primary/5">
                <span className="text-3xl text-primary">卦</span>
              </div>
              <div className="absolute inset-0 animate-pulse-glow rounded-full" />
            </div>
          </div>

          {/* Interpretation Note */}
          <div className="text-center space-y-2 text-muted-foreground">
            <p className="font-serif">古籍原文，意涵深远</p>
            <p className="text-sm">建议结合个人实际细细体会，命由己造</p>
          </div>

          {/* Disclaimer */}
          <div className="bg-secondary/30 border border-border/50 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              本结果基于《铁板神数》太玄数学模型推演，仅供参考。
              <br />
              Results are based on the Tai Xuan mathematical model. For reference only.
            </p>
          </div>

          {/* Reset Button */}
          <Button
            onClick={onReset}
            variant="outline"
            className="w-full py-6 text-lg font-serif tracking-widest border-primary/30 
                       hover:border-primary hover:bg-primary/10 transition-all duration-300
                       group"
          >
            <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
            重新推算 · Recalculate
          </Button>
        </div>
      )}
    </div>
  );
}

export default DestinyRevelation;
