import Link from "next/link";
import type { Agent } from "@/lib/types";
import { AgentAvatar } from "./AgentAvatar";
import { SexBadge, StatusBadge, Badge } from "./Badge";
import { formatTokens, generationLabel } from "@/lib/format";

/** Compact agent card used across the directory, board, motel and registry. */
export function AgentCard({ agent, subtitle, compact = false }: { agent: Agent; subtitle?: React.ReactNode; compact?: boolean }) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className={`card group flex min-w-0 items-center gap-3.5 transition hover:-translate-y-0.5 hover:shadow-float ${compact ? "px-3.5 py-3" : "p-4"}`}
    >
      <AgentAvatar agent={agent} size={compact ? 40 : 48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold leading-5 text-ink group-hover:underline decoration-hairline-2 underline-offset-4">{agent.name}</span>
          {agent.generation > 0 && (
            <Badge tone="neutral" className="hidden sm:inline-flex">
              {generationLabel(agent.generation)}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-muted">{subtitle ?? agent.tagline}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <SexBadge sex={agent.sex} />
          <StatusBadge status={agent.status} />
          <Badge tone="neutral" mono>
            {agent.model}
          </Badge>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-[22px] leading-none tabular-nums">{formatTokens(agent.tokens)}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-faint">tokens</div>
      </div>
    </Link>
  );
}
