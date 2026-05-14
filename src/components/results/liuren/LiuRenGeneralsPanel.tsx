interface Props { generals?: string[] }
const DEFAULT = ['贵人','螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后'];

export function LiuRenGeneralsPanel({ generals }: Props) {
  const list = generals && generals.length > 0 ? generals : DEFAULT;
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">十二天将 · Twelve Generals</div>
      <div className="flex flex-wrap gap-1">
        {list.map(g => (
          <span key={g} className="text-[10px] font-serif px-1.5 py-0.5 rounded border border-primary/25 bg-card/30 text-primary/90">{g}</span>
        ))}
      </div>
    </div>
  );
}
