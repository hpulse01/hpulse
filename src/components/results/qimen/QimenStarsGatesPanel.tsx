interface Props {
  stars?: string[];
  gates?: string[];
  deities?: string[];
}

const STARS = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
const GATES = ['休门','生门','伤门','杜门','景门','死门','惊门','开门'];
const DEITIES = ['值符','腾蛇','太阴','六合','勾陈','朱雀','九地','九天'];

export function QimenStarsGatesPanel({ stars, gates, deities }: Props) {
  const s = stars && stars.length > 0 ? stars : STARS;
  const g = gates && gates.length > 0 ? gates : GATES;
  const d = deities && deities.length > 0 ? deities : DEITIES;
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">九星 · 八门 · 八神</div>
      <Row label="九星" items={s} cls="text-sky-300/90 border-sky-400/35" />
      <Row label="八门" items={g} cls="text-amber-300/90 border-amber-400/35" />
      <Row label="八神" items={d} cls="text-primary border-primary/35" />
    </div>
  );
}

function Row({ label, items, cls }: { label: string; items: string[]; cls: string }) {
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-muted-foreground/65">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map(n => <span key={n} className={`text-[10px] font-serif px-1.5 py-0.5 rounded border ${cls} bg-card/30`}>{n}</span>)}
      </div>
    </div>
  );
}
