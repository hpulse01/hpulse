export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/20">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-primary/20" />
            <span className="text-primary/40 text-xs font-serif tracking-[0.3em]">H-PULSE</span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-primary/20" />
          </div>
          <p className="text-muted-foreground/40 text-[10px] font-sans leading-relaxed max-w-md mx-auto">
            Quantum Destiny Prediction System · 十三大命理体系量子预测
          </p>
          <p className="text-muted-foreground/30 text-[10px] font-sans">
            <a href="mailto:001@hpulse.me" className="hover:text-primary/50 transition-colors">001@hpulse.me</a>
            <span className="mx-2">·</span>
            © {new Date().getFullYear()} H-Pulse
          </p>
        </div>
      </div>
    </footer>
  );
}
