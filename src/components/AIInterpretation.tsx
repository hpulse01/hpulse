/**
 * AI Interpretation Component (Enhanced)
 * Provides AI-powered deep interpretation of destiny clauses
 * Integrates BaZi, Iron Plate, and Liu Yao for comprehensive analysis
 * Supports continuation when response is incomplete
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronDown, ChevronUp, Loader2, BookOpen, Zap, Clock, Gem, ArrowRight } from 'lucide-react';
import type { BaZiProfile } from '@/utils/tiebanAlgorithm';
import type { LiuYaoResult } from '@/utils/liuYaoAlgorithm';
import { useAuth } from '@/hooks/useAuth';

interface AIInterpretationProps {
  clauseContent: string;
  aspectLabel: string;
  pillarsDisplay: string;
  baziProfile?: BaZiProfile;
  hexagram?: LiuYaoResult;
  allAspects?: { label: string; content: string }[];
  currentAge?: number;
  daYunInfo?: string;
}

// Parse markdown-like formatting
function formatInterpretation(text: string) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    // H2 headers
    if (trimmed.startsWith('## ')) {
      const headerText = trimmed.replace('## ', '');
      const icon = getHeaderIcon(headerText);
      elements.push(
        <h3 key={idx} className="text-base font-medium text-primary flex items-center gap-2 mt-4 mb-2 first:mt-0">
          {icon}
          {headerText}
        </h3>
      );
    }
    // Bold text sections
    else if (trimmed.startsWith('**') && trimmed.includes('**:')) {
      const [label, ...rest] = trimmed.split('**:');
      const cleanLabel = label.replace(/\*\*/g, '');
      elements.push(
        <p key={idx} className="text-sm text-foreground/90 leading-relaxed mb-2">
          <span className="font-medium text-primary/80">{cleanLabel}:</span>
          {rest.join('**:')}
        </p>
      );
    }
    // List items
    else if (trimmed.startsWith('- ')) {
      elements.push(
        <li key={idx} className="text-sm text-foreground/80 leading-relaxed ml-4 list-disc">
          {trimmed.substring(2)}
        </li>
      );
    }
    // Regular paragraphs
    else if (trimmed) {
      elements.push(
        <p key={idx} className="text-sm text-foreground/90 leading-relaxed mb-2">
          {trimmed}
        </p>
      );
    }
  });
  
  return elements;
}

function getHeaderIcon(text: string) {
  if (text.includes('条辞') || text.includes('解密')) return <BookOpen className="w-4 h-4" />;
  if (text.includes('合参') || text.includes('分析')) return <Zap className="w-4 h-4" />;
  if (text.includes('应期') || text.includes('推测')) return <Clock className="w-4 h-4" />;
  if (text.includes('开运') || text.includes('指南')) return <Gem className="w-4 h-4" />;
  return <Sparkles className="w-4 h-4" />;
}

// Check if interpretation appears incomplete
function isIncomplete(text: string): boolean {
  const trimmed = text.trim();
  // Check for incomplete endings
  if (trimmed.endsWith('...') || trimmed.endsWith('：') || trimmed.endsWith(':')) return true;
  // Check if it ends mid-sentence (no punctuation)
  const lastChar = trimmed.slice(-1);
  const endPunctuation = ['。', '！', '？', '.', '!', '?', '】', '）', ')'];
  // Check for expected sections
  const hasOpeningGuide = trimmed.includes('开运') || trimmed.includes('指南') || trimmed.includes('建议');
  const hasConclusion = trimmed.includes('总结') || trimmed.includes('综上');
  // If content is long but missing key sections, likely incomplete
  if (trimmed.length > 500 && !hasOpeningGuide && !hasConclusion) return true;
  return false;
}

