import { Target, AlertTriangle, ArrowRight } from 'lucide-react';

export interface ClauseLookupItem {
  requestedClauseNumber?: number;
  matchedClauseNumber?: number | null;
  exactMatch?: boolean;
  fallbackUsed?: boolean;
  fallbackDistance?: number | null;
  fallbackReason?: string;
  source?: string;
  content?: string;
  confidence?: number;
  warnings?: string[];
  sectionName?: string;
}

interface Props {
  items: ClauseLookupItem[];
  title?: string;
}

/**
 * ClauseLookupPanel — exact / fallback / unavailable visual differentiation.
 * exact = jade green; fallback = amber; unavailable = dim red.
 */
export function ClauseLookupPanel({ items, title = '条文映射 · Clause Lookup' }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无条文映射数据 / No clause lookup data.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">{title}</div>
      <ul className="space-y-2">
        {items.map((m, i) => {
          const status = matchStatus(m);
          const sty = STYLES[status];
          return (
            <li key={i} className={`rounded-md border ${sty.border} ${sty.bg} px-3 py-2.5`}>
              <div className="flex items-center gap-2 flex-wrap">
                {sty.icon}
                {m.sectionName && <span className="text-[11px] font-serif tracking-wider text-foreground/90">{m.sectionName}</span>}
                <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${sty.label}`}>{sty.text}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground/85 tabular-nums">
                  请求 #{m.requestedClauseNumber ?? '—'}
                  <ArrowRight className="inline w-3 h-3 mx-1 opacity-60" />
                  命中 #{m.matchedClauseNumber ?? '—'}
                  {m.fallbackDistance != null && m.fallbackDistance > 0 && (
                    <span className="ml-1 text-amber-300/80">±{m.fallbackDistance}</span>
                  )}
                </span>
              </div>
              {m.fallbackReason && m.fallbackReason !== 'EXACT' && (
                <div className="mt-1 text-[10px] font-mono text-amber-300/75">回退原因 · {m.fallbackReason}</div>
              )}
              {m.content && (
                <blockquote className="mt-2 pl-3 border-l-2 border-primary/30 text-[11px] font-serif tracking-wider text-foreground/85 leading-relaxed whitespace-pre-line">
                  {m.content}
                </blockquote>
              )}
              {m.source && <div className="mt-1 text-[9px] font-mono text-muted-foreground/55 uppercase tracking-[0.2em]">source · {m.source}</div>}
              {m.warnings && m.warnings.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {m.warnings.map((w, j) => (
                    <li key={j} className="text-[10px] font-mono text-amber-300/85 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type Status = 'exact' | 'fallback' | 'unavailable';
function matchStatus(m: ClauseLookupItem): Status {
  if (m.exactMatch && m.matchedClauseNumber != null) return 'exact';
  if (m.matchedClauseNumber != null) return 'fallback';
  return 'unavailable';
}
const STYLES: Record<Status, { border: string; bg: string; label: string; text: string; icon: JSX.Element }> = {
  exact: {
    border: 'border-emerald-400/40',
    bg: 'bg-emerald-400/[0.05]',
    label: 'text-emerald-300',
    text: 'EXACT · 精确命中',
    icon: <Target className="w-3.5 h-3.5 text-emerald-300" />,
  },
  fallback: {
    border: 'border-amber-400/40',
    bg: 'bg-amber-400/[0.05]',
    label: 'text-amber-300',
    text: 'FALLBACK · 邻近回退',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />,
  },
  unavailable: {
    border: 'border-destructive/45',
    bg: 'bg-destructive/[0.06]',
    label: 'text-destructive',
    text: 'UNAVAILABLE · 暂无条文',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-destructive" />,
  },
};
