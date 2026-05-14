interface Props {
  host?: string;
  guest?: string;
  hostStrength?: number;
  guestStrength?: number;
  verdict?: string;
}
export function TaiyiHostGuestPanel({ host, guest, hostStrength, guestStrength, verdict }: Props) {
  return (
    <div className="rounded-md border border-primary/15 bg-card/30 p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/70 mb-2">主客 · Host vs Guest</div>
      <div className="grid grid-cols-2 gap-3">
        <Side label="主 · Host" value={host} strength={hostStrength} accent="text-primary" />
        <Side label="客 · Guest" value={guest} strength={guestStrength} accent="text-sky-300" />
      </div>
      {verdict && <div className="text-[11px] text-foreground/85 mt-2 font-mono">判定: <span className="text-primary/90">{verdict}</span></div>}
    </div>
  );
}
function Side({ label, value, strength, accent }: { label: string; value?: string; strength?: number; accent: string }) {
  return (
    <div className="rounded border border-primary/15 bg-card/20 p-2">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/65">{label}</div>
      <div className={`text-sm font-serif ${accent} mt-1`}>{value ?? '—'}</div>
      {strength != null && <div className="text-[10px] font-mono text-muted-foreground/70">strength {strength}</div>}
    </div>
  );
}
