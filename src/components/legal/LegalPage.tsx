import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';

interface LegalPageProps {
  title: string;
  description: string;
  path: string;
  children: ReactNode;
}

export function LegalPage({ title, description, path, children }: LegalPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={`${title} · H-Pulse`} description={description} path={path} />
      <AppHeader variant="subpage" />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-serif text-primary">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">生效日期：2026 年 8 月 17 日</p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-foreground/85">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-serif text-foreground">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}
