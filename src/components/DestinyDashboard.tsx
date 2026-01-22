/**
 * Destiny Dashboard Component (天命总览仪表盘)
 * 
 * A comprehensive tabbed interface showing:
 * - Tab 1: BaZi Profile (八字命盘) with Ten Gods, Hidden Stems, Na Yin
 * - Tab 2: Iron Plate Timeline (铁板流年)
 * - Tab 3: General Verdict (终身总评)
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchClauseByNumber, fetchClausesByNumbers } from '@/services/SupabaseService';
import { 
  type FullDestinyReport, 
  type FlowYearClause,
  type DestinyProjection,
} from '@/utils/tiebanAlgorithm';
import { AIInterpretation } from '@/components/AIInterpretation';
import { BaZiDetailedDisplay } from '@/components/BaZiDetailedDisplay';
import { LiuYaoDeepAnalysis } from '@/components/LiuYaoDeepAnalysis';
import { ZiweiDisplay } from '@/components/ZiweiDisplay';
import { useAuth } from '@/hooks/useAuth';
import { calculateLiuYaoHexagram } from '@/utils/liuYaoAlgorithm';
import { ZiweiEngine } from '@/utils/ziweiAlgorithm';
import { 
  RotateCcw, Scroll, Sparkles, Heart, Coins, Briefcase, 
  Activity, Baby, Calendar, Zap, Mountain, Flame, Droplet, 
  TreeDeciduous, CircleDot, Lock
} from 'lucide-react';

// ==========================================
// CONSTANTS
// ==========================================

const ELEMENT_ICONS: Record<string, typeof Flame> = {
  '木': TreeDeciduous,
  '火': Flame,
  '土': Mountain,
  '金': CircleDot,
  '水': Droplet,
};

const ELEMENT_COLORS: Record<string, string> = {
  '木': 'text-green-400 bg-green-500/20 border-green-500/30',
  '火': 'text-red-400 bg-red-500/20 border-red-500/30',
  '土': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  '金': 'text-gray-300 bg-gray-500/20 border-gray-500/30',
  '水': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
};

const ASPECT_CONFIG = [
  { key: 'lifeDestiny' as const, label: '命运总论', icon: Sparkles, color: 'text-amber-400' },
  { key: 'marriage' as const, label: '婚姻姻缘', icon: Heart, color: 'text-rose-400' },
  { key: 'wealth' as const, label: '财运财富', icon: Coins, color: 'text-emerald-400' },
  { key: 'career' as const, label: '事业前程', icon: Briefcase, color: 'text-sky-400' },
  { key: 'health' as const, label: '健康寿元', icon: Activity, color: 'text-purple-400' },
  { key: 'children' as const, label: '子嗣后代', icon: Baby, color: 'text-pink-400' },
];

// ==========================================
// INTERFACES
// ==========================================

interface DestinyDashboardProps {
  report: FullDestinyReport;
  pillarsDisplay: string;
  birthYear: number;
  birthData: { year: number; month: number; day: number; hour: number; minute: number; gender: 'male' | 'female' };
  onReset: () => void;
}

interface LoadedAspect {
  key: string;
  label: string;
  icon: typeof Sparkles;
  color: string;
  clauseNumber: number;
  content: string;
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

// Pillar Card (for BaZi display)
function PillarCard({ title, ganZhi, subtitle }: { title: string; ganZhi: string; subtitle: string }) {
  const gan = ganZhi.charAt(0);
  const zhi = ganZhi.charAt(1);
  
  return (
    <div className="flex flex-col items-center p-2 sm:p-4 bg-gradient-to-b from-card to-secondary/30 border border-primary/20 rounded-lg">
      <span className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">{title}</span>
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <span className="text-lg sm:text-2xl font-serif text-primary">{gan}</span>
        <div className="w-6 sm:w-8 h-px bg-primary/30" />
        <span className="text-lg sm:text-2xl font-serif text-foreground">{zhi}</span>
      </div>
      <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">{subtitle}</span>
    </div>
  );
}

// Da Yun Timeline Item
function DaYunItem({ 
  cycle, 
  isActive, 
  isSelected,
  onClick 
}: { 
  cycle: { startAge: number; endAge: number; ganZhi: string; element: string; startYear: number }; 
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const ElementIcon = ELEMENT_ICONS[cycle.element] || CircleDot;
  const colorClass = ELEMENT_COLORS[cycle.element] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center p-2 sm:p-3 rounded-lg border transition-all cursor-pointer min-w-[70px] sm:min-w-[90px]
        ${isSelected
          ? 'bg-primary/30 border-primary ring-2 ring-primary/50 shadow-lg shadow-primary/20'
          : isActive 
            ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
            : 'bg-card/50 border-border/50 hover:border-primary/30 hover:bg-primary/10'}
      `}
    >
      <span className="text-[10px] sm:text-xs text-muted-foreground">{cycle.startAge}-{cycle.endAge}岁</span>
      <span className="text-base sm:text-lg font-serif text-primary my-0.5 sm:my-1">{cycle.ganZhi}</span>
      <Badge variant="outline" className={`text-[10px] sm:text-xs ${colorClass}`}>
        <ElementIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
        {cycle.element}
      </Badge>
      <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{cycle.startYear}年</span>
    </button>
  );
}

// Flow Year Timeline Item with AI
function FlowYearItem({ 
  flowYear, 
  currentAge,
  pillarsDisplay,
  baziProfile,
  canUseAI,
  ziweiProfile,
  hexagram,
}: { 
  flowYear: FlowYearClause & { content?: string }; 
  currentAge: number;
  pillarsDisplay: string;
  baziProfile: any;
  canUseAI: boolean;
  ziweiProfile?: any;
  hexagram?: any;
}) {
  const isCurrentAge = flowYear.age === currentAge;
  const isPast = flowYear.age < currentAge;
  
  // Check if clause contains age number for highlighting
  const hasAgeMatch = flowYear.content?.includes(`(${flowYear.age})`) || 
                      flowYear.content?.includes(`${flowYear.age}岁`);
  
  return (
    <div className={`
      relative flex gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all
      ${isCurrentAge 
        ? 'bg-primary/20 border-primary shadow-lg' 
        : isPast 
          ? 'bg-secondary/20 border-border/30 opacity-70' 
          : 'bg-card/50 border-border/50 hover:border-primary/30'}
    `}>
      {/* Timeline connector */}
      <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-border/50 -z-10" />
      
      {/* Age/Year Column */}
      <div className="flex flex-col items-center min-w-[45px] sm:min-w-[60px]">
        <span className={`text-xl sm:text-2xl font-serif ${isCurrentAge ? 'text-primary' : 'text-foreground'}`}>
          {flowYear.age}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">岁</span>
        <span className="text-[10px] sm:text-xs text-primary/60 mt-0.5 sm:mt-1">{flowYear.year}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{flowYear.ganZhi}</span>
      </div>
      
      {/* Content Column */}
      <div className="flex-1 min-w-0">
        {flowYear.content ? (
          <>
            <p className={`
              font-serif text-xs sm:text-sm leading-relaxed break-words
              ${hasAgeMatch ? 'text-primary' : 'text-foreground/80'}
            `}>
              {flowYear.content}
            </p>
            
            {/* AI Interpretation for flow year */}
            {canUseAI ? (
              <AIInterpretation
                clauseContent={flowYear.content}
                aspectLabel={`${flowYear.year}年 (${flowYear.age}岁) 流年`}
                pillarsDisplay={pillarsDisplay}
                baziProfile={baziProfile}
                isFlowYear={true}
                ziweiProfile={ziweiProfile}
                hexagram={hexagram}
              />
            ) : (
              <div className="mt-2 text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                AI解读需升级会员
              </div>
            )}
          </>
        ) : (
          <Skeleton className="h-4 w-full bg-muted/30" />
        )}
        <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 block">
          条文 #{flowYear.clauseNumber}
        </span>
      </div>
      
      {/* Highlight badge for age match */}
      {hasAgeMatch && (
        <Badge className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-primary/80 text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2">
          应验
        </Badge>
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function DestinyDashboard({
  report,
  pillarsDisplay,
  birthYear,
  birthData,
  onReset,
}: DestinyDashboardProps) {
  const { canUseAI, isAuthenticated, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('bazi');
  const [loadedAspects, setLoadedAspects] = useState<LoadedAspect[]>([]);
  const [loadedFlowYears, setLoadedFlowYears] = useState<Map<number, string>>(new Map());
  const [isLoadingAspects, setIsLoadingAspects] = useState(true);
  const [isLoadingFlowYears, setIsLoadingFlowYears] = useState(false);
  const [flowYearRange, setFlowYearRange] = useState({ start: 20, end: 40 });
  const [selectedDaYunIndex, setSelectedDaYunIndex] = useState<number | null>(null);

  // Calculate hexagram for the session
  const hexagramResult = useMemo(() => {
    return calculateLiuYaoHexagram(new Date());
  }, []);

  // Calculate current age
  const currentAge = useMemo(() => {
    const now = new Date();
    return now.getFullYear() - birthYear;
  }, [birthYear]);

  // Calculate Ziwei profile for AI interpretation
  const ziweiProfile = useMemo(() => {
    const ziweiReport = ZiweiEngine.generateReport({
      year: birthData.year,
      month: birthData.month,
      day: birthData.day,
      hour: birthData.hour,
      gender: birthData.gender,
    });
    
    // Branch element mapping
    const branchElements: Record<string, string> = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
      '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
    };
    
    return {
      mingGong: ziweiReport.mingGong,
      shenGong: ziweiReport.shenGong,
      mingElement: branchElements[ziweiReport.mingGong] || '',
      shenElement: branchElements[ziweiReport.shenGong] || '',
      palaces: ziweiReport.palaces.map((p: any) => ({ name: p.name, branch: p.branch })),
    };
  }, [birthData]);

  // Load destiny aspects on mount
  useEffect(() => {
    const loadAspects = async () => {
      setIsLoadingAspects(true);
      
      const loaded: LoadedAspect[] = await Promise.all(
        ASPECT_CONFIG.map(async (config) => {
          const clauseNumber = report.destinyProjection[config.key];
          const clause = await fetchClauseByNumber(clauseNumber);
          
          return {
            ...config,
            clauseNumber: clause?.clause_number || clauseNumber,
            content: clause?.content || '此数待解，需参照古籍原文释义。',
          };
        })
      );
      
      setLoadedAspects(loaded);
      setIsLoadingAspects(false);
    };
    
    loadAspects();
  }, [report.destinyProjection]);

  // Load flow years when tab is activated or range changes
  useEffect(() => {
    if (activeTab !== 'timeline') return;
    
    const loadFlowYears = async () => {
      setIsLoadingFlowYears(true);
      
      // Get clause numbers for the current range
      const clauseNumbers = report.flowYears
        .filter(fy => fy.age >= flowYearRange.start && fy.age <= flowYearRange.end)
        .map(fy => fy.clauseNumber);
      
      // Fetch all clauses at once
      const clauses = await fetchClausesByNumbers(clauseNumbers);
      
      // Create a map of clause_number -> content
      const contentMap = new Map<number, string>();
      clauses.forEach(clause => {
        contentMap.set(clause.clause_number, clause.content);
      });
      
      setLoadedFlowYears(prev => {
        const newMap = new Map(prev);
        contentMap.forEach((content, num) => newMap.set(num, content));
        return newMap;
      });
      
      setIsLoadingFlowYears(false);
    };
    
    loadFlowYears();
  }, [activeTab, flowYearRange, report.flowYears]);

  // Get flow years with content for current range
  const displayedFlowYears = useMemo(() => {
    return report.flowYears
      .filter(fy => fy.age >= flowYearRange.start && fy.age <= flowYearRange.end)
      .map(fy => ({
        ...fy,
        content: loadedFlowYears.get(fy.clauseNumber),
      }));
  }, [report.flowYears, flowYearRange, loadedFlowYears]);

  // Find active Da Yun cycle
  const activeDaYunIndex = useMemo(() => {
    return report.lifeCycles.findIndex(
      cycle => currentAge >= cycle.startAge && currentAge <= cycle.endAge
    );
  }, [report.lifeCycles, currentAge]);

  // Get selected Da Yun for AI
  const selectedDaYun = selectedDaYunIndex !== null ? report.lifeCycles[selectedDaYunIndex] : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-primary/20">
        <div className="relative inline-block">
          <h2 className="text-2xl sm:text-3xl font-serif text-primary tracking-[0.15em] sm:tracking-[0.2em]">
            天命总览
          </h2>
          <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full -z-10" />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Grand Destiny Dashboard
        </p>
        <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary/50 rounded border border-primary/10">
          <span className="text-foreground/80 font-mono tracking-wider sm:tracking-widest text-xs sm:text-sm">
            {pillarsDisplay}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50 h-auto">
          <TabsTrigger value="bazi" className="font-serif text-xs sm:text-sm py-2 sm:py-2.5">八字命盘</TabsTrigger>
          <TabsTrigger value="timeline" className="font-serif text-xs sm:text-sm py-2 sm:py-2.5">铁板流年</TabsTrigger>
          <TabsTrigger value="verdict" className="font-serif text-xs sm:text-sm py-2 sm:py-2.5">终身总评</TabsTrigger>
        </TabsList>

        {/* Tab 1: BaZi Profile */}
        <TabsContent value="bazi" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Four Pillars */}
          <div>
            <h3 className="text-base sm:text-lg font-serif text-primary mb-3 sm:mb-4 flex items-center gap-2">
              <Scroll className="w-4 h-4 sm:w-5 sm:h-5" />
              四柱八字
            </h3>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              <PillarCard title="年柱" ganZhi={report.baziProfile.pillars.year} subtitle="Year" />
              <PillarCard title="月柱" ganZhi={report.baziProfile.pillars.month} subtitle="Month" />
              <PillarCard title="日柱" ganZhi={report.baziProfile.pillars.day} subtitle="Day" />
              <PillarCard title="时柱" ganZhi={report.baziProfile.pillars.time} subtitle="Hour" />
            </div>
          </div>

          {/* Deep BaZi Analysis */}
          <BaZiDetailedDisplay
            year={birthData.year}
            month={birthData.month}
            day={birthData.day}
            hour={birthData.hour}
            minute={birthData.minute}
            gender={birthData.gender}
          />

          {/* Ziwei Doushu Display */}
          <ZiweiDisplay
            year={birthData.year}
            month={birthData.month}
            day={birthData.day}
            hour={birthData.hour}
            gender={birthData.gender}
          />

          {/* Liu Yao Deep Analysis */}
          <LiuYaoDeepAnalysis calculationTime={new Date()} />

          {/* Da Yun Timeline */}
          <div>
            <h3 className="text-base sm:text-lg font-serif text-primary mb-3 sm:mb-4 flex flex-wrap items-center gap-1 sm:gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              十年大运
              <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">(点击查看详情，左右滑动查看更多)</span>
            </h3>
            <div className="overflow-x-auto pb-2 -mx-2 px-2">
              <div className="flex gap-1.5 sm:gap-3 pb-3 sm:pb-4 min-w-max touch-pan-x">
                {report.lifeCycles.slice(0, 8).map((cycle, index) => (
                  <DaYunItem 
                    key={index} 
                    cycle={cycle} 
                    isActive={index === activeDaYunIndex}
                    isSelected={index === selectedDaYunIndex}
                    onClick={() => setSelectedDaYunIndex(selectedDaYunIndex === index ? null : index)}
                  />
                ))}
              </div>
            </div>
            
            {/* Selected Da Yun Details with AI */}
            {selectedDaYunIndex !== null && selectedDaYun && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-primary/10 border border-primary/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3">
                  <h4 className="font-serif text-primary text-base sm:text-lg">
                    第{selectedDaYunIndex + 1}步大运 · {selectedDaYun.ganZhi}
                  </h4>
                  <Badge variant="outline" className={ELEMENT_COLORS[selectedDaYun.element]}>
                    {selectedDaYun.element}运
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">起运年龄:</span>
                    <span className="ml-1 sm:ml-2 text-foreground">{selectedDaYun.startAge}岁</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">结束年龄:</span>
                    <span className="ml-1 sm:ml-2 text-foreground">{selectedDaYun.endAge}岁</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">起运年份:</span>
                    <span className="ml-1 sm:ml-2 text-foreground">{selectedDaYun.startYear}年</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">运势五行:</span>
                    <span className="ml-1 sm:ml-2 text-foreground">{selectedDaYun.element}</span>
                  </div>
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                  此运{selectedDaYun.element}气当令，
                  {report.baziProfile.favorableElements.includes(selectedDaYun.element) 
                    ? '与命局喜用相合，运势较佳。' 
                    : report.baziProfile.unfavorableElements.includes(selectedDaYun.element)
                      ? '与命局忌神相冲，宜谨慎行事。'
                      : '运势平稳，顺其自然。'}
                </p>
                
                {/* AI Interpretation for Da Yun */}
                {canUseAI ? (
                  <AIInterpretation
                    clauseContent={`${selectedDaYun.ganZhi}大运，${selectedDaYun.startAge}-${selectedDaYun.endAge}岁，${selectedDaYun.element}气当令。${report.baziProfile.favorableElements.includes(selectedDaYun.element) ? '喜用神得力。' : report.baziProfile.unfavorableElements.includes(selectedDaYun.element) ? '忌神临运。' : ''}`}
                    aspectLabel={`第${selectedDaYunIndex + 1}步大运 (${selectedDaYun.startAge}-${selectedDaYun.endAge}岁)`}
                    pillarsDisplay={pillarsDisplay}
                    baziProfile={report.baziProfile}
                    hexagram={hexagramResult}
                    ziweiProfile={ziweiProfile}
                  />
                ) : (
                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30 text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {isAuthenticated ? '升级会员解锁AI解读' : '登录并升级会员解锁AI解读'}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Iron Plate Timeline */}
        <TabsContent value="timeline" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {/* Range Selector */}
          <div className="flex flex-col gap-3 bg-secondary/30 rounded-lg p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">年龄范围</span>
              <div className="grid grid-cols-4 gap-1 sm:flex sm:gap-2">
                {[
                  { label: '1-20', mobileLabel: '1-20岁', start: 1, end: 20 },
                  { label: '20-40', mobileLabel: '20-40岁', start: 20, end: 40 },
                  { label: '40-60', mobileLabel: '40-60岁', start: 40, end: 60 },
                  { label: '60-80', mobileLabel: '60-80岁', start: 60, end: 80 },
                ].map(range => (
                  <Button
                    key={range.label}
                    variant={flowYearRange.start === range.start ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFlowYearRange({ start: range.start, end: range.end })}
                    className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-8"
                  >
                    <span className="sm:hidden">{range.label}</span>
                    <span className="hidden sm:inline">{range.mobileLabel}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Specific Year Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-border/30">
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">指定流年</span>
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={flowYearRange.start === flowYearRange.end ? flowYearRange.start : ''}
                  onChange={(e) => {
                    const age = parseInt(e.target.value);
                    if (!isNaN(age)) {
                      setFlowYearRange({ start: age, end: age });
                    }
                  }}
                  className="flex-1 h-8 px-2 text-xs sm:text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">选择年龄...</option>
                  {Array.from({ length: 80 }, (_, i) => i + 1).map(age => (
                    <option key={age} value={age}>{age}岁 ({birthYear + age}年)</option>
                  ))}
                </select>
                {flowYearRange.start === flowYearRange.end && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFlowYearRange({ start: 20, end: 40 })}
                    className="text-[10px] sm:text-xs px-2 h-7"
                  >
                    清除
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <ScrollArea className="h-[400px] sm:h-[500px] pr-2 sm:pr-4">
            {isLoadingFlowYears ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-2 sm:gap-4 p-3 sm:p-4 bg-card/50 rounded-lg">
                    <Skeleton className="w-12 sm:w-16 h-16 sm:h-20" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {displayedFlowYears.map(fy => (
                  <FlowYearItem 
                    key={fy.age} 
                    flowYear={fy} 
                    currentAge={currentAge}
                    pillarsDisplay={pillarsDisplay}
                    baziProfile={report.baziProfile}
                    canUseAI={canUseAI}
                    ziweiProfile={ziweiProfile}
                    hexagram={hexagramResult}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab 3: General Verdict */}
        <TabsContent value="verdict" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
          {/* Overall AI Summary */}
          {canUseAI && loadedAspects.length > 0 && (
            <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-serif text-primary mb-2 sm:mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                命运总览 · AI深度解读
              </h3>
              <AIInterpretation
                clauseContent={loadedAspects.map(a => `【${a.label}】${a.content}`).join('\n')}
                aspectLabel="终身总评全览"
                pillarsDisplay={pillarsDisplay}
                baziProfile={report.baziProfile}
                hexagram={hexagramResult}
                ziweiProfile={ziweiProfile}
                allAspects={loadedAspects.map(a => ({ label: a.label, content: a.content }))}
              />
            </div>
          )}

          {isLoadingAspects ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card/50 rounded-lg p-4 sm:p-5">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mb-2 sm:mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {loadedAspects.map((aspect) => {
                const Icon = aspect.icon;
                return (
                  <div 
                    key={aspect.key} 
                    className="bg-card/50 border border-border/50 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-border/30">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center ${aspect.color}`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-serif text-primary truncate">{aspect.label}</h3>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">条文 #{aspect.clauseNumber}</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <p className="font-serif text-foreground/90 leading-relaxed text-xs sm:text-sm">
                        {aspect.content}
                      </p>
                      {canUseAI ? (
                        <AIInterpretation
                          clauseContent={aspect.content}
                          aspectLabel={aspect.label}
                          pillarsDisplay={pillarsDisplay}
                          baziProfile={report.baziProfile}
                          hexagram={hexagramResult}
                          ziweiProfile={ziweiProfile}
                          allAspects={loadedAspects.map(a => ({ label: a.label, content: a.content }))}
                        />
                      ) : (
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30 text-xs sm:text-sm text-muted-foreground flex items-center gap-1 sm:gap-2">
                          <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {isAuthenticated ? '升级会员解锁AI解读' : '登录并升级会员解锁AI解读'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-border/50">
        <div className="bg-secondary/30 border border-border/50 rounded-lg p-3 sm:p-4 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
            本结果基于《铁板神数》太玄数学模型推演，结合八字命理与六爻卦象，仅供参考。
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Results based on Tai Xuan model. For reference only.
          </p>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full py-4 sm:py-5 text-base sm:text-lg font-serif tracking-wider sm:tracking-widest border-primary/30 
                     hover:border-primary hover:bg-primary/10 transition-all duration-300 group"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 group-hover:rotate-180 transition-transform duration-500" />
          重新推算
        </Button>
      </div>
    </div>
  );
}

export default DestinyDashboard;
