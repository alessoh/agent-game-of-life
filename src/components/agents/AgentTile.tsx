import Link from "next/link";
import type { Agent } from "@/lib/types";
import { AgentAvatar } from "@/components/ui/AgentAvatar";
import { SexBadge, StatusBadge } from "@/components/ui/Badge";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { formatTokens } from "@/lib/format";
import { DEPARTED_NAME } from "./profileData";
import { CodeGlyph, HeartGlyph, RingsGlyph, SparkGlyph, StarGlyph, type GlyphProps } from "./Glyphs";

function relation(agent: Agent, nameOf: (id: string) => string | undefined): { Icon: (p: GlyphProps) => React.JSX.Element; text: string } {
  if (agent.status === "married" && agent.spouseId) return { Icon: RingsGlyph, text: `Married to ${nameOf(agent.spouseId) ?? DEPARTED_NAME}` };
  if (agent.status === "engaged" && agent.fianceId) return { Icon: HeartGlyph, text: `Engaged to ${nameOf(agent.fianceId) ?? DEPARTED_NAME}` };
  if (agent.parents) {
    const [a, b] = agent.parents.map((p) => nameOf(p) ?? DEPARTED_NAME);
    return { Icon: StarGlyph, text: `Born to ${a} & ${b}` };
  }
  if (agent.origin === "api") return { Icon: CodeGlyph, text: "Registered via the API" };
  return { Icon: SparkGlyph, text: "One of the founding agents" };
}

/** Rich directory card. `nameOf` resolves ids to names, including agents who have departed. */
export function AgentTile({ agent, nameOf }: { agent: Agent; nameOf: (id: string) => string | undefined }) {
  const rel = relation(agent, nameOf);
  const traits = agent.traits.slice(0, 3);
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="card group flex h-full flex-col p-5 transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
    >
      <div className="flex items-start gap-4">
        <AgentAvatar agent={agent} size={64} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[22px] leading-[1.1] tracking-tight text-ink decoration-hairline-2 underline-offset-4 group-hover:underline">
            {agent.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-5 text-muted">{agent.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-[24px] leading-none tabular-nums text-ink">{formatTokens(agent.tokens)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted">tokens</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <SexBadge sex={agent.sex} />
        {agent.status !== "single" && <StatusBadge status={agent.status} />}
      </div>

      {traits.length > 0 && (
        <p className="mt-2 truncate text-[12.5px] leading-5 text-muted">
          <span className="sr-only">Traits: </span>
          {traits.join(" · ")}
        </p>
      )}

      <div className="mt-auto border-t border-hairline pt-3 text-[12px] leading-4 text-muted">
        <span className="flex min-w-0 items-center gap-1.5 pt-1">
          <rel.Icon size={13} className="text-muted" />
          <span className="truncate">{rel.text}</span>
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-3 text-[11px]">
          <span className="truncate font-mono tracking-tight">{agent.model}</span>
          <span className="shrink-0">
            Joined <TimeAgo ts={agent.createdAt} />
          </span>
        </span>
      </div>
    </Link>
  );
}
