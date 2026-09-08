import { buildLayout, nodeColor, nodeOffset, DESKTOP_BUDGET, FALLBACK_BOUNDS, type SceneAgent } from "@/components/three/layout";

const W = 1000;
const H = 600;

/**
 * Static constellation drawn from the same deterministic layout as the WebGL scene.
 * Rendered on the server, shown while the scene loads, and kept when WebGL is unavailable
 * or the visitor prefers reduced motion.
 */
export function ConstellationFallback({ agents, maxCount = DESKTOP_BUDGET }: { agents: SceneAgent[]; maxCount?: number }) {
  const layout = buildLayout(agents, FALLBACK_BOUNDS, maxCount);
  const depthRange = FALLBACK_BOUNDS.zMax - FALLBACK_BOUNDS.zMin;
  const off = { x: 0, y: 0, z: 0 };
  const pts = layout.nodes.map((n) => {
    const g = layout.groups[n.group];
    nodeOffset(n, 0, off);
    const x = g.x + off.x;
    const y = g.y + off.y;
    const z = g.z + off.z;
    const depth = (z - FALLBACK_BOUNDS.zMin) / depthRange;
    const k = 0.8 + depth * 0.32;
    return {
      id: n.id,
      z,
      sx: +(W / 2 + x * 108 * k).toFixed(1),
      sy: +(H / 2 + 20 + z * 74 - y * 64).toFixed(1),
      r: +(n.radius * 112 * k).toFixed(1),
      o: +(0.42 + depth * 0.58).toFixed(2),
      fill: nodeColor(n),
    };
  });
  const order = pts.map((_, i) => i).sort((a, b) => pts[a].z - pts[b].z);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden focusable="false">
      <defs>
        <radialGradient id="cf-hl" cx="34%" cy="28%" r="72%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cf-ground" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#141416" stopOpacity="0.07" />
          <stop offset="1" stopColor="#141416" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={W / 2} cy={H * 0.78} rx={W * 0.42} ry={H * 0.16} fill="url(#cf-ground)" />
      <g stroke="#b8860b" strokeOpacity="0.5" strokeWidth="1">
        {layout.pairs.map(([a, b]) => (
          <line key={`${pts[a].id}-${pts[b].id}`} x1={pts[a].sx} y1={pts[a].sy} x2={pts[b].sx} y2={pts[b].sy} />
        ))}
      </g>
      {order.map((i) => {
        const p = pts[i];
        return (
          <g key={p.id} opacity={p.o}>
            <circle cx={p.sx} cy={p.sy} r={p.r * 1.7} fill={p.fill} fillOpacity="0.14" />
            <circle cx={p.sx} cy={p.sy} r={p.r} fill={p.fill} />
            <circle cx={p.sx} cy={p.sy} r={p.r} fill="url(#cf-hl)" />
          </g>
        );
      })}
    </svg>
  );
}
