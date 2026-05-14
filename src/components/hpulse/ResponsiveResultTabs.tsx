import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ResponsiveTabDef {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface Props {
  tabs: ResponsiveTabDef[];
  value: string;
  onValueChange: (v: string) => void;
  children?: ReactNode;
}

/**
 * ResponsiveResultTabs — horizontally scrollable tab strip on every
 * viewport. Caller renders TabsContent inside `children`.
 */
export function ResponsiveResultTabs({ tabs, value, onValueChange, children }: Props) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-thin">
        <TabsList className="inline-flex w-auto min-w-full bg-card/40 border border-primary/15 h-auto p-1 rounded-xl gap-1">
          {tabs.map(t => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="text-[11px] sm:text-xs py-2 px-3 rounded-lg font-sans whitespace-nowrap data-[state=active]:bg-primary/15 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_12px_hsl(40_65%_55%_/_0.25)] data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"
            >
              {t.icon && <span className="mr-1.5 inline-flex">{t.icon}</span>}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
