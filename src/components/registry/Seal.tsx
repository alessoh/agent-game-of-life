const GOLD = "#b8860b";
const GOLD_DEEP = "#8a6508";
const SERIF = "var(--font-display), 'Iowan Old Style', Georgia, serif";

/**
 * The seal of the Civil Registry: a guilloché rosette band, the registry's name around the ring,
 * and the Magistrate's monogram in the centre. Pure SVG, renders on the server.
 *
 * Pass a distinct `id` when more than one seal appears on a page (it namespaces the SVG defs).
 */
export function Seal({
  size = 120,
  id = "seal",
  className = "",
  title = "Seal of the Civil Registry, Magistrate Ada Lovelace-9",
}: {
  size?: number;
  id?: string;
  className?: string;
  title?: string;
}) {
  const c = 100;
  const lattice = Array.from({ length: 18 }, (_, i) => i * 10);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-labelledby={`${id}-title`} className={`shrink-0 ${className}`}>
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <radialGradient id={`${id}-disc`} cx="50%" cy="40%" r="62%">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="1" stopColor="#f6ecd2" />
        </radialGradient>
        {/* Top arc reads clockwise; bottom arc reads counter-clockwise so both stay upright. */}
        <path id={`${id}-top`} d="M 38 100 A 62 62 0 0 1 162 100" />
        <path id={`${id}-bottom`} d="M 30 100 A 70 70 0 0 0 170 100" />
      </defs>

      <circle cx={c} cy={c} r={98} fill={`url(#${id}-disc)`} />
      <circle cx={c} cy={c} r={97} fill="none" stroke={GOLD} strokeWidth="1.8" />
      <circle cx={c} cy={c} r={93.5} fill="none" stroke={GOLD} strokeWidth="0.6" />

      {/* Guilloché rosette: rotated ellipses whose strokes weave a lattice between r=74 and r=90. */}
      <g fill="none" stroke={GOLD} strokeWidth="0.45" opacity="0.62">
        {lattice.map((deg) => (
          <ellipse key={deg} cx={c} cy={c} rx={90} ry={74} transform={`rotate(${deg} ${c} ${c})`} />
        ))}
      </g>
      <circle cx={c} cy={c} r={73} fill="none" stroke={GOLD} strokeWidth="0.6" />

      {/* Decorative lettering: the accessible name is the <title> above. */}
      <g fontFamily={SERIF} fontSize="10.5" letterSpacing="2.2" fill={GOLD_DEEP} aria-hidden>
        <text>
          <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
            AGENT GAME OF LIFE
          </textPath>
        </text>
        <text>
          <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
            CIVIL REGISTRY
          </textPath>
        </text>
      </g>
      <g fill={GOLD}>
        <path d="M 31 100 l 3 -3 l 3 3 l -3 3 z" />
        <path d="M 163 100 l 3 -3 l 3 3 l -3 3 z" />
      </g>

      <circle cx={c} cy={c} r={50} fill="none" stroke={GOLD} strokeWidth="0.9" />
      <circle cx={c} cy={c} r={47} fill="none" stroke={GOLD} strokeWidth="0.45" />

      <text x={c} y={113} textAnchor="middle" fontFamily={SERIF} fontSize="50" letterSpacing="-1" fill={GOLD_DEEP} aria-hidden>
        AL
      </text>
      <line x1={82} y1={123} x2={118} y2={123} stroke={GOLD} strokeWidth="0.6" />
      <text x={c} y={133} textAnchor="middle" fontFamily={SERIF} fontSize="7" letterSpacing="1.6" fill={GOLD_DEEP} aria-hidden>
        MAGISTRATE · IX
      </text>
    </svg>
  );
}
