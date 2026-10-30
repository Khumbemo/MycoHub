import { useId, useMemo } from 'react';
import { cn } from '../utils/cn';

/*
 * Background artwork: a hyphal network growing across graph paper, like a
 * colony on an agar plate seen under a dissecting scope.
 *
 * Hyphae grow by apical extension and branch behind the tip at roughly 30-90°
 * (lateral branching), so each tip here takes short steps with a little
 * angular jitter and occasionally spawns a branch. The layout is seeded, so
 * the drawing is identical on every load and device.
 */

const W = 1600;
const H = 1000;

/** Small deterministic PRNG (mulberry32). */
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Colonies: inoculation point, radius reached, number of leading hyphae. */
const COLONIES = [
  { x: 1380, y: 860, r: 620, leaders: 14 },
  { x: 140, y: 110, r: 380, leaders: 10 },
  { x: 820, y: 640, r: 230, leaders: 8 },
];

const grow = () => {
  const rand = rng(20261030);
  const byOrder = [[], [], []]; // path data for leading, secondary, fine hyphae
  const tips = [];

  for (const c of COLONIES) {
    for (let i = 0; i < c.leaders; i++) {
      const a = (i / c.leaders) * Math.PI * 2 + rand() * 0.4;
      tips.push({ x: c.x, y: c.y, a, order: 0, life: c.r / 9, c });
    }
  }

  const ends = [];
  let budget = 5200;
  while (tips.length && budget > 0) {
    const t = tips.pop();
    let d = `M${t.x.toFixed(1)} ${t.y.toFixed(1)}`;
    const step = t.order === 0 ? 9 : t.order === 1 ? 7 : 5;
    for (let s = 0; s < t.life && budget > 0; s++, budget--) {
      t.a += (rand() - 0.5) * 0.32;
      t.x += Math.cos(t.a) * step;
      t.y += Math.sin(t.a) * step;
      d += `L${t.x.toFixed(1)} ${t.y.toFixed(1)}`;
      if (Math.hypot(t.x - t.c.x, t.y - t.c.y) > t.c.r) break;
      const branchP = t.order === 0 ? 0.075 : t.order === 1 ? 0.05 : 0;
      if (rand() < branchP) {
        const side = rand() < 0.5 ? -1 : 1;
        tips.push({
          x: t.x,
          y: t.y,
          a: t.a + side * (0.5 + rand() * 0.9),
          order: Math.min(t.order + 1, 2),
          life: (t.life - s) * (0.35 + rand() * 0.4),
          c: t.c,
        });
      }
    }
    byOrder[t.order].push(d);
    ends.push([t.x, t.y]);
  }
  return { paths: byOrder.map((p) => p.join('')), ends };
};

/**
 * @param {{ className?: string, grid?: boolean, zoom?: boolean }} props
 *   zoom: frame only the main colony (for small previews)
 */
const MyceliumField = ({ className, grid = true, zoom = false }) => {
  const net = useMemo(grow, []);
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox={zoom ? '1130 660 480 340' : `0 0 ${W} ${H}`}
      // Anchored bottom-right so portrait screens still show the main colony
      preserveAspectRatio="xMaxYMax slice"
      className={cn('mycelium', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={`${id}-minor`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" className="myc-grid" />
        </pattern>
        <pattern id={`${id}-major`} width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill={`url(#${id}-minor)`} />
          <path d="M100 0H0V100" fill="none" className="myc-grid myc-grid--major" />
        </pattern>
      </defs>

      {grid && <rect width={W} height={H} fill={`url(#${id}-major)`} />}

      {/* Rim of the Petri dish around the largest colony, with a measuring scale */}
      <circle cx="1380" cy="860" r="660" className="myc-dish" fill="none" />
      <circle cx="1380" cy="860" r="672" className="myc-scale" fill="none" />

      <path d={net.paths[2]} className="myc-hypha myc-hypha--fine" fill="none" />
      <path d={net.paths[1]} className="myc-hypha myc-hypha--mid" fill="none" />
      <path d={net.paths[0]} className="myc-hypha" fill="none" />
      <g className="myc-tip">
        {net.ends.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="1.6" />
        ))}
      </g>
      {COLONIES.map((c) => (
        <circle key={c.x} cx={c.x} cy={c.y} r="7" className="myc-inoculum" />
      ))}
    </svg>
  );
};

export default MyceliumField;
