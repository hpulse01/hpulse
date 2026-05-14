import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HolographicPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'ritual';
  glow?: boolean;
  innerPadding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-8',
};

export function HolographicPanel({
  children,
  variant = 'default',
  glow = false,
  innerPadding = 'md',
  className,
  ...rest
}: HolographicPanelProps) {
  return (
    <div
      {...rest}
      className={cn(
        'relative rounded-2xl border backdrop-blur-xl overflow-hidden',
        'border-primary/15 bg-card/55',
        variant === 'elevated' && 'border-primary/25 bg-card/70 shadow-[0_8px_40px_-12px_hsl(40_65%_55%_/_0.18)]',
        variant === 'ritual' &&
          'border-primary/30 bg-gradient-to-br from-card/80 via-card/60 to-card/40 shadow-[0_12px_60px_-20px_hsl(40_65%_55%_/_0.35)]',
        glow && 'animate-pulse-glow',
        PADDING[innerPadding],
        className,
      )}
    >
      {/* Inner luminous border */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, hsl(40 65% 55% / 0.08), transparent 60%)',
        }}
      />
      {/* Top gold hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-6 right-6 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(40 65% 55% / 0.5), transparent)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default HolographicPanel;
