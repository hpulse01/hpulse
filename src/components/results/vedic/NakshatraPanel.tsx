import { KVRow } from '../_shared/EnginePanelShell';
interface Props { nakshatra?: string; pada?: number; lord?: string }
export function NakshatraPanel({ nakshatra, pada, lord }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">Nakshatra · 星宿</div>
      <KVRow label="Nakshatra" value={nakshatra} mono />
      <KVRow label="Pada" value={pada} mono />
      <KVRow label="Lord" value={lord} mono />
    </div>
  );
}
