import type { QuantumEntanglement, LifeAspect } from '@/utils/quantumPredictionEngine';
import { QuantumPredictionEngine } from '@/utils/quantumPredictionEngine';

interface QuantumEntanglementMapProps {
  entanglements: QuantumEntanglement[];
  className?: string;
}

const ASPECT_POSITIONS: Record<LifeAspect, { x: number; y: number }> = {
  career:     { x: 150, y: 30 },
  wealth:     { x: 270, y: 70 },
  love:       { x: 280, y: 170 },
  health:     { x: 220, y: 260 },
  wisdom:     { x: 80, y: 260 },
  social:     { x: 20, y: 170 },
  creativity: { x: 30, y: 70 },
  fortune:    { x: 150, y: 150 },
};

export function QuantumEntanglementMap({ entanglements, className = '' }: QuantumEntanglementMapProps) {
  return (
    <svg viewBox="0 0 300 300" className={`w-full max-w-[300px] mx-auto ${className}`}>
      <defs>
        <filter id="entangleGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Entanglement lines */}
      {entanglements.map((e, i) => {
        const posA = ASPECT_POSITIONS[e.aspectA];
        const posB = ASPECT_POSITIONS[e.aspectB];
        if (!posA || !posB) return null;

        const isPositive = e.correlation > 0;
        const strength = Math.abs(e.correlation);
        const color = isPositive ? `rgba(74,222,128,${strength * 0.6})` : `rgba(248,113,113,${strength * 0.6})`;

        return (
          <line
            key={i}
            x1={posA.x}
            y1={posA.y}
            x2={posB.x}
            y2={posB.y}
            stroke={color}
            strokeWidth={1 + strength * 2}
            strokeDasharray={isPositive ? 'none' : '4 3'}
            opacity={0.5 + strength * 0.3}
            filter="url(#entangleGlow)"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to={isPositive ? '0' : '14'}
              dur="2s"
              repeatCount="indefinite"
            />
          </line>
        );
      })}

      {/* Aspect nodes */}
      {(Object.entries(ASPECT_POSITIONS) as [LifeAspect, { x: number; y: number }][]).map(([aspect, pos]) => {
        const label = QuantumPredictionEngine.getAspectLabel(aspect);
        const isFortune = aspect === 'fortune';

        return (
          <g key={aspect}>
            {isFortune && (
              <circle cx={pos.x} cy={pos.y} r={20} fill="rgba(168,85,247,0.1)" stroke="rgba(168,85,247,0.3)" strokeWidth={0.5}>
                <animate attributeName="r" values="18;24;18" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isFortune ? 14 : 10}
              fill={isFortune ? 'rgba(168,85,247,0.3)' : 'rgba(148,163,184,0.2)'}
              stroke={isFortune ? '#a78bfa' : 'rgba(148,163,184,0.4)'}
              strokeWidth={1}
            />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isFortune ? '#c084fc' : '#94a3b8'}
              fontSize={isFortune ? 10 : 9}
              fontFamily="'Noto Serif SC', serif"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
