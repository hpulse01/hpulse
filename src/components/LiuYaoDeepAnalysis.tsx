/**
 * Liu Yao Deep Analysis Component
 * Provides comprehensive hexagram interpretation
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { calculateLiuYaoHexagram, type LiuYaoResult, type HexagramLine } from '@/utils/liuYaoAlgorithm';
import { 
  Flame, Droplet, Mountain, CircleDot, TreeDeciduous,
  ArrowRight, Zap, Target, TrendingUp, Shield
} from 'lucide-react';

interface LiuYaoDeepAnalysisProps {
  calculationTime?: Date;
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

const RELATIVE_MEANINGS: Record<string, { meaning: string; aspect: string }> = {
  '父母': { meaning: '文书、证件、房屋、长辈', aspect: '学业、文书运' },
  '兄弟': { meaning: '朋友、竞争、合作', aspect: '人际、竞争' },
  '子孙': { meaning: '福德、享受、下属', aspect: '福气、子女' },
  '妻财': { meaning: '财富、妻子、收入', aspect: '财运、感情' },
  '官鬼': { meaning: '官职、鬼神、疾病', aspect: '事业、健康' },
};

// Line Display Component
function LineDisplay({ line, index }: { line: HexagramLine; index: number }) {
  const ElementIcon = ELEMENT_ICONS[line.element] || CircleDot;
  const positionNames = ['初', '二', '三', '四', '五', '上'];
  
  return (
    <div className={`
      flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-2 rounded-lg transition-all
      ${line.isChanging ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/20'}
    `}>
      <span className="text-[10px] sm:text-xs text-muted-foreground w-6 sm:w-10">{positionNames[index]}爻</span>
      
      {/* Line symbol */}
      <div className={`font-mono text-sm sm:text-lg ${line.isChanging ? 'text-primary' : 'text-foreground/70'}`}>
        {line.yinYang === 'yang' ? '▅▅▅' : '▅ ▅'}
        {line.isChanging && <span className="ml-0.5 sm:ml-1 text-primary">○</span>}
      </div>
      
      {/* Branch and relative */}
      <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
        <Badge variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-1.5">
          {line.branch}
        </Badge>
        <Badge 
          variant="outline" 
          className={`text-[10px] sm:text-xs px-1 sm:px-1.5 ${ELEMENT_COLORS[line.element]}`}
        >
          <ElementIcon className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5" />
          {line.element}
        </Badge>
        <span className="text-xs sm:text-sm text-foreground truncate">{line.relative}</span>
      </div>
      
      {/* Changing indicator */}
      {line.isChanging && (
        <Badge className="bg-primary/80 text-primary-foreground text-[10px] sm:text-xs px-1 sm:px-1.5">
          动
        </Badge>
      )}
    </div>
  );
}

// Six Relatives Analysis
function SixRelativesAnalysis({ lines }: { lines: HexagramLine[] }) {
  const relativeCounts: Record<string, number> = {};
  const movingRelatives: string[] = [];
  
  lines.forEach(line => {
    relativeCounts[line.relative] = (relativeCounts[line.relative] || 0) + 1;
    if (line.isChanging) movingRelatives.push(line.relative);
  });
  
  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-3 sm:p-4">
      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
        <Target className="w-3 h-3 sm:w-4 sm:h-4" />
        六亲分布
      </h4>
      
      <div className="grid grid-cols-5 gap-1 sm:gap-2">
        {Object.entries(RELATIVE_MEANINGS).map(([relative, info]) => {
          const count = relativeCounts[relative] || 0;
          const isMoving = movingRelatives.includes(relative);
          
          return (
            <div 
              key={relative}
              className={`text-center p-1.5 sm:p-2 rounded-lg ${isMoving ? 'bg-primary/20 border border-primary/30' : 'bg-secondary/30'}`}
            >
              <span className={`text-sm sm:text-lg font-serif ${isMoving ? 'text-primary' : 'text-foreground'}`}>
                {relative}
              </span>
              <Badge variant="outline" className={`mt-0.5 block mx-auto w-fit text-[9px] sm:text-xs ${count > 1 ? 'border-primary text-primary' : ''}`}>
                {count}
              </Badge>
              {isMoving && (
                <span className="text-[10px] sm:text-xs text-primary block mt-0.5">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline" />
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {movingRelatives.length > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            动爻：{movingRelatives.map(r => `${r}(${RELATIVE_MEANINGS[r].aspect})`).join('、')}
          </p>
        </div>
      )}
    </div>
  );
}

// Hexagram Interpretation
function HexagramInterpretation({ hexagram, hasChanging }: { hexagram: LiuYaoResult['mainHexagram']; hasChanging: boolean }) {
  return (
    <div className="bg-gradient-to-b from-primary/10 to-transparent border border-primary/30 rounded-lg p-4">
      <h4 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        卦象总断
      </h4>
      
      <div className="flex gap-6 mb-4">
        {/* Main Hexagram */}
        <div className="text-center">
          <span className="text-xs text-muted-foreground block mb-1">本卦</span>
          <div className="text-5xl mb-2">{hexagram.symbol}</div>
          <span className="text-lg font-serif text-primary">{hexagram.name}</span>
        </div>
        
        {/* Changed Hexagram */}
        {hexagram.targetHexagram && (
          <>
            <div className="flex items-center">
              <ArrowRight className="w-6 h-6 text-primary/50" />
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground block mb-1">变卦</span>
              <div className="text-5xl mb-2">{hexagram.targetHexagram.symbol}</div>
              <span className="text-lg font-serif text-primary">{hexagram.targetHexagram.name}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <p className="text-foreground">{hexagram.description}</p>
        {hexagram.targetHexagram && (
          <p className="text-muted-foreground">
            变卦{hexagram.targetHexagram.name}：{hexagram.targetHexagram.description}
          </p>
        )}
        
        <div className="pt-3 mt-3 border-t border-border/30">
          <p className="text-muted-foreground">
            <Shield className="w-4 h-4 inline mr-1" />
            {hasChanging 
              ? '卦有动爻，事情有变化发展，需关注动爻所代表的六亲方面。'
              : '六爻皆静，事情稳定，按现状发展。'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export function LiuYaoDeepAnalysis({ calculationTime }: LiuYaoDeepAnalysisProps) {
  const hexagramResult = useMemo(() => {
    return calculateLiuYaoHexagram(calculationTime || new Date());
  }, [calculationTime]);

  const { mainHexagram, hasChanging, timeGanZhi } = hexagramResult;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card/50 border border-border/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            🔮 时间卦详解
          </h4>
          <Badge variant="outline" className="text-xs">
            起卦时辰: {timeGanZhi}
          </Badge>
        </div>
        
        {/* Lines Display */}
        <div className="space-y-1">
          {[...mainHexagram.lines].reverse().map((line, idx) => (
            <LineDisplay 
              key={idx} 
              line={line} 
              index={5 - idx} 
            />
          ))}
        </div>
      </div>
      
      {/* Six Relatives */}
      <SixRelativesAnalysis lines={mainHexagram.lines} />
      
      {/* Interpretation */}
      <HexagramInterpretation hexagram={mainHexagram} hasChanging={hasChanging} />
    </div>
  );
}

export default LiuYaoDeepAnalysis;
