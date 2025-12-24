/**
 * Destiny Dashboard Component (天命总览仪表盘)
 * 
 * A comprehensive tabbed interface showing:
 * - Tab 1: BaZi Profile (八字命盘)
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
import { 
  RotateCcw, Scroll, Sparkles, Heart, Coins, Briefcase, 
  Activity, Baby, Calendar, Zap, Mountain, Flame, Droplet, 
  TreeDeciduous, CircleDot
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
    <div className="flex flex-col items-center p-4 bg-gradient-to-b from-card to-secondary/30 border border-primary/20 rounded-lg">
      <span className="text-xs text-muted-foreground mb-2">{title}</span>
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-serif text-primary">{gan}</span>
        <div className="w-8 h-px bg-primary/30" />
        <span className="text-2xl font-serif text-foreground">{zhi}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{subtitle}</span>
    </div>
  );
}

// Da Yun Timeline Item
function DaYunItem({ cycle, isActive }: { cycle: { startAge: number; endAge: number; ganZhi: string; element: string }; isActive: boolean }) {
  const ElementIcon = ELEMENT_ICONS[cycle.element] || CircleDot;
  const colorClass = ELEMENT_COLORS[cycle.element] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  
  return (
    <div className={`
      flex flex-col items-center p-3 rounded-lg border transition-all
      ${isActive 
        ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' 
        : 'bg-card/50 border-border/50 hover:border-primary/30'}
    `}>
      <span className="text-xs text-muted-foreground">{cycle.startAge}-{cycle.endAge}岁</span>
      <span className="text-lg font-serif text-primary my-1">{cycle.ganZhi}</span>
      <Badge variant="outline" className={`text-xs ${colorClass}`}>
        <ElementIcon className="w-3 h-3 mr-1" />
        {cycle.element}
      </Badge>
    </div>
  );
}

// Flow Year Timeline Item
function FlowYearItem({ 
  flowYear, 
  currentAge 
}: { 
  flowYear: FlowYearClause & { content?: string }; 
  currentAge: number;
}) {
  const isCurrentAge = flowYear.age === currentAge;
  const isPast = flowYear.age < currentAge;
  
  // Check if clause contains age number for highlighting
  const hasAgeMatch = flowYear.content?.includes(`(${flowYear.age})`) || 
                      flowYear.content?.includes(`${flowYear.age}岁`);
  
  return (
    <div className={`
      relative flex gap-4 p-4 rounded-lg border transition-all
      ${isCurrentAge 
        ? 'bg-primary/20 border-primary shadow-lg' 
        : isPast 
          ? 'bg-secondary/20 border-border/30 opacity-70' 
          : 'bg-card/50 border-border/50 hover:border-primary/30'}
    `}>
      {/* Timeline connector */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-border/50 -z-10" />
      
      {/* Age/Year Column */}
      <div className="flex flex-col items-center min-w-[60px]">
        <span className={`text-2xl font-serif ${isCurrentAge ? 'text-primary' : 'text-foreground'}`}>
          {flowYear.age}
        </span>
        <span className="text-xs text-muted-foreground">岁</span>
        <span className="text-xs text-primary/60 mt-1">{flowYear.year}</span>
        <span className="text-xs text-muted-foreground">{flowYear.ganZhi}</span>
      </div>
      
      {/* Content Column */}
      <div className="flex-1">
        {flowYear.content ? (
          <p className={`
            font-serif text-sm leading-relaxed
            ${hasAgeMatch ? 'text-primary' : 'text-foreground/80'}
          `}>
            {flowYear.content}
          </p>
        ) : (
          <Skeleton className="h-4 w-full bg-muted/30" />
        )}
        <span className="text-xs text-muted-foreground mt-2 block">
          条文 #{flowYear.clauseNumber}
        </span>
      </div>
      
      {/* Highlight badge for age match */}
      {hasAgeMatch && (
        <Badge className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs">
          流年应验
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
  onReset,
}: DestinyDashboardProps) {
  const [activeTab, setActiveTab] = useState('bazi');
  const [loadedAspects, setLoadedAspects] = useState<LoadedAspect[]>([]);
  const [loadedFlowYears, setLoadedFlowYears] = useState<Map<number, string>>(new Map());
  const [isLoadingAspects, setIsLoadingAspects] = useState(true);
  const [isLoadingFlowYears, setIsLoadingFlowYears] = useState(false);
  const [flowYearRange, setFlowYearRange] = useState({ start: 20, end: 40 });

  // Calculate current age
  const currentAge = useMemo(() => {
    const now = new Date();
    return now.getFullYear() - birthYear;
  }, [birthYear]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3 pb-4 border-b border-primary/20">
        <div className="relative inline-block">
          <h2 className="text-3xl font-serif text-primary tracking-[0.2em]">
            天命总览
          </h2>
          <div className="absolute -inset-4 bg-primary/5 blur-xl rounded-full -z-10" />
        </div>
        <p className="text-sm text-muted-foreground">
          Grand Destiny Dashboard
        </p>
        <div className="inline-block px-4 py-2 bg-secondary/50 rounded border border-primary/10">
          <span className="text-foreground/80 font-mono tracking-widest text-sm">
            {pillarsDisplay}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
          <TabsTrigger value="bazi" className="font-serif">八字命盘</TabsTrigger>
          <TabsTrigger value="timeline" className="font-serif">铁板流年</TabsTrigger>
          <TabsTrigger value="verdict" className="font-serif">终身总评</TabsTrigger>
        </TabsList>

        {/* Tab 1: BaZi Profile */}
        <TabsContent value="bazi" className="space-y-6 mt-6">
          {/* Four Pillars */}
          <div>
            <h3 className="text-lg font-serif text-primary mb-4 flex items-center gap-2">
              <Scroll className="w-5 h-5" />
              四柱八字
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <PillarCard title="年柱" ganZhi={report.baziProfile.pillars.year} subtitle="Year" />
              <PillarCard title="月柱" ganZhi={report.baziProfile.pillars.month} subtitle="Month" />
              <PillarCard title="日柱" ganZhi={report.baziProfile.pillars.day} subtitle="Day" />
              <PillarCard title="时柱" ganZhi={report.baziProfile.pillars.time} subtitle="Hour" />
            </div>
          </div>

          {/* Day Master Analysis */}
          <div className="bg-card/50 border border-border/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">日主分析</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">日主:</span>
                <span className="text-xl font-serif text-primary">{report.baziProfile.dayMaster}</span>
                <Badge variant="outline" className={ELEMENT_COLORS[report.baziProfile.dayMasterElement]}>
                  {report.baziProfile.dayMasterElement}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">身强弱:</span>
                <Badge variant="secondary">{report.baziProfile.strength}</Badge>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <span className="text-xs text-muted-foreground">喜用神:</span>
                <div className="flex gap-1 mt-1">
                  {report.baziProfile.favorableElements.map(el => (
                    <Badge key={el} variant="outline" className={ELEMENT_COLORS[el]}>
                      {el}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">忌神:</span>
                <div className="flex gap-1 mt-1">
                  {report.baziProfile.unfavorableElements.map(el => (
                    <Badge key={el} variant="outline" className="border-destructive/50 text-destructive">
                      {el}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Da Yun Timeline */}
          <div>
            <h3 className="text-lg font-serif text-primary mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              十年大运
            </h3>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-4">
                {report.lifeCycles.slice(0, 8).map((cycle, index) => (
                  <DaYunItem 
                    key={index} 
                    cycle={cycle} 
                    isActive={index === activeDaYunIndex}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Tab 2: Iron Plate Timeline */}
        <TabsContent value="timeline" className="space-y-4 mt-6">
          {/* Range Selector */}
          <div className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
            <span className="text-sm text-muted-foreground">显示年龄范围</span>
            <div className="flex gap-2">
              {[
                { label: '1-20岁', start: 1, end: 20 },
                { label: '20-40岁', start: 20, end: 40 },
                { label: '40-60岁', start: 40, end: 60 },
                { label: '60-80岁', start: 60, end: 80 },
              ].map(range => (
                <Button
                  key={range.label}
                  variant={flowYearRange.start === range.start ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFlowYearRange({ start: range.start, end: range.end })}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <ScrollArea className="h-[500px] pr-4">
            {isLoadingFlowYears ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-card/50 rounded-lg">
                    <Skeleton className="w-16 h-20" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedFlowYears.map(fy => (
                  <FlowYearItem 
                    key={fy.age} 
                    flowYear={fy} 
                    currentAge={currentAge}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Tab 3: General Verdict */}
        <TabsContent value="verdict" className="space-y-4 mt-6">
          {isLoadingAspects ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card/50 rounded-lg p-5">
                  <Skeleton className="h-6 w-32 mb-3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {loadedAspects.map((aspect) => {
                const Icon = aspect.icon;
                return (
                  <div 
                    key={aspect.key} 
                    className="bg-card/50 border border-border/50 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4 border-b border-border/30">
                      <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${aspect.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif text-primary">{aspect.label}</h3>
                        <span className="text-xs text-muted-foreground">条文 #{aspect.clauseNumber}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-serif text-foreground/90 leading-relaxed">
                        {aspect.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="bg-secondary/30 border border-border/50 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            本结果基于《铁板神数》太玄数学模型推演，仅供参考。
            <br />
            Results based on Tai Xuan mathematical model. For reference only.
          </p>
        </div>

        <Button
          onClick={onReset}
          variant="outline"
          className="w-full py-5 text-lg font-serif tracking-widest border-primary/30 
                     hover:border-primary hover:bg-primary/10 transition-all duration-300 group"
        >
          <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
          重新推算 · Recalculate
        </Button>
      </div>
    </div>
  );
}

export default DestinyDashboard;
