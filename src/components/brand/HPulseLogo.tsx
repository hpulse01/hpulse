/**
 * H-Pulse brand logo.
 *
 * Minimal "H" mark with a single small pulse step in the crossbar.
 * Pure SVG, no dependencies, currentColor-driven so it inherits theme.
 */
import { cn } from '@/lib/utils';

type Variant = 'mark' | 'wordmark' | 'full';
type Size = 'sm' | 'md' | 'lg';
type Tone = 'light' | 'dark' | 'gold';

interface HPulseLogoProps {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  className?: string;
}

const SIZE_PX: Record<Size, { mark: number; text: string; gap: string }> = {
  sm: { mark: 18, text: 'text-sm',   gap: 'gap-1.5' },
  md: { mark: 24, text: 'text-base', gap: 'gap-2'   },
  lg: { mark: 36, text: 'text-2xl',  gap: 'gap-3'   },
};

const TONE_CLASS: Record<Tone, string> = {
  light: 'text-[#F5F2EA]',
  dark:  'text-[#111111]',
  gold:  'text-[hsl(var(--primary))]',
};

function HMark({ pixel, className }: { pixel: number; className?: string }) {
  // viewBox 24x24. H crossbar at y=12 with a tiny one-step pulse just left of center.
  return (
    <svg
      width={pixel}
      height={pixel}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Left vertical */}
      <line x1="5" y1="4" x2="5" y2="20" />
      {/* Right vertical */}
      <line x1="19" y1="4" x2="19" y2="20" />
      {/* Crossbar with a single small pulse step near the middle */}
      <polyline points="5,12 10,12 11.5,9.5 13,14.5 14.5,12 19,12" />
    </svg>
  );
}

export function HPulseLogo({
  variant = 'full',
  size = 'md',
  tone = 'light',
  className,
}: HPulseLogoProps) {
  const dims = SIZE_PX[size];
  const toneClass = TONE_CLASS[tone];

  if (variant === 'mark') {
    return (
      <span
        role="img"
        aria-label="H-Pulse"
        className={cn('inline-flex items-center justify-center', toneClass, className)}
      >
        <HMark pixel={dims.mark} />
      </span>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span
        role="img"
        aria-label="H-Pulse"
        className={cn(
          'inline-flex items-baseline font-sans font-medium tracking-[0.18em]',
          dims.text,
          toneClass,
          className,
        )}
      >
        <span>H</span>
        <span aria-hidden="true" className="px-[0.15em] text-[hsl(var(--primary))] opacity-90">·</span>
        <span>Pulse</span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="H-Pulse"
      className={cn('inline-flex items-center', dims.gap, toneClass, className)}
    >
      <HMark pixel={dims.mark} />
      <span
        className={cn(
          'inline-flex items-baseline font-sans font-medium tracking-[0.18em] leading-none',
          dims.text,
        )}
      >
        <span>H</span>
        <span aria-hidden="true" className="px-[0.15em] text-[hsl(var(--primary))] opacity-90">·</span>
        <span>Pulse</span>
      </span>
    </span>
  );
}

export default HPulseLogo;
