import { useI18n } from '@/hooks/useI18n';
import { Link } from 'react-router-dom';
import { PublicSupportContact } from '@/components/legal/PublicSupportContact';

export function Footer() {
  const { t } = useI18n();

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
            Cultural Rule Analysis System · {t('footer.desc')}
          </p>
          <p className="text-muted-foreground/30 text-[10px] font-sans">
            联系方式：<PublicSupportContact className="hover:text-primary/50 transition-colors" />
            <span className="mx-2">·</span>
            © {new Date().getFullYear()} H-Pulse
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">隐私政策</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">使用条款</Link>
            <Link to="/account-deletion" className="hover:text-primary transition-colors">删除账户</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
