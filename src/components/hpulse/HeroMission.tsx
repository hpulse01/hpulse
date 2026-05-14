import { Sparkles, Atom, GitBranch } from 'lucide-react';
import { HolographicPanel } from './HolographicPanel';

export function HeroMission() {
  return (
    <HolographicPanel variant="ritual" innerPadding="lg" className="text-center">
      <p className="text-[10px] uppercase tracking-[0.45em] text-primary/70 font-mono mb-3">
        H-Pulse · Quantum Prediction System
      </p>
      <h1 className="text-2xl md:text-4xl font-serif text-gradient-gold tracking-[0.18em] leading-tight">
        H-Pulse 量子预测系统
      </h1>
      <p className="mt-3 text-xs md:text-sm text-muted-foreground/85 font-sans max-w-2xl mx-auto leading-relaxed">
        以多体系命运引擎、量子世界树与路径坍缩模型,
        <br className="hidden md:block" />
        推演个体唯一生命轨迹。
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Badge icon={<Atom className="w-3 h-3" />} label="13 Engines" />
        <Badge icon={<Sparkles className="w-3 h-3" />} label="Quantum Collapse" />
        <Badge icon={<GitBranch className="w-3 h-3" />} label="Unified Fate Vector" />
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground/60 leading-relaxed max-w-2xl mx-auto font-sans border-t border-primary/15 pt-4">
        本系统不是娱乐抽签,而是将出生时空、传统命理结构、跨体系引擎与概率坍缩模型统一编排,
        生成可追踪的生命轨迹报告。
      </p>
    </HolographicPanel>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/25 bg-primary/[0.06] text-[10px] uppercase tracking-[0.25em] text-primary/85 font-mono">
      {icon}
      {label}
    </span>
  );
}

export default HeroMission;
