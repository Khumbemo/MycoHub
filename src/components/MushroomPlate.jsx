import { useId } from 'react';
import { cn } from '../utils/cn';

// A field-guide plate of the fly agaric, Amanita muscaria (L.) Lam., drawn for
// MycoHub. The morphology follows the species: red pileus with white
// universal-veil warts, free white lamellae, a pendant skirt-like annulus, and a
// bulbous stipe base with concentric rings of volval remnants (not a sac volva).
// A young "button" still enclosed in the universal veil stands beside it.

const CX = 262; // centre line of the mature specimen

// Universal-veil warts on the cap: [x, y, r]
const WARTS = [
  [196, 118, 6],
  [222, 96, 7],
  [252, 84, 7.5],
  [284, 90, 6.5],
  [312, 108, 6],
  [178, 142, 5],
  [210, 130, 5.5],
  [242, 112, 5],
  [270, 112, 6],
  [300, 128, 5.5],
  [334, 138, 5],
  [160, 162, 4],
  [194, 154, 4.5],
  [228, 146, 4],
  [258, 138, 4.5],
  [288, 150, 4],
  [318, 156, 4.5],
  [352, 160, 3.5],
];

// Lamellae: free gills radiating from the cap margin towards (but not touching) the stipe.
const GILLS = Array.from({ length: 31 }, (_, i) => {
  const x = 152 + i * 7.2;
  const t = (x - CX) / 110; // -1 … 1 across the cap
  return { x1: x, y1: 176 + Math.abs(t) * -3, x2: CX + (x - CX) * 0.3, y2: 190 };
});

const Label = ({ x, y, anchor = 'start', children }) => (
  <text x={x} y={y} textAnchor={anchor} className="plate-label">
    {children}
  </text>
);

const Leader = ({ d }) => <path d={d} className="plate-leader" fill="none" />;

/**
 * @param {{ labels?: boolean, caption?: boolean, className?: string, title?: string }} props
 * labels: show morphology annotations and the scale bar (off for background use).
 */
