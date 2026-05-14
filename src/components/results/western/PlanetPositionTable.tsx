export interface PlanetRow {
  name: string;
  sign?: string;
  longitude?: number;
  degreeInSign?: number;
  house?: number;
  retrograde?: boolean;
}
const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const CN: Record<string, string> = { Sun:'太阳', Moon:'月亮', Mercury:'水星', Venus:'金星', Mars:'火星', Jupiter:'木星', Saturn:'土星', Uranus:'天王星', Neptune:'海王星', Pluto:'冥王星' };

interface Props { planets?: PlanetRow[] }

export function PlanetPositionTable({ planets }: Props) {
  const map = new Map((planets ?? []).map(p => [p.name, p]));
  const rows = PLANETS.map(n => map.get(n) ?? { name: n });
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 overflow-hidden">
      <div className="hidden md:block">
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-primary/5">
            <tr className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
              <th className="text-left px-2 py-1.5">行星</th><th className="text-left px-2">星座</th>
              <th className="text-right px-2">黄经</th><th className="text-right px-2">度数</th>
              <th className="text-right px-2">宫位</th><th className="text-center px-2">R</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.name} className="border-t border-primary/10">
                <td className="px-2 py-1 text-foreground/85">{CN[p.name] ?? p.name}<span className="text-muted-foreground/50 ml-1">{p.name}</span></td>
                <td className="px-2 text-primary/85">{p.sign ?? '—'}</td>
                <td className="px-2 text-right tabular-nums">{p.longitude != null ? p.longitude.toFixed(2) + '°' : '—'}</td>
                <td className="px-2 text-right tabular-nums">{p.degreeInSign != null ? p.degreeInSign.toFixed(2) + '°' : '—'}</td>
                <td className="px-2 text-right">{p.house ?? '—'}</td>
                <td className="px-2 text-center text-rose-300/80">{p.retrograde ? 'R' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-primary/10">
        {rows.map(p => (
          <div key={p.name} className="p-2 text-[11px]">
            <div className="flex justify-between">
              <span className="font-serif text-foreground/85">{CN[p.name] ?? p.name}</span>
              <span className="text-primary/85 font-mono">{p.sign ?? '—'}</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
              黄经 {p.longitude != null ? p.longitude.toFixed(2) + '°' : '—'} · 宫 {p.house ?? '—'} {p.retrograde ? '· R' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
