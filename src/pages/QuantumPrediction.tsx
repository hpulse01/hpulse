import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LocationSearch, type GeocodedLocation } from '@/components/LocationSearch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserMenu } from '@/components/UserMenu';
import { Footer } from '@/components/Footer';
import { QuantumField } from '@/components/quantum/QuantumField';
import { QuantumRadar } from '@/components/quantum/QuantumRadar';
import { QuantumWaveform } from '@/components/quantum/QuantumWaveform';
import { QuantumCoherencePanel } from '@/components/quantum/QuantumCoherencePanel';
import { QuantumEntanglementMap } from '@/components/quantum/QuantumEntanglementMap';
import {
  QuantumPredictionEngine,
  type QuantumInput,
  type QuantumPredictionResult,
  type LifeAspect,
  type CollapsedEvent,
  type DestinyPhase,
} from '@/utils/quantumPredictionEngine';
import { TiebanEngine } from '@/utils/tiebanAlgorithm';
import {
  Atom, ArrowLeft, RotateCcw, Sparkles, TrendingUp,
  TrendingDown, Minus, Zap, Waves, Network, BarChart3, BookOpen,
  Briefcase, Coins, Heart, Activity, Brain, Users,
  Palette, Star, Home, Compass, Globe, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─────────────────────────────────────
// Constants
// ─────────────────────────────────────

type AppStep = 'input' | 'phase1' | 'phase2' | 'phase3' | 'result';

const ASPECT_ICONS: Record<LifeAspect, typeof Star> = {
  career: Briefcase, wealth: Coins, love: Heart, health: Activity,
  wisdom: Brain, social: Users, creativity: Palette, fortune: Star,
  family: Home, spirituality: Compass,
};

const ASPECT_COLORS: Record<LifeAspect, string> = {
  career: 'text-amber-400', wealth: 'text-emerald-400', love: 'text-rose-400',
  health: 'text-purple-400', wisdom: 'text-blue-400', social: 'text-cyan-400',
  creativity: 'text-pink-400', fortune: 'text-yellow-400',
  family: 'text-orange-400', spirituality: 'text-indigo-400',
};

const TREND_ICONS = { rising: TrendingUp, stable: Minus, declining: TrendingDown };
const TREND_COLORS = { rising: 'text-emerald-400', stable: 'text-slate-400', declining: 'text-rose-400' };
const TREND_LABELS = { rising: '上升', stable: '平稳', declining: '下行' };

const EVENT_TYPE_COLORS: Record<string, string> = {
  milestone: 'border-amber-500/40 bg-amber-500/10',
  opportunity: 'border-emerald-500/40 bg-emerald-500/10',
  challenge: 'border-rose-500/40 bg-rose-500/10',
  transformation: 'border-violet-500/40 bg-violet-500/10',
  relationship: 'border-pink-500/40 bg-pink-500/10',
  achievement: 'border-yellow-500/40 bg-yellow-500/10',
  loss: 'border-red-500/40 bg-red-500/10',
  growth: 'border-teal-500/40 bg-teal-500/10',
  turning_point: 'border-fuchsia-500/40 bg-fuchsia-500/10',
};

// ─────────────────────────────────────
// Input Form
// ─────────────────────────────────────

function QuantumInputForm({ onSubmit }: { onSubmit: (d: QuantumInput) => void }) {
  const [form, setForm] = useState<QuantumInput>({
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    gender: 'male',
    geoLatitude: 39.9042,
    geoLongitude: 116.4074,
    timezoneOffsetMinutes: 480,
  });
  const [timezoneIana, setTimezoneIana] = useState('Asia/Shanghai');
  const [locationLabel, setLocationLabel] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const chineseHour = TiebanEngine.getChineseHour(form.hour);

  const handleLocationSelect = (loc: GeocodedLocation) => {
    setForm(prev => ({
      ...prev,
      geoLatitude: loc.geoLatitude,
      geoLongitude: loc.geoLongitude,
      timezoneOffsetMinutes: loc.timezoneOffsetMinutesAtBirth,
    }));
    setTimezoneIana(loc.timezoneIana);
    setLocationLabel(loc.normalizedLocationName.split(', ').slice(0, 2).join(', '));
  };

  const formatOffset = (m: number) => {
    const sign = m >= 0 ? '+' : '-';
    const abs = Math.abs(m);
    return `UTC${sign}${Math.floor(abs / 60)}${abs % 60 > 0 ? ':' + (abs % 60).toString().padStart(2, '0') : ''}`;
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-6">
      <div className="text-center border-b border-violet-500/30 pb-4">
        <h2 className="text-2xl font-serif text-violet-300 tracking-wider flex items-center justify-center gap-2">
          <Atom className="w-6 h-6 text-violet-400 animate-spin" style={{ animationDuration: '8s' }} />
          量子态初始化
        </h2>
        <p className="text-muted-foreground text-xs mt-2">
          搜索出生地自动解析经纬度与时区，天文层将转换到 UTC 后计算
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生日期</Label>
        <div className="grid grid-cols-3 gap-3">
          <Select value={form.year.toString()} onValueChange={v => setForm({ ...form, year: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">{years.map(y => <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.month.toString()} onValueChange={v => setForm({ ...form, month: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20"><SelectValue /></SelectTrigger>
            <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <SelectItem key={m} value={m.toString()}>{m}月</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.day.toString()} onValueChange={v => setForm({ ...form, day: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{d}日</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生时间（本地）</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.hour.toString()} onValueChange={v => setForm({ ...form, hour: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">{Array.from({ length: 24 }, (_, i) => i).map(h => <SelectItem key={h} value={h.toString()}>{h.toString().padStart(2, '0')}时</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.minute.toString()} onValueChange={v => setForm({ ...form, minute: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">{Array.from({ length: 60 }, (_, i) => i).map(m => <SelectItem key={m} value={m.toString()}>{m.toString().padStart(2, '0')}分</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="text-center py-1.5 bg-violet-500/10 rounded border border-violet-500/20">
          <span className="text-muted-foreground text-sm">时辰: </span>
          <span className="text-violet-300 font-medium">{chineseHour}</span>
        </div>
      </div>

      {/* Location search */}
      <LocationSearch
        birthYear={form.year}
        birthMonth={form.month}
        birthDay={form.day}
        birthHour={form.hour}
        onSelect={handleLocationSelect}
        initialLocationName="北京"
      />

      {/* Resolved info */}
      <div className="bg-violet-500/5 border border-violet-500/20 rounded p-3 space-y-1">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">纬度: </span>
            <span className="text-foreground font-mono">{form.geoLatitude.toFixed(4)}°</span>
          </div>
          <div>
            <span className="text-muted-foreground">经度: </span>
            <span className="text-foreground font-mono">{form.geoLongitude.toFixed(4)}°</span>
          </div>
          <div>
            <span className="text-muted-foreground">时区: </span>
            <span className="text-foreground font-mono">{formatOffset(form.timezoneOffsetMinutes)}</span>
          </div>
        </div>
        {timezoneIana && (
          <p className="text-[11px] text-muted-foreground">
            IANA: <span className="text-foreground">{timezoneIana}</span>
            {locationLabel && <span> · {locationLabel}</span>}
          </p>
        )}
      </div>

      {/* Advanced manual override */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          手动修正经纬度和时区
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">纬度（北纬+）</Label>
              <input type="number" step="0.0001"
                className="w-full h-10 rounded-md border border-violet-500/20 bg-secondary px-3 text-sm"
                value={form.geoLatitude}
                onChange={(e) => setForm({ ...form, geoLatitude: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">经度（东经+）</Label>
              <input type="number" step="0.0001"
                className="w-full h-10 rounded-md border border-violet-500/20 bg-secondary px-3 text-sm"
                value={form.geoLongitude}
                onChange={(e) => setForm({ ...form, geoLongitude: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">时区偏移（分钟）</Label>
              <input type="number" step="1"
                className="w-full h-10 rounded-md border border-violet-500/20 bg-secondary px-3 text-sm"
                value={form.timezoneOffsetMinutes}
                onChange={(e) => setForm({ ...form, timezoneOffsetMinutes: Number(e.target.value) })} />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-3">
        <Label className="text-foreground/80 text-sm">性别</Label>
        <RadioGroup value={form.gender} onValueChange={v => setForm({ ...form, gender: v as 'male' | 'female' })} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="q-male" className="border-violet-500 text-violet-400" />
            <Label htmlFor="q-male" className="cursor-pointer">乾命 (男)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="q-female" className="border-violet-500 text-violet-400" />
            <Label htmlFor="q-female" className="cursor-pointer">坤命 (女)</Label>
          </div>
        </RadioGroup>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white py-6 text-lg font-serif tracking-widest transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30">
        启动量子预测 · 命运全知
      </Button>
    </form>
  );
}

// ─────────────────────────────────────
// Phase Loading Screens
// ─────────────────────────────────────

function PhaseLoading({ phase, systems }: { phase: AppStep; systems?: string[] }) {
  const config: Record<string, { title: string; sub: string; items: string[] }> = {
    phase1: { title: '全球命理体系解析中...', sub: 'Analyzing 9 World Metaphysics Systems', items: ['铁板神数', '八字命理', '紫微斗数', '六爻卦象', '西方占星', '吠陀占星', '数字命理', '玛雅历法', '卡巴拉'] },
    phase2: { title: '无穷世界生成中...', sub: 'Generating Infinite Parallel Worlds', items: systems || [] },
    phase3: { title: '量子坍缩 · 收敛唯一真实命运...', sub: 'Quantum Collapse → One True Destiny', items: [] },
  };
  const c = config[phase] || config.phase1;

  return (
    <div className="relative max-w-xl mx-auto">
      <div className="absolute inset-0 rounded-xl overflow-hidden"><QuantumField energy={phase === 'phase3' ? 95 : 60} dominantElement="水" /></div>
      <div className="relative bg-card/40 backdrop-blur-sm border border-violet-500/30 rounded-xl p-10 md:p-14 shadow-2xl">
        <div className="text-center space-y-5">
          <Atom className="w-16 h-16 text-violet-400 animate-spin mx-auto" style={{ animationDuration: phase === 'phase3' ? '1s' : '3s' }} />
          <div className="space-y-1">
            <p className="text-lg font-serif text-violet-300 tracking-wider">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
          {c.items.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {c.items.map((item, i) => (
                <Badge key={item} variant="outline" className="text-[10px] border-violet-500/30 text-violet-300 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                  {item}
                </Badge>
              ))}
            </div>
          )}
          {phase === 'phase2' && <p className="text-xs text-violet-400 font-mono animate-pulse">每个体系 × 80年 × 10维度 × 多分支 = ∞ 世界</p>}
          {phase === 'phase3' && (
            <div className="space-y-2">
              <p className="text-xs text-fuchsia-400 font-mono">∞ worlds → 1 true destiny</p>
              <div className="w-48 mx-auto h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 rounded-full animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Event Card
// ─────────────────────────────────────

function EventCard({ event, currentAge }: { event: CollapsedEvent; currentAge: number }) {
  const isCurrent = event.age === currentAge;
  const isPast = event.age < currentAge;
  const typeCN = QuantumPredictionEngine.getEventTypeCN(event.eventType);
  const typeColor = EVENT_TYPE_COLORS[event.eventType] || 'border-border/30 bg-card/30';

  return (
    <div className={`
      p-3 rounded-lg border transition-all
      ${isCurrent ? 'ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10 ' : ''}
      ${isPast ? 'opacity-60 ' : ''}
      ${typeColor}
    `}>
      <div className="flex items-start gap-3">
        <div className="text-center min-w-[48px]">
          <div className={`text-lg font-serif ${isCurrent ? 'text-violet-300' : 'text-foreground'}`}>{event.age}<span className="text-[10px] text-muted-foreground">岁</span></div>
          <div className="text-[10px] text-muted-foreground">{event.year}</div>
          <div className="text-[10px] text-violet-300/60">{event.ganZhi}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-sm font-serif text-foreground">{event.title}</span>
            <Badge variant="outline" className="text-[9px] px-1 py-0 border-violet-500/30 text-violet-300">{typeCN}</Badge>
            {event.convergence > 0.4 && <Badge variant="outline" className="text-[9px] px-1 py-0 border-fuchsia-500/30 text-fuchsia-300">{event.systemVotes.length}系共振</Badge>}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-secondary/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all" style={{ width: `${event.energyLevel}%` }} />
            </div>
            <span className="text-[10px] font-mono text-violet-300">{event.energyLevel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Phase Section
// ─────────────────────────────────────

function PhaseSection({ phase, currentAge }: { phase: DestinyPhase; currentAge: number }) {
  const [expanded, setExpanded] = useState(phase.events.some(e => e.age === currentAge) || phase.startAge <= 12);
  const significantEvents = phase.events.filter(e => e.convergence > 0.3 || e.eventType === 'turning_point' || e.eventType === 'milestone');
  const displayEvents = expanded ? phase.events : significantEvents.slice(0, 3);

  return (
    <div className="border border-violet-500/20 rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 bg-violet-500/5 hover:bg-violet-500/10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <span className="text-lg font-serif text-violet-300">{phase.element}</span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-serif text-violet-200">{phase.name} · {phase.theme}</h4>
            <p className="text-[10px] text-muted-foreground">{phase.startAge}-{phase.endAge}岁 · 能量 {phase.overallEnergy}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${phase.overallEnergy}%` }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {displayEvents.length > 0 && (
        <div className="p-3 space-y-2">
          {displayEvents.map(e => <EventCard key={e.age} event={e} currentAge={currentAge} />)}
          {!expanded && phase.events.length > displayEvents.length && (
            <button onClick={() => setExpanded(true)} className="w-full text-center text-xs text-violet-400 hover:text-violet-300 py-2 transition-colors">
              展开全部 {phase.events.length} 个事件
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// Main Page
// ─────────────────────────────────────

export default function QuantumPrediction() {
  const [step, setStep] = useState<AppStep>('input');
  const [result, setResult] = useState<QuantumPredictionResult | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | null>(null);
  const [activeTab, setActiveTab] = useState('destiny');

  const handleSubmit = useCallback(async (input: QuantumInput) => {
    setStep('phase1');
    await new Promise(r => setTimeout(r, 1800));
    setStep('phase2');
    await new Promise(r => setTimeout(r, 1500));
    setStep('phase3');
    await new Promise(r => setTimeout(r, 2000));
    try {
      const prediction = QuantumPredictionEngine.predict(input);
      setResult(prediction);
      setStep('result');
    } catch (err) {
      console.error('Quantum prediction error:', err);
      setStep('input');
    }
  }, []);

  const handleReset = useCallback(() => {
    setStep('input');
    setResult(null);
    setSelectedAspect(null);
    setActiveTab('destiny');
  }, []);

  const currentAge = useMemo(() => {
    if (!result) return 0;
    return new Date().getFullYear() - (result.destinyTimeline[0]?.year - result.destinyTimeline[0]?.age || 1990);
  }, [result]);

  const sortedStates = useMemo(() => result ? [...result.states].sort((a, b) => b.probability - a.probability) : [], [result]);

  const waveformTimeline = useMemo(() => {
    if (!result) return [];
    return result.destinyTimeline.map(e => ({
      age: e.age,
      year: e.year,
      energy: e.energyLevel,
      element: e.element,
      phase: '',
      ganZhi: e.ganZhi,
      isCurrentAge: e.age === currentAge,
    }));
  }, [result, currentAge]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-3 md:py-5 border-b border-violet-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/30 via-transparent to-purple-950/30" />
        <div className="container max-w-5xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-300 transition-colors">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">铁板神数</span>
            </Link>
            <div className="text-center">
              <h1 className="text-xl md:text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 tracking-[0.15em]">
                H-Pulse
              </h1>
              <p className="text-muted-foreground text-[10px] md:text-xs tracking-wider">
                Quantum Destiny Prediction · 命运全知系统
              </p>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 md:py-8">
        <div className={`container mx-auto px-4 ${step === 'result' ? 'max-w-5xl' : 'max-w-xl'}`}>
          {/* Input */}
          {step === 'input' && (
            <div className="relative">
              <div className="absolute inset-0 -z-10 opacity-30 rounded-xl overflow-hidden"><QuantumField energy={30} dominantElement="金" /></div>
              <div className="bg-card/60 backdrop-blur-sm border border-violet-500/20 rounded-xl p-6 md:p-8 shadow-2xl shadow-violet-950/30">
                <QuantumInputForm onSubmit={handleSubmit} />
              </div>
            </div>
          )}

          {/* Phase loading screens */}
          {(step === 'phase1' || step === 'phase2' || step === 'phase3') && <PhaseLoading phase={step} />}

          {/* Result */}
          {step === 'result' && result && (
            <div className="space-y-5">
              {/* Signature Header */}
              <div className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 z-0"><QuantumField energy={result.overallCoherence * 100} dominantElement={result.dominantElement} /></div>
                <div className="relative z-10 bg-gradient-to-b from-card/70 via-card/50 to-card/70 backdrop-blur-sm border border-violet-500/20 rounded-xl p-5 md:p-7">
                  <div className="text-center space-y-3">
                    <h2 className="text-xl md:text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 tracking-wider">
                      命运已全知
                    </h2>
                    <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-300 font-mono">{result.quantumSignature}</Badge>
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
                      <span>共振度: <strong className="text-violet-300">{Math.round(result.overallCoherence * 100)}%</strong></span>
                      <span>世界总数: <strong className="text-violet-300">{result.totalWorldsGenerated.toLocaleString()}</strong></span>
                      <span>命理体系: <strong className="text-violet-300">{result.systems.length}</strong></span>
                      <span>主导五行: <strong className="text-violet-300">{result.dominantElement}</strong></span>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed border-t border-violet-500/20 pt-3 mt-2">
                      {result.lifeSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 bg-violet-950/30 border border-violet-500/20 h-auto">
                  <TabsTrigger value="destiny" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <BookOpen className="w-3 h-3 mr-1 hidden sm:inline" />命运全知
                  </TabsTrigger>
                  <TabsTrigger value="quantum" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <BarChart3 className="w-3 h-3 mr-1 hidden sm:inline" />量子态
                  </TabsTrigger>
                  <TabsTrigger value="waveform" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Waves className="w-3 h-3 mr-1 hidden sm:inline" />能量波形
                  </TabsTrigger>
                  <TabsTrigger value="systems" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Globe className="w-3 h-3 mr-1 hidden sm:inline" />九系解析
                  </TabsTrigger>
                  <TabsTrigger value="entangle" className="text-[10px] sm:text-xs py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Network className="w-3 h-3 mr-1 hidden sm:inline" />纠缠
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Destiny Revelation (命运全知) */}
                <TabsContent value="destiny" className="mt-5 space-y-4">
                  <ScrollArea className="h-[600px] pr-2">
                    <div className="space-y-4">
                      {result.destinyPhases.map((phase, i) => (
                        <PhaseSection key={i} phase={phase} currentAge={currentAge} />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Tab: Quantum States */}
                <TabsContent value="quantum" className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 flex flex-col items-center">
                      <h3 className="text-sm font-serif text-violet-300 mb-3"><Sparkles className="w-4 h-4 inline mr-1" />十维量子态势场</h3>
                      <QuantumRadar states={result.states} size={300} />
                    </div>
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                      <h3 className="text-sm font-serif text-violet-300 mb-3">十维量子态</h3>
                      <div className="space-y-2">
                        {sortedStates.map(state => {
                          const Icon = ASPECT_ICONS[state.aspect];
                          const TrendIcon = TREND_ICONS[state.trend];
                          const probColor = state.probability >= 70 ? 'text-emerald-400' : state.probability >= 45 ? 'text-amber-300' : 'text-rose-400';
                          return (
                            <button key={state.aspect} onClick={() => setSelectedAspect(selectedAspect === state.aspect ? null : state.aspect)}
                              className={`w-full text-left p-2.5 rounded-lg border transition-all ${selectedAspect === state.aspect ? 'bg-violet-500/15 border-violet-500/50' : 'bg-card/30 border-border/30 hover:border-violet-500/30'}`}>
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center ${ASPECT_COLORS[state.aspect]}`}><Icon className="w-3.5 h-3.5" /></div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-serif text-foreground">{state.label}</span>
                                    <span className={`text-base font-mono font-bold ${probColor}`}>{state.probability}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex-1 h-1 bg-secondary/50 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700" style={{ width: `${state.probability}%` }} />
                                    </div>
                                    <div className={`flex items-center gap-0.5 ${TREND_COLORS[state.trend]}`}><TrendIcon className="w-3 h-3" /><span className="text-[9px]">{TREND_LABELS[state.trend]}</span></div>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {selectedAspect && (
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <QuantumCoherencePanel
                        contributions={buildCoherenceData(result, selectedAspect)}
                        selectedAspect={selectedAspect}
                        overallCoherence={result.overallCoherence}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Waveform */}
                <TabsContent value="waveform" className="mt-5 space-y-5">
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                    <h3 className="text-sm font-serif text-violet-300 mb-1"><Waves className="w-4 h-4 inline mr-1" />一生能量波形</h3>
                    <p className="text-[10px] text-muted-foreground mb-3">九大体系量子坍缩后的确定性能量曲线</p>
                    <QuantumWaveform timeline={waveformTimeline} height={280} />
                  </div>
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                    <h3 className="text-sm font-serif text-violet-300 mb-3">生命阶段能量</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {result.destinyPhases.map((p, i) => (
                        <div key={i} className="p-3 rounded-lg bg-card/30 border border-violet-500/10 text-center">
                          <div className="text-xs font-serif text-violet-200">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">{p.startAge}-{p.endAge}岁</div>
                          <div className={`text-xl font-mono font-bold mt-1 ${p.overallEnergy >= 65 ? 'text-emerald-400' : p.overallEnergy >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>{p.overallEnergy}</div>
                          <Badge variant="outline" className="text-[9px] mt-1 border-violet-500/20 text-violet-300/70">{p.element} · {p.theme}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Nine Systems */}
                <TabsContent value="systems" className="mt-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.systems.map(sys => (
                      <div key={sys.id} className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-serif text-violet-200">{sys.nameCN}</h4>
                          <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-300/70">{sys.origin} · {Math.round(sys.weight * 100)}%</Badge>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(sys.meta).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px]">
                              <span className="text-muted-foreground">{k}</span>
                              <span className="text-foreground truncate ml-2 max-w-[120px]">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <div className="text-[10px] text-muted-foreground mb-1">世界分支: <strong className="text-violet-300">{(result.branchesPerSystem[sys.id] || 0).toLocaleString()}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Tab: Entanglement */}
                <TabsContent value="entangle" className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                      <h3 className="text-sm font-serif text-violet-300 mb-3"><Network className="w-4 h-4 inline mr-1" />量子纠缠图</h3>
                      <QuantumEntanglementMap entanglements={result.entanglements} />
                    </div>
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4">
                      <h3 className="text-sm font-serif text-violet-300 mb-3">维度关联</h3>
                      <div className="space-y-2">
                        {result.entanglements.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).map((e, i) => {
                          const isPos = e.correlation > 0;
                          const strength = Math.abs(e.correlation);
                          return (
                            <div key={i} className="p-2.5 rounded-lg bg-card/30 border border-border/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-foreground">{QuantumPredictionEngine.getAspectLabel(e.aspectA)} ↔ {QuantumPredictionEngine.getAspectLabel(e.aspectB)}</span>
                                <Badge variant="outline" className={`text-[9px] ${isPos ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                                  {isPos ? '+' : ''}{(e.correlation * 100).toFixed(0)}%
                                </Badge>
                              </div>
                              <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${isPos ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${strength * 100}%` }} />
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-1">{e.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="space-y-3 pt-3 border-t border-violet-500/20">
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    H-Pulse量子预测系统综合全球九大命理体系（铁板神数·八字·紫微斗数·六爻·西方占星·吠陀占星·数字命理·玛雅历法·卡巴拉），
                    通过{result.totalWorldsGenerated.toLocaleString()}个平行世界的量子坍缩，收敛为唯一确定性命运轨迹。
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline"
                  className="w-full py-4 text-base font-serif tracking-wider border-violet-500/30 hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-300 group">
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />重新预测
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

function buildCoherenceData(result: QuantumPredictionResult, aspect: LifeAspect) {
  const contribs: Record<LifeAspect, { system: string; weight: number; rawScore: number; normalizedScore: number; detail: string }[]> = {} as Record<LifeAspect, { system: string; weight: number; rawScore: number; normalizedScore: number; detail: string }[]>;
  for (const a of QuantumPredictionEngine.getAllAspects()) {
    contribs[a] = result.systems.map(sys => ({
      system: sys.nameCN,
      weight: sys.weight,
      rawScore: sys.lifeVectors[a] ?? 50,
      normalizedScore: (sys.lifeVectors[a] ?? 50) / 100,
      detail: Object.entries(sys.meta).map(([k, v]) => `${k}:${v}`).join(' '),
    }));
  }
  return contribs;
}
