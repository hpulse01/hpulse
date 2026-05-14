interface Props { tone?: number; toneName?: string; meaning?: string }
const TONES = ['','Magnetic','Lunar','Electric','Self-Existing','Overtone','Rhythmic','Resonant','Galactic','Solar','Planetary','Spectral','Crystal','Cosmic'];
export function GalacticTonePanel({ tone, toneName, meaning }: Props) {
  const name = toneName ?? (tone ? TONES[tone] : undefined);
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3 text-center">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70">Galactic Tone · 调性</div>
      <div className="text-3xl font-serif text-gradient-gold mt-2">{tone ?? '—'}</div>
      <div className="text-xs font-mono text-foreground/85">{name ?? '—'}</div>
      {meaning && <div className="text-[11px] text-muted-foreground/75 mt-2 leading-snug">{meaning}</div>}
    </div>
  );
}
