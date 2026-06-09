import { KVRow } from '../_shared/EnginePanelShell';
interface Props {
  wenChang?: string;
  shiJi?: string;
  jiShen?: string;
  daYou?: string;
  taiSui?: string;
  heJi?: string;
}
export function TaiyiGodPositionsPanel({ wenChang, shiJi, jiShen, daYou, taiSui, heJi }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-1.5">神位 · God Positions</div>
      <KVRow label="文昌" value={wenChang} mono />
      <KVRow label="始击" value={shiJi} mono />
      <KVRow label="计神" value={jiShen} mono />
      <KVRow label="大游" value={daYou} mono />
      <KVRow label="太岁" value={taiSui} mono />
      <KVRow label="合击" value={heJi} mono />
    </div>
  );
}
