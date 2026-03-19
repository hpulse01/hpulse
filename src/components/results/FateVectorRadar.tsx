/**
 * FateVectorRadar — SVG-based 10-dimensional fate vector radar chart (bilingual)
 */
import { useMemo } from 'react';
import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { useI18n } from '@/hooks/useI18n';

const DIM_HEX: Record<FateDimension, string> = {
  life: '#f59e0b', wealth: '#10b981', relation: '#f43f5e',
  health: '#a855f7', wisdom: '#3b82f6', spirit: '#6366f1',
  socialStatus: '#eab308', creativity: '#ec4899', luck: '#84cc16', homeStability: '#14b8a6',
};

interface Props {
  fateVector: FateVector;
  /** Optional second vector for comparison overlay */
  comparisonVector?: FateVector;
  size?: number;
  className?: string;
  showLabels?: boolean;
  showValues?: boolean;
  animated?: boolean;
}

export function FateVectorRadar({
  fateVector, comparisonVector, size = 360, className = '',
  showLabels = true, showValues = true, animated = true,
}: Props) {
  const { dimLabel } = useI18n();
  const center = size / 2;
  const maxR = size / 2 - 48;
  const dims = ALL_FATE_DIMENSIONS;
  const n = dims.length;

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const makePoints = (fv: FateVector) =>
    dims.map((dim, i) => {
      const a = angleFor(i);
      const r = (fv[dim] / 100) * maxR;
      return { x: center + r * Math.cos(a), y: center + r * Math.sin(a), dim, val: fv[dim] };
    });

  const primary = useMemo(() => makePoints(fateVector), [fateVector]);
  const comparison = useMemo(() => comparisonVector ? makePoints(comparisonVector) : null, [comparisonVector]);

  const gridLevels = [25, 50, 75, 100];

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <defs>
        <radialGradient id="fvRadarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="fvRadarCompGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
        </radialGradient>
        <filter id="fvGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Grid levels */}
      {gridLevels.map(lvl => {
        const r = (lvl / 100) * maxR;
        const pts = dims.map((_, i) => {
          const a = angleFor(i);
          return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) };
        });
        return (
          <path key={lvl} d={toPath(pts)} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} />
        );
      })}

      {/* Axis lines */}
      {dims.map((_, i) => {
        const a = angleFor(i);
        return (
          <line key={i} x1={center} y1={center}
            x2={center + maxR * Math.cos(a)} y2={center + maxR * Math.sin(a)}
            stroke="currentColor" strokeOpacity={0.06} strokeWidth={0.5} />
        );
      })}

      {/* Comparison polygon */}
      {comparison && (
        <path d={toPath(comparison)} fill="url(#fvRadarCompGrad)" stroke="#f59e0b" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="4 2" />
      )}

      {/* Primary polygon */}
      <path d={toPath(primary)} fill="url(#fvRadarGrad)" stroke="#a78bfa" strokeWidth={1.5} strokeOpacity={0.8} filter="url(#fvGlow)">
        {animated && (
          <animate attributeName="stroke-opacity" values="0.8;0.4;0.8" dur="4s" repeatCount="indefinite" />
        )}
      </path>

      {/* Data points + labels */}
      {primary.map((p, i) => {
        const a = angleFor(i);
        const labelR = maxR + (showValues ? 32 : 22);
        const lx = center + labelR * Math.cos(a);
        const ly = center + labelR * Math.sin(a);

        return (
          <g key={p.dim}>
            <circle cx={p.x} cy={p.y} r={3.5} fill={DIM_HEX[p.dim]} stroke="white" strokeWidth={0.8} strokeOpacity={0.4}>
              {animated && (
                <animate attributeName="r" values="3;5;3" dur={`${2.5 + i * 0.2}s`} repeatCount="indefinite" />
              )}
            </circle>

            {showLabels && (
              <text x={lx} y={ly - (showValues ? 6 : 0)} textAnchor="middle" dominantBaseline="central"
                className="fill-current text-muted-foreground" fontSize={10} fontFamily="sans-serif">
                {dimLabel(p.dim)}
              </text>
            )}
            {showValues && (
              <text x={lx} y={ly + 8} textAnchor="middle" dominantBaseline="central"
                fill={DIM_HEX[p.dim]} fontSize={10} fontWeight="bold">
                {p.val}
              </text>
            )}
          </g>
        );
      })}

      {/* Center pulse */}
      <circle cx={center} cy={center} r={2.5} fill="#c084fc" opacity={0.5}>
        {animated && <>
          <animate attributeName="r" values="2;4;2" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0.15;0.5" dur="3s" repeatCount="indefinite" />
        </>}
      </circle>
    </svg>
  );
}
