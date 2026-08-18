import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { UserMenu } from '@/components/UserMenu';
import { SystemStatusBar } from '@/components/hpulse/SystemStatusBar';
import { HPulseLogo } from '@/components/brand';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useI18n } from '@/hooks/useI18n';

interface AppHeaderProps {
  /** 'console': full header with status bar + nav. 'subpage': logo + back button. */
  variant?: 'console' | 'subpage';
  clauseCount?: number | null;
}

export function AppHeader({ variant = 'console', clauseCount = null }: AppHeaderProps) {
  const { isSuperAdmin } = useAdminAccess();
  const { t } = useI18n();

  if (variant === 'subpage') {
    return (
      <header className="border-b border-border/40">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" aria-label="H-Pulse">
            <HPulseLogo variant="full" size="md" tone="light" />
          </Link>
          <Button asChild variant="outline" size="sm" className="border-border/40">
            <Link to="/">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              返回控制台
            </Link>
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="relative border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-30">
      <div className="container max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 group" aria-label="H-Pulse">
            <HPulseLogo variant="full" size="md" tone="light" className="shrink-0" />
            <span className="hidden md:inline text-[9px] uppercase tracking-[0.32em] text-muted-foreground/55 font-mono border-l border-border/40 pl-3 ml-1 truncate">
              Cultural Rule Analysis
            </span>
          </Link>

          <div className="hidden lg:flex">
            <SystemStatusBar clauseCount={clauseCount} />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" size="sm" className="h-9 px-2 hidden sm:inline-flex">
              <Link to="/prediction-history">
                <Archive className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden md:inline text-xs">预测档案</span>
              </Link>
            </Button>
            {isSuperAdmin && (
              <Button asChild variant="ghost" size="sm" className="h-9 px-2 hidden md:inline-flex">
                <Link to="/admin-users">
                  <Shield className="w-3.5 h-3.5 mr-1.5 text-accent" />
                  <span className="text-xs">Admin</span>
                </Link>
              </Button>
            )}
            <UserMenu />
          </div>
        </div>
        <div className="lg:hidden mt-2 flex justify-center">
          <SystemStatusBar clauseCount={clauseCount} />
        </div>
        {clauseCount === 0 && isSuperAdmin && (
          <div className="mt-2 text-center">
            <span className="text-accent/80 text-[10px] font-mono">
              {t('admin.clause_empty')} →{' '}
              <Link to="/admin-import" className="underline hover:text-accent">
                {t('admin.import')}
              </Link>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
