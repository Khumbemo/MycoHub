import React, { useMemo, useState } from 'react';

interface Props {
  points: { n: number; s: number }[];
  chao1: number;
}

// Drawing box in viewBox units; the SVG scales to its container width.
const W = 320;
const H = 190;
const PAD = { top: 16, right: 16, bottom: 30, left: 34 };

const niceStep = (max: number, target = 4) => {
  const raw = max / target;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
};

/**
 * Species-accumulation (rarefaction) curve: expected species E[S_n] against the
 * number of records n, with the Chao1 richness estimate as a dashed reference.
 * A curve still rising at its end means the site is under-sampled.
 */
const RarefactionChart: React.FC<Props> = ({ points, chao1 }) => {
  const [hover, setHover] = useState<number | null>(null);
  const N = points[points.length - 1]?.n ?? 0;
  const S = points[points.length - 1]?.s ?? 0;

  const { x, y, yTicks, xTicks } = useMemo(() => {
    const yMax = Math.max(1, Math.ceil(Math.max(S, chao1) * 1.1));
    const ys = niceStep(yMax);
    const xs = niceStep(N);
    const x = (n: number) => PAD.left + (n / Math.max(N, 1)) * (W - PAD.left - PAD.right);
    const y = (s: number) => H - PAD.bottom - (s / yMax) * (H - PAD.top - PAD.bottom);
    const yTicks: number[] = [];
    for (let t = 0; t <= yMax; t += ys) yTicks.push(t);
    const xTicks: number[] = [];
    for (let t = 0; t <= N; t += xs) xTicks.push(t);
    return { x, y, yTicks, xTicks };
  }, [N, S, chao1]);

  if (points.length < 2) return null;

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.n).toFixed(1)},${y(p.s).toFixed(1)}`).join(' ');
  const hp = hover === null ? null : points[hover];

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const n = ((e.clientX - box.left) / box.width) * N;
    let best = 0;
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].n - n) < Math.abs(points[best].n - n)) best = i;
    setHover(best);
  };

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto chart"
        role="img"
        aria-label={`Rarefaction curve: ${S} species observed in ${N} records; Chao1 estimates ${chao1.toFixed(1)} species.`}
      >
        {/* recessive grid */}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="chart-axis">{t}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} x={x(t)} y={H - PAD.bottom + 14} textAnchor="middle" className="chart-axis">{t}</text>
        ))}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 2} textAnchor="middle" className="chart-axis">records sampled</text>

        {/* Chao1 reference */}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(chao1)} y2={y(chao1)} className="chart-ref" />
        <text x={W - PAD.right} y={y(chao1) - 5} textAnchor="end" className="chart-label">Chao1 ≈ {chao1.toFixed(1)}</text>

        {/* curve + endpoint */}
        <path d={path} className="chart-line" fill="none" />
        <circle cx={x(N)} cy={y(S)} r={4} className="chart-dot" />
        <text x={x(N) - 6} y={y(S) + 14} textAnchor="end" className="chart-label">{S} observed</text>

        {/* hover layer */}
        {hp && (
          <g pointerEvents="none">
            <line x1={x(hp.n)} x2={x(hp.n)} y1={PAD.top} y2={H - PAD.bottom} className="chart-crosshair" />
            <circle cx={x(hp.n)} cy={y(hp.s)} r={4} className="chart-dot" />
          </g>
        )}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={W - PAD.left - PAD.right}
          height={H - PAD.top - PAD.bottom}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      <figcaption className="text-[11px] font-bold text-gray-600 mt-2 min-h-[1.25rem]" aria-live="polite">
        {hp
          ? `${hp.n} record${hp.n === 1 ? '' : 's'} → ${hp.s.toFixed(2)} species expected`
          : 'Expected species for a random subsample of records (Hurlbert 1971).'}
      </figcaption>
    </figure>
  );
};

export default RarefactionChart;
