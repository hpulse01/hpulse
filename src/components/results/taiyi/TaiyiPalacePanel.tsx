interface Props {
  taiyiPalace?: number;
  palaceName?: string;
  description?: string;
}
const PALACE_NAMES = ['','乾','离','艮','震','中','巽','坤','坎','兑'];
export function TaiyiPalacePanel({ taiyiPalace, palaceName, description }: Props) {
  const name = palaceName ?? (taiyiPalace ? PALACE_NAMES[taiyiPalace] : undefined);
  return (
    <div className="rounded-md border border-primary/30 bg-primary/[0.06] p-4 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">太乙所在宫 · Taiyi Palace</div>
      <div className="text-2xl font-serif text-gradient-gold mt-2">{name ?? '—'}</div>
      <div className="text-[10px] font-mono text-muted-foreground/65 mt-1">宫位 {taiyiPalace ?? '—'}</div>
      {description && <p className="text-[11px] text-foreground/80 mt-2 leading-relaxed">{description}</p>}
    </div>
  );
}
