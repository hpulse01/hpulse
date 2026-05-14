interface SephiraNode { id: number; name: string; meaning?: string; active?: boolean }
interface Props { sephirot?: SephiraNode[]; activePath?: string }

const DEFAULT: SephiraNode[] = [
  { id: 1, name: 'Keter · 王冠' },
  { id: 2, name: 'Chokhmah · 智慧' },
  { id: 3, name: 'Binah · 理解' },
  { id: 4, name: 'Chesed · 仁慈' },
  { id: 5, name: 'Gevurah · 严厉' },
  { id: 6, name: 'Tiferet · 美' },
  { id: 7, name: 'Netzach · 胜利' },
  { id: 8, name: 'Hod · 荣耀' },
  { id: 9, name: 'Yesod · 基础' },
  { id: 10, name: 'Malkuth · 王国' },
];

export function TreeOfLifePanel({ sephirot, activePath }: Props) {
  const list = sephirot && sephirot.length > 0 ? sephirot : DEFAULT;
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">Tree of Life · 生命之树</div>
      <ol className="space-y-1">
        {list.map(s => (
          <li key={s.id} className={`flex items-center gap-2 text-[11px] p-1.5 rounded border ${s.active ? 'border-primary/50 bg-primary/[0.08]' : 'border-primary/10 bg-card/20'}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono ${s.active ? 'border-primary text-primary' : 'border-primary/30 text-muted-foreground/70'}`}>{s.id}</span>
            <span className="font-serif text-foreground/90">{s.name}</span>
            {s.meaning && <span className="text-[10px] text-muted-foreground/65 ml-auto truncate">{s.meaning}</span>}
          </li>
        ))}
      </ol>
      {activePath && <div className="text-[10px] font-mono text-primary/80 mt-2">主导路径 · {activePath}</div>}
    </div>
  );
}
