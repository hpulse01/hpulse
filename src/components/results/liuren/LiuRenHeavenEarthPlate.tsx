import { KVRow } from '../_shared/EnginePanelShell';

interface Props {
  yueJiang?: string;
  zhanShi?: string;
  questionTime?: string;
  hourGanzhi?: string;
}
export function LiuRenHeavenEarthPlate({ yueJiang, zhanShi, questionTime, hourGanzhi }: Props) {
  return (
    <div className="rounded-md border border-primary/25 bg-card/40 p-3 space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">天地盘 · Heaven & Earth Plate</div>
      <KVRow label="月将 · Yue Jiang" value={yueJiang} mono />
      <KVRow label="占时 · Zhan Shi" value={zhanShi} mono />
      <KVRow label="时柱 · Hour" value={hourGanzhi} mono />
      <KVRow label="占问时刻" value={questionTime} mono />
      {!yueJiang && <div className="text-[10px] text-amber-300/70 font-mono mt-2">⚠ 月将缺失，无法构造完整天地盘 / yueJiang missing.</div>}
    </div>
  );
}
