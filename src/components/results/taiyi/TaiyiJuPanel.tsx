import { KVRow } from '../_shared/EnginePanelShell';
interface Props {
  taiyiAccumulatedYears?: number;
  juNumber?: number;
  yangYin?: string;
  era?: string;
}
export function TaiyiJuPanel({ taiyiAccumulatedYears, juNumber, yangYin, era }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-3 space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">局数 · Ju</div>
      <KVRow label="积年 · Accumulated Years" value={taiyiAccumulatedYears} mono />
      <KVRow label="局数 · Ju Number" value={juNumber} mono />
      <KVRow label="阴阳遁" value={yangYin} mono />
      <KVRow label="纪元 · Era" value={era} mono />
    </div>
  );
}
