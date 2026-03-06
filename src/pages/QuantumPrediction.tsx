import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
} from '@/utils/quantumPredictionEngine';
import { TiebanEngine } from '@/utils/tiebanAlgorithm';
import {
  Atom, ArrowLeft, RotateCcw, Sparkles, TrendingUp,
  TrendingDown, Minus, Zap, Waves, Network, BarChart3,
  Briefcase, Coins, Heart, Activity, Brain, Users,
  Palette, Star,
} from 'lucide-react';

// ─────────────────────────────────────
// Constants
// ─────────────────────────────────────

type AppStep = 'input' | 'calculating' | 'result';

const ASPECT_ICONS: Record<LifeAspect, typeof Star> = {
  career: Briefcase,
  wealth: Coins,
  love: Heart,
  health: Activity,
  wisdom: Brain,
  social: Users,
  creativity: Palette,
  fortune: Star,
};

const ASPECT_COLORS: Record<LifeAspect, string> = {
  career: 'text-amber-400',
  wealth: 'text-emerald-400',
  love: 'text-rose-400',
  health: 'text-purple-400',
  wisdom: 'text-blue-400',
  social: 'text-cyan-400',
  creativity: 'text-pink-400',
  fortune: 'text-yellow-400',
};

const TREND_ICONS = {
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

const TREND_COLORS = {
  rising: 'text-emerald-400',
  stable: 'text-slate-400',
  declining: 'text-rose-400',
};

const TREND_LABELS = {
  rising: '上升',
  stable: '平稳',
  declining: '下行',
};

// ─────────────────────────────────────
// Input Form
// ─────────────────────────────────────

function QuantumInputForm({ onSubmit, isLoading }: { onSubmit: (d: QuantumInput) => void; isLoading: boolean }) {
  const [form, setForm] = useState<QuantumInput>({
    year: 1990, month: 1, day: 1, hour: 12, minute: 0, gender: 'male',
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const chineseHour = TiebanEngine.getChineseHour(form.hour);

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSubmit(form); }}
      className="space-y-6"
    >
      <div className="text-center border-b border-violet-500/30 pb-4">
        <h2 className="text-2xl font-serif text-violet-300 tracking-wider flex items-center justify-center gap-2">
          <Atom className="w-6 h-6 text-violet-400 animate-spin" style={{ animationDuration: '8s' }} />
          量子态初始化
        </h2>
        <p className="text-muted-foreground text-sm mt-2">输入阳历生辰以构建量子预测模型</p>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生日期</Label>
        <div className="grid grid-cols-3 gap-3">
          <Select value={form.year.toString()} onValueChange={v => setForm({ ...form, year: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20 hover:border-violet-500/50"><SelectValue placeholder="年" /></SelectTrigger>
            <SelectContent className="max-h-60">{years.map(y => <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.month.toString()} onValueChange={v => setForm({ ...form, month: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20 hover:border-violet-500/50"><SelectValue placeholder="月" /></SelectTrigger>
            <SelectContent>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <SelectItem key={m} value={m.toString()}>{m}月</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.day.toString()} onValueChange={v => setForm({ ...form, day: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20 hover:border-violet-500/50"><SelectValue placeholder="日" /></SelectTrigger>
            <SelectContent className="max-h-60">{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <SelectItem key={d} value={d.toString()}>{d}日</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80 text-sm">出生时间</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.hour.toString()} onValueChange={v => setForm({ ...form, hour: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20 hover:border-violet-500/50"><SelectValue placeholder="时" /></SelectTrigger>
            <SelectContent className="max-h-60">{Array.from({ length: 24 }, (_, i) => i).map(h => <SelectItem key={h} value={h.toString()}>{h.toString().padStart(2, '0')}时</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.minute.toString()} onValueChange={v => setForm({ ...form, minute: +v })}>
            <SelectTrigger className="bg-secondary border-violet-500/20 hover:border-violet-500/50"><SelectValue placeholder="分" /></SelectTrigger>
            <SelectContent className="max-h-60">{Array.from({ length: 60 }, (_, i) => i).map(m => <SelectItem key={m} value={m.toString()}>{m.toString().padStart(2, '0')}分</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="text-center py-1.5 bg-violet-500/10 rounded border border-violet-500/20">
          <span className="text-muted-foreground text-sm">时辰: </span>
          <span className="text-violet-300 font-medium">{chineseHour}</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground/80 text-sm">性别</Label>
        <RadioGroup value={form.gender} onValueChange={v => setForm({ ...form, gender: v as 'male' | 'female' })} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="q-male" className="border-violet-500 text-violet-400" />
            <Label htmlFor="q-male" className="cursor-pointer hover:text-violet-300 transition-colors">乾命 (男)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="q-female" className="border-violet-500 text-violet-400" />
            <Label htmlFor="q-female" className="cursor-pointer hover:text-violet-300 transition-colors">坤命 (女)</Label>
          </div>
        </RadioGroup>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
                   text-white py-6 text-lg font-serif tracking-widest transition-all duration-300
                   hover:shadow-lg hover:shadow-violet-500/30"
      >
        {isLoading ? <span className="animate-pulse">量子推演中...</span> : '启动量子预测'}
      </Button>
    </form>
  );
}

// ─────────────────────────────────────
// Aspect Card
// ─────────────────────────────────────

function AspectCard({
  state,
  isSelected,
  onClick,
}: {
  state: import('@/utils/quantumPredictionEngine').QuantumState;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = ASPECT_ICONS[state.aspect];
  const TrendIcon = TREND_ICONS[state.trend];
  const color = ASPECT_COLORS[state.aspect];
  const trendColor = TREND_COLORS[state.trend];

  const probColor =
    state.probability >= 70 ? 'text-emerald-400' :
    state.probability >= 45 ? 'text-amber-300' :
    'text-rose-400';

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg border transition-all duration-300
        ${isSelected
          ? 'bg-violet-500/15 border-violet-500/50 ring-1 ring-violet-500/30 shadow-lg shadow-violet-500/10'
          : 'bg-card/30 border-border/30 hover:border-violet-500/30 hover:bg-violet-500/5'}
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-serif text-foreground">{state.label}</span>
            <span className={`text-lg font-mono font-bold ${probColor}`}>{state.probability}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-1000"
                style={{ width: `${state.probability}%` }}
              />
            </div>
            <div className={`flex items-center gap-0.5 ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span className="text-[10px]">{TREND_LABELS[state.trend]}</span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────
// Main Page
// ─────────────────────────────────────

export default function QuantumPrediction() {
  const [step, setStep] = useState<AppStep>('input');
  const [result, setResult] = useState<QuantumPredictionResult | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<LifeAspect | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleSubmit = useCallback(async (input: QuantumInput) => {
    setStep('calculating');
    await new Promise(r => setTimeout(r, 2200));
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
    setActiveTab('overview');
  }, []);

  const sortedStates = useMemo(() => {
    if (!result) return [];
    return [...result.states].sort((a, b) => b.probability - a.probability);
  }, [result]);

  const topAspect = sortedStates[0];
  const bottomAspect = sortedStates[sortedStates.length - 1];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="py-4 md:py-6 border-b border-violet-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/30 via-transparent to-purple-950/30" />
        <div className="container max-w-4xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-violet-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">铁板神数</span>
            </Link>
            <div className="text-center">
              <h1 className="text-2xl md:text-4xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 tracking-[0.15em]">
                H-Pulse
              </h1>
              <p className="text-muted-foreground text-[10px] md:text-xs tracking-wider mt-0.5">
                Quantum Destiny Prediction System
              </p>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 py-6 md:py-10 relative">
        <div className={`container mx-auto px-4 ${step === 'result' ? 'max-w-5xl' : 'max-w-xl'}`}>
          {/* Input Step */}
          {step === 'input' && (
            <div className="relative">
              <div className="absolute inset-0 -z-10 opacity-30 rounded-xl overflow-hidden" style={{ height: '100%' }}>
                <QuantumField energy={30} dominantElement="金" />
              </div>
              <div className="bg-card/60 backdrop-blur-sm border border-violet-500/20 rounded-xl p-6 md:p-8 shadow-2xl shadow-violet-950/30">
                <QuantumInputForm onSubmit={handleSubmit} isLoading={false} />
              </div>
            </div>
          )}

          {/* Calculating Step */}
          {step === 'calculating' && (
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <QuantumField energy={80} dominantElement="水" />
              </div>
              <div className="relative bg-card/40 backdrop-blur-sm border border-violet-500/30 rounded-xl p-12 shadow-2xl">
                <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <Atom className="w-16 h-16 text-violet-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-serif text-violet-300 tracking-wider">量子态坍缩中...</p>
                    <p className="text-sm text-muted-foreground">
                      Collapsing Quantum States from 4 Systems
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    {['铁板', '八字', '紫微', '六爻'].map((sys, i) => (
                      <Badge
                        key={sys}
                        variant="outline"
                        className="text-xs border-violet-500/30 text-violet-300 animate-pulse"
                        style={{ animationDelay: `${i * 300}ms` }}
                      >
                        {sys}
                      </Badge>
                    ))}
                  </div>
                  <div className="w-48 mx-auto h-1 bg-violet-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && result && (
            <div className="space-y-6">
              {/* Quantum Signature Header */}
              <div className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 z-0">
                  <QuantumField energy={result.overallCoherence * 100} dominantElement={result.dominantElement} />
                </div>
                <div className="relative z-10 bg-gradient-to-b from-card/70 via-card/50 to-card/70 backdrop-blur-sm border border-violet-500/20 rounded-xl p-6 md:p-8">
                  <div className="text-center space-y-3">
                    <h2 className="text-2xl md:text-3xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 tracking-wider">
                      量子预测报告
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline" className="text-xs border-violet-500/40 text-violet-300 font-mono">
                        {result.quantumSignature}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                      <span>共振度: <strong className="text-violet-300">{Math.round(result.overallCoherence * 100)}%</strong></span>
                      <span>主导五行: <strong className="text-violet-300">{result.dominantElement}</strong></span>
                      <span>日主: <strong className="text-violet-300">{result.baziProfile.dayMaster}({result.baziProfile.dayMasterElement})</strong></span>
                    </div>

                    {/* Quick Summary */}
                    {topAspect && bottomAspect && (
                      <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          最强: {topAspect.label} ({topAspect.probability})
                        </Badge>
                        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          待提升: {bottomAspect.label} ({bottomAspect.probability})
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 bg-violet-950/30 border border-violet-500/20 h-auto">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <BarChart3 className="w-3.5 h-3.5 mr-1 hidden sm:inline" />量子总览
                  </TabsTrigger>
                  <TabsTrigger value="waveform" className="text-xs sm:text-sm py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Waves className="w-3.5 h-3.5 mr-1 hidden sm:inline" />能量波形
                  </TabsTrigger>
                  <TabsTrigger value="entangle" className="text-xs sm:text-sm py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Network className="w-3.5 h-3.5 mr-1 hidden sm:inline" />量子纠缠
                  </TabsTrigger>
                  <TabsTrigger value="detail" className="text-xs sm:text-sm py-2 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300">
                    <Zap className="w-3.5 h-3.5 mr-1 hidden sm:inline" />系统解析
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Quantum Overview */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar */}
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6 flex flex-col items-center">
                      <h3 className="text-sm font-serif text-violet-300 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        量子态势场
                      </h3>
                      <QuantumRadar states={result.states} size={280} />
                    </div>

                    {/* Aspect List */}
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                      <h3 className="text-sm font-serif text-violet-300 mb-4">八维量子态</h3>
                      <div className="space-y-2">
                        {sortedStates.map(state => (
                          <AspectCard
                            key={state.aspect}
                            state={state}
                            isSelected={selectedAspect === state.aspect}
                            onClick={() => setSelectedAspect(
                              selectedAspect === state.aspect ? null : state.aspect
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Coherence Panel (shown when aspect selected) */}
                  {selectedAspect && (
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <QuantumCoherencePanel
                        contributions={result.systemContributions}
                        selectedAspect={selectedAspect}
                        overallCoherence={result.overallCoherence}
                      />
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Waveform */}
                <TabsContent value="waveform" className="mt-6 space-y-6">
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-sm font-serif text-violet-300 mb-1 flex items-center gap-2">
                      <Waves className="w-4 h-4" />
                      一生能量波形图
                    </h3>
                    <p className="text-[10px] text-muted-foreground mb-4">
                      综合四大预测系统的量子能量在各年龄段的波动曲线
                    </p>
                    <QuantumWaveform timeline={result.timeline} height={260} />
                  </div>

                  {/* Timeline Details */}
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-sm font-serif text-violet-300 mb-4">关键年龄节点</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {result.timeline
                        .filter((_, i) => i % 5 === 0 || result.timeline[i].isCurrentAge)
                        .map(t => (
                          <div
                            key={t.age}
                            className={`
                              p-2.5 rounded-lg border text-center transition-all
                              ${t.isCurrentAge
                                ? 'bg-violet-500/20 border-violet-500/50 ring-1 ring-violet-500/30'
                                : 'bg-card/30 border-border/30'}
                            `}
                          >
                            <div className="text-lg font-serif text-foreground">{t.age}<span className="text-xs text-muted-foreground ml-0.5">岁</span></div>
                            <div className="text-[10px] text-muted-foreground">{t.year} · {t.ganZhi}</div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                t.energy >= 65 ? 'bg-emerald-400' :
                                t.energy >= 40 ? 'bg-amber-400' :
                                'bg-rose-400'
                              }`} />
                              <span className={`text-xs font-mono ${
                                t.energy >= 65 ? 'text-emerald-400' :
                                t.energy >= 40 ? 'text-amber-400' :
                                'text-rose-400'
                              }`}>{t.energy}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] mt-1 border-violet-500/20 text-violet-300/70">
                              {t.element} · {t.phase}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Entanglement */}
                <TabsContent value="entangle" className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                      <h3 className="text-sm font-serif text-violet-300 mb-4 flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        量子纠缠态势图
                      </h3>
                      <QuantumEntanglementMap entanglements={result.entanglements} />
                    </div>

                    <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                      <h3 className="text-sm font-serif text-violet-300 mb-4">维度关联分析</h3>
                      <div className="space-y-3">
                        {result.entanglements
                          .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                          .map((e, i) => {
                            const isPositive = e.correlation > 0;
                            const strength = Math.abs(e.correlation);
                            return (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-card/30 border border-border/20"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-foreground">
                                    {QuantumPredictionEngine.getAspectLabel(e.aspectA)}
                                    {' ↔ '}
                                    {QuantumPredictionEngine.getAspectLabel(e.aspectB)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      isPositive ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
                                    }`}
                                  >
                                    {isPositive ? '+' : ''}{(e.correlation * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                                <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${strength * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{e.description}</p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: System Detail */}
                <TabsContent value="detail" className="mt-6 space-y-6">
                  {/* BaZi */}
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-sm font-serif text-violet-300 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      八字命理系统
                    </h3>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {([
                        ['年柱', result.baziProfile.pillars.year],
                        ['月柱', result.baziProfile.pillars.month],
                        ['日柱', result.baziProfile.pillars.day],
                        ['时柱', result.baziProfile.pillars.time],
                      ] as const).map(([label, gz]) => (
                          <div key={label} className="text-center p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                            <span className="text-[10px] text-muted-foreground">{label}</span>
                            <div className="text-lg font-serif text-violet-200 mt-0.5">{gz}</div>
                          </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">日主: </span>
                        <span className="text-foreground">{result.baziProfile.dayMaster} ({result.baziProfile.dayMasterElement})</span>
                      </div>
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">身强弱: </span>
                        <span className="text-foreground">{result.baziProfile.strength}</span>
                      </div>
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">喜用: </span>
                        <span className="text-emerald-400">{result.baziProfile.favorableElements.join('、')}</span>
                      </div>
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">忌神: </span>
                        <span className="text-rose-400">{result.baziProfile.unfavorableElements.join('、')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ziwei */}
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-sm font-serif text-violet-300 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-violet-400" />
                      紫微斗数系统
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">命宫: </span>
                        <span className="text-foreground">{result.ziweiReport.mingGong}</span>
                      </div>
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">身宫: </span>
                        <span className="text-foreground">{result.ziweiReport.shenGong}</span>
                      </div>
                      <div className="p-2 bg-secondary/20 rounded">
                        <span className="text-muted-foreground">五行局: </span>
                        <span className="text-foreground">{result.ziweiReport.wuxingju.name}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-xs text-muted-foreground">四化: </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {result.ziweiReport.sihua.map((sh, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className={`text-[10px] ${
                              sh.transform === '禄' ? 'border-emerald-500/30 text-emerald-400' :
                              sh.transform === '权' ? 'border-amber-500/30 text-amber-400' :
                              sh.transform === '科' ? 'border-blue-500/30 text-blue-400' :
                              'border-rose-500/30 text-rose-400'
                            }`}
                          >
                            {sh.star}化{sh.transform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Liu Yao */}
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-sm font-serif text-violet-300 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      六爻卦象系统
                    </h3>
                    <div className="flex items-start gap-4">
                      <div className="text-center">
                        <div className="text-4xl mb-1">{result.liuYaoResult.mainHexagram.symbol}</div>
                        <span className="text-sm font-serif text-foreground">{result.liuYaoResult.mainHexagram.name}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-2">{result.liuYaoResult.mainHexagram.description}</p>
                        <div className="space-y-0.5">
                          {[...result.liuYaoResult.mainHexagram.lines].reverse().map(line => (
                            <div key={line.position} className="flex items-center gap-2 text-xs">
                              <span className="w-14 text-center font-mono text-muted-foreground">
                                {line.yinYang === 'yang' ? '▅▅▅▅▅' : '▅▅ ▅▅'}
                              </span>
                              {line.isChanging && <span className="text-amber-400 text-[10px]">○</span>}
                              <span className="text-muted-foreground">{line.branch}{line.relative}</span>
                            </div>
                          ))}
                        </div>
                        {result.liuYaoResult.mainHexagram.targetHexagram && (
                          <p className="text-xs text-violet-300 mt-2">
                            变卦: {result.liuYaoResult.mainHexagram.targetHexagram.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 p-2 bg-secondary/20 rounded">
                      {result.liuYaoResult.interpretation}
                    </p>
                  </div>

                  {/* Full Coherence Panel */}
                  <div className="bg-card/40 border border-violet-500/20 rounded-xl p-4 md:p-6">
                    <h3 className="text-sm font-serif text-violet-300 mb-4">四系综合共振分析</h3>
                    <QuantumCoherencePanel
                      contributions={result.systemContributions}
                      selectedAspect={selectedAspect || 'fortune'}
                      overallCoherence={result.overallCoherence}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-border/20">
                      {QuantumPredictionEngine.getAllAspects().map(asp => (
                        <Button
                          key={asp}
                          variant={selectedAspect === asp ? 'default' : 'outline'}
                          size="sm"
                          className={`text-[10px] h-7 px-2 ${
                            selectedAspect === asp
                              ? 'bg-violet-600 hover:bg-violet-500'
                              : 'border-violet-500/20 hover:border-violet-500/40'
                          }`}
                          onClick={() => setSelectedAspect(asp)}
                        >
                          {QuantumPredictionEngine.getAspectLabel(asp)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="space-y-3 pt-4 border-t border-violet-500/20">
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    H-Pulse量子预测系统综合铁板神数、八字命理、紫微斗数、六爻卦象四大体系，
                    通过量子态叠加与坍缩模型生成概率预测，仅供参考。
                  </p>
                </div>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full py-4 text-base font-serif tracking-wider border-violet-500/30
                             hover:border-violet-500 hover:bg-violet-500/10 transition-all duration-300 group"
                >
                  <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  重新预测
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
