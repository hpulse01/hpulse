/**
 * Ziwei Doushu Display Component
 * Enhanced display with 14 main stars, auxiliary stars, and four transformations (四化)
 * Integrated into the BaZi Profile tab with AI interpretation
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZiweiEngine, type ZiweiReport, type ZiweiStar, type SihuaInfo, type DaxianInfo } from '@/utils/ziweiAlgorithm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Star, Home, Users, Heart, Baby, Coins, Activity, 
  Plane, UserCheck, Briefcase, Building, Smile, UserPlus,
  Sparkles, ChevronDown, ChevronUp, Loader2, Lock, Crown, Zap, Calendar
} from 'lucide-react';

interface ZiweiDisplayProps {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
}

// Palace icons mapping
const PALACE_ICONS: Record<string, typeof Star> = {
  '命宫': Star,
  '兄弟': Users,
  '夫妻': Heart,
  '子女': Baby,
  '财帛': Coins,
  '疾厄': Activity,
  '迁移': Plane,
  '仆役': UserCheck,
  '官禄': Briefcase,
  '田宅': Building,
  '福德': Smile,
  '父母': UserPlus,
};

// Branch element mapping
const BRANCH_ELEMENTS: Record<string, { element: string; color: string }> = {
  '子': { element: '水', color: 'text-blue-400' },
  '丑': { element: '土', color: 'text-yellow-500' },
  '寅': { element: '木', color: 'text-green-400' },
  '卯': { element: '木', color: 'text-green-500' },
  '辰': { element: '土', color: 'text-yellow-400' },
  '巳': { element: '火', color: 'text-red-400' },
  '午': { element: '火', color: 'text-red-500' },
  '未': { element: '土', color: 'text-yellow-500' },
  '申': { element: '金', color: 'text-gray-300' },
  '酉': { element: '金', color: 'text-gray-400' },
  '戌': { element: '土', color: 'text-yellow-600' },
  '亥': { element: '水', color: 'text-blue-300' },
};

// Star group colors
const STAR_GROUP_COLORS: Record<string, string> = {
  'ziwei': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'tianfu': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'auxiliary': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'sha': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

// Brightness colors
const BRIGHTNESS_COLORS: Record<string, string> = {
  '庙': 'text-primary',
  '旺': 'text-emerald-400',
  '得': 'text-green-400',
  '利': 'text-cyan-400',
  '平': 'text-muted-foreground',
  '闲': 'text-orange-400',
  '陷': 'text-red-400',
};

// Sihua colors
const SIHUA_COLORS: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/20',
  '权': 'text-amber-400 bg-amber-500/20',
  '科': 'text-blue-400 bg-blue-500/20',
  '忌': 'text-rose-400 bg-rose-500/20',
};

// Parse AI interpretation with markdown-like formatting
function formatInterpretation(text: string) {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h4 key={idx} className="text-sm font-medium text-primary flex items-center gap-2 mt-3 mb-2 first:mt-0">
          <Star className="w-3 h-3" />
          {trimmed.replace('## ', '')}
        </h4>
      );
    } else if (trimmed.startsWith('**') && trimmed.includes('**')) {
      const content = trimmed.replace(/\*\*/g, '');
      elements.push(
        <p key={idx} className="text-xs text-foreground/90 leading-relaxed mb-1.5 font-medium">
          {content}
        </p>
      );
    } else if (trimmed.startsWith('- ')) {
      elements.push(
        <li key={idx} className="text-xs text-foreground/80 leading-relaxed ml-3 list-disc">
          {trimmed.substring(2)}
        </li>
      );
    } else if (trimmed) {
      elements.push(
        <p key={idx} className="text-xs text-foreground/80 leading-relaxed mb-1.5">
          {trimmed}
        </p>
      );
    }
  });
  
  return elements;
}

