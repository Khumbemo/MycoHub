import { normaliseParams } from '../utils/methods';

/**
 * Plan of a study plot with its quadrats or core points, to scale.
 * The origin (0, 0) is the plot's reference corner, drawn bottom-left;
 * x runs along the plot's width and y along its length.
 */
const PlotMap = ({ method, params, units, className }) => {
  const p = normaliseParams(method, params);
  const W = p.plotWidthM;
  const L = p.plotLengthM;
  const placed = (units ?? []).filter((u) => Number.isFinite(u.x) && Number.isFinite(u.y));
  if (!W || !L || placed.length === 0) return null;

  const pad = Math.max(W, L) * 0.08;
  const font = Math.max(W, L) / 28;
  const side = method === 'quadrat' ? p.sideM : 0;
  const dot = Math.max(W, L) / 70;
  const toY = (y, h = 0) => L - y - h; // flip so y grows upwards
  const done = placed.filter((u) => u.done).length;

  // A round-number scale bar about a fifth of the plot width.
  const target = W / 5;
  const mag = 10 ** Math.floor(Math.log10(target));
  const bar =
    [1, 2, 5, 10]
      .map((k) => k * mag)
      .filter((v) => v <= target)
      .pop() ?? mag;

  return (
    <figure className={className}>
      <svg
        viewBox={`${-pad} ${-pad} ${W + pad * 2} ${L + pad * 3}`}
        className="w-full h-auto plotmap"
        role="img"
        aria-label={`Plot plan, ${W} by ${L} m, with ${placed.length} ${method === 'quadrat' ? 'quadrats' : 'cores'}; ${done} done.`}
      >
        <rect x={0} y={0} width={W} height={L} className="plotmap-plot" />
        {placed.map((u) =>
          method === 'quadrat' ? (
            <g key={u.id}>
              <rect
                x={u.x}
                y={toY(u.y, side)}
                width={side}
                height={side}
                className={u.done ? 'plotmap-unit plotmap-unit--done' : 'plotmap-unit'}
              />
              <text
                x={u.x + side / 2}
                y={toY(u.y, side) + side / 2}
                dy="0.35em"
                textAnchor="middle"
                fontSize={Math.min(font, side * 0.45)}
                className="plotmap-label"
              >
                {u.label}
              </text>
            </g>
          ) : (
            <g key={u.id}>
              <circle
                cx={u.x}
                cy={toY(u.y)}
                r={dot}
                className={u.done ? 'plotmap-unit plotmap-unit--done' : 'plotmap-unit'}
              />
              <text x={u.x + dot * 1.4} y={toY(u.y)} dy="0.35em" fontSize={font * 0.8} className="plotmap-label">
                {u.label}
              </text>
            </g>
          ),
        )}
        {/* origin and scale */}
        <text x={0} y={L + font * 1.2} fontSize={font * 0.8} className="plotmap-label">
          0,0
        </text>
        <line x1={W - bar} x2={W} y1={L + font * 1.6} y2={L + font * 1.6} className="plotmap-scale" />
        <text x={W} y={L + font * 1.15} fontSize={font * 0.8} textAnchor="end" className="plotmap-label">
          {bar} m
        </text>
      </svg>
      <figcaption className="text-[11px] text-gray-600 mt-1">
        {W} × {L} m plot. Positions are metres from the reference corner (0,0): x along the width, y along the length.
      </figcaption>
    </figure>
  );
};

export default PlotMap;
