/**
 * BaZi Detailed Display Component
 * Shows complete Ten Gods, Hidden Stems, Na Yin, and Five Element analysis
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  performDeepBaZiAnalysis, 
  type DeepBaZiAnalysis,
  type TenGod,
  type HiddenStemInfo,
  type NaYinInfo,
  type ElementBalance 
} from '@/utils/baziDeepAnalysis';
import { 
  Flame, Droplet, Mountain, CircleDot, TreeDeciduous,
  Info, Star, Layers, Music, Scale
} from 'lucide-react';

interface BaZiDetailedDisplayProps {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  gender?: 'male' | 'female';
}

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

const TEN_GOD_COLORS: Record<string, string> = {
  '比肩': 'text-green-400',
  '劫财': 'text-green-300',
  '食神': 'text-orange-400',
  '伤官': 'text-orange-300',
  '偏财': 'text-yellow-400',
  '正财': 'text-yellow-300',
  '七杀': 'text-red-400',
  '正官': 'text-red-300',
  '偏印': 'text-blue-400',
  '正印': 'text-blue-300',
  '日元': 'text-primary',
};

// Ten Gods Section
function TenGodsSection({ tenGods }: { tenGods: TenGod[] }) {
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Star className="w-4 h-4" />
        十神配置
      </h4>
      <div className="grid grid-cols-4 gap-3">
        {tenGods.map((god) => (
          <div key={god.position} className="text-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-xs text-muted-foreground block mb-1">{god.position}</span>
            <span className="text-lg font-serif text-primary">{god.stem}</span>
            <Badge 
              variant="outline" 
              className={`mt-1 text-xs ${ELEMENT_COLORS[god.element]} block mx-auto w-fit`}
            >
              {god.element}
            </Badge>
            <span className={`text-sm font-medium mt-1 block ${TEN_GOD_COLORS[god.tenGod] || 'text-foreground'}`}>
              {god.tenGod}
            </span>
            <span className="text-xs text-muted-foreground">{god.yinYang}</span>
          </div>
        ))}
      </div>
      
      {/* Ten Gods Legend */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground mb-2">十神说明：</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {[
            { god: '比肩劫财', meaning: '同我者为比劫，主朋友兄弟' },
            { god: '食神伤官', meaning: '我生者为食伤，主才华表达' },
            { god: '正财偏财', meaning: '我克者为财，主财运收入' },
            { god: '正官七杀', meaning: '克我者为官杀，主事业权力' },
            { god: '正印偏印', meaning: '生我者为印，主学识贵人' },
          ].map((item) => (
            <div key={item.god} className="text-center p-2 bg-secondary/20 rounded">
              <span className="text-primary font-medium block">{item.god}</span>
              <span className="text-muted-foreground">{item.meaning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hidden Stems Section
function HiddenStemsSection({ hiddenStems }: { hiddenStems: HiddenStemInfo[] }) {
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4" />
        地支藏干
      </h4>
      <div className="grid grid-cols-4 gap-3">
        {hiddenStems.map((hs) => (
          <div key={hs.position} className="text-center p-3 bg-secondary/30 rounded-lg">
            <span className="text-xs text-muted-foreground block mb-1">{hs.position}</span>
            <span className="text-lg font-serif text-primary mb-2 block">{hs.branch}</span>
            <div className="flex flex-wrap justify-center gap-1">
              {hs.hiddenStems.map((h, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs px-1.5 py-0.5 rounded ${h.isMain ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}
                >
                  <span className="font-medium">{h.stem}</span>
                  <span className="mx-0.5">·</span>
                  <span className={TEN_GOD_COLORS[h.tenGod] || ''}>{h.tenGod}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        主气为强，余气为弱。藏干透出天干者力量更强。
      </p>
    </div>
  );
}

// Na Yin Section  
function NaYinSection({ naYinAnalysis }: { naYinAnalysis: NaYinInfo[] }) {
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Music className="w-4 h-4" />
        纳音五行
      </h4>
      <div className="grid grid-cols-4 gap-3">
        {naYinAnalysis.map((nayin) => {
          const ElementIcon = ELEMENT_ICONS[nayin.element] || CircleDot;
          return (
            <div key={nayin.pillar} className="text-center p-3 bg-secondary/30 rounded-lg">
              <span className="text-xs text-muted-foreground block mb-1">{nayin.pillar}</span>
              <span className="text-lg font-serif text-primary">{nayin.ganZhi}</span>
              <div className="mt-2 flex items-center justify-center gap-1">
                <ElementIcon className={`w-3 h-3 ${ELEMENT_COLORS[nayin.element]?.split(' ')[0]}`} />
                <span className="text-sm text-foreground">{nayin.naYin}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        纳音五行反映命格之气象格局，年柱纳音尤为重要。
      </p>
    </div>
  );
}

// Five Elements Balance
function ElementBalanceSection({ 
  elementBalance, 
  favorable, 
  unfavorable 
}: { 
  elementBalance: ElementBalance[];
  favorable: { elements: string[]; gods: string[]; description: string };
  unfavorable: { elements: string[]; gods: string[]; description: string };
}) {
  const maxCount = Math.max(...elementBalance.map(e => e.count));
  
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4" />
        五行平衡
      </h4>
      
      {/* Balance Bars */}
      <div className="space-y-2 mb-4">
        {elementBalance.map((el) => {
          const ElementIcon = ELEMENT_ICONS[el.element] || CircleDot;
          const colorClass = ELEMENT_COLORS[el.element] || '';
          const barWidth = (el.count / maxCount) * 100;
          
          return (
            <div key={el.element} className="flex items-center gap-3">
              <div className={`w-10 flex items-center justify-center ${colorClass.split(' ')[0]}`}>
                <ElementIcon className="w-4 h-4" />
                <span className="ml-1 text-sm">{el.element}</span>
              </div>
              <div className="flex-1 h-4 bg-secondary/30 rounded overflow-hidden">
                <div 
                  className={`h-full ${colorClass.split(' ')[1]} transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="w-20 text-right">
                <span className="text-sm text-foreground">{el.percentage}%</span>
                <Badge 
                  variant="outline" 
                  className={`ml-1 text-xs ${
                    el.status === '旺' || el.status === '相' 
                      ? 'border-primary/50 text-primary' 
                      : el.status === '死' 
                        ? 'border-destructive/50 text-destructive'
                        : ''
                  }`}
                >
                  {el.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Favorable & Unfavorable */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/30">
        <div>
          <span className="text-xs text-muted-foreground block mb-2">喜用神</span>
          <div className="flex flex-wrap gap-1 mb-2">
            {favorable.elements.map(el => (
              <Badge key={el} variant="outline" className={`text-xs ${ELEMENT_COLORS[el]}`}>
                {el}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {favorable.gods.map(god => (
              <Badge 
                key={god} 
                variant="outline" 
                className={`text-xs ${TEN_GOD_COLORS[god] || ''} border-current bg-transparent`}
              >
                {god}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{favorable.description}</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-2">忌神</span>
          <div className="flex flex-wrap gap-1 mb-2">
            {unfavorable.elements.map(el => (
              <Badge key={el} variant="outline" className="text-xs border-destructive/50 text-destructive">
                {el}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {unfavorable.gods.map(god => (
              <Badge 
                key={god} 
                variant="outline" 
                className="text-xs border-destructive/50 text-destructive bg-transparent"
              >
                {god}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{unfavorable.description}</p>
        </div>
      </div>
    </div>
  );
}

// Pattern Section
function PatternSection({ 
  pattern, 
  dayMaster,
  summary 
}: { 
  pattern: { name: string; type: string; description: string };
  dayMaster: { stem: string; element: string; yinYang: string; strengthLevel: string; description: string };
  summary: string;
}) {
  return (
    <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/30 rounded-lg p-4">
      <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
        <Info className="w-4 h-4" />
        格局分析
      </h4>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-secondary/30 rounded-lg">
          <span className="text-xs text-muted-foreground block mb-1">日主</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif text-primary">{dayMaster.stem}</span>
            <div>
              <Badge variant="outline" className={ELEMENT_COLORS[dayMaster.element]}>
                {dayMaster.element}
              </Badge>
              <span className="text-xs text-muted-foreground ml-1">{dayMaster.yinYang}</span>
            </div>
          </div>
          <span className="text-sm text-foreground block mt-1">{dayMaster.strengthLevel}</span>
        </div>
        
        <div className="p-3 bg-secondary/30 rounded-lg">
          <span className="text-xs text-muted-foreground block mb-1">命格</span>
          <span className="text-lg font-serif text-primary block">{pattern.name}</span>
          <Badge variant="outline" className="mt-1">{pattern.type}</Badge>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{dayMaster.description}</p>
        <p className="text-muted-foreground">{pattern.description}</p>
        <p className="text-foreground pt-2 border-t border-border/30">{summary}</p>
      </div>
    </div>
  );
}

export function BaZiDetailedDisplay({
  year,
  month,
  day,
  hour,
  minute = 0,
  gender = 'male',
}: BaZiDetailedDisplayProps) {
  const analysis = useMemo(() => {
    return performDeepBaZiAnalysis(year, month, day, hour, minute, gender);
  }, [year, month, day, hour, minute, gender]);

  return (
    <div className="space-y-4">
      <TenGodsSection tenGods={analysis.tenGods} />
      <HiddenStemsSection hiddenStems={analysis.hiddenStems} />
      <NaYinSection naYinAnalysis={analysis.naYinAnalysis} />
      <ElementBalanceSection 
        elementBalance={analysis.elementBalance}
        favorable={analysis.favorable}
        unfavorable={analysis.unfavorable}
      />
      <PatternSection 
        pattern={analysis.pattern}
        dayMaster={analysis.dayMaster}
        summary={analysis.summary}
      />
    </div>
  );
}

export default BaZiDetailedDisplay;
