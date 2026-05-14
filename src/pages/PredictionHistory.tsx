import { Link } from 'react-router-dom';
import { ArrowLeft, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HolographicPanel } from '@/components/hpulse/HolographicPanel';
import { Footer } from '@/components/Footer';
import { HPulseLogo } from '@/components/brand';

const PredictionHistory = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background bg-scroll-texture">
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

      <main className="flex-1 py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <HolographicPanel variant="ritual" innerPadding="lg" className="text-center">
            <Archive className="w-10 h-10 mx-auto text-primary/70 mb-4" />
            <h2 className="text-xl font-serif text-gradient-gold tracking-[0.18em]">
              Prediction Ledger
            </h2>
            <p className="mt-3 text-sm text-muted-foreground/85 font-sans">
              预测档案将在验证账本模块中启用。
            </p>
            <p className="mt-2 text-[11px] text-muted-foreground/55 font-mono uppercase tracking-[0.25em]">
              Module · Pending Activation
            </p>
            <div className="mt-6">
              <Button asChild variant="outline" className="border-primary/30 hover:border-primary/60">
                <Link to="/">返回控制台</Link>
              </Button>
            </div>
          </HolographicPanel>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PredictionHistory;
