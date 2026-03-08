export function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-violet-500/20">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm leading-relaxed">
            H-Pulse 量子命运预测系统
          </p>
          <p className="text-muted-foreground/70 text-xs">
            综合九大命理体系 · 铁板神数考刻校准 · 量子坍缩确定性预测
          </p>
          
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-px w-12 bg-violet-500/30" />
            <span className="text-violet-300/50 text-xs font-serif">H-Pulse</span>
            <div className="h-px w-12 bg-violet-500/30" />
          </div>
          
          <p className="text-muted-foreground/60 text-xs">
            联系方式: <a href="mailto:001@hpulse.me" className="text-violet-300/70 hover:text-violet-300 transition-colors">001@hpulse.me</a>
          </p>
          
          <p className="text-muted-foreground/50 text-xs">
            © {new Date().getFullYear()} H-Pulse Quantum Destiny System
          </p>
        </div>
      </div>
    </footer>
  );
}
