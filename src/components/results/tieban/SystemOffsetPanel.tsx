interface Props {
  systemOffset?: number;
  theoreticalBase?: number;
  confirmedClauseId?: number | null;
  lockedQuarterIndex?: number | null;
}

/** SystemOffsetPanel — exposes how systemOffset bends the entire 12000-clause grid. */
export function SystemOffsetPanel({ systemOffset, theoreticalBase, confirmedClauseId, lockedQuarterIndex }: Props) {
  const calibrated = confirmedClauseId != null;
  return (
    <div className={`rounded-md border p-3 ${calibrated ? 'border-emerald-400/35 bg-emerald-400/[0.04]' : 'border-amber-400/35 bg-amber-400/[0.04]'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/80">系统偏移 · System Offset</div>
        <span className={`text-[10px] font-mono uppercase tracking-[0.18em] ${calibrated ? 'text-emerald-300' : 'text-amber-300'}`}>
          {calibrated ? 'CALIBRATED' : 'UNCALIBRATED'}
        </span>
      </div>
      <div className="mt-2 font-serif text-2xl tracking-[0.3em] text-primary/95 tabular-nums">
        {systemOffset == null ? '—' : (systemOffset > 0 ? `+${systemOffset}` : systemOffset)}
      </div>
      <dl className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 text-[11px] font-mono text-muted-foreground/85">
        <Cell label="theoreticalBase" value={theoreticalBase} />
        <Cell label="confirmedClauseId" value={confirmedClauseId} />
        <Cell label="lockedQuarterIndex" value={lockedQuarterIndex} />
      </dl>
      {!calibrated && (
        <p className="mt-2 text-[10px] font-mono text-amber-300/80 leading-relaxed">
          ⚠ 未完成六亲校时,所有条文按 theoreticalBase 直接映射,fallback 比例可能偏高。
        </p>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value?: number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground/60 uppercase tracking-wider text-[9px]">{label}</dt>
      <dd className="text-foreground/90 tabular-nums">{value ?? '—'}</dd>
    </div>
  );
}