// Star display component with Sihua
function StarBadge({ star }: { star: ZiweiStar }) {
  const groupColor = STAR_GROUP_COLORS[star.group] || '';
  const brightnessColor = BRIGHTNESS_COLORS[star.brightness] || 'text-muted-foreground';
  
  const isKeystar = ['紫微', '天府', '太阳', '太阴'].includes(star.name);
  const isAuxiliary = star.type === 'auxiliary';
  const isSha = star.type === 'sha';
  
  return (
    <Badge 
      variant="outline" 
      className={`text-[8px] sm:text-[10px] px-1 py-0 ${groupColor} ${isKeystar ? 'font-bold' : ''}`}
    >
      <span className={brightnessColor}>{star.name}</span>
      {!isAuxiliary && !isSha && (
        <span className="ml-0.5 text-[7px] opacity-70">{star.brightness}</span>
      )}
      {star.sihua && (
        <span className={`ml-0.5 text-[7px] font-bold ${
          star.sihua === '禄' ? 'text-emerald-400' :
          star.sihua === '权' ? 'text-amber-400' :
          star.sihua === '科' ? 'text-blue-400' :
          'text-rose-400'
        }`}>
          化{star.sihua}
        </span>
      )}
    </Badge>
  );
}

// Sihua summary component
function SihuaSummary({ sihua }: { sihua: SihuaInfo[] }) {
  return (
    <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-500/10 via-amber-500/10 to-blue-500/10 border border-primary/20 rounded-lg">
      <h5 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
        <Zap className="w-3 h-3 text-amber-400" />
        四化飞星
      </h5>
      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {sihua.map((s) => (
          <div 
            key={s.transform}
            className={`text-center p-1.5 sm:p-2 rounded-lg border ${
              s.transform === '禄' ? 'bg-emerald-500/10 border-emerald-500/30' :
              s.transform === '权' ? 'bg-amber-500/10 border-amber-500/30' :
              s.transform === '科' ? 'bg-blue-500/10 border-blue-500/30' :
              'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <span className={`text-lg sm:text-xl font-serif ${
              s.transform === '禄' ? 'text-emerald-400' :
              s.transform === '权' ? 'text-amber-400' :
              s.transform === '科' ? 'text-blue-400' :
              'text-rose-400'
            }`}>
              {s.transform}
            </span>
            <p className="text-[9px] sm:text-xs text-foreground mt-0.5">{s.star}</p>
            <p className="text-[8px] text-muted-foreground">{s.meaning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ZiweiDisplay({ year, month, day, hour, gender }: ZiweiDisplayProps) {
  const { canUseAI, isAuthenticated, profile, consumeAIUse } = useAuth();
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const report = useMemo(() => {
    return ZiweiEngine.generateReport({ year, month, day, hour, gender });
  }, [year, month, day, hour, gender]);

  // Get key stars for summary
  const keyStars = useMemo(() => {
    const mingPalace = report.palaces.find(p => p.isMing);
    const shenPalace = report.palaces.find(p => p.isShen);
    
    return {
      ming: mingPalace?.stars.filter(s => s.type === 'major') || [],
      shen: shenPalace?.stars.filter(s => s.type === 'major') || [],
    };
  }, [report]);

  // Separate auxiliary stars
  const { mainStarsPalaces, auxiliaryStars } = useMemo(() => {
    const auxiliary: string[] = [];
    report.palaces.forEach(p => {
      p.stars.forEach(s => {
        if (s.type === 'auxiliary' || s.type === 'sha') {
          if (!auxiliary.includes(s.name)) auxiliary.push(s.name);
        }
      });
    });
    return {
      mainStarsPalaces: report.palaces,
      auxiliaryStars: auxiliary,
    };
  }, [report]);

  // Build context for AI interpretation
  const buildZiweiContext = () => {
    const mingElement = BRANCH_ELEMENTS[report.mingGong];
    const shenElement = BRANCH_ELEMENTS[report.shenGong];
    
    const mingPalace = report.palaces.find(p => p.isMing);
    const shenPalace = report.palaces.find(p => p.isShen);
    
    const starsInMing = mingPalace?.stars.map(s => {
      let str = `${s.name}(${s.brightness})`;
      if (s.sihua) str += `化${s.sihua}`;
      return str;
    }).join('、') || '无主星';
    
    const starsInShen = shenPalace?.stars.map(s => {
      let str = `${s.name}(${s.brightness})`;
      if (s.sihua) str += `化${s.sihua}`;
      return str;
    }).join('、') || '无主星';
    
    const sihuaSummary = report.sihua.map(s => `${s.star}化${s.transform}`).join('、');
    
    const palacesSummary = report.palaces
      .map(p => {
        const stars = p.stars.map(s => {
          let str = s.name;
          if (s.sihua) str += `化${s.sihua}`;
          return str;
        }).join('、') || '空宫';
        return `${p.name}(${p.branch}): ${stars}`;
      })
      .join('\n');
    
    return {
      clauseContent: `紫微斗数命盘分析：

【命宫分析】
命宫落在${report.mingGong}宫（${mingElement?.element || ''}）
命宫主星：${starsInMing}

【身宫分析】
身宫落在${report.shenGong}宫（${shenElement?.element || ''}）
身宫主星：${starsInShen}

【四化飞星】${sihuaSummary}

【五行局】${report.wuxingju.name}

【辅星配置】${auxiliaryStars.join('、')}

【基本资料】
农历${report.lunarDate}，${report.hourBranch}时生
四柱：${report.yearGanZhi}年 ${report.monthGanZhi}月 ${report.dayGanZhi}日

【十二宫位与主星分布】
${palacesSummary}

请根据紫微斗数理论分析：
1. 命宫主星配置的格局特点和人生倾向
2. 四化飞星对命局的具体影响
3. 辅星（左辅右弼、文昌文曲、魁钺）的作用
4. 煞星（擎羊、陀罗、火铃）的影响和化解
5. 综合建议`,
      aspectLabel: '紫微斗数命盘解读',
      pillarsDisplay: `${report.yearGanZhi} ${report.monthGanZhi} ${report.dayGanZhi}`,
      isZiweiAnalysis: true,
    };
  };

  const handleInterpret = async () => {
    if (interpretation) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Consume AI use for level_2 users
      if (profile?.level === 'level_2') {
        const success = await consumeAIUse();
        if (!success) {
          throw new Error('AI解读次数已用完，请升级会员');
        }
      }

      const requestBody = buildZiweiContext();

      const { data, error: fnError } = await supabase.functions.invoke('ai-interpret', {
        body: requestBody,
      });

      if (fnError) throw fnError;

      setInterpretation(data.interpretation);
      setIsExpanded(true);
    } catch (err: any) {
      console.error('Ziwei AI interpretation error:', err);
      setError(err.message || '解读失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-3 sm:p-4">
      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
        <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
        紫微斗数命盘
        <Badge variant="outline" className="ml-auto text-[9px] sm:text-xs bg-purple-500/10 border-purple-500/30 text-purple-400">
          {report.wuxingju.name}
        </Badge>
      </h4>
      
      {/* Ming Gong & Shen Gong Summary with Stars */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">命宫</span>
            <Badge variant="outline" className="text-[9px] sm:text-xs bg-purple-500/10 border-purple-500/30 text-purple-400">
              {BRANCH_ELEMENTS[report.mingGong]?.element || ''}
            </Badge>
          </div>
          <span className={`text-xl sm:text-2xl font-serif ${BRANCH_ELEMENTS[report.mingGong]?.color || 'text-primary'} block text-center mb-1`}>
            {report.mingGong}
          </span>
          {keyStars.ming.length > 0 && (
            <div className="flex flex-wrap gap-0.5 justify-center">
              {keyStars.ming.slice(0, 4).map((star, idx) => (
                <StarBadge key={idx} star={star} />
              ))}
            </div>
          )}
        </div>
        <div className="p-2 sm:p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground">身宫</span>
            <Badge variant="outline" className="text-[9px] sm:text-xs bg-primary/10 border-primary/30 text-primary">
              {BRANCH_ELEMENTS[report.shenGong]?.element || ''}
            </Badge>
          </div>
          <span className={`text-xl sm:text-2xl font-serif ${BRANCH_ELEMENTS[report.shenGong]?.color || 'text-primary'} block text-center mb-1`}>
            {report.shenGong}
          </span>
          {keyStars.shen.length > 0 && (
            <div className="flex flex-wrap gap-0.5 justify-center">
              {keyStars.shen.slice(0, 4).map((star, idx) => (
                <StarBadge key={idx} star={star} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Four Transformations (四化飞星) */}
      {report.sihua.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <SihuaSummary sihua={report.sihua} />
        </div>
      )}

      {/* Lunar Date Info */}
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-secondary/30 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
          <div>
            <span className="text-muted-foreground">农历:</span>
            <span className="ml-1 text-foreground">{report.lunarDate}</span>
          </div>
          <div>
            <span className="text-muted-foreground">时辰:</span>
            <span className="ml-1 text-foreground">{report.hourBranch}时</span>
          </div>
        </div>
        {/* Auxiliary Stars Summary */}
        <div className="mt-2 pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground">辅星: </span>
          <span className="text-[10px] text-cyan-400">
            {auxiliaryStars.filter(s => !['擎羊', '陀罗', '火星', '铃星'].includes(s)).join(' ')}
          </span>
          <span className="text-[10px] text-muted-foreground ml-2">煞星: </span>
          <span className="text-[10px] text-rose-400">
            {auxiliaryStars.filter(s => ['擎羊', '陀罗', '火星', '铃星'].includes(s)).join(' ')}
          </span>
        </div>
      </div>

      {/* Da Xian (大限) - Major Luck Periods */}
      <div className="mb-3 sm:mb-4">
        <h5 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
          <Calendar className="w-3 h-3 text-amber-400" />
          大限运程 <span className="text-[9px] text-primary/60">(起运{report.startDaxianAge}岁)</span>
        </h5>
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex gap-1.5 sm:gap-2 min-w-max">
            {report.daxian.map((dx, idx) => {
              const majorStars = dx.stars.filter(s => s.type === 'major');
              const hasGoodSihua = dx.stars.some(s => s.sihua === '禄' || s.sihua === '权' || s.sihua === '科');
              const hasBadSihua = dx.stars.some(s => s.sihua === '忌');
              const hasSha = dx.stars.some(s => s.type === 'sha');
              
              return (
                <div
                  key={idx}
                  className={`
                    flex flex-col items-center p-2 rounded-lg border min-w-[70px] sm:min-w-[85px] transition-all
                    ${hasGoodSihua && !hasBadSihua 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : hasBadSihua 
                        ? 'bg-rose-500/10 border-rose-500/30' 
                        : 'bg-card/30 border-border/30'}
                  `}
                >
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">{dx.startAge}-{dx.endAge}岁</span>
                  <span className="text-base sm:text-lg font-serif text-primary">{dx.branch}</span>
                  <span className="text-[9px] text-muted-foreground">{dx.palaceName}</span>
                  {majorStars.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                      {majorStars.slice(0, 2).map((star, sidx) => (
                        <Badge 
                          key={sidx} 
                          variant="outline" 
                          className={`text-[7px] sm:text-[8px] px-1 py-0 ${STAR_GROUP_COLORS[star.group] || ''}`}
                        >
                          {star.name}
                          {star.sihua && <span className={`ml-0.5 ${
                            star.sihua === '禄' ? 'text-emerald-400' :
                            star.sihua === '权' ? 'text-amber-400' :
                            star.sihua === '科' ? 'text-blue-400' :
                            'text-rose-400'
                          }`}>{star.sihua}</span>}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {hasSha && (
                    <span className="text-[8px] text-rose-400 mt-0.5">有煞</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1">
          <span className="text-emerald-400">绿底</span>=化禄权科 · 
          <span className="text-rose-400 ml-1">红底</span>=化忌 · 左右滑动查看更多
        </p>
      </div>

      {/* Twelve Palaces Grid with Stars */}
      <div>
        <h5 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
          十二宫位与星曜
          <span className="flex gap-1 flex-wrap">
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-purple-500/10 text-purple-400 border-purple-500/20">紫微系</Badge>
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20">天府系</Badge>
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">辅星</Badge>
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-rose-500/10 text-rose-400 border-rose-500/20">煞星</Badge>
          </span>
        </h5>
        <ScrollArea className="h-auto max-h-[300px] sm:max-h-[400px]">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
            {mainStarsPalaces.map((palace) => {
              const Icon = PALACE_ICONS[palace.name] || Home;
              const branchInfo = BRANCH_ELEMENTS[palace.branch];
              const isMingOrShen = palace.isMing || palace.isShen;
              
              // Separate major stars and auxiliary/sha stars
              const majorStars = palace.stars.filter(s => s.type === 'major');
              const otherStars = palace.stars.filter(s => s.type !== 'major');
              
              return (
                <div
                  key={palace.name}
                  className={`
                    relative p-1.5 sm:p-2 rounded-lg border text-center transition-all
                    ${palace.isMing 
                      ? 'bg-purple-500/15 border-purple-500/40' 
                      : palace.isShen 
                        ? 'bg-primary/15 border-primary/40' 
                        : 'bg-secondary/30 border-border/50 hover:border-primary/30'}
                  `}
                >
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5">
                    <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isMingOrShen ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-[9px] sm:text-xs ${isMingOrShen ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {palace.name}
                    </span>
                  </div>
                  <span className={`text-sm sm:text-base font-serif ${branchInfo?.color || 'text-foreground'}`}>
                    {palace.branch}
                  </span>
                  
                  {/* Major Stars */}
                  {majorStars.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                      {majorStars.map((star, idx) => (
                        <StarBadge key={idx} star={star} />
                      ))}
                    </div>
                  )}
                  
                  {/* Auxiliary/Sha Stars */}
                  {otherStars.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {otherStars.map((star, idx) => (
                        <StarBadge key={idx} star={star} />
                      ))}
                    </div>
                  )}
                  
                  {/* Badge for Ming/Shen */}
                  {palace.isMing && (
                    <Badge className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[8px] sm:text-[10px] px-1 py-0 bg-purple-500">
                      命
                    </Badge>
                  )}
                  {palace.isShen && (
                    <Badge className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[8px] sm:text-[10px] px-1 py-0 bg-primary">
                      身
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Footer Note */}
      <p className="text-[9px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 text-center">
        含十四主星 · 辅星 · 煞星 · 四化飞星
      </p>

      {/* AI Interpretation Section */}
      <div className="mt-3 pt-3 border-t border-border/30">
        {canUseAI ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInterpret}
              disabled={isLoading}
              className="w-full justify-between text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <span className="flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span className="text-xs sm:text-sm">
                  {isLoading ? '正在解读...' : interpretation ? '紫微命盘解读' : '获取AI命盘解读'}
                </span>
              </span>
              {interpretation && (
                isExpanded ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>

            {error && (
              <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-[10px] sm:text-xs text-destructive">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="mt-3 space-y-2 p-3 bg-purple-500/5 rounded-lg border border-purple-500/10">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-purple-400/70">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  正在分析紫微命盘格局、四化飞星与辅星配置...
                </div>
                <Skeleton className="h-3 w-full bg-purple-500/10" />
                <Skeleton className="h-3 w-5/6 bg-purple-500/10" />
                <Skeleton className="h-3 w-4/5 bg-purple-500/10" />
              </div>
            )}

            {interpretation && isExpanded && (
              <div className="mt-3 p-3 sm:p-4 bg-gradient-to-b from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] sm:text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    紫微命盘解读
                  </Badge>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  {formatInterpretation(interpretation)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center justify-center gap-1 sm:gap-2 py-2">
            <Lock className="w-3 h-3" />
            {isAuthenticated ? '升级会员解锁AI命盘解读' : '登录并升级会员解锁AI解读'}
          </div>
        )}
      </div>
    </div>
  );
}

export default ZiweiDisplay;
