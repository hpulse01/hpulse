interface Props { spirits?: { position: number; spirit?: string }[]; dayStem?: string }

const SPIRITS = ['青龙','朱雀','勾陈','螣蛇','白虎','玄武'];
const TONE: Record<string, string> = {
  '青龙': 'border-emerald-400/40 text-emerald-300',
  '朱雀': 'border-destructive/40 text-destructive',
  '勾陈': 'border-amber-400/40 text-amber-300',
  '螣蛇': 'border-primary/40 text-primary',
  '白虎': 'border-foreground/30 text-foreground/85',
  '玄武': 'border-sky-400/40 text-sky-300',
};

export function SixSpiritsPanel({ spirits, dayStem }: Props) {
  const items = spirits ?? SPIRITS.map((s, i) => ({ position: 6 - i, spirit: undefined as string | undefined }));
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">六神 · Six Spirits</div>
        {dayStem && <span className="text-[10px] font-mono text-muted-foreground/65">日干 {dayStem}</span>}
      </div>
      {!spirits || spirits.length === 0 ? (
        <div className="text-[11px] text-muted-foreground/65">暂无六神装配数据 (依赖日干起序) / Six spirits unavailable.</div>
      ) : (
        <ul className="space-y-1 text-[11px] font-mono">
          {[...items].sort((a, b) => b.position - a.position).map((s) => (
            <li key={s.position} className="flex items-center gap-2">
              <span className="w-12 text-muted-foreground/65 tabular-nums">第{s.position}爻</span>
              <span className={`px-2 py-0.5 rounded border ${TONE[s.spirit ?? ''] ?? 'border-muted-foreground/25 text-muted-foreground'}`}>{s.spirit ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
