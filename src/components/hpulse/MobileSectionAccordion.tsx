import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * MobileSectionAccordion — collapsible section for mobile viewports.
 * Keeps long traces / tables off-screen until tapped.
 */
export function MobileSectionAccordion({ title, subtitle, defaultOpen = false, children, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cn('rounded-lg border border-primary/15 bg-card/30 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-primary/[0.04]"
      >
        <span className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="w-4 h-4 text-primary/85 shrink-0" /> : <ChevronRight className="w-4 h-4 text-primary/65 shrink-0" />}
          <span className="min-w-0">
            <span className="block text-sm font-serif tracking-wider truncate">{title}</span>
            {subtitle && <span className="block text-[10px] font-mono text-muted-foreground/70 truncate">{subtitle}</span>}
          </span>
        </span>
      </button>
      {open && <div className="border-t border-primary/10 p-3">{children}</div>}
    </section>
  );
}