const MushroomPlate = ({ labels = true, caption = true, className, title }) => {
  const id = useId().replace(/:/g, '');
  const cap = `cap-${id}`;
  const stem = `stem-${id}`;
  const shade = `shade-${id}`;
  const height = caption ? 500 : 452;

  return (
    <svg
      viewBox={`0 0 500 ${height}`}
      className={cn('plate', className)}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={cap} cx="0.42" cy="0.18" r="0.95">
          <stop offset="0" stopColor="#E25A45" />
          <stop offset="0.55" stopColor="#C8372D" />
          <stop offset="1" stopColor="#A9442A" />
        </radialGradient>
        <linearGradient id={stem} x1="0" x2="1">
          <stop offset="0" stopColor="#EDEBE3" />
          <stop offset="0.45" stopColor="#FBFAF6" />
          <stop offset="1" stopColor="#E3E0D6" />
        </linearGradient>
        <radialGradient id={shade} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#16211A" stopOpacity="0.22" />
          <stop offset="1" stopColor="#16211A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ground shadow and leaf litter */}
      <ellipse cx={CX} cy="424" rx="92" ry="9" fill={`url(#${shade})`} />
      <ellipse cx="78" cy="424" rx="44" ry="6" fill={`url(#${shade})`} />
      <path d="M20 426 C120 420 380 420 480 427" className="plate-soil" fill="none" />
      <path d="M150 426 l14 -5 M330 426 l18 -4 M40 427 l10 -3 M410 427 l-12 -4" className="plate-soil" fill="none" />

      {/* ---- mature specimen ---- */}
      {/* stipe */}
      <path
        d={`M${CX - 14} 186 C${CX - 16} 250 ${CX - 21} 318 ${CX - 25} 372 L${CX + 25} 372 C${CX + 21} 318 ${CX + 16} 250 ${CX + 14} 186 Z`}
        fill={`url(#${stem})`}
        className="plate-line"
      />
      {/* fibrils on the stipe */}
      <path
        d={`M${CX - 6} 250 l-1 40 M${CX + 6} 262 l1 44 M${CX - 2} 300 l-1 36 M${CX + 9} 320 l1 30`}
        className="plate-fine"
        fill="none"
      />
      {/* bulb with concentric volval rings */}
      <path
        d={`M${CX - 26} 366 C${CX - 52} 378 ${CX - 52} 412 ${CX - 34} 420 C${CX - 16} 428 ${CX + 16} 428 ${CX + 34} 420 C${CX + 52} 412 ${CX + 52} 378 ${CX + 26} 366 Z`}
        fill={`url(#${stem})`}
        className="plate-line"
      />
      {[382, 394, 406].map((y, i) => (
        <path
          key={y}
          d={`M${CX - 40 + i * 2} ${y} C${CX - 20} ${y + 6} ${CX + 20} ${y + 6} ${CX + 40 - i * 2} ${y}`}
          className="plate-ring"
          fill="none"
        />
      ))}
      {/* annulus: pendant, skirt-like ring */}
      <path
        d={`M${CX - 16} 206 C${CX - 28} 214 ${CX - 34} 232 ${CX - 36} 248 C${CX - 22} 242 ${CX - 12} 247 ${CX} 244 C${CX + 12} 247 ${CX + 22} 242 ${CX + 36} 248 C${CX + 34} 232 ${CX + 28} 214 ${CX + 16} 206 Z`}
        fill="#F7F6F2"
        className="plate-line"
      />
      <path
        d={`M${CX - 30} 238 l3 6 M${CX - 18} 236 l1 8 M${CX - 6} 237 l0 7 M${CX + 6} 237 l0 7 M${CX + 18} 236 l-1 8 M${CX + 30} 238 l-3 6`}
        className="plate-fine"
        fill="none"
      />
      {/* lamellae (underside of the cap) */}
      <path d={`M148 174 C190 192 334 192 376 174 C340 198 184 198 148 174 Z`} fill="#F7F6F2" className="plate-line" />
      {GILLS.map((g, i) => (
        <line key={i} x1={g.x1} y1={g.y1 + 2} x2={g.x2} y2={g.y2} className="plate-fine" />
      ))}
      {/* pileus */}
      <path
        d={`M146 174 C144 110 200 72 ${CX} 72 C324 72 380 110 378 174 C340 184 184 184 146 174 Z`}
        fill={`url(#${cap})`}
        className="plate-line"
      />
      {/* striate margin */}
      <path
        d="M152 168 l4 -7 M164 172 l3 -7 M354 172 l-3 -7 M368 168 l-4 -7"
        className="plate-fine plate-fine--light"
        fill="none"
      />
      {/* universal-veil warts */}
      {WARTS.map(([x, y, r], i) => (
        <path
          key={i}
          d={`M${x - r} ${y} L${x - r * 0.4} ${y - r * 0.85} L${x + r * 0.55} ${y - r * 0.75} L${x + r} ${y + r * 0.1} L${x + r * 0.35} ${y + r * 0.8} L${x - r * 0.6} ${y + r * 0.7} Z`}
          fill="#F7F6F2"
          stroke="#E6E2D6"
          strokeWidth="0.6"
        />
      ))}
      {/* highlight */}
      <path
        d={`M190 104 C210 88 236 80 252 80`}
        stroke="#fff"
        strokeOpacity="0.35"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* ---- button stage, still enclosed in the universal veil ---- */}
      <path
        d="M44 420 C34 392 44 352 78 344 C112 352 122 392 112 420 C100 428 56 428 44 420 Z"
        fill={`url(#${stem})`}
        className="plate-line"
      />
      <path d="M52 372 C56 352 68 346 78 346 C88 346 100 352 104 372 C92 366 64 366 52 372 Z" fill={`url(#${cap})`} />
      {[
        [62, 360, 3.5],
        [74, 352, 4],
        [88, 356, 3.5],
        [96, 366, 3],
        [68, 368, 3],
        [82, 364, 3.2],
        [56, 372, 2.6],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#F7F6F2" stroke="#E6E2D6" strokeWidth="0.5" />
      ))}
      <path d="M50 396 C66 402 92 402 106 396 M52 408 C68 413 90 413 104 408" className="plate-ring" fill="none" />

      {labels && (
        <g>
          <Leader d="M346 110 L392 82" />
          <Label x={396} y={84}>
            pileus
          </Label>

          <Leader d="M222 96 L170 52" />
          <Label x={166} y={48} anchor="end">
            universal-veil warts
          </Label>

          <Leader d="M352 182 L392 200" />
          <Label x={396} y={204}>
            lamellae, free
          </Label>

          <Leader d={`M${CX - 34} 238 L196 252`} />
          <Label x={192} y={256} anchor="end">
            annulus
          </Label>

          <Leader d={`M${CX + 20} 306 L392 306`} />
          <Label x={396} y={310}>
            stipe
          </Label>

          <Leader d={`M${CX + 46} 396 L392 380`} />
          <Label x={396} y={376}>
            bulb with
          </Label>
          <Label x={396} y={388}>
            volval rings
          </Label>

          <Label x={78} y={444} anchor="middle">
            button stage
          </Label>

          {/* scale bar: 46 units = 2 cm, so the drawn cap (232 units) is ~10 cm across */}
          <path d="M396 444 h46 M396 440 v8 M442 440 v8 M419 442 v4" className="plate-leader" fill="none" />
          <Label x={419} y={460} anchor="middle">
            2 cm
          </Label>
        </g>
      )}

      {caption && (
        <g>
          <path d="M20 470 H480" className="plate-rule" />
          <text x="20" y="490" className="plate-caption">
            <tspan className="plate-caption-plate">Pl. I</tspan>
            <tspan dx="10" className="plate-caption-name">
              Amanita muscaria
            </tspan>
            <tspan dx="6" className="plate-caption-auth">
              (L.) Lam.
            </tspan>
          </text>
          <text x="480" y="490" textAnchor="end" className="plate-label plate-label--warn">
            fly agaric · toxic
          </text>
        </g>
      )}
    </svg>
  );
};

export default MushroomPlate;
