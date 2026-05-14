interface Props {
  mingScore?: number;
  grade?: string;
  findings?: string[];
  favorableElements?: string[];
  riskFactors?: string[];
  opportunityFactors?: string[];
  palaceScores?: Record<string, number>;
}

/** ZiweiStrengthPanel — mingScore + grade + structured findings. */
export function ZiweiStrengthPanel({
  mingScore, grade, findings, favorableElements, riskFactors, opportunityFactors, palaceScores,
}: Props) {
  if (mingScore == null && !grade && (!findings || findings.length === 0)) {
    return (
      <div className="rounded-md border border-primary/15 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        暂无强度分析 / Strength analysis unavailable.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">命格强度</div>
        {mingScore != null && (
          <div className="font-serif text-2xl text-primary/95 tabular-nums">{mingScore}</div>
        )}
        {grade && (
          <span className="px-2 py-1 text-xs font-serif border border-primary/40 rounded text-primary tracking-[0.2em]">{grade}</span>
        )}
      </div>

      {findings && findings.length > 0 && (
        <Block title="findings" items={findings} cls="text-foreground/85" />
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {favorableElements && favorableElements.length > 0 && <Block title="favorableElements" items={favorableElements} cls="text-emerald-300/85 border-emerald-400/30" />}
        {opportunityFactors && opportunityFactors.length > 0 && <Block title="opportunities" items={opportunityFactors} cls="text-sky-300/85 border-sky-400/30" />}
        {riskFactors && riskFactors.length > 0 && <Block title="risks" items={riskFactors} cls="text-destructive/85 border-destructive/35" />}
      </div>

      {palaceScores && Object.keys(palaceScores).length > 0 && (
        <details className="rounded border border-primary/10 bg-card/30">
          <summary className="cursor-pointer px-3 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/70">宫位分数 · {Object.keys(palaceScores).length}</summary>
          <div className="px-3 py-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
            {Object.entries(palaceScores).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-primary/5 pb-0.5">
                <span className="text-muted-foreground/75">{k}</span>
                <span className="text-foreground/90 tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function Block({ title, items, cls }: { title: string; items: string[]; cls: string }) {
  return (
    <div className={`rounded border bg-card/20 px-2.5 py-2 ${cls.includes('border') ? cls : 'border-primary/15 ' + cls}`}>
      <div className="text-[9px] font-mono uppercase tracking-[0.22em] opacity-75">{title} · {items.length}</div>
      <ul className="mt-1 space-y-0.5 text-[11px] leading-snug">
        {items.map((s, i) => <li key={i}>· {s}</li>)}
      </ul>
    </div>
  );
}
