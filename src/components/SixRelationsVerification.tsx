/**
 * Six Relations Verification Component (六亲考刻)
 * 
 * Collects family data (parents' zodiacs, status, siblings) to calibrate
 * the exact birth quarter through the Iron Plate algorithm.
 * 
 * Theme: "Digital Temple" - Solemn, Dark, Gold accents, Serif typography
 * 
 * Features:
 * - Deep Semantic Search: Finds the most detailed clauses
 * - Rich Detail Cards: Shows full clause content with metadata badges
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { findDetailedFamilyMatches, type Clause } from '@/services/SupabaseService';
import { Sparkles, Users, Minus, Plus, Crown, Star, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

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
// HELPER FUNCTIONS
// ==========================================

/**
 * Extract critical years (ages) from clause text
 * Looks for patterns like (45), (47), 四十五, etc.
 */
function extractCriticalYears(content: string): string[] {
  const years: string[] = [];
  
  // Match bracketed numbers like (45), (47)
  const bracketMatches = content.match(/\((\d+)\)/g);
  if (bracketMatches) {
    bracketMatches.forEach(match => {
      const num = match.replace(/[()]/g, '');
      years.push(`${num}岁`);
    });
  }
  
  // Match Chinese number patterns for ages
  const chineseAgePattern = /(一|二|三|四|五|六|七|八|九|十)+[十百]*(岁|歲)/g;
  const chineseMatches = content.match(chineseAgePattern);
  if (chineseMatches) {
    chineseMatches.forEach(match => years.push(match));
  }
  
  return [...new Set(years)].slice(0, 4); // Dedupe and limit to 4
}

/**
 * Check if content mentions both parents
 */
function hasBothParents(content: string, fZodiac: string, mZodiac: string): boolean {
  return content.includes(`父属${fZodiac}`) && content.includes(`母属${mZodiac}`);
}

/**
 * Convert number to Chinese numeral (matching service logic)
 */
function toChineseNumeral(num: number): string {
  const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) return numerals[num];
  if (num < 20) return `十${numerals[num - 10]}`;
  return num.toString();
}

/**
 * Check if content mentions sibling count
 */
function hasSiblingsMatch(content: string, siblingsCount: number): boolean {
  const chineseNum = toChineseNumeral(siblingsCount);
  const patterns = [
    `兄弟${chineseNum}人`,
    `兄弟${siblingsCount}人`,
    `弟兄${chineseNum}`,
    `同胞${chineseNum}`,
    `手足${chineseNum}`,
  ];
  return patterns.some(p => content.includes(p));
}

// ==========================================
// INTERFACES
// ==========================================

interface SixRelationsVerificationProps {
  baseNumber: number;
  ganZhiDisplay: string;
  onTimeLocked: (quarterIndex: number, selectedOption: KaoKeWithMatch) => void;
  isLoading?: boolean;
}

