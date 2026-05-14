import { ZiweiPalaceCard, type ZiweiPalaceCardData } from './ZiweiPalaceCard';

interface Props {
  palaces: ZiweiPalaceCardData[];
}

const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
];

/**
 * ZiweiPalaceChart — 4×3 grid on desktop, vertical card list on mobile.
 * Falls back to placeholder palaces when only names are known.
 */
export function ZiweiPalaceChart({ palaces }: Props) {
  const byName = new Map(palaces.map(p => [p.name, p]));
  const ordered = PALACE_NAMES.map(n => byName.get(n) ?? { name: n });

  return (
    <div>
      {/* Desktop: 4x3 matrix */}
      <div className="hidden md:grid md:grid-cols-4 gap-2">
        {ordered.map(p => <ZiweiPalaceCard key={p.name} palace={p} />)}
      </div>
      {/* Mobile: vertical card list */}
      <div className="md:hidden space-y-2">
        {ordered.map(p => <ZiweiPalaceCard key={p.name} palace={p} />)}
      </div>
    </div>
  );
}
