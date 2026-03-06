import { useMemo } from 'react';
import type { QuantumState } from '@/utils/quantumPredictionEngine';

interface QuantumRadarProps {
  states: QuantumState[];
  size?: number;
  className?: string;
}

const ASPECT_COLORS: Record<string, string> = {
  career: '#f59e0b',
  wealth: '#10b981',
  love: '#f43f5e',
  health: '#a855f7',
  wisdom: '#3b82f6',
  social: '#06b6d4',
  creativity: '#ec4899',
  fortune: '#eab308',
};

export function QuantumRadar({ states, size = 300, className = '' }: QuantumRadarProps) {
  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const levels = 4;

  const points = useMemo(() => {
    const n = states.length;
    return states.map((state, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (state.probability / 100) * maxRadius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (maxRadius + 24) * Math.cos(angle),
        labelY: center + (maxRadius + 24) * Math.sin(angle),
        angle,
        state,
      };
    });
  }, [states, center, maxRadius]);

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  const gridLevels = useMemo(() => {
    return Array.from({ length: levels }, (_, lvl) => {
      const r = ((lvl + 1) / levels) * maxRadius;
      const n = states.length;
      const path = Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(' ') + 'Z';
      return { path, value: Math.round(((lvl + 1) / levels) * 100) };
    });
  }, [states.length, maxRadius, center, levels]);

  const axisLines = useMemo(() => {
    const n = states.length;
    return Array.from({ length: n }, (_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        x2: center + maxRadius * Math.cos(angle),
        y2: center + maxRadius * Math.sin(angle),
      };
    });
  }, [states.length, maxRadius, center]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`${className}`}
    >
      {/* Grid levels */}
      {gridLevels.map((lvl, i) => (
        <path
          key={i}
          d={lvl.path}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {axisLines.map((line, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={line.x2}
          y2={line.y2}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={0.5}
        />
      ))}

      {/* Filled polygon */}
      <defs>
        <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
        </radialGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <path
        d={polygonPath}
        fill="url(#radarGradient)"
        stroke="#a78bfa"
        strokeWidth={1.5}
        strokeOpacity={0.8}
        filter="url(#radarGlow)"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            fill={ASPECT_COLORS[p.state.aspect] || '#a78bfa'}
            stroke="white"
            strokeWidth={1}
            strokeOpacity={0.5}
          >
            <animate
              attributeName="r"
              values="3;5;3"
              dur={`${2 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </circle>

          {/* Labels */}
          <text
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-current text-muted-foreground"
            fontSize={11}
            fontFamily="'Noto Serif SC', serif"
          >
            {p.state.label}
          </text>
          <text
            x={p.labelX}
            y={p.labelY + 14}
            textAnchor="middle"
            dominantBaseline="central"
            fill={ASPECT_COLORS[p.state.aspect] || '#a78bfa'}
            fontSize={10}
            fontWeight="bold"
          >
            {p.state.probability}
          </text>
        </g>
      ))}

      {/* Center glow */}
      <circle cx={center} cy={center} r={3} fill="#c084fc" opacity={0.6}>
        <animate
          attributeName="r"
          values="2;5;2"
          dur="3s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0.2;0.6"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