interface RichOption {
  clauseNumber: number;
  content: string;
  matchScore: number;
  isRealMatch: boolean;
  isPerfectMatch: boolean; // Both parents matched
  hasSiblingsMatch: boolean; // Siblings count matched
  criticalYears: string[];
  keIndex: number;
  timeLabel: string;
  predictedFatherZodiac: number;
  predictedMotherZodiac: number;
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
  const [matchedOptions, setMatchedOptions] = useState<RichOption[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [noMatchMessage, setNoMatchMessage] = useState<string | null>(null);

  // Reset calibration when form changes
  useEffect(() => {
    if (hasCalibrated) {
      setHasCalibrated(false);
      setMatchedOptions([]);
      setSelectedIndex(null);
      setNoMatchMessage(null);
    }
  }, [fatherZodiac, motherZodiac, parentsStatus, siblingsCount]);

  /**
   * Run the Six Relations calibration algorithm
   * DEEP SEMANTIC SEARCH: Finds multiple detailed clauses
   */
  const handleCalibration = useCallback(async () => {
    if (fatherZodiac === null || motherZodiac === null) {
      return;
    }

    setIsCalibrating(true);
    setHasCalibrated(false);
    setNoMatchMessage(null);

    try {
      // Get user's zodiac names in Chinese
      const fZodiacName = ZODIAC_OPTIONS[fatherZodiac].name;
      const mZodiacName = ZODIAC_OPTIONS[motherZodiac].name;

      // DEEP SEMANTIC SEARCH: Get the richest/most detailed matches (with siblings)
      const richMatches = await findDetailedFamilyMatches(fZodiacName, mZodiacName, siblingsCount, 6);

      if (richMatches.length === 0) {
        // No matches found - show message
        setNoMatchMessage(
          `数据库中未收录完全匹配 "父属${fZodiacName} 母属${mZodiacName}" 的详批条文。建议尝试只输入父亲属相进行模糊考刻。`
        );
        setHasCalibrated(true);
        return;
      }

      // Map the rich matches to RichOption format
      const finalOptions: RichOption[] = richMatches.map((match, index) => ({
        clauseNumber: match.clause_number,
        content: match.content,
        matchScore: 95 - (index * 8), // Degrading score: 95, 87, 79, 71...
        isRealMatch: true,
        isPerfectMatch: hasBothParents(match.content, fZodiacName, mZodiacName),
        hasSiblingsMatch: hasSiblingsMatch(match.content, siblingsCount),
        criticalYears: extractCriticalYears(match.content),
        keIndex: index,
        timeLabel: `候选 ${String.fromCharCode(65 + index)}`, // A, B, C, D...
        predictedFatherZodiac: fatherZodiac,
        predictedMotherZodiac: motherZodiac,
      }));

      setMatchedOptions(finalOptions);
      setHasCalibrated(true);
    } catch (error) {
      console.error('Calibration error:', error);
      setNoMatchMessage('查询出错，请稍后重试。');
    } finally {
      setIsCalibrating(false);
    }
  }, [fatherZodiac, motherZodiac]);

  /**
   * Confirm the selected quarter
   */
  const handleConfirmSelection = useCallback(() => {
    if (selectedIndex === null || !matchedOptions[selectedIndex]) return;
    const selected = matchedOptions[selectedIndex];
    
    // Convert RichOption to KaoKeWithMatch format for parent component
    const kaoKeOption: KaoKeWithMatch = {
      keIndex: selected.keIndex,
      quarterIndex: selected.keIndex, // Required by KaoKeCandidate interface
      clauseNumber: selected.clauseNumber,
      timeLabel: selected.timeLabel,
      predictedFatherZodiac: selected.predictedFatherZodiac,
      predictedMotherZodiac: selected.predictedMotherZodiac,
      matchScore: selected.matchScore,
      searchQuery: `父属${ZODIAC_OPTIONS[selected.predictedFatherZodiac].name}`,
    };
    
    onTimeLocked(selected.keIndex, kaoKeOption);
  }, [selectedIndex, matchedOptions, onTimeLocked]);

  const isFormComplete = fatherZodiac !== null && motherZodiac !== null;

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
          系统将从古籍数据库中检索最详尽的命批条文。
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
                <span className="animate-spin">⏳</span> 深度检索中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 开始考刻 (Start Calibration)
              </span>
            )}
          </Button>
        </div>
      )}

      {/* No Match State */}
      {hasCalibrated && noMatchMessage && (
        <div className="bg-secondary/30 border border-yellow-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-foreground/80 leading-relaxed">{noMatchMessage}</p>
          <Button
            variant="outline"
            onClick={() => {
              setHasCalibrated(false);
              setMatchedOptions([]);
              setNoMatchMessage(null);
            }}
            className="mt-4 border-border/50 text-muted-foreground hover:text-foreground"
          >
            重新选择
          </Button>
        </div>
      )}

      {/* Rich Detail Cards */}
      {hasCalibrated && matchedOptions.length > 0 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-serif text-primary mb-2">详批检索结果</h3>
            <p className="text-sm text-muted-foreground">
              共检索到 {matchedOptions.length} 条相关条文，按详尽程度排序
            </p>
          </div>

          <div className="space-y-4">
            {matchedOptions.map((option, index) => {
              const isSelected = selectedIndex === index;
              const zodiacFather = ZODIAC_OPTIONS[option.predictedFatherZodiac];
              const zodiacMother = ZODIAC_OPTIONS[option.predictedMotherZodiac];

              return (
                <button
                  key={option.clauseNumber}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`
                    relative w-full text-left rounded-xl border transition-all duration-300
                    ${isSelected
                      ? 'bg-primary/15 border-primary ring-2 ring-primary/50 shadow-lg shadow-primary/10'
                      : index === 0
                        ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/40 hover:border-primary'
                        : 'bg-card/50 border-border/50 hover:border-primary/30 hover:bg-card/70'
                    }
                  `}
                >
                  {/* Card Header */}
                  <div className="p-4 pb-3 border-b border-border/30">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-serif text-primary">{option.timeLabel}</span>
                        {index === 0 && (
                          <Badge variant="default" className="bg-primary text-primary-foreground animate-pulse-glow">
                            <Crown className="w-3 h-3 mr-1" />
                            最详尽
                          </Badge>
                        )}
                        {option.isPerfectMatch && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            双亲全对
                          </Badge>
                        )}
                        {option.hasSiblingsMatch && (
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <Users className="w-3 h-3 mr-1" />
                            兄弟相符
                          </Badge>
                        )}
                      </div>
                      <span className={`
                        text-xs px-3 py-1 rounded-full font-medium
                        ${option.matchScore >= 90 ? 'bg-green-500/20 text-green-400' :
                          option.matchScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-muted text-muted-foreground'}
                      `}>
                        匹配度: {option.matchScore}%
                      </span>
                    </div>

                    {/* Zodiacs Row */}
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="text-lg">{zodiacFather?.emoji}</span>
                        父属{zodiacFather?.name}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="text-lg">{zodiacMother?.emoji}</span>
                        母属{zodiacMother?.name}
                      </span>
                    </div>
                  </div>

                  {/* Card Body - The Rich Content */}
                  <div className="p-4">
                    <p className="text-base text-foreground/90 leading-loose font-serif">
                      {option.content}
                    </p>

                    {/* Critical Years Badges */}
                    {option.criticalYears.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> 关键流年:
                        </span>
                        {option.criticalYears.map((year, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-primary/30 text-primary">
                            <Star className="w-3 h-3 mr-1" />
                            {year}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-secondary/20 rounded-b-xl flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-mono">
                      铁板条文 #{option.clauseNumber}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> 已选定
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setHasCalibrated(false);
                setMatchedOptions([]);
                setSelectedIndex(null);
                setNoMatchMessage(null);
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
              {isLoading ? '推算中...' : '确认此条 (Confirm)'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SixRelationsVerification;
