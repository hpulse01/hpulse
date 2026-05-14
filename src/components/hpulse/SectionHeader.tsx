import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  titleZh: string;
  titleEn?: string;
  description?: string;
  icon?: ReactNode;
  right?: ReactNode;
  className?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  titleZh,
  titleEn,
  description,
  icon,
  right,
  className,
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-between gap-4 pb-3 border-b border-primary/15',
        align === 'center' && 'flex-col items-center text-center border-b-0 pb-0',
        className,
      )}
    >
      <div className={cn('space-y-1', align === 'center' && 'mx-auto')}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary/80">{icon}</span>}
          <h3 className="text-base md:text-lg font-serif text-gradient-gold tracking-[0.18em]">
            {titleZh}
          </h3>
        </div>
        {titleEn && (
          <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/60 font-mono">
            {titleEn}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground/80 font-sans leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export default SectionHeader;
