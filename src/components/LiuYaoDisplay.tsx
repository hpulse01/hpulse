/**
 * Liu Yao Hexagram Display Component
 * Shows the hexagram generated at calculation time
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { calculateLiuYaoHexagram, type LiuYaoResult } from '@/utils/liuYaoAlgorithm';

interface LiuYaoDisplayProps {
  calculationTime?: Date;
}

export function LiuYaoDisplay({ calculationTime }: LiuYaoDisplayProps) {
  const hexagramResult = useMemo(() => {
    return calculateLiuYaoHexagram(calculationTime || new Date());
  }, [calculationTime]);

  const { mainHexagram, interpretation, timeGanZhi } = hexagramResult;

  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-4 mt-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        🔮 时间卦象
        <Badge variant="outline" className="text-xs">测算时起卦</Badge>
      </h4>
      
      <div className="flex gap-6">
        {/* Hexagram Symbol */}
        <div className="text-center">
          <div className="text-5xl mb-2">{mainHexagram.symbol}</div>
          <div className="text-lg font-serif text-primary">{mainHexagram.name}</div>
          <div className="text-xs text-muted-foreground mt-1">起卦时辰: {timeGanZhi}</div>
        </div>
        
        {/* Lines Display */}
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-1 mb-3">
            {[...mainHexagram.lines].reverse().map((line, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className={`font-mono ${line.isChanging ? 'text-primary' : 'text-foreground/70'}`}>
                  {line.yinYang === 'yang' ? '▅▅▅▅▅' : '▅▅ ▅▅'}
                  {line.isChanging && ' ○'}
                </span>
                <span className="text-muted-foreground">
                  {line.branch}{line.relative}({line.element})
                </span>
              </div>
            ))}
          </div>
          
          {mainHexagram.targetHexagram && (
            <div className="text-xs text-primary/80">
              变卦 → {mainHexagram.targetHexagram.name}
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">
        {interpretation}
      </p>
    </div>
  );
}

export default LiuYaoDisplay;
