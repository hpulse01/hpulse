import { useEffect, useRef } from 'react';
import type { QuantumTimeline } from '@/utils/quantumPredictionEngine';

interface QuantumWaveformProps {
  timeline: QuantumTimeline[];
  className?: string;
  height?: number;
}

const ELEMENT_COLORS: Record<string, string> = {
  '木': '#4ade80',
  '火': '#f87171',
  '土': '#fbbf24',
  '金': '#e2e8f0',
  '水': '#60a5fa',
};

export function QuantumWaveform({ timeline, className = '', height = 200 }: QuantumWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const currentIdx = timeline.findIndex(t => t.isCurrentAge);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      offsetRef.current += 0.015;

      const padding = { left: 40, right: 20, top: 20, bottom: 30 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      // Y-axis grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`${100 - i * 25}`, padding.left - 6, y + 3);
      }

      const step = chartW / (timeline.length - 1 || 1);

      // Gradient fill under the curve
      const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
      gradient.addColorStop(0, 'rgba(168,85,247,0.25)');
      gradient.addColorStop(1, 'rgba(168,85,247,0.0)');

      ctx.beginPath();
      ctx.moveTo(padding.left, h - padding.bottom);
      for (let i = 0; i < timeline.length; i++) {
        const x = padding.left + i * step;
        const wave = Math.sin(offsetRef.current + i * 0.15) * 3;
        const y = padding.top + chartH * (1 - timeline[i].energy / 100) + wave;
        if (i === 0) ctx.lineTo(x, y);
        else {
          const prevX = padding.left + (i - 1) * step;
          const prevWave = Math.sin(offsetRef.current + (i - 1) * 0.15) * 3;
          const prevY = padding.top + chartH * (1 - timeline[i - 1].energy / 100) + prevWave;
          const cpx = (prevX + x) / 2;
          ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      ctx.lineTo(padding.left + (timeline.length - 1) * step, h - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Main line
      ctx.beginPath();
      for (let i = 0; i < timeline.length; i++) {
        const x = padding.left + i * step;
        const wave = Math.sin(offsetRef.current + i * 0.15) * 3;
        const y = padding.top + chartH * (1 - timeline[i].energy / 100) + wave;
        if (i === 0) ctx.moveTo(x, y);
        else {
          const prevX = padding.left + (i - 1) * step;
          const prevWave = Math.sin(offsetRef.current + (i - 1) * 0.15) * 3;
          const prevY = padding.top + chartH * (1 - timeline[i - 1].energy / 100) + prevWave;
          const cpx = (prevX + x) / 2;
          ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
      }
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Data points with element colors
      for (let i = 0; i < timeline.length; i++) {
        if (i % 5 !== 0 && i !== currentIdx) continue;
        const t = timeline[i];
        const x = padding.left + i * step;
        const wave = Math.sin(offsetRef.current + i * 0.15) * 3;
        const y = padding.top + chartH * (1 - t.energy / 100) + wave;

        const isHighlight = i === currentIdx;
        const color = ELEMENT_COLORS[t.element] || '#a78bfa';
        const r = isHighlight ? 5 : 2.5;

        if (isHighlight) {
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168,85,247,${0.15 + 0.08 * Math.sin(offsetRef.current * 3)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Age labels
        if (i % 10 === 0 || isHighlight) {
          ctx.fillStyle = isHighlight ? '#e2e8f0' : 'rgba(255,255,255,0.35)';
          ctx.font = isHighlight ? 'bold 10px monospace' : '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${t.age}`, x, h - padding.bottom + 14);

          if (isHighlight) {
            ctx.fillStyle = '#c084fc';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(`${t.energy}`, x, y - 10);
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [timeline, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
}
