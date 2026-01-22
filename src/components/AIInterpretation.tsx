/**
 * AI Interpretation Component
 * Provides AI-powered deep interpretation of destiny clauses
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { BaZiProfile } from '@/utils/tiebanAlgorithm';
import type { LiuYaoResult } from '@/utils/liuYaoAlgorithm';

interface AIInterpretationProps {
  clauseContent: string;
  aspectLabel: string;
  pillarsDisplay: string;
  baziProfile?: BaZiProfile;
  hexagram?: LiuYaoResult;
  allAspects?: { label: string; content: string }[];
}

export function AIInterpretation({
  clauseContent,
  aspectLabel,
  pillarsDisplay,
  baziProfile,
  hexagram,
  allAspects,
}: AIInterpretationProps) {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInterpret = async () => {
    if (interpretation) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-interpret', {
        body: {
          clauseContent,
          aspectLabel,
          pillarsDisplay,
          baziProfile: baziProfile ? {
            dayMaster: baziProfile.dayMaster,
            dayMasterElement: baziProfile.dayMasterElement,
            strength: baziProfile.strength,
            favorableElements: baziProfile.favorableElements,
            unfavorableElements: baziProfile.unfavorableElements,
            pillars: baziProfile.pillars,
          } : undefined,
          hexagram: hexagram ? {
            name: hexagram.mainHexagram.name,
            symbol: hexagram.mainHexagram.symbol,
            lines: hexagram.mainHexagram.lines.map(l => l.value),
            changingLines: hexagram.mainHexagram.changingLines,
            interpretation: hexagram.interpretation,
          } : undefined,
          allAspects,
        },
      });

      if (fnError) throw fnError;

      setInterpretation(data.interpretation);
      setIsExpanded(true);
    } catch (err: any) {
      console.error('AI interpretation error:', err);
      setError(err.message || '解读失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInterpret}
        disabled={isLoading}
        className="w-full justify-between text-muted-foreground hover:text-primary hover:bg-primary/10"
      >
        <span className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isLoading ? '正在解读...' : interpretation ? 'AI深度解读' : '获取AI解读'}
        </span>
        {interpretation && (
          isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {error && (
        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </div>
      )}

      {interpretation && isExpanded && (
        <div className="mt-3 p-4 bg-gradient-to-b from-primary/5 to-transparent border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              AI解读
            </Badge>
          </div>
          <div className="prose prose-sm prose-invert max-w-none">
            {interpretation.split('\n').map((paragraph, idx) => (
              <p key={idx} className="text-sm text-foreground/90 leading-relaxed mb-2 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIInterpretation;
