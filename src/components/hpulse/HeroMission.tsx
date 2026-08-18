import { Sparkles, Network, GitBranch } from 'lucide-react';
import { HolographicPanel } from './HolographicPanel';

export function HeroMission() {
  return (
    <HolographicPanel variant="ritual" innerPadding="lg" className="text-center">
      <p className="text-[10px] uppercase tracking-[0.45em] text-primary/70 font-mono mb-3">
        H-Pulse · Cultural Rule Analysis
      </p>
      <h1 className="text-2xl md:text-4xl font-serif text-gradient-gold tracking-[0.18em] leading-tight">
        H-Pulse 多体系文化规则分析
      </h1>
      <p className="mt-3 text-xs md:text-sm text-muted-foreground/85 font-sans max-w-2xl mx-auto leading-relaxed">
        将十三种传统文化规则按可追踪、可重复的方式分别计算与并列展示,
        <br className="hidden md:block" />
        明确标注缺失规则、来源等级与不确定性。
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Badge icon={<Network className="w-3 h-3" />} label="13 Rule Engines" />
        <Badge icon={<Sparkles className="w-3 h-3" />} label="Scenario Fusion" />
        <Badge icon={<GitBranch className="w-3 h-3" />} label="Auditable Trace" />
      </div>

      <p className="mt-5 text-[11px] text-muted-foreground/60 leading-relaxed max-w-2xl mx-auto font-sans border-t border-primary/15 pt-4">
        本系统提供文化研究、娱乐与自我反思用途的规则计算，不使用量子计算，
        也不声称能科学预测事件或生成唯一、必然的人生轨迹。
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
