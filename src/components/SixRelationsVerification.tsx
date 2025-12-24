/**
 * Six Relations Verification Component (六亲考刻)
 * 
 * Collects family data (parents' zodiacs, status, siblings) to calibrate
 * the exact birth quarter through the Iron Plate algorithm.
 * 
 * Theme: "Digital Temple" - Solemn, Dark, Gold accents, Serif typography
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TiebanEngine, 
  type SixRelationsInput, 
  type KaoKeWithMatch 
} from '@/utils/tiebanAlgorithm';
import { fetchClauseByNumber } from '@/services/SupabaseService';
import { Sparkles, Users, Minus, Plus, Crown } from 'lucide-react';

// ==========================================
// CONSTANTS
// ==========================================

const ZODIAC_OPTIONS = [
  { value: 0, emoji: '🐭', branch: '子', name: '鼠', english: 'Rat' },
  { value: 1, emoji: '🐮', branch: '丑', name: '牛', english: 'Ox' },
  { value: 2, emoji: '🐯', branch: '寅', name: '虎', english: 'Tiger' },
  { value: 3, emoji: '🐰', branch: '卯', name: '兔', english: 'Rabbit' },
  { value: 4, emoji: '🐲', branch: '辰', name: '龙', english: 'Dragon' },
  { value: 5, emoji: '🐍', branch: '巳', name: '蛇', english: 'Snake' },
  { value: 6, emoji: '🐴', branch: '午', name: '马', english: 'Horse' },
  { value: 7, emoji: '🐑', branch: '未', name: '羊', english: 'Goat' },
  { value: 8, emoji: '🐵', branch: '申', name: '猴', english: 'Monkey' },
  { value: 9, emoji: '🐔', branch: '酉', name: '鸡', english: 'Rooster' },
  { value: 10, emoji: '🐕', branch: '戌', name: '狗', english: 'Dog' },
  { value: 11, emoji: '🐷', branch: '亥', name: '猪', english: 'Pig' },
];

const PARENTS_STATUS_OPTIONS = [
  { value: 'both_alive', label: '乾坤并在', description: 'Both Alive', icon: '☯️' },
  { value: 'father_deceased', label: '乾宫先损', description: 'Father Passed', icon: '☰' },
  { value: 'mother_deceased', label: '坤宫先损', description: 'Mother Passed', icon: '☷' },
  { value: 'both_deceased', label: '双亲已故', description: 'Both Passed', icon: '⚊' },
] as const;

// ==========================================
// INTERFACES
// ==========================================

interface SixRelationsVerificationProps {
  baseNumber: number;
  ganZhiDisplay: string;
  onTimeLocked: (quarterIndex: number, selectedOption: KaoKeWithMatch) => void;
  isLoading?: boolean;
}

interface LoadedOption extends KaoKeWithMatch {
  content?: string;
  isLoading?: boolean;
}

// ==========================================
// COMPONENT
// ==========================================

export const SixRelationsVerification = ({
  baseNumber,
  ganZhiDisplay,
  onTimeLocked,
  isLoading = false,
}: SixRelationsVerificationProps) => {
  // Form state
  const [fatherZodiac, setFatherZodiac] = useState<number | null>(null);
  const [motherZodiac, setMotherZodiac] = useState<number | null>(null);
  const [parentsStatus, setParentsStatus] = useState<SixRelationsInput['parentsStatus']>('both_alive');
  const [siblingsCount, setSiblingsCount] = useState(1);

  // Calibration state
  const [hasCalibrated, setHasCalibrated] = useState(false);
  const [matchedOptions, setMatchedOptions] = useState<LoadedOption[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reset calibration when form changes
  useEffect(() => {
    if (hasCalibrated) {
      setHasCalibrated(false);
      setMatchedOptions([]);
      setSelectedIndex(null);
    }
  }, [fatherZodiac, motherZodiac, parentsStatus, siblingsCount]);

  /**
   * Run the Six Relations calibration algorithm
   */
  const handleCalibration = useCallback(async () => {
    if (fatherZodiac === null || motherZodiac === null) {
      return;
    }

    setIsCalibrating(true);
    setHasCalibrated(false);

    try {
      const relations: SixRelationsInput = {
        fatherZodiac,
        motherZodiac,
        parentsStatus,
        siblingsCount,
      };

      // Run the matching algorithm
      const results = TiebanEngine.calculateSixRelationsMatch(baseNumber, relations);

      // Initialize with loading state
      const initialOptions: LoadedOption[] = results.map(opt => ({
        ...opt,
        isLoading: true,
      }));
      setMatchedOptions(initialOptions);
      setHasCalibrated(true);

      // Fetch clause content for each option
      const loadedOptions = await Promise.all(
        results.map(async (opt) => {
          const clause = await fetchClauseByNumber(opt.clauseNumber);
          return {
            ...opt,
            content: clause?.content || '此刻条文待解，需参阅古籍原文。',
            isLoading: false,
          };
        })
      );

      setMatchedOptions(loadedOptions);
    } catch (error) {
      console.error('Calibration error:', error);
    } finally {
      setIsCalibrating(false);
    }
  }, [baseNumber, fatherZodiac, motherZodiac, parentsStatus, siblingsCount]);

  /**
   * Confirm the selected quarter
   */
  const handleConfirmSelection = useCallback(() => {
    if (selectedIndex === null || !matchedOptions[selectedIndex]) return;
    const selected = matchedOptions[selectedIndex];
    onTimeLocked(selected.keIndex, selected);
  }, [selectedIndex, matchedOptions, onTimeLocked]);

  const isFormComplete = fatherZodiac !== null && motherZodiac !== null;
  const bestMatchIndex = hasCalibrated && matchedOptions.length > 0 ? 0 : -1; // Already sorted by score

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center border-b border-primary/20 pb-6">
        <h2 className="text-2xl md:text-3xl font-serif text-primary tracking-wider mb-2">
          六亲考刻
        </h2>
        <p className="text-sm text-muted-foreground">
          Family Verification · 父母兄弟实况
        </p>
        {ganZhiDisplay && (
          <p className="text-xs text-primary/60 mt-3 font-mono tracking-widest">
            {ganZhiDisplay}
          </p>
        )}
      </div>

      {/* Instruction */}
      <div className="bg-secondary/30 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-foreground/80 leading-relaxed">
          铁板神数以六亲校验定时辰刻分。请如实填写父母生肖及现况，
          <br className="hidden md:block" />
          系统将推算八刻分局，择其吻合者为正时。
        </p>
      </div>

      {/* Form Section */}
      {!hasCalibrated && (
        <div className="space-y-6 bg-card/30 border border-border/50 rounded-lg p-6">
          {/* Father Zodiac */}
          <div className="space-y-2">
            <Label className="text-foreground/90 font-serif flex items-center gap-2">
              <span className="text-primary">☰</span> 父亲生肖 (Father's Zodiac)
            </Label>
            <Select
              value={fatherZodiac !== null ? String(fatherZodiac) : undefined}
              onValueChange={(v) => setFatherZodiac(Number(v))}
            >
              <SelectTrigger className="bg-input border-border/50 text-foreground">
                <SelectValue placeholder="请选择父亲生肖..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {ZODIAC_OPTIONS.map((z) => (
                  <SelectItem key={z.value} value={String(z.value)} className="text-foreground">
                    <span className="flex items-center gap-2">
                      <span>{z.emoji}</span>
                      <span>{z.branch}{z.name}</span>
                      <span className="text-muted-foreground text-xs">({z.english})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mother Zodiac */}
          <div className="space-y-2">
            <Label className="text-foreground/90 font-serif flex items-center gap-2">
              <span className="text-primary">☷</span> 母亲生肖 (Mother's Zodiac)
            </Label>
            <Select
              value={motherZodiac !== null ? String(motherZodiac) : undefined}
              onValueChange={(v) => setMotherZodiac(Number(v))}
            >
              <SelectTrigger className="bg-input border-border/50 text-foreground">
                <SelectValue placeholder="请选择母亲生肖..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {ZODIAC_OPTIONS.map((z) => (
                  <SelectItem key={z.value} value={String(z.value)} className="text-foreground">
                    <span className="flex items-center gap-2">
                      <span>{z.emoji}</span>
                      <span>{z.branch}{z.name}</span>
                      <span className="text-muted-foreground text-xs">({z.english})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parents Status - Segmented Control */}
          <div className="space-y-2">
            <Label className="text-foreground/90 font-serif flex items-center gap-2">
              <span className="text-primary">☯</span> 父母现况 (Parents' Status)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {PARENTS_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setParentsStatus(opt.value)}
                  className={`
                    p-3 rounded-lg border text-sm font-serif transition-all duration-200
                    ${parentsStatus === opt.value
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-secondary/30 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }
                  `}
                >
                  <div className="text-lg mb-1">{opt.icon}</div>
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Siblings Count */}
          <div className="space-y-2">
            <Label className="text-foreground/90 font-serif flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> 同气连枝 (Siblings Count)
            </Label>
            <div className="flex items-center justify-center gap-4 bg-secondary/30 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setSiblingsCount(Math.max(0, siblingsCount - 1))}
                className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-3xl font-serif text-primary w-16 text-center">
                {siblingsCount}
              </span>
              <button
                type="button"
                onClick={() => setSiblingsCount(Math.min(10, siblingsCount + 1))}
                className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              包括您在内的兄弟姐妹总数
            </p>
          </div>

          {/* Calibration Button */}
          <Button
            onClick={handleCalibration}
            disabled={!isFormComplete || isCalibrating}
            className="w-full h-14 text-lg font-serif bg-gradient-to-r from-primary/80 via-primary to-primary/80 hover:from-primary hover:via-primary hover:to-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
          >
            {isCalibrating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> 推算中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 开始考刻 (Start Calibration)
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Results Grid */}
      {hasCalibrated && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-serif text-primary mb-2">八刻分局</h3>
            <p className="text-sm text-muted-foreground">
              请选择最符合您家庭情况的条文
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedOptions.map((option, index) => {
              const isBestMatch = index === bestMatchIndex;
              const isSelected = selectedIndex === index;
              const zodiacFather = ZODIAC_OPTIONS[option.predictedFatherZodiac];
              const zodiacMother = ZODIAC_OPTIONS[option.predictedMotherZodiac];

              return (
                <button
                  key={option.keIndex}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`
                    relative text-left p-4 rounded-lg border transition-all duration-300
                    ${isSelected
                      ? 'bg-primary/20 border-primary ring-2 ring-primary/50'
                      : isBestMatch
                        ? 'bg-primary/10 border-primary/50 hover:border-primary'
                        : 'bg-card/50 border-border/50 hover:border-primary/30'
                    }
                  `}
                >
                  {/* Best Match Badge */}
                  {isBestMatch && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 animate-pulse-glow">
                      <Crown className="w-3 h-3" />
                      天机吻合
                    </div>
                  )}

                  {/* Time Label */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-primary font-serif text-lg">{option.timeLabel}</span>
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${option.matchScore >= 80 ? 'bg-green-500/20 text-green-400' :
                        option.matchScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-muted text-muted-foreground'}
                    `}>
                      匹配度: {option.matchScore}%
                    </span>
                  </div>

                  {/* Predicted Zodiacs */}
                  <div className="flex gap-4 mb-3 text-sm">
                    <span className="text-muted-foreground">
                      父 {zodiacFather?.emoji} {zodiacFather?.name}
                    </span>
                    <span className="text-muted-foreground">
                      母 {zodiacMother?.emoji} {zodiacMother?.name}
                    </span>
                  </div>

                  {/* Clause Content */}
                  <div className="min-h-[60px]">
                    {option.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-muted/50" />
                        <Skeleton className="h-4 w-3/4 bg-muted/50" />
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                        {option.content}
                      </p>
                    )}
                  </div>

                  {/* Clause Number */}
                  <div className="mt-3 pt-3 border-t border-border/30 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">
                      条文 #{option.clauseNumber}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-primary">✓ 已选</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setHasCalibrated(false);
                setMatchedOptions([]);
                setSelectedIndex(null);
              }}
              className="flex-1 border-border/50 text-muted-foreground hover:text-foreground"
            >
              重新填写
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={selectedIndex === null || isLoading}
              className="flex-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80 hover:from-primary text-primary-foreground"
            >
              {isLoading ? '推算中...' : '确认此刻 (Confirm)'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SixRelationsVerification;
