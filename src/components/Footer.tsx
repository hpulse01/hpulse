export function Footer() {
  return (
    <footer className="mt-auto py-6 border-t border-border/30">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="text-center space-y-3">
          {/* Disclaimer */}
          <p className="text-muted-foreground text-sm leading-relaxed">
            本系统基于古籍《铁板神数》数学模型推演
          </p>
          <p className="text-muted-foreground/70 text-xs">
            结果仅供参考，请以理性态度看待
          </p>
          
          {/* Divider */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-px w-12 bg-border" />
            <span className="text-primary/50 text-xs">铁板神数</span>
            <div className="h-px w-12 bg-border" />
          </div>
          
          {/* Contact */}
          <p className="text-muted-foreground/60 text-xs">
            联系方式: <a href="mailto:001@hpulse.me" className="text-primary/70 hover:text-primary transition-colors">001@hpulse.me</a>
          </p>
          
          {/* Copyright */}
          <p className="text-muted-foreground/50 text-xs">
            © {new Date().getFullYear()} Iron Plate Destiny Engine
          </p>
        </div>
      </div>
    </footer>
  );
}
