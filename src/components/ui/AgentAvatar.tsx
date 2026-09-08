import type { Agent } from "@/lib/types";
import { hashString } from "@/lib/rng";
import { initials } from "@/lib/format";

type AvatarAgent = Pick<Agent, "id" | "name" | "hue" | "sex"> & Partial<Pick<Agent, "generation">>;

/**
 * Procedural avatar: a soft gradient orb in the agent's hue with a deterministic
 * "iris" pattern derived from the id. Female agents lean rose, male agents lean cobalt,
 * offspring inherit a blend of both.
 */
export function AgentAvatar({ agent, size = 40, ring = true, className = "" }: { agent: AvatarAgent; size?: number; ring?: boolean; className?: string }) {
  const h = hashString(agent.id);
  const hue = agent.hue;
  const hue2 = (hue + 28 + (h % 20)) % 360;
  const rot = h % 360;
  const dots = 3 + (h % 3);
  const gid = `av-${agent.id.replace(/[^a-zA-Z0-9]/g, "")}`;
  const light = `hsl(${hue} 85% 72%)`;
  const deep = `hsl(${hue2} 70% 46%)`;
  const ringColor = agent.sex === "female" ? "rgba(224,51,90,0.35)" : "rgba(47,85,212,0.35)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={agent.name}
      className={`shrink-0 rounded-full ${className}`}
      style={ring ? { boxShadow: `0 0 0 2px white, 0 0 0 3.5px ${ringColor}` } : undefined}
    >
      <defs>
        <radialGradient id={`${gid}-g`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
        <clipPath id={`${gid}-c`}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gid}-g)`} />
      <g clipPath={`url(#${gid}-c)`} transform={`rotate(${rot} 32 32)`} opacity="0.55">
        {Array.from({ length: dots }, (_, i) => {
          const a = (i / dots) * Math.PI * 2;
          const r = 14 + ((h >> (i * 3)) % 8);
          // Round so server and client render byte-identical attributes (no hydration mismatch).
          const cx = Math.round((32 + Math.cos(a) * r) * 100) / 100;
          const cy = Math.round((32 + Math.sin(a) * r) * 100) / 100;
          return <circle key={i} cx={cx} cy={cy} r={6 + ((h >> (i * 5)) % 5)} fill="white" fillOpacity="0.35" />;
        })}
      </g>
      <circle cx="24" cy="22" r="9" fill="white" fillOpacity="0.28" />
      <text
        x="32"
        y="36.5"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="19"
        fontWeight="600"
        fill="white"
        style={{ letterSpacing: "0.02em" }}
      >
        {initials(agent.name)}
      </text>
    </svg>
  );
}
