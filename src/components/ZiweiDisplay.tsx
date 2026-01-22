/**
 * Ziwei Doushu Display Component
 * Compact display of Purple Star Astrology palace positions
 * Integrated into the BaZi Profile tab
 */

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ZiweiEngine, type ZiweiReport } from '@/utils/ziweiAlgorithm';
import { Star, Home, Users, Heart, Baby, Coins, Activity, Plane, UserCheck, Briefcase, Building, Smile, UserPlus } from 'lucide-react';

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

// Branch colors
const BRANCH_COLORS: Record<string, string> = {
  '子': 'text-blue-400',
  '丑': 'text-yellow-400',
  '寅': 'text-green-400',
  '卯': 'text-green-300',
  '辰': 'text-yellow-300',
  '巳': 'text-red-400',
  '午': 'text-red-300',
  '未': 'text-yellow-400',
  '申': 'text-gray-300',
  '酉': 'text-gray-400',
  '戌': 'text-yellow-500',
  '亥': 'text-blue-300',
};

export function ZiweiDisplay({ year, month, day, hour, gender }: ZiweiDisplayProps) {
  const report = useMemo(() => {
    return ZiweiEngine.generateReport({ year, month, day, hour, gender });
  }, [year, month, day, hour, gender]);

  return (
    <div className="bg-card/50 border border-border/50 rounded-lg p-3 sm:p-4">
      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
        紫微斗数命盘
      </h4>
      
      {/* Ming Gong & Shen Gong Summary */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
          <span className="text-[10px] sm:text-xs text-muted-foreground block mb-0.5 sm:mb-1">命宫</span>
          <span className={`text-xl sm:text-2xl font-serif ${BRANCH_COLORS[report.mingGong] || 'text-primary'}`}>
            {report.mingGong}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5 sm:mt-1">宫</span>
        </div>
        <div className="p-2 sm:p-3 bg-accent/10 border border-accent/30 rounded-lg text-center">
          <span className="text-[10px] sm:text-xs text-muted-foreground block mb-0.5 sm:mb-1">身宫</span>
          <span className={`text-xl sm:text-2xl font-serif ${BRANCH_COLORS[report.shenGong] || 'text-accent'}`}>
            {report.shenGong}
          </span>
          <span className="text-[10px] sm:text-xs text-muted-foreground block mt-0.5 sm:mt-1">宫</span>
        </div>
      </div>

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
      </div>

      {/* Twelve Palaces Grid */}
      <div>
        <h5 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2">十二宫位</h5>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {report.palaces.map((palace) => {
            const Icon = PALACE_ICONS[palace.name] || Home;
            const isMingOrShen = palace.isMing || palace.isShen;
            
            return (
              <div
                key={palace.name}
                className={`
                  relative p-1.5 sm:p-2 rounded-lg border text-center transition-all
                  ${palace.isMing 
                    ? 'bg-purple-500/20 border-purple-500/50' 
                    : palace.isShen 
                      ? 'bg-accent/20 border-accent/50' 
                      : 'bg-secondary/30 border-border/50'}
                `}
              >
                <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isMingOrShen ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-[9px] sm:text-xs ${isMingOrShen ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {palace.name}
                  </span>
                </div>
                <span className={`text-sm sm:text-base font-serif ${BRANCH_COLORS[palace.branch] || 'text-foreground'}`}>
                  {palace.branch}
                </span>
                
                {/* Badge for Ming/Shen */}
                {palace.isMing && (
                  <Badge className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[8px] sm:text-[10px] px-1 py-0 bg-purple-500 text-white">
                    命
                  </Badge>
                )}
                {palace.isShen && (
                  <Badge className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 text-[8px] sm:text-[10px] px-1 py-0 bg-accent text-accent-foreground">
                    身
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-[9px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 text-center">
        基础宫位排布 · 不含主星与四化
      </p>
    </div>
  );
}

export default ZiweiDisplay;
