import { formatPercent, formatScore } from '@/utils/displayFormat';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { ClauseLookupPanel, type ClauseLookupItem } from './ClauseLookupPanel';

export interface DestinySectionView {
  sectionKey: string;
  sectionName: string;
  palace?: string;
  requestedClauseNumber?: number;
  matchedClauseNumber?: number | null;
  exactMatch?: boolean;
  fallbackUsed?: boolean;
  fallbackDistance?: number | null;
  fallbackReason?: string;
  content?: string;
  interpretation?: string;
  confidence?: number;
  sensitiveFlags?: string[];
}

interface Props {
  sections: DestinySectionView[];
}

const SENSITIVE_KEYS = new Set(['health', 'disaster', 'children']);
const ORDER = ['overview', 'marriage', 'wealth', 'career', 'health', 'children', 'parents', 'migration', 'disaster'];

/** TiebanDestinySections — 9 报告分区,sensitive ones default-collapsed in dim red. */
export function TiebanDestinySections({ sections }: Props) {
  if (!sections || sections.length === 0) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无报告分区数据 / Destiny sections not generated.
      </div>
    );
  }
  const sorted = [...sections].sort((a, b) => {
    const ai = ORDER.indexOf(a.sectionKey); const bi = ORDER.indexOf(b.sectionKey);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return (
    <div className="space-y-2">
      {sorted.map((s) => <SectionRow key={s.sectionKey} s={s} />)}
    </div>
  );
}

function SectionRow({ s }: { s: DestinySectionView }) {
  const sensitive = SENSITIVE_KEYS.has(s.sectionKey) || (s.sensitiveFlags && s.sensitiveFlags.length > 0);
  const [open, setOpen] = useState(!sensitive);
  const tone = sensitive
    ? 'border-destructive/35 bg-destructive/[0.04]'
    : 'border-primary/15 bg-card/30';
  const item: ClauseLookupItem = {
    requestedClauseNumber: s.requestedClauseNumber,
    matchedClauseNumber: s.matchedClauseNumber,
    exactMatch: s.exactMatch,
    fallbackUsed: s.fallbackUsed,
    fallbackDistance: s.fallbackDistance,
    fallbackReason: s.fallbackReason,
    content: s.content ?? s.interpretation,
    sectionName: s.sectionName,
  };
  return (
    <div className={`rounded-lg border ${tone}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left">
        <span className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="w-4 h-4 text-primary/85 shrink-0" /> : <ChevronRight className="w-4 h-4 text-primary/65 shrink-0" />}
          <span className="font-serif tracking-wider text-sm">{s.sectionName}</span>
          {s.palace && <span className="text-[10px] font-mono text-muted-foreground/65">· {s.palace}</span>}
          {sensitive && <Shield className="w-3 h-3 text-destructive/80 ml-1" aria-label="sensitive" />}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/65 tabular-nums">
          conf {formatPercent(s.confidence)}
        </span>
      </button>
      {open && (
        <div className="border-t border-primary/10 p-3">
          {sensitive && (
            <p className="mb-2 text-[10px] font-mono text-destructive/80 leading-relaxed">
              ⚠ 敏感分区:仅作命理范畴文化解读,不构成医疗/安全建议。
            </p>
          )}
          <ClauseLookupPanel items={[item]} title="" />
        </div>
      )}
    </div>
  );
}
