import { KVRow } from '../_shared/EnginePanelShell';
interface Props { rashi?: string; lagna?: string; moonRashi?: string; }
export function RashiPanel({ rashi, lagna, moonRashi }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-3 space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">Rashi · 星座</div>
      <KVRow label="Lagna · 上升" value={lagna} mono />
      <KVRow label="Sun Rashi" value={rashi} mono />
      <KVRow label="Moon Rashi" value={moonRashi} mono />
      {!lagna && <div className="text-[10px] text-amber-300/70 font-mono mt-2">⚠ Lagna 缺失 / Lagna missing — 宫位推断不完整</div>}
    </div>
  );
}