export function AIInterpretation({
  clauseContent,
  aspectLabel,
  pillarsDisplay,
  baziProfile,
  hexagram,
  allAspects,
  currentAge,
  daYunInfo,
}: AIInterpretationProps) {
  const { consumeAIUse, profile } = useAuth();
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContinue, setShowContinue] = useState(false);

  const buildRequestBody = () => {
    const requestBody: Record<string, unknown> = {
      clauseContent,
      aspectLabel,
      pillarsDisplay,
      currentAge,
      daYunInfo,
      allAspects,
    };

    // Enhanced BaZi profile with deep analysis data
    if (baziProfile) {
      requestBody.baziProfile = {
        dayMaster: baziProfile.dayMaster,
        dayMasterElement: baziProfile.dayMasterElement,
        strength: baziProfile.strength,
        favorableElements: baziProfile.favorableElements,
        unfavorableElements: baziProfile.unfavorableElements,
        pillars: baziProfile.pillars,
        ...(baziProfile as any).tenGods && { tenGods: (baziProfile as any).tenGods },
        ...(baziProfile as any).naYinAnalysis && { naYin: (baziProfile as any).naYinAnalysis },
        ...(baziProfile as any).pattern && { pattern: (baziProfile as any).pattern },
      };
    }

    // Enhanced hexagram data
    if (hexagram) {
      const movingRelatives = hexagram.mainHexagram.lines
        .filter(l => l.isChanging)
        .map(l => l.relative);
      
      const elementCounts: Record<string, number> = {};
      hexagram.mainHexagram.lines.forEach(l => {
        elementCounts[l.element] = (elementCounts[l.element] || 0) + 1;
      });
      const dominantElement = Object.entries(elementCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      requestBody.hexagram = {
        name: hexagram.mainHexagram.name,
        symbol: hexagram.mainHexagram.symbol,
        lines: hexagram.mainHexagram.lines.map(l => l.value),
        changingLines: hexagram.mainHexagram.changingLines,
        interpretation: hexagram.interpretation,
        targetHexagramName: hexagram.mainHexagram.targetHexagram?.name,
        dominantElement,
        movingRelatives: movingRelatives.length > 0 ? [...new Set(movingRelatives)] : undefined,
      };
    }

    return requestBody;
  };

  const handleInterpret = async () => {
    if (interpretation) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowContinue(false);

    try {
      // Consume AI use if user is level_2
      if (profile?.level === 'level_2') {
        const success = await consumeAIUse();
        if (!success) {
          throw new Error('AI解读次数已用完，请升级会员');
        }
      }

      const requestBody = buildRequestBody();

      const { data, error: fnError } = await supabase.functions.invoke('ai-interpret', {
        body: requestBody,
      });

      if (fnError) throw fnError;

      const result = data.interpretation;
      setInterpretation(result);
      setIsExpanded(true);
      setShowContinue(isIncomplete(result));
    } catch (err: any) {
      console.error('AI interpretation error:', err);
      setError(err.message || '解读失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!interpretation) return;

    setIsContinuing(true);
    setError(null);

    try {
      const requestBody = buildRequestBody();
      // Add previous content for continuation
      requestBody.previousContent = interpretation;
      requestBody.continueGeneration = true;

      const { data, error: fnError } = await supabase.functions.invoke('ai-interpret', {
        body: requestBody,
      });

      if (fnError) throw fnError;

      const continued = data.interpretation;
      const newInterpretation = interpretation + '\n\n' + continued;
      setInterpretation(newInterpretation);
      setShowContinue(isIncomplete(continued));
    } catch (err: any) {
      console.error('AI continue error:', err);
      setError(err.message || '继续生成失败，请重试');
    } finally {
      setIsContinuing(false);
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
          {isLoading ? '正在深度解读...' : interpretation ? '三术合参·深度解读' : '获取AI深度解读'}
        </span>
        {interpretation && (
          isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {error && (
        <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2 text-xs text-primary/70">
            <Sparkles className="w-3 h-3 animate-pulse" />
            正在融合八字、铁板、卦象进行三术合参...
          </div>
          <Skeleton className="h-4 w-full bg-primary/10" />
          <Skeleton className="h-4 w-5/6 bg-primary/10" />
          <Skeleton className="h-4 w-4/5 bg-primary/10" />
          <Skeleton className="h-4 w-full bg-primary/10" />
          <Skeleton className="h-4 w-3/4 bg-primary/10" />
        </div>
      )}

      {interpretation && isExpanded && (
        <div className="mt-4 p-5 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              三术合参·深度解读
            </Badge>
            <span className="text-xs text-muted-foreground">
              八字 + 铁板 + 卦象
            </span>
          </div>
          <div className="prose prose-sm prose-invert max-w-none space-y-1">
            {formatInterpretation(interpretation)}
          </div>
          
          {/* Continue Button */}
          {(showContinue || isContinuing) && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <Button
                variant="outline"
                size="sm"
                onClick={handleContinue}
                disabled={isContinuing}
                className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary"
              >
                {isContinuing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    正在继续生成...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    继续生成
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIInterpretation;
