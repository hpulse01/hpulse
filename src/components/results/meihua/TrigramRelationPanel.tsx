interface Props {
  upperTrigram?: string;
  lowerTrigram?: string;
  upperElement?: string;
  lowerElement?: string;
  upperLowerRelation?: string;
}

const TRIGRAM_TO_ELEMENT: Record<string, string> = {
  '乾': '金', '兑': '金', '离': '火', '震': '木',
  '巽': '木', '坎': '水', '艮': '土', '坤': '土',
};

/** TrigramRelationPanel — 上下卦五行 + 生克关系 (graceful when 数据缺失). */
export function TrigramRelationPanel({ upperTrigram, lowerTrigram, upperElement, lowerElement, upperLowerRelation }: Props) {
  const ue = upperElement ?? (upperTrigram ? TRIGRAM_TO_ELEMENT[upperTrigram] : undefined);
  const le = lowerElement ?? (lowerTrigram ? TRIGRAM_TO_ELEMENT[lowerTrigram] : undefined);
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">上下卦 · Trigram Relation</div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <Row label="上卦" tri={upperTrigram} el={ue} />
        <Row label="下卦" tri={lowerTrigram} el={le} />
      </div>
      {upperLowerRelation && (
        <div className="mt-2 text-[11px] font-mono text-amber-300/85">
          关系 · {upperLowerRelation}
        </div>
      )}
    </div>
  );
}

function Row({ label, tri, el }: { label: string; tri?: string; el?: string }) {
  return (
    <div className="rounded border border-primary/15 bg-card/20 px-2 py-1.5">
      <div className="text-muted-foreground/65 uppercase tracking-wider text-[9px]">{label}</div>
      <div className="text-foreground/90 mt-0.5 font-serif text-base">{tri ?? '—'}</div>
      <div className="text-muted-foreground/70 text-[10px] mt-0.5">五行 {el ?? '—'}</div>
    </div>
  );
}
