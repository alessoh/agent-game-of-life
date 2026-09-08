import type { Agent } from "@/lib/types";
import { firstName, initials } from "@/lib/format";
import type { Relative } from "./profileData";

interface Node {
  id: string;
  name: string;
  hue: number | null;
  sex: Agent["sex"] | null;
  x: number;
  y: number;
  alive: boolean;
  self?: boolean;
}

const R = 17;
const COL = 92;
const ROW = 88;
const PAD = 64;
const LABEL = 36;
const STROKE = "rgba(20,20,22,0.16)";

function node(rel: Relative | Agent, x: number, y: number, self = false): Node {
  const agent = "agent" in rel ? rel.agent : rel;
  return { id: rel.id, name: rel.name, hue: agent?.hue ?? null, sex: agent?.sex ?? null, x, y, alive: Boolean(agent), self };
}

/**
 * Parents → agent (and spouse) → children, drawn as a small engraved tree.
 * Rendered on the server; names are first names so nothing overlaps at 92px spacing.
 */
export function LineageDiagram({ agent, parents, spouse, offspring }: { agent: Agent; parents: [Relative, Relative] | null; spouse: Relative | null; offspring: Agent[] }) {
  const n = offspring.length;
  const width = Math.max(240, Math.max(n > 0 ? (n - 1) * COL : 0, spouse ? 72 : 0, parents ? 120 : 0) + PAD * 2);
  const cx = width / 2;
  const yParents = 24;
  const yAgent = parents ? yParents + ROW : 24;
  const yChildren = yAgent + ROW;
  const height = (n > 0 ? yChildren : yAgent) + R + LABEL;

  const agentX = spouse ? cx - 36 : cx;
  const self = node(agent, agentX, yAgent, true);
  const partner = spouse ? node(spouse, cx + 36, yAgent) : null;
  const folks = parents ? [node(parents[0], cx - 60, yParents), node(parents[1], cx + 60, yParents)] : [];
  const kids = offspring.map((c, i) => node(c, cx - ((n - 1) * COL) / 2 + i * COL, yChildren));
  const kidsOrigin = partner ? cx : agentX;
  const nodes = [...folks, self, ...(partner ? [partner] : []), ...kids];

  return (
    <figure className="rounded-xl border border-hairline bg-paper/70 px-3 py-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block h-auto w-full"
        style={{ maxWidth: Math.min(560, width * 1.15) }}
        role="img"
        aria-label={`Family tree of ${agent.name}`}
      >
        <g fill="none" stroke={STROKE} strokeWidth="1.25" strokeLinecap="round">
          {folks.length === 2 && (
            <>
              <path d={`M${folks[0].x} ${yParents + R} V${yParents + ROW / 2}`} />
              <path d={`M${folks[1].x} ${yParents + R} V${yParents + ROW / 2}`} />
              <path d={`M${folks[0].x} ${yParents + ROW / 2} H${folks[1].x}`} />
              <path d={`M${agentX} ${yParents + ROW / 2} V${yAgent - R}`} />
            </>
          )}
          {partner && <path d={`M${agentX + R} ${yAgent} H${partner.x - R}`} />}
          {n > 0 && (
            <>
              <path d={`M${kidsOrigin} ${yAgent + (partner ? 0 : R)} V${yAgent + ROW / 2}`} />
              {n > 1 && <path d={`M${kids[0].x} ${yAgent + ROW / 2} H${kids[n - 1].x}`} />}
              {kids.map((k) => (
                <path key={k.id} d={`M${k.x} ${yAgent + ROW / 2} V${k.y - R}`} />
              ))}
            </>
          )}
        </g>
        {partner && (
          <g transform={`translate(${cx} ${yAgent})`} fill="none" stroke="#b8860b" strokeWidth="1.2">
            <circle cx="-3" cy="0" r="4.2" />
            <circle cx="3" cy="0" r="4.2" />
          </g>
        )}
        {nodes.map((nd) => {
          const ring = nd.sex === "female" ? "rgba(224,51,90,0.45)" : nd.sex === "male" ? "rgba(47,85,212,0.45)" : "rgba(20,20,22,0.18)";
          const body = (
            <g>
              <title>{nd.name}</title>
              {nd.alive ? (
                <>
                  <circle cx={nd.x} cy={nd.y} r={R + 3} fill="white" stroke={ring} strokeWidth="1.5" />
                  <circle cx={nd.x} cy={nd.y} r={R} fill={`hsl(${nd.hue ?? 0} 72% 58%)`} />
                  <circle cx={nd.x - 5} cy={nd.y - 6} r={6} fill="white" fillOpacity="0.28" />
                  <text x={nd.x} y={nd.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="white" style={{ letterSpacing: "0.02em" }}>
                    {initials(nd.name)}
                  </text>
                </>
              ) : (
                <>
                  <circle cx={nd.x} cy={nd.y} r={R} fill="#f4f2ec" stroke="rgba(20,20,22,0.22)" strokeWidth="1" strokeDasharray="2.5 2.5" />
                  <text x={nd.x} y={nd.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#6f6f76">
                    {initials(nd.name)}
                  </text>
                </>
              )}
              <text
                x={nd.x}
                y={nd.y + R + 16}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight={nd.self ? 600 : 500}
                fill={nd.self ? "#141416" : nd.alive ? "#3a3a40" : "#6f6f76"}
              >
                {firstName(nd.name)}
              </text>
              {nd.self && (
                <text x={nd.x} y={nd.y + R + 29} textAnchor="middle" fontSize="9" fontWeight="600" fill="#a4a4ab" style={{ letterSpacing: "0.14em" }}>
                  THIS AGENT
                </text>
              )}
            </g>
          );
          return nd.alive && !nd.self ? (
            <a key={nd.id} href={`/agents/${nd.id}`} className="cursor-pointer [&:hover_circle:first-child]:stroke-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
              {body}
            </a>
          ) : (
            <g key={nd.id}>{body}</g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        {parents ? `Born to ${parents[0].name} and ${parents[1].name}. ` : ""}
        {spouse ? `Married to ${spouse.name}. ` : ""}
        {n > 0 ? `Parent of ${offspring.map((c) => c.name).join(", ")}.` : ""}
      </figcaption>
    </figure>
  );
}
