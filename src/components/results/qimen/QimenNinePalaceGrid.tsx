import { QimenPalaceCard } from './QimenPalaceCard';

export interface PalaceData {
  palace: number;
  trigram?: string;
  direction?: string;
  earthStem?: string;
  heavenStem?: string;
  star?: string;
  gate?: string;
  deity?: string;
}

interface Props {
  palaces: PalaceData[];
  zhiFuPalace?: number;
  zhiShiPalace?: number;
  yongShenPalace?: number;
}

// Standard 后天八卦 layout (luoshu): row1 巽4 离9 坤2 / row2 震3 中5 兑7 / row3 艮8 坎1 乾6
const LAYOUT = [4, 9, 2, 3, 5, 7, 8, 1, 6];

export function QimenNinePalaceGrid({ palaces, zhiFuPalace, zhiShiPalace, yongShenPalace }: Props) {
  const byPalace = new Map(palaces.map(p => [p.palace, p]));
  return (
    <div>
      <div className="hidden md:grid md:grid-cols-3 gap-2">
        {LAYOUT.map(n => {
          const p = byPalace.get(n) ?? { palace: n };
          return (
            <QimenPalaceCard key={n} {...p}
              isZhiFu={n === zhiFuPalace} isZhiShi={n === zhiShiPalace} isYongShen={n === yongShenPalace} />
          );
        })}
      </div>
      <div className="md:hidden space-y-2">
        {LAYOUT.map(n => {
          const p = byPalace.get(n) ?? { palace: n };
          return (
            <QimenPalaceCard key={n} {...p}
              isZhiFu={n === zhiFuPalace} isZhiShi={n === zhiShiPalace} isYongShen={n === yongShenPalace} />
          );
        })}
      </div>
    </div>
  );
}
